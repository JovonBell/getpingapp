import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createReminder, saveContactDate } from '../utils/remindersStorage';

const REMINDER_TYPES = [
  { value: 'follow_up', label: 'Follow Up', icon: 'chatbubble-outline' },
  { value: 'birthday', label: 'Birthday', icon: 'gift-outline' },
  { value: 'anniversary', label: 'Anniversary', icon: 'heart-outline' },
  { value: 'reconnect', label: 'Reconnect', icon: 'refresh-outline' },
  { value: 'custom', label: 'Custom', icon: 'calendar-outline' },
];

const REPEAT_OPTIONS = [
  { value: 'none', label: 'No Repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

/**
 * Modal for creating reminders and saving contact dates
 * @param {boolean} visible - Modal visibility
 * @param {function} onClose - Close handler
 * @param {function} onSave - Save success handler
 * @param {string} userId - Current user ID
 * @param {object} contact - Optional contact to associate with reminder
 * @param {string} initialType - Optional initial reminder type
 */
export default function AddReminderModal({
  visible,
  onClose,
  onSave,
  userId,
  contact = null,
  initialType = 'follow_up',
}) {
  const [reminderType, setReminderType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [repeatInterval, setRepeatInterval] = useState('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setReminderType(initialType);
      setTitle(getDefaultTitle(initialType, contact));
      setNote('');
      setDueDate(new Date());
      setRepeatInterval(initialType === 'birthday' || initialType === 'anniversary' ? 'yearly' : 'none');
    }
  }, [visible, initialType, contact]);

  const getDefaultTitle = (type, contact) => {
    const name = contact?.name || contact?.display_name || '';
    switch (type) {
      case 'birthday':
        return name ? `${name}'s Birthday` : 'Birthday';
      case 'anniversary':
        return name ? `Anniversary with ${name}` : 'Anniversary';
      case 'follow_up':
        return name ? `Follow up with ${name}` : 'Follow up';
      case 'reconnect':
        return name ? `Reconnect with ${name}` : 'Reconnect';
      default:
        return '';
    }
  };

  const handleTypeChange = (type) => {
    setReminderType(type);
    setTitle(getDefaultTitle(type, contact));
    if (type === 'birthday' || type === 'anniversary') {
      setRepeatInterval('yearly');
    } else {
      setRepeatInterval('none');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(dueDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDueDate(newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(dueDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDueDate(newDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    setSaving(true);
    try {
      // Create the reminder
      const result = await createReminder(userId, {
        contactId: contact?.id || null,
        reminderType: reminderType,
        title: title.trim(),
        note: note.trim() || null,
        dueDate: dueDate.toISOString(),
        repeatInterval,
      });

      // For birthday/anniversary, also save as contact date
      if (contact?.id && (reminderType === 'birthday' || reminderType === 'anniversary')) {
        await saveContactDate({
          userId,
          contactId: contact.id,
          dateType: reminderType,
          dateValue: dueDate.toISOString().split('T')[0],
          label: reminderType === 'birthday' ? 'Birthday' : 'Anniversary',
        });
      }

      if (result.success) {
        onSave?.(result.reminder);
        onClose();
      } else {
        console.error('[AddReminderModal] Failed to save:', result.error);
      }
    } catch (error) {
      console.error('[AddReminderModal] Error saving reminder:', error);
    } finally {
      setSaving(false);
    }
  };

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
            <Text style={styles.headerTitle}>Add Reminder</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Contact Info */}
            {contact && (
              <View style={styles.contactInfo}>
                <Ionicons name="person-circle-outline" size={20} color="#4FFFB0" />
                <Text style={styles.contactName}>
                  {contact.name || contact.display_name}
                </Text>
              </View>
            )}

            {/* Reminder Type */}
            <Text style={styles.label}>TYPE</Text>
            <View style={styles.typeGrid}>
              {REMINDER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    reminderType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => handleTypeChange(type.value)}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={reminderType === type.value ? '#000000' : '#888888'}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      reminderType === type.value && styles.typeLabelActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Reminder title..."
              placeholderTextColor="#666666"
            />

            {/* Date & Time */}
            <Text style={styles.label}>DATE & TIME</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#4FFFB0" />
                <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={18} color="#4FFFB0" />
                <Text style={styles.dateText}>{formatTime(dueDate)}</Text>
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                textColor="#ffffff"
              />
            )}

            {/* Time Picker */}
            {showTimePicker && (
              <DateTimePicker
                value={dueDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                textColor="#ffffff"
              />
            )}

            {/* Repeat */}
            <Text style={styles.label}>REPEAT</Text>
            <View style={styles.repeatRow}>
              {REPEAT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.repeatButton,
                    repeatInterval === option.value && styles.repeatButtonActive,
                  ]}
                  onPress={() => setRepeatInterval(option.value)}
                >
                  <Text
                    style={[
                      styles.repeatLabel,
                      repeatInterval === option.value && styles.repeatLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note */}
            <Text style={styles.label}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor="#666666"
              multiline
              numberOfLines={3}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!title.trim() || saving}
            >
              {saving ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#000000" />
                  <Text style={styles.saveButtonText}>Save Reminder</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  contactName: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeButtonActive: {
    backgroundColor: '#4FFFB0',
    borderColor: '#4FFFB0',
  },
  typeLabel: {
    fontSize: 13,
    color: '#888888',
    marginLeft: 6,
  },
  typeLabelActive: {
    color: '#000000',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
  repeatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  repeatButtonActive: {
    backgroundColor: 'rgba(79, 255, 176, 0.2)',
    borderColor: '#4FFFB0',
  },
  repeatLabel: {
    fontSize: 13,
    color: '#888888',
  },
  repeatLabelActive: {
    color: '#4FFFB0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4FFFB0',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
});
