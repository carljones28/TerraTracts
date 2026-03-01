import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// This file provides utilities for working with Mapbox GL and Three.js

// Store map state globally
let mapState = {
  mode: 'satellite',  // 'satellite' or 'standard'
  zoom: 4,  // Default zoom for USA
  center: { lat: 39.8283, lng: -98.5795 }, // Default to center of USA
  hoveredProperty: null,
  selectedProperty: null,
  filterPolygon: null,  // For "Draw" tool functionality
  markers: [] as mapboxgl.Marker[], // Store Mapbox markers
  propertyToPriceHTML: new Map<number, string>(),
  mapInstance: null as mapboxgl.Map | null // Store the map instance globally
};

// Function to initialize a real Mapbox GL map like Zillow
export async function initMap(container: HTMLDivElement, onMarkerClick?: (propertyId: number) => void): Promise<mapboxgl.Map | null> {
  if (!container) {
    console.error("Map container element is null or undefined");
    return null;
  }

  try {
    // Get the Mapbox API key from server environment
    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        console.error(`Failed to fetch config: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }
      
      const config = await response.json();
      
      if (!config || !config.mapboxApiKey) {
        console.error('Invalid config response or missing Mapbox API key in config');
        throw new Error('Mapbox API key is missing from server config');
      }
      
      mapboxgl.accessToken = config.mapboxApiKey;
      
      // Double check if token is still not set
      if (!mapboxgl.accessToken) {
        console.error('Mapbox API key is empty or not properly set');
        throw new Error('Mapbox API key is not set in server config');
      }
    } catch (fetchError) {
      console.error('Failed to get Mapbox API key:', fetchError);
      // Try fallback to env variable directly (will work in development)
      try {
        if (import.meta.env.VITE_MAPBOX_API_KEY) {
          mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;
          console.log('Using fallback Mapbox API key from environment');
        } else {
          return null;
        }
      } catch (envError) {
        console.error('Fallback to env variable failed:', envError);
        return null;
      }
    }
    
    if (!mapboxgl.accessToken) {
      console.error('No Mapbox API key available after all attempts');
      return null;
    }
    
    // Choose initial style based on mode
    const initialStyle = mapState.mode === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12'  // Satellite view with streets overlay
      : 'mapbox://styles/mapbox/streets-v12';          // Regular street map
    
    // Create and initialize the map
    const map = new mapboxgl.Map({
      container,
      style: initialStyle,
      center: [mapState.center.lng, mapState.center.lat],
      zoom: mapState.zoom,
      minZoom: 2,  // Don't zoom out too far
      maxZoom: 18, // Maximum zoom level
      attributionControl: false, // Hide attribution for cleaner look like Zillow
      boxZoom: true,
      doubleClickZoom: true,
      keyboard: true,
      scrollZoom: true,
      dragRotate: false, // Disable 3D rotation for a Zillow-like experience
      pitchWithRotate: false,
      failIfMajorPerformanceCaveat: false, // Be more tolerant of performance issues
      preserveDrawingBuffer: true, // Help with certain WebGL contexts
      antialias: true // Better display quality
    });

    // Add error handling for map initialization
    map.on('error', (e) => {
      console.error('Mapbox map error:', e);
    });

    // Add a navigation control, but position it in the bottom right like Zillow
    try {
      map.addControl(new mapboxgl.NavigationControl({
        showCompass: false // Zillow doesn't show compass, only zoom +/- buttons
      }), 'bottom-right');
    } catch (controlError) {
      console.error('Error adding navigation control:', controlError);
      // Don't fail the entire map for a control error
    }
    
    // Handle map loading with retries if needed
    let loadAttempts = 0;
    const maxLoadAttempts = 3;
    
    const setupMapLoad = () => {
      map.on('load', () => {
        try {
          // After loading the map, we can set a state variable to indicate it's ready
          console.log('Map loaded successfully');
          
          // Update the stored map center and zoom level when the map moves
          map.on('moveend', () => {
            try {
              const center = map.getCenter();
              mapState.center = { lat: center.lat, lng: center.lng };
              mapState.zoom = map.getZoom();
            } catch (err) {
              console.error('Error in moveend event:', err);
            }
          });
        } catch (loadError) {
          console.error('Error in map load handler:', loadError);
          loadAttempts++;
          
          if (loadAttempts < maxLoadAttempts) {
            console.log(`Retrying map load setup (attempt ${loadAttempts})`);
            // Try again with delay
            setTimeout(setupMapLoad, 1000);
          }
        }
      });
    };
    
    setupMapLoad();
    
    // Store the map instance globally for later access
    mapState.mapInstance = map;
    
    return map;
  } catch (error) {
    console.error('Map initialization error:', error);
    return null;
  }
}

// Function to draw a satellite-style map
function drawSatelliteMap(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Base layer - dark earth tone
  ctx.fillStyle = '#2A3D30';
  ctx.fillRect(0, 0, width, height);

  // Create a semi-transparent gradient overlay for lighting effect
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(20, 30, 20, 0.7)');
  gradient.addColorStop(0.3, 'rgba(40, 60, 40, 0.3)');
  gradient.addColorStop(0.7, 'rgba(20, 40, 30, 0.3)');
  gradient.addColorStop(1, 'rgba(10, 20, 20, 0.7)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add texture to make it look more like satellite imagery
  
  // Grid pattern to simulate image tiles - very subtle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 0.5;
  
  const tileSize = 256; // Standard satellite tile size
  for (let x = 0; x < width; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y < height; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Add terrain features
  
  // Large landforms (using consistent random seed to ensure the same features appear each time)
  const seed = mapState.center.lat * mapState.center.lng; // Use current map center as seed
  const random = (idx: number) => (Math.sin(seed + idx * 100) + 1) / 2; // Pseudo-random between 0-1
  
  // Forest patches
  ctx.fillStyle = 'rgba(29, 68, 26, 0.6)';
  for (let i = 0; i < 12; i++) {
    const x = random(i * 2) * width;
    const y = random(i * 2 + 1) * height;
    const size = 40 + random(i) * 120;
    
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.8, random(i + 20) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Agricultural areas (rectangular fields) - resembles Zillow's satellite view
  ctx.fillStyle = 'rgba(90, 80, 30, 0.3)';
  for (let i = 0; i < 15; i++) {
    const x = random(i + 50) * width;
    const y = random(i + 60) * height;
    const size = 30 + random(i + 10) * 80;
    const rotation = random(i + 5) * 0.5;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.restore();
  }
  
  // Water features - fewer but more realistic
  ctx.fillStyle = 'rgba(14, 42, 71, 0.7)';
  for (let i = 0; i < 3; i++) {
    const x = random(i + 100) * width;
    const y = random(i + 110) * height;
    const size = 60 + random(i + 15) * 140;
    
    ctx.beginPath();
    
    // Create irregular water shapes
    ctx.moveTo(x, y);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
      const radius = size * (0.7 + random(i + angle * 10) * 0.5);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      ctx.lineTo(px, py);
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  // Add roads - similar to Zillow's white/gray lines for roads
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
  
  // Main roads
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    const y = random(i + 200) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    // Slightly curved roads like Zillow
    for (let x = 0; x < width; x += 10) {
      const offset = Math.sin(x * 0.005) * 10 * random(i + x);
      ctx.lineTo(x, y + offset);
    }
    
    ctx.stroke();
  }
  
  // Secondary roads
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(190, 190, 190, 0.4)';
  for (let i = 0; i < 8; i++) {
    const x = random(i + 300) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    
    for (let y = 0; y < height; y += 10) {
      const offset = Math.sin(y * 0.005) * 8 * random(i + y);
      ctx.lineTo(x + offset, y);
    }
    
    ctx.stroke();
  }
}

// Function to draw a standard/map-style map exactly like Zillow
function drawStandardMap(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Zillow's map view uses a very light gray/white background
  ctx.fillStyle = '#F8F9FA';
  ctx.fillRect(0, 0, width, height);
  
  // Use consistent random seeding like in satellite view
  const seed = mapState.center.lat * mapState.center.lng;
  const random = (idx: number) => (Math.sin(seed + idx * 100) + 1) / 2;
  
  // Draw city/neighborhood blocks in very light gray
  ctx.fillStyle = '#F1F2F3';
  for (let i = 0; i < 20; i++) {
    const x = random(i + 500) * width;
    const y = random(i + 510) * height;
    const blockSize = 80 + random(i + 10) * 140;
    
    ctx.beginPath();
    ctx.rect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
    ctx.fill();
  }
  
  // Large roads - light gray
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 3;
  
  // Major highways/roads grid
  const gridSpacing = 120;
  
  // Draw only some major roads to avoid clutter
  for (let x = gridSpacing; x < width; x += gridSpacing * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = gridSpacing; y < height; y += gridSpacing * 1.5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Secondary roads - thinner lines like Zillow
  ctx.strokeStyle = '#ECEEF0';
  ctx.lineWidth = 1.5;
  
  const secondaryGridSize = 40;
  
  // Draw secondary road grid
  for (let x = secondaryGridSize; x < width; x += secondaryGridSize) {
    // Skip if close to major road
    if (x % gridSpacing < 20 || x % gridSpacing > gridSpacing - 20) continue;
    
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = secondaryGridSize; y < height; y += secondaryGridSize) {
    // Skip if close to major road
    if (y % gridSpacing < 20 || y % gridSpacing > gridSpacing - 20) continue;
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Water features - Zillow uses light blue
  ctx.fillStyle = '#DBEAFE';
  for (let i = 0; i < 3; i++) {
    const x = random(i + 100) * width;
    const y = random(i + 110) * height;
    const size = 60 + random(i + 15) * 120;
    
    ctx.beginPath();
    
    // Create irregular water shapes
    ctx.moveTo(x, y);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
      const radius = size * (0.7 + random(i + angle * 10) * 0.5);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      ctx.lineTo(px, py);
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  // Parks/green areas - Zillow uses a pale green that's not too saturated
  ctx.fillStyle = '#E2F5E7';
  for (let i = 0; i < 5; i++) {
    const x = random(i + 200) * width;
    const y = random(i + 210) * height;
    const size = 40 + random(i + 20) * 70;
    
    // Draw park shapes
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
      const radius = size * (0.8 + random(i + angle * 5) * 0.4);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  
  // Add some neighborhood/city labels - Zillow uses thin gray text
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  
  const neighborhoods = [
    'Greenwood', 
    'Riverside', 
    'Oakdale', 
    'Pleasant Valley', 
    'Cedar Hills',
    'Maple Ridge',
    'Grand Plains',
    'Mountain View'
  ];
  
  // Add neighborhood names - positioned logically
  for (let i = 0; i < 6; i++) {
    const x = 80 + random(i + 300) * (width - 160);
    const y = 60 + random(i + 310) * (height - 120);
    
    const name = neighborhoods[Math.floor(random(i + 320) * neighborhoods.length)];
    
    // Draw with slight shadow for better visibility
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 2;
    ctx.fillText(name, x, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  
  // Zillow adds interstate/highway icons
  for (let i = 0; i < 2; i++) {
    const x = random(i + 400) * width;
    const y = random(i + 410) * height;
    
    // Draw highway shield
    ctx.fillStyle = '#E4322F'; // Red for interstate
    ctx.beginPath();
    ctx.rect(x - 12, y - 10, 24, 20);
    ctx.fill();
    
    // Highway number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Arial';
    const highwayNum = Math.floor(random(i + 420) * 90) + 10;
    ctx.fillText(highwayNum.toString(), x, y + 3);
  }
}

// Function to update map location
export function updateMapLocation(location: { lat: number; lng: number; zoom: number }) {
  try {
    console.log("Updating map location to:", location);
    
    // First check for our direct map reference from SimpleHomepageMap component
    const homepageMap = (window as any).__homepageMap;
    
    if (homepageMap) {
      console.log("Using direct map reference from SimpleHomepageMap");
      
      // Update the map view with smooth fly animation for responsive transition
      homepageMap.flyTo({
        center: [location.lng, location.lat], // Mapbox expects [longitude, latitude] order
        zoom: location.zoom || 10,
        essential: true, // This animation is considered essential
        duration: 800, // Smooth duration for glitch-free transition
        curve: 1.42, // Standard smooth curve
        speed: 1.5 // Moderate speed for smoothness
      });
      
      // After flying to location, fetch properties in the area
      setTimeout(() => {
        fetchPropertiesNearLocation(location.lng, location.lat, 20)
          .then(properties => {
            console.log(`Found ${properties.length} properties near the selected location`);
          })
          .catch(error => {
            console.error("Error fetching properties after location update:", error);
          });
      }, 900); // Give the map time to complete animation
      
      return true;
    }
    
    // Fallback to mapState.mapInstance if direct reference is not available
    if (!mapState.mapInstance) {
      console.error("Cannot update map location: no map instance is available");
      return false;
    }
    
    // Store the coordinates for use in the application
    mapState.center = { lat: location.lat, lng: location.lng };
    mapState.zoom = location.zoom;
    
    // Update the map view with smooth fly animation for responsive transition
    mapState.mapInstance.flyTo({
      center: [location.lng, location.lat], // Mapbox expects [longitude, latitude] order
      zoom: location.zoom,
      essential: true, // This animation is considered essential
      duration: 800, // Smooth duration for glitch-free transition
      curve: 1.42, // Standard smooth curve
      speed: 1.5 // Moderate speed for smoothness
    });
    
    console.log("Setting map coordinates with lng first, lat second");
    return true;
  } catch (error) {
    console.error("Error updating map location:", error);
    return false;
  }
}

// Fetch properties near a location
/**
 * Geocodes a location string (city, address, or ZIP code) using Mapbox API
 * @param locationString - The location to geocode (e.g., "New York", "94105", "123 Main St")
 * @returns Promise with geocoded location data or null if not found
 */
export async function geocodeLocation(
  locationString: string, 
  explicitType?: string
): Promise<{
  latitude: number;
  longitude: number;
  placeName: string;
  type: string;
  zoom?: number;
  state?: string;
  bbox?: [number, number, number, number]; // [west, south, east, north]
} | null> {
  try {
    if (!locationString || locationString.trim() === '') {
      console.log('Empty location string provided for geocoding');
      return null;
    }
    
    console.log(`Geocoding location: ${locationString}`);
    
    // Get Mapbox API key from config
    let apiKey = '';
    try {
      const configResponse = await fetch('/api/config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        apiKey = config.mapboxApiKey;
      }
    } catch (error) {
      console.error('Error getting Mapbox API key for geocoding:', error);
      
      // Try fallback to env variable
      try {
        if (import.meta.env.VITE_MAPBOX_API_KEY) {
          apiKey = import.meta.env.VITE_MAPBOX_API_KEY;
          console.log('Using fallback Mapbox API key from environment for geocoding');
        }
      } catch (envError) {
        console.error('Fallback to env variable failed:', envError);
      }
    }
    
    if (!apiKey) {
      console.error('No Mapbox API key available for geocoding');
      return null;
    }
    
    // Determine what type of location we're looking for
    // This helps Mapbox provide more relevant results:
    // - postcode for ZIP codes
    // - place,locality for cities
    // - region for states
    // - address for specific addresses
    const locationTypes = [];
    
    // If an explicit type is provided, use it (from suggestions)
    if (explicitType) {
      locationTypes.push(explicitType);
    }
    // Otherwise try to determine type based on the string
    else {
      // Check if it might be a ZIP code (5 digits)
      if (/^\d{5}$/.test(locationString.trim())) {
        locationTypes.push('postcode');
      } 
      // If it has a number, it might be an address
      else if (/\d/.test(locationString)) {
        locationTypes.push('address');
      } 
      // Otherwise check for potential city or state
      else {
        locationTypes.push('place', 'locality', 'region');
      }
    }
    
    // Use Mapbox Geocoding API with types
    const typeParam = locationTypes.length > 0 ? `&types=${locationTypes.join(',')}` : '';
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationString)}.json?access_token=${apiKey}&limit=3${typeParam}`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log(`No geocoding results found for "${locationString}"`);
      return null;
    }
    
    // Get the best feature based on relevance and type
    // Use more precise logic to get the best match
    const feature = getBestFeature(data.features, locationString);
    console.log('Best geocoding result chosen:', feature);
    
    // Extract state from context if available
    let state = '';
    if (feature.context) {
      const stateContext = feature.context.find((c: any) => c.id.startsWith('region'));
      if (stateContext) {
        state = stateContext.text;
      }
    }
    
    // Determine appropriate zoom level based on result type
    const zoom = getZoomLevelForFeature(feature);
    
    // Return formatted location data with zoom and state info
    return {
      longitude: feature.center[0],
      latitude: feature.center[1],
      placeName: feature.place_name,
      type: feature.place_type[0], // e.g., "address", "postcode", "place" (city), "region" (state)
      bbox: feature.bbox, // Might be undefined for some results
      zoom,  // New field for appropriate zoom level
      state  // New field for state information
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Helper function to get the most appropriate feature from mapbox results 
function getBestFeature(features: any[], searchQuery: string): any {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0];
  
  // Lowercase for case-insensitive comparison
  const query = searchQuery.toLowerCase();
  
  // First, try to find exact matches for city, ZIP or address
  for (const feature of features) {
    const mainText = feature.text?.toLowerCase() || '';
    
    // If we have an exact match with the main text, use this feature
    if (mainText === query) {
      return feature;
    }
    
    // For addresses, check if the query is contained in the place_name
    if (feature.place_type.includes('address') && feature.place_name?.toLowerCase().includes(query)) {
      return feature;
    }
  }
  
  // If no exact matches, prioritize by type (prefer more specific types)
  const typePreference = ['address', 'postcode', 'place', 'locality', 'region'];
  
  for (const type of typePreference) {
    const matchingFeature = features.find(f => f.place_type[0] === type);
    if (matchingFeature) {
      return matchingFeature;
    }
  }
  
  // If still no matches by type, just return the first one
  return features[0];
}

// Helper function to determine appropriate zoom level based on feature type
function getZoomLevelForFeature(feature: any): number {
  const type = feature.place_type?.[0];
  
  // Default zoom levels based on result type
  switch (type) {
    case 'address':
      return 16; // Street level
    case 'postcode':
      return 12; // Neighborhood level
    case 'place':
    case 'locality':
      return 10; // City level
    case 'region':
      return 6;  // State level
    case 'country':
      return 4;  // Country level
    default:
      return 10; // Default to city level zoom
  }
}

export async function fetchPropertiesNearLocation(longitude: number, latitude: number, radiusMiles: number = 10): Promise<any[]> {
  try {
    // Ensure coordinates are valid numbers
    if (isNaN(longitude) || isNaN(latitude) || !isFinite(longitude) || !isFinite(latitude)) {
      console.error(`Invalid coordinates: [${longitude}, ${latitude}]`);
      return [];
    }
    
    // Validate and normalize longitude and latitude
    const validLongitude = Math.max(-180, Math.min(180, longitude));
    const validLatitude = Math.max(-90, Math.min(90, latitude));
    
    if (validLongitude !== longitude || validLatitude !== latitude) {
      console.warn(`Coordinates adjusted from [${longitude}, ${latitude}] to [${validLongitude}, ${validLatitude}]`);
    }
    
    // Ensure radius is positive and reasonable
    const validRadius = Math.max(1, Math.min(500, radiusMiles));
    
    console.log(`Fetching properties near [${validLongitude}, ${validLatitude}] with radius ${validRadius} miles`);
    
    // Make API call to fetch properties near this location with validated parameters
    const response = await fetch(
      `/api/properties/near?longitude=${validLongitude}&latitude=${validLatitude}&radius=${validRadius}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch nearby properties: ${response.status} ${response.statusText}`);
    }
    
    const properties = await response.json();
    
    // If no properties found with the initial radius, try expanding the search (with a hard limit)
    if (properties.length === 0 && validRadius < 100) {
      console.log(`No properties found within ${validRadius} miles, expanding search radius`);
      // Try again with a larger radius (up to our max of 500)
      return await fetchPropertiesNearLocation(validLongitude, validLatitude, validRadius * 2);
    }
    
    console.log(`Found ${properties.length} properties near location`);
    
    // Add distance information to each property
    const propertiesWithDistance = properties.map((property: any) => {
      // Calculate straight-line distance between search point and property
      const propLat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
      const propLng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;
      
      // Add computed distance if not already provided by the API
      if (!property.distance) {
        const distance = calculateHaversineDistance(
          validLatitude, validLongitude,
          propLat, propLng
        );
        return { ...property, distance };
      }
      
      return property;
    });
    
    // Sort by distance (closest first)
    return propertiesWithDistance.sort((a: any, b: any) => a.distance - b.distance);
  } catch (error) {
    console.error("Error fetching properties near location:", error);
    return [];
  }
}

// Haversine formula to calculate great-circle distance between two points
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}

// Define interfaces for property item
interface PropertyItem {
  id: number;
  latitude: string | number;
  longitude: string | number;
  price: string | number;
  propertyType?: string;
  [key: string]: any; // Allow other properties
}

// Define marker group for clustering properties that are close to each other
interface MarkerGroup {
  centerX: number;
  centerY: number;
  count: number;
  properties: PropertyItem[];
}

// Function to add property markers to the Mapbox map
export function addPropertyMarkers(map: mapboxgl.Map, properties: PropertyItem[], onMarkerClick: (propertyId: number) => void) {
  if (!map) {
    console.error("Cannot add property markers - map is null or undefined");
    return;
  }
  
  if (!Array.isArray(properties)) {
    console.error("Cannot add property markers - properties is not an array");
    return;
  }
  
  // Check if map is ready to use in a safer way
  try {
    // A much safer check for map readiness
    if (!map.isStyleLoaded()) {
      console.log("Map style not yet loaded. Waiting for style load event before adding markers...");
      
      // Set up listener for when map style is loaded to try adding markers again
      const addMarkersWhenLoaded = () => {
        try {
          addPropertyMarkers(map, properties, onMarkerClick);
        } catch (err) {
          console.error('Error adding markers after style load:', err);
        }
        
        // Remove the listener to avoid duplicates
        map.off('style.load', addMarkersWhenLoaded);
      };
      
      map.once('style.load', addMarkersWhenLoaded);
      return;
    }
  } catch (err) {
    // If isStyleLoaded throws an error (which can happen), 
    // We'll handle it more gracefully by using the load event instead
    console.log("Using fallback load event for markers due to:", err);
    
    const addMarkersWhenLoaded = () => {
      try {
        setTimeout(() => {
          addPropertyMarkers(map, properties, onMarkerClick);
        }, 500); // Add a slight delay to ensure map is truly ready
      } catch (err) {
        console.error('Error adding markers with fallback method:', err);
      }
    };
    
    map.once('load', addMarkersWhenLoaded);
    return;
  }
  
  // Safely remove any existing markers
  try {
    if (Array.isArray(mapState.markers)) {
      mapState.markers.forEach(marker => {
        try {
          if (marker && typeof marker.remove === 'function') {
            marker.remove();
          }
        } catch (err) {
          console.error('Error removing marker:', err);
        }
      });
      mapState.markers = [];
    }
  } catch (err) {
    console.error('Error clearing markers:', err);
    mapState.markers = [];
  }
  
  // Calculate property price ranges for styling markers with error handling
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  
  try {
    // Filter out invalid properties first
    const validProperties = properties.filter(property => {
      try {
        return property && 
               (typeof property.price === 'string' || typeof property.price === 'number') &&
               property.latitude !== undefined && 
               property.longitude !== undefined;
      } catch (err) {
        console.error('Error validating property:', err);
        return false;
      }
    });
    
    if (validProperties.length === 0) {
      console.warn('No valid properties to display on map');
      return;
    }
    
    // Now calculate price ranges with clean data
    validProperties.forEach(property => {
      try {
        const price = typeof property.price === 'string' 
          ? parseFloat(property.price.replace(/[^0-9.]/g, '')) 
          : property.price;
        
        if (!isNaN(price) && isFinite(price)) {
          if (price < minPrice) minPrice = price;
          if (price > maxPrice) maxPrice = price;
        }
      } catch (err) {
        console.error('Error processing property price:', err, property);
      }
    });
    
    // Handle edge case of all same price or invalid prices
    if (minPrice === Infinity || maxPrice === -Infinity || minPrice === maxPrice) {
      console.log('Setting default price range due to invalid or uniform prices');
      minPrice = 0;
      maxPrice = 1000000;
    }
  } catch (err) {
    console.error('Error calculating price ranges:', err);
    // Set default price range if calculation fails
    minPrice = 0;
    maxPrice = 1000000;
  }
  
  const priceRange = maxPrice - minPrice;
  
  properties.forEach(property => {
    try {
      // Skip invalid properties
      if (!property || typeof property.id !== 'number') {
        console.warn('Skipping invalid property:', property);
        return;
      }
    
      // Parse coordinates safely
      let latitude, longitude, price;
      try {
        latitude = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
        longitude = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;
        
        // Validate coordinates
        if (isNaN(latitude) || isNaN(longitude) || !isFinite(latitude) || !isFinite(longitude)) {
          console.warn(`Skipping property with invalid coordinates: ID ${property.id}, lat: ${latitude}, lng: ${longitude}`);
          return;
        }
      } catch (err) {
        console.error('Error parsing coordinates for property:', property.id, err);
        return;
      }
      
      // Parse price safely
      try {
        price = typeof property.price === 'string' ? parseFloat(property.price.replace(/[^0-9.]/g, '')) : property.price;
        if (isNaN(price) || !isFinite(price)) {
          price = 0; // Default to 0 if price is invalid
        }
      } catch (err) {
        console.error('Error parsing price for property:', property.id, err);
        price = 0;
      }
      
      // Calculate price ratio for color intensity safely
      const priceRatio = (priceRange > 0 && isFinite(priceRange) && !isNaN(price)) 
        ? Math.max(0, Math.min(1, (price - minPrice) / priceRange)) // Clamp between 0-1
        : 0.5;
      
      // Format price for display - exactly like Zillow
      let priceStr = '$0';
      try {
        priceStr = price >= 1000000 
          ? `$${(price / 1000000).toFixed(1)}M` 
          : price >= 1000 
            ? `$${(price / 1000).toFixed(0)}K` 
            : `$${price}`;
      } catch (err) {
        console.error('Error formatting price for property:', property.id, err);
      }
      
      // Decide on style based on property type (land vs homes)
      let isLand = false;
      try {
        const propertyTypeLC = property.propertyType ? property.propertyType.toLowerCase() : '';
        isLand = !!(propertyTypeLC.includes('land') || 
                  propertyTypeLC.includes('farm') || 
                  propertyTypeLC.includes('ranch'));
      } catch (err) {
        console.error('Error determining property type for property:', property.id, err);
      }
      
      // Create HTML element for the marker
      const el = document.createElement('div');
      
      try {
        if (isLand) {
          // LandSearch style - green circular marker
          el.className = 'property-marker land-marker';
          el.style.width = '28px';
          el.style.height = '28px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#297540'; // LandSearch green
          el.style.color = 'white';
          el.style.fontWeight = 'bold';
          el.style.fontSize = '11px';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.border = '2px solid white';
          el.style.cursor = 'pointer';
          
          // Shorter price text for circular markers
          const shortPriceStr = price >= 1000000 
            ? `$${Math.round(price/1000000)}M` 
            : `$${Math.round(price/1000)}K`;
          
          el.textContent = shortPriceStr;
        } else {
          // Zillow style - red/purple price bubble
          const red = Math.floor(100 + priceRatio * 155); // 100-255 (blue to purple/red)
          const green = Math.floor(20 + priceRatio * 60); // Keep green darker for Zillow look
          const blue = Math.floor(220 - priceRatio * 140); // 220-80 (blue to purple/red)
          
          el.className = 'property-marker zillow-marker';
          el.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
          el.style.color = 'white';
          el.style.padding = '3px 8px';
          el.style.borderRadius = '4px';
          el.style.fontSize = '12px';
          el.style.fontWeight = 'bold';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';
          el.style.whiteSpace = 'nowrap';
          
          el.textContent = priceStr;
        }
        
        // Store the price HTML for this property ID (for future reference)
        mapState.propertyToPriceHTML.set(property.id, el.textContent);
        
        // Create a popup but don't add it to the map yet
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
          className: 'property-popup'
        }).setHTML(`
          <div class="property-popup-content">
            <div class="property-popup-price">${priceStr}</div>
            <div class="property-popup-details">
              ${property.acreage ? `<span>${typeof property.acreage === 'string' ? property.acreage : `${property.acreage.toFixed(2)} acres`}</span>` : ''}
              ${property.propertyType ? `<span>${property.propertyType}</span>` : ''}
            </div>
            <div class="property-popup-title">${property.title || ''}</div>
          </div>
        `);
        
        // Create the marker and add it to the map
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom'
        })
          .setLngLat([longitude, latitude])
          .addTo(map);
        
        // Add event handlers (hover and click) with error handling
        el.addEventListener('mouseenter', () => {
          try {
            marker.setPopup(popup);
            popup.addTo(map);
          } catch (err) {
            console.error('Error showing popup:', err);
          }
        });
        
        el.addEventListener('mouseleave', () => {
          try {
            popup.remove();
          } catch (err) {
            console.error('Error removing popup:', err);
          }
        });
        
        el.addEventListener('click', () => {
          try {
            if (typeof onMarkerClick === 'function' && typeof property.id === 'number') {
              onMarkerClick(property.id);
            } else {
              console.warn('Invalid click handler or property ID');
            }
          } catch (err) {
            console.error('Error in marker click handler:', err);
          }
        });
        
        // Store the marker reference for later cleanup
        mapState.markers.push(marker);
      } catch (error) {
        console.error('Error creating marker for property:', property.id, error);
      }
    } catch (mainError) {
      console.error('Error processing property:', property?.id || 'unknown', mainError);
    }
  });
  
  // If there are clusters of properties, you might want to add a clustering solution here
  // Mapbox GL JS has a built-in clustering feature that would be used instead
}

// Function to initialize a simple Three.js scene for property visualization
export function initThreeScene(container: HTMLDivElement, terrain: string = 'mountains'): THREE.Scene {
  // Create a new Three.js scene
  const scene = new THREE.Scene();
  
  // Create a camera
  const camera = new THREE.PerspectiveCamera(
    75, 
    container.clientWidth / container.clientHeight, 
    0.1, 
    1000
  );
  camera.position.z = 5;
  
  // Create a renderer with transparent background to overlay on the container
  const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true 
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);
  
  // Add terrain based on property type
  const terrainGeometry = createTerrainGeometry(terrain);
  const terrainMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x10b981,
    wireframe: false,
    roughness: 0.8,
    metalness: 0.2
  });
  const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
  scene.add(terrainMesh);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    terrainMesh.rotation.y += 0.001;
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
  });
  
  return scene;
}

// Helper function to create different terrain geometries
function createTerrainGeometry(type: string): THREE.BufferGeometry {
  // Create a plane geometry with different detail levels based on terrain type
  let geometry: THREE.PlaneGeometry;
  
  switch (type.toLowerCase()) {
    case 'mountains':
      geometry = new THREE.PlaneGeometry(10, 10, 64, 64);
      break;
    
    case 'waterfront':
      geometry = new THREE.PlaneGeometry(10, 10, 32, 32);
      break;
    
    case 'forest':
      geometry = new THREE.PlaneGeometry(10, 10, 48, 48);
      break;
    
    case 'farmland':
      geometry = new THREE.PlaneGeometry(10, 10, 16, 16);
      break;
    
    default:
      geometry = new THREE.PlaneGeometry(10, 10, 32, 32);
      break;
  }
  
  // Rotate the plane to be horizontal
  try {
    // Always use the manual rotation approach for compatibility
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      position.setY(i, 0);
      position.setZ(i, y);
    }
  } catch (e) {
    console.error('Error rotating geometry:', e);
  }
  
  // Add some terrain variation
  // Using the correct way to access position attributes in this THREE.js version
  const positionAttribute = geometry.attributes.position;
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    
    // Skip the edges
    if (Math.abs(x) < 4.8 && Math.abs(y) < 4.8) {
      // Add some height variation based on position and terrain type
      let height = 0;
      
      switch (type.toLowerCase()) {
        case 'mountains':
          height = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 1.0 + 
                   Math.random() * 0.3;
          break;
          
        case 'waterfront':
          height = Math.sin(x * 1.0) * 0.1 + 
                   Math.cos(y * 2.0) * 0.1 + 
                   Math.random() * 0.05;
          break;
          
        case 'forest':
          height = Math.sin(x * 0.8) * Math.sin(y * 0.8) * 0.4 + 
                   Math.random() * 0.1;
          break;
          
        case 'farmland':
          height = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.1 + 
                   Math.random() * 0.03;
          break;
          
        default:
          height = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.3 + 
                   Math.random() * 0.1;
      }
      
      positionAttribute.setZ(i, height);
    }
  }
  
  geometry.computeVertexNormals();
  return geometry;
}
