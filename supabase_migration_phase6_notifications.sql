-- =====================================================
-- PHASE 6: Push Notifications Enhancement
-- Run this in Supabase SQL Editor AFTER Phase 4 and 5
-- =====================================================

-- Add notification_id column to reminders table
-- This stores the expo notification ID for cancellation
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS notification_id TEXT;

-- Add is_dismissed column if not exists (for dismissing without completing)
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT FALSE;

-- Index for finding reminders with notifications
CREATE INDEX IF NOT EXISTS idx_reminders_notification_id
ON reminders(notification_id)
WHERE notification_id IS NOT NULL;

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE (Optional)
-- Store user notification preferences in database
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  reminders_enabled BOOLEAN DEFAULT TRUE,
  daily_digest_enabled BOOLEAN DEFAULT TRUE,
  daily_digest_hour INT DEFAULT 9 CHECK (daily_digest_hour >= 0 AND daily_digest_hour <= 23),
  birthday_reminders_enabled BOOLEAN DEFAULT TRUE,
  streak_warnings_enabled BOOLEAN DEFAULT TRUE,
  achievement_notifications_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- Done! Notification system is ready.
-- =====================================================
