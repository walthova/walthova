-- Matches table (system-generated potential matches)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_post_id UUID NOT NULL REFERENCES pet_posts(id) ON DELETE CASCADE,
  sighting_post_id UUID NOT NULL REFERENCES sighting_posts(id) ON DELETE CASCADE,

  -- Match scoring
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  distance_meters DECIMAL(10,2) NOT NULL,
  time_difference_hours INTEGER NOT NULL,

  -- Score breakdown
  score_details JSONB DEFAULT '{}'::jsonb, -- Store individual component scores

  -- User feedback
  dismissed_by UUID[] DEFAULT '{}', -- Users who said "not my pet"
  confirmed_by UUID[] DEFAULT '{}', -- Users who confirmed match

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_matches_pet_post ON matches(pet_post_id);
CREATE INDEX idx_matches_sighting_post ON matches(sighting_post_id);
CREATE INDEX idx_matches_score ON matches(match_score DESC) WHERE is_active = TRUE;
CREATE INDEX idx_matches_created ON matches(created_at DESC);

-- Unique constraint: one match per pet-sighting pair
CREATE UNIQUE INDEX idx_matches_unique ON matches(pet_post_id, sighting_post_id);

-- RLS Policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view matches for their posts"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pet_posts pp WHERE pp.id = matches.pet_post_id AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM sighting_posts sp WHERE sp.id = matches.sighting_post_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update matches for their posts"
  ON matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pet_posts pp WHERE pp.id = matches.pet_post_id AND pp.user_id = auth.uid()
    )
  );
