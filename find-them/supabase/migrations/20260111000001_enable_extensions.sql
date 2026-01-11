-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pg_trgm for fuzzy text search (pet names, descriptions)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE post_status AS ENUM ('active', 'reunited', 'archived', 'removed');
CREATE TYPE animal_type AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'other');
CREATE TYPE post_type AS ENUM ('lost', 'sighting');
CREATE TYPE visibility_level AS ENUM ('public', 'community', 'limited');
CREATE TYPE report_reason AS ENUM ('spam', 'scam', 'inappropriate', 'abuse', 'other');
CREATE TYPE karma_reason AS ENUM (
  'sighting_posted',
  'sighting_helpful',
  'reunion_assisted',
  'photo_added',
  'profile_completed',
  'spam_penalty'
);
