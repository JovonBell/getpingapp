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

// Dummy contact data
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

export default function SelectContactsScreen({ navigation, route }) {
  const selectAll = route?.params?.selectAll || false;
  const [selectedContacts, setSelectedContacts] = useState(
    selectAll ? DUMMY_CONTACTS.map(c => c.id) : []
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleContact = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === DUMMY_CONTACTS.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(DUMMY_CONTACTS.map(c => c.id));
    }
  };

  const filteredContacts = DUMMY_CONTACTS.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group contacts by first letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const firstLetter = contact.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(contact);
    return acc;
  }, {});

  const renderContact = ({ item }) => {
    const isSelected = selectedContacts.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => toggleContact(item.id)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactEmail}>{item.email}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={20} color="#1a1a1a" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (letter, contacts) => (
    <View key={letter}>
      <Text style={styles.sectionHeader}>{letter}</Text>
      {contacts.map(contact => (
        <View key={contact.id}>
          {renderContact({ item: contact })}
        </View>
      ))}
    </View>
  );

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
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneButton}>
            <Text style={styles.doneText}>done</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>select contacts</Text>
          <Text style={styles.subtitle}>choose who enters your universe.</Text>
        </View>

        {/* Select All Button */}
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={toggleSelectAll}
        >
          <View style={[
            styles.checkbox,
            selectedContacts.length === DUMMY_CONTACTS.length && styles.checkboxSelected
          ]}>
            {selectedContacts.length === DUMMY_CONTACTS.length && (
              <Ionicons name="checkmark" size={20} color="#1a1a1a" />
            )}
          </View>
          <Text style={styles.selectAllText}>select all contacts</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Contact List */}
        <FlatList
          data={Object.keys(groupedContacts).sort()}
          renderItem={({ item: letter }) => renderSection(letter, groupedContacts[letter])}
          keyExtractor={item => item}
          style={styles.contactList}
          showsVerticalScrollIndicator={false}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedContacts.length} selected
          </Text>
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => {
              const contacts = DUMMY_CONTACTS.filter(c => selectedContacts.includes(c.id));
              navigation.navigate('Home', { contacts });
            }}
          >
            <Text style={styles.importButtonText}>import selected</Text>
          </TouchableOpacity>
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  doneButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  doneText: {
    color: '#a8e6cf',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.7,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  selectAllText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a3a2a',
    borderRadius: 12,
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
    paddingVertical: 14,
  },
  contactList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
    marginBottom: 8,
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
  contactEmail: {
    color: '#999',
    fontSize: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#a8e6cf',
    borderColor: '#a8e6cf',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a3a2a',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.7,
  },
  importButton: {
    backgroundColor: '#a8e6cf',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  importButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
