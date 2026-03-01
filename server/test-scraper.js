/**
 * Test script for the universal property scraper system
 * 
 * This script demonstrates how to use the ScraperFactory to extract data from property listing URLs
 */

import axios from 'axios';
import fs from 'fs';
import { convert as htmlToText } from 'html-to-text';
import { startScraperService, stopScraperService } from './scraper_proxy.js';

// Test URLs for different property sites
const TEST_URLS = [
  // Replace these with actual URLs you want to test
  'https://www.landwatch.com/custer-county-colorado-land-for-sale/pid/412345678',
  'https://www.zillow.com/homedetails/123-main-st-anytown-st-12345/123456789_zpid/',
  'https://www.landflip.com/land/123456',
  'https://www.landsearch.com/properties/123456'
];

// Function to get a specific test URL from command line arguments
function getTestUrl() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    return args[0];
  }
  return null;
}

// Function to fetch HTML from a URL using our proxy service
async function fetchHtml(url) {
  console.log(`Fetching HTML from: ${url}`);
  
  try {
    // Check if scraper service is running
    await startScraperService();
    
    // Make the request using our scraper proxy
    const response = await axios.post('http://localhost:5001/api/scrape', {
      url,
      strategy: 'simple',
      options: {
        timeout: 30000,
        wait_for: 5000,
        max_retries: 2,
        rotate_user_agent: true,
        referrers: ['https://www.google.com/'],
        extra_headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        }
      },
      targeted: true
    });
    
    if (response.data.success) {
      return response.data.data.html;
    } else {
      throw new Error(response.data.error || 'Failed to fetch HTML');
    }
  } catch (error) {
    console.error('Error fetching HTML:', error.message);
    return null;
  }
}

// Function to extract data from HTML using our Python factory module
async function extractDataWithPython(html, url) {
  try {
    // Write HTML to a temporary file
    const tempFile = './temp-html.html';
    fs.writeFileSync(tempFile, html);
    
    // Run the Python script
    console.log('Extracting data using Python scraper factory...');
    
    // Placeholder for Python execution
    console.log('Python integration pending...');
    
    return null;
  } catch (error) {
    console.error('Error using Python extractor:', error.message);
    return null;
  }
}

// Function to extract data using our JavaScript factory
async function extractDataWithJS(html, url) {
  try {
    // Import the scraper factory
    const { extract_from_html } = await import('./scrapers/scraper_factory.py');
    
    // Extract data
    console.log('Extracting data using JavaScript scraper factory...');
    const result = extract_from_html(html, url);
    
    return result;
  } catch (error) {
    console.error('Error using JavaScript extractor:', error.message);
    return null;
  }
}

// Function to log the extraction result
function logResult(result) {
  if (!result) {
    console.log('No extraction result available.');
    return;
  }
  
  console.log('Extraction Result:');
  console.log('------------------');
  console.log(`Success: ${result.success}`);
  
  if (result.success) {
    const data = result.data;
    console.log(`Title: ${data.title}`);
    console.log(`Price: $${data.price}`);
    console.log(`Acreage: ${data.acreage} acres`);
    console.log(`Location: ${JSON.stringify(data.location)}`);
    console.log(`Property Type: ${data.property_type}`);
    console.log(`Extractor Used: ${data.extractor_used}`);
    console.log(`Number of Images: ${data.assets ? data.assets.length : 0}`);
    console.log(`Number of Features: ${data.features ? data.features.length : 0}`);
    
    // Log a preview of the description
    if (data.description) {
      const preview = data.description.substring(0, 100) + (data.description.length > 100 ? '...' : '');
      console.log(`Description: ${preview}`);
    }
  } else {
    console.log(`Error: ${result.error}`);
    console.log(`Extractor: ${result.extractor || 'unknown'}`);
  }
}

// Function to save extraction result to a file
function saveResult(result, url) {
  if (!result) {
    return;
  }
  
  try {
    // Create a filename based on the URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `./extraction-result-${domain}-${timestamp}.json`;
    
    // Save the result to a file
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));
    console.log(`Result saved to: ${filename}`);
  } catch (error) {
    console.error('Error saving result:', error.message);
  }
}

// Main function
async function main() {
  try {
    // Get test URL
    const testUrl = getTestUrl() || TEST_URLS[0];
    console.log(`Testing scraper with URL: ${testUrl}`);
    
    // Fetch HTML
    const html = await fetchHtml(testUrl);
    if (!html) {
      console.error('Failed to fetch HTML. Aborting test.');
      return;
    }
    
    // Save HTML to a file for debugging
    fs.writeFileSync('./last-fetched-html.html', html);
    console.log('HTML saved to ./last-fetched-html.html');
    
    // Create a text-only version for easier debugging
    const textContent = htmlToText(html, {
      wordwrap: 120,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' }
      ]
    });
    fs.writeFileSync('./last-fetched-text.txt', textContent);
    console.log('Text content saved to ./last-fetched-text.txt');
    
    // Try extraction with Python
    let result = await extractDataWithPython(html, testUrl);
    
    // Fall back to JS if Python extraction failed
    if (!result) {
      result = await extractDataWithJS(html, testUrl);
    }
    
    // Log and save the result
    logResult(result);
    saveResult(result, testUrl);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up
    stopScraperService();
  }
}

// Run the test
main().catch(console.error);