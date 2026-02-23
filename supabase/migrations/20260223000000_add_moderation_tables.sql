-- =====================================================
-- PING APP - MODERATION TABLES (Apple App Store UGC Compliance)
-- =====================================================
-- Adds reports and blocked_users tables for user-generated
-- content moderation required by App Store Review Guidelines.
-- =====================================================

-- =====================================================
-- TABLE: reports
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can insert reports where they are the reporter
CREATE POLICY "Users can report other users"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Policy: users can view their own submitted reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- =====================================================
-- TABLE: blocked_users
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Policy: users can block other users
CREATE POLICY "Users can block other users"
  ON public.blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = auth.uid());

-- Policy: users can view their own blocks
CREATE POLICY "Users can view own blocks"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (blocker_id = auth.uid());

-- Policy: users can unblock (delete their own blocks)
CREATE POLICY "Users can unblock users"
  ON public.blocked_users FOR DELETE
  TO authenticated
  USING (blocker_id = auth.uid());
