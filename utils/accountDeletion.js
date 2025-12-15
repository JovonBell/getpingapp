import { supabase } from '../lib/supabase';

// Calls a Supabase Edge Function named `delete-account` that must run with service role.
// This is required for true account deletion (auth.users) from the client.
export async function deleteAccount() {
  try {
    const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) throw error;

    // Clear local session too
    await supabase.auth.signOut();
    return { success: true, data };
  } catch (error) {
    console.warn('deleteAccount failed:', error?.message || error);
    return {
      success: false,
      error:
        error?.message ||
        'Delete account function is not configured yet. Deploy the Supabase Edge Function `delete-account`.',
    };
  }
}




