import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsSettingsScreen({ navigation }) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [connectionRequests, setConnectionRequests] = useState(true);
  const [networkUpdates, setNetworkUpdates] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

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
          {/* General Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive push notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={pushNotifications ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive email updates
                  </Text>
                </View>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={emailNotifications ? '#ffffff' : '#999'}
              />
            </View>
          </View>

          {/* Activity Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="chatbubble-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Messages</Text>
                  <Text style={styles.settingDescription}>
                    New message alerts
                  </Text>
                </View>
              </View>
              <Switch
                value={messageNotifications}
                onValueChange={setMessageNotifications}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={messageNotifications ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="person-add-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Connection Requests</Text>
                  <Text style={styles.settingDescription}>
                    New connection alerts
                  </Text>
                </View>
              </View>
              <Switch
                value={connectionRequests}
                onValueChange={setConnectionRequests}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={connectionRequests ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="globe-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Network Updates</Text>
                  <Text style={styles.settingDescription}>
                    Updates from your network
                  </Text>
                </View>
              </View>
              <Switch
                value={networkUpdates}
                onValueChange={setNetworkUpdates}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={networkUpdates ? '#ffffff' : '#999'}
              />
            </View>
          </View>

          {/* Sound & Vibration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sound & Vibration</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Sound</Text>
                  <Text style={styles.settingDescription}>
                    Notification sounds
                  </Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={soundEnabled ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="phone-portrait-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Vibration</Text>
                  <Text style={styles.settingDescription}>
                    Vibrate on notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={vibrationEnabled ? '#ffffff' : '#999'}
              />
            </View>
          </View>

          {/* Do Not Disturb */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Do Not Disturb</Text>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Schedule</Text>
                  <Text style={styles.settingDescription}>
                    Set quiet hours
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
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
});
