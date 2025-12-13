import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../utils/supabaseStorage';
import { fetchRecentThreads } from '../utils/messagesStorage';
import { supabase } from '../lib/supabase';

export default function MessagesScreen({ navigation, route }) {
  const contactFromRoute = route?.params?.contact;
  const [loading, setLoading] = React.useState(true);
  const [threads, setThreads] = React.useState([]);
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const [showUserSearch, setShowUserSearch] = React.useState(false);
  const [userSearchQuery, setUserSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);

  const loadThreads = async () => {
    setLoading(true);
    const { success, user } = await getCurrentUser();
    const uid = success ? user?.id : null;
    setCurrentUserId(uid);
    if (!uid) {
      setThreads([]);
      setLoading(false);
      return;
    }
    const res = await fetchRecentThreads(uid);
    setThreads(res.threads || []);
    setLoading(false);
  };

  React.useEffect(() => {
    loadThreads();
    const unsub = navigation.addListener('focus', loadThreads);
    return unsub;
  }, [navigation]);

  React.useEffect(() => {
    if (!contactFromRoute) return;
    const receiverId = contactFromRoute?.matchedUserId || contactFromRoute?.userId || null;
    if (!receiverId) return;
    navigation.navigate('Chat', { contact: contactFromRoute, receiverId });
  }, [contactFromRoute, navigation]);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id,display_name,avatar_url')
        .ilike('display_name', `%${query}%`)
        .neq('user_id', currentUserId)
        .limit(20);

      if (!error && data) {
        setSearchResults(data.map(p => ({
          userId: p.user_id,
          name: p.display_name || 'ping user',
          initials: (p.display_name || 'P').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
          avatarUrl: p.avatar_url,
        })));
      }
    } catch (e) {
      console.warn('User search error:', e);
    }
  };

  React.useEffect(() => {
    if (userSearchQuery) {
      const timer = setTimeout(() => searchUsers(userSearchQuery), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [userSearchQuery]);

  const renderMessage = ({ item }) => {
    const profile = item?.profile;
    const name = profile?.display_name || 'ping user';
    const last = item?.lastMessage;
    const unread = last?.receiver_id === currentUserId && last?.read === false;
    const initials = (name || 'P').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

    return (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() =>
        navigation.navigate('Chat', {
          receiverId: item.otherUserId,
          contact: { name, initials, matchedUserId: item.otherUserId },
        })
      }
    >
      <View style={[styles.avatar, { backgroundColor: '#2a4a3a' }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageName}>{name}</Text>
          <Text style={styles.messageTime}>
            {last?.created_at ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.messageText,
              unread && styles.messageTextUnread,
            ]}
            numberOfLines={1}
          >
            {last?.content || ''}
          </Text>
          {unread && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
    );
  };

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
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => setShowUserSearch(true)}
            >
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
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#4FFFB0" />
            <Text style={{ color: '#ffffff', opacity: 0.7, marginTop: 10 }}>Loading…</Text>
          </View>
        ) : (
          <FlatList
            data={threads}
            renderItem={renderMessage}
            keyExtractor={(item) => item.otherUserId}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* User Search Modal */}
        <Modal
          visible={showUserSearch}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowUserSearch(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.searchModal}>
              <View style={styles.searchModalHeader}>
                <Text style={styles.searchModalTitle}>New Message</Text>
                <TouchableOpacity onPress={() => {
                  setShowUserSearch(false);
                  setUserSearchQuery('');
                  setSearchResults([]);
                }}>
                  <Ionicons name="close" size={28} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#4FFFB0" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users by name..."
                  placeholderTextColor="#666"
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                  autoFocus
                />
              </View>

              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userResultItem}
                    onPress={() => {
                      setShowUserSearch(false);
                      setUserSearchQuery('');
                      setSearchResults([]);
                      navigation.navigate('Chat', {
                        receiverId: item.userId,
                        contact: { name: item.name, initials: item.initials, matchedUserId: item.userId },
                      });
                    }}
                  >
                    <View style={[styles.avatar, { backgroundColor: '#2a4a3a' }]}>
                      <Text style={styles.avatarText}>{item.initials}</Text>
                    </View>
                    <Text style={styles.userResultName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  userSearchQuery.trim() ? (
                    <View style={styles.emptySearch}>
                      <Text style={styles.emptySearchText}>No users found</Text>
                    </View>
                  ) : null
                }
              />
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  searchModal: {
    backgroundColor: '#0f1f0f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  userResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  userResultName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySearch: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#666',
    fontSize: 16,
  },
});
