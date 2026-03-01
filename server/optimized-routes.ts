// Optimized route handlers for better performance
import { Request, Response } from 'express';
import { performanceCache } from './performance-cache';
import { db } from './db';
import { landProperties } from '@shared/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const optimizedHandlers = {
  // Cached properties endpoint
  async getPropertiesOptimized(req: Request, res: Response) {
    const cacheKey = `properties:${JSON.stringify(req.query)}`;
    
    // Check cache first
    const cached = performanceCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    try {
      const { type, state, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(landProperties);

      // Apply filters
      if (type && type !== 'all') {
        query = query.where(eq(landProperties.propertyType, type as string));
      }

      if (state) {
        query = query.where(eq(landProperties.state, state as string));
      }

      // Add pagination and ordering for better performance
      const properties = await query
        .orderBy(desc(landProperties.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const result = properties.map(property => ({
        ...property,
        coordinates: property.coordinates ? 
          [property.latitude, property.longitude] : 
          [property.latitude, property.longitude]
      }));

      // Cache for 3 minutes
      performanceCache.set(cacheKey, result, 3 * 60 * 1000);
      
      res.setHeader('X-Cache', 'MISS');
      res.json(result);
    } catch (error) {
      console.error('Error fetching optimized properties:', error);
      res.status(500).json({ error: 'Failed to fetch properties' });
    }
  },

  // Fast property count endpoint
  async getPropertyCounts(req: Request, res: Response) {
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

      // Cache for 10 minutes
      performanceCache.set(cacheKey, result, 10 * 60 * 1000);
      
      res.setHeader('X-Cache', 'MISS');
      res.json(result);
    } catch (error) {
      console.error('Error fetching property counts:', error);
      res.status(500).json({ error: 'Failed to fetch counts' });
    }
  },

  // Fast featured properties
  async getFeaturedPropertiesOptimized(req: Request, res: Response) {
    const cacheKey = 'properties:featured';
    
    const cached = performanceCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    try {
      const properties = await db.select()
        .from(landProperties)
        .where(eq(landProperties.isFeatured, true))
        .orderBy(desc(landProperties.views))
        .limit(12); // Limit for homepage

      const result = properties.map(property => ({
        ...property,
        coordinates: property.coordinates ? 
          [property.latitude, property.longitude] : 
          [property.latitude, property.longitude]
      }));

      // Cache for 5 minutes
      performanceCache.set(cacheKey, result, 5 * 60 * 1000);
      
      res.setHeader('X-Cache', 'MISS');
      res.json(result);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      res.status(500).json({ error: 'Failed to fetch featured properties' });
    }
  }
};