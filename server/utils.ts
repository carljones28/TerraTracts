/**
 * Utility functions for the server
 */

import { PropertyCoordinates } from '../shared/types';

/**
 * Check if property coordinates are valid
 * @param coordinates The coordinates to check
 * @returns boolean indicating if coordinates are valid
 */
export function hasValidCoordinates(coordinates?: PropertyCoordinates): boolean {
  if (!coordinates) return false;
  
  const { latitude, longitude } = coordinates;
  
  // Check if values are numbers and within valid ranges
  return (
    typeof latitude === 'number' && 
    typeof longitude === 'number' &&
    !isNaN(latitude) && 
    !isNaN(longitude) &&
    latitude >= -90 && 
    latitude <= 90 &&
    longitude >= -180 && 
    longitude <= 180
  );
}