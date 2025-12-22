-- Phase D: Gamification System Migration
-- This migration creates tables for streaks, achievements, and related features

-- ============================================
-- 1. User Streaks Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  total_days_active INT DEFAULT 0,
  weekly_goal INT DEFAULT 5 CHECK (weekly_goal >= 1 AND weekly_goal <= 7),
  weekly_progress INT DEFAULT 0,
  week_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient user lookup
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- ============================================
-- 2. User Achievements Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Index for efficient user lookup
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- ============================================
-- 3. Activity Log Table (for tracking engagements)
-- ============================================
-- Note: This table may already exist from Phase A analytics
-- Adding IF NOT EXISTS to be safe
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  related_contact_id UUID REFERENCES imported_contacts(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- ============================================
-- 4. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can insert their own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;

-- User Streaks Policies
CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- User Achievements Policies
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. Activity Log RLS Policies (if not exists)
-- ============================================
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own activity" ON activity_log;
DROP POLICY IF EXISTS "Users can insert their own activity" ON activity_log;

CREATE POLICY "Users can view their own activity"
  ON activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to get the start of the current week (Monday)
CREATE OR REPLACE FUNCTION get_week_start_date()
RETURNS DATE AS $$
BEGIN
  RETURN DATE_TRUNC('week', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update streak on activity
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_record user_streaks%ROWTYPE;
  today DATE := CURRENT_DATE;
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  current_week_start DATE := get_week_start_date();
BEGIN
  -- Only process message_sent activities
  IF NEW.activity_type != 'message_sent' THEN
    RETURN NEW;
  END IF;

  -- Get or create streak record
  SELECT * INTO streak_record FROM user_streaks WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_days_active, weekly_progress, week_start_date)
    VALUES (NEW.user_id, 1, 1, today, 1, 1, current_week_start);
    RETURN NEW;
  END IF;

  -- Check if this is a new day
  IF streak_record.last_activity_date = today THEN
    -- Already active today, no update needed
    RETURN NEW;
  END IF;

  -- Update streak
  IF streak_record.last_activity_date = yesterday THEN
    -- Continuing streak
    UPDATE user_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = today,
      total_days_active = total_days_active + 1,
      weekly_progress = CASE
        WHEN week_start_date != current_week_start THEN 1
        ELSE weekly_progress + 1
      END,
      week_start_date = current_week_start,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSE
    -- Streak broken, start fresh
    UPDATE user_streaks SET
      current_streak = 1,
      last_activity_date = today,
      total_days_active = total_days_active + 1,
      weekly_progress = CASE
        WHEN week_start_date != current_week_start THEN 1
        ELSE weekly_progress + 1
      END,
      week_start_date = current_week_start,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating streaks on activity
DROP TRIGGER IF EXISTS trigger_update_streak ON activity_log;
CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- ============================================
-- Done!
-- ============================================
-- Run this migration in your Supabase SQL editor
-- After running, the gamification features will be ready to use

COMMENT ON TABLE user_streaks IS 'Tracks daily engagement streaks and weekly goals for users';
COMMENT ON TABLE user_achievements IS 'Stores unlocked achievements for each user';
