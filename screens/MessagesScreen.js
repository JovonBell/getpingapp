import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_MESSAGES = [
  {
    id: '1',
    name: 'Alice Johnson',
    message: 'Hey! Are you free this weekend?',
    time: '2m',
    unread: true,
    initials: 'AJ',
    color: '#00ff88',
  },
  {
    id: '2',
    name: 'Bob Smith',
    message: 'Thanks for the help earlier!',
    time: '1h',
    unread: true,
    initials: 'BS',
    color: '#ffaa00',
  },
  {
    id: '3',
    name: 'Carol White',
    message: 'See you tomorrow ✌️',
    time: '3h',
    unread: false,
    initials: 'CW',
    color: '#ff6b6b',
  },
  {
    id: '4',
    name: 'David Brown',
    message: 'Did you get my last message?',
    time: '5h',
    unread: false,
    initials: 'DB',
    color: '#4ecdc4',
  },
  {
    id: '5',
    name: 'Emma Davis',
    message: 'Love the new feature!',
    time: '1d',
    unread: false,
    initials: 'ED',
    color: '#00ff88',
  },
  {
    id: '6',
    name: 'Chart Erarian',
    message: 'Let me know when you\'re available',
    time: '2d',
    unread: false,
    initials: 'CE',
    color: '#ffaa00',
  },
];

export default function MessagesScreen({ navigation, route }) {
  // Get contact from route params if navigating from HomeScreen
  const contactFromRoute = route?.params?.contact;

  // If a contact was passed, navigate to chat immediately
  React.useEffect(() => {
    if (contactFromRoute) {
      navigation.navigate('Chat', { contact: contactFromRoute });
    }
  }, [contactFromRoute, navigation]);

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => navigation.navigate('Chat', { contact: item })}
    >
      <View style={[styles.avatar, { backgroundColor: item.color }]}>
        <Text style={styles.avatarText}>{item.initials}</Text>
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageName}>{item.name}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.messageText,
              item.unread && styles.messageTextUnread,
            ]}
            numberOfLines={1}
          >
            {item.message}
          </Text>
          {item.unread && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="videocam-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="create-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>

        {/* Messages List */}
        <FlatList
          data={DUMMY_MESSAGES}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
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
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a3a2a',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageTime: {
    color: '#999',
    fontSize: 14,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageText: {
    flex: 1,
    color: '#999',
    fontSize: 14,
  },
  messageTextUnread: {
    color: '#ffffff',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4FFFB0',
    marginLeft: 8,
  },
});
