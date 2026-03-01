import axios from 'axios';

interface GeolocationResponse {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Cache expiration time in milliseconds (1 hour)
const CACHE_EXPIRATION = 60 * 60 * 1000;

// Type for the cache items
interface CacheItem {
  data: GeolocationResponse;
  timestamp: number;
}

// Cache to avoid excessive API calls
const ipCache: Record<string, CacheItem> = {};

/**
 * Get geolocation data for an IP address from IP-API
 * Uses a local cache to reduce API calls
 */
export async function getLocationFromIP(ip: string): Promise<GeolocationResponse> {
  // Check if we have a cached response
  if (ipCache[ip] && Date.now() - ipCache[ip].timestamp < CACHE_EXPIRATION) {
    console.log(`Using cached location data for IP: ${ip}`);
    return ipCache[ip].data;
  }

  // For private/local IPs, return Dallas, TX as a default
  if (isPrivateIP(ip)) {
    console.log(`Using default location (Dallas, TX) for private IP: ${ip}`);
    const defaultLocation = getDefaultLocation();
    
    // Cache the result
    ipCache[ip] = {
      data: defaultLocation,
      timestamp: Date.now()
    };
    
    return defaultLocation;
  }

  try {
    console.log(`Fetching location data for IP: ${ip}`);
    
    // Make API request to IP-API
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=city,regionName,country,lat,lon`);
    
    // Check if the request was successful
    if (response.data.status === 'fail') {
      console.error(`IP-API error: ${response.data.message}`);
      return getDefaultLocation();
    }
    
    // Map response to our interface
    const location: GeolocationResponse = {
      city: response.data.city || 'Unknown',
      state: response.data.regionName || 'TX',
      country: response.data.country || 'US',
      latitude: response.data.lat || 32.7767,
      longitude: response.data.lon || -96.7970
    };
    
    // Cache the result
    ipCache[ip] = {
      data: location,
      timestamp: Date.now()
    };
    
    return location;
  } catch (error) {
    console.error('Error fetching location from IP-API:', error);
    
    // Fall back to default location on error
    return getDefaultLocation();
  }
}

/**
 * Check if an IP address is private/local
 */
function isPrivateIP(ip: string): boolean {
  // Check localhost and private network ranges
  return ip === '127.0.0.1' || 
         ip === 'localhost' || 
         ip.startsWith('10.') || 
         ip.startsWith('192.168.') || 
         ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) !== null;
}

/**
 * Get default location (Dallas, TX)
 */
function getDefaultLocation(): GeolocationResponse {
  return {
    city: 'Dallas',
    state: 'TX',
    country: 'US',
    latitude: 32.7767,
    longitude: -96.7970
  };
}