import AsyncStorage from '@react-native-async-storage/async-storage';

const IMPORTED_CONTACTS_KEY = '@ping_imported_contacts_v1';

export async function saveImportedContacts(contacts) {
  try {
    const contactsToSave = contacts || [];
    console.log('[SAVE CONTACTS] Saving', contactsToSave.length, 'contacts');

    await AsyncStorage.setItem(IMPORTED_CONTACTS_KEY, JSON.stringify(contactsToSave));

    // Verify the save by reading back
    const verification = await AsyncStorage.getItem(IMPORTED_CONTACTS_KEY);
    if (!verification) {
      console.error('[SAVE CONTACTS] Verification failed - data not persisted');
      return { success: false, error: 'Data verification failed' };
    }

    console.log('[SAVE CONTACTS] ✅ Success');
    return { success: true };
  } catch (error) {
    console.error('[SAVE CONTACTS] Error:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

export async function getImportedContacts() {
  try {
    const raw = await AsyncStorage.getItem(IMPORTED_CONTACTS_KEY);

    if (!raw) {
      console.log('[GET CONTACTS] No contacts stored yet');
      return { success: true, contacts: [] };
    }

    // Parse with explicit try-catch for JSON parsing errors
    let contacts;
    try {
      contacts = JSON.parse(raw);
    } catch (parseError) {
      console.error('[GET CONTACTS] JSON parse error - data may be corrupted:', parseError);
      // Clear corrupted data to prevent future errors
      await AsyncStorage.removeItem(IMPORTED_CONTACTS_KEY);
      return { success: false, error: 'Corrupted contact data was cleared', contacts: [] };
    }

    // Validate that contacts is an array
    if (!Array.isArray(contacts)) {
      console.error('[GET CONTACTS] Invalid data structure - expected array, got:', typeof contacts);
      await AsyncStorage.removeItem(IMPORTED_CONTACTS_KEY);
      return { success: false, error: 'Invalid contact data structure was cleared', contacts: [] };
    }

    console.log('[GET CONTACTS] Loaded', contacts.length, 'contacts');
    return { success: true, contacts };
  } catch (error) {
    console.error('[GET CONTACTS] Error:', error?.message || error);
    return { success: false, error: error?.message || String(error), contacts: [] };
  }
}

export async function clearImportedContacts() {
  try {
    await AsyncStorage.removeItem(IMPORTED_CONTACTS_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing imported contacts:', error);
    return { success: false, error: error?.message || String(error) };
  }
}




