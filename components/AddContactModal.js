import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getImportedContacts } from '../utils/contactsStorage';

/**
 * Modal for adding contacts to an existing circle
 * Shows a search interface with existing imported contacts
 * MEMO: Prevents re-renders from parent animation loops
 */
function AddContactModal({ visible, onClose, onSave, existingContactIds = [] }) {
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Store existingContactIds in a ref to prevent re-fetching on every frame
  const existingIdsRef = useRef(existingContactIds);
  
  useEffect(() => {
    existingIdsRef.current = existingContactIds;
  }, [existingContactIds]);

  useEffect(() => {
    if (!visible) return;

    let mounted = true;

    const load = async () => {
      setLoadingContacts(true);
      try {
        const { success, contacts: stored } = await getImportedContacts();
        if (mounted) {
          // Filter out contacts that are already in the circle
          const availableContacts = success 
            ? stored.filter(c => !existingIdsRef.current.includes(c.id))
            : [];
          setContacts(availableContacts);
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
  }, [visible]); // Only reload when visibility changes

  const toggleContact = useCallback((contactId) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) =>
      (contact?.name || '').toLowerCase().includes(q) ||
      (contact?.email || '').toLowerCase().includes(q) ||
      (contact?.phone || '').includes(searchQuery.trim())
    );
  }, [contacts, searchQuery]);

  const handleSave = async () => {
    const selected = contacts.filter(c => selectedContactIds.includes(c.id));
    if (selected.length === 0) return;

    setIsSaving(true);
    try {
      await onSave(selected);
      setSelectedContactIds([]);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('[AddContactModal] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContact = useCallback(({ item }) => {
    const isSelected = selectedContactIds.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => toggleContact(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.initials || '?'}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.phone && <Text style={styles.contactDetail}>{item.phone}</Text>}
          {item.email && <Text style={styles.contactDetail}>{item.email}</Text>}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={18} color="#000000" />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [selectedContactIds, toggleContact]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Contacts</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#4FFFB0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor="#666666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Contact List */}
          {loadingContacts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4FFFB0" />
              <Text style={styles.loadingText}>Loading contacts…</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#666666" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No contacts found' : 'No more contacts to add'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              renderItem={renderContact}
              keyExtractor={item => item.id}
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
              style={[styles.saveButton, selectedContactIds.length === 0 && styles.saveButtonDisabled]}
              disabled={isSaving || selectedContactIds.length === 0}
              onPress={handleSave}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.saveButtonText}>Add to Circle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 12,
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
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(79, 255, 176, 0.2)',
    borderWidth: 1,
    borderColor: '#4FFFB0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#4FFFB0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactDetail: {
    color: '#999999',
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4FFFB0',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.7,
  },
  saveButton: {
    backgroundColor: '#4FFFB0',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(79, 255, 176, 0.3)',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Wrap with React.memo to prevent unnecessary re-renders from parent animation loops
export default React.memo(AddContactModal);

