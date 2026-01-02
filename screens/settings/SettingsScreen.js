import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { signOut } from '../../utils/storage/supabaseStorage';
import { getCurrentUser } from '../../utils/storage/supabaseStorage';
import { getUnreadMessageCount } from '../../utils/storage/messagesStorage';
import {
  isSoundEnabled,
  setSoundEnabled,
  getSoundVolume,
  setSoundVolume,
} from '../../utils/soundManager';
import {
  isMusicEnabled,
  setMusicEnabled,
  getMusicVolume,
  setMusicVolume,
} from '../../utils/musicManager';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Profile', action: 'profile' },
      { icon: 'lock-closed-outline', label: 'Privacy', action: 'privacy' },
      { icon: 'notifications-outline', label: 'Notifications', action: 'notifications' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'moon-outline', label: 'Dark Mode', action: 'darkmode', toggle: true },
      { icon: 'globe-outline', label: 'Language', action: 'language' },
      { icon: 'color-palette-outline', label: 'Theme', action: 'theme' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', action: 'help' },
      { icon: 'mail-outline', label: 'Contact Us', action: 'contact' },
      { icon: 'information-circle-outline', label: 'About', action: 'about' },
    ],
  },
];

export default function SettingsScreen({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [soundVol, setSoundVol] = useState(0.5);
  const [musicVol, setMusicVol] = useState(0.25);

  // Load audio settings
  useEffect(() => {
    setSoundOn(isSoundEnabled());
    setMusicOn(isMusicEnabled());
    setSoundVol(getSoundVolume());
    setMusicVol(getMusicVolume());
  }, []);

  const handleSoundToggle = (value) => {
    setSoundOn(value);
    setSoundEnabled(value);
  };

  const handleMusicToggle = (value) => {
    setMusicOn(value);
    setMusicEnabled(value);
  };

  const handleSoundVolumeChange = (value) => {
    setSoundVol(value);
    setSoundVolume(value);
  };

  const handleMusicVolumeChange = (value) => {
    setMusicVol(value);
    setMusicVolume(value);
  };

  const handleLogout = async () => {
    const res = await signOut();
    if (!res.success) {
      Alert.alert('Logout failed', res.error || 'Please try again.');
    }
    // On success: App.js auth gate will switch stacks automatically.
  };

  React.useEffect(() => {
    const loadUnread = async () => {
      const { success, user } = await getCurrentUser();
      if (!success || !user) return;
      const res = await getUnreadMessageCount(user.id);
      if (res.success) setUnreadCount(res.count);
    };
    loadUnread();
    const unsub = navigation.addListener('focus', loadUnread);
    return unsub;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
            {unreadCount > 0 && (
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sound & Music Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sound & Music</Text>

            {/* Sound Effects Toggle */}
            <View style={styles.audioRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high-outline" size={24} color="#4FFFB0" />
                <Text style={styles.settingLabel}>Sound Effects</Text>
              </View>
              <Switch
                value={soundOn}
                onValueChange={handleSoundToggle}
                trackColor={{ false: '#333', true: '#2a6a4a' }}
                thumbColor={soundOn ? '#4FFFB0' : '#666'}
              />
            </View>

            {/* Sound Volume Slider */}
            {soundOn && (
              <View style={styles.volumeRow}>
                <Ionicons name="volume-low" size={18} color="#666" />
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={soundVol}
                  onSlidingComplete={handleSoundVolumeChange}
                  minimumTrackTintColor="#4FFFB0"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#4FFFB0"
                />
                <Ionicons name="volume-high" size={18} color="#666" />
              </View>
            )}

            {/* Background Music Toggle */}
            <View style={styles.audioRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="musical-notes-outline" size={24} color="#4FFFB0" />
                <Text style={styles.settingLabel}>Background Music</Text>
              </View>
              <Switch
                value={musicOn}
                onValueChange={handleMusicToggle}
                trackColor={{ false: '#333', true: '#2a6a4a' }}
                thumbColor={musicOn ? '#4FFFB0' : '#666'}
              />
            </View>

            {/* Music Volume Slider */}
            {musicOn && (
              <View style={styles.volumeRow}>
                <Ionicons name="volume-low" size={18} color="#666" />
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={musicVol}
                  onSlidingComplete={handleMusicVolumeChange}
                  minimumTrackTintColor="#4FFFB0"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#4FFFB0"
                />
                <Ionicons name="volume-high" size={18} color="#666" />
              </View>
            )}
          </View>

          {SETTINGS_SECTIONS.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.settingItem}
                  onPress={() => {
                    const navigationMap = {
                      'profile': 'ProfileSettings',
                      'privacy': 'PrivacySettings',
                      'notifications': 'NotificationsSettings',
                      'language': 'LanguageSettings',
                      'theme': 'ThemeSettings',
                      'help': 'HelpCenter',
                      'contact': 'ContactUs',
                      'about': 'About',
                    };
                    const screen = navigationMap[item.action];
                    if (screen) {
                      navigation.navigate(screen);
                    }
                  }}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name={item.icon} size={24} color="#4FFFB0" />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <TouchableOpacity 
            style={styles.diagnosticsButton} 
            onPress={() => navigation.navigate('Diagnostics')}
          >
            <Ionicons name="bug-outline" size={20} color="#4FFFB0" />
            <Text style={styles.diagnosticsText}>Database Diagnostics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  messageButton: {
    position: 'relative',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 16,
  },
  audioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(42, 58, 42, 0.3)',
    borderRadius: 8,
    marginBottom: 8,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 10,
    gap: 8,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4FFFB0',
  },
  diagnosticsText: {
    color: '#4FFFB0',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 10,
    marginBottom: 40,
    gap: 8,
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
});
