"""
Zillow property extractor module.
This module provides specialized extraction functionality for Zillow.com property listings.
"""

import re
import json
import logging
from typing import Dict, Any, List, Optional, Union
from bs4 import BeautifulSoup, Tag
from urllib.parse import urlparse, urljoin

logger = logging.getLogger(__name__)

class ZillowExtractor:
    """Specialized extractor for Zillow.com property listings"""
    
    def __init__(self):
        self.source_name = "Zillow"
        self.domain_patterns = ["zillow.com"]
    
    def can_handle(self, url: str) -> bool:
        """Check if this extractor can handle the given URL"""
        return any(pattern in url.lower() for pattern in self.domain_patterns)
    
    def extract(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """
        Extract property data from Zillow.com HTML
        
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
            "source_domain": "zillow.com",
            "extractor_used": "zillow_specialized"
        }
        
        try:
            # Look for next-data script which contains listing details in JSON format
            json_data = self._extract_json_data(soup)
            
            if json_data:
                self._extract_from_json(json_data, data)
            else:
                # Fallback to HTML extraction if JSON data isn't available
                self._extract_from_html(soup, data)
            
            # Extract images regardless of extraction method
            self._extract_images(soup, data, url)
            
            # Clean and format the data
            self._clean_data(data)
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting Zillow data: {str(e)}")
            data["extraction_error"] = str(e)
            return data
    
    def _extract_json_data(self, soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
        """Extract JSON data from script tags"""
        # Try to find the Zillow next-data script containing property details
        for script in soup.find_all('script'):
            script_text = script.string
            if not script_text:
                continue
                
            # Look for script with property data
            if 'hdpGlobalData' in script_text:
                try:
                    # Extract the JSON data from the script
                    match = re.search(r'hdpGlobalData\s*=\s*({.*?});', script_text, re.DOTALL)
                    if match:
                        return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            
            # Look for another data format used by Zillow
            if '"apiCache"' in script_text:
                try:
                    match = re.search(r'({"apiCache":.+})\s*</script>', script_text, re.DOTALL)
                    if match:
                        return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
                    
        return None
    
    def _extract_from_json(self, json_data: Dict[str, Any], data: Dict[str, Any]) -> None:
        """Extract property data from Zillow's JSON data"""
        try:
            # Navigate the JSON structure to find property details
            property_data = None
            
            # Try different known structures from Zillow JSON
            if 'apiCache' in json_data:
                # Find property data in the API cache
                # Zillow's structure can vary, so we need to look for patterns
                for key in json_data['apiCache']:
                    if '"property"' in key:
                        cache_data = json.loads(json_data['apiCache'][key])
                        if 'property' in cache_data:
                            property_data = cache_data['property']
                            break
            elif 'property' in json_data:
                property_data = json_data['property']
            
            if not property_data:
                return
            
            # Extract basic details
            if 'price' in property_data:
                price_str = str(property_data['price'])
                # Remove non-numeric characters except decimal point
                price_str = re.sub(r'[^\d.]', '', price_str)
                if price_str:
                    data['price'] = float(price_str)
                    
            if 'address' in property_data:
                address = property_data['address']
                location_parts = {}
                
                if 'streetAddress' in address:
                    location_parts['address'] = address['streetAddress']
                if 'city' in address:
                    location_parts['city'] = address['city']
                if 'state' in address:
                    location_parts['state'] = address['state']
                    data['state'] = address['state']
                if 'zipcode' in address:
                    location_parts['zipcode'] = address['zipcode']
                    
                data['location'] = location_parts
            
            # Extract lot size for acreage
            if 'lotSize' in property_data:
                lot_size = property_data['lotSize']
                if 'acres' in lot_size and lot_size['acres']:
                    data['acreage'] = float(lot_size['acres'])
                elif 'sqft' in lot_size and lot_size['sqft']:
                    # Convert square feet to acres
                    sqft = float(lot_size['sqft'])
                    data['acreage'] = sqft / 43560
            
            # Extract description
            if 'description' in property_data:
                data['description'] = property_data['description']
                
            # Extract title from address or homeInfo
            if 'address' in property_data:
                address = property_data['address']
                address_parts = []
                
                for part in ['streetAddress', 'city', 'state', 'zipcode']:
                    if part in address and address[part]:
                        address_parts.append(address[part])
                
                if address_parts:
                    data['title'] = ', '.join(address_parts)
            
            # Extract coordinates
            if 'latitude' in property_data and 'longitude' in property_data:
                data['coordinates']['latitude'] = property_data['latitude']
                data['coordinates']['longitude'] = property_data['longitude']
            
            # Extract property type
            if 'propertyType' in property_data:
                prop_type = property_data['propertyType']
                if isinstance(prop_type, str):
                    data['property_type'] = self._normalize_property_type(prop_type)
                elif isinstance(prop_type, dict) and 'display' in prop_type:
                    data['property_type'] = self._normalize_property_type(prop_type['display'])
            
            # Extract features from facts or features list
            if 'facts' in property_data:
                facts = property_data['facts']
                for key, value in facts.items():
                    if isinstance(value, (str, int, float, bool)):
                        data['features'].append({
                            "name": key,
                            "value": value
                        })
            
            if 'features' in property_data:
                features = property_data['features']
                if isinstance(features, list):
                    for feature in features:
                        if isinstance(feature, str):
                            data['features'].append({
                                "name": feature,
                                "value": True
                            })
                        elif isinstance(feature, dict) and 'text' in feature:
                            data['features'].append({
                                "name": feature['text'],
                                "value": True
                            })
            
        except Exception as e:
            logger.error(f"Error extracting from Zillow JSON: {str(e)}")
    
    def _extract_from_html(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property data from Zillow.com HTML structure"""
        # Extract title
        title_selectors = [
            "h1.ds-address-container", 
            ".summary-container h1",
            "[data-testid='home-details-summary-container'] h1"
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                data["title"] = self._clean_text(title_elem.text)
                break
        
        # Extract price
        price_selectors = [
            ".ds-summary-row span[data-testid='price']", 
            ".summary-container .price",
            "[data-testid='price']"
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = self._clean_text(price_elem.text)
                data["price"] = self._parse_price(price_text)
                break
        
        # Extract acreage/lot size
        lot_size_selectors = [
            "[data-testid='lot-size-value']",
            ".ds-home-facts-and-features .ds-bed-bath-living-area-container span:last-child",
            ".home-facts-at-a-glance-section *:contains('Lot size')",
            ".ds-home-facts-table tr:contains('Lot')"
        ]
        
        for selector in lot_size_selectors:
            lot_elem = None
            if ':contains' in selector:
                # Handle jQuery-like :contains() selector
                parent_selector = selector.split(':contains')[0]
                search_text = selector.split('(')[1].split(')')[0].strip("'\"")
                parent_elems = soup.select(parent_selector)
                
                for elem in parent_elems:
                    if search_text in elem.text:
                        # Find value in the next sibling or container
                        if elem.find_next():
                            lot_elem = elem.find_next()
                        break
            else:
                lot_elem = soup.select_one(selector)
                
            if lot_elem:
                lot_text = self._clean_text(lot_elem.text)
                # Handle different formats: "0.5 acres", "21,780 sqft"
                if 'acre' in lot_text.lower():
                    match = re.search(r'([\d,.]+)\s*acres?', lot_text, re.IGNORECASE)
                    if match:
                        data["acreage"] = float(match.group(1).replace(',', ''))
                elif 'sqft' in lot_text.lower() or 'sq ft' in lot_text.lower() or 'sq. ft.' in lot_text.lower():
                    match = re.search(r'([\d,.]+)\s*sq', lot_text, re.IGNORECASE)
                    if match:
                        sqft = float(match.group(1).replace(',', ''))
                        # Convert square feet to acres
                        data["acreage"] = sqft / 43560
                break
        
        # Extract description
        desc_selectors = [
            "[data-testid='description'] div",
            ".ds-overview-section div[data-testid='expanded-description']",
            ".property-information",
            ".zsg-content-component.description"
        ]
        
        for selector in desc_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                data["description"] = self._clean_text(desc_elem.text)
                break
        
        # Extract location/address
        address_selectors = [
            "[data-testid='home-details-summary-container'] h1",
            ".ds-address-container",
            ".summary-container h1"
        ]
        
        for selector in address_selectors:
            address_elem = soup.select_one(selector)
            if address_elem:
                full_address = self._clean_text(address_elem.text)
                
                # Try to extract components from the address
                # Common pattern: "123 Main St, City, ST 12345"
                location_parts = {}
                location_parts["address"] = full_address
                
                parts = full_address.split(',')
                if len(parts) >= 3:
                    # First part likely the street address
                    location_parts["street"] = parts[0].strip()
                    
                    # Second part likely the city
                    location_parts["city"] = parts[1].strip()
                    
                    # Last part likely state and zip
                    state_zip = parts[2].strip()
                    state_match = re.search(r'([A-Z]{2})', state_zip)
                    if state_match:
                        location_parts["state"] = state_match.group(1)
                        data["state"] = state_match.group(1)
                
                data["location"] = location_parts
                break
        
        # Extract features from the facts table
        facts_selectors = [
            ".ds-home-facts-table tr",
            ".home-facts-at-a-glance-section div[class*='List'] div[class*='Row']",
            "[data-testid='facts-list'] li"
        ]
        
        for selector in facts_selectors:
            fact_elems = soup.select(selector)
            if fact_elems:
                for elem in fact_elems:
                    # Try to find label and value pairs
                    label_elem = elem.find(['th', 'span', 'div'], attrs={'class': lambda c: c and ('label' in c.lower() or 'fact-label' in c.lower())}) if elem.name != 'li' else None
                    value_elem = elem.find(['td', 'span', 'div'], attrs={'class': lambda c: c and ('value' in c.lower() or 'fact-value' in c.lower())}) if elem.name != 'li' else None
                    
                    if label_elem and value_elem:
                        label = self._clean_text(label_elem.text)
                        value = self._clean_text(value_elem.text)
                        
                        if label and value:
                            data["features"].append({
                                "name": label,
                                "value": value
                            })
                    elif elem.name == 'li':
                        # For li elements, just extract the text
                        feature_text = self._clean_text(elem.text)
                        if feature_text:
                            # Try to split into name:value pairs
                            if ':' in feature_text:
                                name, value = feature_text.split(':', 1)
                                data["features"].append({
                                    "name": name.strip(),
                                    "value": value.strip()
                                })
                            else:
                                data["features"].append({
                                    "name": feature_text,
                                    "value": True
                                })
                break
    
    def _extract_images(self, soup: BeautifulSoup, data: Dict[str, Any], base_url: str) -> None:
        """Extract property images"""
        images = []
        
        # Try to extract images from JSON data first
        script_tags = soup.find_all('script', type="application/json")
        for script in script_tags:
            try:
                script_text = script.string
                if not script_text:
                    continue
                    
                json_data = json.loads(script_text)
                
                # Look for image data in different possible Zillow JSON structures
                if 'imageData' in json_data:
                    image_data = json_data['imageData']
                    if isinstance(image_data, dict) and 'images' in image_data:
                        for i, img in enumerate(image_data['images']):
                            if 'url' in img and not self._is_icon_or_logo(img['url']):
                                images.append({
                                    "id": f"image-{i+1}",
                                    "type": "image",
                                    "url": img['url'],
                                    "thumbnail": img.get('thumbnail', img['url']),
                                    "title": img.get('caption', f"Property Image {i+1}")
                                })
                
                # Alternative structure for images
                if 'photos' in json_data:
                    for i, photo in enumerate(json_data['photos']):
                        if 'url' in photo and not self._is_icon_or_logo(photo['url']):
                            images.append({
                                "id": f"image-{i+1}",
                                "type": "image",
                                "url": photo['url'],
                                "thumbnail": photo.get('thumbnail', photo['url']),
                                "title": photo.get('caption', f"Property Image {i+1}")
                            })
            except (json.JSONDecodeError, TypeError):
                pass
        
        # If no images found in JSON, try HTML elements
        if not images:
            # Check for image gallery
            gallery_selectors = [
                ".media-stream-container img", 
                ".photo-carousel-container img",
                "[data-testid='hdp-hero-img']",
                ".photo-tile-image"
            ]
            
            for selector in gallery_selectors:
                image_elements = soup.select(selector)
                if image_elements:
                    for i, img in enumerate(image_elements):
                        src = img.get("src", "")
                        data_src = img.get("data-src", "")
                        aria_hidden = img.get("aria-hidden")
                        
                        # Skip hidden images
                        if aria_hidden == "true":
                            continue
                        
                        # Prefer data-src over src for lazy-loaded images
                        image_url = data_src if data_src else src
                        
                        # Skip if not a valid image
                        if not image_url or self._is_icon_or_logo(image_url):
                            continue
                        
                        # Handle relative URLs
                        if image_url.startswith("/"):
                            from urllib.parse import urlparse
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
            
        # If we couldn't extract a title, create one from location and property type
        if not data["title"] and data["location"]:
            title_parts = []
            
            if data["property_type"]:
                title_parts.append(data["property_type"].capitalize())
                
            if "city" in data["location"] and data["location"]["city"]:
                title_parts.append(f"in {data['location']['city']}")
                
            if "state" in data["location"] and data["location"]["state"]:
                title_parts.append(data["location"]["state"])
                
            if title_parts:
                data["title"] = " ".join(title_parts)
                
        # If we don't have coordinates but have an address, set coordinates to null
        # rather than 0,0 to avoid incorrect mapping
        if (data["coordinates"]["latitude"] == 0 or data["coordinates"]["latitude"] is None) and \
           (data["coordinates"]["longitude"] == 0 or data["coordinates"]["longitude"] is None) and \
           data["location"]:
            data["coordinates"]["latitude"] = None
            data["coordinates"]["longitude"] = None
    
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
        
        # Look for first occurrence of a dollar amount
        match = re.search(r'\$\s*([\d,]+)', price_str)
        if match:
            try:
                # Remove commas from the number
                price = match.group(1).replace(',', '')
                return float(price)
            except (ValueError, IndexError):
                pass
                
        # Try extracting just digits if the dollar sign approach didn't work
        match = re.search(r'([\d,]+)', price_str)
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
        
        # Mapping of Zillow property types to our standard types
        property_type_map = {
            "land": ["lot", "land", "vacant land", "vacant lot", "parcel"],
            "farm": ["farm", "farmland", "agriculture", "agricultural"],
            "ranch": ["ranch", "ranches", "cattle", "livestock", "grazing"],
            "residential": ["house", "home", "building", "residential", "homesite", "lot/land zoned residential"],
            "commercial": ["commercial", "business", "retail", "office", "industrial", "commercial lot/land"],
            "recreational": ["recreation", "recreational", "camping", "hunting", "fishing"],
            "waterfront": ["waterfront", "lakefront", "riverfront", "beachfront", "oceanfront", "lake", "river", "beach"],
            "mountain": ["mountain", "mountainside", "mountain view", "hills", "hillside"]
        }
        
        # Find the matching property type
        for normalized_type, keywords in property_type_map.items():
            if any(keyword in property_type for keyword in keywords):
                return normalized_type
                
        # Default to land
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