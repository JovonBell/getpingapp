-- =====================================================
-- PING APP - PHASE 1 DATABASE MIGRATION (CLEAN VERSION)
-- =====================================================
-- This version safely creates only the tables that don't exist
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE profiles (
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

    -- Create indexes
    CREATE INDEX idx_profiles_user_id ON profiles(user_id);
    CREATE INDEX idx_profiles_display_name ON profiles(display_name);
    CREATE INDEX idx_profiles_company ON profiles(company);

    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE '✅ Table profiles created successfully';
  ELSE
    RAISE NOTICE 'ℹ️  Table profiles already exists, skipping';
  END IF;
END $$;

-- =====================================================
-- TABLE: connections
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'connections') THEN
    CREATE TABLE connections (
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
      UNIQUE(user_id, connected_user_id),
      CHECK (user_id != connected_user_id)
    );

    -- Create indexes
    CREATE INDEX idx_connections_user_id ON connections(user_id);
    CREATE INDEX idx_connections_connected_user_id ON connections(connected_user_id);
    CREATE INDEX idx_connections_ring_tier ON connections(ring_tier);
    CREATE INDEX idx_connections_status ON connections(status);
    CREATE INDEX idx_connections_type ON connections(connection_type);

    -- Enable RLS
    ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view own connections"
      ON connections FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can view connections where they are connected"
      ON connections FOR SELECT
      TO authenticated
      USING (auth.uid() = connected_user_id);

    CREATE POLICY "Users can insert own connections"
      ON connections FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own connections"
      ON connections FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete own connections"
      ON connections FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);

    RAISE NOTICE '✅ Table connections created successfully';
  ELSE
    RAISE NOTICE 'ℹ️  Table connections already exists, skipping';
  END IF;
END $$;

-- =====================================================
-- TABLE: messages
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    CREATE TABLE messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sender_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      receiver_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CHECK (sender_id != receiver_id)
    );

    -- Create indexes
    CREATE INDEX idx_messages_sender ON messages(sender_id);
    CREATE INDEX idx_messages_receiver ON messages(receiver_id);
    CREATE INDEX idx_messages_unread ON messages(receiver_id, read) WHERE read = FALSE;
    CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
    CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

    -- Enable RLS
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view sent messages"
      ON messages FOR SELECT
      TO authenticated
      USING (auth.uid() = sender_id);

    CREATE POLICY "Users can view received messages"
      ON messages FOR SELECT
      TO authenticated
      USING (auth.uid() = receiver_id);

    CREATE POLICY "Users can insert messages as sender"
      ON messages FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = sender_id);

    CREATE POLICY "Users can update received messages"
      ON messages FOR UPDATE
      TO authenticated
      USING (auth.uid() = receiver_id)
      WITH CHECK (auth.uid() = receiver_id);

    CREATE POLICY "Users can delete sent messages"
      ON messages FOR DELETE
      TO authenticated
      USING (auth.uid() = sender_id);

    RAISE NOTICE '✅ Table messages created successfully';
  ELSE
    RAISE NOTICE 'ℹ️  Table messages already exists, skipping';
  END IF;
END $$;

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

-- Triggers for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for connections
DROP TRIGGER IF EXISTS update_connections_updated_at ON connections;
CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set read_at
CREATE OR REPLACE FUNCTION set_message_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = TRUE AND OLD.read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_messages_read_at ON messages;
CREATE TRIGGER set_messages_read_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_read_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

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

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_count_by_ring(UUID, INTEGER) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check what tables now exist
SELECT
  tablename,
  CASE
    WHEN tablename IN ('profiles', 'connections', 'messages') THEN '✅ Phase 1'
    ELSE 'ℹ️  Other'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
