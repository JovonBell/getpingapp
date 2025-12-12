-- Fix RLS policies for circle_members
-- Run this in Supabase Dashboard → SQL Editor

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own circle members" ON public.circle_members;

-- Create a more permissive INSERT policy that checks imported_contacts ownership
CREATE POLICY "Users can insert own circle members"
  ON public.circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if the imported_contact belongs to the current user
    EXISTS (
      SELECT 1 FROM public.imported_contacts ic
      WHERE ic.id = imported_contact_id AND ic.user_id = auth.uid()
    )
    OR
    -- OR if the circle belongs to the current user
    EXISTS (
      SELECT 1 FROM public.circles c
      WHERE c.id = circle_id AND c.user_id = auth.uid()
    )
  );

-- Verify the fix
SELECT 'RLS policies updated successfully!' as message;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'circle_members' 
ORDER BY policyname;

