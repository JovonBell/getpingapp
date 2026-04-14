/**
 * NFC Manager Utilities for Ping Ring
 *
 * Handles all NFC operations for programming the user's ring
 * with their contact sharing URL. Falls back to mock mode
 * when native NFC module isn't available (simulator / Expo Go).
 */

import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to import native NFC — will fail in Expo Go / simulator
let NfcManager = null;
let NfcTech = null;
let Ndef = null;
let MOCK_MODE = false;

try {
  const nfc = require('react-native-nfc-manager');
  NfcManager = nfc.default;
  NfcTech = nfc.NfcTech;
  Ndef = nfc.Ndef;
} catch (e) {
  console.log('[NFC] Native module not available — running in mock mode');
  MOCK_MODE = true;
}

// Storage keys
const NFC_RING_URL_KEY = '@ping_nfc_ring_url';
const NFC_RING_DATE_KEY = '@ping_nfc_ring_date';

/**
 * Whether we're running in mock mode (no real NFC hardware)
 */
export function isMockMode() {
  return MOCK_MODE;
}

/**
 * Check if NFC is available and enabled on this device
 */
export async function checkNfcAvailability() {
  if (MOCK_MODE) {
    return { supported: true, enabled: true, mock: true };
  }

  try {
    const supported = await NfcManager.isSupported();
    if (!supported) {
      return { supported: false, enabled: false, error: 'NFC_NOT_SUPPORTED' };
    }

    await NfcManager.start();
    const enabled = await NfcManager.isEnabled();

    return {
      supported: true,
      enabled,
      error: enabled ? null : 'NFC_DISABLED'
    };
  } catch (error) {
    console.error('[NFC] Error checking availability:', error);
    return { supported: false, enabled: false, error: error.message };
  }
}

/**
 * Open device NFC settings
 */
export async function openNfcSettings() {
  if (MOCK_MODE) return;

  try {
    await NfcManager.goToNfcSetting();
  } catch (error) {
    console.error('[NFC] Error opening settings:', error);
    Alert.alert('Cannot Open Settings', 'Please manually enable NFC in your device settings.');
  }
}

/**
 * Program the NFC ring with a custom URL
 */
export async function programRing(url) {
  // Mock mode — simulate a 2s write
  if (MOCK_MODE) {
    console.log('[NFC MOCK] Simulating write:', url);
    await new Promise(r => setTimeout(r, 2000));
    await AsyncStorage.setItem(NFC_RING_URL_KEY, url);
    await AsyncStorage.setItem(NFC_RING_DATE_KEY, new Date().toISOString());
    return { success: true, url };
  }

  let timeoutId = null;

  try {
    console.log('[NFC] Starting ring programming for:', url);

    const existingUrl = await AsyncStorage.getItem(NFC_RING_URL_KEY);
    if (existingUrl === url) {
      const existingDate = await AsyncStorage.getItem(NFC_RING_DATE_KEY);
      console.log('[NFC] Ring already programmed on:', existingDate);
    }

    await NfcManager.start();

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 60000);
    });

    const techRequestOptions = Platform.OS === 'ios'
      ? { alertMessage: 'Hold your ring near the top of your iPhone' }
      : {};

    const techPromise = NfcManager.requestTechnology(NfcTech.Ndef, techRequestOptions);
    await Promise.race([techPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    const tag = await NfcManager.getTag();
    console.log('[NFC] Tag detected:', tag?.id);

    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);

    if (tag?.maxSize && bytes.length > tag.maxSize) {
      throw new Error('TAG_TOO_SMALL');
    }

    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    console.log('[NFC] Write successful!');

    const verifyTag = await NfcManager.getTag();
    console.log('[NFC] Verified tag:', verifyTag?.id);

    await AsyncStorage.setItem(NFC_RING_URL_KEY, url);
    await AsyncStorage.setItem(NFC_RING_DATE_KEY, new Date().toISOString());

    return { success: true, url };

  } catch (error) {
    console.error('[NFC] Programming error:', error);

    let errorType = 'UNKNOWN';
    let errorMessage = error.message;

    if (error.message === 'TIMEOUT') {
      errorType = 'TIMEOUT';
      errorMessage = 'No NFC ring detected. Please try again and hold your ring closer to the phone.';
    } else if (error.message === 'TAG_TOO_SMALL') {
      errorType = 'TAG_TOO_SMALL';
      errorMessage = 'This ring doesn\'t have enough storage capacity. Please use a ring with more memory.';
    } else if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
      errorType = 'CANCELLED';
      errorMessage = 'NFC scan was cancelled.';
    } else if (error.message?.includes('not writable')) {
      errorType = 'NOT_WRITABLE';
      errorMessage = 'This ring is read-only and cannot be programmed.';
    }

    return { success: false, error: errorType, message: errorMessage };

  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Read what's currently on an NFC tag
 */
export async function readRing() {
  // Mock mode — simulate a 2s read, return stored URL
  if (MOCK_MODE) {
    console.log('[NFC MOCK] Simulating read...');
    await new Promise(r => setTimeout(r, 2000));
    const storedUrl = await AsyncStorage.getItem(NFC_RING_URL_KEY);
    return {
      success: true,
      data: {
        id: 'MOCK-RING-001',
        techTypes: ['Ndef'],
        maxSize: 868,
        url: storedUrl || null,
      }
    };
  }

  let timeoutId = null;

  try {
    console.log('[NFC] Starting ring read...');
    await NfcManager.start();

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 30000);
    });

    const techRequestOptions = Platform.OS === 'ios'
      ? { alertMessage: 'Hold your ring near the top of your iPhone' }
      : {};

    const techPromise = NfcManager.requestTechnology(NfcTech.Ndef, techRequestOptions);
    await Promise.race([techPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    const tag = await NfcManager.getTag();
    console.log('[NFC] Tag read:', tag);

    let url = null;
    if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
      const record = tag.ndefMessage[0];
      if (record.tnf === Ndef.TNF_WELL_KNOWN && record.type[0] === 0x55) {
        url = Ndef.uri.decodePayload(record.payload);
      }
    }

    return {
      success: true,
      data: { id: tag?.id, techTypes: tag?.techTypes, maxSize: tag?.maxSize, url }
    };

  } catch (error) {
    console.error('[NFC] Read error:', error);
    return { success: false, error: error.message };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Get the stored ring URL (if user has programmed a ring before)
 */
export async function getStoredRingInfo() {
  try {
    const url = await AsyncStorage.getItem(NFC_RING_URL_KEY);
    const date = await AsyncStorage.getItem(NFC_RING_DATE_KEY);
    return { url, date };
  } catch (error) {
    console.error('[NFC] Error getting stored ring info:', error);
    return { url: null, date: null };
  }
}

/**
 * Clear stored ring info (for reprogramming)
 */
export async function clearStoredRingInfo() {
  try {
    await AsyncStorage.removeItem(NFC_RING_URL_KEY);
    await AsyncStorage.removeItem(NFC_RING_DATE_KEY);
  } catch (error) {
    console.error('[NFC] Error clearing stored ring info:', error);
  }
}

/**
 * Cancel any ongoing NFC operation
 */
export async function cancelNfcOperation() {
  if (MOCK_MODE) return;
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch (error) {
    // Ignore errors during cancellation
  }
}

export default {
  checkNfcAvailability,
  openNfcSettings,
  programRing,
  readRing,
  getStoredRingInfo,
  clearStoredRingInfo,
  cancelNfcOperation,
  isMockMode,
};
