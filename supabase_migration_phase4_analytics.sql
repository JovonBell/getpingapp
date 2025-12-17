-- =====================================================
-- PHASE 4: Analytics Dashboard Tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Activity Log Table
-- Tracks user actions for analytics and activity summary
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'message_sent', 'contact_added', 'health_improved', 'health_declined', 'circle_created', 'reminder_completed'
  related_contact_id UUID REFERENCES imported_contacts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_type ON activity_log(user_id, activity_type);

-- RLS Policies for activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity log"
  ON activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity log"
  ON activity_log FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Health Snapshots Table
-- Daily snapshots of relationship health for trend tracking
CREATE TABLE IF NOT EXISTS health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL,
  average_health INT CHECK (average_health >= 0 AND average_health <= 100),
  total_contacts INT DEFAULT 0,
  healthy_count INT DEFAULT 0,
  cooling_count INT DEFAULT 0,
  at_risk_count INT DEFAULT 0,
  cold_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Index for efficient trend queries
CREATE INDEX IF NOT EXISTS idx_health_snapshots_user_date ON health_snapshots(user_id, snapshot_date DESC);

-- RLS Policies for health_snapshots
ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health snapshots"
  ON health_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health snapshots"
  ON health_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health snapshots"
  ON health_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Contact Dates Table
-- Stores birthdays, anniversaries, and custom dates for reminders
CREATE TABLE IF NOT EXISTS contact_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  imported_contact_id UUID REFERENCES imported_contacts(id) ON DELETE CASCADE NOT NULL,
  date_type TEXT NOT NULL CHECK (date_type IN ('birthday', 'anniversary', 'first_met', 'custom')),
  date_value DATE NOT NULL,
  label TEXT, -- custom label for 'custom' type
  remind_days_before INT DEFAULT 1, -- how many days before to remind
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, imported_contact_id, date_type)
);

-- Index for reminder queries
CREATE INDEX IF NOT EXISTS idx_contact_dates_user ON contact_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_dates_date ON contact_dates(date_value);

-- RLS Policies for contact_dates
ALTER TABLE contact_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact dates"
  ON contact_dates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact dates"
  ON contact_dates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact dates"
  ON contact_dates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact dates"
  ON contact_dates FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Reminders Table
-- Custom reminders for follow-ups, birthdays, etc.
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  imported_contact_id UUID REFERENCES imported_contacts(id) ON DELETE SET NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('birthday', 'anniversary', 'follow_up', 'reconnect', 'custom')),
  title TEXT NOT NULL,
  note TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  repeat_interval TEXT DEFAULT 'none' CHECK (repeat_interval IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  notification_scheduled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reminder queries
CREATE INDEX IF NOT EXISTS idx_reminders_user_due ON reminders(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user_pending ON reminders(user_id, is_completed, is_dismissed, due_date);

-- RLS Policies for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Add new columns to imported_contacts for enhanced profiles
DO $$
BEGIN
  -- Add notes column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'imported_contacts' AND column_name = 'notes') THEN
    ALTER TABLE imported_contacts ADD COLUMN notes TEXT;
  END IF;

  -- Add tags column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'imported_contacts' AND column_name = 'tags') THEN
    ALTER TABLE imported_contacts ADD COLUMN tags TEXT[];
  END IF;

  -- Add how_we_met column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'imported_contacts' AND column_name = 'how_we_met') THEN
    ALTER TABLE imported_contacts ADD COLUMN how_we_met TEXT;
  END IF;

  -- Add interests column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'imported_contacts' AND column_name = 'interests') THEN
    ALTER TABLE imported_contacts ADD COLUMN interests TEXT[];
  END IF;
END $$;

-- 6. Helper function to get upcoming reminders
CREATE OR REPLACE FUNCTION get_upcoming_reminders(p_user_id UUID, p_days_ahead INT DEFAULT 7)
RETURNS TABLE (
  id UUID,
  reminder_type TEXT,
  title TEXT,
  note TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  repeat_interval TEXT,
  contact_name TEXT,
  contact_initials TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.reminder_type,
    r.title,
    r.note,
    r.due_date,
    r.repeat_interval,
    ic.name AS contact_name,
    ic.initials AS contact_initials
  FROM reminders r
  LEFT JOIN imported_contacts ic ON r.imported_contact_id = ic.id
  WHERE r.user_id = p_user_id
    AND r.is_completed = FALSE
    AND r.is_dismissed = FALSE
    AND r.due_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
  ORDER BY r.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Helper function to get activity summary for a period
CREATE OR REPLACE FUNCTION get_activity_summary(p_user_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (
  activity_type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.activity_type,
    COUNT(*)::BIGINT AS count
  FROM activity_log al
  WHERE al.user_id = p_user_id
    AND al.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY al.activity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$ BEGIN RAISE NOTICE 'Phase 4 Analytics migration completed successfully!'; END $$;
