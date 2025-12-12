-- Phase 2: Device push tokens (Expo)
-- Run AFTER Phase 1 + Phase 2 circles migrations

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, expo_push_token)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own device tokens') THEN
    CREATE POLICY "Users can view own device tokens"
      ON public.device_tokens FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own device tokens') THEN
    CREATE POLICY "Users can insert own device tokens"
      ON public.device_tokens FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own device tokens') THEN
    CREATE POLICY "Users can update own device tokens"
      ON public.device_tokens FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own device tokens') THEN
    CREATE POLICY "Users can delete own device tokens"
      ON public.device_tokens FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;


