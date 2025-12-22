import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';
import {
  scheduleReminderNotification,
  cancelScheduledNotification,
  scheduleBirthdayNotification,
  scheduleImmediateNotification,
} from '../notifications/pushNotifications';

/**
 * Create a new reminder
 * @param {string} userId - User ID
 * @param {object} reminder - Reminder data
 * @returns {Promise<{success: boolean, reminder: object|null, error?: string}>}
 */
export async function createReminder(userId, {
  contactId = null,
  reminderType = 'custom',
  title,
  note = null,
  dueDate,
  repeatInterval = 'none',
}) {
  try {
    if (!userId || !title || !dueDate) {
      return { success: false, reminder: null, error: 'Missing required fields' };
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        imported_contact_id: contactId,
        reminder_type: reminderType,
        title,
        note,
        due_date: new Date(dueDate).toISOString(),
        repeat_interval: repeatInterval,
      })
      .select()
      .single();

    if (error) {
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        console.warn('[REMINDERS] reminders table not found - run Phase 4 migration');
        return { success: false, reminder: null, error: 'Migration required' };
      }
      throw error;
    }

    console.log('[REMINDERS] ✅ Reminder created:', data.id);

    // Schedule push notification for this reminder
    let scheduledSuccessfully = false;
    try {
      const scheduleResult = await scheduleReminderNotification(data);
      scheduledSuccessfully = scheduleResult.success;
      
      if (scheduleResult.success) {
        console.log('[REMINDERS] ✅ Scheduled notification for:', new Date(dueDate).toLocaleString());
      } else {
        console.warn('[REMINDERS] ⚠️ Failed to schedule notification:', scheduleResult.error);
      }
    } catch (notifError) {
      console.warn('[REMINDERS] ⚠️ Notification error:', notifError);
    }

    // Show immediate confirmation notification
    try {
      const dueDateTime = new Date(dueDate);
      const now = new Date();
      const hoursUntil = Math.round((dueDateTime - now) / (1000 * 60 * 60));
      const minutesUntil = Math.round((dueDateTime - now) / (1000 * 60));
      
      let timeText = '';
      if (minutesUntil < 60) {
        timeText = `in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
      } else if (hoursUntil < 24) {
        timeText = `in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
      } else {
        const days = Math.round(hoursUntil / 24);
        timeText = `in ${days} day${days !== 1 ? 's' : ''}`;
      }
      
      const confirmResult = await scheduleImmediateNotification(
        "Reminder Set! ✓",
        scheduledSuccessfully 
          ? `You'll be reminded ${timeText}: ${title}` 
          : `Reminder saved: ${title}`,
        { type: 'reminder_confirmation' }
      );
      
      if (confirmResult.success) {
        console.log('[REMINDERS] ✅ Immediate confirmation notification sent');
      } else {
        console.warn('[REMINDERS] ⚠️ Failed to send confirmation:', confirmResult.error);
      }
    } catch (confirmError) {
      console.warn('[REMINDERS] ⚠️ Failed to send confirmation:', confirmError);
      // Don't fail the operation if confirmation fails
    }

    return { success: true, reminder: data };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to create reminder:', JSON.stringify(error, null, 2));
    return { success: false, reminder: null, error: error?.message || 'Unknown error' };
  }
}

/**
 * Get all reminders for a user
 * @param {string} userId - User ID
 * @param {object} options - Filter options
 * @returns {Promise<{success: boolean, reminders: Array, error?: string}>}
 */
export async function getReminders(userId, {
  includeCompleted = false,
  includeDismissed = false,
  contactId = null,
  limit = 50,
} = {}) {
  try {
    if (!userId) {
      return { success: false, reminders: [], error: 'Missing userId' };
    }

    let query = supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
      .limit(limit);

    if (!includeCompleted) {
      query = query.eq('is_completed', false);
    }

    if (!includeDismissed) {
      query = query.eq('is_dismissed', false);
    }

    if (contactId) {
      query = query.eq('imported_contact_id', contactId);
    }

    const { data, error } = await query;

    if (error) {
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        console.warn('[REMINDERS] reminders table not found');
        return { success: true, reminders: [] };
      }
      throw error;
    }

    return { success: true, reminders: data || [] };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to get reminders:', error);
    return { success: false, reminders: [], error: error?.message };
  }
}

/**
 * Get upcoming reminders (due within X days)
 * @param {string} userId - User ID
 * @param {number} daysAhead - Number of days to look ahead
 * @returns {Promise<{success: boolean, reminders: Array, error?: string}>}
 */
export async function getUpcomingReminders(userId, daysAhead = 7) {
  try {
    if (!userId) {
      return { success: false, reminders: [], error: 'Missing userId' };
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Try to load with contact data first
    let { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        imported_contacts (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('user_id', userId)
      .eq('is_completed', false)
      .eq('is_dismissed', false)
      .lte('due_date', futureDate.toISOString())
      .order('due_date', { ascending: true });

    // If the join fails, fall back to basic query and manually fetch contacts
    if (error) {
      console.warn('[REMINDERS] Contact join failed, falling back to basic query:', error.message);
      const fallback = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .eq('is_dismissed', false)
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true });
      
      if (fallback.error) {
        const errMsg = fallback.error.message?.toLowerCase() || '';
        if (fallback.error.code === '42P01' || errMsg.includes('does not exist')) {
          return { success: true, reminders: [] };
        }
        throw fallback.error;
      }
      
      data = fallback.data;
      
      // Manually fetch contact data for each reminder
      if (data && data.length > 0) {
        console.log('[REMINDERS] Manually fetching contact data for', data.length, 'reminders');
        const contactIds = data.map(r => r.imported_contact_id).filter(Boolean);
        
        if (contactIds.length > 0) {
          const { data: contacts } = await supabase
            .from('imported_contacts')
            .select('id, name, phone, email')
            .in('id', contactIds);
          
          // Map contacts back to reminders
          if (contacts) {
            data = data.map(reminder => {
              const contact = contacts.find(c => c.id === reminder.imported_contact_id);
              return {
                ...reminder,
                imported_contacts: contact || null,
              };
            });
          }
        }
      }
    }

    console.log('[REMINDERS] ✅ Loaded', data?.length || 0, 'upcoming reminders');
    if (data && data.length > 0) {
      console.log('[REMINDERS] Sample reminder:', {
        id: data[0].id,
        title: data[0].title,
        contactId: data[0].imported_contact_id,
        hasContact: !!data[0].imported_contacts,
        contactPhone: data[0].imported_contacts?.phone,
      });
    }
    return { success: true, reminders: data || [] };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to get upcoming reminders:', error);
    return { success: false, reminders: [], error: error?.message };
  }
}

/**
 * Get overdue reminders
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, reminders: Array, error?: string}>}
 */
export async function getOverdueReminders(userId) {
  try {
    if (!userId) {
      return { success: false, reminders: [], error: 'Missing userId' };
    }

    const now = new Date().toISOString();

    // Try to load with contact data first
    let { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        imported_contacts (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('user_id', userId)
      .eq('is_completed', false)
      .eq('is_dismissed', false)
      .lt('due_date', now)
      .order('due_date', { ascending: true});

    // If the join fails, fall back to basic query and manually fetch contacts
    if (error) {
      console.warn('[REMINDERS] Contact join failed for overdue, falling back:', error.message);
      const fallback = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .eq('is_dismissed', false)
        .lt('due_date', now)
        .order('due_date', { ascending: true });
      
      if (fallback.error) {
        const errMsg = fallback.error.message?.toLowerCase() || '';
        if (fallback.error.code === '42P01' || errMsg.includes('does not exist')) {
          return { success: true, reminders: [] };
        }
        throw fallback.error;
      }
      
      data = fallback.data;
      
      // Manually fetch contact data for each reminder
      if (data && data.length > 0) {
        console.log('[REMINDERS] Manually fetching contact data for', data.length, 'overdue reminders');
        const contactIds = data.map(r => r.imported_contact_id).filter(Boolean);
        
        if (contactIds.length > 0) {
          const { data: contacts } = await supabase
            .from('imported_contacts')
            .select('id, name, phone, email')
            .in('id', contactIds);
          
          // Map contacts back to reminders
          if (contacts) {
            data = data.map(reminder => {
              const contact = contacts.find(c => c.id === reminder.imported_contact_id);
              return {
                ...reminder,
                imported_contacts: contact || null,
              };
            });
          }
        }
      }
    }

    console.log('[REMINDERS] ✅ Loaded', data?.length || 0, 'overdue reminders');
    return { success: true, reminders: data || [] };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to get overdue reminders:', error);
    return { success: false, reminders: [], error: error?.message };
  }
}

/**
 * Mark a reminder as completed
 * @param {string} reminderId - Reminder ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function completeReminder(reminderId) {
  try {
    if (!reminderId) {
      return { success: false, error: 'Missing reminderId' };
    }

    // Get the reminder first to check for notification_id
    const { data: reminder } = await supabase
      .from('reminders')
      .select('notification_id')
      .eq('id', reminderId)
      .single();

    // Cancel any scheduled notification
    if (reminder?.notification_id) {
      await cancelScheduledNotification(reminder.notification_id);
    }

    const { error } = await supabase
      .from('reminders')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    if (error) throw error;

    console.log('[REMINDERS] ✅ Reminder completed:', reminderId);
    return { success: true };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to complete reminder:', error);
    return { success: false, error: error?.message };
  }
}

/**
 * Dismiss a reminder (hide without completing)
 * @param {string} reminderId - Reminder ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function dismissReminder(reminderId) {
  try {
    if (!reminderId) {
      return { success: false, error: 'Missing reminderId' };
    }

    // Get the reminder first to check for notification_id
    const { data: reminder } = await supabase
      .from('reminders')
      .select('notification_id')
      .eq('id', reminderId)
      .single();

    // Cancel any scheduled notification
    if (reminder?.notification_id) {
      await cancelScheduledNotification(reminder.notification_id);
    }

    const { error } = await supabase
      .from('reminders')
      .update({
        is_dismissed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    if (error) throw error;

    console.log('[REMINDERS] ✅ Reminder dismissed:', reminderId);
    return { success: true };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to dismiss reminder:', error);
    return { success: false, error: error?.message };
  }
}

/**
 * Delete a reminder
 * @param {string} reminderId - Reminder ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteReminder(reminderId) {
  try {
    if (!reminderId) {
      return { success: false, error: 'Missing reminderId' };
    }

    // Get the reminder first to check for notification_id
    const { data: reminder } = await supabase
      .from('reminders')
      .select('notification_id')
      .eq('id', reminderId)
      .single();

    // Cancel any scheduled notification
    if (reminder?.notification_id) {
      await cancelScheduledNotification(reminder.notification_id);
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId);

    if (error) throw error;

    console.log('[REMINDERS] ✅ Reminder deleted:', reminderId);
    return { success: true };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to delete reminder:', error);
    return { success: false, error: error?.message };
  }
}

/**
 * Update a reminder
 * @param {string} reminderId - Reminder ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, reminder: object|null, error?: string}>}
 */
export async function updateReminder(reminderId, updates) {
  try {
    if (!reminderId) {
      return { success: false, reminder: null, error: 'Missing reminderId' };
    }

    const { data, error } = await supabase
      .from('reminders')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;

    console.log('[REMINDERS] ✅ Reminder updated:', reminderId);
    return { success: true, reminder: data };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to update reminder:', error);
    return { success: false, reminder: null, error: error?.message };
  }
}

// ============= CONTACT DATES (Birthdays, Anniversaries) =============

/**
 * Save a contact date (birthday, anniversary, etc.)
 * @param {string} userId - User ID
 * @param {string} contactId - Contact ID
 * @param {string} dateType - Type of date (birthday, anniversary, custom)
 * @param {Date|string} dateValue - The date
 * @param {string} label - Optional label for custom dates
 * @returns {Promise<{success: boolean, contactDate: object|null, error?: string}>}
 */
export async function saveContactDate(userId, contactId, dateType, dateValue, label = null) {
  try {
    if (!userId || !contactId || !dateType || !dateValue) {
      return { success: false, contactDate: null, error: 'Missing required fields' };
    }

    // Format date as YYYY-MM-DD
    const date = new Date(dateValue);
    const formattedDate = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('contact_dates')
      .upsert({
        user_id: userId,
        imported_contact_id: contactId,
        date_type: dateType,
        date_value: formattedDate,
        label: label,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,imported_contact_id,date_type' })
      .select()
      .single();

    if (error) {
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        console.warn('[REMINDERS] contact_dates table not found');
        return { success: false, contactDate: null, error: 'Migration required' };
      }
      throw error;
    }

    console.log('[REMINDERS] ✅ Contact date saved:', dateType, formattedDate);
    return { success: true, contactDate: data };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to save contact date:', error);
    return { success: false, contactDate: null, error: error?.message };
  }
}

/**
 * Get all dates for a contact
 * @param {string} userId - User ID
 * @param {string} contactId - Contact ID
 * @returns {Promise<{success: boolean, dates: Array, error?: string}>}
 */
export async function getContactDates(userId, contactId) {
  try {
    if (!userId || !contactId) {
      return { success: false, dates: [], error: 'Missing required fields' };
    }

    const { data, error } = await supabase
      .from('contact_dates')
      .select('*')
      .eq('user_id', userId)
      .eq('imported_contact_id', contactId);

    if (error) {
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        return { success: true, dates: [] };
      }
      throw error;
    }

    return { success: true, dates: data || [] };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to get contact dates:', error);
    return { success: false, dates: [], error: error?.message };
  }
}

/**
 * Get upcoming birthdays and anniversaries
 * @param {string} userId - User ID
 * @param {number} daysAhead - Number of days to look ahead
 * @returns {Promise<{success: boolean, dates: Array, error?: string}>}
 */
export async function getUpcomingDates(userId, daysAhead = 30) {
  try {
    if (!userId) {
      return { success: false, dates: [], error: 'Missing userId' };
    }

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Get all contact dates for this user with contact info
    let { data, error } = await supabase
      .from('contact_dates')
      .select(`
        *,
        imported_contacts (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('user_id', userId);

    // If the join fails, fall back to basic query
    if (error) {
      console.warn('[REMINDERS] Contact join failed for dates, falling back:', error.message);
      const fallback = await supabase
        .from('contact_dates')
        .select('*')
        .eq('user_id', userId);
      
      if (fallback.error) {
        const errMsg = fallback.error.message?.toLowerCase() || '';
        if (fallback.error.code === '42P01' || errMsg.includes('does not exist')) {
          return { success: true, dates: [] };
        }
        throw fallback.error;
      }
      
      data = fallback.data;
    }

    // Filter to upcoming dates (considering year wrap-around for birthdays)
    const upcoming = (data || []).filter(d => {
      const dateValue = new Date(d.date_value);
      const month = dateValue.getMonth() + 1;
      const day = dateValue.getDate();

      // Calculate days until this date (ignoring year)
      let daysUntil;
      const thisYearDate = new Date(today.getFullYear(), month - 1, day);

      if (thisYearDate >= today) {
        daysUntil = Math.floor((thisYearDate - today) / (1000 * 60 * 60 * 24));
      } else {
        // Date has passed this year, check next year
        const nextYearDate = new Date(today.getFullYear() + 1, month - 1, day);
        daysUntil = Math.floor((nextYearDate - today) / (1000 * 60 * 60 * 24));
      }

      return daysUntil <= daysAhead;
    }).map(d => {
      const dateValue = new Date(d.date_value);
      const month = dateValue.getMonth() + 1;
      const day = dateValue.getDate();

      const thisYearDate = new Date(today.getFullYear(), month - 1, day);
      let daysUntil;

      if (thisYearDate >= today) {
        daysUntil = Math.floor((thisYearDate - today) / (1000 * 60 * 60 * 24));
      } else {
        const nextYearDate = new Date(today.getFullYear() + 1, month - 1, day);
        daysUntil = Math.floor((nextYearDate - today) / (1000 * 60 * 60 * 24));
      }

      return {
        ...d,
        daysUntil,
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    console.log('[REMINDERS] ✅ Loaded', upcoming.length, 'upcoming dates with contact data');
    return { success: true, dates: upcoming };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to get upcoming dates:', error);
    return { success: false, dates: [], error: error?.message };
  }
}

/**
 * Delete a contact date
 * @param {string} dateId - Contact date ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteContactDate(dateId) {
  try {
    if (!dateId) {
      return { success: false, error: 'Missing dateId' };
    }

    const { error } = await supabase
      .from('contact_dates')
      .delete()
      .eq('id', dateId);

    if (error) throw error;

    console.log('[REMINDERS] ✅ Contact date deleted:', dateId);
    return { success: true };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to delete contact date:', error);
    return { success: false, error: error?.message };
  }
}

/**
 * Get reminder count (for badges)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
export async function getPendingReminderCount(userId) {
  try {
    if (!userId) {
      return { success: false, count: 0, error: 'Missing userId' };
    }

    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);

    const { data, error } = await supabase
      .from('reminders')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_completed', false)
      .eq('is_dismissed', false)
      .lte('due_date', weekAhead.toISOString());

    if (error) {
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        return { success: true, count: 0 };
      }
      throw error;
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('[REMINDERS] ❌ Failed to get reminder count:', error);
    return { success: false, count: 0, error: error?.message };
  }
}

/**
 * Format due date for display
 * @param {Date|string} dueDate - The due date
 * @returns {string} Formatted string like "Today", "Tomorrow", "In 3 days", "Dec 25"
 */
export function formatDueDate(dueDate) {
  const date = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((dueDateStart - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) return 'Yesterday';
    return `${absDays} days ago`;
  }
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;

  // Format as month day
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Get icon for reminder type
 * @param {string} reminderType - Type of reminder
 * @returns {string} Ionicons icon name
 */
export function getReminderIcon(reminderType) {
  switch (reminderType) {
    case 'birthday': return 'gift';
    case 'anniversary': return 'heart';
    case 'follow_up': return 'chatbubble';
    case 'reconnect': return 'people';
    default: return 'notifications';
  }
}

/**
 * Get color for reminder type
 * @param {string} reminderType - Type of reminder
 * @returns {string} Hex color
 */
export function getReminderColor(reminderType) {
  switch (reminderType) {
    case 'birthday': return '#FF6B9D';
    case 'anniversary': return '#FF6B6B';
    case 'follow_up': return '#4FFFB0';
    case 'reconnect': return '#FFD93D';
    default: return '#4F9FFF';
  }
}
