-- =====================================================
-- PING APP - PHASE 1 DATABASE MIGRATION
-- =====================================================
-- This migration creates the essential tables for:
-- - User profiles (digital business cards)
-- - Connections (networking relationships)
-- - Messages (direct messaging)
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- Purpose: Store user profile information (digital business card)
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
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

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company);

-- Enable Row Level Security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- RLS Policies for profiles
-- Allow anyone to view any profile (for discovery and networking)
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert only their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TABLE: connections
-- Purpose: Manage relationships between users with ring tiers
-- =====================================================

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  connected_user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  connection_type TEXT DEFAULT 'contact' CHECK (connection_type IN ('contact', 'favorite', 'blocked')),
  ring_tier INTEGER DEFAULT 3 CHECK (ring_tier >= 1 AND ring_tier <= 5),
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE,

  -- Ensure unique connections between users
  UNIQUE(user_id, connected_user_id),

  -- Prevent self-connections
  CHECK (user_id != connected_user_id)
);

-- Create indexes for connections
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_ring_tier ON connections(ring_tier);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(connection_type);

-- Enable Row Level Security on connections
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own connections" ON connections;
DROP POLICY IF EXISTS "Users can view connections where they are connected" ON connections;
DROP POLICY IF EXISTS "Users can insert own connections" ON connections;
DROP POLICY IF EXISTS "Users can update own connections" ON connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON connections;

-- RLS Policies for connections
-- Allow users to view their own connections
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to view connections where they are the connected user
CREATE POLICY "Users can view connections where they are connected"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = connected_user_id);

-- Allow users to insert connections where they are the user
CREATE POLICY "Users can insert own connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own connections
CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own connections
CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: messages
-- Purpose: Store direct messages between users
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent self-messaging
  CHECK (sender_id != receiver_id)
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view sent messages" ON messages;
DROP POLICY IF EXISTS "Users can view received messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages as sender" ON messages;
DROP POLICY IF EXISTS "Users can update received messages" ON messages;
DROP POLICY IF EXISTS "Users can delete sent messages" ON messages;

-- RLS Policies for messages
-- Allow users to view messages they sent
CREATE POLICY "Users can view sent messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

-- Allow users to view messages they received
CREATE POLICY "Users can view received messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Allow users to insert messages where they are the sender
CREATE POLICY "Users can insert messages as sender"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Allow users to update messages they received (for marking as read)
CREATE POLICY "Users can update received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Allow users to delete messages they sent
CREATE POLICY "Users can delete sent messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for connections updated_at
DROP TRIGGER IF EXISTS update_connections_updated_at ON connections;
CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for messages updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set read_at when read is set to true
CREATE OR REPLACE FUNCTION set_message_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = TRUE AND OLD.read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for messages read_at
DROP TRIGGER IF EXISTS set_messages_read_at ON messages;
CREATE TRIGGER set_messages_read_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_read_at();

-- =====================================================
-- HELPER FUNCTIONS FOR APP
-- =====================================================

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM messages
    WHERE receiver_id = user_uuid AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get connection count by ring tier
CREATE OR REPLACE FUNCTION get_connection_count_by_ring(user_uuid UUID, tier INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM connections
    WHERE user_id = user_uuid
      AND ring_tier = tier
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_count_by_ring(UUID, INTEGER) TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Create storage bucket 'profile-pictures' in Supabase dashboard
-- 2. Run this migration in Supabase SQL Editor
-- 3. Verify tables are created with: SELECT * FROM pg_tables WHERE schemaname = 'public';
-- =====================================================
