-- Pet posts table (lost pets)
CREATE TABLE pet_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Pet details
  pet_name TEXT NOT NULL,
  animal_type animal_type NOT NULL,
  breed TEXT,
  colors TEXT[] DEFAULT '{}',
  age_estimate TEXT, -- "puppy", "adult", "senior" or "2 years"
  size TEXT, -- "small", "medium", "large"
  distinguishing_marks TEXT,
  microchip_id TEXT,

  -- Post content
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}', -- Array of Supabase Storage URLs

  -- Location (PostGIS point)
  last_seen_location GEOGRAPHY(POINT, 4326) NOT NULL,
  last_seen_address TEXT, -- Human-readable address
  location_accuracy_meters DECIMAL(10,2),

  -- Timing
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Status
  status post_status DEFAULT 'active' NOT NULL,
  visibility visibility_level DEFAULT 'public' NOT NULL,

  -- Contact
  contact_method TEXT DEFAULT 'in_app', -- 'in_app' or 'phone'
  contact_phone TEXT, -- Encrypted, only shown if user opts in

  -- Metadata
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  helpful_sightings_count INTEGER DEFAULT 0,

  -- Reunited
  reunited_at TIMESTAMP WITH TIME ZONE,
  reunion_story TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_pet_posts_user ON pet_posts(user_id);
CREATE INDEX idx_pet_posts_status ON pet_posts(status) WHERE status = 'active';
CREATE INDEX idx_pet_posts_animal_type ON pet_posts(animal_type);
CREATE INDEX idx_pet_posts_created ON pet_posts(created_at DESC);

-- Geospatial index (critical for location queries)
CREATE INDEX idx_pet_posts_location ON pet_posts USING GIST(last_seen_location);

-- Full-text search index for descriptions
CREATE INDEX idx_pet_posts_description ON pet_posts USING GIN(to_tsvector('english', description));

-- RLS Policies
ALTER TABLE pet_posts ENABLE ROW LEVEL SECURITY;

-- Public posts are viewable by everyone
CREATE POLICY "Active pet posts are viewable by everyone"
  ON pet_posts FOR SELECT
  USING (
    status = 'active' AND visibility = 'public'
    OR user_id = auth.uid()
  );

-- Authenticated users can insert their own posts
CREATE POLICY "Authenticated users can create pet posts"
  ON pet_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON pet_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON pet_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update timestamp
CREATE TRIGGER update_pet_posts_updated_at
  BEFORE UPDATE ON pet_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment profile post count
CREATE OR REPLACE FUNCTION increment_user_posts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET total_posts = total_posts + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_posts_count
  AFTER INSERT ON pet_posts
  FOR EACH ROW EXECUTE FUNCTION increment_user_posts();
