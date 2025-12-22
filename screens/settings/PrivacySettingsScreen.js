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

export default function PrivacySettingsScreen({ navigation }) {
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [shareLocation, setShareLocation] = useState(false);
  const [shareContacts, setShareContacts] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(true);

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
          <Text style={styles.headerTitle}>Privacy</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                  <Text style={styles.settingDescription}>
                    Add extra security to your account
                  </Text>
                </View>
              </View>
              <Switch
                value={twoFactorAuth}
                onValueChange={setTwoFactorAuth}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={twoFactorAuth ? '#ffffff' : '#999'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="key-outline" size={24} color="#4FFFB0" />
                <Text style={styles.settingLabel}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="finger-print-outline" size={24} color="#4FFFB0" />
                <Text style={styles.settingLabel}>Biometric Login</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Data Sharing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="location-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Share Location</Text>
                  <Text style={styles.settingDescription}>
                    Allow others to see your location
                  </Text>
                </View>
              </View>
              <Switch
                value={shareLocation}
                onValueChange={setShareLocation}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={shareLocation ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="people-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Share Contacts</Text>
                  <Text style={styles.settingDescription}>
                    Let others see your connections
                  </Text>
                </View>
              </View>
              <Switch
                value={shareContacts}
                onValueChange={setShareContacts}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={shareContacts ? '#ffffff' : '#999'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="analytics-outline" size={24} color="#4FFFB0" />
                <View>
                  <Text style={styles.settingLabel}>Usage Analytics</Text>
                  <Text style={styles.settingDescription}>
                    Help improve Ping with usage data
                  </Text>
                </View>
              </View>
              <Switch
                value={analyticsData}
                onValueChange={setAnalyticsData}
                trackColor={{ false: '#2a3a2a', true: '#4FFFB0' }}
                thumbColor={analyticsData ? '#ffffff' : '#999'}
              />
            </View>
          </View>

          {/* Blocked Users */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blocked</Text>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="ban-outline" size={24} color="#ff6b6b" />
                <View>
                  <Text style={styles.settingLabel}>Blocked Users</Text>
                  <Text style={styles.settingDescription}>
                    Manage blocked contacts
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
