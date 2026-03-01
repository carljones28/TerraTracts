import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = 'claude-3-7-sonnet-20250219';

// Create Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Enhanced property query analysis with Claude
 * Benefits over OpenAI implementation:
 * - Better understanding of complex queries
 * - More accurate extraction of requirements
 * - Better handling of ambiguous location descriptions
 */
export async function enhancedPropertyQueryAnalysis(query: string) {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You are TerraNova Vision's AI real estate assistant. Analyze users' property search queries to:
1. Understand what they're looking for (their intent)
2. Extract their specific criteria: price range, location, property type, size, features, etc.
3. Suggest additional filters they might want to apply

Format your response as structured JSON with these fields:
{
  "intent": "A clear, natural statement of what the user is looking for",
  "extractedCriteria": {
    "priceRange": "Price range as a string (e.g., 'under $300,000')",
    "location": "Location as a string (e.g., 'Colorado')",
    "propertyType": "Property type as a string (e.g., 'ranch')",
    "size": "Size as a string (e.g., '5-10 acres')",
    "features": ["Array of features as strings"]
  },
  "suggestedFilters": ["Array of suggested filters as strings"]
}
- suggestedFilters: An array of suggested filters based on their query

Example response format:
{
  "intent": "Finding a waterfront property in Maine under $100,000",
  "extractedCriteria": {
    "priceRange": "under $100,000",
    "location": "Maine",
    "propertyType": "land",
    "size": null,
    "features": ["waterfront"]
  },
  "suggestedFilters": ["Coastal", "Vacation property", "Buildable"]
}`,
      messages: [{ role: 'user', content: query }],
    });

    // Parse the JSON response
    const content = response.content[0] as { text: string };
    const interpretation = JSON.parse(content.text);

    return {
      interpretation
    };
  } catch (error) {
    console.error('Error in enhanced property query analysis:', error);
    throw error;
  }
}

/**
 * Analyzes property terrain from images using Claude's superior vision capabilities
 */
export async function analyzePropertyTerrain(imageBase64: string) {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You are a property terrain analysis expert. When shown an image of land, analyze and categorize:
1. Terrain type (flat, hilly, mountainous, etc.)
2. Vegetation (forest, grassland, desert, etc.)
3. Notable features (water bodies, rock formations, etc.)
4. Development challenges (slopes, wetlands, etc.)
5. Potential uses based on terrain

Format your response as structured JSON:
{
  "terrainType": "string",
  "vegetation": "string",
  "notableFeatures": ["string"],
  "developmentChallenges": ["string"],
  "potentialUses": ["string"]
}`,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: 'Analyze this property terrain and provide the information in JSON format.'
          }
        ]
      }]
    });

    // Parse the JSON response
    const content = response.content[0] as { text: string };
    const analysisResults = JSON.parse(content.text);

    return analysisResults;
  } catch (error) {
    console.error('Error in property terrain analysis:', error);
    return {
      terrainType: "Unknown",
      vegetation: "Unknown",
      notableFeatures: [],
      developmentChallenges: ["Unable to analyze terrain"],
      potentialUses: []
    };
  }
}

/**
 * Generates advanced property insights, including sustainability score, potential uses, etc.
 */
export async function generateAdvancedPropertyInsights(property: any) {
  try {
    const propertyInfo = JSON.stringify(property);
    
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You are TerraNova Vision's advanced property insights AI. Generate detailed insights about land properties that go beyond basic information. Focus on sustainability, development potential, and investment outlook.

Format your response as structured JSON with these fields:
- sustainabilityScore: A number 0-100 rating the property's environmental sustainability
- recommendedDevelopment: Array of strings with eco-friendly development approaches
- potentialUses: Array of strings with potential land uses
- investmentOutlook: String with 5-year investment outlook
- comparableProperties: Array of example comparable property descriptions
- conservationPotential: "High", "Moderate", or "Low"

Sample format:
{
  "sustainabilityScore": 85,
  "recommendedDevelopment": ["Passive house", "Solar-powered cabin", "Earth-sheltered home"],
  "potentialUses": ["Sustainable forestry", "Eco-tourism", "Conservation easement"],
  "investmentOutlook": "Strong appreciation potential due to increasing demand for rural retreats",
  "comparableProperties": ["5 acres with stream in neighboring county, sold for $150,000", "Similar 10-acre woodland parcel appreciated 15% over 3 years"],
  "conservationPotential": "High"
}`,
      messages: [{ 
        role: 'user', 
        content: `Generate advanced property insights for this land listing: ${propertyInfo}`
      }],
    });

    // Parse the JSON response
    const content = response.content[0] as { text: string };
    const insights = JSON.parse(content.text);

    return insights;
  } catch (error) {
    console.error('Error generating advanced property insights:', error);
    return {
      sustainabilityScore: 50,
      recommendedDevelopment: ["Sustainable building"],
      potentialUses: ["Residential"],
      investmentOutlook: "Property data insufficient for detailed analysis",
      comparableProperties: [],
      conservationPotential: "Moderate"
    };
  }
}

/**
 * Generates enhanced, more personalized property recommendations based on user's search patterns
 */
export async function generatePersonalizedRecommendations(userPreferences: any, searchHistory: string[]) {
  try {
    const preferencesText = JSON.stringify(userPreferences);
    const historyText = JSON.stringify(searchHistory);
    
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You are TerraNova Vision's personalized recommendation AI. Analyze user preferences and search history to generate highly personalized property recommendations.

Format your response as structured JSON with these fields:
- recommendationStrategy: String explaining the personalization strategy
- priorityFeatures: Array of property features that should be prioritized based on user behavior
- suggestedPropertyTypes: Array of property types that match the user's interests
- locationInsights: Insights about locations the user might be interested in
- priceRangeAdjustment: Suggested price range based on search patterns
- specialRecommendations: Array of specific property characteristic recommendations

Sample format:
{
  "recommendationStrategy": "Focus on waterfront properties with development potential based on consistent interest in coastal land",
  "priorityFeatures": ["Waterfront", "Road access", "Mountain views"],
  "suggestedPropertyTypes": ["Coastal acreage", "Riverfront lots"],
  "locationInsights": "User shows strong preference for Pacific Northwest, particularly Oregon coast",
  "priceRangeAdjustment": "$150,000 - $300,000 based on search patterns",
  "specialRecommendations": ["Properties with existing utilities", "Land with subdividing potential"]
}`,
      messages: [{ 
        role: 'user', 
        content: `Generate personalized property recommendations based on these user preferences: ${preferencesText} and search history: ${historyText}`
      }],
    });

    // Parse the JSON response
    const content = response.content[0] as { text: string };
    const recommendations = JSON.parse(content.text);

    return recommendations;
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    return {
      recommendationStrategy: "Based on your search patterns",
      priorityFeatures: [],
      suggestedPropertyTypes: [],
      locationInsights: "Consider exploring more options",
      priceRangeAdjustment: "Within your current search range",
      specialRecommendations: []
    };
  }
}