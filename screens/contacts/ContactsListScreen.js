import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getImportedContacts } from '../../utils/storage/contactsStorage';
import { getCurrentUser } from '../../utils/storage/supabaseStorage';
import { getUnreadMessageCount } from '../../utils/storage/messagesStorage';
import { getHealthScores } from '../../utils/scoring/healthScoring';
import { HealthDot } from '../../components/contacts/HealthIndicator';

export default function ContactsListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [healthMap, setHealthMap] = useState({}); // Maps contact ID to health data

  const loadContacts = async () => {
    setLoading(true);
    const { contacts: stored } = await getImportedContacts();
    setContacts(stored || []);

    // Load health scores - map by contact_id (device ID) for matching with AsyncStorage contacts
    const { success, user } = await getCurrentUser();
    if (success && user) {
      const { healthScores } = await getHealthScores(user.id);
      if (healthScores && healthScores.length > 0) {
        const map = {};
        for (const h of healthScores) {
          // Use contact_id (device ID) as key since AsyncStorage contacts use device IDs
          const deviceId = h.contact?.contact_id;
          if (deviceId) {
            map[deviceId] = h;
          }
        }
        setHealthMap(map);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadContacts();
    const unsub = navigation.addListener('focus', loadContacts);
    return unsub;
  }, [navigation]);

  useEffect(() => {
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

  const filteredContacts = contacts.filter((contact) =>
    (contact?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact?.phone || '').includes(searchQuery)
  );

  const renderContact = ({ item }) => {
    const health = healthMap[item.id];
    return (
      <TouchableOpacity style={styles.contactItem}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.initials}</Text>
          {health && (
            <View style={styles.healthDotContainer}>
              <HealthDot status={health.status} size={12} />
            </View>
          )}
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call-outline" size={20} color="#00ff88" />
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Contacts</Text>
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
            <TouchableOpacity
              onPress={() => navigation.navigate('SelectContacts', { mode: 'addContacts' })}
            >
              <Ionicons name="person-add" size={24} color="#00ff88" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#00ff88" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Contact List */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#4FFFB0" />
            <Text style={{ color: '#ffffff', opacity: 0.7, marginTop: 10 }}>Loading…</Text>
          </View>
        ) : filteredContacts.length > 0 ? (
          <FlatList
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={item => item.id}
            style={styles.contactList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No contacts yet</Text>
            <Text style={{ color: '#ffffff', opacity: 0.7, textAlign: 'center' }}>
              Import your contacts to start building your universe.
            </Text>
            <TouchableOpacity
              style={{ marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(79,255,176,0.15)', borderWidth: 1, borderColor: '#4FFFB0' }}
              onPress={() => {
                const parent = navigation.getParent?.();
                if (parent) parent.navigate('ImportContacts');
                else navigation.navigate('ImportContacts');
              }}
            >
              <Text style={{ color: '#4FFFB0', fontWeight: '600' }}>Import contacts</Text>
            </TouchableOpacity>
          </View>
        )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
  },
  contactList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  healthDotContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#05140a',
    borderRadius: 8,
    padding: 2,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    color: '#999',
    fontSize: 14,
  },
  callButton: {
    padding: 8,
  },
});
