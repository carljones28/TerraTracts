export interface FinancingPlan {
  id: string;
  name: string;
  downPaymentPercentage: number;
  termYears: number;
  interestRate: number;
  featured?: boolean;
}

export interface PropertyLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Agent {
  id: number;
  name: string;
  photo?: string;
  brokerage?: string;
  phone?: string;
  email?: string;
  title?: string;
  bio?: string;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  size: number;
  location: string;
  state: string;
  coordinates?: [number, number];
  propertyType: string;
  features: string[];
  images: string[];
  valueTrend?: number;
  risks?: Array<{type: string, level: string}>;
  videoUrl?: string;
  agent?: Agent;
  status?: 'active' | 'pending' | 'sold';
  isAgent?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'spreadsheet' | 'archive' | 'other';
  url: string;
  size?: string;
  dateAdded?: string;
}

export type PropertyStatus = 'active' | 'pending' | 'sold' | 'expired';
export type PropertyType = 'residential' | 'commercial' | 'recreational' | 'agricultural' | 'conservation' | 'land' | 'farm' | 'ranch' | 'mountain' | 'waterfront';

export interface RiskAnalysis {
  overallRisk: 'low' | 'moderate' | 'high';
  riskFactors: Array<{
    type: string;
    level: 'low' | 'moderate' | 'high';
    description: string;
  }>;
  recommendations: string[];
}

export interface ValuationInsight {
  currentValue: number;
  valueTrend: number;
  comparables: Array<{
    id: number;
    price: number;
    size: number;
    distance: number;
    soldDate?: string;
  }>;
  growthPotential: 'low' | 'moderate' | 'high';
  forecastedValue: number;
  forecastPeriod: string;
}