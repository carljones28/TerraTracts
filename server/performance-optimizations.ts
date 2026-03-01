import { db } from "./db";

/**
 * Performance Optimizations for Database Queries
 * 
 * This file contains database performance optimizations including:
 * - Database indexing for faster queries
 * - Query optimizations
 * - Connection pooling improvements
 */

export async function setupPerformanceOptimizations() {
  try {
    console.log('Setting up performance optimizations...');
    
    // Create indexes for frequently queried columns
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_land_properties_featured 
      ON land_properties (is_featured) 
      WHERE is_featured = true;
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_land_properties_created_at 
      ON land_properties (created_at DESC);
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_land_properties_property_type 
      ON land_properties (property_type);
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_land_properties_location 
      ON land_properties USING GIN (to_tsvector('english', location));
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_land_properties_state 
      ON land_properties (state);
    `);
    
    // Update table statistics for better query planning
    await db.execute(`ANALYZE land_properties;`);
    
    console.log('Performance optimizations completed successfully');
    
  } catch (error) {
    console.error('Error setting up performance optimizations:', error);
  }
}

/**
 * Get featured properties with optimized query
 */
export async function getFeaturedPropertiesOptimized() {
  const result = await db.execute(`
    SELECT 
      id, title, description, price, acreage, location, state,
      latitude, longitude, property_type, images, is_featured,
      video_url, is_waterfront, is_mountain_view, status,
      views, created_at, updated_at
    FROM land_properties 
    WHERE is_featured = true 
    ORDER BY created_at DESC 
    LIMIT 12
  `);
  
  return result.rows;
}