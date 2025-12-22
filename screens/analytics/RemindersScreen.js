import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../../utils/storage/supabaseStorage';
import {
  getUpcomingReminders,
  getOverdueReminders,
  completeReminder,
  dismissReminder,
  deleteReminder,
  getUpcomingDates,
} from '../../utils/storage/remindersStorage';
import ReminderCard, { DateReminderCard } from '../../components/ReminderCard';
import AddReminderModal from '../../components/modals/AddReminderModal';

export default function RemindersScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'dates'

  const loadReminders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const { success, user } = await getCurrentUser();
      if (!success || !user) {
        console.log('[RemindersScreen] No user found');
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Load all data in parallel
      const [overdueResult, upcomingResult, datesResult] = await Promise.all([
        getOverdueReminders(user.id),
        getUpcomingReminders(user.id, 30), // Next 30 days
        getUpcomingDates(user.id, 30),
      ]);

      if (overdueResult.success) {
        setOverdueReminders(overdueResult.reminders);
      }
      if (upcomingResult.success) {
        setUpcomingReminders(upcomingResult.reminders);
      }
      if (datesResult.success) {
        setUpcomingDates(datesResult.dates);
      }
    } catch (error) {
      console.error('[RemindersScreen] Error loading reminders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();

    const unsubscribe = navigation.addListener('focus', () => {
      loadReminders(false);
    });

    return unsubscribe;
  }, [navigation, loadReminders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReminders(false);
  }, [loadReminders]);

  const handleReminderPress = (reminder) => {
    // Navigate to contact if linked
    if (reminder.imported_contact_id) {
      navigation.navigate('Profile', { contactId: reminder.imported_contact_id });
    }
  };

  const handleComplete = async (reminder) => {
    const result = await completeReminder(reminder.id);
    if (result.success) {
      loadReminders(false);
    }
  };

  const handleDismiss = async (reminder) => {
    Alert.alert(
      'Dismiss Reminder',
      'Are you sure you want to dismiss this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            const result = await dismissReminder(reminder.id);
            if (result.success) {
              loadReminders(false);
            }
          },
        },
      ]
    );
  };

  const handleDatePress = (dateInfo) => {
    if (dateInfo.imported_contact_id) {
      navigation.navigate('Profile', { contactId: dateInfo.imported_contact_id });
    }
  };

  // Generate pre-populated message based on reminder type
  const getPrePopulatedMessage = (reminderType, contactName) => {
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
  };

  // Handle reminder message
  const handleReminderMessage = (reminder) => {
    console.log('[RemindersScreen] handleReminderMessage called for:', reminder.title);
    const phone = reminder.imported_contacts?.phone;
    const contactName = reminder.imported_contacts?.name || reminder.imported_contacts?.display_name || 'there';
    console.log('[RemindersScreen] Contact phone:', phone, 'name:', contactName);
    if (phone) {
      const phoneNumber = phone.replace(/[^0-9]/g, '');
      const message = getPrePopulatedMessage(reminder.reminder_type, contactName);
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:${phoneNumber}&body=${encodedMessage}`;
      console.log('[RemindersScreen] Opening SMS URL:', smsUrl);
      Linking.openURL(smsUrl).catch(err => {
        console.error('[RemindersScreen] Failed to open SMS:', err);
      });
    } else {
      console.warn('[RemindersScreen] No phone number available for reminder');
    }
  };

  // Handle date message
  const handleDateMessage = (dateInfo) => {
    const phone = dateInfo.imported_contacts?.phone;
    const contactName = dateInfo.imported_contacts?.name || dateInfo.imported_contacts?.display_name || 'there';
    if (phone) {
      const phoneNumber = phone.replace(/[^0-9]/g, '');
      const message = getPrePopulatedMessage(dateInfo.date_type, contactName);
      const encodedMessage = encodeURIComponent(message);
      Linking.openURL(`sms:${phoneNumber}&body=${encodedMessage}`);
    }
  };

  const handleAddReminder = () => {
    setShowAddModal(true);
  };

  const handleReminderSaved = () => {
    loadReminders(false);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={48} color="#666666" />
      <Text style={styles.emptyTitle}>No Reminders</Text>
      <Text style={styles.emptyText}>
        Create reminders to stay on top of birthdays, follow-ups, and more
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddReminder}>
        <Ionicons name="add" size={20} color="#000000" />
        <Text style={styles.emptyButtonText}>Add Reminder</Text>
      </TouchableOpacity>
    </View>
  );

  const hasReminders = overdueReminders.length > 0 || upcomingReminders.length > 0;
  const hasDates = upcomingDates.length > 0;
  const hasAnyContent = hasReminders || hasDates;

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a2e1a', '#05140a', '#000000']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FFFB0" />
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

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
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reminders</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddReminder}
          >
            <Ionicons name="add" size={24} color="#4FFFB0" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dates' && styles.tabActive]}
            onPress={() => setActiveTab('dates')}
          >
            <Text style={[styles.tabText, activeTab === 'dates' && styles.tabTextActive]}>
              Dates
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4FFFB0"
              colors={['#4FFFB0']}
            />
          }
        >
          {!hasAnyContent ? (
            renderEmptyState()
          ) : (
            <>
              {/* Overdue Section */}
              {(activeTab === 'all' || activeTab === 'upcoming') && overdueReminders.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                    <Text style={styles.sectionTitleOverdue}>
                      OVERDUE ({overdueReminders.length})
                    </Text>
                  </View>
                  <View style={styles.remindersList}>
                    {overdueReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onPress={handleReminderPress}
                        onComplete={handleComplete}
                        onDismiss={handleDismiss}
                        onMessage={handleReminderMessage}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Upcoming Reminders Section */}
              {(activeTab === 'all' || activeTab === 'upcoming') && upcomingReminders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>UPCOMING</Text>
                  <View style={styles.remindersList}>
                    {upcomingReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onPress={handleReminderPress}
                        onComplete={handleComplete}
                        onDismiss={handleDismiss}
                        onMessage={handleReminderMessage}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Upcoming Dates Section */}
              {(activeTab === 'all' || activeTab === 'dates') && upcomingDates.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="gift-outline" size={18} color="#FF6B6B" />
                    <Text style={styles.sectionTitle}>BIRTHDAYS & DATES</Text>
                  </View>
                  <View style={styles.remindersList}>
                    {upcomingDates.map((dateInfo) => (
                      <DateReminderCard
                        key={dateInfo.id}
                        dateInfo={dateInfo}
                        onPress={handleDatePress}
                        onMessage={handleDateMessage}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Empty state for filtered tabs */}
              {activeTab === 'upcoming' && !hasReminders && (
                <View style={styles.emptyStateSmall}>
                  <Text style={styles.emptyTextSmall}>No upcoming reminders</Text>
                </View>
              )}

              {activeTab === 'dates' && !hasDates && (
                <View style={styles.emptyStateSmall}>
                  <Text style={styles.emptyTextSmall}>No upcoming dates</Text>
                  <Text style={styles.emptyHint}>
                    Add birthdays and anniversaries to contacts to see them here
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </LinearGradient>

      {/* Add Reminder Modal */}
      <AddReminderModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleReminderSaved}
        userId={userId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    borderColor: '#4FFFB0',
  },
  tabText: {
    fontSize: 13,
    color: '#888888',
  },
  tabTextActive: {
    color: '#4FFFB0',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 1,
    marginLeft: 6,
  },
  sectionTitleOverdue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    letterSpacing: 1,
    marginLeft: 6,
  },
  remindersList: {
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4FFFB0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
  },
  emptyStateSmall: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTextSmall: {
    fontSize: 14,
    color: '#888888',
  },
  emptyHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomSpacer: {
    height: 40,
  },
});
