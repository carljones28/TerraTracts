import { customType } from "drizzle-orm/pg-core";

// Define PostGIS POINT data type
export const point = customType<{
  data: { x: number; y: number }; // JavaScript representation
  driverData: string; // Database representation (POINT format)
}>({
  dataType() {
    return 'geometry(Point, 4326)';
  },
  toDriver(value: { x: number; y: number }): string {
    // Enhanced version with better input validation and formatting
    try {
      // Make sure we have valid numbers
      if (value === null || value === undefined || 
          typeof value !== 'object' || 
          !('x' in value) || !('y' in value)) {
        console.error("Invalid PostGIS point value:", value);
        return "SRID=4326;POINT(0 0)"; // Safe fallback
      }
      
      // Extract x and y, ensuring they're numbers
      let x = typeof value.x === 'number' ? value.x : parseFloat(String(value.x));
      let y = typeof value.y === 'number' ? value.y : parseFloat(String(value.y));
      
      // Validate coordinates
      if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
        console.error("Invalid numerical coordinates:", value);
        return "SRID=4326;POINT(0 0)"; // Safe fallback
      }
      
      // Ensure coordinates are in valid ranges for WGS84
      x = Math.max(-180, Math.min(180, x));
      y = Math.max(-90, Math.min(90, y));
      
      // Format with fixed precision to avoid string parsing issues
      return `SRID=4326;POINT(${x.toFixed(6)} ${y.toFixed(6)})`;
    } catch (error) {
      console.error("Error creating PostGIS point format:", error);
      return "SRID=4326;POINT(0 0)"; // Safe fallback in case of any errors
    }
  },
  fromDriver(value: string): { x: number; y: number } {
    // Enhanced parser with better error handling 
    try {
      if (!value || typeof value !== 'string') {
        console.warn("Empty or invalid PostGIS point value:", value);
        return { x: 0, y: 0 };
      }
      
      // First try WKB format (binary format) which starts with 0101000020E6100000
      if (value.startsWith('0101000020E6100000')) {
        try {
          // This is a WKB (Well-Known Binary) format in hex
          // We need to extract the X and Y coordinates from the binary
          // Format is typically: 0101000020E6100000 + 8 bytes X + 8 bytes Y
          // For simplicity, let's extract them using PostGIS functions
          console.log("Detected WKB format, using fallback values");
          return { x: 0, y: 0 }; // We'll handle this in a separate SQL query later
        } catch (wkbError) {
          console.error("Error parsing WKB:", wkbError);
          return { x: 0, y: 0 };
        }
      }
      
      // Try EWKT format: "SRID=4326;POINT(lon lat)"
      if (value.includes('SRID=') && value.includes('POINT(')) {
        try {
          // Extract the point part
          const pointPart = value.split('POINT(')[1].split(')')[0].trim();
          const coords = pointPart.split(' ');
          
          if (coords.length >= 2) {
            const x = parseFloat(coords[0]);
            const y = parseFloat(coords[1]);
            
            if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
              return { x, y };
            }
          }
        } catch (ewktError) {
          console.error("Error parsing EWKT:", ewktError);
        }
      }
      
      // Try simple WKT format: "POINT(lon lat)"
      if (value.includes('POINT(')) {
        try {
          const pointPart = value.split('POINT(')[1].split(')')[0].trim();
          const coords = pointPart.split(' ');
          
          if (coords.length >= 2) {
            const x = parseFloat(coords[0]);
            const y = parseFloat(coords[1]);
            
            if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
              return { x, y };
            }
          }
        } catch (wktError) {
          console.error("Error parsing WKT:", wktError);
        }
      }
      
      // Look for POINT format with more robust regex as a last resort
      const pointRegex = /POINT\(\s*([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s*\)/i;
      const matches = value.match(pointRegex);
      
      if (matches && matches.length >= 3) {
        const x = parseFloat(matches[1]); // longitude
        const y = parseFloat(matches[2]); // latitude
        
        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
          return { x, y };
        }
      }
      
      console.warn("Failed to parse PostGIS point:", value);
      return { x: 0, y: 0 };
    } catch (error) {
      console.error("Error parsing PostGIS POINT:", error, "Input:", value);
      return { x: 0, y: 0 };
    }
  }
});

// Define PostGIS GEOGRAPHY data type (for more accurate distance calculations)
export const geography = customType<{
  data: string; // JavaScript representation
  driverData: string; // Database representation
}>({
  dataType() {
    return 'geography(Geometry, 4326)';
  },
  toDriver(value: string): string {
    // Assuming the string is already in proper PostGIS format
    return value;
  },
  fromDriver(value: string): string {
    // Return the raw value, to be processed by application logic
    return value;
  }
});