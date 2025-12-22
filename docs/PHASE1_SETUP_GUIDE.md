# Phase 1 Database Setup Guide

## ✅ What's Been Created

I've generated a complete Phase 1 database migration that includes:

1. **profiles** table - User digital business cards
2. **connections** table - Networking relationships with ring tiers (1-5)
3. **messages** table - Direct messaging system
4. Row Level Security policies for all tables
5. Helper functions for unread counts and connection stats
6. Automated triggers for timestamps

## 🚀 Quick Setup (5 minutes)

### Step 1: Run the SQL Migration

1. Open the Supabase SQL Editor:
   **[Click here to open SQL Editor](https://app.supabase.com/project/ahksxziueqkacyaqtgeu/sql/new)**

2. Open the file: `supabase_migration_phase1.sql`

3. Copy ALL the contents and paste into the SQL Editor

4. Click **"Run"** or press `Cmd/Ctrl + Enter`

5. You should see: ✅ Success messages for each table created

### Step 2: Create Storage Bucket for Profile Pictures

1. Go to Storage in Supabase:
   **[Click here to open Storage](https://app.supabase.com/project/ahksxziueqkacyaqtgeu/storage/buckets)**

2. Click **"New bucket"**

3. Configure the bucket:
   - **Name**: `profile-pictures`
   - **Public bucket**: ✅ YES (check this box)
   - **Allowed MIME types**: Leave empty (allows all image types)
   - **Maximum file size**: `5 MB`

4. Click **"Create bucket"**

5. Set up storage policies - Go to the **Policies** tab for the bucket:

   Click **"New Policy"** and add these two policies:

   **Policy 1: Upload Policy**
   ```sql
   CREATE POLICY "Users can upload own avatar"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (
       bucket_id = 'profile-pictures' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );
   ```

   **Policy 2: Public Read Policy**
   ```sql
   CREATE POLICY "Anyone can view avatars"
     ON storage.objects FOR SELECT
     TO public
     USING (bucket_id = 'profile-pictures');
   ```

### Step 3: Verify Setup

Run this query in the SQL Editor to verify all tables exist:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'connections', 'messages')
ORDER BY tablename;
```

You should see all 3 tables listed.

## 📋 What Each Table Does

### **profiles** Table
- Stores user profile information (name, job title, bio, etc.)
- Your `ProfileScreen` and `ProfileEditScreen` use this
- **RLS**: Users can view any profile, but only edit their own

### **connections** Table
- Manages relationships between users
- Supports ring tiers (1 = closest, 5 = outermost)
- Used by `HomeScreen` (network visualization) and `ContactsListScreen`
- **RLS**: Users can only see their own connections

### **messages** Table
- Stores direct messages between users
- Tracks read/unread status
- Used by `MessagesScreen`
- **RLS**: Users can only see messages they sent or received

## 🔧 Helper Functions Available

After migration, you'll have these helper functions:

```javascript
// In your app, you can call these via Supabase RPC:

// Get unread message count
const { data } = await supabase.rpc('get_unread_message_count', {
  user_uuid: user.id
});

// Get connection count by ring tier
const { data } = await supabase.rpc('get_connection_count_by_ring', {
  user_uuid: user.id,
  tier: 1  // Ring tier 1-5
});
```

## 🎨 Storage Bucket Structure

Profile pictures will be organized like this:
```
profile-pictures/
  └── avatars/
      ├── {user_id}-{timestamp}.jpg
      ├── {user_id}-{timestamp}.png
      └── ...
```

Your `uploadAvatar()` function in `utils/supabaseStorage.js` already handles this!

## ✅ Verification Checklist

After completing the setup, verify:

- [ ] All 3 tables exist (run verification query above)
- [ ] `profile-pictures` storage bucket exists and is PUBLIC
- [ ] Storage policies are set up for upload and read
- [ ] Your app can connect to Supabase (check `lib/supabase.js`)

## 🐛 Troubleshooting

### "Permission denied for table X"
- Check that RLS policies are enabled
- Verify you're authenticated when making requests

### "Storage bucket not found"
- Make sure bucket name is exactly `profile-pictures`
- Check that it's set to PUBLIC

### "Could not insert into profiles"
- Ensure the user is authenticated
- Check that `user_id` matches `auth.uid()`

## 🚀 Next Steps After Phase 1

Once Phase 1 is complete, you can:

1. **Test profile creation** - Create an account and edit your profile
2. **Test connections** - Add contacts to different ring tiers
3. **Test messaging** - Send messages between users
4. **Build Phase 2** - Add pings and alerts tables
5. **Add real-time** - Set up Supabase realtime subscriptions

## 📱 Testing Your Setup

After migration, test in your app:

```javascript
// Test 1: Create/Update Profile
// Go to Profile screen → Edit → Save changes

// Test 2: Check if profile saves
// Verify in Supabase dashboard under Table Editor → profiles

// Test 3: Upload avatar
// Go to Profile Edit → Tap avatar → Select image
// Check Storage → profile-pictures bucket
```

## 🎉 You're Ready!

Once you complete these steps, your Phase 1 database will be fully operational and your app will have:

- ✅ Cloud-synced user profiles
- ✅ Profile picture uploads
- ✅ Connection management foundation
- ✅ Messaging infrastructure
- ✅ Offline support (via local AsyncStorage fallback)

Need help? Just ask me to:
- "Test the database connection"
- "Add sample data"
- "Build Phase 2 tables"
- "Create API utilities for connections/messages"
