/**
 * Common types shared between client and server
 */

export interface PropertyFeature {
  name: string;
  value: string;
  category?: string;
}

export interface PropertyCoordinates {
  latitude: number;
  longitude: number;
}

export interface PropertyLocation {
  address?: string;
  city?: string;
  state?: string;
  county?: string;
  postal_code?: string;
  country?: string;
}

export interface PropertyAsset {
  id: string;
  type: 'image' | 'document' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  selected?: boolean;
}

export interface PropertyExtractRequest {
  title?: string;
  description?: string;
  price?: number;
  acreage?: number;
  property_type?: string;
  location?: PropertyLocation;
  coordinates?: PropertyCoordinates;
  features?: PropertyFeature[];
  assets?: PropertyAsset[];
  source_url?: string;
  isWaterfront?: boolean;
  isMountainView?: boolean;
}

export interface PropertyExtractResponse {
  success: boolean;
  data: PropertyExtractRequest;
  message: string;
}

export interface AIExtractedFields {
  title?: string;
  description?: string;
  price?: number;
  acreage?: number;
  property_type?: string;
  terrain_type?: string;
  water_features?: string[];
  road_access?: string;
  utilities?: string[];
  zoning?: string;
  potential_uses?: string[];
  unique_features?: string[];
}