-- SAFE CLEANUP: Only deletes from tables that exist
-- Run this in Supabase Dashboard → SQL Editor

DO $$
DECLARE
  current_user_uuid uuid;
BEGIN
  -- Get current user ID
  current_user_uuid := auth.uid();
  
  IF current_user_uuid IS NULL THEN
    RAISE NOTICE 'No auth session found. Make sure you are logged in.';
    RETURN;
  END IF;

  -- Delete circles (this table should exist)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'circles'
  ) THEN
    DELETE FROM public.circles WHERE user_id = current_user_uuid;
    RAISE NOTICE 'Deleted circles for user %', current_user_uuid;
  ELSE
    RAISE NOTICE 'Table circles does not exist yet';
  END IF;

  -- Delete circle_members (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'circle_members'
  ) THEN
    DELETE FROM public.circle_members 
    WHERE circle_id NOT IN (SELECT id FROM public.circles);
    RAISE NOTICE 'Cleaned up orphaned circle_members';
  ELSE
    RAISE NOTICE 'Table circle_members does not exist yet';
  END IF;

  -- Skip imported_contacts (it doesn't exist yet - that's OK!)
  RAISE NOTICE 'Cleanup complete! Ready to create new circles.';
END
$$;

