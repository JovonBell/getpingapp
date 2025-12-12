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
import { getCurrentUser } from '../utils/supabaseStorage';
import { getUnreadMessageCount } from '../utils/messagesStorage';

export default function AlertsScreen({ navigation }) {
  const [unreadCount, setUnreadCount] = React.useState(0);

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
          <Text style={styles.headerTitle}>Alerts</Text>
          <View style={styles.headerRight}>
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
            <TouchableOpacity>
              <Ionicons name="checkmark-done" size={24} color="#00ff88" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <Ionicons name="notifications-outline" size={48} color="#4FFFB0" />
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600', marginTop: 12 }}>No alerts yet</Text>
            <Text style={{ color: '#ffffff', opacity: 0.7, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
              When you receive pings and updates from your circles, they’ll show up here.
            </Text>
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
