-- Phase 2: Persist imported contacts + circles + circle members in Supabase
-- Run AFTER:
--   1) supabase_migration_phase1_clean.sql
--   2) supabase_migration_phase1_contacts_identities.sql

-- Imported contacts (your local universe) stored per user
CREATE TABLE IF NOT EXISTS public.imported_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  contact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  initials TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS imported_contacts_user_contact_unique
  ON public.imported_contacts (user_id, contact_id);

ALTER TABLE public.imported_contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own imported contacts') THEN
    CREATE POLICY "Users can view own imported contacts"
      ON public.imported_contacts FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own imported contacts') THEN
    CREATE POLICY "Users can insert own imported contacts"
      ON public.imported_contacts FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own imported contacts') THEN
    CREATE POLICY "Users can update own imported contacts"
      ON public.imported_contacts FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own imported contacts') THEN
    CREATE POLICY "Users can delete own imported contacts"
      ON public.imported_contacts FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Circles (rings)
CREATE TABLE IF NOT EXISTS public.circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS circles_user_tier_unique
  ON public.circles (user_id, tier);

ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own circles') THEN
    CREATE POLICY "Users can view own circles"
      ON public.circles FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own circles') THEN
    CREATE POLICY "Users can insert own circles"
      ON public.circles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own circles') THEN
    CREATE POLICY "Users can update own circles"
      ON public.circles FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own circles') THEN
    CREATE POLICY "Users can delete own circles"
      ON public.circles FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Circle members reference imported_contacts
CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES public.circles ON DELETE CASCADE NOT NULL,
  imported_contact_id UUID REFERENCES public.imported_contacts ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS circle_members_unique
  ON public.circle_members (circle_id, imported_contact_id);

ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own circle members') THEN
    CREATE POLICY "Users can view own circle members"
      ON public.circle_members FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.circles c
          WHERE c.id = circle_id AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own circle members') THEN
    CREATE POLICY "Users can insert own circle members"
      ON public.circle_members FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.circles c
          WHERE c.id = circle_id AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own circle members') THEN
    CREATE POLICY "Users can delete own circle members"
      ON public.circle_members FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.circles c
          WHERE c.id = circle_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;


