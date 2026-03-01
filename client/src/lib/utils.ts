import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price to a string with dollar sign and commas
 * @param price - The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number | string): string {
  if (typeof price === 'string') {
    price = parseFloat(price);
  }
  
  // Handle invalid inputs
  if (isNaN(price)) return '$0';
  
  // Format with dollar sign and commas
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Format acres to a string with commas
 * @param acres - The acreage to format
 * @returns Formatted acreage string
 */
export function formatAcres(acres: number | string): string {
  if (typeof acres === 'string') {
    acres = parseFloat(acres);
  }
  
  // Handle invalid inputs
  if (isNaN(acres)) return '0 acres';
  
  // Format with commas
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(acres) + ' acres';
}

/**
 * Optimize images that are loaded in components
 * Helps reduce network load by preloading first image, lazy loading others
 * 
 * @param images Array of image URLs
 * @param index Current image index
 * @returns Object with optimal loading attributes
 */
export function getOptimalImageLoadingProps(images: string[], index: number) {
  return {
    loading: index === 0 ? 'eager' : 'lazy', 
    decoding: 'async'
  } as const;
}

/**
 * Creates an optimized src URL for images
 * Adds resize parameters for external images when supported
 * 
 * @param url Original image URL
 * @param width Desired width (default: 600)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(url: string, width: number = 600): string {
  // Skip optimization for relative URLs and non-HTTP URLs
  if (!url || url.startsWith('/') || !url.startsWith('http')) {
    return url;
  }
  
  // Handle Unsplash images - they support resizing via URL params
  if (url.includes('unsplash.com')) {
    // Extract URL parts
    const urlObj = new URL(url);
    
    // Add or modify width parameter
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('auto', 'format');
    urlObj.searchParams.set('q', '80'); // Set quality to 80%
    
    return urlObj.toString();
  }
  
  // No optimization available for this URL
  return url;
}
