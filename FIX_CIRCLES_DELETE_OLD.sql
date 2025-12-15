-- Fix: Delete old/broken circles and start fresh
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Check what circles exist (for your reference)
SELECT 
  'Your existing circles (before cleanup):' as info,
  id,
  name,
  tier,
  created_at
FROM public.circles
WHERE user_id = auth.uid();

-- Step 2: Delete ALL existing circles (they're broken due to duplicate tiers)
DELETE FROM public.circles
WHERE user_id = auth.uid();

-- Step 3: Also clean up any orphaned data
DELETE FROM public.circle_members
WHERE circle_id NOT IN (SELECT id FROM public.circles);

DELETE FROM public.imported_contacts
WHERE user_id = auth.uid();

-- Step 4: Verify cleanup
SELECT 
  'Cleanup complete! Ready to create new circles.' as message,
  (SELECT COUNT(*) FROM public.circles WHERE user_id = auth.uid()) as circles_count,
  (SELECT COUNT(*) FROM public.imported_contacts WHERE user_id = auth.uid()) as contacts_count;



