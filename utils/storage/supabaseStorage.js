import { supabase } from '../../lib/supabase';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { normalizeEmail, normalizePhone, sha256 } from '../contactsImport';
import { upsertUserIdentities } from './identitiesStorage';

// Tell the browser to dismiss when auth is complete
WebBrowser.maybeCompleteAuthSession();

// Save profile to Supabase
export const saveProfileToSupabase = async (profileData, userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: profileData.name,
        job_title: profileData.jobTitle,
        company: profileData.company,
        location: profileData.location,
        bio: profileData.bio,
        avatar_url: profileData.avatar,
        phone_number: profileData.phone,
        email: profileData.email,
        social_links: profileData.socialLinks,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error saving profile to Supabase:', error);
    return { success: false, error: error.message };
  }
};

// Get profile from Supabase
export const getProfileFromSupabase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Transform Supabase data to app format
    const profile = {
      name: data.display_name,
      jobTitle: data.job_title,
      company: data.company,
      location: data.location,
      bio: data.bio,
      avatar: data.avatar_url,
      phone: data.phone_number,
      email: data.email,
      socialLinks: data.social_links || {},
    };

    return { success: true, profile };
  } catch (error) {
    console.error('Error loading profile from Supabase:', error);
    return { success: false, error: error.message };
  }
};

// Upload avatar image to Supabase Storage
export const uploadAvatar = async (uri, userId) => {
  try {
    // Convert image URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileExt = uri.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { success: false, error: error.message };
  }
};

// Sign up new user
export const signUpWithEmail = async (email, password, phone) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone_number: phone,
        },
      },
    });

    if (error) throw error;

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, error: error.message };
  }
};

// Sign in existing user
export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error: error.message };
  }
};

// Sign in with Apple (iOS only)
export const signInWithApple = async () => {
  try {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Sign In is only available on iOS.' };
    }

    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return { success: false, error: 'Apple Sign In is not available on this device.' };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential?.identityToken) {
      return { success: false, error: 'Missing identity token from Apple.' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;

    // Best-effort: publish identity hashes so other users can match you by email/phone.
    try {
      const userId = data?.user?.id;
      const email = normalizeEmail(credential?.email || data?.user?.email);
      const phone = normalizePhone(data?.user?.user_metadata?.phone_number);
      const emailHashes = email ? [await sha256(email)] : [];
      const phoneHashes = phone ? [await sha256(phone)] : [];
      if (userId) await upsertUserIdentities(userId, { emailHashes, phoneHashes });
    } catch (e) {
      console.warn('Failed to upsert user identities (continuing):', e?.message || e);
    }

    return {
      success: true,
      user: data?.user,
      session: data?.session,
      appleProfile: {
        email: credential?.email || null,
        fullName: credential?.fullName || null,
      },
    };
  } catch (error) {
    // Apple cancel case: code 'ERR_REQUEST_CANCELED'
    const msg = error?.message || String(error);
    return { success: false, error: msg };
  }
};

// Sign in with Google (OAuth via Supabase)
export const signInWithGoogle = async () => {
  try {
    // Use the app's deep link scheme for redirect
    const redirectUrl = 'getpingapp://';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Open the auth URL in browser (this will go to Google, then back to Supabase, then redirect to our app)
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    if (result.type === 'success') {
      // Extract the session from the URL
      const url = result.url;
      const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          return { success: false, error: sessionError.message };
        }

        // Best-effort: publish identity hashes for matching
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const email = normalizeEmail(user.email);
            const emailHashes = email ? [await sha256(email)] : [];
            await upsertUserIdentities(user.id, { emailHashes, phoneHashes: [] });
          }
        } catch (e) {
          console.warn('Failed to upsert user identities (continuing):', e?.message || e);
        }

        return { success: true };
      }
    }

    if (result.type === 'cancel') {
      return { success: false, error: 'canceled' };
    }

    return { success: false, error: 'Authentication failed' };
  } catch (err) {
    console.error('Google sign-in error:', err);
    return { success: false, error: err.message };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
};

// Get current session
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, session };
  } catch (error) {
    console.error('Error getting session:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { success: true, user };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};
