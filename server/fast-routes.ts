// Fast route implementations for better performance
import type { Express } from "express";
import { db } from "./db";
import { landProperties } from "@shared/schema";
import { eq, desc, sql, and, or, asc } from "drizzle-orm";
import { performanceCache } from "./performance-cache";

export function setupFastRoutes(app: Express) {
  // Cached properties count endpoint
  app.get('/api/properties/counts', async (req, res) => {
    const cacheKey = 'property:counts';
    
    const cached = performanceCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    try {
      const counts = await db
        .select({
          type: landProperties.propertyType,
          count: sql<number>`count(*)`
        })
        .from(landProperties)
        .groupBy(landProperties.propertyType);

      const result = counts.reduce((acc, { type, count }) => {
        acc[type] = Number(count);
        return acc;
      }, {} as Record<string, number>);

      performanceCache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes
      res.json(result);
    } catch (error) {
      console.error('Error fetching property counts:', error);
      res.status(500).json({ error: 'Failed to fetch counts' });
    }
  });

  // Fast featured properties endpoint
  app.get('/api/properties/featured', async (req, res) => {
    const cacheKey = 'properties:featured';
    
    const cached = performanceCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    try {
      const properties = await db.select()
        .from(landProperties)
        .where(sql`is_featured = true`)
        .orderBy(desc(landProperties.views))
        .limit(12);

      const result = properties.map(property => ({
        ...property,
        coordinates: [property.latitude, property.longitude],
        videoUrl: property.video_url || ''
      }));

      performanceCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.json(result);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      res.status(500).json({ error: 'Failed to fetch featured properties' });
    }
  });

  // Fast properties by type endpoint
  app.get('/api/properties/type/:type', async (req, res) => {
    const { type } = req.params;
    const { limit = '20' } = req.query;
    
    const cacheKey = `properties:type:${type}:${limit}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    try {
      const properties = await db.select()
        .from(landProperties)
        .where(sql`property_type = ${type}`)
        .orderBy(desc(landProperties.createdAt))
        .limit(parseInt(limit as string));

      const result = properties.map(property => ({
        ...property,
        coordinates: [property.latitude, property.longitude],
        videoUrl: property.video_url || ''
      }));

      performanceCache.set(cacheKey, result, 3 * 60 * 1000); // 3 minutes
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, max-age=180'); // 3 minutes
      res.json(result);
    } catch (error) {
      console.error('Error fetching properties by type:', error);
      res.status(500).json({ error: 'Failed to fetch properties' });
    }
  });
}