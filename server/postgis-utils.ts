import { sql } from 'drizzle-orm';

/**
 * PostGIS utility functions for geospatial operations
 */

/**
 * Creates a PostGIS Point from latitude and longitude
 * Note: PostGIS expects longitude first, then latitude (X, Y)
 */
export function createPoint(longitude: number, latitude: number) {
  return sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
}

/**
 * Calculates the distance between two points in miles
 */
export function distanceBetweenPoints(
  longitude1: number, 
  latitude1: number, 
  longitude2: number, 
  latitude2: number
) {
  // ST_Distance_Sphere returns meters, convert to miles
  return sql`ST_Distance_Sphere(
    ST_SetSRID(ST_MakePoint(${longitude1}, ${latitude1}), 4326),
    ST_SetSRID(ST_MakePoint(${longitude2}, ${latitude2}), 4326)
  ) * 0.000621371`; // Convert meters to miles
}

/**
 * Creates a PostGIS Polygon from an array of coordinate pairs
 * @param coordinates Array of [longitude, latitude] pairs
 */
export function createPolygon(coordinates: [number, number][]) {
  // Create a WKT string for the polygon
  // Format: 'POLYGON((lon1 lat1, lon2 lat2, ..., lon1 lat1))'
  // Note that the polygon must be closed (first and last points must be the same)
  
  // Ensure the polygon is closed
  if (coordinates.length > 0) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push(first); // Close the loop
    }
  }
  
  // Convert to WKT format
  const wktPoints = coordinates.map(([lon, lat]) => `${lon} ${lat}`).join(', ');
  const wkt = `POLYGON((${wktPoints}))`;
  
  return sql`ST_SetSRID(ST_GeomFromText(${wkt}), 4326)`;
}

/**
 * Finds properties within a given distance of a point
 */
export function findPropertiesWithinDistance(
  longitude: number, 
  latitude: number, 
  distanceMiles: number
) {
  // Convert miles to meters for ST_DWithin (which expects meters)
  const distanceMeters = distanceMiles * 1609.34;
  
  return sql`ST_DWithin(
    coordinates, 
    ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
    ${distanceMeters}
  )`;
}

/**
 * Checks if a point is within a property boundary
 */
export function isPointInBoundary(longitude: number, latitude: number) {
  return sql`ST_Contains(
    boundary::geometry, 
    ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
  )`;
}

/**
 * Gets the area of a property in acres
 */
export function propertyAreaInAcres() {
  // ST_Area returns square meters, convert to acres
  return sql`ST_Area(boundary::geography) * 0.000247105`;
}

/**
 * Creates a simplified boundary for display on a map
 * Useful for complex polygons to reduce data transfer over the network
 */
export function simplifiedBoundary(tolerance: number = 0.001) {
  return sql`ST_AsGeoJSON(ST_Simplify(boundary::geometry, ${tolerance}))`;
}