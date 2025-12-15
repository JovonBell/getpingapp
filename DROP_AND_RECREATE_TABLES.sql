-- DROP AND RECREATE: Start completely fresh
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Drop existing tables (in correct order to avoid FK errors)
DROP TABLE IF EXISTS public.circle_members CASCADE;
DROP TABLE IF EXISTS public.circles CASCADE;
DROP TABLE IF EXISTS public.imported_contacts CASCADE;

-- Step 2: Create imported_contacts table
CREATE TABLE public.imported_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  contact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  initials TEXT,
  email TEXT,
  phone TEXT,
  matched_user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX imported_contacts_user_contact_unique
  ON public.imported_contacts (user_id, contact_id);

-- Step 3: Create circles table
CREATE TABLE public.circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX circles_user_tier_unique
  ON public.circles (user_id, tier);

-- Step 4: Create circle_members table
CREATE TABLE public.circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES public.circles ON DELETE CASCADE NOT NULL,
  imported_contact_id UUID REFERENCES public.imported_contacts ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX circle_members_unique
  ON public.circle_members (circle_id, imported_contact_id);

-- Step 5: Enable RLS on all tables
ALTER TABLE public.imported_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for imported_contacts
CREATE POLICY "Users can view own imported contacts"
  ON public.imported_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own imported contacts"
  ON public.imported_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own imported contacts"
  ON public.imported_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own imported contacts"
  ON public.imported_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 7: Create RLS policies for circles
CREATE POLICY "Users can view own circles"
  ON public.circles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own circles"
  ON public.circles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own circles"
  ON public.circles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own circles"
  ON public.circles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 8: Create RLS policies for circle_members
CREATE POLICY "Users can view own circle members"
  ON public.circle_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.circles c
      WHERE c.id = circle_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own circle members"
  ON public.circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.circles c
      WHERE c.id = circle_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own circle members"
  ON public.circle_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.circles c
      WHERE c.id = circle_id AND c.user_id = auth.uid()
    )
  );

-- Step 9: Verify everything was created correctly
SELECT 'SUCCESS! All tables recreated with correct structure!' as message;

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('circles', 'imported_contacts', 'circle_members')
ORDER BY table_name, ordinal_position;



