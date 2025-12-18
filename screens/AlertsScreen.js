import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../utils/supabaseStorage';
import { getUnreadMessageCount } from '../utils/messagesStorage';
import { getAlerts, markAlertRead, markAllAlertsRead, getUnreadAlertCount } from '../utils/alertsStorage';
import { getHealthColor } from '../utils/healthScoring';
import {
  getUpcomingReminders,
  getOverdueReminders,
  getUpcomingDates,
  completeReminder,
  dismissReminder,
  formatDueDate,
  getReminderIcon,
  getReminderColor,
} from '../utils/remindersStorage';

// Icon and color mapping for alert types
const ALERT_CONFIG = {
  health_decline: {
    icon: 'heart-outline',
    getColor: (threshold) => {
      if (threshold >= 80) return '#FFD93D'; // Yellow - cooling
      if (threshold >= 60) return '#FF8C42'; // Orange - at risk
      return '#FF6B6B'; // Red - cold
    },
  },
  needs_attention: {
    icon: 'alert-circle-outline',
    color: '#FF8C42',
  },
  daily_summary: {
    icon: 'calendar-outline',
    color: '#4FFFB0',
  },
  milestone: {
    icon: 'trophy-outline',
    color: '#FFD93D',
  },
  system: {
    icon: 'information-circle-outline',
    color: '#4FFFB0',
  },
};

// Format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Generate pre-populated message based on reminder type
function getPrePopulatedMessage(reminderType, contactName) {
  switch (reminderType) {
    case 'birthday':
      return `Happy Birthday!! 🎂🎉🎈`;
    case 'anniversary':
      return `Happy Anniversary!! 💝🎉✨`;
    case 'follow_up':
    case 'reconnect':
      return `Hey ${contactName}, how's everything been?`;
    default:
      return `Hey ${contactName}, hope you're doing well!`;
  }
}

export default function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [upcomingDates, setUpcomingDates] = useState([]);

  // Load alerts
  const loadAlerts = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const { success: userSuccess, user } = await getCurrentUser();
      if (!userSuccess || !user) {
        setAlerts([]);
        return;
      }

      setUserId(user.id);

      // Load alerts, messages, and reminders in parallel
      const [alertsRes, messagesRes, upcomingRes, overdueRes, datesRes] = await Promise.all([
        getAlerts(user.id),
        getUnreadMessageCount(user.id),
        getUpcomingReminders(user.id, 7), // Next 7 days
        getOverdueReminders(user.id),
        getUpcomingDates(user.id, 14), // Next 14 days
      ]);

      if (alertsRes.success) {
        setAlerts(alertsRes.alerts);
      }

      if (messagesRes.success) {
        setUnreadMessageCount(messagesRes.count);
      }

      if (upcomingRes.success) {
        setUpcomingReminders(upcomingRes.reminders.slice(0, 3)); // Show max 3
      }

      if (overdueRes.success) {
        setOverdueReminders(overdueRes.reminders.slice(0, 3)); // Show max 3
      }

      if (datesRes.success) {
        setUpcomingDates(datesRes.dates.slice(0, 3)); // Show max 3
      }
    } catch (error) {
      console.error('[AlertsScreen] Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and focus listener
  useEffect(() => {
    loadAlerts();
    const unsubscribe = navigation.addListener('focus', () => loadAlerts());
    return unsubscribe;
  }, [navigation, loadAlerts]);

  // Handle marking single alert as read
  const handleAlertPress = async (alert) => {
    // Mark as read if unread
    if (!alert.read) {
      await markAlertRead(alert.id);
      setAlerts(prev => prev.map(a =>
        a.id === alert.id ? { ...a, read: true, read_at: new Date().toISOString() } : a
      ));
    }

    // Navigate to contact if available
    if (alert.related_contact_id && alert.contact) {
      // Could navigate to contact detail or open message
      // For now, just mark as read
    }
  };

  // Handle marking all alerts as read
  const handleMarkAllRead = async () => {
    if (!userId) return;

    await markAllAlertsRead(userId);
    setAlerts(prev => prev.map(a => ({ ...a, read: true, read_at: new Date().toISOString() })));
  };

  // Count unread alerts
  const unreadAlertCount = alerts.filter(a => !a.read).length;

  // Handle reminder complete
  const handleReminderComplete = async (reminder) => {
    const result = await completeReminder(reminder.id);
    if (result.success) {
      loadAlerts();
    }
  };

  // Handle reminder dismiss
  const handleReminderDismiss = async (reminder) => {
    const result = await dismissReminder(reminder.id);
    if (result.success) {
      loadAlerts();
    }
  };

  // Handle reminder message - USING EXACT NOTIFICATION LOGIC
  const handleReminderMessage = async (reminder) => {
    console.log('[AlertsScreen] 📱 handleReminderMessage called for:', reminder.title);
    console.log('[AlertsScreen] Contact ID:', reminder.imported_contact_id);
    
    if (!reminder.imported_contact_id) {
      console.warn('[AlertsScreen] ⚠️ No contact linked to this reminder');
      return;
    }
    
    try {
      // Fetch contact directly from database - SAME AS NOTIFICATION HANDLER
      const { data: contactData, error: contactError } = await supabase
        .from('imported_contacts')
        .select('name, phone')
        .eq('id', reminder.imported_contact_id)
        .single();

      if (contactError) {
        console.error('[AlertsScreen] ❌ Failed to fetch contact:', contactError);
        return;
      }

      if (!contactData || !contactData.phone) {
        console.warn('[AlertsScreen] ⚠️ Contact has no phone number');
        return;
      }

      console.log('[AlertsScreen] ✅ Contact loaded:', contactData.name);
      console.log('[AlertsScreen] ✅ Phone:', contactData.phone);

      const phoneNumber = contactData.phone.replace(/[^0-9]/g, '');
      const contactName = contactData.name || 'there';
      
      // Generate pre-populated message based on reminder type
      const message = getPrePopulatedMessage(reminder.reminder_type, contactName);
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:${phoneNumber}&body=${encodedMessage}`;
      
      console.log('[AlertsScreen] 🚀 Opening iMessage with URL:', smsUrl);
      
      try {
        await Linking.openURL(smsUrl);
        console.log('[AlertsScreen] ✅ iMessage opened successfully!');
      } catch (openError) {
        // This is expected - iOS sometimes throws an error even when it works
        console.log('[AlertsScreen] ℹ️ SMS URL triggered (error is normal):', openError.message);
      }
    } catch (err) {
      console.error('[AlertsScreen] ❌ Error in handleReminderMessage:', err);
    }
  };

  // Handle date message - USING EXACT NOTIFICATION LOGIC
  const handleDateMessage = async (dateInfo) => {
    console.log('[AlertsScreen] 🎂 handleDateMessage called for:', dateInfo.date_type);
    console.log('[AlertsScreen] Contact ID:', dateInfo.imported_contact_id);
    
    if (!dateInfo.imported_contact_id) {
      console.warn('[AlertsScreen] ⚠️ No contact linked to this date');
      return;
    }
    
    try {
      // Fetch contact directly from database - SAME AS NOTIFICATION HANDLER
      const { data: contactData, error: contactError } = await supabase
        .from('imported_contacts')
        .select('name, phone')
        .eq('id', dateInfo.imported_contact_id)
        .single();

      if (contactError) {
        console.error('[AlertsScreen] ❌ Failed to fetch contact for date:', contactError);
        return;
      }

      if (!contactData || !contactData.phone) {
        console.warn('[AlertsScreen] ⚠️ Contact has no phone number');
        return;
      }

      console.log('[AlertsScreen] ✅ Contact loaded:', contactData.name);
      console.log('[AlertsScreen] ✅ Phone:', contactData.phone);

      const phoneNumber = contactData.phone.replace(/[^0-9]/g, '');
      const contactName = contactData.name || 'there';
      
      // Generate pre-populated message based on date type
      const message = getPrePopulatedMessage(dateInfo.date_type, contactName);
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:${phoneNumber}&body=${encodedMessage}`;
      
      console.log('[AlertsScreen] 🚀 Opening iMessage for date with URL:', smsUrl);
      
      try {
        await Linking.openURL(smsUrl);
        console.log('[AlertsScreen] ✅ iMessage opened successfully!');
      } catch (openError) {
        // This is expected - iOS sometimes throws an error even when it works
        console.log('[AlertsScreen] ℹ️ SMS URL triggered (error is normal):', openError.message);
      }
    } catch (err) {
      console.error('[AlertsScreen] ❌ Error in handleDateMessage:', err);
    }
  };

  // Calculate days until date
  const getDaysUntilDate = (dateValue) => {
    const today = new Date();
    const thisYear = today.getFullYear();
    const date = new Date(dateValue);
    let nextOccurrence = new Date(thisYear, date.getMonth(), date.getDate());

    if (nextOccurrence < today) {
      nextOccurrence.setFullYear(thisYear + 1);
    }

    const diffTime = nextOccurrence - today;
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntil === 0) return 'Today!';
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  };

  // Check if there are any reminders to show
  const hasReminders = overdueReminders.length > 0 || upcomingReminders.length > 0 || upcomingDates.length > 0;

  // Render individual alert item
  const renderAlert = ({ item: alert }) => {
    const config = ALERT_CONFIG[alert.alert_type] || ALERT_CONFIG.system;
    const color = config.getColor
      ? config.getColor(alert.threshold_crossed)
      : config.color;

    return (
      <TouchableOpacity
        style={[styles.alertItem, !alert.read && styles.alertItemUnread]}
        onPress={() => handleAlertPress(alert)}
        activeOpacity={0.7}
      >
        <View style={[styles.alertIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={config.icon} size={24} color={color} />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertTitle, !alert.read && styles.alertTitleUnread]}>
              {alert.title}
            </Text>
            {!alert.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
          </View>
          {alert.body && (
            <Text style={styles.alertBody} numberOfLines={2}>
              {alert.body}
            </Text>
          )}
          <View style={styles.alertFooter}>
            {alert.contact?.name && (
              <Text style={[styles.alertContact, { color }]}>
                {alert.contact.name}
              </Text>
            )}
            <Text style={styles.alertTime}>
              {formatRelativeTime(alert.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render a reminder item - REBUILT FOR RELIABILITY
  const renderReminderItem = (reminder, isOverdue = false) => {
    const dueInfo = formatDueDate(reminder.due_date);
    const icon = getReminderIcon(reminder.reminder_type);
    const color = isOverdue ? '#FF6B6B' : getReminderColor(reminder);
    const contactName = reminder.imported_contacts?.name || reminder.contact_name || 'Contact';
    const hasContactId = !!reminder.imported_contact_id;

    // Handler for icon press - Fetches contact on demand
    const handleIconPress = () => {
      console.log('='.repeat(50));
      console.log('[AlertsScreen] 🔵 BLUE ICON PRESSED!');
      console.log('[AlertsScreen] Reminder:', reminder.title);
      console.log('[AlertsScreen] Type:', reminder.reminder_type);
      console.log('[AlertsScreen] Contact ID:', reminder.imported_contact_id);
      console.log('='.repeat(50));
      
      // Call the message handler which fetches contact directly
      handleReminderMessage(reminder);
    };

    return (
      <View key={reminder.id} style={styles.reminderItem} pointerEvents="box-none">
        {/* BLUE ICON - ALWAYS TAPPABLE IF HAS CONTACT ID */}
        {hasContactId ? (
          <TouchableOpacity
            style={[styles.reminderIconButton, { backgroundColor: `${color}20` }]}
            onPress={handleIconPress}
            activeOpacity={0.5}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name={icon} size={20} color={color} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.reminderIconButton, { backgroundColor: `${color}20`, opacity: 0.5 }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
        )}

        {/* TEXT CONTENT */}
        <View style={styles.reminderContent} pointerEvents="none">
          <Text style={styles.reminderTitle} numberOfLines={1}>{reminder.title}</Text>
          <Text style={[styles.reminderDue, isOverdue && styles.reminderDueOverdue]}>
            {dueInfo.label}
            {contactName && ` • ${contactName}`}
          </Text>
        </View>

        {/* CHECKMARK BUTTON */}
        <TouchableOpacity
          style={styles.reminderCheckButton}
          onPress={() => {
            console.log('[AlertsScreen] ✅ Checkmark pressed for:', reminder.title);
            handleReminderComplete(reminder);
          }}
          activeOpacity={0.5}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="checkmark-circle-outline" size={24} color="#4FFFB0" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render a date item (birthday/anniversary) - REBUILT FOR RELIABILITY
  const renderDateItem = (dateInfo) => {
    const isBirthday = dateInfo.date_type === 'birthday';
    const icon = isBirthday ? 'gift-outline' : 'heart-outline';
    const color = isBirthday ? '#FF6B6B' : '#FF8C42';
    const contactName = dateInfo.imported_contacts?.name || dateInfo.contact_name || 'Contact';
    const dueLabel = getDaysUntilDate(dateInfo.date_value);
    const hasContactId = !!dateInfo.imported_contact_id;

    // Handler for icon press - Fetches contact on demand
    const handleIconPress = () => {
      console.log('='.repeat(50));
      console.log(`[AlertsScreen] ${isBirthday ? '🎂' : '💝'} DATE ICON PRESSED!`);
      console.log('[AlertsScreen] Contact:', contactName);
      console.log('[AlertsScreen] Type:', dateInfo.date_type);
      console.log('[AlertsScreen] Contact ID:', dateInfo.imported_contact_id);
      console.log('='.repeat(50));
      
      // Call the date message handler which fetches contact directly
      handleDateMessage(dateInfo);
    };

    return (
      <View key={dateInfo.id} style={styles.reminderItem} pointerEvents="box-none">
        {/* DATE ICON - ALWAYS TAPPABLE IF HAS CONTACT ID */}
        {hasContactId ? (
          <TouchableOpacity
            style={[styles.reminderIconButton, { backgroundColor: `${color}20` }]}
            onPress={handleIconPress}
            activeOpacity={0.5}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name={icon} size={20} color={color} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.reminderIconButton, { backgroundColor: `${color}20`, opacity: 0.5 }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
        )}

        {/* TEXT CONTENT */}
        <View style={styles.reminderContent} pointerEvents="none">
          <Text style={styles.reminderTitle} numberOfLines={1}>
            {contactName}'s {isBirthday ? 'Birthday' : 'Anniversary'}
          </Text>
          <Text style={[styles.reminderDue, dueLabel === 'Today!' && styles.reminderDueOverdue]}>
            {dueLabel}
          </Text>
        </View>

        {/* MESSAGE BUTTON - ALWAYS TAPPABLE IF HAS CONTACT ID */}
        {hasContactId ? (
          <TouchableOpacity
            style={styles.reminderCheckButton}
            onPress={handleIconPress}
            activeOpacity={0.5}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#4FFFB0" />
          </TouchableOpacity>
        ) : (
          <View style={styles.reminderCheckButton}>
            <Ionicons name="chatbubble-outline" size={22} color="#666666" />
          </View>
        )}
      </View>
    );
  };

  // Render reminders section
  const renderRemindersSection = () => {
    if (!hasReminders) return null;

    return (
      <View style={styles.remindersSection}>
        <View style={styles.remindersSectionHeader}>
          <View style={styles.remindersTitleRow}>
            <Ionicons name="calendar" size={18} color="#4FFFB0" />
            <Text style={styles.remindersSectionTitle}>Reminders</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Reminders')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Overdue reminders */}
        {overdueReminders.length > 0 && (
          <View style={styles.overdueSection}>
            <Text style={styles.overdueLabel}>OVERDUE</Text>
            {overdueReminders.map(r => renderReminderItem(r, true))}
          </View>
        )}

        {/* Upcoming dates (birthdays/anniversaries) */}
        {upcomingDates.length > 0 && (
          <View style={styles.datesSection}>
            {upcomingDates.map(d => renderDateItem(d))}
          </View>
        )}

        {/* Upcoming reminders */}
        {upcomingReminders.length > 0 && (
          <View style={styles.upcomingSection}>
            {upcomingReminders.map(r => renderReminderItem(r, false))}
          </View>
        )}
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={48} color="#4FFFB0" />
      <Text style={styles.emptyTitle}>No alerts yet</Text>
      <Text style={styles.emptyText}>
        When contacts need attention or relationships start cooling, you'll see alerts here.
      </Text>
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
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Alerts</Text>
            {unreadAlertCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadAlertCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
              {unreadMessageCount > 0 && (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>
                    {unreadMessageCount > 99 ? '99+' : String(unreadMessageCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {unreadAlertCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Ionicons name="checkmark-done" size={24} color="#4FFFB0" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FFFB0" />
            <Text style={styles.loadingText}>Loading alerts...</Text>
          </View>
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.id}
            renderItem={renderAlert}
            ListHeaderComponent={renderRemindersSection}
            ListEmptyComponent={!hasReminders ? renderEmpty : null}
            contentContainerStyle={alerts.length === 0 && !hasReminders ? styles.emptyList : styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadAlerts(true)}
                tintColor="#4FFFB0"
                colors={['#4FFFB0']}
              />
            }
          />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 10,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  alertItemUnread: {
    backgroundColor: 'rgba(79, 255, 176, 0.05)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  alertIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    justifyContent: 'center',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  alertTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertBody: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  alertContact: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertTime: {
    color: '#999999',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: '#ffffff',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  // Reminders section styles
  remindersSection: {
    backgroundColor: 'rgba(79, 255, 176, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.15)',
  },
  remindersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  remindersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remindersSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 13,
    color: '#4FFFB0',
    fontWeight: '500',
  },
  overdueSection: {
    marginBottom: 8,
  },
  overdueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  datesSection: {
    gap: 8,
  },
  upcomingSection: {
    gap: 8,
    marginTop: 8,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  reminderIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
    paddingVertical: 4,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  reminderDue: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  reminderDueOverdue: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  reminderCheckButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderAction: {
    padding: 4,
  },
});
