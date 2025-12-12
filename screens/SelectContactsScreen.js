import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { getCurrentUser } from '../utils/supabaseStorage';
import { saveImportedContacts, getImportedContacts } from '../utils/contactsStorage';
import { buildIdentifierHashes, expoContactsToAppContacts, hashContactsForMatching } from '../utils/contactsImport';
import { findIdentityMapByHashes, findUsersByHashes } from '../utils/identitiesStorage';
import { upsertConnections } from '../utils/connectionsStorage';

export default function SelectContactsScreen({ navigation, route }) {
  const selectAll = route?.params?.selectAll || false;
  const isInitialImport = route?.params?.isInitialImport || false;
  const isFirstCircle = route?.params?.isFirstCircle ?? true;
  const existingCircles = route?.params?.existingCircles || [];
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingContacts(true);
      try {
        if (isInitialImport) {
          const { status } = await Contacts.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Contacts Permission',
              'We need access to your contacts to import them into your universe.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            if (mounted) setContacts([]);
            return;
          }

          const result = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
            pageSize: 1000,
            pageOffset: 0,
          });

          const appContacts = expoContactsToAppContacts(result?.data || []);
          if (mounted) setContacts(appContacts);
        } else {
          const { success, contacts: stored } = await getImportedContacts();
          if (mounted) setContacts(success ? stored : []);
        }
      } catch (e) {
        console.error('Failed loading contacts:', e);
        if (mounted) setContacts([]);
      } finally {
        if (mounted) setLoadingContacts(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isInitialImport, navigation]);

  useEffect(() => {
    // Initialize selection once contacts are loaded
    if (selectAll && contacts.length > 0) {
      setSelectedContactIds(contacts.map((c) => c.id));
    }
  }, [selectAll, contacts.length]);

  const toggleContact = (contactId) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContactIds.length === contacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map(c => c.id));
    }
  };

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) =>
      (contact?.name || '').toLowerCase().includes(q) ||
      (contact?.email || '').toLowerCase().includes(q) ||
      (contact?.phone || '').includes(searchQuery.trim())
    );
  }, [contacts, searchQuery]);

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
    const isSelected = selectedContactIds.includes(item.id);

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
          <Text style={styles.title}>
            {isInitialImport ? 'select contacts' : (isFirstCircle ? 'Create Your First Circle' : 'Create a New Circle')}
          </Text>
          <Text style={styles.subtitle}>
            {isInitialImport 
              ? 'choose who enters your universe.' 
              : 'Select contacts to include in this circle.'}
          </Text>
        </View>

        {/* Select All Button */}
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={toggleSelectAll}
        >
          <View style={[
            styles.checkbox,
            selectedContactIds.length === contacts.length && styles.checkboxSelected
          ]}>
            {selectedContactIds.length === contacts.length && (
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
        {loadingContacts ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#4FFFB0" />
            <Text style={{ color: '#ffffff', opacity: 0.7, marginTop: 10 }}>Loading contacts…</Text>
          </View>
        ) : (
          <FlatList
            data={Object.keys(groupedContacts).sort()}
            renderItem={({ item: letter }) => renderSection(letter, groupedContacts[letter])}
            keyExtractor={item => item}
            style={styles.contactList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedContactIds.length} selected
          </Text>
          <TouchableOpacity
            style={styles.importButton}
            onPress={async () => {
              const selected = contacts.filter(c => selectedContactIds.includes(c.id));
              if (isInitialImport) {
                // Persist imported universe locally
                let enriched = selected;

                // Best-effort match & create connections in Supabase (requires migration)
                try {
                  const { success: userSuccess, user } = await getCurrentUser();
                  if (userSuccess && user) {
                    const byContact = await hashContactsForMatching(selected);
                    const { emailHashes, phoneHashes } = await buildIdentifierHashes(selected);
                    const [emailMatches, phoneMatches] = await Promise.all([
                      findUsersByHashes('email', emailHashes),
                      findUsersByHashes('phone', phoneHashes),
                    ]);

                    const matchedUserIds = Array.from(
                      new Set([...(emailMatches.userIds || []), ...(phoneMatches.userIds || [])])
                    );

                    await upsertConnections(user.id, matchedUserIds, 3);

                    // Contact-level match so "Message" knows who to target
                    const [emailMapRes, phoneMapRes] = await Promise.all([
                      findIdentityMapByHashes('email', emailHashes),
                      findIdentityMapByHashes('phone', phoneHashes),
                    ]);

                    const emailMap = emailMapRes.map || {};
                    const phoneMap = phoneMapRes.map || {};

                    enriched = selected.map((c) => {
                      const hashes = byContact[String(c.id)] || { emailHashes: [], phoneHashes: [] };
                      const matched =
                        hashes.emailHashes.find((h) => emailMap[h]) ||
                        hashes.phoneHashes.find((h) => phoneMap[h]) ||
                        null;

                      const matchedUserId = matched ? (emailMap[matched] || phoneMap[matched]) : null;
                      return { ...c, matchedUserId };
                    });
                  }
                } catch (e) {
                  console.warn('Matching/import connections failed (continuing):', e?.message || e);
                }

                await saveImportedContacts(enriched);

                // Initial import - go to confirmation screen
                navigation.navigate('ImportConfirmation', { contacts: enriched });
              } else {
                // Creating a circle - go to name/visualize screen
                navigation.navigate('VisualizeCircle', { contacts: selected, isFirstCircle, existingCircles });
              }
            }}
          >
            <Text style={styles.importButtonText}>
              {isInitialImport ? 'import selected' : 'continue'}
            </Text>
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
    borderColor: '#4FFFB0',
    borderRadius: 12,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
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
