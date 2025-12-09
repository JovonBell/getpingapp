import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import WelcomeScreen from './screens/WelcomeScreen';
import CreateAccountScreen from './screens/CreateAccountScreen';
import ImportContactsScreen from './screens/ImportContactsScreen';
import SelectContactsScreen from './screens/SelectContactsScreen';
import VisualizeCircleScreen from './screens/VisualizeCircleScreen';
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
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
            <Stack.Screen name="ImportContacts" component={ImportContactsScreen} />
            <Stack.Screen name="SelectContacts" component={SelectContactsScreen} />
            <Stack.Screen name="VisualizeCircle" component={VisualizeCircleScreen} />
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
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Home" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </ThemeProvider>
  );
}
