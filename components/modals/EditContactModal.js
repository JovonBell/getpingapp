import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getContactDetails,
  updateContactDetails,
  SUGGESTED_TAGS,
  HOW_WE_MET_SUGGESTIONS,
} from '../../utils/storage/contactDetailsStorage';

/**
 * Modal for editing contact details (notes, tags, how we met, interests)
 * @param {boolean} visible - Modal visibility
 * @param {function} onClose - Close handler
 * @param {function} onSave - Save success handler
 * @param {object} contact - Contact to edit
 */
export default function EditContactModal({
  visible,
  onClose,
  onSave,
  contact,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [howWeMet, setHowWeMet] = useState('');
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showHowWeMetOptions, setShowHowWeMetOptions] = useState(false);

  // Load contact details when modal opens
  useEffect(() => {
    if (visible && contact?.importedContactId) {
      loadDetails();
    }
  }, [visible, contact?.importedContactId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const result = await getContactDetails(contact.importedContactId);
      if (result.success) {
        setNotes(result.details.notes || '');
        setTags(result.details.tags || []);
        setHowWeMet(result.details.howWeMet || '');
        setInterests(result.details.interests || []);
      }
    } catch (err) {
      console.error('[EditContactModal] Error loading details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSelectSuggestedTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setShowTagSuggestions(false);
  };

  const handleSelectHowWeMet = (option) => {
    setHowWeMet(option);
    setShowHowWeMetOptions(false);
  };

  const handleAddInterest = () => {
    const interest = newInterest.trim();
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
    setNewInterest('');
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  const handleSave = async () => {
    if (!contact?.importedContactId) return;

    setSaving(true);
    try {
      const result = await updateContactDetails(contact.importedContactId, {
        notes,
        tags,
        howWeMet,
        interests,
      });

      if (result.success) {
        onSave?.({
          notes,
          tags,
          howWeMet,
          interests,
        });
        onClose();
      } else {
        console.error('[EditContactModal] Failed to save:', result.error);
      }
    } catch (err) {
      console.error('[EditContactModal] Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const contactName = contact?.name || contact?.display_name || 'Contact';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Contact</Text>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4FFFB0" />
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Contact Name Display */}
              <View style={styles.contactHeader}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitials}>
                    {contactName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.contactName}>{contactName}</Text>
              </View>

              {/* Notes Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={18} color="#4FFFB0" />
                  <Text style={styles.sectionTitle}>Notes</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes about this person..."
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* How We Met Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-outline" size={18} color="#4FFFB0" />
                  <Text style={styles.sectionTitle}>How We Met</Text>
                </View>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowHowWeMetOptions(!showHowWeMetOptions)}
                >
                  <Text style={howWeMet ? styles.selectButtonTextFilled : styles.selectButtonText}>
                    {howWeMet || 'Select how you met...'}
                  </Text>
                  <Ionicons
                    name={showHowWeMetOptions ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#888888"
                  />
                </TouchableOpacity>
                {showHowWeMetOptions && (
                  <View style={styles.optionsContainer}>
                    {HOW_WE_MET_SUGGESTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionButton,
                          howWeMet === option && styles.optionButtonSelected,
                        ]}
                        onPress={() => handleSelectHowWeMet(option)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            howWeMet === option && styles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Tags Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetags-outline" size={18} color="#4FFFB0" />
                  <Text style={styles.sectionTitle}>Tags</Text>
                </View>

                {/* Current Tags */}
                {tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {tags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveTag(tag)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={16} color="#4FFFB0" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add New Tag */}
                <View style={styles.addTagRow}>
                  <TextInput
                    style={styles.tagInput}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Add a tag..."
                    placeholderTextColor="#666666"
                    onFocus={() => setShowTagSuggestions(true)}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    <Ionicons name="add" size={20} color={newTag.trim() ? '#4FFFB0' : '#666666'} />
                  </TouchableOpacity>
                </View>

                {/* Tag Suggestions */}
                {showTagSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsLabel}>Suggestions:</Text>
                    <View style={styles.suggestionsGrid}>
                      {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 12).map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={styles.suggestionTag}
                          onPress={() => handleSelectSuggestedTag(tag)}
                        >
                          <Text style={styles.suggestionTagText}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Interests Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="heart-outline" size={18} color="#4FFFB0" />
                  <Text style={styles.sectionTitle}>Shared Interests</Text>
                </View>

                {/* Current Interests */}
                {interests.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {interests.map((interest) => (
                      <View key={interest} style={styles.interestTag}>
                        <Text style={styles.interestTagText}>{interest}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveInterest(interest)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={16} color="#FF8C42" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add New Interest */}
                <View style={styles.addTagRow}>
                  <TextInput
                    style={styles.tagInput}
                    value={newInterest}
                    onChangeText={setNewInterest}
                    placeholder="Add a shared interest..."
                    placeholderTextColor="#666666"
                    onSubmitEditing={handleAddInterest}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={handleAddInterest}
                    disabled={!newInterest.trim()}
                  >
                    <Ionicons name="add" size={20} color={newInterest.trim() ? '#FF8C42' : '#666666'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0a1a0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contactAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(79, 255, 176, 0.2)',
    borderWidth: 2,
    borderColor: '#4FFFB0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4FFFB0',
  },
  contactName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 100,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#666666',
  },
  selectButtonTextFilled: {
    fontSize: 15,
    color: '#ffffff',
  },
  optionsContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(79, 255, 176, 0.2)',
    borderColor: '#4FFFB0',
  },
  optionText: {
    fontSize: 13,
    color: '#888888',
  },
  optionTextSelected: {
    color: '#4FFFB0',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  tagText: {
    fontSize: 13,
    color: '#4FFFB0',
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 140, 66, 0.15)',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  interestTagText: {
    fontSize: 13,
    color: '#FF8C42',
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionTagText: {
    fontSize: 12,
    color: '#888888',
  },
  bottomSpacer: {
    height: 40,
  },
});
