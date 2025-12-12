import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { supabase } from './lib/supabase';
import { registerForPushNotificationsAsync } from './utils/pushNotifications';
import WelcomeScreen from './screens/WelcomeScreen';
import CreateAccountScreen from './screens/CreateAccountScreen';
import WelcomeIntroScreen from './screens/WelcomeIntroScreen';
import CirclesExplainerScreen from './screens/CirclesExplainerScreen';
import BuildUniverseScreen from './screens/BuildUniverseScreen';
import ImportContactsScreen from './screens/ImportContactsScreen';
import SelectContactsScreen from './screens/SelectContactsScreen';
import VisualizeCircleScreen from './screens/VisualizeCircleScreen';
import ImportConfirmationScreen from './screens/ImportConfirmationScreen';
import FirstCircleCelebrationScreen from './screens/FirstCircleCelebrationScreen';
import HomeScreen from './screens/HomeScreen';
import AddContactScreen from './screens/AddContactScreen';
import AlertsScreen from './screens/AlertsScreen';
import ContactsListScreen from './screens/ContactsListScreen';
import SettingsScreen from './screens/SettingsScreen';
import MessagesScreen from './screens/MessagesScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProfileEditScreen from './screens/ProfileEditScreen';
import ProfileSettingsScreen from './screens/ProfileSettingsScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import NotificationsSettingsScreen from './screens/NotificationsSettingsScreen';
import LanguageSettingsScreen from './screens/LanguageSettingsScreen';
import ThemeSettingsScreen from './screens/ThemeSettingsScreen';
import HelpCenterScreen from './screens/HelpCenterScreen';
import ContactUsScreen from './screens/ContactUsScreen';
import AboutScreen from './screens/AboutScreen';
import AccountDeletionScreen from './screens/AccountDeletionScreen';
import DiagnosticsScreen from './screens/DiagnosticsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app screens
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
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'circles',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: size * 0.9, height: size * 0.9, borderRadius: size * 0.45, borderWidth: 1.5, borderColor: color }} />
              <View style={{ position: 'absolute', width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, borderWidth: 1.5, borderColor: color }} />
              <View style={{ position: 'absolute', width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, borderWidth: 1.5, borderColor: color }} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsScreen}
        options={{
          tabBarLabel: 'pings!',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ContactsTab"
        component={ContactsListScreen}
        options={{
          tabBarLabel: 'contacts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data?.session ?? null);

        // Check if user has completed onboarding by checking if they have a profile
        if (data?.session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', data.session.user.id)
            .single();
          
          if (mounted) setHasCompletedOnboarding(!!profile);
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession ?? null);
      
      // Check onboarding status when auth state changes
      if (nextSession?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', nextSession.user.id)
          .single();
        
        setHasCompletedOnboarding(!!profile);
      } else {
        setHasCompletedOnboarding(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    // Best-effort push registration (requires device + permissions + device_tokens table migration)
    registerForPushNotificationsAsync(userId).catch(() => {});
  }, [session?.user?.id]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <NavigationContainer>
          {authLoading ? (
            <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#4FFFB0" />
            </View>
          ) : (
            <Stack.Navigator 
              screenOptions={{ headerShown: false }}
              initialRouteName={session ? (hasCompletedOnboarding ? "Home" : "WelcomeIntro") : "Welcome"}
            >
              {!session ? (
                <>
                  <Stack.Screen name="Welcome" component={WelcomeScreen} />
                  <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
                </>
              ) : (
                <>
                  {/* Onboarding screens - only shown for new users */}
                  <Stack.Screen
                    name="WelcomeIntro"
                    component={WelcomeIntroScreen}
                    options={{ animation: 'fade' }}
                  />
                  <Stack.Screen
                    name="CirclesExplainer"
                    component={CirclesExplainerScreen}
                    options={{ animation: 'fade' }}
                  />
                  <Stack.Screen
                    name="BuildUniverse"
                    component={BuildUniverseScreen}
                    options={{ animation: 'fade' }}
                  />
                  <Stack.Screen
                    name="ImportContacts"
                    component={ImportContactsScreen}
                    options={{ animation: 'fade' }}
                  />
                  <Stack.Screen name="SelectContacts" component={SelectContactsScreen} />
                  <Stack.Screen name="ImportConfirmation" component={ImportConfirmationScreen} />
                  <Stack.Screen name="VisualizeCircle" component={VisualizeCircleScreen} />
                  <Stack.Screen name="FirstCircleCelebration" component={FirstCircleCelebrationScreen} />
                  
                  {/* Main app screens */}
                  <Stack.Screen name="Home" component={MainTabs} />
                  <Stack.Screen name="AddContact" component={AddContactScreen} />
                  <Stack.Screen name="Profile" component={ProfileScreen} />
                  <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
                  <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
                  <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
                  <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
                  <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
                  <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
                  <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
                  <Stack.Screen name="ContactUs" component={ContactUsScreen} />
                  <Stack.Screen name="About" component={AboutScreen} />
                  <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
                  <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} />
                  <Stack.Screen name="Messages" component={MessagesScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                </>
              )}
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </LanguageProvider>
    </ThemeProvider>
  );
}
