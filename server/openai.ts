import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable. OpenAI features will not work.");
}

// Create a singleton instance of the OpenAI client
const openai = new OpenAI({ 
  apiKey: API_KEY,
  maxRetries: 3,
  timeout: 30000 // 30 second timeout
});

/**
 * Analyzes a user's natural language query to extract search criteria for properties.
 */
export async function analyzePropertyQuery(query: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a real estate AI assistant helping users search for land properties. " +
            "Analyze the user's query and extract relevant search criteria. " +
            "Return a JSON object with the following structure: " +
            "{ 'properties': [], 'interpretation': { 'intent': '', 'extractedCriteria': { 'priceRange': '', 'location': '', 'propertyType': '', 'size': '', 'features': [] }, 'suggestedFilters': [] } }"
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error("Error analyzing property query:", error);
    throw new Error("Failed to analyze property search query");
  }
}

/**
 * Generates a risk analysis for a property based on its features and location.
 */
export async function generatePropertyRiskAnalysis(property: any) {
  try {
    const propertyContext = JSON.stringify({
      location: property.location,
      state: property.state,
      propertyType: property.propertyType,
      size: property.size,
      features: property.features
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a land assessment expert. Analyze this property and provide a detailed risk assessment. " +
            "Consider natural disasters, environmental factors, legal constraints, and development challenges. " +
            "Return a JSON object with: { 'risks': [{ 'type': '', 'level': '', 'description': '' }], 'summary': '', 'recommendations': [] }"
        },
        {
          role: "user",
          content: `Please analyze this property: ${propertyContext}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const data = content ? JSON.parse(content) : {};
    
    // Add utility function for risk color
    data.getRiskColor = function(level: string) {
      switch (level.toLowerCase()) {
        case 'high':
          return 'text-red-500';
        case 'medium':
          return 'text-yellow-500';
        case 'low':
          return 'text-green-500';
        default:
          return 'text-neutral-300';
      }
    };

    return data;
  } catch (error) {
    console.error("Error generating risk analysis:", error);
    // Return mock data for demo purposes when API is unavailable
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
      getRiskColor: function(level: string) {
        switch (level.toLowerCase()) {
          case 'high':
            return 'text-red-500';
          case 'medium':
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
 * Generates valuation insights for a property.
 */
export async function generatePropertyValuationInsights(property: any) {
  try {
    const propertyContext = JSON.stringify({
      location: property.location,
      state: property.state,
      propertyType: property.propertyType,
      size: property.size,
      price: property.price,
      features: property.features
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a real estate valuation expert. Provide insights on the value trends for this property. " +
            "Return a JSON object with: { 'trend': number, 'direction': '', 'forecast': '', 'factors': { 'positive': [], 'negative': [] }, 'comparables': { 'average': number, 'range': { 'min': number, 'max': number } } }"
        },
        {
          role: "user",
          content: `Please analyze this property's value: ${propertyContext}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const data = content ? JSON.parse(content) : {};
    
    // Add color property based on trend direction
    if (data.trend >= 5) {
      data.color = 'text-green-500';
    } else if (data.trend >= 0) {
      data.color = 'text-green-300';
    } else if (data.trend >= -5) {
      data.color = 'text-yellow-500';
    } else {
      data.color = 'text-red-500';
    }

    return data;
  } catch (error) {
    console.error("Error generating valuation insights:", error);
    // Return mock data for demo purposes when API is unavailable
    return {
      trend: 3.5,
      direction: "upward",
      forecast: "The property is likely to appreciate moderately over the next 5 years.",
      color: "text-green-500",
      factors: {
        positive: [
          "Growing demand in the region",
          "Zoning changes favorable for development",
          "Proximity to new infrastructure projects"
        ],
        negative: [
          "Seasonal market fluctuations",
          "Economic uncertainty in some sectors"
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
 * Generates a drone footage simulation for a property based on its features and terrain type.
 */
export async function generateDroneFootageSimulation(property: any) {
  try {
    const propertyContext = JSON.stringify({
      title: property.title,
      location: property.location,
      state: property.state,
      propertyType: property.propertyType,
      size: property.size,
      features: property.features,
      coordinates: property.coordinates
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a drone footage expert for real estate. Generate a simulated drone footage narrative for this property. " +
            "Consider terrain, features, boundaries, and potential development sites. " +
            "Return a JSON object with: { 'simulationPoints': [{ 'description': '', 'altitude': number, 'direction': '', 'coordinates': [lat, long], 'focusPoint': '' }], 'terrainAnalysis': '', 'suggestedViews': [] }"
        },
        {
          role: "user",
          content: `Please create a drone footage simulation for this property: ${propertyContext}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error("Error generating drone footage simulation:", error);
    
    // Determine terrain type based on property features or property type
    let terrainType = 'forest';
    const features: string[] = (property.features || []).map((feature: string) => feature.toLowerCase());
    const propertyType: string = (property.propertyType || '').toLowerCase();
    
    const isMountain = features.some((feature: string) => 
      feature.includes('mountain') || feature.includes('hill') || feature.includes('elevated')
    );
    
    const isCoastal = features.some((feature: string) => 
      feature.includes('beach') || feature.includes('ocean') || 
      feature.includes('sea') || feature.includes('water')
    );
    
    const isDesert = features.some((feature: string) => 
      feature.includes('desert') || feature.includes('arid') || feature.includes('dry')
    );
    
    const isFarmland = features.some((feature: string) => 
      feature.includes('farm') || feature.includes('agriculture') || feature.includes('crop')
    );
    
    if (isMountain) {
      terrainType = 'mountain';
    } else if (isCoastal) {
      terrainType = 'coastal';
    } else if (isDesert) {
      terrainType = 'desert';
    } else if (isFarmland) {
      terrainType = 'farmland';
    } else if (propertyType.includes('farm') || propertyType.includes('ranch') || propertyType.includes('agriculture')) {
      terrainType = 'farmland';
    }
    
    // Return fallback data when API is unavailable
    return {
      terrainType,
      simulationPoints: [
        {
          description: `Flying over ${terrainType} terrain, showcasing the natural features of the property.`,
          altitude: 120,
          direction: "north",
          coordinates: property.coordinates || [35.123, -106.549],
          focusPoint: "Scenic view of the entire property"
        },
        {
          description: `Descending to get a closer look at the buildable area of the property.`,
          altitude: 60,
          direction: "east",
          coordinates: property.coordinates ? [property.coordinates[0] + 0.001, property.coordinates[1] + 0.001] : [35.124, -106.548],
          focusPoint: "Potential building site"
        },
        {
          description: `Flying along the property boundary to show the land's extent and neighboring areas.`,
          altitude: 90,
          direction: "south",
          coordinates: property.coordinates ? [property.coordinates[0] - 0.001, property.coordinates[1]] : [35.122, -106.549],
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
}

/**
 * Generates a virtual development concept for a property based on development type and features.
 */
export async function generateDevelopmentConcept(property: any, developmentType: string = 'cabin') {
  try {
    // Determine the terrain type based on property features
    let terrainType = 'forest';
    const features: string[] = (property.features || []).map((feature: string) => feature.toLowerCase());
    const propertyType: string = (property.propertyType || '').toLowerCase();
    
    if (features.some(feature => feature.includes('mountain') || feature.includes('hill') || feature.includes('elevated'))) {
      terrainType = 'mountain';
    } else if (features.some(feature => feature.includes('beach') || feature.includes('ocean') || feature.includes('sea') || feature.includes('water'))) {
      terrainType = 'coastal';
    } else if (features.some(feature => feature.includes('desert') || feature.includes('arid') || feature.includes('dry'))) {
      terrainType = 'desert';
    } else if (features.some(feature => feature.includes('farm') || feature.includes('agriculture') || feature.includes('crop'))) {
      terrainType = 'farmland';
    } else if (propertyType.includes('farm') || propertyType.includes('ranch') || propertyType.includes('agriculture')) {
      terrainType = 'farmland';
    }
    
    const propertyContext = JSON.stringify({
      title: property.title,
      location: property.location,
      state: property.state,
      terrainType,
      propertyType: property.propertyType,
      size: property.size,
      features: property.features,
      coordinates: property.coordinates,
      developmentType: developmentType
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an architectural and land development expert. Generate a development concept for this property. " +
            "Consider the terrain type, property characteristics, and the requested development type. " +
            "Return a detailed JSON object with the following structure: " +
            `{
              "developmentType": string, 
              "description": string,
              "structures": [
                {
                  "type": "building" | "natural" | "pathway",
                  "name": string,
                  "position": [number, number], // normalized 0-1 coordinates
                  "size": [number, number], // normalized 0-1 size
                  "path": [[number, number]] // array of points for pathway
                }
              ],
              "features": string[],
              "environmentalImpact": "low" | "moderate" | "high",
              "estimatedCost": {
                "range": {
                  "min": number,
                  "max": number
                },
                "currency": string
              },
              "permitRequirements": string[]
            }`
        },
        {
          role: "user",
          content: `Please create a development concept for this property: ${propertyContext}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error("Error generating development concept:", error);
    
    // Determine the terrain type based on property features
    let terrainType = 'forest';
    if (!property) return generateFallbackDevelopmentConcept('cabin', terrainType);
    
    const features: string[] = (property.features || []).map((feature: string) => feature.toLowerCase());
    const propertyType: string = (property.propertyType || '').toLowerCase();
    
    if (features.some(feature => feature.includes('mountain') || feature.includes('hill') || feature.includes('elevated'))) {
      terrainType = 'mountain';
    } else if (features.some(feature => feature.includes('beach') || feature.includes('ocean') || feature.includes('sea') || feature.includes('water'))) {
      terrainType = 'coastal';
    } else if (features.some(feature => feature.includes('desert') || feature.includes('arid') || feature.includes('dry'))) {
      terrainType = 'desert';
    } else if (features.some(feature => feature.includes('farm') || feature.includes('agriculture') || feature.includes('crop'))) {
      terrainType = 'farmland';
    } else if (propertyType.includes('farm') || propertyType.includes('ranch') || propertyType.includes('agriculture')) {
      terrainType = 'farmland';
    }
    
    // Return fallback data when API is unavailable
    return generateFallbackDevelopmentConcept(developmentType, terrainType);
  }
}

/**
 * Generates fallback development concept data when API fails
 */
function generateFallbackDevelopmentConcept(developmentType: string = 'cabin', terrainType: string = 'forest') {
  // Generate structures based on development type
  const structures = [];
  
  // Main building
  structures.push({
    type: 'building',
    name: developmentType === 'cabin' ? 'Main Cabin' : 
          developmentType === 'eco_retreat' ? 'Eco Lodge' :
          developmentType === 'estate' ? 'Main Residence' :
          developmentType === 'commercial' ? 'Commercial Building' : 'Conservation Center',
    position: [0.5, 0.6],
    size: [0.3, 0.2]
  });
  
  // Add additional structures based on development type
  if (developmentType === 'estate') {
    structures.push({
      type: 'building',
      name: 'Guest House',
      position: [0.65, 0.7],
      size: [0.15, 0.1]
    });
  }
  
  if (developmentType === 'commercial') {
    structures.push({
      type: 'building',
      name: 'Storage Facility',
      position: [0.35, 0.7],
      size: [0.2, 0.15]
    });
  }
  
  // Add natural features for all types
  structures.push({
    type: 'natural',
    name: 'Natural Area',
    position: [0.25, 0.3],
    size: [0.3, 0.3]
  });
  
  // Add pathway
  structures.push({
    type: 'pathway',
    name: 'Main Access',
    position: [0.5, 0.9],
    size: [0.05, 0.4],
    path: [[0.5, 0.9], [0.5, 0.7], [0.5, 0.6]]
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
 * Generates mood board inspiration for a property
 */
export async function generatePropertyMoodBoardInspiration(property: any, styleType: string = 'modern') {
  try {
    // Determine the terrain type based on property features
    let terrainType = 'forest';
    const features: string[] = (property.features || []).map((feature: string) => feature.toLowerCase());
    const propertyType: string = (property.propertyType || '').toLowerCase();
    
    if (features.some(feature => feature.includes('mountain') || feature.includes('hill') || feature.includes('elevated'))) {
      terrainType = 'mountain';
    } else if (features.some(feature => feature.includes('beach') || feature.includes('ocean') || feature.includes('sea') || feature.includes('water'))) {
      terrainType = 'coastal';
    } else if (features.some(feature => feature.includes('desert') || feature.includes('arid') || feature.includes('dry'))) {
      terrainType = 'desert';
    } else if (features.some(feature => feature.includes('farm') || feature.includes('agriculture') || feature.includes('crop'))) {
      terrainType = 'farmland';
    } else if (propertyType.includes('farm') || propertyType.includes('ranch') || propertyType.includes('agriculture')) {
      terrainType = 'farmland';
    }
    
    const propertyContext = JSON.stringify({
      title: property.title,
      location: property.location,
      state: property.state,
      terrainType,
      propertyType: property.propertyType,
      size: property.size,
      features: property.features,
      coordinates: property.coordinates,
      styleType: styleType
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an interior and architectural design expert with experience in creating mood boards. " +
            "Generate mood board inspiration for a property based on the details provided and the requested style. " +
            "The inspiration should include image ideas (URLs are not needed, just concepts), color palettes, keywords, and development suggestions. " +
            "Return a detailed JSON object with the following structure: " +
            `{
              "images": [
                {
                  "description": string, // Description of the image concept
                  "tags": string[] // Relevant tags for the image
                }
              ],
              "colors": [
                {
                  "hex": string, // Hex color code
                  "name": string, // Color name
                  "description": string // How to use this color
                }
              ],
              "keywords": string[], // Design keywords that match the style
              "styleDescription": string, // Description of the design style
              "developmentSuggestions": string[] // Array of development suggestions
            }`
        },
        {
          role: "user",
          content: `Please create a mood board inspiration for this property with style "${styleType}": ${propertyContext}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error("Error generating mood board inspiration:", error);
    
    // Return fallback mood board inspiration data
    return generateFallbackMoodBoardInspiration(styleType, property?.propertyType?.toLowerCase() || 'land');
  }
}

/**
 * Generates fallback mood board inspiration data when API fails
 */
function generateFallbackMoodBoardInspiration(styleType: string = 'modern', propertyType: string = 'land') {
  // Default keywords by style
  const keywordsByStyle: Record<string, string[]> = {
    modern: ['clean lines', 'open concept', 'minimalism', 'natural light', 'sustainable', 'smart home'],
    rustic: ['natural materials', 'wood beams', 'stone elements', 'warm tones', 'vintage', 'cozy'],
    minimalist: ['essential', 'functional', 'uncluttered', 'clean', 'purposeful', 'simple'],
    luxury: ['premium', 'opulent', 'sophisticated', 'elegant', 'high-end', 'exclusive'],
    eco: ['sustainable', 'energy-efficient', 'natural', 'recycled materials', 'low impact', 'green']
  };
  
  // Default color palettes by style
  const colorsByStyle: Record<string, Array<{hex: string, name: string, description: string}>> = {
    modern: [
      { hex: '#2C3E50', name: 'Deep Blue', description: 'Modern slate blue for accent walls' },
      { hex: '#ECF0F1', name: 'Cloud White', description: 'Clean white for open spaces' },
      { hex: '#3498DB', name: 'Azure Blue', description: 'Vibrant blue for feature elements' },
      { hex: '#2ECC71', name: 'Emerald Green', description: 'Nature-inspired accent' }
    ],
    rustic: [
      { hex: '#8B4513', name: 'Saddle Brown', description: 'Warm wood tone for beams and furniture' },
      { hex: '#F5F5DC', name: 'Beige', description: 'Neutral base for walls' },
      { hex: '#A0522D', name: 'Sienna', description: 'Earthy red-brown for accents' },
      { hex: '#556B2F', name: 'Olive Green', description: 'Natural complement to wood elements' }
    ],
    minimalist: [
      { hex: '#FFFFFF', name: 'Pure White', description: 'Clean base for walls and ceilings' },
      { hex: '#000000', name: 'Absolute Black', description: 'Strong contrast for minimal accents' },
      { hex: '#E0E0E0', name: 'Light Gray', description: 'Subtle differentiation in spaces' },
      { hex: '#BDBDBD', name: 'Medium Gray', description: 'Neutral for furniture and fixtures' }
    ],
    luxury: [
      { hex: '#C0B283', name: 'Champagne Gold', description: 'Metallic accent for hardware and fixtures' },
      { hex: '#373737', name: 'Charcoal', description: 'Sophisticated base for statement pieces' },
      { hex: '#6E8898', name: 'Slate Blue', description: 'Cool tone for elegant spaces' },
      { hex: '#DCD0C0', name: 'Taupe', description: 'Neutral backdrop for luxury elements' }
    ],
    eco: [
      { hex: '#8D8741', name: 'Olive', description: 'Nature-inspired tone for accent walls' },
      { hex: '#FBEEC1', name: 'Light Beige', description: 'Natural tone for main spaces' },
      { hex: '#659DBD', name: 'Water Blue', description: 'Accent color reminiscent of water' },
      { hex: '#DAAD86', name: 'Soft Terra', description: 'Earth-inspired tone for grounding elements' }
    ]
  };
  
  // Style descriptions
  const styleDescriptions: Record<string, string> = {
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
  
  // Image descriptions by style
  const imageDescriptionsByStyle: Record<string, string[]> = {
    modern: [
      'Contemporary mountain home with glass facade',
      'Open concept interior with natural materials',
      'Sleek architectural details with landscape integration'
    ],
    rustic: [
      'Timber frame cabin with stone accents',
      'Cozy interior with exposed wood beams',
      'Natural stonework fireplace with wooden mantel'
    ],
    minimalist: [
      'Simple geometric structure with large windows',
      'Clean interior with essential furnishings',
      'Uncluttered spaces with natural light focus'
    ],
    luxury: [
      'Expansive estate with premium architectural details',
      'High-end interior with custom finishes',
      'Elegant outdoor living space with impressive views'
    ],
    eco: [
      'Sustainable design with solar integration',
      'Natural material construction with minimal footprint',
      'Green roof technology with rainwater collection'
    ]
  };
  
  const selectedStyle = styleType.toLowerCase();
  const keywords = (keywordsByStyle[selectedStyle] || keywordsByStyle.modern).concat([propertyType]);
  const colors = colorsByStyle[selectedStyle] || colorsByStyle.modern;
  const styleDescription = styleDescriptions[selectedStyle] || styleDescriptions.modern;
  const developmentSuggestions = developmentSuggestionsByStyle[selectedStyle] || developmentSuggestionsByStyle.modern;
  const imageDescriptions = imageDescriptionsByStyle[selectedStyle] || imageDescriptionsByStyle.modern;
  
  // Build image concepts
  const images = imageDescriptions.map((description, index) => ({
    description,
    tags: ['property', selectedStyle, propertyType, keywords[index % keywords.length]]
  }));
  
  return {
    images,
    colors,
    keywords,
    styleDescription,
    developmentSuggestions
  };
}