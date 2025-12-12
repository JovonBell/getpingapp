-- Adds identity matching support (hashed identifiers) and idempotent connections.
-- Run this AFTER supabase_migration_phase1_clean.sql

CREATE TABLE IF NOT EXISTS public.user_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
  hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A given (type,hash) maps to one user. This powers matching.
CREATE UNIQUE INDEX IF NOT EXISTS user_identities_type_hash_unique
  ON public.user_identities (type, hash);

-- Users can manage their own identity hashes.
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- SELECT: allow authenticated users to read identities for matching (hashes only, no PII)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read identity hashes'
  ) THEN
    CREATE POLICY "Users can read identity hashes"
      ON public.user_identities FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- INSERT/DELETE: only own identities
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own identity hashes'
  ) THEN
    CREATE POLICY "Users can insert own identity hashes"
      ON public.user_identities FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own identity hashes'
  ) THEN
    CREATE POLICY "Users can delete own identity hashes"
      ON public.user_identities FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Make connections upsertable/idempotent
CREATE UNIQUE INDEX IF NOT EXISTS connections_user_connected_unique
  ON public.connections (user_id, connected_user_id);


