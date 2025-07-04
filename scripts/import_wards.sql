-- scripts/import_wards.sql

-- This function takes a GeoJSON payload as input, parses it,
-- and inserts the ward names and boundaries into the public.wards table.
CREATE OR REPLACE FUNCTION public.load_wards_from_geojson(geojson_data jsonb)
RETURNS void AS $$
DECLARE
    feature jsonb;
    ward_name text;
    geom_json text;
    geography_val gis.geography;
BEGIN
    -- Check if the input is a valid FeatureCollection
    IF geojson_data->>'type' != 'FeatureCollection' THEN
        RAISE EXCEPTION 'Input must be a GeoJSON FeatureCollection';
    END IF;

    -- Loop through each feature in the 'features' array
    FOR feature IN SELECT * FROM jsonb_array_elements(geojson_data->'features')
    LOOP
        -- Extract the ward name from the properties
        -- It will look for a property called "name" inside "properties"
        ward_name := feature->'properties'->>'name';

        -- Extract the geometry object and convert it to text
        geom_json := feature->'geometry'::text;

        -- Convert the GeoJSON geometry text into a PostGIS geography object
        -- It assumes the standard WGS 84 coordinate system (SRID 4326)
        -- We explicitly call gis.ST_ functions because PostGIS is installed in the 'gis' schema.
        geography_val := gis.ST_SetSRID(gis.ST_GeomFromGeoJSON(geom_json), 4326)::gis.geography;

        -- Insert the new ward into the table
        INSERT INTO public.wards (name, boundary)
        VALUES (ward_name, geography_val);
    END LOOP;
END;
$$ LANGUAGE plpgsql; 