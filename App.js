import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CelebrationProvider } from './contexts/CelebrationContext';
import { supabase } from './lib/supabase';
import {
  registerForPushNotificationsAsync,
  scheduleDailyDigest,
  scheduleStreakWarning,
} from './utils/pushNotifications';
import { getUnreadAlertCount } from './utils/alertsStorage';
import { getStreak, isStreakActive } from './utils/streaksStorage';
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
import DashboardScreen from './screens/DashboardScreen';
import RemindersScreen from './screens/RemindersScreen';
import GamificationScreen from './screens/GamificationScreen';
import AchievementsScreen from './screens/AchievementsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app screens
function MainTabs() {
  const { theme } = useTheme();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Load unread alert count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { success, count } = await getUnreadAlertCount(session.user.id);
          if (success) setUnreadAlerts(count);
        }
      } catch (err) {
        console.warn('[MainTabs] Error loading unread alerts:', err);
      }
    };

    loadUnreadCount();

    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
            <View>
              <Ionicons name="alert-circle-outline" size={size} color={color} />
              {unreadAlerts > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  backgroundColor: '#FF6B6B',
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadAlerts > 99 ? '99+' : unreadAlerts}
                  </Text>
                </View>
              )}
            </View>
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
  const navigationRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

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

  // Set up notification listeners
  useEffect(() => {
    // Listener for when a notification is received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[App] Notification received:', notification.request.content.title);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[App] Notification tapped:', data);

      // Navigate based on notification type
      if (navigationRef.current) {
        switch (data.type) {
          case 'reminder':
            navigationRef.current.navigate('Reminders');
            break;
          case 'birthday':
          case 'daily_digest':
            navigationRef.current.navigate('Home', { screen: 'AlertsTab' });
            break;
          case 'achievement':
            navigationRef.current.navigate('Achievements');
            break;
          case 'streak_warning':
            navigationRef.current.navigate('Gamification');
            break;
          default:
            navigationRef.current.navigate('Home');
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Schedule daily digest and check streak warnings
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const setupNotifications = async () => {
      try {
        // Schedule daily digest at 9am
        await scheduleDailyDigest(9, 0);

        // Check if streak is at risk and schedule warning
        const { success, streak } = await getStreak(userId);
        if (success && streak?.currentStreak > 0) {
          const today = new Date().toISOString().split('T')[0];
          // If not active today, schedule a warning
          if (streak.lastActivityDate !== today && isStreakActive(streak.lastActivityDate)) {
            await scheduleStreakWarning(streak.currentStreak);
          }
        }
      } catch (err) {
        console.warn('[App] Failed to setup notifications:', err);
      }
    };

    setupNotifications();
  }, [session?.user?.id]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <CelebrationProvider>
        <NavigationContainer ref={navigationRef}>
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
                  <Stack.Screen name="Dashboard" component={DashboardScreen} />
                  <Stack.Screen name="Reminders" component={RemindersScreen} />
                  <Stack.Screen name="Gamification" component={GamificationScreen} />
                  <Stack.Screen name="Achievements" component={AchievementsScreen} />
                  <Stack.Screen name="Messages" component={MessagesScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                </>
              )}
            </Stack.Navigator>
          )}
        </NavigationContainer>
        </CelebrationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
