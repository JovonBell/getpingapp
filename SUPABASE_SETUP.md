# Supabase Setup Instructions

## 1. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public** key (under "Project API keys")

## 2. Configure Your App

Open `/lib/supabase.js` and replace these lines:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual credentials:

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'your-actual-anon-key-here';
```

## 3. Database Schema

Make sure your Supabase database has a `profiles` table with these columns:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  display_name TEXT,
  job_title TEXT,
  company TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  email TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## 4. Storage Bucket

Create a storage bucket for profile pictures:

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `profile-pictures`
3. Set it to **Public** bucket
4. Add this policy:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-pictures');

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-pictures');
```

## 5. Test Your Setup

1. Start your app: `npm start`
2. Create an account or sign in
3. Edit your profile
4. Save changes
5. Check your Supabase dashboard to see the data

## Updated Setup (required for v1 shipping)

### A) Run database migrations (in this order)
1. `supabase_migration_phase1_clean.sql` (profiles, connections, messages + RPCs)
2. `supabase_migration_phase1_contacts_identities.sql` (hashed identity matching + idempotent connections)
3. `supabase_migration_phase2_circles.sql` (imported_contacts + circles + circle_members)
4. `supabase_migration_phase2_contact_matches.sql` (optional: imported_contacts.matched_user_id)
5. `supabase_migration_phase2_push.sql` (device_tokens for Expo push)
6. `supabase_migration_phase3_health_alerts.sql` (relationship_health + alerts + alert_history)

### B) Enable Sign in with Apple in Supabase Auth
In Supabase Dashboard:
- Authentication → Providers → Apple
- Configure Apple provider using your Apple Developer credentials (Services ID / Key ID / Team ID / Private key)
- Ensure your iOS bundle identifier matches `app.json` (`com.getpingapp`)

### C) Deploy required Edge Function(s)
Account deletion is required for App Store if you support accounts.

- Deploy: `supabase/functions/delete-account/index.ts`
- Name: `delete-account`
- Set function secret: `SUPABASE_SERVICE_ROLE_KEY`

The app calls this via `supabase.functions.invoke('delete-account')`.

## Features Now Available (after the above)

✅ Apple sign-in (Supabase Auth)
✅ Profile sync (Supabase `profiles` + local AsyncStorage fallback)
✅ Device contacts import (`expo-contacts`) with privacy-preserving matching (hashed identifiers)
✅ Circles persisted (Supabase `circles` + `circle_members` + `imported_contacts`)
✅ Messaging (Supabase `messages`) + unread count RPC
✅ Push notifications (Expo push tokens stored in `device_tokens`)
✅ Account deletion (Edge Function)

## Troubleshooting

### "Invalid API key" error
- Double-check you copied the anon/public key (not the service role key)
- Make sure there are no extra spaces in the key

### Profile not saving
- Check that Row Level Security policies are set up correctly
- Verify user is authenticated before saving

### Image upload fails
- Ensure storage bucket `profile-pictures` exists and is public
- Check storage policies are configured

### Need help?
Check the [Supabase Documentation](https://supabase.com/docs) or your existing web app's Supabase setup.
