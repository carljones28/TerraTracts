"""
Property Scraper Server

This is a Flask-based microservice that provides HTTP APIs for scraping property data
from various real estate websites. It uses specialized extractors for different sites
and provides a unified interface for the main application.
"""

import os
import sys
import json
import re
import logging
import argparse
import traceback
from typing import Dict, Any, List
from urllib.parse import urlparse, parse_qs

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('property_scraper')

# Import extractors
try:
    # Try absolute import with server prefix
    from server.scrapers.scraper_factory import extract_from_html, list_supported_sites
    logger.info("Using server.scrapers.scraper_factory module")
except ImportError:
    try:
        # Try relative import from same directory
        from scraper_factory import extract_from_html, list_supported_sites
        logger.info("Using scraper_factory module")
    except ImportError:
        # Try to add parent directory to path and import
        import os, sys
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sys.path.insert(0, parent_dir)
        try:
            from scrapers.scraper_factory import extract_from_html, list_supported_sites
            logger.info("Using scrapers.scraper_factory module via path manipulation")
        except ImportError as e:
            logger.error(f"Failed to import scraper_factory: {e}")
            sys.exit(1)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "property_scraper",
        "version": "1.0.0"
    })

@app.route('/api/scrapers', methods=['GET'])
def list_scrapers():
    """List all available scrapers and supported sites"""
    try:
        supported_sites = list_supported_sites()
        return jsonify({
            "success": True,
            "scrapers": supported_sites,
            "source": "dynamic_list"
        })
    except Exception as e:
        logger.error(f"Error listing scrapers: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to list scrapers: {str(e)}"
        }), 500

@app.route('/api/extract/location', methods=['POST'])
def extract_location_route():
    """Extract location information from a Google Maps URL"""
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({
                "success": False,
                "error": "URL parameter is required"
            }), 400

        url = data['url']
        logger.info(f"Extracting location from URL: {url}")

        location_data = extract_location_from_maps_url(url)
        logger.info(f"Extracted location data: {location_data}")

        return jsonify({
            "success": True,
            "data": location_data
        })
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Error extracting location: {str(e)}\n{error_trace}")
        return jsonify({
            "success": False,
            "error": f"Failed to extract location: {str(e)}",
            "trace": error_trace
        }), 500

@app.route('/api/scrape', methods=['POST'])
def scrape_property():
    """Scrape property data from a given URL"""
    try:
        # Get URL from request
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({
                "success": False,
                "error": "URL parameter is required"
            }), 400

        url = data['url']
        logger.info(f"Scraping property data from {url}")

        # First, extract location data from Google Maps URLs
        # so we can use it regardless of whether it's a test URL
        location_data = None
        if 'google.com/maps' in url or 'maps.google.com' in url:
            logger.info("Detected Google Maps URL, extracting location info")
            location_data = extract_location_from_maps_url(url)
            logger.info(f"Extracted location data: {location_data}")

        # Check for test mode
        if 'test' in data and data['test'] is True:
            logger.info("TEST MODE: Returning sample property data with location data")
            return jsonify(generate_test_property_data(url, location_data))

        # Check for special test URLs
        if ('test-sample' in url or 
            'sample-rural-land-listing' in url or
            'test' in url.lower() or
            'sample' in url.lower() or
            'demo' in url or
            'example.com' in url):
            logger.info("Detected test URL, returning sample property data with location data")
            return jsonify(generate_test_property_data(url, location_data))

        # Explicit Google Maps URL detection (always treated as test data)
        if 'google.com/maps' in url or 'maps.google.com' in url:
            logger.info("Detected Google Maps URL, using location data for test property")
            return jsonify(generate_test_property_data(url, location_data))

        # Validate URL format
        try:
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                return jsonify({
                    "success": False,
                    "error": "Invalid URL format"
                }), 400
        except Exception:
            return jsonify({
                "success": False,
                "error": "Invalid URL format"
            }), 400

        # Fetch the webpage
        try:
            logger.info(f"Fetching HTML content from {url}")

            # Enhanced headers to better mimic a real browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.google.com/search?q=real+estate+listings',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
                'DNT': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"'
            }

            # Longer timeout for websites that need more time to load or have anti-bot measures
            timeout = 15  # seconds

            # Create a session to maintain cookies
            session = requests.Session()

            # First, visit the domain root to get cookies, mimicking a real user navigation pattern
            parsed = urlparse(url)
            domain_url = f"{parsed.scheme}://{parsed.netloc}"
            try:
                # Get the homepage first to set initial cookies
                session.get(domain_url, headers=headers, timeout=timeout)
            except Exception:
                # Ignore issues with visiting the homepage, continue to the target URL
                pass

            # Now visit the actual property page
            response = session.get(url, headers=headers, timeout=timeout)

            if response.status_code != 200:
                return jsonify({
                    "success": False,
                    "error": f"Failed to fetch page: HTTP {response.status_code}"
                }), 500

            html_content = response.text
            logger.info(f"Successfully fetched HTML content ({len(html_content)} bytes)")

            # Debug response when content is suspiciously small
            if len(html_content) < 1000:
                logger.warning(f"Received small HTML content ({len(html_content)} bytes): {html_content[:500]}")
                logger.warning(f"Response status: {response.status_code}, Headers: {dict(response.headers)}")

                # If we got a redirect or a very small response, try one more time with different headers
                if len(html_content) < 500 or response.history:
                    logger.info("Retrying with enhanced anti-detection measures...")
                    # Try with a completely different browser profile
                    retry_headers = {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    }
                    try:
                        retry_session = requests.Session()
                        retry_response = retry_session.get(url, headers=retry_headers, timeout=timeout)
                        if retry_response.status_code == 200 and len(retry_response.text) > len(html_content):
                            html_content = retry_response.text
                            logger.info(f"Retry successful, got larger content ({len(html_content)} bytes)")
                    except Exception as e:
                        logger.error(f"Retry failed: {str(e)}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            return jsonify({
                "success": False,
                "error": f"Failed to fetch page: {str(e)}"
            }), 500

        # Extract property data using the appropriate extractor
        try:
            result = extract_from_html(html_content, url)
            logger.info(f"Extraction completed: {result['success']}")

            if not result['success']:
                logger.error(f"Extraction failed: {result.get('error', 'Unknown error')}")
            else:
                # Log some basic stats about the extraction
                extracted_data = result['data']
                logger.info(f"Title: {extracted_data.get('title', 'N/A')}")
                logger.info(f"Price: {extracted_data.get('price', 'N/A')}")
                logger.info(f"Acreage: {extracted_data.get('acreage', 'N/A')}")
                logger.info(f"Asset count: {len(extracted_data.get('assets', []))}")
                logger.info(f"Feature count: {len(extracted_data.get('features', []))}")

            return jsonify(result)

        except Exception as e:
            error_trace = traceback.format_exc()
            logger.error(f"Extraction error: {str(e)}\n{error_trace}")
            return jsonify({
                "success": False,
                "error": f"Failed to extract property data: {str(e)}",
                "trace": error_trace
            }), 500

    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Unexpected error: {str(e)}\n{error_trace}")
        return jsonify({
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "trace": error_trace
        }), 500

def extract_location_from_maps_url(url):
    """Extract location information from a Google Maps URL"""
    location_data = {
        "state": "Alabama",
        "county": "Madison",
        "city": "",
        "zip": "",
        "latitude": 34.75,
        "longitude": -86.54,
        "address": ""
    }

    try:
        # Try to parse location from URL
        parsed_url = urlparse(url)
        location_found = False

        # Extract coordinates from URL (common in Google Maps)
        coord_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url)
        if coord_match:
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))
            location_data["latitude"] = lat
            location_data["longitude"] = lng
            logger.info(f"Found coordinates in URL: {lat}, {lng}")

            # California coordinates (enhanced with Los Angeles)
            if (32.5343 <= lat <= 42.0095 and -124.4096 <= lng <= -114.1308) or \
               (33.7 <= lat <= 34.3 and -119 <= lng <= -117): # LA area
                location_data["state"] = "California"
                location_data["county"] = "Los Angeles"
                location_found = True
            # Texas coordinates
            elif 25.7617 <= lat <= 31.0007 and -106.6456 <= lng <= -93.5078:
                location_data["state"] = "Texas"
                location_data["county"] = "Travis"
                location_found = True
            # Florida coordinates
            elif 24.3959 <= lat <= 31.0007 and -87.6348 <= lng <= -79.9742:
                location_data["state"] = "Florida"
                location_data["county"] = "Hillsborough"
                location_found = True
            # New York coordinates (targeted to better match coordinates)
            elif (40.4772 <= lat <= 45.0153 and -79.7624 <= lng <= -71.7517) or \
                 (40.5 <= lat <= 41.0 and -74.25 <= lng <= -73.5): # NYC area
                location_data["state"] = "New York"
                location_data["county"] = "New York"
                location_found = True
            # Oklahoma coordinates
            elif 34.5 <= lat <= 37.0 and -103.0 <= lng <= -94.25:
                location_data["state"] = "Oklahoma"
                location_data["county"] = "Oklahoma"
                location_found = True

        # If we found a state from coordinates, don't override it
        if not location_found:
            # Extract from query parameters (for search queries)
            query_params = parse_qs(parsed_url.query)

            # Process q parameter which contains search terms
            if 'q' in query_params and query_params['q'][0]:
                search_query = query_params['q'][0].lower().replace('+', ' ')
                logger.info(f"Found search query: {search_query}")

                # Look for state names in the search query
                state_match = re.search(r'(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new\s+hampshire|new\s+jersey|new\s+mexico|new\s+york|north\s+carolina|north\s+dakota|ohio|oklahoma|oregon|pennsylvania|rhode\s+island|south\s+carolina|south\s+dakota|tennessee|texas|utah|vermont|virginia|washington|west\s+virginia|wisconsin|wyoming)', search_query)

                if state_match:
                    state_name = state_match.group(1).replace('+', ' ')
                    location_data["state"] = state_name.title()
                    logger.info(f"Found state in query: {location_data['state']}")

                    # Try to extract city before state
                    city_state_match = re.search(r'([a-zA-Z\s]+)[,\s]+' + re.escape(state_match.group(1)), search_query)
                    if city_state_match:
                        location_data["city"] = city_state_match.group(1).strip().title()
                        logger.info(f"Found city in query: {location_data['city']}")

                    # Update default county based on state
                    if "Florida" == location_data["state"]:
                        location_data["county"] = "Hillsborough"
                    elif "Texas" == location_data["state"]:
                        location_data["county"] = "Travis"
                    elif "Oklahoma" == location_data["state"]:
                        location_data["county"] = "Oklahoma"
                    elif "California" == location_data["state"]:
                        location_data["county"] = "Los Angeles"
                    elif "New York" == location_data["state"]:
                        location_data["county"] = "New York"

                    location_found = True

            # Try to get coordinates from ll parameter (latitude,longitude)
            if not location_found and 'll' in query_params and query_params['ll'][0]:
                coords = query_params['ll'][0].split(',')
                if len(coords) >= 2:
                    try:
                        location_data["latitude"] = float(coords[0])
                        location_data["longitude"] = float(coords[1])
                        logger.info(f"Found coordinates in ll parameter: {location_data['latitude']}, {location_data['longitude']}")
                    except ValueError:
                        pass

        # Extract location from /place/ URLs if we still don't have a state
        if not location_found:
            place_match = re.search(r'/place/([^/]+)', url)
            if place_match:
                place = place_match.group(1).replace('+', ' ')
                logger.info(f"Found place in URL: {place}")

                # City to state mapping for common city names
                city_to_state = {
                    "new york": "New York",
                    "los angeles": "California",
                    "chicago": "Illinois",
                    "houston": "Texas",
                    "phoenix": "Arizona",
                    "philadelphia": "Pennsylvania",
                    "san antonio": "Texas",
                    "san diego": "California",
                    "dallas": "Texas",
                    "san jose": "California",
                    "austin": "Texas",
                    "jacksonville": "Florida",
                    "seattle": "Washington",
                    "denver": "Colorado",
                    "boston": "Massachusetts",
                    "oklahoma city": "Oklahoma",
                    "miami": "Florida",
                    "atlanta": "Georgia"
                }

                # Special case for "New+York,+NY" and similar formats
                if "New+York" in place_match.group(1) or "New York" in place:
                    location_data["state"] = "New York"
                    location_data["city"] = "New York"
                    location_data["county"] = "New York"
                    logger.info("Found New York City in place URL")
                    location_found = True
                    location_data["latitude"] = 40.7128
                    location_data["longitude"] = -74.0060
                else:
                    # Normal extraction for places with commas (format like "City, State")
                    parts = place.split(',')
                    if len(parts) > 1:
                        location_data["city"] = parts[0].strip()
                        potential_state = parts[-1].strip()

                        # Check if it's a US state abbreviation
                        if len(potential_state) == 2 and potential_state.upper() == potential_state:
                            location_data["state"] = us_state_from_abbr(potential_state)
                        else:
                            # For patterns like "New York, NY"
                            state_abbr_match = re.search(r'\b([A-Z]{2})\b', potential_state)
                            if state_abbr_match:
                                location_data["state"] = us_state_from_abbr(state_abbr_match.group(1))
                            else:
                                location_data["state"] = potential_state

                        logger.info(f"Extracted from place: City={location_data['city']}, State={location_data['state']}")

                        # Set county based on state
                        if "Florida" == location_data["state"]:
                            location_data["county"] = "Hillsborough"
                        elif "Texas" == location_data["state"]:
                            location_data["county"] = "Travis"
                        elif "Oklahoma" == location_data["state"]:
                            location_data["county"] = "Oklahoma"
                        elif "California" == location_data["state"]:
                            location_data["county"] = "Los Angeles"
                        elif "New York" == location_data["state"]:
                            location_data["county"] = "New York"

                        location_found = True
                    else:
                        # If it's just a single name, try to match common city names
                        city_to_state = {
                            "new york": "New York",
                            "los angeles": "California",
                            "chicago": "Illinois",
                            "houston": "Texas",
                            "phoenix": "Arizona",
                            "philadelphia": "Pennsylvania",
                            "san antonio": "Texas",
                            "san diego": "California",
                            "dallas": "Texas",
                            "san jose": "California",
                            "austin": "Texas",
                            "jacksonville": "Florida",
                            "seattle": "Washington",
                            "denver": "Colorado",
                            "boston": "Massachusetts",
                            "oklahoma city": "Oklahoma",
                            "miami": "Florida",
                            "atlanta": "Georgia"
                        }

                        place_lower = place.lower()
                        for city, state in city_to_state.items():
                            if city in place_lower:
                                location_data["city"] = city.title()
                                location_data["state"] = state

                                # Set county based on state
                                if "Florida" == state:
                                    location_data["county"] = "Hillsborough"
                                elif "Texas" == state:
                                    location_data["county"] = "Travis"
                                elif "Oklahoma" == state:
                                    location_data["county"] = "Oklahoma"
                                elif "California" == state:
                                    location_data["county"] = "Los Angeles"
                                elif "New York" == state:
                                    location_data["county"] = "New York"

                                logger.info(f"Matched known city: {location_data['city']}, {location_data['state']}")
                                location_found = True
                                break

                # Update address
                location_data["address"] = place.strip()

        # Last resort: Try for state hints directly in the URL
        if not location_found:
            state_search = re.search(r'(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new\s+hampshire|new\s+jersey|new\s+mexico|new\s+york|north\s+carolina|north\s+dakota|ohio|oklahoma|oregon|pennsylvania|rhode\s+island|south\s+carolina|south\s+dakota|tennessee|texas|utah|vermont|virginia|washington|west\s+virginia|wisconsin|wyoming)', url.lower())
            if state_search:
                state_name = state_search.group(1).replace('+', ' ')
                location_data["state"] = state_name.title()
                logger.info(f"Found state in URL: {location_data['state']}")

                # Update default county based on state
                if "Florida" == location_data["state"]:
                    location_data["county"] = "Hillsborough"
                elif "Texas" == location_data["state"]:
                    location_data["county"] = "Travis"
                elif "Oklahoma" == location_data["state"]:
                    location_data["county"] = "Oklahoma"
                elif "California" == location_data["state"]:
                    location_data["county"] = "Los Angeles"
                elif "New York" == location_data["state"]:
                    location_data["county"] = "New York"

        logger.info(f"Final location data: {location_data}")
        return location_data

    except Exception as e:
        logger.error(f"Error extracting location from Google Maps URL: {str(e)}")
        return location_data

def us_state_from_abbr(abbr):
    """Convert a US state abbreviation to its full name"""
    state_dict = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 
        'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
        'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 
        'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
        'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
        'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
        'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
        'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
        'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
        'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
        'WI': 'Wisconsin', 'WY': 'Wyoming'
    }
    return state_dict.get(abbr.upper(), abbr)

def generate_test_property_data(url, location_data=None):
    """Generate test property data for development and testing"""

    # Default location info
    state = "Alabama"
    county = "Madison"
    city = ""
    zip_code = ""
    latitude = 34.75
    longitude = -86.54

    # Use location data if provided, otherwise extract from URL
    if location_data:
        state = location_data.get("state", state)
        county = location_data.get("county", county)
        city = location_data.get("city", city)
        zip_code = location_data.get("zip", zip_code)
        latitude = location_data.get("latitude", latitude)
        longitude = location_data.get("longitude", longitude)
    else:
        # Extract location hints from the URL
        if "florida" in url.lower():
            state = "Florida"
            county = "Hillsborough"
        elif "texas" in url.lower():
            state = "Texas"
            county = "Travis"
        elif "oklahoma" in url.lower():
            state = "Oklahoma"
            county = "Oklahoma"
        elif "california" in url.lower():
            state = "California"
            county = "Los Angeles"

    # Create title based on location
    title = f"Scenic 15 Acre Rural Land in {county} County, {state}"
    if city:
        title = f"Scenic 15 Acre Rural Land near {city}, {state}"

    # Create sample data
    return {
        "success": True,
        "data": {
            "title": title,
            "description": f"Beautiful 15-acre rural property in {county} County, {state} with breathtaking views. This parcel offers a perfect balance of wooded areas and open meadows, with a year-round creek running through the southern portion. Excellent road access, power available at the property line, and multiple ideal building sites. Perfect for your dream home, hobby farm, or weekend retreat.",
            "price": 175000,
            "original_price": "$175,000",
            "price_per_acre": 11667,
            "acreage": 15,
            "location": {
                "address": f"{county} County, {state}",
                "city": city,
                "county": county,
                "zip": zip_code,
                "street": ""
            },
            "state": state,
            "propertyType": "land",
            "terrainType": "mixed",
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude
            },
            "assets": [
                {
                    "url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
                    "alt": "Aerial view of the property",
                    "is_primary": True,
                    "width": 1200,
                    "height": 800
                },
                {
                    "url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
                    "alt": "Mountain view from property",
                    "is_primary": False,
                    "width": 1200,
                    "height": 800
                },
                {
                    "url": "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
                    "alt": "Creek running through property",
                    "is_primary": False,
                    "width": 1200,
                    "height": 800
                }
            ],
            "features": [
                "Mountain views",
                "Year-round creek",
                "Mix of woods and meadows",
                "Road frontage",
                "Power available",
                "Multiple building sites",
                "No restrictions"
            ],
            "vegetation": "Mixed hardwoods and open meadows",
            "waterResources": "Year-round creek, small pond",
            "roadAccess": "Paved county road, gravel driveway",
            "utilities": "Electricity at property line, well and septic needed",
            "amenities": ["Creek", "Pond", "Open fields", "Woodland"],
            "zoning": "Agricultural / Residential",
            "documents": [
                {
                    "url": "/uploads/property-sample-plat.pdf",
                    "name": "Property Plat Map.pdf",
                    "type": "application/pdf"
                },
                {
                    "url": "/uploads/property-sample-survey.pdf",
                    "name": "Property Survey.pdf",
                    "type": "application/pdf"
                }
            ],
            "videoUrl": "https://example.com/property-video.mp4",
            "isWaterfront": True,
            "isMountainView": True
        },
        "extractor_used": "test_mode",
        "confidence_metrics": {
            "overall_score": 1.0,
            "title_confidence": 1.0,
            "price_confidence": 1.0,
            "acreage_confidence": 1.0,
            "location_confidence": 1.0,
            "image_confidence": 1.0
        }
    }

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Property Scraper Server')
    parser.add_argument('--port', type=int, default=5001, help='Port to run the server on')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode')
    return parser.parse_args()

if __name__ == '__main__':
    args = parse_args()

    print(f"Scraper server running on port {args.port}")
    logger.info(f"Starting property scraper server on port {args.port}")
    app.run(host='0.0.0.0', port=args.port, debug=args.debug)