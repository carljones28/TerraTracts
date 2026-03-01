import { apiRequest } from './queryClient';

/**
 * Interface for LandCanvas mood board response
 */
export interface MoodBoardInspirationResponse {
  images: Array<{
    url: string;
    description: string;
    tags: string[];
  }>;
  colors: Array<{
    hex: string;
    name: string;
    description: string;
  }>;
  keywords: string[];
  styleDescription: string;
  developmentSuggestions: string[];
}

/**
 * Interface for Virtual Development Studio response
 */
export interface VirtualDevelopmentResponse {
  developmentType: string;
  description: string;
  structures: Array<{
    type: 'building' | 'natural' | 'pathway';
    name?: string;
    position: [number, number]; // normalized 0-1 coordinates
    size: [number, number]; // normalized 0-1 size
    path?: Array<[number, number]>; // for pathways
  }>;
  features: string[];
  environmentalImpact: 'low' | 'moderate' | 'high';
  estimatedCost?: {
    range: {
      min: number;
      max: number;
    };
    currency: string;
  };
  permitRequirements?: string[];
}

interface AISearchResponse {
  properties: any[];
  interpretation: {
    intent: string;
    extractedCriteria: {
      priceRange: string;
      location: string;
      propertyType: string;
      size: string;
      features: string[];
    };
    suggestedFilters: string[];
  };
}

interface RiskAnalysisResponse {
  risks: Array<{
    type: string;
    level: string;
    description?: string;
  }>;
  summary: string;
  recommendations?: string[];
  getRiskColor: (level: string) => string;
}

interface ValuationInsightsResponse {
  trend: number;
  direction: string;
  forecast: string;
  color: string;
  factors?: {
    positive: string[];
    negative: string[];
  };
  comparables?: {
    average: number;
    range: {
      min: number;
      max: number;
    };
  };
}

/**
 * Performs a fast search for land properties using direct database query first
 * Only falls back to AI-powered search if requested via parameter
 */
export async function performAISearch(query: string, useAI: boolean = false): Promise<AISearchResponse> {
  // First, attempt to do a direct database search which is much faster
  try {
    // Use a shorter timeout for faster response
    const directResponse = await fetch(`/api/properties/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout for quick response
    });
    
    if (!directResponse.ok) {
      // Only if direct search fails, we'll try AI search if requested
      if (useAI) {
        return performAIBackedSearch(query);
      }
      throw new Error(`Search API error: ${directResponse.status}`);
    }
    
    const properties = await directResponse.json();
    
    // If we have results, return immediately with a simplified response
    if (properties.length > 0) {
      // Create a simplified response that matches the AI search response structure
      const fastResult: AISearchResponse = {
        properties,
        interpretation: {
          intent: "Finding properties matching your query",
          extractedCriteria: {
            // Extract simple criteria based on query text
            location: query.includes(' in ') ? query.split(' in ').pop()?.trim() || '' : '',
            priceRange: query.includes('under') ? 'Under ' + query.split('under').pop()?.trim() : 
                        query.includes('above') ? 'Above ' + query.split('above').pop()?.trim() : '',
            propertyType: query.includes('land') ? 'Land' : 
                          query.includes('farm') ? 'Farm' : 
                          query.includes('ranch') ? 'Ranch' : '',
            size: query.includes('acre') ? query.split(' acre')[0].split(' ').pop() + ' acres' : '',
            features: []
          },
          suggestedFilters: []
        }
      };
      
      return fastResult;
    }
    
    // If no direct results and AI is requested, try AI search
    if (useAI) {
      return performAIBackedSearch(query);
    }
    
    // Return empty results if no properties found
    return {
      properties: [],
      interpretation: {
        intent: "Finding properties matching your query",
        extractedCriteria: {
          priceRange: '',
          location: '',
          propertyType: '',
          size: '',
          features: []
        },
        suggestedFilters: []
      }
    };
  } catch (error) {
    console.error('Direct search failed:', error);
    
    // Try AI search if requested
    if (useAI) {
      return performAIBackedSearch(query);
    }
    
    // Otherwise, return a generic error response
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Search request timed out. Please try again later.');
    } else {
      throw new Error('Failed to perform search. Please try again.');
    }
  }
}

/**
 * Helper function to perform AI-powered search as a fallback
 */
async function performAIBackedSearch(query: string): Promise<AISearchResponse> {
  try {
    const response = await fetch('/api/ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000) // 10 second timeout - reduced from 15
    });
    
    if (!response.ok) {
      throw new Error(`AI search API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('AI search failed:', error);
    
    // Fall back to an empty result set
    return {
      properties: [],
      interpretation: {
        intent: "Finding properties matching your query",
        extractedCriteria: {
          priceRange: '',
          location: '',
          propertyType: '',
          size: '',
          features: []
        },
        suggestedFilters: []
      }
    };
  }
}

/**
 * Generates a risk analysis for a property using AI
 */
export async function generateRiskAnalysis(property: any): Promise<RiskAnalysisResponse> {
  try {
    if (!property || !property.id) {
      throw new Error('Invalid property data');
    }
    
    const response = await fetch(`/api/ai/property/${property.id}/risk-analysis`, {
      // Add timeout
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: RiskAnalysisResponse = await response.json();
    
    // Add getRiskColor function if it doesn't exist
    if (!data.getRiskColor) {
      data.getRiskColor = (level: string) => {
        switch (level.toLowerCase()) {
          case 'high':
            return 'text-red-500';
          case 'medium':
          case 'moderate':
            return 'text-yellow-500';
          case 'low':
            return 'text-green-500';
          default:
            return 'text-neutral-300';
        }
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error generating risk analysis:', error);
    
    // More descriptive error messages based on error type
    if (error instanceof TypeError) {
      console.error('Network error while generating risk analysis');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Risk analysis request timed out');
    }
    
    // Return fallback data when API fails
    return {
      risks: [
        { type: "Flood", level: "Low", description: "Property is not in a flood-prone area" },
        { type: "Fire", level: "Medium", description: "Moderate risk due to nearby vegetation" },
        { type: "Environmental", level: "Low", description: "No significant environmental concerns" }
      ],
      summary: "This property has overall low risk factors with a moderate fire risk that should be considered.",
      recommendations: [
        "Consider fire-resistant landscaping",
        "Maintain proper insurance coverage", 
        "Regular property inspections recommended"
      ],
      getRiskColor: (level: string) => {
        switch (level.toLowerCase()) {
          case 'high':
            return 'text-red-500';
          case 'medium':
          case 'moderate':
            return 'text-yellow-500';
          case 'low':
            return 'text-green-500';
          default:
            return 'text-neutral-300';
        }
      }
    };
  }
}

/**
 * Generates valuation insights for a property using AI
 */
export async function generateValuationInsights(property: any): Promise<ValuationInsightsResponse> {
  try {
    if (!property || !property.id) {
      throw new Error('Invalid property data');
    }
    
    const response = await fetch(`/api/ai/property/${property.id}/valuation`, {
      // Add timeout
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: ValuationInsightsResponse = await response.json();
    
    // Add color property if it doesn't exist based on trend
    if (!data.color) {
      if (data.trend >= 5) {
        data.color = 'text-green-500';
      } else if (data.trend >= 0) {
        data.color = 'text-green-300';
      } else if (data.trend >= -5) {
        data.color = 'text-yellow-500';
      } else {
        data.color = 'text-red-500';
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error generating valuation insights:', error);
    
    // More descriptive error messages based on error type
    if (error instanceof TypeError) {
      console.error('Network error while generating valuation insights');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Valuation insights request timed out');
    }
    
    // Return fallback data when API fails
    return {
      trend: property.valueTrend || 3.5,
      direction: "upward",
      forecast: "The property is expected to appreciate moderately over the next few years.",
      color: "text-green-500",
      factors: {
        positive: [
          "Growing demand in the region",
          "Favorable zoning regulations",
          "Proximity to natural attractions"
        ],
        negative: [
          "Seasonal market fluctuations",
          "Limited development options"
        ]
      },
      comparables: {
        average: property.price * 1.05,
        range: {
          min: property.price * 0.95,
          max: property.price * 1.15
        }
      }
    };
  }
}

/**
 * Interface for drone footage simulation response
 */
export interface DroneFootageResponse {
  terrainType: string;
  simulationPoints: Array<{
    description: string;
    altitude: number;
    direction: string;
    coordinates: [number, number];
    focusPoint: string;
  }>;
  terrainAnalysis: string;
  suggestedViews: string[];
}

/**
 * Generates drone footage simulation for a property using AI
 */
export async function generateDroneFootage(property: any): Promise<DroneFootageResponse> {
  try {
    if (!property || !property.id) {
      throw new Error('Invalid property data');
    }
    
    const response = await fetch(`/api/ai/property/${property.id}/drone-footage`, {
      // Add timeout
      signal: AbortSignal.timeout(20000) // 20 second timeout since this might be a complex operation
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: DroneFootageResponse = await response.json();
    
    // Add terrainType if it doesn't exist
    if (!data.terrainType) {
      // Determine terrain type based on property features or property type
      let terrainType = 'forest';
      
      const features: string[] = (property.features || []).map((feature: string) => feature.toLowerCase());
      const propertyType: string = (property.propertyType || '').toLowerCase();
      
      if (features.some((feature: string) => feature.includes('mountain') || feature.includes('hill') || feature.includes('elevated'))) {
        terrainType = 'mountain';
      } else if (features.some((feature: string) => feature.includes('beach') || feature.includes('ocean') || feature.includes('sea') || feature.includes('water'))) {
        terrainType = 'coastal';
      } else if (features.some((feature: string) => feature.includes('desert') || feature.includes('arid') || feature.includes('dry'))) {
        terrainType = 'desert';
      } else if (features.some((feature: string) => feature.includes('farm') || feature.includes('agriculture') || feature.includes('crop'))) {
        terrainType = 'farmland';
      } else if (propertyType.includes('farm') || propertyType.includes('ranch') || propertyType.includes('agriculture')) {
        terrainType = 'farmland';
      }
      
      data.terrainType = terrainType;
    }
    
    return data;
  } catch (error) {
    console.error('Error generating drone footage:', error);
    
    // More descriptive error messages based on error type
    if (error instanceof TypeError) {
      console.error('Network error while generating drone footage simulation');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Drone footage simulation request timed out');
    }
    
    // Determine terrain type based on property features or property type
    let terrainType = 'forest';
    if (!property) return generateFallbackDroneFootage(terrainType);
    
    const features: string[] = (property.features || []).map((feature: string) => feature.toLowerCase());
    const propertyType: string = (property.propertyType || '').toLowerCase();
    
    if (features.some((feature: string) => feature.includes('mountain') || feature.includes('hill') || feature.includes('elevated'))) {
      terrainType = 'mountain';
    } else if (features.some((feature: string) => feature.includes('beach') || feature.includes('ocean') || feature.includes('sea') || feature.includes('water'))) {
      terrainType = 'coastal';
    } else if (features.some((feature: string) => feature.includes('desert') || feature.includes('arid') || feature.includes('dry'))) {
      terrainType = 'desert';
    } else if (features.some((feature: string) => feature.includes('farm') || feature.includes('agriculture') || feature.includes('crop'))) {
      terrainType = 'farmland';
    } else if (propertyType.includes('farm') || propertyType.includes('ranch') || propertyType.includes('agriculture')) {
      terrainType = 'farmland';
    }
    
    return generateFallbackDroneFootage(terrainType, property.coordinates);
  }
}

/**
 * Generates fallback drone footage data when API fails
 */
function generateFallbackDroneFootage(terrainType: string, coordinates?: [number, number]): DroneFootageResponse {
  const defaultCoords: [number, number] = coordinates || [35.123, -106.549];
  
  return {
    terrainType,
    simulationPoints: [
      {
        description: `Flying over ${terrainType} terrain, showcasing the natural features of the property.`,
        altitude: 120,
        direction: "north",
        coordinates: defaultCoords,
        focusPoint: "Scenic view of the entire property"
      },
      {
        description: `Descending to get a closer look at the buildable area of the property.`,
        altitude: 60,
        direction: "east",
        coordinates: [defaultCoords[0] + 0.001, defaultCoords[1] + 0.001],
        focusPoint: "Potential building site"
      },
      {
        description: `Flying along the property boundary to show the land's extent and neighboring areas.`,
        altitude: 90,
        direction: "south",
        coordinates: [defaultCoords[0] - 0.001, defaultCoords[1]],
        focusPoint: "Property boundary"
      }
    ],
    terrainAnalysis: `This ${terrainType} property has varied terrain with good drainage and multiple potential building sites.`,
    suggestedViews: [
      "Sunrise from the eastern edge",
      "Full property overview from the north",
      "Close-up of natural features in the center"
    ]
  };
}

/**
 * Generates virtual development concept for a property using AI
 */
export async function generateDevelopmentConcept(property: any): Promise<VirtualDevelopmentResponse> {
  try {
    if (!property || !property.id) {
      throw new Error('Invalid property data');
    }
    
    const developmentType = property.developmentType || 'cabin';
    
    const response = await fetch(`/api/ai/property/${property.id}/development-concept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ developmentType }),
      // Add timeout
      signal: AbortSignal.timeout(20000) // 20 second timeout since this is a complex operation
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: VirtualDevelopmentResponse = await response.json();
    
    // Ensure developmentType is always set
    if (!data.developmentType) {
      data.developmentType = developmentType;
    }
    
    return data;
  } catch (error) {
    console.error('Error generating development concept:', error);
    
    // More descriptive error messages based on error type
    if (error instanceof TypeError) {
      console.error('Network error while generating development concept');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Development concept request timed out');
    }
    
    // Generate fallback development concept data
    return generateFallbackDevelopmentConcept(property);
  }
}

/**
 * Generates fallback development concept data when API fails
 */
function generateFallbackDevelopmentConcept(property: any): VirtualDevelopmentResponse {
  const developmentType = property.developmentType || 'cabin';
  const terrainType = property.terrainType || 'forest';
  
  // Generate structures based on development type
  const structures = [];
  
  // Main building
  structures.push({
    type: 'building' as const,
    name: developmentType === 'cabin' ? 'Main Cabin' : 
          developmentType === 'eco_retreat' ? 'Eco Lodge' :
          developmentType === 'estate' ? 'Main Residence' :
          developmentType === 'commercial' ? 'Commercial Building' : 'Conservation Center',
    position: [0.5, 0.6] as [number, number],
    size: [0.3, 0.2] as [number, number]
  });
  
  // Add additional structures based on development type
  if (developmentType === 'estate') {
    structures.push({
      type: 'building' as const,
      name: 'Guest House',
      position: [0.65, 0.7] as [number, number],
      size: [0.15, 0.1] as [number, number]
    });
  }
  
  if (developmentType === 'commercial') {
    structures.push({
      type: 'building' as const,
      name: 'Storage Facility',
      position: [0.35, 0.7] as [number, number],
      size: [0.2, 0.15] as [number, number]
    });
  }
  
  // Add natural features for all types
  structures.push({
    type: 'natural' as const,
    name: 'Natural Area',
    position: [0.25, 0.3] as [number, number],
    size: [0.3, 0.3] as [number, number]
  });
  
  // Add pathway
  structures.push({
    type: 'pathway' as const,
    name: 'Main Access',
    position: [0.5, 0.9] as [number, number],
    size: [0.05, 0.4] as [number, number],
    path: [[0.5, 0.9], [0.5, 0.7], [0.5, 0.6]] as Array<[number, number]>
  });
  
  // Generate features based on development type
  const features = [];
  
  switch (developmentType) {
    case 'cabin':
      features.push(
        'Rustic cabin design with natural materials',
        'Off-grid capabilities with solar power',
        'Rain water collection system',
        'Outdoor recreational area'
      );
      break;
    case 'eco_retreat':
      features.push(
        'Sustainable building materials and design',
        'Zero carbon footprint systems',
        'Nature trails and meditation areas',
        'Permaculture garden'
      );
      break;
    case 'conservation':
      features.push(
        'Minimal development footprint',
        'Wildlife habitat preservation',
        'Educational nature trails',
        'Research facilities'
      );
      break;
    case 'estate':
      features.push(
        'Luxury main residence',
        'Guest accommodations',
        'Landscaped gardens',
        'Private recreational facilities'
      );
      break;
    case 'commercial':
      features.push(
        'Multi-purpose commercial space',
        'Visitor parking area',
        'Flexible interior layouts',
        'Sustainable business operations'
      );
      break;
  }
  
  // Add terrain-specific features
  if (terrainType === 'mountain') {
    features.push('Designed to maximize mountain views', 'Erosion control measures');
  } else if (terrainType === 'coastal') {
    features.push('Protected from coastal elements', 'Beach access pathway');
  } else if (terrainType === 'desert') {
    features.push('Desert-appropriate landscaping', 'Heat mitigation design');
  } else if (terrainType === 'farmland') {
    features.push('Agricultural land preservation', 'Productive garden areas');
  } else { // forest
    features.push('Minimal tree removal', 'Forest integration');
  }
  
  // Generate description based on development type and terrain
  let description = '';
  switch (developmentType) {
    case 'cabin':
      description = `A rustic yet comfortable cabin retreat nestled in the ${terrainType}, designed to harmonize with the natural environment while providing modern comforts.`;
      break;
    case 'eco_retreat':
      description = `An eco-friendly retreat in this beautiful ${terrainType} setting, featuring sustainable systems and design that minimizes environmental impact.`;
      break;
    case 'conservation':
      description = `A conservation-focused development that preserves the natural ${terrainType} ecosystem while providing minimal facilities for education and research.`;
      break;
    case 'estate':
      description = `A premium estate property taking advantage of the ${terrainType} setting, with a main residence and guest facilities designed for luxury living in nature.`;
      break;
    case 'commercial':
      description = `A commercial development sensitively integrated into the ${terrainType} environment, with flexible spaces for various business operations.`;
      break;
  }
  
  return {
    developmentType,
    description,
    structures,
    features,
    environmentalImpact: developmentType === 'conservation' || developmentType === 'eco_retreat' ? 'low' : 'moderate',
    estimatedCost: {
      range: {
        min: developmentType === 'cabin' ? 150000 : developmentType === 'eco_retreat' ? 250000 : developmentType === 'conservation' ? 100000 : developmentType === 'estate' ? 750000 : 500000,
        max: developmentType === 'cabin' ? 350000 : developmentType === 'eco_retreat' ? 500000 : developmentType === 'conservation' ? 300000 : developmentType === 'estate' ? 2000000 : 1500000
      },
      currency: 'USD'
    },
    permitRequirements: [
      'Building permit',
      'Environmental assessment',
      developmentType === 'commercial' ? 'Commercial zoning approval' : 'Residential zoning verification',
      terrainType === 'coastal' ? 'Coastal development permit' : ''
    ].filter(Boolean)
  };
}

/**
 * Generates mood board inspiration for a property using AI
 */
export async function generateMoodBoardInspiration(property: any, styleType: string = 'modern'): Promise<MoodBoardInspirationResponse> {
  try {
    if (!property || !property.id) {
      throw new Error('Invalid property data');
    }
    
    const response = await fetch(`/api/ai/property/${property.id}/mood-board`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ styleType }),
      // Add timeout
      signal: AbortSignal.timeout(20000) // 20 second timeout since this is a complex operation
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data: MoodBoardInspirationResponse = await response.json();
    
    // Set default values for missing properties
    if (!data.styleDescription) {
      const styleDescriptions: Record<string, string> = {
        modern: 'A contemporary approach emphasizing clean lines, open spaces, and integration with nature through large windows and natural materials.',
        rustic: 'A warm, inviting style featuring natural materials, exposed beams, and a connection to the surrounding landscape.',
        minimalist: 'A functional approach focused on essential elements, clean surfaces, and thoughtful design that maximizes the natural setting.',
        luxury: 'An elegant design direction with premium finishes, sophisticated details, and high-end features that enhance the property value.',
        eco: 'A sustainable vision prioritizing energy efficiency, natural materials, and minimal environmental impact while maximizing comfort.'
      };
      
      data.styleDescription = styleDescriptions[styleType] || styleDescriptions.modern;
    }
    
    return data;
  } catch (error) {
    console.error('Error generating mood board inspiration:', error);
    
    // More descriptive error messages based on error type
    if (error instanceof TypeError) {
      console.error('Network error while generating mood board inspiration');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Mood board inspiration request timed out');
    }
    
    // Generate fallback mood board data
    return generateFallbackMoodBoardInspiration(property, styleType);
  }
}

/**
 * Generates fallback mood board inspiration data when API fails
 */
function generateFallbackMoodBoardInspiration(property: any, styleType: string = 'modern'): MoodBoardInspirationResponse {
  const propertyType = property?.propertyType?.toLowerCase() || 'forest';
  const features = property?.features || [];
  
  // Default colors based on style type and property type
  const colorsByStyle: Record<string, Array<{hex: string, name: string, description: string}>> = {
    modern: [
      { hex: '#2C3E50', name: 'Deep Blue', description: 'Modern slate blue for accent walls' },
      { hex: '#ECF0F1', name: 'Cloud White', description: 'Clean white for open spaces' },
      { hex: '#E74C3C', name: 'Coral Red', description: 'Bold accent color for modern contrast' },
      { hex: '#3498DB', name: 'Azure Blue', description: 'Vibrant blue for feature elements' },
      { hex: '#2ECC71', name: 'Emerald Green', description: 'Nature-inspired accent for connecting indoors and outdoors' }
    ],
    rustic: [
      { hex: '#8B4513', name: 'Saddle Brown', description: 'Warm wood tone for rustic interiors' },
      { hex: '#F5F5DC', name: 'Beige', description: 'Neutral base for natural settings' },
      { hex: '#556B2F', name: 'Olive Green', description: 'Earth tone that complements natural surroundings' },
      { hex: '#CD853F', name: 'Peru', description: 'Warm accent for wooden elements' },
      { hex: '#D2B48C', name: 'Tan', description: 'Soft neutral for walls and fabrics' }
    ],
    minimalist: [
      { hex: '#FFFFFF', name: 'Pure White', description: 'Clean base for minimalist spaces' },
      { hex: '#000000', name: 'Absolute Black', description: 'Strong contrast element' },
      { hex: '#E0E0E0', name: 'Platinum', description: 'Subtle neutral for texture' },
      { hex: '#B0B0B0', name: 'Silver', description: 'Understated accent' },
      { hex: '#F0F0F0', name: 'Snow', description: 'Soft white for layering' }
    ],
    luxury: [
      { hex: '#B8860B', name: 'Dark Goldenrod', description: 'Rich gold for luxury accents' },
      { hex: '#191970', name: 'Midnight Blue', description: 'Deep blue for opulence' },
      { hex: '#800000', name: 'Maroon', description: 'Rich red for luxury elements' },
      { hex: '#4B0082', name: 'Indigo', description: 'Deep purple for statement pieces' },
      { hex: '#F5F5F5', name: 'White Smoke', description: 'Clean base for showcasing luxury elements' }
    ],
    eco: [
      { hex: '#556B2F', name: 'Olive Green', description: 'Natural green for eco-friendly spaces' },
      { hex: '#8B7355', name: 'Khaki', description: 'Earth tone for natural materials' },
      { hex: '#F5DEB3', name: 'Wheat', description: 'Warm neutral for sustainable interiors' },
      { hex: '#708090', name: 'Slate Gray', description: 'Stone-inspired neutral' },
      { hex: '#228B22', name: 'Forest Green', description: 'Vibrant green for connecting with nature' }
    ]
  };
  
  // Select colors based on style, defaulting to modern if style not found
  const colors = colorsByStyle[styleType] || colorsByStyle.modern;
  
  // Image URLs based on property type and style
  let imageUrls = [
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6'
  ];
  
  // Descriptions based on style
  const imageDescriptions = {
    modern: ['Contemporary open space with natural light', 'Sleek interior with clean lines', 'Modern property with large windows'],
    rustic: ['Cabin with wooden elements', 'Natural stone fireplace', 'Rustic interior with exposed beams'],
    minimalist: ['Minimalist open concept space', 'Clean design with essential elements', 'Functional space with minimal decoration'],
    luxury: ['Elegant interior with high ceilings', 'Premium finishes and opulent details', 'Luxurious design elements'],
    eco: ['Sustainable build with natural materials', 'Eco-friendly design with solar elements', 'Green roof integration']
  };
  
  // Build the images array
  const images = imageUrls.map((url, index) => {
    const descriptions = imageDescriptions[styleType as keyof typeof imageDescriptions] || imageDescriptions.modern;
    return {
      url,
      description: descriptions[index] || 'Architectural inspiration',
      tags: ['property', styleType, propertyType, features[index % features.length] || 'land']
    };
  });
  
  // Generate keywords based on style and property type
  const keywordsByStyle: Record<string, string[]> = {
    modern: ['clean lines', 'open concept', 'minimalism', 'natural light', 'sustainable', 'smart home'],
    rustic: ['natural materials', 'wood beams', 'stone elements', 'warm tones', 'vintage', 'cozy'],
    minimalist: ['essential', 'functional', 'uncluttered', 'clean', 'purposeful', 'simple'],
    luxury: ['premium', 'opulent', 'sophisticated', 'elegant', 'high-end', 'exclusive'],
    eco: ['sustainable', 'energy-efficient', 'natural', 'recycled materials', 'low impact', 'green']
  };
  
  // Style descriptions
  const styleDescriptions = {
    modern: 'A contemporary approach emphasizing clean lines, open spaces, and integration with nature through large windows and natural materials.',
    rustic: 'A warm, inviting style featuring natural materials, exposed beams, and a connection to the surrounding landscape.',
    minimalist: 'A functional approach focused on essential elements, clean surfaces, and thoughtful design that maximizes the natural setting.',
    luxury: 'An elegant design direction with premium finishes, sophisticated details, and high-end features that enhance the property value.',
    eco: 'A sustainable vision prioritizing energy efficiency, natural materials, and minimal environmental impact while maximizing comfort.'
  };
  
  // Development suggestions based on property type and style
  const developmentSuggestionsByStyle: Record<string, string[]> = {
    modern: [
      'Design with floor-to-ceiling windows to showcase the natural views',
      'Incorporate smart home technology for efficient resource management',
      'Use sustainable materials with a modern aesthetic',
      'Create outdoor living spaces that extend the interior'
    ],
    rustic: [
      'Utilize local stone and timber for authentic character',
      'Design a statement fireplace as a central focal point',
      'Incorporate covered porches for outdoor enjoyment in all weather',
      'Consider exposed beam ceilings for traditional charm'
    ],
    minimalist: [
      'Focus on functional spaces with dual purposes',
      'Maximize natural light with strategic window placement',
      'Choose built-in furniture to reduce visual clutter',
      'Use a limited material palette throughout for cohesion'
    ],
    luxury: [
      'Include premium amenities like a wine cellar or home theater',
      'Design expansive entertaining spaces both indoor and outdoor',
      'Incorporate high-end natural stone and hardwoods',
      'Consider a wellness area with spa features'
    ],
    eco: [
      'Design for passive solar heating and cooling',
      'Consider a green roof for insulation and environmental benefits',
      'Implement rainwater harvesting systems',
      'Use reclaimed or locally sourced materials'
    ]
  };
  
  return {
    images,
    colors,
    keywords: (keywordsByStyle[styleType as keyof typeof keywordsByStyle] || keywordsByStyle.modern).concat([propertyType]),
    styleDescription: styleDescriptions[styleType as keyof typeof styleDescriptions] || styleDescriptions.modern,
    developmentSuggestions: developmentSuggestionsByStyle[styleType as keyof typeof developmentSuggestionsByStyle] || developmentSuggestionsByStyle.modern
  };
}