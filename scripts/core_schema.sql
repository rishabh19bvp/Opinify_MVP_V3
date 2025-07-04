-- scripts/core_schema.sql

-- Users Table: Stores public user information.
-- This table is linked to the private auth.users table.
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT UNIQUE,
  ward TEXT,
  jannmatt_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to automatically create a public user profile when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone)
  VALUES (new.id, new.phone);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a new user is inserted into auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Polls Table: Stores information about each poll.
CREATE TABLE public.polls (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location gis.geography(Point, 4326), -- 4326 is the SRID for WGS 84
  status TEXT DEFAULT 'open', -- e.g., 'open', 'closed', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- For soft deletes
);
-- Create a spatial index for location-based queries.
CREATE INDEX polls_geo_index ON public.polls USING GIST (location);


-- Votes Table: Tracks user votes on polls.
CREATE TABLE public.votes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  poll_id BIGINT REFERENCES public.polls(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, poll_id) -- Ensures a user can only vote once per poll
); 