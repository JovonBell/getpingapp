import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeHeader({ 
  unreadCount = 0, 
  onDashboard, 
  onMessages, 
  onProfile 
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>ping!</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={onDashboard}
        >
          <Ionicons name="stats-chart" size={22} color="#4FFFB0" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={onMessages}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
          {unreadCount > 0 && (
            <View style={styles.messageBadge}>
              <Text style={styles.messageBadgeText}>
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profilePic}
          onPress={onProfile}
        >
          <Ionicons name="person" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dashboardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
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
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
