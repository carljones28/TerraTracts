import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Setup PostGIS extensions and geospatial indexes in the PostgreSQL database
 */
async function setupPostGIS() {
  console.log('Setting up PostGIS extensions and indices...');

  try {
    // Add PostGIS extension to enable geospatial queries
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`);
    console.log('PostGIS extension enabled');

    // Create spatial indices for efficient queries
    // Index for coordinates (point) column
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_land_properties_coordinates 
      ON land_properties USING GIST (coordinates)
    `);
    console.log('Created spatial index on coordinates');

    // Index for boundary (polygon) column
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_land_properties_boundary 
      ON land_properties USING GIST (boundary)
    `);
    console.log('Created spatial index on boundary');

    // Create function to calculate distance between properties and a point
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_properties_within_distance(
          center_lon NUMERIC,
          center_lat NUMERIC,
          radius_miles NUMERIC
      ) RETURNS TABLE (
          id INTEGER,
          title TEXT,
          description TEXT,
          price NUMERIC,
          acreage NUMERIC,
          location TEXT,
          latitude NUMERIC,
          longitude NUMERIC,
          property_type TEXT,
          distance_miles NUMERIC
      ) AS $$
      BEGIN
          RETURN QUERY 
          SELECT 
              p.id,
              p.title,
              p.description,
              p.price,
              p.acreage,
              p.location,
              p.latitude,
              p.longitude,
              p.property_type,
              (ST_Distance(
                  p.coordinates::geometry, 
                  ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)
              ) * 0.000621371)::NUMERIC AS distance_miles -- Convert meters to miles and cast to NUMERIC
          FROM 
              land_properties p
          WHERE 
              ST_DWithin(
                  p.coordinates::geometry, 
                  ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326),
                  radius_miles * 1609.34  -- Convert miles to meters
              )
          ORDER BY 
              distance_miles ASC;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('Created function for properties within distance');

    // Create function to find properties within a bounding box
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_properties_in_bbox(
          min_lon NUMERIC,
          min_lat NUMERIC,
          max_lon NUMERIC,
          max_lat NUMERIC
      ) RETURNS TABLE (
          id INTEGER,
          title TEXT,
          description TEXT,
          price NUMERIC,
          acreage NUMERIC,
          location TEXT,
          latitude NUMERIC,
          longitude NUMERIC,
          property_type TEXT
      ) AS $$
      BEGIN
          RETURN QUERY 
          SELECT 
              p.id,
              p.title,
              p.description,
              p.price,
              p.acreage,
              p.location,
              p.latitude,
              p.longitude,
              p.property_type
          FROM 
              land_properties p
          WHERE 
              ST_Within(
                  p.coordinates::geometry, 
                  ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
              );
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('Created function for properties in bounding box');

    console.log('PostGIS setup completed successfully');
  } catch (error) {
    console.error('Error setting up PostGIS:', error);
    throw error;
  }
}

export { setupPostGIS };

// For ESM modules, we don't need to check if the file is being executed directly
// The setupPostGIS function will be called from index.ts