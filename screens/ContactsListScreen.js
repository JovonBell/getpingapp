import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_CONTACTS = [
  { id: '1', name: 'Chart Erarian', email: 'sage@cat.com', phone: '(555) 123-4567', initials: 'AB' },
  { id: '2', name: 'Cannel Gosty', email: 'sage@cat.com', phone: '(555) 234-5678', initials: 'CR' },
  { id: '3', name: 'Dalion Mockey', email: 'sage@cat.com', phone: '(555) 345-6789', initials: 'DA' },
  { id: '4', name: 'Mary Manniott', email: 'sage@cat.com', phone: '(555) 456-7890', initials: 'BH' },
  { id: '5', name: 'Brian Chemm', email: 'sage@cat.com', phone: '(555) 567-8901', initials: 'BC' },
  { id: '6', name: 'Alice Johnson', email: 'alice@email.com', phone: '(555) 678-9012', initials: 'AJ' },
  { id: '7', name: 'Bob Smith', email: 'bob@email.com', phone: '(555) 789-0123', initials: 'BS' },
  { id: '8', name: 'Carol White', email: 'carol@email.com', phone: '(555) 890-1234', initials: 'CW' },
  { id: '9', name: 'David Brown', email: 'david@email.com', phone: '(555) 901-2345', initials: 'DB' },
  { id: '10', name: 'Emma Davis', email: 'emma@email.com', phone: '(555) 012-3456', initials: 'ED' },
];

export default function ContactsListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = DUMMY_CONTACTS.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.contactItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.initials}</Text>
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
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>!</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AddTab')}>
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
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          style={styles.contactList}
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
