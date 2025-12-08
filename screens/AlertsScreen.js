import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_ALERTS = [
  { id: '1', type: 'ping', name: 'Alice Johnson', message: 'sent you a ping!', time: '2m ago' },
  { id: '2', type: 'connection', name: 'Bob Smith', message: 'wants to connect', time: '1h ago' },
  { id: '3', type: 'ping', name: 'Carol White', message: 'sent you a ping!', time: '3h ago' },
  { id: '4', type: 'update', name: 'David Brown', message: 'updated their status', time: '5h ago' },
];

export default function AlertsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alerts</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>!</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="checkmark-done" size={24} color="#00ff88" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {DUMMY_ALERTS.map((alert) => (
            <TouchableOpacity key={alert.id} style={styles.alertItem}>
              <View style={styles.alertIcon}>
                <Ionicons
                  name={alert.type === 'ping' ? 'radio-outline' : alert.type === 'connection' ? 'people-outline' : 'notifications-outline'}
                  size={24}
                  color="#00ff88"
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertText}>
                  <Text style={styles.alertName}>{alert.name}</Text>
                  {' '}{alert.message}
                </Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  alertIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    justifyContent: 'center',
  },
  alertText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  alertName: {
    fontWeight: '600',
    color: '#00ff88',
  },
  alertTime: {
    color: '#999',
    fontSize: 14,
  },
});
