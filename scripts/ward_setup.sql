-- scripts/ward_setup.sql

-- Wards Table: Stores geographic boundaries for each ward.
CREATE TABLE public.wards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  boundary gis.geography(Polygon, 4326), -- Or MultiPolygon, depending on your data
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create a spatial index for location-based queries.
CREATE INDEX wards_geo_index ON public.wards USING GIST (boundary);


-- Function to find the ward for a given point (location).
CREATE OR REPLACE FUNCTION public.get_ward_for_location(point_location gis.geography)
RETURNS TEXT AS $$
DECLARE
  ward_name TEXT;
BEGIN
  SELECT name INTO ward_name
  FROM public.wards
  WHERE ST_Intersects(boundary, point_location)
  LIMIT 1;
  RETURN ward_name;
END;
$$ LANGUAGE plpgsql;


-- Function to automatically set the poll's ward based on its location.
-- Note: This requires a 'ward' column in the 'polls' table.
-- Let's add that first.
ALTER TABLE public.polls ADD COLUMN ward TEXT;

CREATE OR REPLACE FUNCTION public.set_poll_ward()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ward := public.get_ward_for_location(NEW.location);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function before a new poll is inserted.
CREATE TRIGGER on_poll_created_set_ward
  BEFORE INSERT ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.set_poll_ward(); 