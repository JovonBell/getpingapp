import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, Alert, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as ExpoLinking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import { verifyMagicLinkToken } from './utils/storage/supabaseStorage';

// Screens - Auth
import WelcomeScreen from './screens/onboarding/WelcomeScreen';
import CreateAccountScreen from './screens/onboarding/CreateAccountScreen';
import EmailAuthScreen from './screens/onboarding/EmailAuthScreen';
import MagicLinkSentScreen from './screens/onboarding/MagicLinkSentScreen';

// Lazy load NFCRingScreen — native NFC module crashes in Expo Go at import time
const NFCRingScreen = React.lazy(() =>
  import('./screens/main/NFCRingScreen').then(
    (mod) => mod,
    () => ({ default: () => { throw new Error('NFC not available'); } })
  )
);

// Error boundary for NFC tab — native module not available in Expo Go
class NFCErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: 'rgba(79, 255, 176, 0.06)',
            borderWidth: 1, borderColor: 'rgba(79, 255, 176, 0.12)',
            alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <Ionicons name="radio-outline" size={36} color="#4FFFB0" />
          </View>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>NFC Ring</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 }}>
            NFC requires a development build.{'\n'}Use "eas build" to create one, or test on a physical device.
          </Text>
          <View style={{
            marginTop: 24, paddingHorizontal: 20, paddingVertical: 10,
            borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Running in Expo Go</Text>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

// Guided onboarding tour
import GuidedTour from './screens/onboarding/GuidedTour';

// Screens - Main
import ProfileScreen from './screens/settings/ProfileScreen';
import ProfileEditScreen from './screens/settings/ProfileEditScreen';
import SettingsScreen from './screens/settings/SettingsScreen';
import AboutScreen from './screens/settings/AboutScreen';
import AccountDeletionScreen from './screens/settings/AccountDeletionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator — 3 tabs: Card, Ring, Settings
function MainTabs({ navigation }) {
  const { theme } = useTheme();

  const handleSwitchTab = (tabName) => {
    navigation.navigate('Home', { screen: tabName });
  };

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 10, 15, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.04)',
          paddingBottom: 30,
          paddingTop: 10,
          height: 88,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.25)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name="CardTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'card',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RingTab"
        options={{
          tabBarLabel: 'ring',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => (
          <NFCErrorBoundary>
            <React.Suspense fallback={<View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0A0A0F'}}><ActivityIndicator size="large" color="#4FFFB0" /></View>}>
              <NFCRingScreen {...props} />
            </React.Suspense>
          </NFCErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    <GuidedTour onSwitchTab={handleSwitchTab} />
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigationRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        // Validate session by calling getUser() - this will detect invalid refresh tokens
        if (data?.session) {
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
              const errorMsg = userError.message || '';
              if (errorMsg.includes('Refresh Token') || errorMsg.includes('refresh_token') ||
                  errorMsg.includes('Invalid token') || errorMsg.includes('JWT')) {
                console.error('[APP] Invalid session detected on startup - signing out');
                await supabase.auth.signOut();
                if (mounted) {
                  setSession(null);
                }
                return;
              }
            }
          } catch (validateErr) {
            console.warn('[APP] Session validation error:', validateErr?.message);
          }
        }

        setSession(data?.session ?? null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Handle deep links for magic link authentication
  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;

      try {
        const parsed = ExpoLinking.parse(url);
        console.log('[App] Deep link received:', parsed);

        if (parsed.path === 'auth/callback' && parsed.queryParams?.token_hash) {
          console.log('[App] Processing magic link...');
          const result = await verifyMagicLinkToken(parsed.queryParams.token_hash);

          if (result.success) {
            console.log('[App] Magic link verified successfully');
          } else {
            Alert.alert(
              'Sign In Failed',
              result.error || 'The magic link may have expired. Please try again.',
              [{ text: 'OK' }]
            );
          }
        }

        if (parsed.path === 'auth/reset-password' && parsed.queryParams?.token_hash) {
          console.log('[App] Password reset link received');
          Alert.alert(
            'Password Reset',
            'Password reset is not yet implemented in the app. Please use the web version.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.error('[App] Deep link handling error:', err);
      }
    };

    ExpoLinking.getInitialURL().then(handleDeepLink);

    const subscription = ExpoLinking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        {authLoading ? (
          <View style={{ flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#4FFFB0" />
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 16, letterSpacing: 1 }}>ping!</Text>
          </View>
        ) : (
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={session ? "Home" : "Welcome"}
          >
            {!session ? (
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
                <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
                <Stack.Screen name="MagicLinkSent" component={MagicLinkSentScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={MainTabs} />
                <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
                <Stack.Screen name="About" component={AboutScreen} />
                <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
              </>
            )}
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
}
