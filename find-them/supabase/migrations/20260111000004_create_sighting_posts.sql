-- Sighting posts table (found/seen pets)
CREATE TABLE sighting_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Sighting details
  animal_type animal_type NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',

  -- Location (PostGIS point)
  sighting_location GEOGRAPHY(POINT, 4326) NOT NULL,
  sighting_address TEXT,
  location_accuracy_meters DECIMAL(10,2),

  -- Timing (when the pet was seen, NOT when posted)
  sighted_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Status
  status post_status DEFAULT 'active' NOT NULL,
  visibility visibility_level DEFAULT 'public' NOT NULL,

  -- Matching
  matched_pet_post_id UUID REFERENCES pet_posts(id) ON DELETE SET NULL,
  marked_helpful_by UUID[] DEFAULT '{}', -- Array of user IDs who found this helpful

  -- Metadata
  view_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_sighting_posts_user ON sighting_posts(user_id);
CREATE INDEX idx_sighting_posts_status ON sighting_posts(status) WHERE status = 'active';
CREATE INDEX idx_sighting_posts_animal_type ON sighting_posts(animal_type);
CREATE INDEX idx_sighting_posts_sighted_at ON sighting_posts(sighted_at DESC);

-- Geospatial index
CREATE INDEX idx_sighting_posts_location ON sighting_posts USING GIST(sighting_location);

-- RLS Policies
ALTER TABLE sighting_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active sightings are viewable by everyone"
  ON sighting_posts FOR SELECT
  USING (
    status = 'active' AND visibility = 'public'
    OR user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create sightings"
  ON sighting_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own sightings"
  ON sighting_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sightings"
  ON sighting_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update timestamp
CREATE TRIGGER update_sighting_posts_updated_at
  BEFORE UPDATE ON sighting_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment profile sightings count
CREATE OR REPLACE FUNCTION increment_user_sightings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET total_sightings = total_sightings + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_sightings_count
  AFTER INSERT ON sighting_posts
  FOR EACH ROW EXECUTE FUNCTION increment_user_sightings();
