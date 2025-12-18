import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDueDate, getReminderIcon, getReminderColor } from '../utils/remindersStorage';

/**
 * Card component for displaying a single reminder
 * @param {object} reminder - Reminder data
 * @param {function} onPress - Press handler
 * @param {function} onComplete - Complete/check off handler
 * @param {function} onDismiss - Dismiss handler
 * @param {function} onMessage - Message handler
 * @param {boolean} showContact - Whether to show contact name
 */
export default function ReminderCard({
  reminder,
  onPress,
  onComplete,
  onDismiss,
  onMessage,
  showContact = true,
}) {
  if (!reminder) return null;

  const dueInfo = formatDueDate(reminder.due_date);
  const icon = getReminderIcon(reminder.reminder_type);
  const color = getReminderColor(reminder);
  const isOverdue = dueInfo.isOverdue;
  const contactName = reminder.imported_contacts?.name || reminder.imported_contacts?.display_name;
  const hasPhone = reminder.imported_contacts?.phone;

  return (
    <View style={[styles.container, isOverdue && styles.containerOverdue]}>
      <TouchableOpacity
        style={styles.content}
        onPress={() => onPress?.(reminder)}
        activeOpacity={0.8}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {reminder.title}
          </Text>

          <View style={styles.metaRow}>
            {/* Due date */}
            <View style={styles.dueContainer}>
              <Ionicons
                name={isOverdue ? 'alert-circle' : 'time-outline'}
                size={12}
                color={isOverdue ? '#FF6B6B' : '#888888'}
              />
              <Text style={[styles.dueText, isOverdue && styles.dueTextOverdue]}>
                {dueInfo.label}
              </Text>
            </View>

            {/* Repeat indicator */}
            {reminder.repeat_interval && reminder.repeat_interval !== 'none' && (
              <View style={styles.repeatBadge}>
                <Ionicons name="repeat" size={10} color="#4FFFB0" />
                <Text style={styles.repeatText}>
                  {reminder.repeat_interval}
                </Text>
              </View>
            )}
          </View>

          {/* Contact name */}
          {showContact && contactName && (
            <View style={styles.contactRow}>
              <Ionicons name="person-outline" size={11} color="#666666" />
              <Text style={styles.contactText}>{contactName}</Text>
            </View>
          )}

          {/* Note preview */}
          {reminder.note && (
            <Text style={styles.notePreview} numberOfLines={1}>
              {reminder.note}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actions}>
        {hasPhone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('[ReminderCard] Message button pressed for:', reminder.title);
              onMessage?.(reminder);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#4FFFB0" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComplete?.(reminder)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="checkmark-circle-outline" size={24} color="#4FFFB0" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDismiss?.(reminder)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle-outline" size={24} color="#666666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Compact version of reminder card for lists
 */
export function ReminderCardCompact({ reminder, onPress }) {
  if (!reminder) return null;

  const dueInfo = formatDueDate(reminder.due_date);
  const icon = getReminderIcon(reminder.reminder_type);
  const color = getReminderColor(reminder);

  return (
    <TouchableOpacity
      style={styles.compactContainer}
      onPress={() => onPress?.(reminder)}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.compactTitle} numberOfLines={1}>
        {reminder.title}
      </Text>
      <Text style={[styles.compactDue, dueInfo.isOverdue && styles.dueTextOverdue]}>
        {dueInfo.label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Birthday/Anniversary specific card
 */
export function DateReminderCard({ dateInfo, onPress, onMessage }) {
  if (!dateInfo) return null;

  const isBirthday = dateInfo.date_type === 'birthday';
  const icon = isBirthday ? 'gift-outline' : 'heart-outline';
  const color = isBirthday ? '#FF6B6B' : '#FF8C42';
  const contactName = dateInfo.imported_contacts?.name || dateInfo.imported_contacts?.display_name;

  // Calculate days until
  const today = new Date();
  const thisYear = today.getFullYear();
  const dateValue = new Date(dateInfo.date_value);
  let nextOccurrence = new Date(thisYear, dateValue.getMonth(), dateValue.getDate());

  if (nextOccurrence < today) {
    nextOccurrence.setFullYear(thisYear + 1);
  }

  const diffTime = nextOccurrence - today;
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let dueLabel;
  if (daysUntil === 0) {
    dueLabel = 'Today!';
  } else if (daysUntil === 1) {
    dueLabel = 'Tomorrow';
  } else if (daysUntil <= 7) {
    dueLabel = `In ${daysUntil} days`;
  } else {
    dueLabel = nextOccurrence.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const isUrgent = daysUntil <= 1;

  return (
    <TouchableOpacity
      style={[styles.dateContainer, isUrgent && styles.dateContainerUrgent]}
      onPress={() => onPress?.(dateInfo)}
      activeOpacity={0.8}
    >
      <View style={[styles.dateIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>

      <View style={styles.dateContent}>
        <Text style={styles.dateTitle}>
          {contactName}'s {isBirthday ? 'Birthday' : 'Anniversary'}
        </Text>
        <Text style={[styles.dateDue, isUrgent && styles.dateDueUrgent]}>
          {dueLabel}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.messageButton}
        onPress={() => onMessage?.(dateInfo)}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#4FFFB0" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  containerOverdue: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueText: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 4,
  },
  dueTextOverdue: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  repeatText: {
    fontSize: 10,
    color: '#4FFFB0',
    marginLeft: 3,
    textTransform: 'capitalize',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 11,
    color: '#666666',
    marginLeft: 4,
  },
  notePreview: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'column',
    gap: 4,
    paddingRight: 14,
    paddingVertical: 14,
  },
  actionButton: {
    padding: 4,
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  compactTitle: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
  },
  compactDue: {
    fontSize: 11,
    color: '#888888',
  },

  // Date reminder styles
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateContainerUrgent: {
    borderColor: 'rgba(255, 107, 107, 0.4)',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  dateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateContent: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  dateDue: {
    fontSize: 13,
    color: '#888888',
  },
  dateDueUrgent: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
