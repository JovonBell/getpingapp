import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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


