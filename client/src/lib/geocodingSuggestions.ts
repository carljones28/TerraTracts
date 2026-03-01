import { LocationSuggestion } from "@/components/home/SearchSuggestions";

/**
 * Fetch location suggestions from Mapbox Geocoding API
 * 
 * @param query Search query
 * @param mapboxToken Mapbox API token
 * @param limit Maximum number of suggestions to return
 * @returns Promise with location suggestions
 */
export async function fetchLocationSuggestions(
  query: string,
  mapboxToken: string,
  limit: number = 10
): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2 || !mapboxToken) {
    return [];
  }

  try {
    // Encode query for URL
    const encodedQuery = encodeURIComponent(query);
    
    // Create URL for Mapbox Geocoding API
    // Types: country,region,place,district,locality,neighborhood,address
    // Limit to US results
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&types=place,district,locality,neighborhood,address,region&limit=${limit}&language=en`;
    
    const response = await fetch(geocodingUrl);
    
    if (!response.ok) {
      throw new Error(`Geocoding API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      return [];
    }
    
    return data.features.map((feature: any) => {
      const { id, place_type, text, place_name, context = [] } = feature;
      
      let type: 'city' | 'county' | 'neighborhood' | 'address' | 'region' | 'place' = 'place';
      
      // Map place_type to our types
      if (place_type.includes('region')) {
        type = 'region';
      } else if (place_type.includes('place')) {
        type = 'city';
      } else if (place_type.includes('district')) {
        type = 'county';
      } else if (place_type.includes('neighborhood')) {
        type = 'neighborhood';
      } else if (place_type.includes('address')) {
        type = 'address';
      }
      
      // Extract state from context
      const stateObj = context.find((ctx: any) => ctx.id.startsWith('region'));
      const state = stateObj ? stateObj.text : '';
      
      // Create secondary text (like "CA" or "Los Angeles County, CA")
      let secondaryText = '';
      
      if (state) {
        if (type === 'city' || type === 'neighborhood') {
          // For cities and neighborhoods, secondary text is State
          secondaryText = state;
        } else if (type === 'address') {
          // For addresses, get the city and state
          const cityObj = context.find((ctx: any) => ctx.id.startsWith('place'));
          const city = cityObj ? cityObj.text : '';
          secondaryText = city ? `${city}, ${state}` : state;
        }
      }
      
      return {
        id,
        placeName: place_name,
        mainText: text,
        secondaryText,
        type
      };
    });
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
}

export function getGeocodeTypeFromSuggestion(suggestion: LocationSuggestion): string {
  // Map our types to what's expected by the geocoding function
  switch (suggestion.type) {
    case 'region':
      return 'region';
    case 'city':
      return 'place';
    case 'county':
      return 'district';
    case 'neighborhood':
      return 'neighborhood';
    case 'address':
      return 'address';
    default:
      return 'place';
  }
}