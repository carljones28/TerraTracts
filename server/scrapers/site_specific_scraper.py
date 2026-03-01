"""
Site-specific scraper implementations for major real estate websites.
This module contains specialized extraction strategies trained for specific
real estate listing sites.
"""

import re
import json
import logging
import asyncio
import datetime
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

from scrapers.models import ScrapedProperty, PropertyAsset, PropertyDocument

logger = logging.getLogger(__name__)

class SiteSpecificScraper:
    """Base class for site-specific scrapers"""
    
    @staticmethod
    def get_scraper_for_domain(domain: str) -> Optional['SiteSpecificScraper']:
        """Factory method to get the appropriate scraper for a domain"""
        domain = domain.lower()
        
        if 'zillow.com' in domain:
            return ZillowScraper()
        elif 'landwatch.com' in domain:
            return LandWatchScraper()
        
        return None
    
    async def extract_data(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract property data from soup - implement in subclasses"""
        raise NotImplementedError("Subclasses must implement extract_data")
    
    def _clean_text(self, text: str) -> str:
        """Clean up text by removing extra whitespace and newlines"""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text).strip()
    
    def _clean_price_string(self, price_str: str) -> float:
        """Convert price string to float"""
        if not price_str:
            return 0.0
        
        # Extract just the numbers
        price_match = re.search(r'[$€£]?([0-9,.]+)', price_str)
        if not price_match:
            return 0.0
            
        # Remove non-numeric characters except decimal point
        price_clean = re.sub(r'[^0-9.]', '', price_match.group(1))
        
        try:
            return float(price_clean)
        except ValueError:
            return 0.0
    
    def _extract_acreage(self, text: str) -> float:
        """Extract acreage from text"""
        if not text:
            return 0.0
            
        # Match patterns like "5.2 acres" or "5.2 acre" or just "5.2"
        acreage_match = re.search(r'([\d,.]+)\s*acres?', text, re.IGNORECASE)
        if acreage_match:
            try:
                return float(acreage_match.group(1).replace(',', ''))
            except ValueError:
                pass
        
        return 0.0
    
    def _normalize_property_type(self, property_type: str) -> str:
        """Normalize property type to standard values"""
        if not property_type:
            return "land"
            
        property_type = property_type.lower().strip()
        
        # Mapping of common terms to standardized property types
        type_mapping = {
            'lot': 'land',
            'acreage': 'land',
            'vacant': 'land',
            'agricultural': 'farm',
            'agriculture': 'farm',
            'farmland': 'farm',
            'cattle': 'ranch',
            'hunting': 'recreational',
            'fishing': 'recreational',
            'lakefront': 'waterfront',
            'lake': 'waterfront',
            'river': 'waterfront',
            'forest': 'timber',
            'woodland': 'timber',
            'trees': 'timber',
            'home': 'residential',
            'house': 'residential',
            'cabin': 'residential',
            'single family': 'residential',
            'office': 'commercial',
            'retail': 'commercial',
            'business': 'commercial',
            'industrial': 'commercial',
            'preserve': 'conservation',
            'conservation': 'conservation',
            'wildlife': 'conservation'
        }
        
        # Standard property types
        standard_types = [
            'land', 'farm', 'ranch', 'residential', 'commercial',
            'recreational', 'agricultural', 'waterfront', 'mountain',
            'timber', 'conservation'
        ]
        
        # First check if it's already a standard type
        for std_type in standard_types:
            if std_type in property_type:
                return std_type
                
        # Then check mapped types
        for term, std_type in type_mapping.items():
            if term in property_type:
                return std_type
                
        # Default to land
        return "land"
    
    def _extract_state_from_location(self, location: str) -> Optional[str]:
        """Extract state from location string"""
        if not location:
            return None
            
        # Try to extract state abbreviation (2 capital letters after a comma)
        state_match = re.search(r',\s*([A-Z]{2})\b', location)
        if state_match:
            return state_match.group(1)
            
        # List of US states for matching
        states = {
            'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
            'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
            'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
            'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
            'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
            'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
            'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
            'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
            'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
            'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
            'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
            'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
            'wisconsin': 'WI', 'wyoming': 'WY'
        }
        
        # Try to find state name in the location
        location_lower = location.lower()
        for state_name, abbrev in states.items():
            if state_name in location_lower:
                return abbrev
                
        return None
        
    def _is_icon_or_logo(self, url: str) -> bool:
        """Check if the URL points to an icon or logo rather than a property image"""
        if not url:
            return True

        # These patterns suggest icons/logos rather than property images
        icon_patterns = [
            'logo', 'icon', 'favicon', 'banner', 'marker', 'avatar',
            'pixel', 'blank', 'button', 'badge', 'sprite', 'loading',
            'placeholder', 'profile', 'thumbnail-', 'symbol'
        ]
        
        url_lower = url.lower()
        
        # Check for icon/logo patterns in the URL
        for pattern in icon_patterns:
            if pattern in url_lower:
                return True
                
        # Check file extensions that are typically not property photos
        if url_lower.endswith(('.svg', '.gif', '.ico', '.webp')):
            return True
        
        # Check for image dimensions in URL (e.g., 30x30, 50x50)
        dim_match = re.search(r'(\d+)x(\d+)', url)
        if dim_match:
            width = int(dim_match.group(1))
            height = int(dim_match.group(2))
            # Skip small images likely to be icons/logos
            if width < 200 or height < 200:
                return True
                
        # Check for very short URLs which are often icons/logos
        if len(url) < 40 and ('/img/' in url or '/images/' in url or '/icons/' in url):
            return True
            
        # Check for data URIs (not likely to be property images)
        if url.startswith('data:image'):
            return True
            
        # Zillow-specific checks
        if 'zillow.com' in url_lower:
            # Skip Zillow icons and UI elements
            if 'images.zillow.com/icons' in url_lower or '/z-logo-' in url_lower:
                return True
            if '/static/' in url_lower and len(url) < 100:
                return True
                
        # LandWatch-specific checks  
        if 'landwatch.com' in url_lower:
            if 'no-image' in url_lower or 'default-image' in url_lower:
                return True
            if 'static.landwatch.com' in url_lower and not '/property/' in url_lower:
                return True
                
        return False
        
    def _get_states_map(self) -> Dict[str, str]:
        """Get a mapping of US state abbreviations to names"""
        return {
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
            'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
        }


class ZillowScraper(SiteSpecificScraper):
    """Specialized scraper for Zillow.com"""
    
    async def extract_data(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract property data from Zillow using trained selectors"""
        data = {}
        
        # Extract title - Zillow typically uses h1 elements for property titles
        title_selectors = [
            'h1.ds-address-container', 'h1[data-testid="ds-home-details-chip"]',
            'h1.efnmue-0', 'h1.property-header'
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                data['title'] = self._clean_text(title_elem.get_text())
                break
                
        # Extract price - Zillow formats prices prominently
        price_selectors = [
            '[data-testid="price"]', '.ds-summary-row .ds-value',
            '.ds-price', '.home-summary-row .ds-value',
            '.price-large', '.ds-money'
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text()
                data['price'] = self._clean_price_string(price_text)
                break
                
        # Extract description
        description_selectors = [
            '[data-testid="ds-home-description-text"]', 
            '.ds-overview-section [data-testid="description"]',
            '.ds-home-description-text', '.ds-overview',
            '.property-info-description'
        ]
        
        for selector in description_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                data['description'] = self._clean_text(desc_elem.get_text())
                break

        # Extract property facts - these contain acreage information on Zillow
        home_facts = {}
        facts_selectors = [
            '.ds-home-fact-list', '.ds-home-facts',
            '[data-testid="facts-list"]', '.ds-data-view'
        ]
        
        for selector in facts_selectors:
            facts_container = soup.select_one(selector)
            if facts_container:
                # Look for key-value pairs
                keys = facts_container.select('.ds-data-view dt, .ds-home-fact-label')
                values = facts_container.select('.ds-data-view dd, .ds-home-fact-value')
                
                if len(keys) == len(values):
                    for i in range(len(keys)):
                        key = self._clean_text(keys[i].get_text()).lower()
                        value = self._clean_text(values[i].get_text())
                        home_facts[key] = value
                break
                
        # Extract acreage from home facts or description
        if home_facts:
            for key, value in home_facts.items():
                if 'acre' in key or 'lot' in key:
                    data['acreage'] = self._extract_acreage(value)
                    break
                    
        if 'acreage' not in data and 'description' in data:
            # Try to find acreage in description
            acreage_match = re.search(r'(\d+\.?\d*)\s*acres?', data['description'], re.IGNORECASE)
            if acreage_match:
                try:
                    data['acreage'] = float(acreage_match.group(1))
                except ValueError:
                    pass
                    
        # Extract location information
        location_selectors = [
            '.ds-address-container', '[data-testid="home-details-address"]',
            '.property-address', '.ds-address'
        ]
        
        for selector in location_selectors:
            location_elem = soup.select_one(selector)
            if location_elem:
                location_text = self._clean_text(location_elem.get_text())
                
                # Zillow location format is typically "Street, City, State ZIP"
                data['location'] = {
                    'address': location_text
                }
                
                # Try to extract city and state
                location_parts = location_text.split(',')
                if len(location_parts) >= 2:
                    # Last part contains state and ZIP
                    state_zip = location_parts[-1].strip()
                    # Extract state (2 letters)
                    state_match = re.search(r'([A-Z]{2})', state_zip)
                    if state_match:
                        data['state'] = state_match.group(1)
                    
                    # Second to last part is typically the city
                    if len(location_parts) >= 3:
                        data['location']['city'] = location_parts[-2].strip()
                
                break
        
        # Extract property type
        property_type_selectors = [
            '.ds-home-details-chip', '.ds-home-fact-value',
            '.ds-home-category', '[data-testid="property-type"]'
        ]
        
        for selector in property_type_selectors:
            type_elems = soup.select(selector)
            for elem in type_elems:
                text = self._clean_text(elem.get_text()).lower()
                # Look for property type keywords
                if any(keyword in text for keyword in ['land', 'lot', 'farm', 'commercial', 'residential']):
                    data['property_type'] = self._normalize_property_type(text)
                    break
            
            if 'property_type' in data:
                break
                
        # Extract features as list items
        features = []
        feature_selectors = [
            '.ds-data-view-list', '.ds-home-facts',
            '.ds-overview-section ul', '.ds-data-group'
        ]
        
        for selector in feature_selectors:
            feature_elements = soup.select(f"{selector} li, {selector} dt")
            if feature_elements:
                for elem in feature_elements:
                    feature_text = self._clean_text(elem.get_text())
                    if feature_text and len(feature_text) > 3:
                        features.append({
                            'name': feature_text,
                            'value': '',
                            'category': 'property'
                        })
                        
        if features:
            data['features'] = features
            
        # Extract coordinates from script data
        scripts = soup.find_all('script', {'type': 'application/json'})
        for script in scripts:
            try:
                if script.string:
                    script_json = json.loads(script.string)
                    
                    # Look for Zillow's property data structure
                    if isinstance(script_json, dict):
                        # Zillow stores property data in various JSON paths
                        property_paths = [
                            'property', 'props.pageProps.property', 
                            'props.pageProps.initialData.property',
                            'pageProps.property'
                        ]
                        
                        for path in property_paths:
                            props = script_json
                            for key in path.split('.'):
                                if isinstance(props, dict) and key in props:
                                    props = props[key]
                                else:
                                    props = None
                                    break
                                    
                            if props and isinstance(props, dict):
                                # Extract coordinates
                                if 'latitude' in props and 'longitude' in props:
                                    lat = props.get('latitude')
                                    lng = props.get('longitude')
                                    
                                    if lat and lng:
                                        data['coordinates'] = {
                                            'latitude': float(lat),
                                            'longitude': float(lng)
                                        }
                                        break
                                
                                # Extract additional data if available
                                if 'price' in props and 'price' not in data:
                                    data['price'] = float(props.get('price', 0))
                                    
                                if 'address' in props and isinstance(props['address'], dict):
                                    address = props['address']
                                    loc_data = {}
                                    
                                    if 'streetAddress' in address:
                                        loc_data['address'] = address['streetAddress']
                                        
                                    if 'city' in address:
                                        loc_data['city'] = address['city']
                                        
                                    if 'state' in address:
                                        loc_data['state'] = address['state']
                                        data['state'] = address['state']
                                        
                                    if 'zipcode' in address:
                                        loc_data['postal_code'] = address['zipcode']
                                        
                                    if loc_data:
                                        data['location'] = loc_data
            except (json.JSONDecodeError, AttributeError):
                # Skip invalid JSON
                pass
                
        # Extract images using Zillow's image gallery
        assets = []
        image_selectors = [
            '.media-stream-image', '.slideshow img', 
            '.photo-tile img', '.media-column img',
            '[data-testid="hdp-hero-img"]', '.image-card img'
        ]
        
        for selector in image_selectors:
            images = soup.select(selector)
            for i, img in enumerate(images):
                if img.get('src'):
                    img_url = img['src']
                    # Filter out small thumbnails and placeholders
                    if 'www.zillow.com' in img_url and len(img_url) > 20:
                        assets.append({
                            'id': f"asset-{i+1}",
                            'type': 'image',
                            'url': img_url,
                            'thumbnail': img_url
                        })
        
        if assets:
            # Remove duplicates
            unique_assets = []
            seen_urls = set()
            for asset in assets:
                if asset['url'] not in seen_urls:
                    seen_urls.add(asset['url'])
                    unique_assets.append(asset)
            
            data['assets'] = unique_assets
                        
        # If no property type was detected, try to infer it from URL or title
        if 'property_type' not in data:
            url_lower = url.lower()
            if 'land' in url_lower or 'lot' in url_lower:
                data['property_type'] = 'land'
            elif 'farm' in url_lower or 'ranch' in url_lower:
                data['property_type'] = 'farm' if 'farm' in url_lower else 'ranch'
            elif 'commercial' in url_lower:
                data['property_type'] = 'commercial'
            elif 'house' in url_lower or 'home' in url_lower:
                data['property_type'] = 'residential'
            else:
                # Default to 'land' for this application
                data['property_type'] = 'land'
                
        # Calculate confidence score (how complete is the data)
        required_fields = ['title', 'price', 'location', 'coordinates', 'acreage']
        confidence = sum(1 for field in required_fields if field in data) / len(required_fields)
        data['confidence'] = confidence
        
        # Add source information
        data['source'] = {
            'url': url,
            'website': 'zillow.com',
            'extracted_at': datetime.datetime.now().isoformat()
        }
                
        return data

    async def _extract_images(self, soup: BeautifulSoup, url: str) -> List[Dict[str, Any]]:
        """Extract property images from Zillow"""
        images = []
        
        # Track if we've found good images
        found_real_images = False
        
        # First try to extract images from JSON data in scripts which is more reliable
        scripts = soup.find_all('script', {'type': 'application/json'})
        for script in scripts:
            if not script.string:
                continue
                
            try:
                script_json = json.loads(script.string)
                
                # Look for Zillow's image data structures
                if isinstance(script_json, dict):
                    # Check for image data in various possible paths
                    image_paths = [
                        'props.pageProps.initialData.building.images',
                        'props.pageProps.property.photos',
                        'props.pageProps.photos',
                        'pageProps.property.photos',
                        'property.photos',
                        'building.images',
                        'photos'
                    ]
                    
                    for path in image_paths:
                        imgs = script_json
                        for key in path.split('.'):
                            if isinstance(imgs, dict) and key in imgs:
                                imgs = imgs[key]
                            else:
                                imgs = None
                                break
                                
                        if imgs and isinstance(imgs, list) and len(imgs) > 0:
                            # Check if the first item has the expected image structure
                            first_img = imgs[0]
                            if isinstance(first_img, dict) and ('url' in first_img or 'imageUrl' in first_img):
                                logger.info(f"Found {len(imgs)} Zillow images in JSON data")
                                
                                # Extract images
                                for i, img_data in enumerate(imgs):
                                    img_url = img_data.get('url') or img_data.get('imageUrl') or img_data.get('link')
                                    
                                    # Skip non-image URLs, icons, and logos
                                    if not img_url or self._is_icon_or_logo(img_url):
                                        continue
                                    
                                    # Get caption/description if available
                                    caption = img_data.get('caption') or img_data.get('description') or ''
                                    
                                    # Create asset for this image
                                    images.append({
                                        'id': f'asset-{i+1}',
                                        'type': 'image',
                                        'url': img_url,
                                        'thumbnail': img_data.get('thumbnail', img_url),
                                        'title': img_data.get('title', f"Property Image {i+1}"),
                                        'description': caption,
                                        'selected': i == 0
                                    })
                                
                                found_real_images = True
                                break
                    
                    if found_real_images:
                        break
            except json.JSONDecodeError:
                continue
        
        # If we didn't find images in JSON, look for image galleries in HTML
        if not found_real_images:
            # Look for image galleries
            image_containers = soup.select('.media-stream-container, .photo-tile-container, .gallery-container, [data-testid="hdp-hero-img"], [data-testid="image-gallery"], .ds-media-col')
        
        for container in image_containers:
            img_elements = container.select('img')
            for i, img in enumerate(img_elements):
                if img.get('src'):
                    img_url = img['src']
                    # Filter out small thumbnails
                    if 'www.zillow.com' in img_url and len(img_url) > 20:
                        images.append({
                            'id': f"image-{i+1}",
                            'type': 'image',
                            'url': img_url,
                            'thumbnail': img_url
                        })
                        
        # Look for hidden image data in scripts
        scripts = soup.select('script[type="application/json"]')
        for script in scripts:
            try:
                if script.string:
                    data = json.loads(script.string)
                    
                    # Check common Zillow image paths
                    img_paths = [
                        'props.pageProps.propertyImages', 
                        'props.pageProps.property.photos',
                        'property.photos',
                        'photos'
                    ]
                    
                    for path in img_paths:
                        img_data = data
                        for key in path.split('.'):
                            if isinstance(img_data, dict) and key in img_data:
                                img_data = img_data[key]
                            else:
                                img_data = None
                                break
                                
                        if img_data and isinstance(img_data, list):
                            for i, img_item in enumerate(img_data):
                                if isinstance(img_item, dict) and 'url' in img_item:
                                    images.append({
                                        'id': f"image-{i+1}",
                                        'type': 'image',
                                        'url': img_item['url'],
                                        'thumbnail': img_item.get('thumbnail', img_item['url'])
                                    })
                                    break
            except (json.JSONDecodeError, AttributeError):
                # Skip invalid JSON
                pass
                
        # Filter out duplicates
        unique_images = []
        seen_urls = set()
        for img in images:
            if img['url'] not in seen_urls:
                seen_urls.add(img['url'])
                unique_images.append(img)
                
        return unique_images


class LandWatchScraper(SiteSpecificScraper):
    """Specialized scraper for LandWatch.com"""
    
    async def extract_data(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract property data from LandWatch using trained selectors"""
        data = {}
        
        try:
            # LandWatch uses both JSON-LD and HTML structure
            # Try to extract from JSON-LD first
            json_ld_scripts = soup.find_all('script', {'type': 'application/ld+json'})
            
            for script in json_ld_scripts:
                try:
                    if script.string:
                        json_data = json.loads(script.string)
                        
                        # LandWatch typically uses RealEstateListing schema
                        if isinstance(json_data, dict) and '@type' in json_data:
                            # Extract basic listing data
                            if json_data.get('@type') in ['RealEstateListing', 'Product', 'Place', 'LandListing']:
                                if 'name' in json_data:
                                    data['title'] = json_data['name']
                                    
                                if 'description' in json_data:
                                    data['description'] = json_data['description']
                                    
                                if 'offers' in json_data and isinstance(json_data['offers'], dict):
                                    if 'price' in json_data['offers']:
                                        price = json_data['offers']['price']
                                        try:
                                            data['price'] = float(price)
                                        except (ValueError, TypeError):
                                            # Try to clean price string
                                            data['price'] = self._clean_price_string(str(price))
                                            
                                # Extract address and location
                                if 'address' in json_data and isinstance(json_data['address'], dict):
                                    address_data = json_data['address']
                                    location_data = {}
                                    
                                    # Extract address components
                                    if 'streetAddress' in address_data:
                                        location_data['address'] = address_data['streetAddress']
                                    if 'addressLocality' in address_data:
                                        location_data['city'] = address_data['addressLocality']
                                    if 'addressRegion' in address_data:
                                        location_data['state'] = address_data['addressRegion']
                                        data['state'] = address_data['addressRegion']
                                    if 'postalCode' in address_data:
                                        location_data['zip_code'] = address_data['postalCode']
                                    if 'addressCountry' in address_data:
                                        location_data['country'] = address_data['addressCountry']
                                    
                                    data['location'] = location_data
                                
                                # Extract geo coordinates
                                if 'geo' in json_data and isinstance(json_data['geo'], dict):
                                    geo_data = json_data['geo']
                                    if 'latitude' in geo_data and 'longitude' in geo_data:
                                        try:
                                            data['coordinates'] = {
                                                'latitude': float(geo_data['latitude']),
                                                'longitude': float(geo_data['longitude'])
                                            }
                                        except (ValueError, TypeError):
                                            pass
                                
                                # Extract images
                                if 'image' in json_data:
                                    images = json_data['image']
                                    if isinstance(images, str):
                                        images = [images]
                                    
                                    if isinstance(images, list):
                                        assets = []
                                        for i, img_url in enumerate(images):
                                            if not self._is_icon_or_logo(img_url):
                                                assets.append({
                                                    'id': f"asset-{i+1}",
                                                    'type': 'image',
                                                    'url': img_url,
                                                    'thumbnail': img_url,
                                                    'title': f"Property Image {i+1}",
                                                    'description': '',
                                                    'selected': i == 0
                                                })
                                        
                                        data['assets'] = assets
                except Exception as e:
                    logger.warning(f"Error parsing JSON-LD in LandWatch scraper: {e}")
            
            # If we didn't get data from JSON-LD, fall back to HTML parsing
            if not data.get('title'):
                # Extract info from the header section - new selectors for 2024 LandWatch design
                header_selectors = [
                    'h1.lwPropertyDetailsTitle', '.detail-title', '.property-title', 
                    '.propertyInfo-title', '.listing-details h1', '.title-container h1',
                    'header h1', '.property-header h1'
                ]
                
                for selector in header_selectors:
                    title_elem = soup.select_one(selector)
                    if title_elem:
                        data['title'] = self._clean_text(title_elem.get_text())
                        break
            
            # If we didn't get price from JSON-LD
            if not data.get('price'):
                # Extract price from prominent price display - updated for 2024 LandWatch design
                price_selectors = [
                    '.lwPropertyDetailsPrice', '.detail-price', '.detail-price-value', 
                    '.property-price', '.propertyInfo-price', '.price', '.list-price',
                    'span.lwPrice', 'span.primary-price', '.property-header .price'
                ]
                
                for selector in price_selectors:
                    price_elem = soup.select_one(selector)
                    if price_elem:
                        price_text = price_elem.get_text()
                        data['price'] = self._clean_price_string(price_text)
                        break
            
            # Extract acreage if not already extracted
            if not data.get('acreage'):
                # Try to find acreage in the title first
                if data.get('title'):
                    acreage_match = re.search(r'(\d+\.?\d*)\s*acres?', data['title'], re.IGNORECASE)
                    if acreage_match:
                        try:
                            data['acreage'] = float(acreage_match.group(1))
                        except ValueError:
                            pass
                
                # If not found in title, look for specific acreage elements
                if not data.get('acreage'):
                    acreage_selectors = [
                        '.lwPropertyDetailsAcreage', '.detail-acres', '.property-acres', 
                        '.propertyInfo-acres', '.acreage', 'span.lwAcreage'
                    ]
                    
                    for selector in acreage_selectors:
                        acreage_elem = soup.select_one(selector)
                        if acreage_elem:
                            acreage_text = acreage_elem.get_text()
                            acreage = self._extract_acreage(acreage_text)
                            if acreage > 0:
                                data['acreage'] = acreage
                                break
            
            # Extract property type if not already extracted 
            if not data.get('property_type'):
                property_type_selectors = [
                    '.lwPropertyDetailsType', '.detail-property-type', '.property-type', 
                    '.propertyInfo-type', '.category', '.property-category'
                ]
                
                for selector in property_type_selectors:
                    type_elem = soup.select_one(selector)
                    if type_elem:
                        type_text = self._clean_text(type_elem.get_text())
                        data['property_type'] = self._normalize_property_type(type_text)
                        break
                        
                # If not found, infer from URL or title
                if not data.get('property_type'):
                    url_lower = url.lower()
                    if 'farm' in url_lower or 'ranch' in url_lower:
                        data['property_type'] = 'farm' if 'farm' in url_lower else 'ranch'
                    elif 'land' in url_lower:
                        data['property_type'] = 'land'
                    elif 'commercial' in url_lower:
                        data['property_type'] = 'commercial'
                    elif 'waterfront' in url_lower:
                        data['property_type'] = 'waterfront'
                    else:
                        # Default to land for LandWatch (as the name suggests)
                        data['property_type'] = 'land'
            
            # Extract description if not already extracted
            if not data.get('description'):
                description_selectors = [
                    '.lwPropertyDetailsDescription', '.detail-description', '.description', 
                    '.propertyInfo-description', '.property-description', '.listing-description',
                    '.property-overview', '.listing-content'
                ]
                
                for selector in description_selectors:
                    desc_elem = soup.select_one(selector)
                    if desc_elem:
                        data['description'] = self._clean_text(desc_elem.get_text())
                        break
            
            # Extract features
            if not data.get('features'):
                features = []
                feature_selectors = [
                    '.lwPropertyDetailsFeatures', '.lwPropertyDetailsSpecs', '.property-details', '.detail-features', 
                    '.features', '.propertyInfo-features', '.property-bullets', '.listing-features'
                ]
                
                for selector in feature_selectors:
                    feature_container = soup.select_one(selector)
                    if feature_container:
                        # Look for list items
                        feature_items = feature_container.select('li')
                        if feature_items:
                            for item in feature_items:
                                feature_text = self._clean_text(item.get_text())
                                if feature_text:
                                    features.append({
                                        'name': feature_text,
                                        'value': '',
                                        'category': 'property'
                                    })
                        else:
                            # Look for labeled features
                            for span in feature_container.select('span, div'):
                                feature_text = self._clean_text(span.get_text())
                                if feature_text and len(feature_text) > 3:
                                    features.append({
                                        'name': feature_text,
                                        'value': '',
                                        'category': 'property'
                                    })
                            
                        break
                
                if features:
                    data['features'] = features
            
            # Extract images if not already done
            if not data.get('assets'):
                # Use our enhanced image extraction method
                images = await self._extract_images(soup, url)
                if images and len(images) > 0:
                    data['assets'] = images
                else:
                    # Fallback to basic image extraction
                    assets = []
                    image_selectors = [
                        '.lwPropertyDetailsImage img', '.lwPropertyDetailsCarousel img',
                        '.property-images img', '.detail-images img', '.carousel-item img',
                        '.gallery img', '.property-gallery img', '.listing-image img'
                    ]
                    
                    for selector in image_selectors:
                        images = soup.select(selector)
                        for i, img in enumerate(images):
                            src = img.get('src') or img.get('data-src')
                            if src and not self._is_icon_or_logo(src):
                                assets.append({
                                    'id': f"asset-{i+1}",
                                    'type': 'image',
                                    'url': src,
                                    'thumbnail': src,
                                    'title': img.get('alt', f"Property Image {i+1}"),
                                    'description': img.get('alt', ''),
                                    'selected': i == 0
                                })
                    
                    if assets:
                        # Remove duplicates
                        unique_assets = []
                        seen_urls = set()
                        for asset in assets:
                            if asset['url'] not in seen_urls:
                                seen_urls.add(asset['url'])
                                unique_assets.append(asset)
                        
                        data['assets'] = unique_assets
                    
            # Add metadata
            data['source'] = {
                'url': url,
                'website': 'landwatch.com',
                'extracted_at': datetime.datetime.now().isoformat()
            }
            
            # Calculate confidence score based on completeness
            required_fields = ['title', 'price', 'description', 'acreage', 'location']
            confidence = sum(1 for field in required_fields if field in data) / len(required_fields)
            data['confidence'] = confidence
            
            return data
            
        except Exception as e:
            logger.error(f"Error in LandWatch extraction: {e}")
            return data
            
    async def _extract_images(self, soup: BeautifulSoup, url: str) -> List[Dict[str, Any]]:
        """Extract property images from LandWatch"""
        images = []
        
        # Track if we've found good images
        found_real_images = False
        
        # First try to extract images from JSON data in scripts which is more reliable
        scripts = soup.find_all('script', {'type': 'application/json'})
        for script in scripts:
            if not script.string:
                continue
            
            try:
                script_json = json.loads(script.string)
                
                # Look for LandWatch's image data structures
                if isinstance(script_json, dict):
                    # Check for image data in various possible paths
                    image_paths = [
                        'props.pageProps.listing.photos',
                        'props.pageProps.property.photos',
                        'props.pageProps.photos',
                        'pageProps.listing.photos',
                        'pageProps.property.photos',
                        'listing.photos',
                        'property.photos',
                        'photos'
                    ]
                    
                    for path in image_paths:
                        imgs = script_json
                        for key in path.split('.'):
                            if isinstance(imgs, dict) and key in imgs:
                                imgs = imgs[key]
                            else:
                                imgs = None
                                break
                        
                        if imgs and isinstance(imgs, list) and len(imgs) > 0:
                            logger.info(f"Found {len(imgs)} LandWatch images in JSON data")
                            
                            # Extract images
                            for i, img_data in enumerate(imgs):
                                if isinstance(img_data, dict):
                                    # More common LandWatch image structure
                                    img_url = img_data.get('url') or img_data.get('imageUrl') or img_data.get('src')
                                    
                                    # Skip non-image URLs, icons, and logos
                                    if not img_url or self._is_icon_or_logo(img_url):
                                        continue
                                    
                                    # Create asset for this image
                                    images.append({
                                        'id': f'asset-{i+1}',
                                        'type': 'image',
                                        'url': img_url,
                                        'thumbnail': img_data.get('thumbnailUrl', img_url),
                                        'title': img_data.get('title', f"Property Image {i+1}"),
                                        'description': img_data.get('caption', ''),
                                        'selected': i == 0
                                    })
                                elif isinstance(img_data, str):
                                    # Sometimes LandWatch just has a string array of URLs
                                    img_url = img_data
                                    if not img_url or self._is_icon_or_logo(img_url):
                                        continue
                                    
                                    images.append({
                                        'id': f'asset-{i+1}',
                                        'type': 'image',
                                        'url': img_url,
                                        'thumbnail': img_url,
                                        'title': f"Property Image {i+1}",
                                        'description': '',
                                        'selected': i == 0
                                    })
                            
                            found_real_images = True
                            break
                    
                    if found_real_images:
                        break
            except json.JSONDecodeError:
                continue
        
        # If we didn't find images in JSON, look for image galleries in HTML
        if not found_real_images:
            # Look for image galleries in the current LandWatch design
            image_containers = soup.select('.listingSlides, .property-gallery, .listing-media, .swiper-wrapper, .lwPropertyDetailsGallery, .gallery-container')
            
            for container in image_containers:
                img_elements = container.select('img[src]')
                for i, img in enumerate(img_elements):
                    img_url = img.get('src', '')
                    data_src = img.get('data-src', '')
                    
                    if data_src and not self._is_icon_or_logo(data_src):
                        # Data-src is often higher resolution
                        url = data_src
                    elif img_url and not self._is_icon_or_logo(img_url):
                        url = img_url
                    else:
                        continue
                    
                    alt_text = img.get('alt', '')
                    title = img.get('title', '')
                    
                    images.append({
                        'id': f'asset-{i+1}',
                        'type': 'image',
                        'url': url,
                        'thumbnail': url,
                        'title': title or alt_text or f"Property Image {i+1}",
                        'description': alt_text,
                        'selected': i == 0
                    })
        
        # If still no images, try looking for larger isolated images
        if not images:
            lead_image = soup.select_one('.lead-image img, .main-image img, .property-lead-image img')
            if lead_image and lead_image.get('src'):
                img_url = lead_image.get('src')
                if not self._is_icon_or_logo(img_url):
                    images.append({
                        'id': 'asset-1',
                        'type': 'image',
                        'url': img_url,
                        'thumbnail': img_url,
                        'title': lead_image.get('alt', 'Property Image 1'),
                        'description': lead_image.get('alt', ''),
                        'selected': True
                    })
        
        # Check for background images set via inline style
        if not images:
            try:
                bg_elements = soup.select('[style*="background-image"]')
                for i, elem in enumerate(bg_elements):
                    style = elem.get('style', '')
                    bg_url_match = re.search(r'background-image\s*:\s*url\([\'"]?([^\'"]+)[\'"]?\)', style)
                    if bg_url_match:
                        img_url = bg_url_match.group(1)
                        if not self._is_icon_or_logo(img_url):
                            images.append({
                                'id': f'asset-{i+1}',
                                'type': 'image',
                                'url': img_url,
                                'thumbnail': img_url,
                                'title': f"Property Image {i+1}",
                                'description': 'Background Image',
                                'selected': i == 0
                            })
            except Exception as e:
                logger.warning(f"Error extracting background images: {e}")
        
        # Filter out duplicates
        unique_images = []
        seen_urls = set()
        for img in images:
            if img['url'] not in seen_urls:
                seen_urls.add(img['url'])
                unique_images.append(img)
        
        return unique_images

    async def _basic_extract_data(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Basic fallback extraction for LandWatch using trained selectors"""
        data = {}
        
        try:
            # Extract title
            title_elem = soup.select_one('h1')
            if title_elem:
                data['title'] = self._clean_text(title_elem.get_text())
            
            # Extract price
            price_elem = soup.select_one('.price, .property-price, span.lwPrice')
            if price_elem:
                price_text = price_elem.get_text()
                data['price'] = self._clean_price_string(price_text)
            
            # Extract acreage - look for specific patterns
            acreage_pattern = re.compile(r'(\d+\.?\d*)\s*acres?', re.IGNORECASE)
            
            # Try to find acreage in page text
            for elem in soup.select('p, div, span, li'):
                match = acreage_pattern.search(elem.get_text())
                if match:
                    try:
                        data['acreage'] = float(match.group(1))
                        break
                    except ValueError:
                        pass
            
            # Extract location from URL
            path_parts = url.split('/')
            state_county_part = None
            for part in path_parts:
                if '-county-' in part and part.endswith('for-sale'):
                    state_county_part = part
                    break
            
            if state_county_part:
                match = re.search(r'(.+)-county-(.+)-for-sale', state_county_part)
                if match:
                    county = match.group(1).replace('-', ' ').title()
                    state = match.group(2).replace('-', ' ').title()
                    
                    # Check if state is an abbreviation
                    if len(state) == 2:
                        state_abbr = state.upper()
                    else:
                        # Map state name to abbreviation
                        state_name_to_abbr = {v.lower(): k for k, v in self._get_states_map().items()}
                        state_abbr = state_name_to_abbr.get(state.lower(), state)
                    
                    data['location'] = {
                        'county': county,
                        'state': state_abbr
                    }
                    data['state'] = state_abbr
            
            # Extract property type from URL or content
            property_type = 'land'  # Default
            
            if 'farms-and-ranches' in url:
                property_type = 'farm'
            elif 'hunting-property' in url:
                property_type = 'recreational'
            elif 'waterfront-property' in url:
                property_type = 'waterfront'
            
            data['property_type'] = property_type
            
            # Extract images
            images = []
            for img in soup.select('img'):
                src = img.get('src')
                if src and ('landwatch.com' in src or 'lwimages.com' in src) and not src.endswith(('.png', '.gif')):
                    images.append({
                        'id': f"image-{len(images)+1}",
                        'type': 'image',
                        'url': src,
                        'thumbnail': src
                    })
            
            if images:
                data['assets'] = images
            
            return data
            
        except Exception as e:
            logger.error(f"Error in LandWatch basic extraction: {e}")
            return data