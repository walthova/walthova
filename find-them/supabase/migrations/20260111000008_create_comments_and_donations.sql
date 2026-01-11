-- Comments table (for coordination on posts)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What post is being commented on
  post_id UUID NOT NULL, -- Could be pet_post or sighting_post
  post_type post_type NOT NULL,

  -- Comment content
  content TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',

  -- Status
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_post ON comments(post_id, post_type);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- RLS Policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update timestamp
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Donations table (MVP stub, ready for v2)
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Donation details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Recipient (shelter or general fund)
  shelter_id UUID, -- To be added in v2 when shelter partnerships exist
  shelter_name TEXT,

  -- Payment
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'succeeded', 'failed'

  -- Optional: tie to a specific reunion
  related_pet_post_id UUID REFERENCES pet_posts(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_donations_user ON donations(user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created ON donations(created_at DESC);

-- RLS Policies
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own donations"
  ON donations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create donation pledges"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Push notification tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  device_type TEXT, -- 'ios', 'android'
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Unique constraint: one token per device
CREATE UNIQUE INDEX idx_push_tokens_unique ON push_tokens(user_id, expo_push_token);

-- Indexes
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push tokens"
  ON push_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);
