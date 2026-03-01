/**
 * Search Service
 * 
 * This is a dedicated service for handling property searches
 * that works independently of the UI components.
 */

import { toast } from '@/hooks/use-toast';

// Define the property interface to match the main Property interface
export interface Property {
  id: number;
  title: string;
  description?: string;
  price: string | number;
  acreage: string | number;
  location: string;
  state: string;
  latitude: string | number;
  longitude: string | number;
  
  // Property type fields (supporting both camelCase and snake_case)
  propertyType?: string;
  property_type?: string;
  
  // Features and amenities
  features?: string[];
  amenities?: string[];
  
  // Media - required fields
  images: string[];
  videoUrl?: string;
  video_url?: string;
  documents?: string[];
  
  // Property characteristics
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  
  // Terrain and landscape
  terrainType?: string;
  terrain_type?: string;
  vegetation?: string;
  waterResources?: string;
  water_resources?: string;
  
  // Property attributes
  roadAccess?: boolean | string;
  road_access?: boolean | string;
  utilities?: boolean | string;
  zoning?: string;
  
  // Special features
  isWaterfront?: boolean;
  is_waterfront?: boolean;
  isMountainView?: boolean;
  is_mountain_view?: boolean;
  
  // Listing information
  status?: string;
  featured?: boolean;
  is_featured?: boolean;
  listingAgentId?: number;
  listing_agent_id?: number;
  ownerId?: number;
  owner_id?: number;
  
  // Timestamps
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  
  // Metadata
  views?: number;
  coordinates?: any; // GeoJSON
  boundary?: any; // GeoJSON
  
  [key: string]: any; // Allow additional properties
}

// Track the original properties list with proper state management
let allProperties: Property[] = [];
let isInitialized = false;

// Search result callback type
export type SearchResultCallback = (results: Property[]) => void;

// Initialize the search service with properties
export function initializeSearchService(properties: Property[]): void {
  console.log(`Search service initialized with ${properties.length} properties`);
  allProperties = [...properties];
  isInitialized = true;
  
  // Debug: Log first few properties to verify data structure
  if (properties.length > 0) {
    console.log('SearchService - Sample property data:', {
      id: properties[0].id,
      title: properties[0].title,
      location: properties[0].location,
      state: properties[0].state,
      propertyType: properties[0].propertyType || properties[0].property_type
    });
  }
}

// Perform a text search across properties
export function searchProperties(
  query: string,
  callback: SearchResultCallback
): void {
  console.log(`SearchService - Searching for: "${query}", initialized: ${isInitialized}, properties count: ${allProperties.length}`);
  
  // Check if service is properly initialized
  if (!isInitialized) {
    console.error('SearchService - Service not initialized');
    callback([]);
    return;
  }
  
  if (!query || !query.trim()) {
    console.log('SearchService - Empty query, returning all properties');
    callback([...allProperties]); // Return copy to prevent mutations
    return;
  }
  
  // Ensure we have properties to search
  if (!allProperties || allProperties.length === 0) {
    console.error('SearchService - No properties available to search');
    callback([]);
    return;
  }
  
  try {
    // Search implementation
    const searchLower = query.toLowerCase().trim();
    console.log(`SearchService - Starting search for "${searchLower}" across ${allProperties.length} properties`);
    
    const results = allProperties.filter(property => {
      // Enhanced null safety
      const title = String(property?.title || '').toLowerCase();
      const description = String(property?.description || '').toLowerCase();
      const location = String(property?.location || '').toLowerCase();
      const state = String(property?.state || '').toLowerCase();
      const propertyType = String(property?.propertyType || property?.property_type || '').toLowerCase();
      
      // Check if any field contains the search query
      const matches = (
        title.includes(searchLower) || 
        description.includes(searchLower) || 
        location.includes(searchLower) || 
        state.includes(searchLower) || 
        propertyType.includes(searchLower)
      );
      
      // Debug output for first few properties
      if (property.id < 255) {
        console.log(`Property ${property.id}: "${title}" in ${location}, ${state} - matches: ${matches}`);
      }
      
      return matches;
    });
    
    console.log(`SearchService - Found ${results.length} matching properties for "${query}"`);
    callback([...results]); // Return copy to prevent mutations
  } catch (error) {
    console.error('SearchService - Error during search:', error);
    callback([]);
  }
}

// Export a singleton instance
export const SearchService = {
  initialize: initializeSearchService,
  search: searchProperties
};

export default SearchService;