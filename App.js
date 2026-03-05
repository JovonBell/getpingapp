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

// Lazy load NFCRingScreen to avoid loading react-native-nfc-manager in Expo Go
const NFCRingScreen = React.lazy(() => import('./screens/main/NFCRingScreen'));

// Error boundary for NFC tab — native module not available in Expo Go
class NFCErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <Ionicons name="radio-outline" size={64} color="#4FFFB0" />
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 20 }}>NFC Ring</Text>
          <Text style={{ color: '#999', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 }}>
            NFC requires a development build.{'\n'}Use "eas build" to create one, or test on a physical device.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Screens - Main
import ProfileScreen from './screens/settings/ProfileScreen';
import ProfileEditScreen from './screens/settings/ProfileEditScreen';
import SettingsScreen from './screens/settings/SettingsScreen';
import AboutScreen from './screens/settings/AboutScreen';
import AccountDeletionScreen from './screens/settings/AccountDeletionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator — 3 tabs: Card, Ring, Settings
function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 1,
          borderTopColor: '#2a3a2a',
          paddingBottom: 30,
          paddingTop: 12,
          height: 90,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
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
            <React.Suspense fallback={<View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'}}><ActivityIndicator size="large" color="#4FFFB0" /></View>}>
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
          <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#4FFFB0" />
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
