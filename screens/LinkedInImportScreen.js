import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../utils/supabaseStorage';
import { saveImportedContacts } from '../utils/contactsStorage';
import { createCircleWithMembers } from '../utils/circlesStorage';

function parseLinkedInCSV(text) {
  const lines = text.split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values =
        line.match(/(".*?"|[^,]+)/g)?.map((v) => v.replace(/^"|"$/g, '').trim()) || [];
      const row = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return {
        firstName: row['First Name'] || '',
        lastName: row['Last Name'] || '',
        email: row['Email Address'] || '',
        company: row['Company'] || '',
        position: row['Position'] || '',
        connectedOn: row['Connected On'] || '',
      };
    })
    .filter((c) => c.firstName || c.lastName);
}

function getInitials(firstName, lastName) {
  const f = firstName?.[0] || '';
  const l = lastName?.[0] || '';
  return (f + l).toUpperCase() || '?';
}

export default function LinkedInImportScreen({ navigation, route }) {
  const circleId = route?.params?.circleId;

  const [phase, setPhase] = useState('instructions'); // 'instructions' | 'review'
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState(null);

  // Top companies for filter chips
  const topCompanies = useMemo(() => {
    const counts = {};
    contacts.forEach((c) => {
      if (c.company) counts[c.company] = (counts[c.company] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (companyFilter) {
      list = list.filter((c) => c.company === companyFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, companyFilter, searchQuery]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handlePickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
      if (result.canceled) return;

      setLoading(true);
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      const parsed = parseLinkedInCSV(text);

      if (parsed.length === 0) {
        Alert.alert('No contacts found', 'The CSV file appears empty or in an unexpected format.');
        setLoading(false);
        return;
      }

      setContacts(parsed);
      // Pre-select all
      const sel = {};
      parsed.forEach((_, i) => {
        sel[i] = true;
      });
      setSelected(sel);
      setPhase('review');
    } catch (e) {
      console.error('[LinkedIn CSV] Pick error:', e);
      Alert.alert('Error', 'Failed to read the CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index) => {
    setSelected((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleSelectAll = () => {
    const allFilteredSelected = filteredContacts.every((c) => {
      const idx = contacts.indexOf(c);
      return selected[idx];
    });
    const update = { ...selected };
    filteredContacts.forEach((c) => {
      const idx = contacts.indexOf(c);
      update[idx] = !allFilteredSelected;
    });
    setSelected(update);
  };

  const handleImport = async () => {
    const user = await getCurrentUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to import contacts.');
      return;
    }

    const toImport = contacts.filter((_, i) => selected[i]);
    if (toImport.length === 0) {
      Alert.alert('No selection', 'Select at least one contact to import.');
      return;
    }

    setLoading(true);
    try {
      const rows = toImport.map((c) => {
        const name = `${c.firstName} ${c.lastName}`.trim();
        const slug = `${c.firstName}-${c.lastName}`.toLowerCase().replace(/\s+/g, '-');
        return {
          user_id: user.id,
          contact_id: c.email ? `linkedin:${c.email}` : `linkedin:${slug}`,
          name,
          initials: getInitials(c.firstName, c.lastName),
          email: c.email || null,
          linkedin_url: null,
        };
      });

      const { data: upserted, error } = await supabase
        .from('imported_contacts')
        .upsert(rows, { onConflict: 'user_id,contact_id' })
        .select('id,contact_id,name,initials,email');

      if (error) throw error;

      // Build a contact_id -> upserted row map for matching
      const upsertedByContactId = (upserted || []).reduce((acc, row) => {
        acc[row.contact_id] = row;
        return acc;
      }, {});

      // Group selected contacts by company
      const byCompany = {};
      toImport.forEach((c) => {
        const company = c.company || 'Other';
        if (!byCompany[company]) byCompany[company] = [];
        byCompany[company].push(c);
      });

      // Auto-create one circle per company
      // Check for existing circles to avoid duplicates
      const { data: existingCircles } = await supabase
        .from('circles')
        .select('id,name,source')
        .eq('user_id', user.id)
        .eq('source', 'linkedin');

      const existingByName = (existingCircles || []).reduce((acc, c) => {
        acc[c.name] = c.id;
        return acc;
      }, {});

      for (const [company, companyContacts] of Object.entries(byCompany)) {
        const circleName = `LinkedIn - ${company}`;
        const contactsForCircle = companyContacts.map((c) => {
          const slug = `${c.firstName}-${c.lastName}`.toLowerCase().replace(/\s+/g, '-');
          const contactId = c.email ? `linkedin:${c.email}` : `linkedin:${slug}`;
          const upsertedRow = upsertedByContactId[contactId];
          return {
            id: contactId,
            name: `${c.firstName} ${c.lastName}`.trim(),
            initials: getInitials(c.firstName, c.lastName),
            email: c.email || null,
          };
        });

        if (existingByName[circleName]) {
          // Circle already exists — add new members to it
          const existingCircleId = existingByName[circleName];
          const memberRows = companyContacts
            .map((c) => {
              const slug = `${c.firstName}-${c.lastName}`.toLowerCase().replace(/\s+/g, '-');
              const contactId = c.email ? `linkedin:${c.email}` : `linkedin:${slug}`;
              const row = upsertedByContactId[contactId];
              return row ? { circle_id: existingCircleId, imported_contact_id: row.id } : null;
            })
            .filter(Boolean);
          if (memberRows.length > 0) {
            await supabase
              .from('circle_members')
              .upsert(memberRows, { onConflict: 'circle_id,imported_contact_id' });
          }
        } else {
          // Create new circle
          await createCircleWithMembers(user.id, {
            name: circleName,
            contacts: contactsForCircle,
            source: 'linkedin',
          });
        }
      }

      // Save to local storage for consistency with phone import flow
      await saveImportedContacts(upserted || []);

      Alert.alert('Imported', `${upserted?.length || 0} contact(s) imported into ${Object.keys(byCompany).length} circle(s).`);
      navigation.goBack();
    } catch (e) {
      console.error('[LinkedIn Import] Import error:', e);
      Alert.alert('Error', 'Failed to save contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContact = ({ item }) => {
    const index = contacts.indexOf(item);
    const isSelected = !!selected[index];
    const name = `${item.firstName} ${item.lastName}`.trim();

    return (
      <TouchableOpacity
        style={styles.profileRow}
        onPress={() => toggleSelect(index)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#000" />}
        </View>
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>
            {name}
          </Text>
          {!!item.position && (
            <Text style={styles.profileDetail} numberOfLines={1}>
              {item.position}
            </Text>
          )}
          {!!item.company && (
            <Text style={styles.profileDetail} numberOfLines={1}>
              {item.company}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a2e1a', '#05140a', '#000000']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LinkedIn Import</Text>
          <View style={{ width: 40 }} />
        </View>

        {phase === 'instructions' ? (
          <ScrollView style={styles.inputContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.sectionTitle}>Import your LinkedIn connections</Text>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  Open LinkedIn and go to{' '}
                  <Text style={styles.bold}>Settings & Privacy</Text>
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  Navigate to <Text style={styles.bold}>Data Privacy</Text> then tap{' '}
                  <Text style={styles.bold}>Get a copy of your data</Text>
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  Select <Text style={styles.bold}>Connections</Text> and request your data archive
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  Once you receive the email, download the CSV file and upload it below
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, loading && styles.buttonDisabled]}
              onPress={handlePickCSV}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.uploadButtonText}>Upload CSV</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.reviewContainer}>
            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, company, or position"
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            {/* Company filter chips */}
            {topCompanies.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipContainer}
              >
                {topCompanies.map((company) => (
                  <TouchableOpacity
                    key={company}
                    style={[styles.chip, companyFilter === company && styles.chipActive]}
                    onPress={() =>
                      setCompanyFilter(companyFilter === company ? null : company)
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        companyFilter === company && styles.chipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {company}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Select all + count */}
            <View style={styles.selectAllRow}>
              <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
                <Ionicons
                  name={
                    filteredContacts.every((c) => selected[contacts.indexOf(c)])
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={22}
                  color="#4FFFB0"
                />
                <Text style={styles.selectAllText}>Select all</Text>
              </TouchableOpacity>
              <Text style={styles.countText}>
                {selectedCount} of {contacts.length} selected
              </Text>
            </View>

            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => {
                const idx = contacts.indexOf(item);
                return String(idx);
              }}
              renderItem={renderContact}
              style={styles.list}
            />

            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={styles.backToInput}
                onPress={() => {
                  setPhase('instructions');
                  setContacts([]);
                  setSelected({});
                  setSearchQuery('');
                  setCompanyFilter(null);
                }}
              >
                <Text style={styles.backToInputText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importButton, loading && styles.buttonDisabled]}
                onPress={handleImport}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.importButtonText}>
                    Import{selectedCount > 0 ? ` (${selectedCount})` : ''}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  inputContainer: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 24 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4FFFB0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: { color: '#000', fontSize: 14, fontWeight: '700' },
  stepContent: { flex: 1 },
  stepText: { color: '#ccc', fontSize: 15, lineHeight: 22 },
  bold: { color: '#fff', fontWeight: '600' },
  uploadButton: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 24,
  },
  uploadButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  reviewContainer: { flex: 1, paddingHorizontal: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a4a3a',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  chipScroll: { maxHeight: 44, marginBottom: 12 },
  chipContainer: { gap: 8, paddingRight: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a4a3a',
    backgroundColor: '#1a2a1a',
  },
  chipActive: { backgroundColor: '#4FFFB0', borderColor: '#4FFFB0' },
  chipText: { color: '#ccc', fontSize: 13 },
  chipTextActive: { color: '#000', fontWeight: '600' },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectAllButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllText: { color: '#4FFFB0', fontSize: 14, fontWeight: '500' },
  countText: { color: '#888', fontSize: 13 },
  list: { flex: 1, marginBottom: 16 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: { backgroundColor: '#4FFFB0' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#2a4a3a', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#4FFFB0', fontSize: 14, fontWeight: '600' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  profileDetail: { color: '#aaa', fontSize: 13 },
  bottomButtons: { flexDirection: 'row', gap: 12, paddingBottom: 40 },
  backToInput: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4FFFB0',
    alignItems: 'center',
  },
  backToInputText: { color: '#4FFFB0', fontSize: 16, fontWeight: '600' },
  importButton: {
    flex: 2,
    backgroundColor: '#4FFFB0',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  importButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
