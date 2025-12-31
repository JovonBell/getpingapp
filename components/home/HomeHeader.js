import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeHeader({
  unreadCount = 0,
  onDashboard,
  onMessages,
  onProfile,
  onImportContacts,
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>ping!</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onDashboard}
        >
          <Ionicons name="stats-chart" size={18} color="#4FFFB0" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onImportContacts}
        >
          <Ionicons name="person-add-outline" size={18} color="#4FFFB0" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMessages}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#ffffff" />
          {unreadCount > 0 && (
            <View style={styles.messageBadge}>
              <Text style={styles.messageBadgeText}>
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onProfile}
        >
          <Ionicons name="person" size={18} color="#ffffff" />
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
    paddingHorizontal: 16,
    paddingTop: 35,
    marginBottom: 6,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 255, 176, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  messageBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
