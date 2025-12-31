/**
 * NFC Manager Utilities for Ping Ring
 *
 * Handles all NFC operations for programming the user's ring
 * with their contact sharing URL.
 */

import { Platform, Alert } from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for remembering programmed ring
const NFC_RING_URL_KEY = '@ping_nfc_ring_url';
const NFC_RING_DATE_KEY = '@ping_nfc_ring_date';

/**
 * Check if NFC is available and enabled on this device
 * @returns {Promise<{supported: boolean, enabled: boolean, error?: string}>}
 */
export async function checkNfcAvailability() {
  try {
    const supported = await NfcManager.isSupported();

    if (!supported) {
      return {
        supported: false,
        enabled: false,
        error: 'NFC_NOT_SUPPORTED'
      };
    }

    // Start NFC manager
    await NfcManager.start();

    const enabled = await NfcManager.isEnabled();

    return {
      supported: true,
      enabled,
      error: enabled ? null : 'NFC_DISABLED'
    };
  } catch (error) {
    console.error('[NFC] Error checking availability:', error);
    return {
      supported: false,
      enabled: false,
      error: error.message
    };
  }
}

/**
 * Open device NFC settings
 */
export async function openNfcSettings() {
  try {
    await NfcManager.goToNfcSetting();
  } catch (error) {
    console.error('[NFC] Error opening settings:', error);
    Alert.alert(
      'Cannot Open Settings',
      'Please manually enable NFC in your device settings.'
    );
  }
}

/**
 * Program the NFC ring with the user's contact card URL
 * @param {string} userId - The user's ID for the contact card URL
 * @param {string} baseUrl - Base URL for contact cards (e.g., 'https://getping.today/card')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function programRing(userId, baseUrl = 'https://getping.today/card') {
  const profileUrl = `${baseUrl}/${userId}`;
  let timeoutId = null;

  try {
    console.log('[NFC] Starting ring programming for:', profileUrl);

    // Check if already programmed
    const existingUrl = await AsyncStorage.getItem(NFC_RING_URL_KEY);
    if (existingUrl === profileUrl) {
      const existingDate = await AsyncStorage.getItem(NFC_RING_DATE_KEY);
      console.log('[NFC] Ring already programmed on:', existingDate);
    }

    // Start NFC manager if not started
    await NfcManager.start();

    // Set a 60-second timeout
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, 60000);
    });

    // Request NDEF technology with platform-specific options
    const techRequestOptions = Platform.OS === 'ios'
      ? { alertMessage: 'Hold your ring near the top of your iPhone' }
      : {};

    const techPromise = NfcManager.requestTechnology(NfcTech.Ndef, techRequestOptions);

    // Wait for either tech request or timeout
    await Promise.race([techPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    // Get tag info
    const tag = await NfcManager.getTag();
    console.log('[NFC] Tag detected:', tag?.id);

    // Encode the URL
    const bytes = Ndef.encodeMessage([Ndef.uriRecord(profileUrl)]);

    // Check tag capacity
    if (tag?.maxSize && bytes.length > tag.maxSize) {
      throw new Error('TAG_TOO_SMALL');
    }

    // Write to the tag
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    console.log('[NFC] Write successful!');

    // Verify the write by reading back
    const verifyTag = await NfcManager.getTag();
    console.log('[NFC] Verified tag:', verifyTag?.id);

    // Store that we programmed this ring
    await AsyncStorage.setItem(NFC_RING_URL_KEY, profileUrl);
    await AsyncStorage.setItem(NFC_RING_DATE_KEY, new Date().toISOString());

    return { success: true, url: profileUrl };

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

    return {
      success: false,
      error: errorType,
      message: errorMessage
    };

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
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function readRing() {
  let timeoutId = null;

  try {
    console.log('[NFC] Starting ring read...');

    await NfcManager.start();

    // Set a 30-second timeout for reading
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, 30000);
    });

    const techRequestOptions = Platform.OS === 'ios'
      ? { alertMessage: 'Hold your ring near the top of your iPhone' }
      : {};

    const techPromise = NfcManager.requestTechnology(NfcTech.Ndef, techRequestOptions);
    await Promise.race([techPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    const tag = await NfcManager.getTag();
    console.log('[NFC] Tag read:', tag);

    // Parse NDEF message if present
    let url = null;
    if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
      const record = tag.ndefMessage[0];
      if (record.tnf === Ndef.TNF_WELL_KNOWN && record.type[0] === 0x55) {
        // URI record
        url = Ndef.uri.decodePayload(record.payload);
      }
    }

    return {
      success: true,
      data: {
        id: tag?.id,
        techTypes: tag?.techTypes,
        maxSize: tag?.maxSize,
        url
      }
    };

  } catch (error) {
    console.error('[NFC] Read error:', error);
    return {
      success: false,
      error: error.message
    };
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
 * @returns {Promise<{url: string|null, date: string|null}>}
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
};
