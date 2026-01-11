-- Karma ledger (all karma transactions)
CREATE TABLE karma_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Transaction details
  amount INTEGER NOT NULL, -- Positive for earned, negative for penalties
  reason karma_reason NOT NULL,
  description TEXT,

  -- Context (what action triggered this karma)
  related_post_id UUID, -- Could be pet_post or sighting_post
  related_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- User who triggered the award

  -- Validation
  is_validated BOOLEAN DEFAULT FALSE, -- TRUE if owner confirmed
  validated_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_karma_user ON karma_ledger(user_id);
CREATE INDEX idx_karma_reason ON karma_ledger(reason);
CREATE INDEX idx_karma_created ON karma_ledger(created_at DESC);

-- RLS Policies
ALTER TABLE karma_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own karma"
  ON karma_ledger FOR SELECT
  USING (user_id = auth.uid());

-- Only system/edge functions can insert karma (not direct user inserts)
CREATE POLICY "Service role can insert karma"
  ON karma_ledger FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Function to update profile karma score
CREATE OR REPLACE FUNCTION update_profile_karma()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET karma_score = karma_score + NEW.amount
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_karma_on_insert
  AFTER INSERT ON karma_ledger
  FOR EACH ROW EXECUTE FUNCTION update_profile_karma();

-- Function to award karma (called from edge functions or app)
CREATE OR REPLACE FUNCTION award_karma(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason karma_reason,
  p_description TEXT DEFAULT NULL,
  p_related_post_id UUID DEFAULT NULL,
  p_awarded_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_ledger_id UUID;
  v_trust_multiplier DECIMAL(3,2);
BEGIN
  -- Get user's trust score
  SELECT trust_score INTO v_trust_multiplier
  FROM profiles WHERE id = p_user_id;

  -- Apply trust multiplier (new users earn less)
  INSERT INTO karma_ledger (
    user_id, amount, reason, description,
    related_post_id, awarded_by
  ) VALUES (
    p_user_id,
    FLOOR(p_amount * v_trust_multiplier),
    p_reason,
    p_description,
    p_related_post_id,
    p_awarded_by
  ) RETURNING id INTO v_ledger_id;

  RETURN v_ledger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
