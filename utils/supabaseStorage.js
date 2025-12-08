import { supabase } from '../lib/supabase';

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
