-- Fix Row Level Security for circle_members table
-- This allows users to add contacts to their own circles

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can manage their own circle memberships" ON public.circle_members;

-- Create a new, correct policy that checks if the user owns the circle
CREATE POLICY "Users can manage circle members for their circles"
ON public.circle_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.circles
    WHERE circles.id = circle_members.circle_id
    AND circles.user_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'circle_members';

