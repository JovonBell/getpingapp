import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@ping_user_profile';

// Save profile to local storage
export const saveProfile = async (profileData) => {
  try {
    const jsonValue = JSON.stringify(profileData);
    await AsyncStorage.setItem(PROFILE_KEY, jsonValue);
    return { success: true };
  } catch (error) {
    console.error('Error saving profile:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Get profile from local storage
// Returns { success: true, profile } or { success: false, error }
export const getProfile = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROFILE_KEY);
    return { success: true, profile: jsonValue != null ? JSON.parse(jsonValue) : null };
  } catch (error) {
    console.error('Error loading profile:', error);
    return { success: false, error: error?.message || String(error), profile: null };
  }
};

// Update specific fields in profile
export const updateProfile = async (updates) => {
  try {
    const result = await getProfile();
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to load current profile' };
    }
    const updatedProfile = {
      ...(result.profile || {}),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await saveProfile(updatedProfile);
    return { success: true, profile: updatedProfile };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Clear profile (for logout)
export const clearProfile = async () => {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing profile:', error);
    return { success: false, error: error?.message || String(error) };
  }
};
