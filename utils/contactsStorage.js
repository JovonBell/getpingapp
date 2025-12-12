import AsyncStorage from '@react-native-async-storage/async-storage';

const IMPORTED_CONTACTS_KEY = '@ping_imported_contacts_v1';

export async function saveImportedContacts(contacts) {
  try {
    await AsyncStorage.setItem(IMPORTED_CONTACTS_KEY, JSON.stringify(contacts || []));
    return { success: true };
  } catch (error) {
    console.error('Error saving imported contacts:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

export async function getImportedContacts() {
  try {
    const raw = await AsyncStorage.getItem(IMPORTED_CONTACTS_KEY);
    return { success: true, contacts: raw ? JSON.parse(raw) : [] };
  } catch (error) {
    console.error('Error loading imported contacts:', error);
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


