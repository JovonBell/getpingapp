import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  scheduleDailyDigest,
  cancelDailyDigest,
  cancelAllNotifications,
  getScheduledNotifications,
} from '../../utils/notifications/pushNotifications';

const NOTIFICATION_PREFS_KEY = '@notification_preferences';

const defaultPrefs = {
  pushEnabled: true,
  remindersEnabled: true,
  dailyDigestEnabled: true,
  dailyDigestHour: 9,
  birthdayRemindersEnabled: true,
  streakWarningsEnabled: true,
  achievementNotificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

export default function NotificationsSettingsScreen({ navigation }) {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadPreferences();
    loadScheduledCount();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        setPrefs({ ...defaultPrefs, ...JSON.parse(stored) });
      }
    } catch (err) {
      console.warn('[NotificationsSettings] Failed to load preferences:', err);
    }
  };

  const savePreferences = async (newPrefs) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPrefs));
      setPrefs(newPrefs);
    } catch (err) {
      console.warn('[NotificationsSettings] Failed to save preferences:', err);
    }
  };

  const loadScheduledCount = async () => {
    const { notifications } = await getScheduledNotifications();
    setScheduledCount(notifications?.length || 0);
  };

  const handlePrefChange = async (key, value) => {
    const newPrefs = { ...prefs, [key]: value };
    await savePreferences(newPrefs);

    // Handle specific toggles
    if (key === 'dailyDigestEnabled') {
      if (value) {
        await scheduleDailyDigest(prefs.dailyDigestHour, 0);
      } else {
        await cancelDailyDigest();
      }
      loadScheduledCount();
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            setScheduledCount(0);
            Alert.alert('Done', 'All scheduled notifications cleared.');
          },
        },
      ]
    );
  };

  const selectDigestTime = () => {
    Alert.alert(
      'Daily Digest Time',
      'When would you like to receive your daily check-in?',
      [
        { text: '7:00 AM', onPress: () => setDigestHour(7) },
        { text: '8:00 AM', onPress: () => setDigestHour(8) },
        { text: '9:00 AM (Default)', onPress: () => setDigestHour(9) },
        { text: '10:00 AM', onPress: () => setDigestHour(10) },
        { text: '12:00 PM', onPress: () => setDigestHour(12) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const setDigestHour = async (hour) => {
    const newPrefs = { ...prefs, dailyDigestHour: hour };
    await savePreferences(newPrefs);
    if (prefs.dailyDigestEnabled) {
      await scheduleDailyDigest(hour, 0);
    }
  };

  const formatDigestTime = (hour) => {
    if (hour === 12) return '12:00 PM';
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Scheduled Count */}
          <View style={styles.statsCard}>
            <Ionicons name="notifications" size={24} color="#4FFFB0" />
            <Text style={styles.statsText}>
              {scheduledCount} notification{scheduledCount !== 1 ? 's' : ''} scheduled
            </Text>
          </View>

          {/* Reminders Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminders</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="alarm-outline" size={24} color="#4FFFB0" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Reminder Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Get notified for scheduled reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.remindersEnabled}
                onValueChange={(v) => handlePrefChange('remindersEnabled', v)}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={prefs.remindersEnabled ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="gift-outline" size={24} color="#FF6B9D" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Birthday Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Get notified day before birthdays
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.birthdayRemindersEnabled}
                onValueChange={(v) => handlePrefChange('birthdayRemindersEnabled', v)}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={prefs.birthdayRemindersEnabled ? '#ffffff' : '#999'}
              />
            </View>
          </View>

          {/* Daily Check-in Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Check-in</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="sunny-outline" size={24} color="#FFD93D" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Daily Digest</Text>
                  <Text style={styles.settingDescription}>
                    Daily reminder to check on your contacts
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.dailyDigestEnabled}
                onValueChange={(v) => handlePrefChange('dailyDigestEnabled', v)}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={prefs.dailyDigestEnabled ? '#ffffff' : '#999'}
              />
            </View>

            {prefs.dailyDigestEnabled && (
              <TouchableOpacity style={styles.settingItem} onPress={selectDigestTime}>
                <View style={styles.settingLeft}>
                  <Ionicons name="time-outline" size={24} color="#4FFFB0" />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Digest Time</Text>
                    <Text style={styles.settingDescription}>
                      {formatDigestTime(prefs.dailyDigestHour)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Gamification Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gamification</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="flame-outline" size={24} color="#FF6B6B" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Streak Warnings</Text>
                  <Text style={styles.settingDescription}>
                    Alert when streak is at risk
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.streakWarningsEnabled}
                onValueChange={(v) => handlePrefChange('streakWarningsEnabled', v)}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={prefs.streakWarningsEnabled ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="trophy-outline" size={24} color="#FFD93D" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Achievements</Text>
                  <Text style={styles.settingDescription}>
                    Celebrate when you unlock achievements
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.achievementNotificationsEnabled}
                onValueChange={(v) => handlePrefChange('achievementNotificationsEnabled', v)}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={prefs.achievementNotificationsEnabled ? '#ffffff' : '#999'}
              />
            </View>
          </View>

          {/* Sound & Vibration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sound & Vibration</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high-outline" size={24} color="#4FFFB0" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Sound</Text>
                  <Text style={styles.settingDescription}>
                    Notification sounds
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.soundEnabled}
                onValueChange={(v) => handlePrefChange('soundEnabled', v)}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={prefs.soundEnabled ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="phone-portrait-outline" size={24} color="#4FFFB0" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Vibration</Text>
                  <Text style={styles.settingDescription}>
                    Vibrate on notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.vibrationEnabled}
                onValueChange={(v) => handlePrefChange('vibrationEnabled', v)}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={prefs.vibrationEnabled ? '#ffffff' : '#999'}
              />
            </View>
          </View>

          {/* Manage Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manage</Text>

            <TouchableOpacity style={styles.settingItem} onPress={handleClearAllNotifications}>
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: '#FF6B6B' }]}>
                    Clear All Scheduled
                  </Text>
                  <Text style={styles.settingDescription}>
                    Cancel all pending notifications
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
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
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  statsText: {
    color: '#4FFFB0',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  bottomPadding: {
    height: 40,
  },
});
