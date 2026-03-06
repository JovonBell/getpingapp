import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '../../utils/storage/supabaseStorage';

export default function SettingsScreen({ navigation }) {
  const handleLogout = async () => {
    const res = await signOut();
    if (!res.success) {
      Alert.alert('Logout failed', res.error || 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#080D0A', '#050805', '#000000']} locations={[0, 0.3, 0.6, 1]} style={styles.gradient}>
        <Text style={styles.headerTitle}>Settings</Text>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('About')}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name="information-circle-outline" size={20} color="#4FFFB0" />
                </View>
                <Text style={styles.rowLabel}>About</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.15)" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('AccountDeletion')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 107, 107, 0.08)' }]}>
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </View>
                <Text style={[styles.rowLabel, { color: '#FF6B6B' }]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.15)" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, paddingTop: 60 },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 30,
    letterSpacing: -0.5,
  },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 28 },
  sectionTitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 255, 176, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: '#fff', fontSize: 16, fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    backgroundColor: 'rgba(255, 107, 107, 0.04)',
  },
  logoutText: { color: '#FF6B6B', fontSize: 16, fontWeight: '600' },
});
