"""
HTML-based scraper module using BeautifulSoup for parsing.
"""

import re
import json
import logging
import datetime
import urllib.parse
from typing import Dict, List, Any, Optional, Union
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup, Tag

from scrapers.base_scraper import BaseScraper
from scrapers.models import ScrapedProperty, LocationInfo, Coordinates, PropertyFeature, PropertyAsset

logger = logging.getLogger(__name__)

class HTMLScraper(BaseScraper):
    """Simple HTML scraper using BeautifulSoup"""
    
    def get_name(self) -> str:
        return "HTML Scraper"
    
    def get_description(self) -> str:
        return "Basic HTML scraper that extracts property data from static HTML pages"
    
    def get_supported_domains(self) -> List[str]:
        return ["landwatch.com", "landandfarm.com", "zillow.com", "trulia.com", "landflip.com", "realtor.com"]
    
    async def extract_data(self, url: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Extract property data from URL using BeautifulSoup"""
        from scrapers.targeted_extraction import TargetedExtractor
        
        # Import site-specific scraper for major real estate websites
        try:
            from scrapers.site_specific_scraper import SiteSpecificScraper
            have_site_specific = True
        except ImportError:
            have_site_specific = False
            logger.warning("Site-specific scraper module not available")
        
        options = options or {}
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/'
        }
        
        try:
            # Add request timeout
            timeout = options.get('timeout', 30.0)
            
            # Fetch the page HTML
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                html = response.text
            
            # Parse the HTML
            soup = BeautifulSoup(html, 'html.parser')
            
            # Get the domain to use domain-specific extraction rules
            domain = urlparse(url).netloc.lower()
            
            # First try site-specific scraper for major real estate websites
            if have_site_specific:
                site_scraper = SiteSpecificScraper.get_scraper_for_domain(domain)
                if site_scraper:
                    logger.info(f"Using trained site-specific scraper for {domain}")
                    site_specific_data = await site_scraper.extract_data(soup, url)
                    
                    # Add source URL if not already present
                    if 'source_url' not in site_specific_data:
                        site_specific_data['source_url'] = url
                        
                    # Return the site-specific data
                    return site_specific_data
            
            # If no site-specific scraper or it failed, check if targeted extraction is requested
            targeted_config = None
            if options.get('targeted'):
                # Use the targeted config from options
                targeted_config = options.get('targeted')
                logger.info(f"Using targeted extraction for {url}")
                
                # Create targeted extractor and extract data
                extractor = TargetedExtractor(config=targeted_config)
                targeted_data = extractor.extract_from_html(soup, url, domain)
                
                # Try to extract structured data first (JSON-LD)
                structured_data = self._extract_structured_data(soup)
                if structured_data:
                    logger.info(f"Enhancing targeted data with structured data from {url}")
                    # Enhance targeted data with structured data where available
                    for key, value in structured_data.items():
                        if value and (key not in targeted_data or not targeted_data.get(key)):
                            targeted_data[key] = value
                
                # Add metadata
                targeted_data['source_url'] = url
                targeted_data['scraped_at'] = datetime.datetime.now().isoformat()
                
                return targeted_data
            
            # Standard extraction if not targeted
            
            # Try to extract structured data first (JSON-LD)
            structured_data = self._extract_structured_data(soup)
            if structured_data:
                logger.info(f"Extracted structured data from {url}")
                return structured_data
            
            # Fall back to HTML parsing
            data = {}
            
            # Extract basic property info
            data['title'] = self._extract_title(soup, domain)
            data['description'] = self._extract_description(soup, domain)
            data['price'] = self._extract_price(soup, domain)
            data['acreage'] = self._extract_acreage(soup, domain)
            
            # Extract location info
            data['location'] = self._extract_location(soup, domain)
            data['coordinates'] = self._extract_coordinates(soup, domain)
            
            # Extract property type
            data['property_type'] = self._extract_property_type(soup, domain)
            
            # Extract features/amenities
            data['features'] = self._extract_features(soup, domain)
            
            # Extract images
            data['assets'] = self._extract_assets(soup, domain, url)
            
            # Add metadata
            data['source_url'] = url
            data['scraped_at'] = datetime.datetime.now().isoformat()
            
            # Add confidence metrics
            data['confidence_metrics'] = self._calculate_confidence_metrics(data)
            
            return data
        
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP status error when scraping {url}: {e}")
            raise Exception(f"HTTP status error: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Request error when scraping {url}: {e}")
            raise Exception(f"Request error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error when scraping {url}: {e}")
            raise
    
    def _extract_structured_data(self, soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
        """Extract JSON-LD structured data from the page"""
        json_ld_tags = soup.find_all('script', {'type': 'application/ld+json'})
        
        for tag in json_ld_tags:
            try:
                json_data = json.loads(tag.string)
                # Check if we have a property listing
                if isinstance(json_data, dict):
                    # Handle both single object and @graph array
                    items = json_data.get('@graph', [json_data])
                    
                    for item in items:
                        if item.get('@type') in ['Product', 'RealEstateListing', 'Place', 'Residence', 'LandListing']:
                            # Found relevant structured data
                            return self._process_json_ld(item)
            except (json.JSONDecodeError, AttributeError, TypeError):
                continue
            
        return None
    
    def _process_json_ld(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process JSON-LD data into our property format"""
        result = {}
        
        # Extract title
        result['title'] = json_data.get('name')
        
        # Extract description
        result['description'] = json_data.get('description')
        
        # Extract price
        if 'offers' in json_data and isinstance(json_data['offers'], dict):
            price_text = json_data['offers'].get('price')
            if price_text:
                try:
                    result['price'] = float(price_text)
                except ValueError:
                    price_value = self._extract_numeric_value_from_text(price_text)
                    if price_value is not None:
                        result['price'] = price_value
        
        # Extract location
        location_info = LocationInfo()
        address = None
        
        if 'address' in json_data and isinstance(json_data['address'], dict):
            address = json_data['address']
            if address.get('streetAddress'):
                location_info.address = address.get('streetAddress')
            location_info.city = address.get('addressLocality')
            location_info.state = address.get('addressRegion')
            location_info.zip_code = address.get('postalCode')
            location_info.country = address.get('addressCountry', 'USA')
        
        result['location'] = location_info.dict(exclude_none=True)
        
        # Extract coordinates
        if 'geo' in json_data and isinstance(json_data['geo'], dict):
            geo = json_data['geo']
            if 'latitude' in geo and 'longitude' in geo:
                try:
                    lat = float(geo['latitude'])
                    lng = float(geo['longitude'])
                    result['coordinates'] = {
                        'latitude': lat,
                        'longitude': lng
                    }
                except (ValueError, TypeError):
                    pass
        
        # Extract property type
        if 'category' in json_data:
            result['property_type'] = self._normalize_property_type(json_data['category'])
        
        # Extract features
        features = []
        if 'amenityFeature' in json_data and isinstance(json_data['amenityFeature'], list):
            for feature in json_data['amenityFeature']:
                if isinstance(feature, dict) and 'name' in feature:
                    features.append({
                        'name': feature['name'],
                        'value': feature.get('value')
                    })
        
        result['features'] = features
        
        # Extract images
        assets = []
        if 'image' in json_data:
            images = json_data['image']
            if isinstance(images, str):
                images = [images]
            
            if isinstance(images, list):
                for i, img_url in enumerate(images):
                    assets.append({
                        'id': f"asset-{i+1}",
                        'type': 'image',
                        'url': img_url,
                        'thumbnail': img_url
                    })
        
        result['assets'] = assets
        
        return result
    
    def _extract_title(self, soup: BeautifulSoup, domain: str) -> Optional[str]:
        """Extract property title from the page"""
        # Check for common title elements
        for selector in ['h1.listing-title', 'h1.property-title', 'h1.title', 'h1', '.listing-title', '.property-title']:
            title_elem = soup.select_one(selector)
            if title_elem and title_elem.text.strip():
                return title_elem.text.strip()
        
        # Fall back to page title
        if soup.title:
            title = soup.title.string
            if title:
                # Clean up title
                return re.sub(r'\s*[|]\s*.+$', '', title.strip())
        
        return None
    
    def _extract_description(self, soup: BeautifulSoup, domain: str) -> Optional[str]:
        """Extract property description from the page"""
        for selector in ['.description', '.property-description', '.listing-description', 
                         'div[itemprop="description"]', 'p.description', '.details-description']:
            desc_elem = soup.select_one(selector)
            if desc_elem and desc_elem.text.strip():
                return desc_elem.text.strip()
        
        # Look for paragraphs in the main content area
        content_selectors = ['.main-content', '#main-content', '.listing-details', '.property-details']
        for selector in content_selectors:
            content = soup.select_one(selector)
            if content:
                paragraphs = content.find_all('p')
                if paragraphs:
                    longest_p = max(paragraphs, key=lambda p: len(p.text.strip()))
                    if len(longest_p.text.strip()) > 100:  # Assume a real description is longish
                        return longest_p.text.strip()
        
        return None
    
    def _extract_price(self, soup: BeautifulSoup, domain: str) -> Optional[float]:
        """Extract property price from the page"""
        price_text = None
        
        # Try different common selectors for prices
        for selector in ['.price', '.listing-price', '.property-price', 
                         'span[itemprop="price"]', '.details-price', '.main-price']:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = price_elem.text.strip()
                break
        
        if not price_text:
            # Try to find any element containing a dollar sign
            price_pattern = re.compile(r'\$[\d,]+(?:\.\d{2})?|\$[0-9,.]+\s(?:million|thousand)')
            for elem in soup.find_all(['span', 'div', 'p', 'h2', 'h3']):
                if elem.string and price_pattern.search(elem.string):
                    price_text = elem.string
                    break
        
        if price_text:
            return self._extract_numeric_value_from_text(price_text)
        
        return None
    
    def _extract_acreage(self, soup: BeautifulSoup, domain: str) -> Optional[float]:
        """Extract property acreage from the page"""
        acreage_text = None
        
        # Try different selectors
        for selector in ['.acreage', '.property-acreage', '.listing-acreage', '.land-area']:
            acreage_elem = soup.select_one(selector)
            if acreage_elem:
                acreage_text = acreage_elem.text.strip()
                break
        
        if not acreage_text:
            # Try to find any element mentioning acres
            acreage_pattern = re.compile(r'(\d+(?:\.\d+)?)\s*(?:acres|acre)', re.IGNORECASE)
            for elem in soup.find_all(['span', 'div', 'p', 'li']):
                if elem.string:
                    match = acreage_pattern.search(elem.string)
                    if match:
                        acreage_text = match.group(0)
                        break
        
        if acreage_text:
            # Extract numeric value
            acreage_pattern = re.compile(r'(\d+(?:,\d+)*(?:\.\d+)?)')
            match = acreage_pattern.search(acreage_text)
            if match:
                try:
                    return float(match.group(1).replace(',', ''))
                except ValueError:
                    pass
        
        return None
    
    def _extract_location(self, soup: BeautifulSoup, domain: str) -> Dict[str, Optional[str]]:
        """Extract property location information"""
        location_info = LocationInfo()
        
        # Try to find address elements
        address_selectors = ['.address', '.property-address', '.listing-address', 
                             'span[itemprop="address"]', '.location', '.property-location']
        
        for selector in address_selectors:
            address_elem = soup.select_one(selector)
            if address_elem:
                address_text = address_elem.text.strip()
                if address_text:
                    # Try to parse the address
                    address_parts = address_text.split(',')
                    if len(address_parts) >= 2:
                        location_info.address = address_parts[0].strip()
                        
                        # Try to find city, state, zip
                        if len(address_parts) >= 3:
                            location_info.city = address_parts[1].strip()
                            
                            # The last part might contain state and zip
                            state_zip = address_parts[2].strip()
                            state_zip_match = re.search(r'([A-Z]{2})\s+(\d{5}(?:-\d{4})?)', state_zip)
                            if state_zip_match:
                                location_info.state = state_zip_match.group(1)
                                location_info.zip_code = state_zip_match.group(2)
                            else:
                                # Just use as state
                                location_info.state = state_zip
                    
                    break  # Found address, no need to check other selectors
        
        # If we didn't find a full address, try to at least get city and state
        if not location_info.city or not location_info.state:
            # Look for city, state pattern
            city_state_pattern = re.compile(r'([A-Za-z\s.]+),\s*([A-Z]{2})')
            
            for elem in soup.find_all(['span', 'div', 'p', 'h1', 'h2', 'h3']):
                if elem.string:
                    match = city_state_pattern.search(elem.string)
                    if match:
                        if not location_info.city:
                            location_info.city = match.group(1).strip()
                        if not location_info.state:
                            location_info.state = match.group(2)
                        break
        
        return location_info.dict(exclude_none=True)
    
    def _extract_coordinates(self, soup: BeautifulSoup, domain: str) -> Optional[Dict[str, float]]:
        """Extract geographic coordinates from the page"""
        # Try to find coordinates in meta tags
        for meta in soup.find_all('meta'):
            name = meta.get('name', '').lower()
            prop = meta.get('property', '').lower()
            
            if 'latitude' in name or 'geo.position' in name or 'place:location:latitude' in prop:
                lat_str = meta.get('content')
                if lat_str:
                    try:
                        lat = float(lat_str)
                        # Look for corresponding longitude
                        for m in soup.find_all('meta'):
                            if 'longitude' in m.get('name', '').lower() or 'place:location:longitude' in m.get('property', '').lower():
                                lng_str = m.get('content')
                                if lng_str:
                                    try:
                                        lng = float(lng_str)
                                        return {'latitude': lat, 'longitude': lng}
                                    except ValueError:
                                        pass
                    except ValueError:
                        pass
        
        # Try to find coordinates in script tags
        geo_pattern = re.compile(r'latitude["\']?\s*:\s*(-?\d+\.\d+)[^}]*longitude["\']?\s*:\s*(-?\d+\.\d+)|longitude["\']?\s*:\s*(-?\d+\.\d+)[^}]*latitude["\']?\s*:\s*(-?\d+\.\d+)', re.IGNORECASE)
        
        for script in soup.find_all('script'):
            if script.string:
                matches = geo_pattern.findall(script.string)
                if matches:
                    for match in matches:
                        if match[0] and match[1]:  # lat, lng format
                            try:
                                return {
                                    'latitude': float(match[0]),
                                    'longitude': float(match[1])
                                }
                            except ValueError:
                                pass
                        elif match[2] and match[3]:  # lng, lat format
                            try:
                                return {
                                    'latitude': float(match[3]),
                                    'longitude': float(match[2])
                                }
                            except ValueError:
                                pass
        
        # Try to find map elements with data attributes
        map_elements = soup.find_all(['div', 'iframe'], {'data-lat': True, 'data-lng': True})
        for elem in map_elements:
            try:
                lat = float(elem['data-lat'])
                lng = float(elem['data-lng'])
                return {'latitude': lat, 'longitude': lng}
            except (ValueError, KeyError):
                pass
        
        return None
    
    def _extract_property_type(self, soup: BeautifulSoup, domain: str) -> Optional[str]:
        """Extract property type from the page"""
        type_text = None
        
        # Try different selectors
        for selector in ['.property-type', '.listing-type', '.details-type', 'span[itemprop="category"]']:
            type_elem = soup.select_one(selector)
            if type_elem:
                type_text = type_elem.text.strip()
                break
        
        if not type_text:
            # Try to infer from page content
            text_content = soup.get_text().lower()
            
            # Check for keywords indicating property types
            if re.search(r'\bfarm\b|\bagricultural\b', text_content):
                return 'farm'
            elif re.search(r'\branch\b', text_content):
                return 'ranch'
            elif re.search(r'\brecreational\b|\bhunting\b|\bfishing\b', text_content):
                return 'recreational'
            elif re.search(r'\bwaterfront\b|\bbeach\b|\blake\b|\briver\b', text_content):
                return 'waterfront'
            elif re.search(r'\bmountain\b|\bmountainous\b', text_content):
                return 'mountain'
            elif re.search(r'\bhomesite\b|\bresidential\b', text_content):
                return 'residential'
            elif re.search(r'\bcommercial\b|\bindustrial\b|\boffice\b', text_content):
                return 'commercial'
            
            # Default to land
            return 'land'
        
        return self._normalize_property_type(type_text)
    
    def _normalize_property_type(self, property_type: Optional[str]) -> str:
        """Normalize property type to match our schema"""
        if not property_type:
            return 'land'
        
        property_type = property_type.lower()
        
        # Map various property type names to our standard types
        if 'farm' in property_type or 'agricultural' in property_type:
            return 'farm'
        elif 'ranch' in property_type:
            return 'ranch'
        elif 'recreational' in property_type or 'hunting' in property_type:
            return 'recreational'
        elif 'waterfront' in property_type or 'beach' in property_type or 'lake' in property_type:
            return 'waterfront'
        elif 'mountain' in property_type:
            return 'mountain'
        elif 'residential' in property_type or 'home' in property_type:
            return 'residential'
        elif 'commercial' in property_type or 'industrial' in property_type:
            return 'commercial'
        
        # Default to land
        return 'land'
    
    def _extract_features(self, soup: BeautifulSoup, domain: str) -> List[Dict[str, str]]:
        """Extract property features/amenities"""
        features = []
        
        # Try different selectors for feature lists
        feature_containers = []
        for selector in ['.features', '.amenities', '.property-features', '.property-details', 
                         '.listing-details', '.details-list', 'ul.features', 'ul.amenities']:
            containers = soup.select(selector)
            if containers:
                feature_containers.extend(containers)
        
        # Extract features from containers
        for container in feature_containers:
            # Check for list items
            list_items = container.find_all('li')
            if list_items:
                for item in list_items:
                    feature_text = item.text.strip()
                    if feature_text:
                        # Check if feature has name and value
                        parts = feature_text.split(':')
                        if len(parts) > 1:
                            name = parts[0].strip()
                            value = parts[1].strip()
                        else:
                            name = feature_text
                            value = None
                        
                        features.append({
                            'name': name,
                            'value': value
                        })
            else:
                # Check for other feature presentation formats
                for elem in container.find_all(['div', 'span', 'p']):
                    feature_text = elem.text.strip()
                    if feature_text and len(feature_text) < 100:  # Avoid capturing large text blocks
                        # Check if feature has name and value
                        parts = feature_text.split(':')
                        if len(parts) > 1:
                            name = parts[0].strip()
                            value = parts[1].strip()
                        else:
                            name = feature_text
                            value = None
                        
                        features.append({
                            'name': name,
                            'value': value
                        })
        
        # Look for specific feature types if we haven't found many yet
        if len(features) < 3:
            # Look for terrain type
            terrain_patterns = [
                (re.compile(r'\b(flat|level|hillside|sloped|mountainous|rocky|gentle)\b', re.I), 'Terrain'),
                (re.compile(r'\b(wooded|forested|forest|trees|timber|clear|cleared|open|grassland|pasture)\b', re.I), 'Vegetation'),
                (re.compile(r'\b(river|creek|stream|water|pond|lake|waterfront|oceanfront|ocean)\b', re.I), 'Water Resources'),
                (re.compile(r'\b(road|highway|frontage|access|driveway|gated)\b', re.I), 'Access'),
                (re.compile(r'\b(zoning|zoned|zone|commercial|residential|agricultural|rural|development)\b', re.I), 'Zoning'),
                (re.compile(r'\b(power|electric|electricity|utilities|utility|water|well|septic|sewer)\b', re.I), 'Utilities')
            ]
            
            # Check for mentions in paragraphs
            paragraphs = soup.find_all(['p', 'div'])
            for p in paragraphs:
                if p.text and len(p.text.strip()) > 10:
                    text = p.text.lower()
                    for pattern, category in terrain_patterns:
                        matches = pattern.findall(text)
                        if matches:
                            for match in matches:
                                features.append({
                                    'name': match.capitalize(),
                                    'category': category
                                })
        
        # Deduplicate features
        unique_features = []
        feature_names = set()
        
        for feature in features:
            feature_name = feature['name'].lower()
            if feature_name not in feature_names:
                feature_names.add(feature_name)
                unique_features.append(feature)
        
        return unique_features
    
    def _extract_assets(self, soup: BeautifulSoup, domain: str, base_url: str) -> List[Dict[str, Any]]:
        """Extract images and other assets from the page"""
        assets = []
        
        # Try to find image galleries
        gallery_selectors = ['.property-photos', '.listing-photos', '.photos', '.gallery', 
                             '.slick-slider', '.carousel', '.swiper-container', '.property-gallery']
        
        for selector in gallery_selectors:
            gallery = soup.select_one(selector)
            if gallery:
                # Look for images within the gallery
                images = gallery.find_all('img')
                for idx, img in enumerate(images):
                    src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                    if src:
                        # Make sure we have an absolute URL
                        img_url = self._make_absolute_url(src, base_url)
                        
                        assets.append({
                            'id': f"image-{idx}",
                            'type': 'image',
                            'url': img_url,
                            'thumbnail': img_url,
                            'title': img.get('alt', f"Property Image {idx+1}")
                        })
        
        # If we didn't find a gallery, look for large images anywhere on the page
        if not assets:
            # Find all images that are likely to be property photos (not icons, logos, etc.)
            for idx, img in enumerate(soup.find_all('img')):
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                if src:
                    # Skip likely non-property images
                    if any(skip in src.lower() for skip in ['logo', 'icon', 'banner', 'button', 'thumbnail']):
                        continue
                    
                    # Check image size if available in attributes
                    width = img.get('width')
                    height = img.get('height')
                    
                    # Only include reasonably large images
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w < 200 or h < 200:
                                continue  # Skip small images
                        except ValueError:
                            pass
                    
                    # Make sure we have an absolute URL
                    img_url = self._make_absolute_url(src, base_url)
                    
                    assets.append({
                        'id': f"image-{idx}",
                        'type': 'image',
                        'url': img_url,
                        'thumbnail': img_url,
                        'title': img.get('alt', f"Property Image {idx+1}")
                    })
        
        # Deduplicate assets
        unique_assets = []
        asset_urls = set()
        
        for asset in assets:
            if asset['url'] not in asset_urls:
                asset_urls.add(asset['url'])
                unique_assets.append(asset)
        
        return unique_assets
    
    def _calculate_confidence_metrics(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate confidence metrics for the extracted data"""
        metrics = {'overall': 0.0}
        
        # Calculate confidence for price
        if 'price' in data and data['price'] is not None:
            metrics['price'] = 1.0
        else:
            metrics['price'] = 0.0
        
        # Calculate confidence for acreage
        if 'acreage' in data and data['acreage'] is not None:
            metrics['acreage'] = 1.0
        else:
            metrics['acreage'] = 0.0
        
        # Calculate confidence for location
        location_confidence = 0.0
        if 'location' in data and data['location']:
            location = data['location']
            fields = ['address', 'city', 'state', 'zip_code']
            present_fields = sum(1 for field in fields if field in location and location[field])
            location_confidence = present_fields / len(fields)
        metrics['location'] = location_confidence
        
        # Calculate confidence for coordinates
        if 'coordinates' in data and data['coordinates']:
            metrics['coordinates'] = 1.0
        else:
            metrics['coordinates'] = 0.0
        
        # Calculate confidence for features
        if 'features' in data and data['features']:
            feature_count = len(data['features'])
            if feature_count > 5:
                metrics['features'] = 1.0
            else:
                metrics['features'] = min(feature_count / 5, 1.0)
        else:
            metrics['features'] = 0.0
        
        # Calculate confidence for assets (images)
        if 'assets' in data and data['assets']:
            asset_count = len(data['assets'])
            if asset_count > 3:
                metrics['assets'] = 1.0
            else:
                metrics['assets'] = min(asset_count / 3, 1.0)
        else:
            metrics['assets'] = 0.0
        
        # Calculate overall confidence as average of all metrics
        confidence_values = [v for k, v in metrics.items() if k != 'overall']
        if confidence_values:
            metrics['overall'] = sum(confidence_values) / len(confidence_values)
        
        return metrics
    
    def _extract_numeric_value_from_text(self, text: str) -> Optional[float]:
        """Extract a numeric value from text (e.g., prices, acreage)"""
        if not text:
            return None
        
        # Remove non-numeric characters except for decimal points and commas
        # First, check if it contains "million" or "thousand" and handle accordingly
        text = text.lower()
        if 'million' in text:
            pattern = re.compile(r'[\$]?\s*([\d,]+(?:\.\d+)?)\s*million')
            match = pattern.search(text)
            if match:
                try:
                    return float(match.group(1).replace(',', '')) * 1000000
                except ValueError:
                    pass
        elif 'thousand' in text:
            pattern = re.compile(r'[\$]?\s*([\d,]+(?:\.\d+)?)\s*thousand')
            match = pattern.search(text)
            if match:
                try:
                    return float(match.group(1).replace(',', '')) * 1000
                except ValueError:
                    pass
        
        # Handle regular numeric values with currency symbols
        pattern = re.compile(r'[\$€£¥]?\s*([\d,]+(?:\.\d+)?)')
        match = pattern.search(text)
        if match:
            try:
                return float(match.group(1).replace(',', ''))
            except ValueError:
                pass
        
        return None
    
    def _make_absolute_url(self, url: str, base_url: str) -> str:
        """Convert a relative URL to an absolute URL"""
        if not url:
            return ''
        
        if url.startswith(('http://', 'https://')):
            return url
        
        try:
            return urllib.parse.urljoin(base_url, url)
        except Exception:
            return url