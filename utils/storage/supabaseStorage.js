import { supabase } from '../../lib/supabase';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { upsertUserIdentities } from './identitiesStorage';
import { clearProfile } from './profileStorage';

// Inlined utility functions (previously from contactsImport)
export function normalizeEmail(email) {
  if (!email) return null;
  return String(email).trim().toLowerCase() || null;
}
export function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d]/g, '');
  return digits.length ? digits : null;
}
export async function sha256(value) {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, String(value));
}

// Tell the browser to dismiss when auth is complete
// Wrapped in try-catch for Expo Go compatibility
try {
  WebBrowser.maybeCompleteAuthSession();
} catch (err) {
  console.log('[Auth] WebBrowser not available:', err?.message);
}

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
        school: profileData.school,
        social_links: profileData.socialLinks,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
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
      school: data.school,
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

// Send Magic Link (passwordless email sign in)
export const signInWithMagicLink = async (email) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'getpingapp://auth/callback',
      },
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error sending magic link:', error);
    return { success: false, error: error.message };
  }
};

// Verify Magic Link token (for deep link handling)
export const verifyMagicLinkToken = async (tokenHash) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    });

    if (error) throw error;

    return { success: true, user: data?.user, session: data?.session };
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return { success: false, error: error.message };
  }
};

// Reset password (sends reset email)
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'getpingapp://auth/reset-password',
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error sending reset email:', error);
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

    // Save Apple-provided name to user metadata (only available on first sign-in)
    try {
      const givenName = credential?.fullName?.givenName || '';
      const familyName = credential?.fullName?.familyName || '';
      const fullName = `${givenName} ${familyName}`.trim();
      if (fullName) {
        await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
        console.log('[AUTH APPLE] Saved full name to user metadata:', fullName);
      }
    } catch (e) {
      console.warn('[AUTH APPLE] Failed to save name to metadata (continuing):', e?.message || e);
    }

    // Best-effort: publish identity hashes so other users can match you by email/phone.
    try {
      const userId = data?.user?.id;
      const email = normalizeEmail(credential?.email || data?.user?.email);
      const phone = normalizePhone(data?.user?.user_metadata?.phone_number);
      const emailHashes = email ? [await sha256(email)] : [];
      const phoneHashes = phone ? [await sha256(phone)] : [];
      if (userId) await upsertUserIdentities(userId, { emailHashes, phoneHashes });
    } catch (e) {
      console.warn('[AUTH APPLE] Failed to upsert identities (continuing):', e?.message || e);
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

    console.log('[AUTH GOOGLE] Starting OAuth flow...');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        scopes: 'email profile',
      },
    });

    if (error) {
      console.error('[AUTH GOOGLE] OAuth init error:', error.message);
      return { success: false, error: error.message };
    }

    if (!data?.url) {
      console.error('[AUTH GOOGLE] No OAuth URL returned from Supabase');
      return { success: false, error: 'Could not start Google sign in. Please try again.' };
    }

    console.log('[AUTH GOOGLE] Opening browser for auth...');

    // Open the auth URL in browser (this will go to Google, then back to Supabase, then redirect to our app)
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log('[AUTH GOOGLE] Browser result type:', result.type);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false, error: 'canceled' };
    }

    if (result.type === 'success') {
      const url = result.url;
      console.log('[AUTH GOOGLE] Redirect URL received');

      // Extract tokens from the URL - try both hash fragment and query params
      let accessToken = null;
      let refreshToken = null;

      try {
        // Supabase returns tokens in the hash fragment (#access_token=...)
        const hashPart = url.split('#')[1];
        if (hashPart) {
          const params = new URLSearchParams(hashPart);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
        }

        // Fallback: check query params (?access_token=...)
        if (!accessToken) {
          const queryPart = url.split('?')[1];
          if (queryPart) {
            // Remove any hash from the query part
            const cleanQuery = queryPart.split('#')[0];
            const params = new URLSearchParams(cleanQuery);
            accessToken = params.get('access_token');
            refreshToken = params.get('refresh_token');
          }
        }
      } catch (parseErr) {
        console.error('[AUTH GOOGLE] URL parsing error:', parseErr?.message);
        return { success: false, error: 'Failed to process sign-in response. Please try again.' };
      }

      if (!accessToken) {
        // Check if there's an error in the URL (e.g., access_denied)
        try {
          const allParams = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
          const errorParam = allParams.get('error');
          const errorDesc = allParams.get('error_description');
          if (errorParam) {
            console.error('[AUTH GOOGLE] OAuth error:', errorParam, errorDesc);
            return { success: false, error: errorDesc || `Google sign in failed: ${errorParam}` };
          }
        } catch (e) {
          // Ignore parse errors for error checking
        }
        console.error('[AUTH GOOGLE] No access token in redirect URL');
        return { success: false, error: 'Sign in did not complete. Please try again.' };
      }

      console.log('[AUTH GOOGLE] Setting session with tokens...');

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        console.error('[AUTH GOOGLE] Session error:', sessionError.message);
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
        console.warn('[AUTH GOOGLE] Failed to upsert identities (continuing):', e?.message || e);
      }

      console.log('[AUTH GOOGLE] Success');
      return { success: true };
    }

    console.warn('[AUTH GOOGLE] Unexpected result type:', result.type);
    return { success: false, error: 'Authentication was not completed. Please try again.' };
  } catch (err) {
    console.error('[AUTH GOOGLE] Error:', err?.message || err);
    return { success: false, error: err?.message || 'Google sign in failed. Please try again.' };
  }
};

// Sign out
export const signOut = async () => {
  try {
    // Clear cached data BEFORE signing out (security: prevent next user seeing old data)
    await clearProfile();
    console.log('[Auth] Cleared cached profile');

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
    if (error) {
      // Check for refresh token errors - force logout to clear corrupted session
      const errorMsg = error.message || '';
      if (errorMsg.includes('Refresh Token') || errorMsg.includes('refresh_token') ||
          errorMsg.includes('Invalid token') || errorMsg.includes('JWT expired')) {
        console.error('[AUTH] Invalid/expired refresh token detected - forcing logout');
        try {
          await supabase.auth.signOut();
          // Clear local storage too
          await clearProfile().catch(() => {});
        } catch (signOutErr) {
          console.warn('[AUTH] Error during forced logout:', signOutErr?.message);
        }
      }
      throw error;
    }
    return { success: true, user };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};
