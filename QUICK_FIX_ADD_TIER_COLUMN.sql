-- QUICK FIX: Add the missing 'tier' column to circles table
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Add the tier column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'circles' AND column_name = 'tier'
    ) THEN
        ALTER TABLE public.circles 
        ADD COLUMN tier INTEGER NOT NULL DEFAULT 1 CHECK (tier >= 1 AND tier <= 10);
        
        RAISE NOTICE 'Successfully added tier column to circles table';
    ELSE
        RAISE NOTICE 'tier column already exists';
    END IF;
END $$;

-- Step 2: Update any existing circles to have proper tier values based on creation order
WITH numbered_circles AS (
  SELECT 
    id, 
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM public.circles
)
UPDATE public.circles c
SET tier = nc.row_num
FROM numbered_circles nc
WHERE c.id = nc.id AND (c.tier IS NULL OR c.tier = 1);

-- Step 3: Create unique index on user_id and tier if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS circles_user_tier_unique
  ON public.circles (user_id, tier);

-- Step 4: Verify the fix
SELECT 
  'Circles table structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'circles'
ORDER BY ordinal_position;

-- Step 5: Show your existing circles
SELECT 
  'Your circles:' as info,
  id,
  name,
  tier,
  created_at
FROM public.circles
WHERE user_id = auth.uid()
ORDER BY tier;

