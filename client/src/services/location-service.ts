interface LocationData {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  country: string;
}

/**
 * Get the user's approximate location based on their IP address
 * First tries server API, then uses default location for demo purposes
 */
export async function getUserLocation(): Promise<LocationData> {
  try {
    // Try to get location from server-side API
    const serverResponse = await fetch('/api/user/location');
    
    // If server responded successfully
    if (serverResponse.ok) {
      const serverData = await serverResponse.json();
      
      // Check if we have the required data
      if (serverData && serverData.city && serverData.state) {
        console.log('Got location from server API:', serverData);
        
        // Extract coordinates or use defaults
        const latitude = parseFloat(serverData.latitude) || 0;
        const longitude = parseFloat(serverData.longitude) || 0;
        
        return {
          city: serverData.city,
          state: serverData.state,
          latitude,
          longitude, 
          country: serverData.country || 'US'
        };
      }
    }
    
    // If server API failed, use Austin as default
    console.log('Using Austin, TX as default location');
    return {
      city: 'Austin',
      state: 'TX',
      latitude: 30.2672,
      longitude: -97.7431,
      country: 'US'
    };
  } catch (error) {
    console.error('Error fetching user location:', error);
    
    // Return a default location for Texas 
    // This ensures users can always see properties in our database
    return {
      city: 'Dallas',
      state: 'TX',
      latitude: 32.7767,
      longitude: -96.7970,
      country: 'US'
    };
  }
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Find properties near a specific location
 * @param properties List of properties
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param maxDistance Maximum distance in kilometers (default: 100km)
 * @returns Filtered properties sorted by distance from user
 */
export function findNearbyProperties(
  properties: any[],
  latitude: number,
  longitude: number,
  maxDistance: number = 100
): any[] {
  if (!properties || properties.length === 0) {
    return [];
  }
  
  // Filter properties within maxDistance from the user
  const propertiesWithDistance = properties.map(property => {
    const distance = calculateDistance(
      latitude,
      longitude,
      property.latitude, 
      property.longitude
    );
    
    return {
      ...property,
      distance
    };
  });
  
  // Filter and sort the properties by distance
  return propertiesWithDistance
    .filter(property => property.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}