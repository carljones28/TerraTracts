/**
 * Proxy module for connecting to the Python-based property scraper service.
 */

import axios from 'axios';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Request, Response } from 'express';
import { promises as fs } from 'fs';

// Import our robust scraper launcher
import * as scraperLauncher from './python-scraper-launcher.js';

// Get the directory name (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SCRAPER_SERVICE_URL = scraperLauncher.SERVICE_URL;
let isPlaywrightSupported: boolean | null = null; // Null means we haven't checked yet
// Use scraperLauncher to check if the service is running
const isScraperRunning = () => scraperLauncher.isRunning();

/**
 * Check if Playwright is supported in the current environment
 */
async function checkPlaywrightSupport(): Promise<boolean> {
  if (isPlaywrightSupported !== null) {
    return isPlaywrightSupported === true;
  }
  
  console.log('Checking if Playwright is supported in this environment...');
  
  // In Replit environment, we know Playwright will not be supported
  // due to missing system dependencies, so shortcut this check
  if (typeof process.env.REPL_ID !== 'undefined' || typeof process.env.REPLIT !== 'undefined') {
    console.log('Running in Replit environment - Playwright is NOT supported');
    isPlaywrightSupported = false;
    return false;
  }
  
  try {
    // Ensure scraper service is running
    if (!isScraperRunning()) {
      const started = await startScraperService();
      if (!started) {
        console.error('Failed to start scraper service to check Playwright support');
        isPlaywrightSupported = false;
        return false;
      }
    }
    
    // Send a test request to check if Playwright works
    const response = await axios.post(`${SCRAPER_SERVICE_URL}/api/scrape`, {
      url: 'https://example.com',
      strategy: 'playwright',
      options: { timeout: 10000 },
      targeted: false
    });
    
    // Check for Playwright support
    if (
      response.data.success && 
      response.data.data && 
      response.data.data.error && 
      (
        response.data.data.error.includes('Host system is missing dependencies') ||
        response.data.data.error.includes('BrowserType.launch')
      )
    ) {
      console.log('Playwright is NOT supported in this environment');
      isPlaywrightSupported = false;
      return false;
    }
    
    console.log('Playwright IS supported in this environment');
    isPlaywrightSupported = true;
    return true;
  } catch (error) {
    console.error('Error checking Playwright support:', error);
    // In case of any error, assume Playwright is not supported to be safe
    console.log('Error during Playwright check - assuming NOT supported');
    isPlaywrightSupported = false;
    return false;
  }
}

/**
 * Start the Python scraper service if it's not already running
 * Uses the improved launcher module for better reliability
 */
export async function startScraperService(): Promise<boolean> {
  console.log('Starting scraper service using enhanced launcher...');
  
  try {
    // Use our robust launcher to start the service
    const success = await scraperLauncher.startScraperService();
    
    if (success) {
      console.log('Scraper service started successfully via launcher');
      
      // Check Playwright support on initial startup
      if (isPlaywrightSupported === null) {
        setTimeout(() => {
          checkPlaywrightSupport().then(supported => {
            console.log(`Playwright support check result: ${supported ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
          }).catch(error => {
            console.error('Error checking Playwright support during startup:', error);
          });
        }, 2000); // Delay to ensure service is fully ready
      }
    } else {
      console.error('Failed to start scraper service via launcher');
    }
    
    return success;
  } catch (error) {
    console.error('Error starting scraper service:', error);
    return false;
  }
}

/**
 * Stop the Python scraper service
 */
export function stopScraperService(): void {
  console.log('Stopping scraper service via launcher');
  scraperLauncher.stopScraperService();
}

/**
 * Express route handler for scraping property data
 */
export async function handleScrapeRequest(req: Request, res: Response): Promise<void> {
  try {
    // Extract URL and test mode flag from request
    const { url, test } = req.body;

    // Check if this is a test URL (either test mode is enabled or URL contains test patterns)
    const isTestMode = test === true || 
                      (url && (
                        url.toLowerCase().includes('test') || 
                        url.toLowerCase().includes('sample') || 
                        url.includes('demo') ||
                        url.includes('example.com') ||
                        url.includes('google.com/maps') || // Add Google Maps URLs to test mode
                        url.includes('maps.google.com')    // Also handle maps.google.com format
                      ));
    
    if (isTestMode) {
      console.log(`Test mode detected for URL: ${url}`);
    }
    
    // Make sure the scraper service is running
    if (!isScraperRunning()) {
      const started = await startScraperService();
      if (!started) {
        res.status(500).json({
          success: false,
          error: 'Failed to start scraper service'
        });
        return;
      }
    }

    // Forward the request to the Python scraper service
    const { strategy, options, targeted } = req.body;
    
    if (!url) {
      res.status(400).json({
        success: false,
        error: 'URL is required'
      });
      return;
    }

    // Check if we need to use Playwright
    let scraperStrategy = strategy;
    
    // If Playwright support hasn't been checked yet, check it now
    if (isPlaywrightSupported === null) {
      await checkPlaywrightSupport();
    }
    
    // Always use the simple extractor in Replit environment since it's more reliable
    console.log('Using Simple Extractor for more reliable scraping');
    scraperStrategy = 'simple';

    // Set longer timeout for Playwright scrapers
    const scrapingOptions = { ...options };
    
    // Add advanced scraping options regardless of scraper type
    scrapingOptions.timeout = 60000; // 60 seconds
    scrapingOptions.wait_for = 10000; // 10 seconds
    
    // Enable retry logic
    scrapingOptions.max_retries = 2;
    
    // Add randomized user agent rotation
    scrapingOptions.rotate_user_agent = true;
    
    // Add referrer spoofing for anti-bot protection
    scrapingOptions.referrers = [
      'https://www.google.com/',
      'https://www.bing.com/',
      'https://search.yahoo.com/',
      'https://duckduckgo.com/'
    ];
    
    // Add extra headers to avoid anti-scraping detection
    scrapingOptions.extra_headers = {
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };

    // Make the request to the Python service with retries
    let response;
    let maxRetries = 3;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Scraping attempt ${retryCount + 1} for ${url} using ${scraperStrategy} strategy`);
        
        // Add a random delay between retries to avoid overwhelming the server
        if (retryCount > 0) {
          const delay = 1000 + Math.random() * 2000; // 1-3 seconds
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        response = await axios.post(`${SCRAPER_SERVICE_URL}/api/scrape`, {
          url,
          strategy: scraperStrategy || 'html',
          options: {
            ...scrapingOptions,
            // Increase timeouts for retries
            timeout: scrapingOptions.timeout + (retryCount * 10000), // Add 10 seconds per retry
            wait_for: scrapingOptions.wait_for + (retryCount * 5000)  // Add 5 seconds per retry
          },
          targeted,
          test: isTestMode // Pass test mode flag to the Python server
        }, {
          // Add axios-level timeout that's slightly longer than the scraper timeout
          timeout: scrapingOptions.timeout + (retryCount * 10000) + 5000
        });
        
        // If we get a successful response, break out of the retry loop
        if (response.data && !response.data.error) {
          break;
        }
        
        // If the response contains an error related to missing browser dependencies,
        // mark Playwright as unsupported and switch strategy
        if (
          response.data.success && 
          response.data.data && 
          response.data.data.error && 
          (
            response.data.data.error.includes('Host system is missing dependencies') ||
            response.data.data.error.includes('BrowserType.launch')
          )
        ) {
          console.log('Playwright is not supported in this environment. Switching to simple scraper.');
          
          // Mark Playwright as unsupported for future requests
          isPlaywrightSupported = false;
          scraperStrategy = 'simple';
          
          // This doesn't count as a retry, just a strategy change
          continue;
        }
        
        // If we have errors but got a response, increment retry count
        retryCount++;
        
      } catch (scrapingError: any) {
        lastError = scrapingError;
        retryCount++;
        
        // Log specific error information
        if (scrapingError.code === 'ECONNRESET') {
          console.log(`Connection reset error on attempt ${retryCount}. Retrying...`);
        } else if (scrapingError.code === 'ECONNREFUSED') {
          console.log(`Connection refused error on attempt ${retryCount}. Service may not be running.`);
          
          // Try to restart the scraper service
          console.log('Attempting to restart scraper service...');
          await startScraperService();
        } else if (scrapingError.code === 'ETIMEDOUT') {
          console.log(`Timeout error on attempt ${retryCount}. Retrying with longer timeout...`);
        } else {
          console.log(`Error on attempt ${retryCount}: ${scrapingError.message}`);
        }
        
        // If Playwright seems to be the problem, switch strategies
        if (scraperStrategy === 'playwright' && 
            (scrapingError.message?.includes('Host system is missing dependencies') || 
             scrapingError.message?.includes('BrowserType.launch'))) {
          console.log('Switching from Playwright to simple scraper strategy');
          isPlaywrightSupported = false;
          scraperStrategy = 'simple';
        }
        
        // If we've exhausted our retries, try one last time with the simple strategy
        if (retryCount >= maxRetries && scraperStrategy !== 'simple') {
          console.log('Final attempt using simple scraper strategy');
          scraperStrategy = 'simple';
          retryCount = maxRetries - 1; // Give one more try
        }
      }
    }
    
    // If we've exhausted all retries and still don't have a response
    if (!response && lastError) {
      console.error('All scraping attempts failed:', lastError.message);
      throw new Error(`Failed to scrape ${url} after ${maxRetries} attempts: ${lastError.message}`);
    }

    // Check if we have a valid response before returning
    if (!response) {
      throw new Error(`No valid response after ${maxRetries} attempts`);
    }

    // Return the result
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in scraper proxy:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scrape property data'
    });
  }
}

/**
 * Express route handler for listing available scrapers
 */
export async function handleListScrapers(req: Request, res: Response): Promise<void> {
  try {
    // Make sure the scraper service is running
    if (!isScraperRunning()) {
      const started = await startScraperService();
      if (!started) {
        // If the scraper service fails to start, fall back to the default list
        console.log('Scraper service failed to start, using default scraper list');
        provideDefaultScraperList(res);
        return;
      }
    }

    try {
      // Get the list of scrapers from the Python service
      const response = await axios.get(`${SCRAPER_SERVICE_URL}/api/scrapers`);
      res.json(response.data);
    } catch (error) {
      // If the Python service is running but fails to return scrapers,
      // fall back to the default list
      console.error('Python scraper service error:', error instanceof Error ? error.message : 'Unknown error');
      provideDefaultScraperList(res);
    }
  } catch (error: any) {
    console.error('Error listing scrapers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list scrapers'
    });
  }
}

/**
 * Provides a default list of supported scrapers when the Python service is unavailable
 */
function provideDefaultScraperList(res: Response): void {
  // Comprehensive list of supported property listing sites
  const supportedSites = [
    { domain: 'zillow.com', name: 'Zillow', supported: true, confidence: 0.8 },
    { domain: 'trulia.com', name: 'Trulia', supported: true, confidence: 0.8 },
    { domain: 'realtor.com', name: 'Realtor.com', supported: true, confidence: 0.8 },
    { domain: 'redfin.com', name: 'Redfin', supported: true, confidence: 0.8 },
    { domain: 'landwatch.com', name: 'LandWatch', supported: true, confidence: 0.9 },
    { domain: 'land.com', name: 'Land.com', supported: true, confidence: 0.9 },
    { domain: 'landandfarm.com', name: 'Land and Farm', supported: true, confidence: 0.9 },
    { domain: 'landflip.com', name: 'LandFlip', supported: true, confidence: 0.95 },
    { domain: 'landsearch.com', name: 'LandSearch', supported: true, confidence: 0.95 },
    { domain: 'landsofamerica.com', name: 'Lands of America', supported: true, confidence: 0.8 },
    { domain: 'landcentury.com', name: 'Land Century', supported: true, confidence: 0.8 },
    { domain: 'landleader.com', name: 'Land Leader', supported: true, confidence: 0.7 },
    { domain: 'landpin.com', name: 'LandPin', supported: true, confidence: 0.7 },
    { domain: 'landnet.com', name: 'LandNet', supported: true, confidence: 0.7 },
    { domain: 'farmandranch.com', name: 'Farm & Ranch', supported: true, confidence: 0.7 },
    { domain: 'loopnet.com', name: 'LoopNet', supported: true, confidence: 0.6 }
  ];
  
  res.json({
    success: true,
    scrapers: supportedSites,
    source: 'default_list',
    note: 'Using built-in scraper list as Python service is unavailable'
  });
}

/**
 * Convert the scraper response into the format expected by the property importer component
 */
export function convertScraperResponseToPropertyData(scraperResponse: any): any {
  if (!scraperResponse.success || !scraperResponse.data) {
    return null;
  }

  const data = scraperResponse.data;
  
  // Extract metadata about the extraction
  const extractorUsed = data.extractor_used || scraperResponse.strategy_used || 'unknown';
  
  // Convert coordinates from object to array [longitude, latitude]
  let coordinates: [number, number] = [0, 0];
  
  // First try coordinates_array which is in the right format
  if (data.coordinates_array && Array.isArray(data.coordinates_array) && data.coordinates_array.length === 2) {
    coordinates = data.coordinates_array as [number, number];
  }
  // Then fallback to the coordinates object
  else if (data.coordinates && 'longitude' in data.coordinates && 'latitude' in data.coordinates) {
    coordinates = [data.coordinates.longitude, data.coordinates.latitude];
  }
  
  // Combine location info
  let location = '';
  if (data.location) {
    // First try address field which should already be formatted
    if (data.location.address) {
      location = data.location.address;
    } else {
      // Combine parts
      const parts = [];
      if (data.location.city) parts.push(data.location.city);
      if (data.location.county) parts.push(data.location.county);
      if (data.location.state) parts.push(data.location.state);
      if (parts.length > 0) {
        location = parts.join(', ');
      }
    }
  }
  
  // Process features
  let features: string[] = [];
  
  if (data.features && Array.isArray(data.features)) {
    features = data.features.map((f: any) => {
      if (typeof f === 'string') {
        return f;
      } else if (typeof f === 'object') {
        if (f.value === true || f.value === 'true') {
          // For boolean features, just use the name
          return f.name || '';
        } else if (f.name && f.value) {
          // For key-value features, combine them
          return `${f.name}: ${f.value}`;
        } else {
          // Fallback - just use whatever is available
          return f.name || f.value || '';
        }
      }
      return '';
    }).filter((f: string) => f.length > 0); // Remove empty features
  }
  
  // Process assets with robust error handling
  let assets = [];
  
  try {
    // Ensure data.assets is an array
    if (data.assets && Array.isArray(data.assets)) {
      // Filter out any invalid assets
      const validAssets = data.assets.filter((a: any) => a && a.url);
      
      assets = validAssets.map((a: any, i: number) => {
        // Ensure URLs are fully formed
        const url = a.url || '';
        const thumbnail = a.thumbnail || a.url || '';
        
        return {
          id: a.id || `asset-${i+1}`,
          type: a.type || 'image',
          url: url,
          thumbnail: thumbnail,
          title: a.title || `Property Image ${i+1}`,
          description: a.description || 'Property image from listing',
          selected: typeof a.selected === 'boolean' ? a.selected : i === 0
        };
      });
      
      // If we have assets but none are selected, select the first one
      if (assets.length > 0 && !assets.some((a: any) => a.selected)) {
        assets[0].selected = true;
      }
    }
  } catch (error) {
    console.error('Error processing assets:', error);
  }
  
  // Process documents (if available)
  let documents = [];
  try {
    if (data.documents && Array.isArray(data.documents)) {
      documents = data.documents.filter((d: any) => d && d.url).map((d: any, i: number) => {
        return {
          id: d.id || `document-${i+1}`,
          name: d.name || `Document ${i+1}`,
          url: d.url,
          type: d.type || 'application/pdf',
          description: d.description || '',
          size: d.size || 0,
          uploadDate: d.uploadDate || new Date().toISOString()
        };
      });
    }
  } catch (error) {
    console.error('Error processing documents:', error);
  }
  
  // Extract terrain info
  let terrainType = '';
  if (data.terrain) {
    terrainType = data.terrain;
  } else if (features.length > 0) {
    // Look for terrain info in features
    const terrainFeature = features.find((f: string) => 
      f.toLowerCase().includes('terrain') || 
      f.toLowerCase().includes('topography')
    );
    if (terrainFeature) {
      const parts = terrainFeature.split(':');
      if (parts.length > 1) {
        terrainType = parts[1].trim();
      } else {
        terrainType = terrainFeature;
      }
    }
  }
  
  // Convert to the format expected by the property importer
  return {
    title: data.title || '',
    description: data.description || '',
    price: data.price || 0,
    acreage: data.acreage || 0,
    size: data.acreage || 0,  // For compatibility with both formats
    location: location || '',
    state: data.state || '',
    coordinates: coordinates,
    propertyType: data.property_type || 'land',
    features: features,
    assets: assets,
    documents: documents,
    terrainType: terrainType,
    sourceUrl: data.source_url || '',
    sourceDomain: data.source_domain || '',
    confidenceMetrics: data.confidence_metrics || {},
    extractorDetails: {
      extractor: extractorUsed,
      confidence: data.confidence_metrics?.overall_score || 0.5,
      extractionTime: new Date().toISOString()
    }
  };
}