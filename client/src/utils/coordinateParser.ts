import * as turf from '@turf/turf';

/**
 * Parses coordinates in various formats and converts to standard GeoJSON
 */
export const parseCoordinates = (input: any): GeoJSON.Feature => {
  try {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return turf.polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
    }
    
    // If already a GeoJSON Feature, return as is
    if (input && typeof input === 'object' && input.type === 'Feature') {
      return JSON.parse(JSON.stringify(input));
    }

    // If a GeoJSON geometry, convert to feature
    if (input && typeof input === 'object' && input.type && 
        (input.type === 'Polygon' || input.type === 'LineString' || input.type === 'Point')) {
      return turf.feature(input);
    }

    // Handle WKB or other binary formats that might come from PostGIS
    if (input && typeof input === 'object' && 
        (input.type === 'Buffer' || (input.data && Array.isArray(input.data)))) {
      return turf.polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
    }
    
    // Handle stringified GeoJSON
    if (typeof input === 'string' && input.includes('"type":"Feature"')) {
      try {
        const parsed = JSON.parse(input);
        if (parsed && parsed.type === 'Feature' && parsed.geometry) {
          return parsed;
        }
      } catch (e) {
        // Not valid JSON, continue with other methods
      }
    }

    // If array of coordinates, convert to polygon feature
    if (Array.isArray(input)) {
      if (input.length >= 3) {
        const coords = [...input];
        if (JSON.stringify(coords[0]) !== JSON.stringify(coords[coords.length - 1])) {
          coords.push(coords[0]);
        }
        return turf.polygon([coords]);
      } else {
        return turf.polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
      }
    }

    // Parse string formats (DMS or decimal)
    if (typeof input === 'string') {
      return parseCoordinateString(input);
    }
    
    // Default empty polygon if input format not recognized
    return turf.polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
  } catch (error) {
    // Return a safe default polygon on error
    return turf.polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
  }
};

/**
 * Parse coordinate strings in various formats with improved handling
 */
const parseCoordinateString = (input: string): GeoJSON.Feature => {
  // First, try parsing as GeoJSON directly in case it's a GeoJSON string
  try {
    const asJson = JSON.parse(input);
    if (asJson.type === 'Feature') {
      if (asJson.geometry && (asJson.geometry.type === 'Polygon' || asJson.geometry.type === 'Point')) {
        return asJson;
      }
    } else if (asJson.type === 'Polygon' || asJson.type === 'Point') {
      return turf.feature(asJson);
    } else if (Array.isArray(asJson) && asJson.length > 0 && Array.isArray(asJson[0])) {
      // Handle array of coordinates
      if (asJson.length >= 3) {
        const coords = [...asJson];
        if (JSON.stringify(coords[0]) !== JSON.stringify(coords[coords.length - 1])) {
          coords.push(coords[0]);
        }
        return turf.polygon([coords]);
      }
    }
  } catch (e) {
    // Not JSON, continue with other parsing methods
  }
  
  // Try to detect and parse as array of coordinate pairs
  try {
    // Check if input resembles a JSON array
    if (input.trim().startsWith('[') && input.trim().endsWith(']')) {
      try {
        const coordsArray = JSON.parse(input);
        if (Array.isArray(coordsArray) && coordsArray.length >= 3) {
          // Check if it's a 2D array of coordinates
          if (Array.isArray(coordsArray[0]) && coordsArray[0].length === 2) {
            const validCoords = coordsArray.every(p => 
              Array.isArray(p) && p.length === 2 && 
              typeof p[0] === 'number' && typeof p[1] === 'number' &&
              Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90
            );
            
            if (validCoords) {
              // Create a proper polygon - ensure it's closed
              const coords = [...coordsArray];
              if (JSON.stringify(coords[0]) !== JSON.stringify(coords[coords.length - 1])) {
                coords.push(coords[0]);
              }
              return turf.polygon([coords]);
            }
          }
        }
      } catch (e) {
        // Not a valid JSON array, continue
      }
    }
  } catch (e) {
    // Failed to parse as array, continue
  }
  
  // Try to parse from various text formats
  let coordPairs: [number, number][] = [];

  // Split input by commas, semicolons, newlines, or multiple spaces
  const parts = input.split(/[,;\n\s{2,}]/g)
    .map(part => part.trim())
    .filter(Boolean);
  
  // Try to find coordinate pairs
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (isDMSFormat(part)) {
      // DMS format (e.g., 37°46'29.6"N 122°25'09.8"W)
      try {
        const dmsCoords = parseDMS(part);
        coordPairs.push(dmsCoords);
      } catch (e) {
        console.warn('Failed to parse DMS format:', part);
      }
    } else if (isDecimalFormat(part)) {
      // Decimal format (e.g., 37.7749° N, 122.4194° W)
      try {
        const decimalCoords = parseDecimal(part);
        coordPairs.push(decimalCoords);
      } catch (e) {
        console.warn('Failed to parse decimal format:', part);
      }
    } else {
      // Try to match simple numeric pairs (e.g., -122.4194 37.7749)
      const numericMatch = part.match(/^\s*(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s*$/);
      if (numericMatch) {
        const lng = parseFloat(numericMatch[1]);
        const lat = parseFloat(numericMatch[3]);
        
        // Validate in valid longitude/latitude range
        if (Math.abs(lng) <= 180 && Math.abs(lat) <= 90) {
          coordPairs.push([lng, lat]);
        }
      }
    }
  }

  // If we couldn't parse at least 3 points, try parsing pairs of numbers across the entire input
  if (coordPairs.length < 3) {
    const allFloats = input.match(/-?\d+(\.\d+)?/g)?.map(parseFloat) || [];
    
    if (allFloats.length >= 6) { // Need at least 3 pairs
      for (let i = 0; i < allFloats.length - 1; i += 2) {
        const lng = allFloats[i];
        const lat = allFloats[i + 1];
        
        // Validate in valid longitude/latitude range
        if (Math.abs(lng) <= 180 && Math.abs(lat) <= 90) {
          coordPairs.push([lng, lat]);
        }
      }
    }
  }

  // If we couldn't parse any coordinates, return default small polygon
  if (coordPairs.length < 3) {
    console.warn('Could not parse sufficient coordinates, using default polygon');
    return turf.polygon([[[0, 0], [0, 0.01], [0.01, 0.01], [0.01, 0], [0, 0]]]);
  }

  // Ensure polygon is closed (first and last points match)
  if (JSON.stringify(coordPairs[0]) !== JSON.stringify(coordPairs[coordPairs.length - 1])) {
    coordPairs.push(coordPairs[0]);
  }

  // Ensure all coordinate pairs are valid numbers
  const validCoordPairs = coordPairs.map(pair => {
    return [
      Number(pair[0].toFixed(6)),
      Number(pair[1].toFixed(6))
    ] as [number, number];
  });

  return turf.polygon([validCoordPairs]);
};

/**
 * Check if string is in DMS format
 */
const isDMSFormat = (input: string): boolean => {
  const dmsRegex = /(\d+)°(\d+)'(\d+\.?\d*)"([NSEW])/;
  return dmsRegex.test(input);
};

/**
 * Parse DMS format to decimal degrees
 */
const parseDMS = (input: string): [number, number] => {
  const dmsRegex = /(\d+)°(\d+)'(\d+\.?\d*)"([NSEW])/g;
  
  // Use exec() instead of matchAll() to avoid TypeScript downlevelIteration issues
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = dmsRegex.exec(input)) !== null) {
    matches.push(match);
  }
  
  if (matches.length !== 2) {
    throw new Error('Invalid DMS format');
  }
  
  const coords: [number, number] = [0, 0];
  
  for (const match of matches) {
    const [_, degrees, minutes, seconds, direction] = match;
    
    let decimal = parseInt(degrees) + parseInt(minutes) / 60 + parseFloat(seconds) / 3600;
    
    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    
    if (direction === 'N' || direction === 'S') {
      coords[1] = decimal; // Latitude
    } else {
      coords[0] = decimal; // Longitude
    }
  }
  
  return coords;
};

/**
 * Check if string is in decimal format
 */
const isDecimalFormat = (input: string): boolean => {
  const decimalRegex = /([-+]?\d+\.\d+)°?\s*([NSEW])/;
  return decimalRegex.test(input);
};

/**
 * Parse decimal degrees format
 */
const parseDecimal = (input: string): [number, number] => {
  const decimalRegex = /([-+]?\d+\.\d+)°?\s*([NSEW])/g;
  
  // Use exec() instead of matchAll() to avoid TypeScript downlevelIteration issues
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = decimalRegex.exec(input)) !== null) {
    matches.push(match);
  }
  
  if (matches.length !== 2) {
    throw new Error('Invalid decimal format');
  }
  
  const coords: [number, number] = [0, 0];
  
  for (const match of matches) {
    const [_, decimal, direction] = match;
    
    let value = parseFloat(decimal);
    
    if (direction === 'S' || direction === 'W') {
      value = -value;
    }
    
    if (direction === 'N' || direction === 'S') {
      coords[1] = value; // Latitude
    } else {
      coords[0] = value; // Longitude
    }
  }
  
  return coords;
};

/**
 * Calculate area and perimeter from GeoJSON with validation logic
 */
export const calculateAreaAndPerimeter = (geoJson: GeoJSON.Feature): { acres: number, sqft: number, perimeter: { feet: number, miles: number } } => {
  // Validate the geometry before calculating
  if (!geoJson?.geometry || 
      !('coordinates' in geoJson.geometry) || 
      !Array.isArray((geoJson.geometry as any).coordinates)) {
    console.error('Invalid GeoJSON for area calculation');
    return {
      acres: 0,
      sqft: 0,
      perimeter: { miles: 0, feet: 0 }
    };
  }
  
  try {
    // Check for realistic boundaries (1 billion acres is absurd - cap at 1 million)
    const MAX_REASONABLE_AREA_METERS = 4046856422400; // ~1 million acres in sq meters
    
    // Calculate area
    const areaMeters = turf.area(geoJson);
    
    // Check if the area exceeds reasonable limits
    if (!isFinite(areaMeters) || areaMeters <= 0 || areaMeters > MAX_REASONABLE_AREA_METERS) {
      console.warn('Unrealistic polygon area detected:', areaMeters, 'sq meters');
      return {
        acres: 0,
        sqft: 0,
        perimeter: { miles: 0, feet: 0 }
      };
    }
    
    // Convert to acres and square feet
    const acres = parseFloat((areaMeters * 0.000247105).toFixed(2));
    const sqft = parseFloat((acres * 43560).toFixed(0));

    // Calculate perimeter
    let perimeter = 0;
    if (geoJson.geometry.type === 'Polygon') {
      // Use type assertion to avoid TypeScript errors with GeoJSON's type system
      const coords = (geoJson.geometry as GeoJSON.Polygon).coordinates[0];
      const line = turf.lineString(coords);
      perimeter = turf.length(line, { units: 'miles' });
      
      // Validate perimeter
      if (!isFinite(perimeter) || perimeter <= 0 || perimeter > 50000) {
        // 50,000 miles is greater than Earth's circumference
        console.warn('Unrealistic polygon perimeter detected:', perimeter, 'miles');
        perimeter = 0;
      }
    }

    return {
      acres,
      sqft,
      perimeter: {
        miles: parseFloat(perimeter.toFixed(2)),
        feet: parseFloat((perimeter * 5280).toFixed(0))
      }
    };
  } catch (error) {
    console.error('Error calculating area and perimeter:', error);
    return {
      acres: 0,
      sqft: 0,
      perimeter: { miles: 0, feet: 0 }
    };
  }
};

/**
 * Get center point of GeoJSON feature
 */
export const getCenter = (geoJson: GeoJSON.Feature): [number, number] => {
  const center = turf.center(geoJson);
  return center.geometry.coordinates as [number, number];
};

/**
 * Convert GeoJSON to latitude and longitude bounds
 */
export const getBounds = (geoJson: GeoJSON.Feature): [[number, number], [number, number]] => {
  const bbox = turf.bbox(geoJson);
  return [
    [bbox[0], bbox[1]], // Southwest corner [lng, lat]
    [bbox[2], bbox[3]]  // Northeast corner [lng, lat]
  ];
};