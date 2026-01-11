-- Helper function to get nearby pet posts
CREATE OR REPLACE FUNCTION get_nearby_pet_posts(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_miles INTEGER DEFAULT 25,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  pet_name TEXT,
  animal_type animal_type,
  description TEXT,
  photos TEXT[],
  distance_miles DECIMAL,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  status post_status,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.id,
    pp.pet_name,
    pp.animal_type,
    pp.description,
    pp.photos,
    ROUND((ST_Distance(
      pp.last_seen_location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1609.344)::numeric, 2) AS distance_miles,
    pp.last_seen_at,
    pp.status,
    pp.user_id
  FROM pet_posts pp
  WHERE pp.status = 'active'
    AND ST_DWithin(
      pp.last_seen_location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_miles * 1609.344 -- Convert miles to meters
    )
  ORDER BY
    ST_Distance(
      pp.last_seen_location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) ASC,
    pp.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get nearby sightings
CREATE OR REPLACE FUNCTION get_nearby_sightings(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_miles INTEGER DEFAULT 25,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  animal_type animal_type,
  description TEXT,
  photos TEXT[],
  distance_miles DECIMAL,
  sighted_at TIMESTAMP WITH TIME ZONE,
  status post_status,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.animal_type,
    sp.description,
    sp.photos,
    ROUND((ST_Distance(
      sp.sighting_location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1609.344)::numeric, 2) AS distance_miles,
    sp.sighted_at,
    sp.status,
    sp.user_id
  FROM sighting_posts sp
  WHERE sp.status = 'active'
    AND ST_DWithin(
      sp.sighting_location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_miles * 1609.344
    )
  ORDER BY
    ST_Distance(
      sp.sighting_location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) ASC,
    sp.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate match score between pet post and sighting
CREATE OR REPLACE FUNCTION calculate_match_score(
  pet_post_id_input UUID,
  sighting_post_id_input UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_distance_score INTEGER;
  v_time_score INTEGER;
  v_animal_match_score INTEGER;
  v_color_match_score INTEGER;
  v_total_score INTEGER;
  v_distance_meters DECIMAL;
  v_time_diff_hours INTEGER;
  v_pet_animal animal_type;
  v_sighting_animal animal_type;
  v_pet_colors TEXT[];
  v_sighting_colors TEXT[];
  v_color_overlap INTEGER;
BEGIN
  -- Get pet post details
  SELECT
    animal_type,
    colors,
    ST_Distance(
      last_seen_location,
      (SELECT sighting_location FROM sighting_posts WHERE id = sighting_post_id_input)
    ),
    EXTRACT(EPOCH FROM (
      (SELECT sighted_at FROM sighting_posts WHERE id = sighting_post_id_input) - last_seen_at
    )) / 3600
  INTO v_pet_animal, v_pet_colors, v_distance_meters, v_time_diff_hours
  FROM pet_posts
  WHERE id = pet_post_id_input;

  -- Get sighting details
  SELECT animal_type, colors
  INTO v_sighting_animal, v_sighting_colors
  FROM sighting_posts
  WHERE id = sighting_post_id_input;

  -- Calculate distance score (0-40 points)
  -- Closer is better: 0m = 40pts, 1mi = 30pts, 5mi = 20pts, 10mi+ = 0pts
  v_distance_score := GREATEST(0, 40 - FLOOR(v_distance_meters / 402.336)); -- 402m = 0.25mi

  -- Calculate time score (0-30 points)
  -- More recent is better: 0-6hrs = 30pts, 6-24hrs = 20pts, 24-72hrs = 10pts, 72hrs+ = 0pts
  IF ABS(v_time_diff_hours) <= 6 THEN
    v_time_score := 30;
  ELSIF ABS(v_time_diff_hours) <= 24 THEN
    v_time_score := 20;
  ELSIF ABS(v_time_diff_hours) <= 72 THEN
    v_time_score := 10;
  ELSE
    v_time_score := 0;
  END IF;

  -- Animal type match (0-20 points)
  IF v_pet_animal = v_sighting_animal THEN
    v_animal_match_score := 20;
  ELSE
    v_animal_match_score := 0;
  END IF;

  -- Color overlap (0-10 points)
  SELECT COUNT(*)
  INTO v_color_overlap
  FROM unnest(v_pet_colors) AS pc
  WHERE pc = ANY(v_sighting_colors);

  v_color_match_score := LEAST(10, v_color_overlap * 5);

  -- Total score
  v_total_score := v_distance_score + v_time_score + v_animal_match_score + v_color_match_score;

  RETURN LEAST(100, v_total_score);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to mark post as reunited
CREATE OR REPLACE FUNCTION mark_as_reunited(
  p_pet_post_id UUID,
  p_helpful_sighting_ids UUID[],
  p_reunion_story TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_pet_owner_id UUID;
  v_sighting_user_id UUID;
  v_sighting_id UUID;
BEGIN
  -- Get pet owner
  SELECT user_id INTO v_pet_owner_id
  FROM pet_posts WHERE id = p_pet_post_id;

  -- Update pet post status
  UPDATE pet_posts
  SET
    status = 'reunited',
    reunited_at = NOW(),
    reunion_story = p_reunion_story
  WHERE id = p_pet_post_id;

  -- Award karma to helpful sighters
  FOREACH v_sighting_id IN ARRAY p_helpful_sighting_ids
  LOOP
    SELECT user_id INTO v_sighting_user_id
    FROM sighting_posts WHERE id = v_sighting_id;

    -- Award 50 karma for helpful sighting
    PERFORM award_karma(
      v_sighting_user_id,
      50,
      'sighting_helpful',
      'Sighting helped reunite pet',
      v_sighting_id,
      v_pet_owner_id
    );

    -- Mark sighting as helpful
    UPDATE sighting_posts
    SET marked_helpful_by = array_append(marked_helpful_by, v_pet_owner_id)
    WHERE id = v_sighting_id;
  END LOOP;

  -- Award 100 karma for successful reunion (if sightings helped)
  IF array_length(p_helpful_sighting_ids, 1) > 0 THEN
    PERFORM award_karma(
      v_pet_owner_id,
      100,
      'reunion_assisted',
      'Successfully reunited with pet',
      p_pet_post_id,
      NULL
    );

    -- Increment reunions_assisted for helpers
    UPDATE profiles
    SET reunions_assisted = reunions_assisted + 1
    WHERE id IN (
      SELECT user_id FROM sighting_posts WHERE id = ANY(p_helpful_sighting_ids)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
