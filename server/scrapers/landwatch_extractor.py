"""
LandWatch property extractor module.
This module provides specialized extraction functionality for LandWatch.com property listings.
"""

import re
import json
import logging
from typing import Dict, Any, List, Optional, Union
from bs4 import BeautifulSoup, Tag
from urllib.parse import urlparse, urljoin

logger = logging.getLogger(__name__)

class LandWatchExtractor:
    """Specialized extractor for LandWatch.com property listings"""
    
    def __init__(self):
        self.source_name = "LandWatch"
        self.domain_patterns = ["landwatch.com"]
    
    def can_handle(self, url: str) -> bool:
        """Check if this extractor can handle the given URL"""
        return any(pattern in url.lower() for pattern in self.domain_patterns)
    
    def extract(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """
        Extract property data from LandWatch.com HTML
        
        Args:
            soup: BeautifulSoup object with parsed HTML
            url: Original URL of the listing
            
        Returns:
            Dict containing extracted property data
        """
        # Initialize the data structure with source URL
        data = {
            "title": "",
            "description": "",
            "price": None,
            "acreage": None,
            "location": {},
            "coordinates": {"latitude": None, "longitude": None},
            "property_type": "land",
            "features": [],
            "assets": [],
            "documents": [],
            "source_url": url,
            "source_domain": "landwatch.com",
            "extractor_used": "landwatch_specialized"
        }
        
        try:
            # Look for data from JSON-LD script
            json_ld_data = self._extract_json_ld(soup)
            
            if json_ld_data:
                # Extract data from JSON-LD
                self._extract_from_json_ld(json_ld_data, data)
            
            # Extract data from structured HTML elements
            self._extract_from_html(soup, data)
            
            # Extract property images
            self._extract_images(soup, data, url)
            
            # Clean and format the data
            self._clean_data(data)
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting LandWatch data: {str(e)}")
            data["extraction_error"] = str(e)
            return data
    
    def _extract_json_ld(self, soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
        """Extract JSON-LD data for the property"""
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        
        for script in json_ld_scripts:
            try:
                json_data = json.loads(script.string)
                
                # Check if it's a property listing
                if '@type' in json_data and json_data['@type'] in ['RealEstateListing', 'Product', 'Place']:
                    return json_data
            except (json.JSONDecodeError, TypeError, AttributeError):
                pass
                
        return None
    
    def _extract_from_json_ld(self, json_ld: Dict[str, Any], data: Dict[str, Any]) -> None:
        """Extract property details from JSON-LD data"""
        # Extract title
        if 'name' in json_ld:
            data["title"] = json_ld['name']
        
        # Extract description
        if 'description' in json_ld:
            data["description"] = json_ld['description']
        
        # Extract price
        if 'offers' in json_ld and isinstance(json_ld['offers'], dict):
            offer = json_ld['offers']
            if 'price' in offer:
                try:
                    data["price"] = float(offer['price'])
                except (ValueError, TypeError):
                    pass
        
        # Extract location information
        if 'address' in json_ld and isinstance(json_ld['address'], dict):
            address = json_ld['address']
            location_parts = {}
            
            if 'streetAddress' in address:
                location_parts['address'] = address['streetAddress']
            if 'addressLocality' in address:
                location_parts['city'] = address['addressLocality']
            if 'addressRegion' in address:
                location_parts['state'] = address['addressRegion']
                data['state'] = address['addressRegion']
            if 'postalCode' in address:
                location_parts['zipcode'] = address['postalCode']
                
            data['location'] = location_parts
        
        # Extract geo coordinates
        if 'geo' in json_ld and isinstance(json_ld['geo'], dict):
            geo = json_ld['geo']
            if 'latitude' in geo and 'longitude' in geo:
                try:
                    data['coordinates']['latitude'] = float(geo['latitude'])
                    data['coordinates']['longitude'] = float(geo['longitude'])
                except (ValueError, TypeError):
                    pass
    
    def _extract_from_html(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property data from HTML structure"""
        # Extract title if not already found in JSON-LD
        if not data["title"]:
            title_selectors = [
                "h1.property-title", 
                ".property-title h1",
                ".listing-title",
                ".property-header h1"
            ]
            
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    data["title"] = self._clean_text(title_elem.text)
                    break
        
        # Extract price if not already found in JSON-LD
        if not data["price"]:
            price_selectors = [
                ".property-price", 
                ".property-header .price",
                ".listing-price",
                ".price-container .price"
            ]
            
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = self._clean_text(price_elem.text)
                    data["price"] = self._parse_price(price_text)
                    break
        
        # Extract acreage - LandWatch specializes in land, so this is critical
        acreage_selectors = [
            ".property-acres", 
            ".property-details .acres",
            ".listing-acres",
            ".property-size-acres",
            ".property-attributes li:contains('Acres')"
        ]
        
        for selector in acreage_selectors:
            acreage_elem = None
            
            if ':contains' in selector:
                # Handle jQuery-like :contains() selector
                parent_selector = selector.split(':contains')[0]
                search_text = selector.split('(')[1].split(')')[0].strip("'\"")
                parent_elems = soup.select(parent_selector)
                
                for elem in parent_elems:
                    if search_text in elem.text:
                        acreage_elem = elem
                        break
            else:
                acreage_elem = soup.select_one(selector)
                
            if acreage_elem:
                acreage_text = self._clean_text(acreage_elem.text)
                # Parse acreage with a regex to handle formats like "10.5 acres" or "Acres: 10.5"
                match = re.search(r'([\d,.]+)\s*acres?|acres?[:\s]+([\d,.]+)', acreage_text, re.IGNORECASE)
                if match:
                    try:
                        # The regex has two capture groups - use the one that matched
                        acreage_value = match.group(1) if match.group(1) else match.group(2)
                        data["acreage"] = float(acreage_value.replace(',', ''))
                    except (ValueError, TypeError, IndexError):
                        pass
                break
        
        # Extract description if not already found in JSON-LD
        if not data["description"]:
            desc_selectors = [
                ".property-description", 
                ".description-text",
                ".listing-description",
                "#description"
            ]
            
            for selector in desc_selectors:
                desc_elem = soup.select_one(selector)
                if desc_elem:
                    data["description"] = self._clean_text(desc_elem.text)
                    break
        
        # Extract property type
        type_selectors = [
            ".property-type", 
            ".listing-type",
            ".property-header .type",
            ".property-attributes li:contains('Property Type')"
        ]
        
        for selector in type_selectors:
            type_elem = None
            
            if ':contains' in selector:
                # Handle jQuery-like :contains() selector
                parent_selector = selector.split(':contains')[0]
                search_text = selector.split('(')[1].split(')')[0].strip("'\"")
                parent_elems = soup.select(parent_selector)
                
                for elem in parent_elems:
                    if search_text in elem.text:
                        # Try to find the value in a sibling element
                        if elem.find_next_sibling():
                            type_elem = elem.find_next_sibling()
                        else:
                            # Value might be in the same element after the label
                            type_text = elem.text.split(':', 1)
                            if len(type_text) > 1:
                                data["property_type"] = self._normalize_property_type(type_text[1].strip())
                        break
            else:
                type_elem = soup.select_one(selector)
                
            if type_elem:
                property_type = self._clean_text(type_elem.text)
                data["property_type"] = self._normalize_property_type(property_type)
                break
        
        # Extract location information if not already found in JSON-LD
        if not data["location"] or len(data["location"]) == 0:
            location_selectors = [
                ".property-location", 
                ".property-address",
                ".listing-location",
                ".property-header .location"
            ]
            
            for selector in location_selectors:
                location_elem = soup.select_one(selector)
                if location_elem:
                    location_text = self._clean_text(location_elem.text)
                    location_parts = {}
                    location_parts["address"] = location_text
                    
                    # Try to parse city, state from the location text
                    # Common format: "City, State"
                    parts = location_text.split(',')
                    if len(parts) >= 2:
                        location_parts["city"] = parts[0].strip()
                        
                        # Extract state - look for 2-letter state code
                        state_part = parts[1].strip()
                        state_match = re.search(r'\b([A-Z]{2})\b', state_part)
                        if state_match:
                            location_parts["state"] = state_match.group(1)
                            data["state"] = state_match.group(1)
                    
                    data["location"] = location_parts
                    break
        
        # Extract coordinates if not already found in JSON-LD
        if not data["coordinates"]["latitude"] or not data["coordinates"]["longitude"]:
            # LandWatch often includes coordinates in a script or data attributes
            scripts = soup.find_all('script')
            for script in scripts:
                script_text = script.string
                if not script_text:
                    continue
                
                # Look for latitude and longitude in the script
                lat_match = re.search(r'latitude["\s:=]+([+-]?\d+\.\d+)', script_text)
                lng_match = re.search(r'longitude["\s:=]+([+-]?\d+\.\d+)', script_text)
                
                if lat_match and lng_match:
                    try:
                        data["coordinates"]["latitude"] = float(lat_match.group(1))
                        data["coordinates"]["longitude"] = float(lng_match.group(1))
                        break
                    except (ValueError, TypeError, IndexError):
                        pass
        
        # Extract features from property details
        feature_selectors = [
            ".property-attributes li", 
            ".property-details li",
            ".listing-attributes li",
            ".property-features li"
        ]
        
        for selector in feature_selectors:
            feature_elements = soup.select(selector)
            if feature_elements:
                for elem in feature_elements:
                    feature_text = self._clean_text(elem.text)
                    if feature_text and ":" in feature_text:
                        # Split into name:value pairs
                        parts = feature_text.split(':', 1)
                        name = parts[0].strip()
                        value = parts[1].strip() if len(parts) > 1 else True
                        
                        data["features"].append({
                            "name": name,
                            "value": value
                        })
                    elif feature_text:
                        data["features"].append({
                            "name": feature_text,
                            "value": True
                        })
                break
    
    def _extract_images(self, soup: BeautifulSoup, data: Dict[str, Any], base_url: str) -> None:
        """Extract property images"""
        images = []
        
        # Check for image gallery
        gallery_selectors = [
            ".property-gallery img", 
            ".listing-gallery img",
            ".image-gallery img",
            ".photo-gallery img",
            ".photo-slideshow img"
        ]
        
        for selector in gallery_selectors:
            image_elements = soup.select(selector)
            if image_elements:
                for i, img in enumerate(image_elements):
                    src = img.get("src", "")
                    data_src = img.get("data-src", "")
                    
                    # Prefer data-src over src for lazy-loaded images
                    image_url = data_src if data_src else src
                    
                    # Skip if not a valid image
                    if not image_url or self._is_icon_or_logo(image_url):
                        continue
                    
                    # Handle relative URLs
                    if image_url.startswith("/"):
                        domain = "{0.scheme}://{0.netloc}".format(urlparse(base_url))
                        image_url = domain + image_url
                    
                    # Add image to assets
                    images.append({
                        "id": f"image-{i+1}",
                        "type": "image",
                        "url": image_url,
                        "thumbnail": image_url,
                        "title": img.get("alt", f"Property Image {i+1}")
                    })
        
        # Look for images in JSON data
        scripts = soup.find_all('script')
        for script in scripts:
            script_text = script.string
            if not script_text:
                continue
                
            # Look for image arrays
            img_array_match = re.search(r'var\s+images\s*=\s*(\[.+?\]);', script_text, re.DOTALL)
            if img_array_match:
                try:
                    img_data = json.loads(img_array_match.group(1))
                    if isinstance(img_data, list):
                        for i, img_info in enumerate(img_data):
                            if isinstance(img_info, dict) and "url" in img_info:
                                image_url = img_info["url"]
                                if not self._is_icon_or_logo(image_url):
                                    images.append({
                                        "id": f"json-image-{i+1}",
                                        "type": "image",
                                        "url": image_url,
                                        "thumbnail": img_info.get("thumbnail", image_url),
                                        "title": img_info.get("title", f"Property Image {i+1}")
                                    })
                except json.JSONDecodeError:
                    pass
        
        # Deduplicate images by URL
        unique_images = []
        seen_urls = set()
        
        for img in images:
            url = img["url"]
            if url not in seen_urls:
                seen_urls.add(url)
                unique_images.append(img)
        
        data["assets"] = unique_images
    
    def _clean_data(self, data: Dict[str, Any]) -> None:
        """Clean and normalize the extracted data"""
        # Ensure all text fields are properly cleaned
        if data["title"]:
            data["title"] = self._clean_text(data["title"])
            
        if data["description"]:
            data["description"] = self._clean_text(data["description"])
            
        # Normalize property type
        if data["property_type"]:
            data["property_type"] = self._normalize_property_type(data["property_type"])
        
        # If price is 0, set it to None
        if data["price"] == 0:
            data["price"] = None
            
        # Parse out special features from the description
        if data["description"]:
            description_lower = data["description"].lower()
            
            # Check for waterfront property
            waterfront_keywords = ['waterfront', 'lakefront', 'riverfront', 'oceanfront', 'pond', 'lake', 'river', 'creek', 'stream']
            if any(keyword in description_lower for keyword in waterfront_keywords):
                data["features"].append({
                    "name": "Water Feature",
                    "value": "Has water feature (derived from description)"
                })
            
            # Check for mountain/view property
            mountain_keywords = ['mountain', 'mountainside', 'view', 'vista', 'overlook', 'scenic', 'panoramic']
            if any(keyword in description_lower for keyword in mountain_keywords):
                data["features"].append({
                    "name": "Mountain/View",
                    "value": "Has mountain or view feature (derived from description)"
                })
            
            # Check for additional access information
            access_keywords = ['road access', 'accessible', 'driveway', 'easement']
            if any(keyword in description_lower for keyword in access_keywords):
                data["features"].append({
                    "name": "Access",
                    "value": "Has access information (derived from description)"
                })
    
    def _clean_text(self, text: str) -> str:
        """Clean up text by removing extra whitespace and newlines"""
        if not text:
            return ""
            
        # Convert to string if it's not already
        text = str(text)
        
        # Replace newlines and excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def _parse_price(self, price_str: str) -> Optional[float]:
        """Extract price value from string"""
        if not price_str:
            return None
            
        # Convert to string if it's not already
        price_str = str(price_str)
        
        # Look for dollar amount
        match = re.search(r'\$\s*([\d,]+)(?:\.\d+)?', price_str)
        if match:
            try:
                # Remove commas from the number
                price = match.group(1).replace(',', '')
                return float(price)
            except (ValueError, IndexError):
                pass
        
        # Try extracting just digits if the dollar sign approach didn't work
        match = re.search(r'([\d,]+)(?:\.\d+)?', price_str)
        if match:
            try:
                # Remove commas from the number
                price = match.group(1).replace(',', '')
                return float(price)
            except (ValueError, IndexError):
                pass
        
        return None
    
    def _normalize_property_type(self, property_type: str) -> str:
        """Normalize property type to standard values"""
        if not property_type:
            return "land"
            
        property_type = str(property_type).lower()
        
        # Mapping of property types to our standard types
        property_type_map = {
            "land": ["lot", "land", "vacant land", "vacant lot", "parcel", "acreage"],
            "farm": ["farm", "farmland", "agriculture", "agricultural"],
            "ranch": ["ranch", "ranches", "cattle", "livestock", "grazing"],
            "residential": ["house", "home", "building", "residential", "homesite"],
            "commercial": ["commercial", "business", "retail", "office", "industrial"],
            "recreational": ["recreation", "recreational", "camping", "hunting", "fishing"],
            "waterfront": ["waterfront", "lakefront", "riverfront", "beachfront", "oceanfront"],
            "mountain": ["mountain", "mountainside", "mountain view"]
        }
        
        # Find the matching property type
        for normalized_type, keywords in property_type_map.items():
            if any(keyword in property_type for keyword in keywords):
                return normalized_type
                
        # Default to land since we're on LandWatch
        return "land"
    
    def _is_icon_or_logo(self, url: Union[str, List[str]]) -> bool:
        """Check if the URL points to an icon or logo rather than a property image"""
        if not url:
            return True
            
        # Handle case where url might be a list
        if isinstance(url, list):
            if not url:
                return True
            url_str = str(url[0])
        else:
            url_str = str(url)

        # These patterns suggest icons/logos rather than property images
        icon_patterns = [
            'logo', 'icon', 'favicon', 'banner', 'marker', 'avatar',
            'pixel', 'blank', 'button', 'badge', 'sprite', 'loading',
            'placeholder', 'profile', 'thumbnail-', 'symbol', 'header'
        ]
        
        url_lower = url_str.lower()
        
        # Check for icon/logo patterns in the URL
        for pattern in icon_patterns:
            if pattern in url_lower:
                return True
                
        # Check file extensions that are typically not property photos
        if url_lower.endswith(('.svg', '.gif', '.ico')):
            return True
        
        # Check for image dimensions in URL (e.g., 30x30, 50x50)
        dim_match = re.search(r'(\d+)x(\d+)', url_lower)
        if dim_match:
            try:
                width = int(dim_match.group(1))
                height = int(dim_match.group(2))
                # Skip small images likely to be icons/logos
                if width < 200 or height < 200:
                    return True
            except (ValueError, IndexError):
                pass
                
        # Check for very short URLs which are often icons/logos
        if len(url_lower) < 40 and ('/img/' in url_lower or '/images/' in url_lower or '/icons/' in url_lower):
            return True
            
        # Check for data URIs (not likely to be property images)
        if url_lower.startswith('data:image'):
            return True
            
        return False