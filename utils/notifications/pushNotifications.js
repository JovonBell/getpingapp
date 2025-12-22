import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification channel for Android
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4FFFB0',
  });

  Notifications.setNotificationChannelAsync('daily-digest', {
    name: 'Daily Digest',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  Notifications.setNotificationChannelAsync('achievements', {
    name: 'Achievements',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function registerForPushNotificationsAsync(userId) {
  try {
    if (!userId) return { success: false, error: 'Missing userId' };
    if (!Device.isDevice) return { success: false, error: 'Push notifications require a physical device.' };

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { success: false, error: 'Notification permissions not granted.' };
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const expoPushToken = tokenRes?.data;
    if (!expoPushToken) return { success: false, error: 'Failed to get Expo push token.' };

    await supabase.from('device_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: expoPushToken,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,expo_push_token' }
    );

    return { success: true, expoPushToken };
  } catch (error) {
    console.warn('registerForPushNotificationsAsync failed:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

export async function fetchRecipientPushTokens(userId) {
  try {
    const { data, error } = await supabase
      .from('device_tokens')
      .select('expo_push_token')
      .eq('user_id', userId);
    if (error) throw error;
    return { success: true, tokens: (data || []).map((r) => r.expo_push_token).filter(Boolean) };
  } catch (error) {
    console.warn('fetchRecipientPushTokens failed:', error?.message || error);
    return { success: false, error: error?.message || String(error), tokens: [] };
  }
}

export async function sendExpoPush(tokens, { title, body, data }) {
  try {
    const list = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
    if (list.length === 0) return { success: true, sent: 0 };

    const messages = list.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    // Client-side push send (fastest). For production hardening, move to a Supabase Edge Function.
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const json = await res.json();
    return { success: true, response: json, sent: messages.length };
  } catch (error) {
    console.warn('sendExpoPush failed:', error?.message || error);
    return { success: false, error: error?.message || String(error), sent: 0 };
  }
}

// ============================================
// LOCAL NOTIFICATION SCHEDULING
// ============================================

/**
 * Schedule a local notification for a reminder
 * @param {object} reminder - Reminder object with id, title, due_date, contact info
 * @returns {object} - { success, notificationId, error }
 */
export async function scheduleReminderNotification(reminder) {
  try {
    if (!reminder || !reminder.due_date) {
      console.error('[Notifications] ❌ Invalid reminder - missing due_date');
      return { success: false, error: 'Invalid reminder' };
    }

    const dueDate = new Date(reminder.due_date);
    const now = new Date();

    console.log('[Notifications] 📅 Scheduling reminder for:', dueDate.toLocaleString());
    console.log('[Notifications] ⏰ Current time:', now.toLocaleString());

    // Don't schedule if in the past
    if (dueDate <= now) {
      console.log('[Notifications] ⚠️ Reminder is in the past, skipping schedule');
      return { success: true, notificationId: null, skipped: true };
    }

    // Calculate seconds until due
    const secondsUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / 1000);
    const minutesUntilDue = Math.round(secondsUntilDue / 60);
    const hoursUntilDue = Math.round(secondsUntilDue / 3600);

    console.log('[Notifications] ⏳ Time until reminder:', {
      seconds: secondsUntilDue,
      minutes: minutesUntilDue,
      hours: hoursUntilDue,
    });

    const notificationContent = {
      title: getReminderTitle(reminder),
      body: reminder.title || 'Time to reach out!',
      data: {
        type: 'reminder',
        reminderId: reminder.id,
        contactId: reminder.imported_contact_id,
        contactName: reminder.contact_name,
      },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    };

    console.log('[Notifications] 📤 Scheduling with content:', notificationContent.title);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        type: 'timeInterval',
        seconds: secondsUntilDue,
        repeats: false,
      },
    });

    console.log('[Notifications] ✅ Successfully scheduled! ID:', notificationId);
    console.log('[Notifications] 🔔 You will be notified in', minutesUntilDue, 'minutes');

    // Store notification ID in database for later cancellation
    await supabase
      .from('reminders')
      .update({ notification_id: notificationId })
      .eq('id', reminder.id);

    return { success: true, notificationId, secondsUntilDue, dueDate: dueDate.toISOString() };
  } catch (error) {
    console.error('[Notifications] ❌ Failed to schedule reminder:', error);
    console.error('[Notifications] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.slice(0, 200),
    });
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - The notification identifier
 */
export async function cancelScheduledNotification(notificationId) {
  try {
    if (!notificationId) return { success: true };
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Notifications] Cancelled notification:', notificationId);
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Failed to cancel notification:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Schedule daily digest notification
 * @param {number} hour - Hour to send (0-23), default 9am
 * @param {number} minute - Minute to send (0-59), default 0
 */
export async function scheduleDailyDigest(hour = 9, minute = 0) {
  try {
    // Cancel any existing daily digest
    await cancelDailyDigest();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "ping! Daily Check-in",
        body: "See who needs your attention today",
        data: {
          type: 'daily_digest',
        },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'daily-digest' }),
      },
      trigger: {
        type: 'calendar',
        hour,
        minute,
        repeats: true,
      },
    });

    console.log('[Notifications] Scheduled daily digest at', hour + ':' + minute);
    return { success: true, notificationId };
  } catch (error) {
    console.error('[Notifications] Failed to schedule daily digest:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Cancel daily digest notification
 */
export async function cancelDailyDigest() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'daily_digest') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log('[Notifications] Cancelled daily digest:', notification.identifier);
      }
    }
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Failed to cancel daily digest:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Schedule a birthday reminder notification (day before at 9am)
 * @param {object} contact - Contact with birthday info
 * @param {Date} birthdayDate - The birthday date
 */
export async function scheduleBirthdayNotification(contact, birthdayDate) {
  try {
    if (!contact || !birthdayDate) {
      return { success: false, error: 'Invalid contact or date' };
    }

    // Schedule for day before at 9am
    const notifyDate = new Date(birthdayDate);
    notifyDate.setDate(notifyDate.getDate() - 1);
    notifyDate.setHours(9, 0, 0, 0);

    const now = new Date();
    if (notifyDate <= now) {
      // If notification date is in past, schedule for next year
      notifyDate.setFullYear(notifyDate.getFullYear() + 1);
    }

    const secondsUntil = Math.floor((notifyDate.getTime() - now.getTime()) / 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Birthday Tomorrow! 🎂",
        body: `${contact.name}'s birthday is tomorrow. Send them a message!`,
        data: {
          type: 'birthday',
          contactId: contact.id,
          contactName: contact.name,
        },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: {
        type: 'timeInterval',
        seconds: secondsUntil,
        repeats: false,
      },
    });

    console.log('[Notifications] Scheduled birthday reminder for', contact.name);
    return { success: true, notificationId };
  } catch (error) {
    console.error('[Notifications] Failed to schedule birthday:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Schedule streak warning notification (if streak at risk)
 * @param {number} currentStreak - Current streak count
 */
export async function scheduleStreakWarning(currentStreak) {
  try {
    if (currentStreak < 3) return { success: true, skipped: true };

    // Schedule for 8pm if user hasn't been active today
    const now = new Date();
    const notifyTime = new Date();
    notifyTime.setHours(20, 0, 0, 0);

    // If it's past 8pm, don't schedule
    if (now >= notifyTime) {
      return { success: true, skipped: true };
    }

    const secondsUntil = Math.floor((notifyTime.getTime() - now.getTime()) / 1000);

    // Cancel any existing streak warning first
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'streak_warning') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Don't lose your ${currentStreak} day streak! 🔥`,
        body: "Reach out to a contact to keep your streak going",
        data: {
          type: 'streak_warning',
        },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: {
        type: 'timeInterval',
        seconds: secondsUntil,
        repeats: false,
      },
    });

    console.log('[Notifications] Scheduled streak warning');
    return { success: true, notificationId };
  } catch (error) {
    console.error('[Notifications] Failed to schedule streak warning:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Send an achievement unlocked notification immediately
 * @param {object} achievement - Achievement that was unlocked
 */
export async function sendAchievementNotification(achievement) {
  try {
    if (!achievement) return { success: false, error: 'No achievement' };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Achievement Unlocked! ${achievement.emoji}`,
        body: `${achievement.name} - ${achievement.description}`,
        data: {
          type: 'achievement',
          achievementId: achievement.id,
        },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'achievements' }),
      },
      trigger: null, // Immediate
    });

    console.log('[Notifications] Sent achievement notification:', achievement.name);
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Failed to send achievement notification:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return { success: true, notifications };
  } catch (error) {
    return { success: false, error: error?.message || String(error), notifications: [] };
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Cancelled all scheduled notifications');
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Failed to cancel all:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Get badge count
 */
export async function getBadgeCount() {
  try {
    const count = await Notifications.getBadgeCountAsync();
    return { success: true, count };
  } catch (error) {
    return { success: false, error: error?.message || String(error), count: 0 };
  }
}

/**
 * Set badge count
 */
export async function setBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Schedule an immediate notification (appears instantly)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 * @returns {object} - { success, notificationId, error }
 */
export async function scheduleImmediateNotification(title, body, data = {}) {
  try {
    // Ensure notification permissions are granted
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('[Notifications] Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Notification permissions not granted.');
      return { success: false, error: 'Notification permissions not granted.' };
    }

    console.log('[Notifications] Scheduling immediate notification with title:', title);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: null, // null trigger means immediate notification
    });
    
    console.log('[Notifications] ✅ Scheduled immediate notification:', notificationId);
    return { success: true, notificationId };
  } catch (error) {
    console.error('[Notifications] ❌ Failed to schedule immediate notification:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Debug: Get all scheduled notifications
 * Useful for verifying that reminders were actually scheduled
 */
export async function getAllScheduledNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[Notifications] 📋 Total scheduled notifications:', scheduled.length);
    
    scheduled.forEach((notif, index) => {
      console.log(`[Notifications] ${index + 1}.`, {
        id: notif.identifier,
        title: notif.content.title,
        trigger: notif.trigger,
        type: notif.content.data?.type,
      });
    });
    
    return { success: true, scheduled, count: scheduled.length };
  } catch (error) {
    console.error('[Notifications] Failed to get scheduled notifications:', error);
    return { success: false, error: error?.message || String(error), scheduled: [] };
  }
}

// Helper function to get reminder notification title
function getReminderTitle(reminder) {
  switch (reminder.reminder_type) {
    case 'birthday':
      return `🎂 Birthday Reminder`;
    case 'anniversary':
      return `💝 Anniversary Reminder`;
    case 'follow_up':
      return `📞 Follow Up`;
    case 'reconnect':
      return `👋 Time to Reconnect`;
    default:
      return `⏰ Reminder`;
  }
}




