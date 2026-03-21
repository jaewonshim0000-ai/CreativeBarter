-- ============================================================
-- Nuvra - Database Schema
-- PostgreSQL + PostGIS
-- ============================================================
-- SUPABASE USERS: uuid-ossp is enabled by default on Supabase.
-- Enable PostGIS via Dashboard → Database → Extensions → search "postgis" → Enable.
-- Then run this file in the SQL Editor (Dashboard → SQL Editor → New Query).
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- ENUM Types
-- ============================================================

CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE project_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE skill_proficiency AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE resource_availability AS ENUM ('available', 'limited', 'unavailable');
CREATE TYPE specialty_field AS ENUM (
  'visual_arts', 'music', 'writing', 'film', 'photography',
  'design', 'web_dev', 'game_dev', 'animation', 'crafts', 'other'
);

-- ============================================================
-- Users Table
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  profile_image_url TEXT,
  bio TEXT,
  specialty specialty_field DEFAULT 'other',
  city VARCHAR(100),
  region VARCHAR(100),
  -- PostGIS point for geospatial queries (longitude, latitude)
  location GEOGRAPHY(POINT, 4326),
  role user_role DEFAULT 'user',
  portfolio JSONB DEFAULT '[]'::jsonb,
  -- Aggregated rating (updated via trigger or application logic)
  avg_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for geospatial queries
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_specialty ON users (specialty);

-- ============================================================
-- Skills Table (master list of skills)
-- ============================================================

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_name ON skills (name);
CREATE INDEX idx_skills_category ON skills (category);

-- ============================================================
-- User Skills (junction table: users <-> skills)
-- ============================================================

CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency skill_proficiency DEFAULT 'beginner',
  years_experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user ON user_skills (user_id);
CREATE INDEX idx_user_skills_skill ON user_skills (skill_id);

-- ============================================================
-- Resources Table (master list of resource types)
-- ============================================================

CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource_type VARCHAR(50), -- e.g., 'equipment', 'space', 'software', 'material'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_type ON resources (resource_type);

-- ============================================================
-- User Resources (junction table: users <-> resources)
-- ============================================================

CREATE TABLE user_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  details TEXT,  -- specific details about user's resource
  availability resource_availability DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

CREATE INDEX idx_user_resources_user ON user_resources (user_id);
CREATE INDEX idx_user_resources_resource ON user_resources (resource_id);

-- ============================================================
-- Projects Table
-- ============================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  -- Skills and resources stored as JSONB for flexibility
  -- Format: [{ "skill_id": "uuid", "name": "...", "proficiency": "..." }]
  required_skills JSONB DEFAULT '[]'::jsonb,
  required_resources JSONB DEFAULT '[]'::jsonb,
  offered_skills JSONB DEFAULT '[]'::jsonb,
  offered_resources JSONB DEFAULT '[]'::jsonb,
  status project_status DEFAULT 'open',
  -- PostGIS point for project location
  location GEOGRAPHY(POINT, 4326),
  city VARCHAR(100),
  region VARCHAR(100),
  deadline TIMESTAMPTZ,
  max_collaborators INTEGER DEFAULT 5,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_creator ON projects (creator_id);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_location ON projects USING GIST (location);
CREATE INDEX idx_projects_tags ON projects USING GIN (tags);

-- ============================================================
-- Matches Table
-- ============================================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status match_status DEFAULT 'pending',
  message TEXT, -- initial proposal message
  match_score DECIMAL(5, 2), -- AI-generated match score (0-100)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, proposer_id, receiver_id)
);

CREATE INDEX idx_matches_project ON matches (project_id);
CREATE INDEX idx_matches_proposer ON matches (proposer_id);
CREATE INDEX idx_matches_receiver ON matches (receiver_id);
CREATE INDEX idx_matches_status ON matches (status);

-- ============================================================
-- Messages Table
-- ============================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON messages (sender_id);
CREATE INDEX idx_messages_receiver ON messages (receiver_id);
CREATE INDEX idx_messages_project ON messages (project_id);
CREATE INDEX idx_messages_created ON messages (created_at DESC);

-- ============================================================
-- Conversations Table (for grouping messages)
-- ============================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  participants UUID[] NOT NULL, -- array of user IDs
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN (participants);

-- ============================================================
-- Reviews Table
-- ============================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate reviews for same project/user pair
  UNIQUE(reviewer_id, reviewed_user_id, project_id)
);

CREATE INDEX idx_reviews_reviewed ON reviews (reviewed_user_id);
CREATE INDEX idx_reviews_project ON reviews (project_id);

-- ============================================================
-- Notifications Table
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'new_match', 'new_message', 'review', 'project_update'
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, is_read);

-- ============================================================
-- Function: Update user average rating after a new review
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE reviewed_user_id = NEW.reviewed_user_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewed_user_id = NEW.reviewed_user_id
    ),
    updated_at = NOW()
  WHERE id = NEW.reviewed_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

-- ============================================================
-- Function: Auto-update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_projects_updated
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_matches_updated
BEFORE UPDATE ON matches
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
