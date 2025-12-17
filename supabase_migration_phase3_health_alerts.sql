-- ============================================
-- Phase 3: Relationship Health + Alerts
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- Table 1: relationship_health
-- Tracks health score for each contact in a circle
-- ============================================

CREATE TABLE IF NOT EXISTS relationship_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imported_contact_id UUID NOT NULL REFERENCES imported_contacts(id) ON DELETE CASCADE,
  health_score INT DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'cooling', 'at_risk', 'cold')),
  days_since_contact INT DEFAULT 0,
  last_contact_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, imported_contact_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_relationship_health_user_id ON relationship_health(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_health_status ON relationship_health(user_id, status);
CREATE INDEX IF NOT EXISTS idx_relationship_health_score ON relationship_health(user_id, health_score);

-- RLS
ALTER TABLE relationship_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health scores"
  ON relationship_health FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health scores"
  ON relationship_health FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health scores"
  ON relationship_health FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health scores"
  ON relationship_health FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Table 2: alerts
-- Internal notifications for users
-- ============================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('health_decline', 'needs_attention', 'daily_summary', 'milestone', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  related_contact_id UUID REFERENCES imported_contacts(id) ON DELETE SET NULL,
  threshold_crossed INT, -- 80, 60, or 40 for health alerts
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(user_id, created_at DESC);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Table 3: alert_history
-- Prevents duplicate alerts for same threshold
-- ============================================

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imported_contact_id UUID NOT NULL REFERENCES imported_contacts(id) ON DELETE CASCADE,
  threshold INT NOT NULL CHECK (threshold IN (80, 60, 40)),
  alerted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, imported_contact_id, threshold)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_alert_history_lookup ON alert_history(user_id, imported_contact_id);

-- RLS
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert history"
  ON alert_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert history"
  ON alert_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert history"
  ON alert_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RPC Functions
-- ============================================

-- Get unread alert count for a user
CREATE OR REPLACE FUNCTION get_unread_alert_count(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INT
    FROM alerts
    WHERE user_id = p_user_id AND read = FALSE
  );
END;
$$;

-- Get contacts needing attention (health score below threshold)
CREATE OR REPLACE FUNCTION get_contacts_needing_attention(p_user_id UUID, p_threshold INT DEFAULT 60)
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  health_score INT,
  status TEXT,
  days_since_contact INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rh.imported_contact_id,
    ic.name,
    rh.health_score,
    rh.status,
    rh.days_since_contact
  FROM relationship_health rh
  JOIN imported_contacts ic ON ic.id = rh.imported_contact_id
  WHERE rh.user_id = p_user_id
    AND rh.health_score < p_threshold
  ORDER BY rh.health_score ASC;
END;
$$;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Phase 3 migration complete: relationship_health, alerts, alert_history tables created';
END $$;
