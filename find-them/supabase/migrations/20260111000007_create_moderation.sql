-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What's being reported
  reported_post_id UUID, -- Could be pet_post or sighting_post
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_type post_type, -- To know which table to check

  -- Report details
  reason report_reason NOT NULL,
  description TEXT,

  -- Snapshot of reported content (in case it's edited/deleted)
  content_snapshot JSONB,

  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_unresolved ON reports(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id AND auth.role() = 'authenticated');

-- Only service role can resolve reports
CREATE POLICY "Service role can update reports"
  ON reports FOR UPDATE
  USING (auth.role() = 'service_role');

-- Blocks table
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraint: can't block yourself, can't block same user twice
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Unique constraint
CREATE UNIQUE INDEX idx_blocks_unique ON blocks(blocker_id, blocked_id);

-- Indexes
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- RLS Policies
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON blocks FOR DELETE
  USING (blocker_id = auth.uid());

-- Function to auto-shadow-ban users with multiple reports
CREATE OR REPLACE FUNCTION check_auto_shadow_ban()
RETURNS TRIGGER AS $$
DECLARE
  v_report_count INTEGER;
BEGIN
  -- Count unresolved reports for this user
  SELECT COUNT(*) INTO v_report_count
  FROM reports
  WHERE reported_user_id = NEW.reported_user_id
    AND is_resolved = FALSE;

  -- If 3+ reports, shadow ban
  IF v_report_count >= 3 THEN
    UPDATE profiles
    SET is_shadow_banned = TRUE
    WHERE id = NEW.reported_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_shadow_ban
  AFTER INSERT ON reports
  FOR EACH ROW
  WHEN (NEW.reported_user_id IS NOT NULL)
  EXECUTE FUNCTION check_auto_shadow_ban();
