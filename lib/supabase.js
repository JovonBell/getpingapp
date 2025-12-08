import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your actual Supabase credentials
// You can find these in your Supabase project settings
const SUPABASE_URL = 'https://ahksxziueqkacyaqtgeu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoa3N4eml1ZXFrYWN5YXF0Z2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjAzMzUsImV4cCI6MjA2OTU5NjMzNX0.V3UV58ZhQPrsXanRKHZbbJdJq_smXvh4jtAC1cFK6tw';

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
