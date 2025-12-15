-- Phase 2: allow imported contacts to link to a real ping user (optional)
-- Run AFTER supabase_migration_phase2_circles.sql

ALTER TABLE public.imported_contacts
  ADD COLUMN IF NOT EXISTS matched_user_id UUID REFERENCES auth.users ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS imported_contacts_matched_user_id_idx
  ON public.imported_contacts (matched_user_id);




