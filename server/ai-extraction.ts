/**
 * AI-Powered Data Point Extraction Toolkit
 * 
 * This module provides AI-based extraction and enhancement of property data points
 * using OpenAI (with Anthropic fallback) to improve data quality from web scraping.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { PropertyExtractRequest, PropertyExtractResponse, PropertyFeature } from '../shared/types';

// Initialize AI clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Extract and enhance property data using AI
 * Uses OpenAI with fallback to Anthropic if available
 */
export async function enhancePropertyData(scrapedData: any): Promise<any> {
  try {
    // Skip AI enhancement if minimal data is unavailable
    if (!scrapedData.title && !scrapedData.description) {
      console.log('Skipping AI enhancement - insufficient source data');
      return scrapedData;
    }

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        const enhancedData = await extractDataWithOpenAI(scrapedData);
        return enhancedData;
      } catch (err) {
        console.error('OpenAI enhancement failed, trying Anthropic fallback:', err);
      }
    }

    // Try Anthropic as fallback
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const enhancedData = await extractDataWithAnthropic(scrapedData);
        return enhancedData;
      } catch (err) {
        console.error('Anthropic enhancement also failed:', err);
      }
    }

    // Return original data if both AI enhancements fail, but still do basic enhancements
    console.log('AI enhancement failed, using original scraped data with basic enhancements');
    
    // Try to detect waterfront properties based on title and description
    if (!scrapedData.isWaterfront) {
      const title = scrapedData.title || '';
      const description = scrapedData.description || '';
      const combinedText = (title + ' ' + description).toLowerCase();
      
      // More specific waterfront detection - look for these terms specifically as main features
      const hasMainWaterFeature = 
          combinedText.includes('waterfront') || 
          combinedText.includes('lake front') || 
          combinedText.includes('lakefront') || 
          combinedText.includes('river front') || 
          combinedText.includes('riverfront') || 
          combinedText.includes('ocean front') || 
          combinedText.includes('oceanfront') ||
          // Also check for phrases like "on Clear Lake" or "on the river"
          combinedText.match(/\bon\s+(?:the\s+)?(?:lake|river|ocean|pond)/i) ||
          // Or check for water features with "frontage"
          combinedText.match(/(?:lake|river|ocean|pond)\s+frontage/i);
          
      // Check for secondary water features, only set if they seem significant
      const hasSecondaryWaterFeature = 
          combinedText.includes('lake') || 
          combinedText.includes('river') || 
          combinedText.includes('ocean') || 
          combinedText.includes('pond');
      
      // Smaller water features that aren't typically enough to be "waterfront"
      const hasMinorWaterFeature = 
          combinedText.includes('stream') || 
          combinedText.includes('creek');
          
      // Specifically check for seasonal water features which typically don't qualify as waterfront
      const hasSeasonalWaterFeature =
          combinedText.includes('seasonal creek') ||
          combinedText.includes('seasonal stream') ||
          (hasMinorWaterFeature && combinedText.includes('seasonal'));
          
      // Set waterfront based on water feature significance
      if (hasMainWaterFeature) {
        scrapedData.isWaterfront = true;
      } else if (hasSecondaryWaterFeature && !combinedText.includes('seasonal')) {
        // Only set if it's not a seasonal water feature
        scrapedData.isWaterfront = true;
      } else if (hasMinorWaterFeature && !hasSeasonalWaterFeature) {
        // For minor water features (that are not seasonal), only set if they appear to be significant features
        // e.g., "creek runs through property" vs "small creek in one corner"
        const isSignificantFeature = 
            combinedText.includes('bordered by') ||
            combinedText.includes('runs through') ||
            combinedText.includes('flowing through') ||
            // Highlighting "feet of frontage" typically indicates significance
            combinedText.match(/\d+\s+feet\s+of.*(?:creek|stream)/i);
            
        scrapedData.isWaterfront = isSignificantFeature;
      } else {
        // Explicitly set to false for seasonal water features
        scrapedData.isWaterfront = false;
      }
      
      // Also check features for water-related items
      if (Array.isArray(scrapedData.features)) {
        for (const feature of scrapedData.features) {
          const featureName = (feature.name || '').toLowerCase();
          const featureValue = (feature.value || '').toLowerCase();
          
          if (featureName.includes('lake') || 
              featureName.includes('river') || 
              featureName.includes('water') || 
              featureValue.includes('frontage')) {
            scrapedData.isWaterfront = true;
            break;
          }
        }
      }
    }
    
    // Try to detect mountain view properties from title and description
    if (!scrapedData.isMountainView) {
      const title = scrapedData.title || '';
      const description = scrapedData.description || '';
      const combinedText = (title + ' ' + description).toLowerCase();
      
      // Check for mountain-related terms
      if (combinedText.includes('mountain') || 
          combinedText.includes('hill') || 
          combinedText.includes('vista') || 
          combinedText.includes('peak')) {
        scrapedData.isMountainView = true;
      }
    }
    
    return scrapedData;
  } catch (error) {
    console.error('Error in AI property data enhancement:', error);
    return scrapedData; // Return original on error
  }
}

/**
 * Extract targeted data points from property using OpenAI
 */
async function extractDataWithOpenAI(scrapedData: any): Promise<any> {
  // Construct the prompt with the scraped data
  const prompt = constructExtractionPrompt(scrapedData);
  
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are a real estate data extraction expert. Extract structured property data from the provided information. Output in JSON format only."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    return mergeExtractedData(scrapedData, result);
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}

/**
 * Extract targeted data points from property using Anthropic
 */
async function extractDataWithAnthropic(scrapedData: any): Promise<any> {
  // Construct the prompt with the scraped data
  const prompt = constructExtractionPrompt(scrapedData);
  
  try {
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025. Do not change this unless explicitly requested by the user.
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: "You are a real estate data extraction expert. Extract structured property data from the provided information. Output in JSON format only.",
      max_tokens: 2000,
      messages: [
        { role: "user", content: prompt }
      ],
    });

    // Parse the JSON from Claude's response
    const text = response.content[0]?.text || '{}';
    const result = JSON.parse(text);
    return mergeExtractedData(scrapedData, result);
  } catch (error) {
    console.error('Anthropic extraction error:', error);
    throw error;
  }
}

/**
 * Construct a prompt for AI property data extraction
 */
function constructExtractionPrompt(scrapedData: any): string {
  return `
Extract the following property data points from this real estate listing:

PROPERTY LISTING INFORMATION:
Title: ${scrapedData.title || ""}
Description: ${scrapedData.description || ""}
Price: ${scrapedData.price || "Unknown"}
Acreage: ${scrapedData.acreage || "Unknown"}
${scrapedData.location ? `Location: ${JSON.stringify(scrapedData.location)}` : ""}
${scrapedData.features ? `Features: ${JSON.stringify(scrapedData.features)}` : ""}
${scrapedData.property_type ? `Property Type: ${scrapedData.property_type}` : ""}

Extract and return these data points in JSON format:
1. title: Improved title that highlights key property attributes (location, acreage, key features)
2. description: Enhanced & cleaned description with key points organized
3. price: Numeric price value (in USD without $ or commas)
4. acreage: Numeric acreage value
5. property_type: One of ["residential", "commercial", "recreational", "agricultural", "conservation", "land", "farm", "ranch", "mountain", "waterfront"]
6. terrain_type: Primary terrain type(s) like "forest", "mountain", "desert", "prairie", "valley", etc.
7. water_features: Array of any water features mentioned ["lake", "river", "creek", "pond", "ocean frontage", etc.]
8. road_access: Description of road access
9. utilities: Array of available utilities ["electricity", "water", "sewage", "internet", etc.]
10. zoning: Zoning information if available
11. potential_uses: Array of potential land uses ["farming", "hunting", "residential development", etc.]
12. unique_features: Array of any unique selling points

Return these ONLY as a JSON object with these fields, with no additional text.
`;
}

/**
 * Intelligently merge extracted AI data with original scraped data
 */
function mergeExtractedData(originalData: any, aiExtractedData: any): any {
  const mergedData = { ...originalData };

  // Set limit for confidence to override original data
  const AI_CONFIDENCE_THRESHOLD = 0.75;

  // Function to determine if AI-extracted value should replace original
  const shouldUseAiValue = (originalValue: any, aiValue: any): boolean => {
    // Always use AI value if original is missing
    if (!originalValue || originalValue === 0) return !!aiValue;
    
    // Never replace original with empty AI value
    if (!aiValue) return false;

    // For numeric values, only replace if original is suspiciously low/high or AI is very different
    if (typeof originalValue === 'number' && typeof aiValue === 'number') {
      // If original price is below $100 or above $100M, likely an error
      if (originalValue < 100 || originalValue > 100000000) return true;
      
      // If values differ by more than 20%, AI might have a more accurate value
      const percentDiff = Math.abs(originalValue - aiValue) / originalValue;
      return percentDiff > 0.2; 
    }

    // For string values, prefer AI value if it's longer (more detailed)
    if (typeof originalValue === 'string' && typeof aiValue === 'string') {
      return aiValue.length > originalValue.length * 1.2; // 20% longer
    }

    // For arrays, prefer AI value if it has more items
    if (Array.isArray(originalValue) && Array.isArray(aiValue)) {
      return aiValue.length > originalValue.length;
    }

    // Default to keeping original
    return false;
  };

  // Process text fields
  if (aiExtractedData.title && shouldUseAiValue(originalData.title, aiExtractedData.title)) {
    mergedData.title = aiExtractedData.title;
  }

  if (aiExtractedData.description && shouldUseAiValue(originalData.description, aiExtractedData.description)) {
    mergedData.description = aiExtractedData.description;
  }

  // Process numeric fields
  if (typeof aiExtractedData.price === 'number' && shouldUseAiValue(originalData.price, aiExtractedData.price)) {
    mergedData.price = aiExtractedData.price;
  }

  if (typeof aiExtractedData.acreage === 'number' && shouldUseAiValue(originalData.acreage, aiExtractedData.acreage)) {
    mergedData.acreage = aiExtractedData.acreage;
  }

  // Process property type
  if (aiExtractedData.property_type && shouldUseAiValue(originalData.property_type, aiExtractedData.property_type)) {
    mergedData.property_type = aiExtractedData.property_type;
  }

  // Add or enhance features based on AI extraction
  const existingFeatures = Array.isArray(mergedData.features) ? mergedData.features : [];
  const newFeatures: PropertyFeature[] = [];

  // Add terrain type
  if (aiExtractedData.terrain_type) {
    const terrainFeature = {
      name: 'Terrain',
      value: aiExtractedData.terrain_type,
      category: 'terrain'
    };
    newFeatures.push(terrainFeature);
  }

  // Add water features
  if (Array.isArray(aiExtractedData.water_features) && aiExtractedData.water_features.length > 0) {
    newFeatures.push({
      name: 'Water Features',
      value: aiExtractedData.water_features.join(', '),
      category: 'water'
    });
  }

  // Add road access
  if (aiExtractedData.road_access) {
    newFeatures.push({
      name: 'Road Access',
      value: aiExtractedData.road_access,
      category: 'access'
    });
  }

  // Add utilities
  if (Array.isArray(aiExtractedData.utilities) && aiExtractedData.utilities.length > 0) {
    newFeatures.push({
      name: 'Utilities',
      value: aiExtractedData.utilities.join(', '),
      category: 'utilities'
    });
  }

  // Add zoning
  if (aiExtractedData.zoning) {
    newFeatures.push({
      name: 'Zoning',
      value: aiExtractedData.zoning,
      category: 'zoning'
    });
  }

  // Add potential uses
  if (Array.isArray(aiExtractedData.potential_uses) && aiExtractedData.potential_uses.length > 0) {
    newFeatures.push({
      name: 'Potential Uses',
      value: aiExtractedData.potential_uses.join(', '),
      category: 'uses'
    });
  }

  // Add unique features
  if (Array.isArray(aiExtractedData.unique_features) && aiExtractedData.unique_features.length > 0) {
    newFeatures.push({
      name: 'Unique Features',
      value: aiExtractedData.unique_features.join(', '),
      category: 'unique'
    });
  }

  // Merge with existing features, removing duplicates
  const existingNames = new Set(existingFeatures.map((f: PropertyFeature) => f.name.toLowerCase()));
  for (const feature of newFeatures) {
    if (!existingNames.has(feature.name.toLowerCase())) {
      existingFeatures.push(feature);
    }
  }

  mergedData.features = existingFeatures;

  // Check for properties with waterfront feature based on AI-extracted data
  if (!mergedData.isWaterfront && aiExtractedData.water_features && 
      Array.isArray(aiExtractedData.water_features) &&
      aiExtractedData.water_features.some((w: string) => 
        w.toLowerCase().includes('lake') || 
        w.toLowerCase().includes('river') || 
        w.toLowerCase().includes('ocean') ||
        w.toLowerCase().includes('waterfront'))) {
    mergedData.isWaterfront = true;
  }

  // Check for properties with mountain view based on AI-extracted terrain type
  if (!mergedData.isMountainView && aiExtractedData.terrain_type && 
      typeof aiExtractedData.terrain_type === 'string' &&
      aiExtractedData.terrain_type.toLowerCase().includes('mountain')) {
    mergedData.isMountainView = true;
  }

  // Return enhanced data
  return mergedData;
}

/**
 * Process property data through the AI extraction toolkit
 */
export async function processPropertyWithAI(propertyData: PropertyExtractRequest): Promise<PropertyExtractResponse> {
  try {
    const enhancedData = await enhancePropertyData(propertyData);
    
    return {
      success: true,
      data: enhancedData,
      message: "Property data enhanced with AI"
    };
  } catch (error: any) {
    console.error('Error processing property with AI:', error);
    return {
      success: false,
      data: propertyData, // Return original data on error
      message: `AI enhancement failed: ${error?.message || 'Unknown error'}`
    };
  }
}