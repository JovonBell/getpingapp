import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { getCurrentUser } from '../../utils/storage/supabaseStorage';
import { saveImportedContacts, getImportedContacts } from '../../utils/storage/contactsStorage';
import { buildIdentifierHashes, expoContactsToAppContacts, hashContactsForMatching } from '../../utils/contactsImport';
import { findIdentityMapByHashes, findUsersByHashes } from '../../utils/storage/identitiesStorage';
import { upsertConnections } from '../../utils/storage/connectionsStorage';
import { addContactsToCircle } from '../../utils/storage/circlesStorage';

export default function SelectContactsScreen({ navigation, route }) {
  const selectAll = route?.params?.selectAll || false;
  const mode = route?.params?.mode || '';
  const isInitialImport = mode === 'initialImport' || route?.params?.isInitialImport || false;
  const isAddContacts = mode === 'addContacts';
  const circleId = route?.params?.circleId || null; // Circle to add contacts to (when isAddContacts)
  const isFirstCircle = route?.params?.isFirstCircle ?? true;
  const existingCircles = route?.params?.existingCircles || [];
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const isMountedRef = useRef(true);

  // Track mounted state for async operations
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadContacts = async (mounted) => {
    setLoadingContacts(true);
    setLoadError(null);

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Loading contacts timed out')), 15000)
    );

    try {
      if (isInitialImport || isAddContacts) {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Contacts Permission',
            'We need access to your contacts to import them into your universe.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          if (mounted.current) setContacts([]);
          return;
        }

        // Race between contact loading and timeout
        const result = await Promise.race([
          Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image],
            pageSize: 1000,
            pageOffset: 0,
          }),
          timeoutPromise
        ]);

        const appContacts = expoContactsToAppContacts(result?.data || []);
        if (mounted.current) setContacts(appContacts);
      } else {
        const { success, contacts: stored } = await getImportedContacts();
        if (mounted.current) setContacts(success ? stored : []);
      }
    } catch (e) {
      console.error('Failed loading contacts:', e);
      if (mounted.current) {
        setContacts([]);
        setLoadError(e.message || 'Failed to load contacts');
      }
    } finally {
      if (mounted.current) setLoadingContacts(false);
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    loadContacts(mounted);
    return () => {
      mounted.current = false;
    };
  }, [isInitialImport, isAddContacts, navigation]);

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

  // Group contacts by first letter (with null safety)
  const groupedContacts = useMemo(() => {
    try {
      return filteredContacts.reduce((acc, contact) => {
        const name = contact?.name || '';
        const firstLetter = name.length > 0 ? name[0].toUpperCase() : '#';
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        acc[firstLetter].push(contact);
        return acc;
      }, {});
    } catch (err) {
      console.warn('[SelectContactsScreen] Error grouping contacts:', err);
      return {};
    }
  }, [filteredContacts]);

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
          <Text style={styles.selectedCount}>{selectedContactIds.length} selected</Text>
          {isInitialImport && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.skipText}>skip</Text>
            </TouchableOpacity>
          )}
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
        ) : loadError ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={{ color: '#ffffff', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
              {loadError}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: '#4FFFB0',
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 20,
              }}
              onPress={() => loadContacts({ current: true })}
            >
              <Text style={{ color: '#1a1a1a', fontSize: 16, fontWeight: '600' }}>Try Again</Text>
            </TouchableOpacity>
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

        {/* Privacy Notice */}
        {(isInitialImport || isAddContacts) && (
          <View style={styles.privacyNotice}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#4FFFB0" />
            <Text style={styles.privacyNoticeText}>
              Selected contacts will be securely uploaded to Ping's servers to find people you know.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedContactIds.length} selected
          </Text>
          <TouchableOpacity
            style={[styles.importButton, isImporting && styles.importButtonDisabled]}
            disabled={isImporting}
            onPress={async () => {
              const selected = contacts.filter(c => selectedContactIds.includes(c.id));

              if (selected.length === 0) {
                Alert.alert('No Contacts Selected', 'Please select at least one contact to continue.');
                return;
              }

              // Show consent dialog before uploading contacts to server (Apple Guideline 5.1.2)
              if (isInitialImport || isAddContacts) {
                const userConsented = await new Promise((resolve) => {
                  Alert.alert(
                    'Upload Contacts to Ping',
                    `The ${selected.length} contact(s) you selected will be securely uploaded to Ping's servers. This allows us to:\n\n` +
                    '\u2022 Match you with people you know who are already on Ping\n' +
                    '\u2022 Build your network visualization\n' +
                    '\u2022 Enable communication features\n\n' +
                    'Contact names, emails, and phone numbers are stored securely and are never shared with third parties. ' +
                    'You can delete your data at any time from Settings.\n\n' +
                    'By continuing, you consent to this data being uploaded.',
                    [
                      { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
                      { text: 'Continue', onPress: () => resolve(true) },
                    ],
                    { cancelable: false }
                  );
                });

                if (!userConsented) {
                  return;
                }
              }

              setIsImporting(true);

              try {
                if (isInitialImport || isAddContacts) {
                  // Persist imported universe locally
                  let enriched = selected;

                  // Best-effort match & create connections in Supabase (requires migration)
                  // Use a timeout to prevent hanging if Supabase is slow/unavailable
                  const matchingTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Matching timeout')), 30000)
                  );

                  try {
                    const { success: userSuccess, user } = await getCurrentUser();
                    if (userSuccess && user) {
                      await Promise.race([
                        (async () => {
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
                        })(),
                        matchingTimeout
                      ]);
                    }
                  } catch (e) {
                    console.warn('Matching/import connections failed (continuing):', e?.message || e);
                    // Show user-friendly notice about partial failure
                    Alert.alert(
                      'Import Notice',
                      'Contact matching timed out. Your contacts were saved but may not be linked to existing users.',
                      [{ text: 'OK' }]
                    );
                  }

                  // Merge with existing contacts
                  const { success: existingSuccess, contacts: existingContacts } = await getImportedContacts();
                  const existing = existingSuccess ? existingContacts : [];
                  const existingIds = new Set(existing.map(c => c.id));
                  const newContacts = enriched.filter(c => !existingIds.has(c.id));
                  const merged = [...existing, ...newContacts];

                  // Add timeout to prevent hanging
                  const saveTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Save timeout')), 15000)
                  );
                  await Promise.race([saveImportedContacts(merged), saveTimeout]);

                  if (isAddContacts) {
                    // If circleId provided, also add contacts to that circle
                    if (circleId && newContacts.length > 0) {
                      try {
                        // Add 15-second timeout to prevent hanging on auth/network issues
                        const addTimeout = new Promise((_, reject) =>
                          setTimeout(() => reject(new Error('Adding to circle timed out')), 15000)
                        );
                        const { success: userOk, user } = await getCurrentUser();
                        if (userOk && user) {
                          const addResult = await Promise.race([
                            addContactsToCircle(user.id, circleId, newContacts),
                            addTimeout
                          ]);
                          if (!addResult.success) {
                            console.warn('[SELECT CONTACTS] Failed to add to circle:', addResult.error);
                          }
                        } else {
                          console.warn('[SELECT CONTACTS] User not authenticated, skipping circle add');
                        }
                      } catch (circleErr) {
                        console.warn('[SELECT CONTACTS] Error adding to circle:', circleErr?.message);
                        // Don't block - contacts were still saved locally
                      }
                    }
                    // Adding contacts - go back to contacts list (ALWAYS runs even if circle add fails)
                    Alert.alert('Success', `Added ${newContacts.length} new contacts!`);
                    navigation.goBack();
                  } else {
                    // Initial import - go to confirmation screen
                    navigation.navigate('ImportConfirmation', { contacts: enriched });
                  }
                } else {
                  // Creating a circle - go to name/visualize screen
                  navigation.navigate('VisualizeCircle', { contacts: selected, isFirstCircle, existingCircles });
                }
              } catch (err) {
                console.error('Error in import flow:', err);
                if (isMountedRef.current) {
                  Alert.alert('Error', 'Failed to process contacts. Please try again.');
                }
              } finally {
                // ALWAYS reset loading state (only if still mounted)
                if (isMountedRef.current) {
                  setIsImporting(false);
                }
              }
            }}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <Text style={styles.importButtonText}>
                {isInitialImport ? 'import selected' : 'continue'}
              </Text>
            )}
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
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4a6b5a',
    borderRadius: 20,
  },
  skipText: {
    color: '#ffffff',
    fontSize: 14,
  },
  selectedCount: {
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
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(79, 255, 176, 0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 255, 176, 0.15)',
  },
  privacyNoticeText: {
    color: '#a0a0a0',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
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
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
