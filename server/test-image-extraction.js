/**
 * Test script for the enhanced image extraction capabilities
 * 
 * This script demonstrates how to use the enhanced image extraction module
 * to extract property images from various real estate listing websites.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { spawn } = require('child_process');

// Sample URLs to test
const TEST_URLS = [
  "https://www.landwatch.com/montana-land-for-sale/pid/412074896",
  "https://www.landflip.com/land-for-sale/21-acres-in-calaveras-county-california/286242",
  "https://www.zillow.com/homedetails/TBD-COUNTY-ROAD-22-Craig-CO-81625/2063676816_zpid/",
  "https://www.redfin.com/CO/Fairplay/000-County-Rd-14-80440/home/173067367",
  "https://www.trulia.com/property/5428324078-00-TBD-Vacant-Land-Baldwin-MI-49304"
];

// Function to fetch HTML content
async function fetchHTML(url) {
  try {
    console.log(`Fetching HTML from ${url}...`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000,
      maxContentLength: 10 * 1024 * 1024, // 10MB
    });
    
    console.log(`Successfully fetched HTML (${response.data.length} bytes)`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching HTML from ${url}:`, error.message);
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
    }
    return null;
  }
}

// Function to run the Python image extraction module
async function extractImages(html, url) {
  console.log('Testing image extraction with Python module...');
  
  // Create a temporary HTML file
  const tempHtmlFile = path.join(__dirname, 'temp-html.html');
  fs.writeFileSync(tempHtmlFile, html);
  
  // Create a Python script to run the extraction
  const scriptContent = `
import sys
import json
from bs4 import BeautifulSoup
from scrapers.image_extraction import extract_images

def main():
    with open('${tempHtmlFile.replace(/\\/g, '\\\\')}', 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    images = extract_images(soup, "${url}")
    
    print(json.dumps({
        "success": True,
        "images": images,
        "count": len(images)
    }))

if __name__ == "__main__":
    main()
  `;
  
  const tempPyFile = path.join(__dirname, 'temp-extract.py');
  fs.writeFileSync(tempPyFile, scriptContent);
  
  // Run the Python script
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [tempPyFile]);
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error(`Error: ${error}`);
        resolve({ success: false, error });
      } else {
        try {
          // Parse the JSON output
          const result = JSON.parse(output);
          resolve(result);
        } catch (err) {
          console.error('Error parsing Python output:', err.message);
          console.error('Output:', output);
          resolve({ success: false, error: err.message, output });
        }
      }
      
      // Clean up temp files
      try {
        fs.unlinkSync(tempHtmlFile);
        fs.unlinkSync(tempPyFile);
      } catch (err) {
        console.error('Error cleaning up temp files:', err.message);
      }
    });
  });
}

// Function to run the test
async function runTest(url) {
  console.log(`\n=== Testing extraction for ${url} ===\n`);
  
  // Fetch the HTML
  const html = await fetchHTML(url);
  if (!html) {
    console.error('Failed to fetch HTML. Skipping test.');
    return false;
  }
  
  // Save the HTML for debugging
  const debugDir = path.join(__dirname, 'debug');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }
  
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace('www.', '');
  const debugFileName = `${hostname}-${Date.now()}.html`;
  fs.writeFileSync(path.join(debugDir, debugFileName), html);
  
  // Extract images using our module
  const result = await extractImages(html, url);
  
  // Display results
  if (result.success) {
    console.log(`\nSuccessfully extracted ${result.count} images:`);
    
    // Group images by source
    const groupedBySource = {};
    result.images.forEach(img => {
      const source = img.source || 'unknown';
      groupedBySource[source] = groupedBySource[source] || [];
      groupedBySource[source].push(img);
    });
    
    // Display counts by source
    console.log('\nImages by source:');
    Object.entries(groupedBySource).forEach(([source, images]) => {
      console.log(`- ${source}: ${images.length} images`);
    });
    
    // Display sample images
    console.log('\nSample images:');
    result.images.slice(0, 5).forEach((img, i) => {
      console.log(`${i+1}. ${img.url.substring(0, 100)}${img.url.length > 100 ? '...' : ''} (${img.source})`);
    });
    
    // Save results to a file
    const resultsFileName = `${hostname}-results-${Date.now()}.json`;
    fs.writeFileSync(path.join(debugDir, resultsFileName), JSON.stringify(result, null, 2));
    console.log(`\nSaved full results to ${path.join(debugDir, resultsFileName)}`);
    
    return true;
  } else {
    console.error('Extraction failed:', result.error);
    return false;
  }
}

// Main function to run tests on all URLs
async function main() {
  const startTime = Date.now();
  console.log('=== Starting Image Extraction Tests ===');
  
  const results = {};
  let passCount = 0;
  let failCount = 0;
  
  for (const url of TEST_URLS) {
    const success = await runTest(url);
    results[url] = success;
    
    if (success) {
      passCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${TEST_URLS.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);
  
  // Display results for each URL
  console.log('\nDetailed results:');
  Object.entries(results).forEach(([url, success]) => {
    console.log(`${success ? '✓' : '✗'} ${url}`);
  });
}

// Check if a URL was provided as a command-line argument
const customUrl = process.argv[2];

if (customUrl) {
  // Test just the provided URL
  runTest(customUrl).catch(err => {
    console.error('Error running test:', err);
    process.exit(1);
  });
} else {
  // Run tests on all sample URLs
  main().catch(err => {
    console.error('Error running tests:', err);
    process.exit(1);
  });
}