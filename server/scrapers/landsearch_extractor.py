"""
LandSearch property extractor module.
This module provides specialized extraction functionality for LandSearch.com property listings.
"""

import re
import json
import logging
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)

class LandSearchExtractor:
    """Specialized extractor for LandSearch.com property listings"""
    
    def __init__(self):
        self.source_name = "LandSearch"
        self.domain_patterns = ["landsearch.com", "landtransactions.com"]
    
    def can_handle(self, url: str) -> bool:
        """Check if this extractor can handle the given URL"""
        return any(pattern in url.lower() for pattern in self.domain_patterns)
    
    def extract(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """
        Extract property data from LandSearch.com HTML
        
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
            "source_url": url
        }
        
        try:
            # Extract basic property information
            self._extract_basic_info(soup, data)
            
            # Extract price and acreage
            self._extract_price_and_acreage(soup, data)
            
            # Extract location information
            self._extract_location(soup, data)
            
            # Extract property images
            self._extract_images(soup, data, url)
            
            # Extract property features
            self._extract_features(soup, data)
            
            # Extract coordinates
            self._extract_coordinates(soup, data)
            
            # Look for structured data
            self._extract_json_ld_data(soup, data)
            
            # Clean and format the data
            self._clean_data(data)
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting LandSearch data: {str(e)}")
            data["extraction_error"] = str(e)
            return data
    
    def _extract_basic_info(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract basic property information like title and description"""
        # Extract title
        title_selectors = [
            "h1.listing-title", 
            "h1.property-title",
            ".listing-detail-title h1", 
            ".listing-header h1",
            "h1.main-title"
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                data["title"] = self._clean_text(title_elem.text)
                break
        
        # Extract description
        description_selectors = [
            ".listing-description", 
            ".property-description",
            ".description-text",
            ".listing-details-description",
            "#description"
        ]
        
        for selector in description_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                data["description"] = self._clean_text(desc_elem.text)
                break
        
        # Extract property type
        type_selectors = [
            ".property-type",
            ".listing-type",
            ".property-details span.type",
            ".listing-details-type"
        ]
        
        for selector in type_selectors:
            type_elem = soup.select_one(selector)
            if type_elem:
                property_type = self._clean_text(type_elem.text).lower()
                data["property_type"] = self._normalize_property_type(property_type)
                break
                
        # Look for property type in the title if not found yet
        if not data["property_type"] and data["title"]:
            property_type_keywords = {
                "farm": ["farm", "farmland", "cultivation", "agricultural", "agriculture"],
                "ranch": ["ranch", "cattle", "livestock", "grazing"],
                "recreational": ["hunting", "fishing", "recreation", "recreational", "sporting"],
                "residential": ["home", "house", "residential", "homesite"],
                "commercial": ["commercial", "business", "retail", "office", "industrial"],
                "waterfront": ["waterfront", "lakefront", "riverfront", "beachfront", "oceanfront"],
                "mountain": ["mountain", "mountainside", "mountain view"],
                "timber": ["timber", "forest", "woodland", "trees"]
            }
            
            title_lower = data["title"].lower()
            for type_name, keywords in property_type_keywords.items():
                if any(keyword in title_lower for keyword in keywords):
                    data["property_type"] = type_name
                    break
    
    def _extract_price_and_acreage(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract price and acreage information"""
        # Extract price
        price_selectors = [
            ".listing-price", 
            ".property-price",
            ".price-value",
            ".listing-details-price",
            ".main-price"
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = self._clean_text(price_elem.text)
                data["price"] = self._parse_price(price_text)
                break
        
        # If price wasn't found with selectors, try regex on the entire page
        if data["price"] is None:
            page_text = soup.get_text()
            price_patterns = [
                r'\$([0-9,.]+)',  # $100,000
                r'Price:\s*\$([0-9,.]+)',  # Price: $100,000
                r'Asking Price:\s*\$([0-9,.]+)'  # Asking Price: $100,000
            ]
            
            for pattern in price_patterns:
                match = re.search(pattern, page_text)
                if match:
                    try:
                        price_str = match.group(1).replace(',', '')
                        data["price"] = float(price_str)
                        break
                    except (ValueError, IndexError):
                        pass
        
        # Extract acreage
        acreage_selectors = [
            ".listing-acreage", 
            ".property-acreage",
            ".acreage-value",
            ".listing-details-acreage",
            ".main-acreage"
        ]
        
        for selector in acreage_selectors:
            acreage_elem = soup.select_one(selector)
            if acreage_elem:
                acreage_text = self._clean_text(acreage_elem.text)
                data["acreage"] = self._parse_acreage(acreage_text)
                break
        
        # If acreage wasn't found with selectors, try regex on the entire page
        if data["acreage"] is None:
            page_text = soup.get_text()
            acreage_patterns = [
                r'([0-9,.]+)\s*acres?',  # 100 acres
                r'([0-9,.]+)\s*ac\.?',  # 100 ac or 100 ac.
                r'Acreage:\s*([0-9,.]+)',  # Acreage: 100
                r'Acres:\s*([0-9,.]+)'  # Acres: 100
            ]
            
            for pattern in acreage_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    try:
                        acreage_str = match.group(1).replace(',', '')
                        data["acreage"] = float(acreage_str)
                        break
                    except (ValueError, IndexError):
                        pass
    
    def _extract_location(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract location information"""
        # Extract location
        location_selectors = [
            ".listing-location", 
            ".property-location",
            ".location-value",
            ".listing-details-location",
            ".main-location"
        ]
        
        location_parts = {}
        
        for selector in location_selectors:
            location_elem = soup.select_one(selector)
            if location_elem:
                location_text = self._clean_text(location_elem.text)
                location_parts["address"] = location_text
                break
        
        # Extract city, county, state from the location
        if "address" in location_parts:
            location_text = location_parts["address"]
            
            # Try to extract state - look for 2-letter state code
            state_match = re.search(r'\b([A-Z]{2})\b', location_text)
            if state_match:
                location_parts["state"] = state_match.group(1)
                data["state"] = state_match.group(1)
            else:
                # Try to extract state name
                states_dict = self._get_states_map()
                for state_name in states_dict.values():
                    if state_name in location_text:
                        location_parts["state"] = self._get_state_code(state_name)
                        data["state"] = location_parts["state"]
                        break
            
            # Try to extract city and county
            # Common pattern: "City, County County, ST"
            parts = location_text.split(',')
            if len(parts) >= 2:
                # First part is usually the city
                location_parts["city"] = parts[0].strip()
                
                # Check for county in the second part
                county_match = re.search(r'([A-Za-z\s]+) County', location_text)
                if county_match:
                    location_parts["county"] = county_match.group(1).strip()
        
        data["location"] = location_parts
    
    def _extract_images(self, soup: BeautifulSoup, data: Dict[str, Any], base_url: str) -> None:
        """Extract property images"""
        images = []
        
        # Check for image gallery
        gallery_selectors = [
            ".listing-gallery img", 
            ".property-gallery img",
            ".listing-photos img",
            ".gallery-item img",
            "[data-gallery] img"
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
        
        # Look for JSON data in scripts that might contain image information
        script_tags = soup.find_all("script", {"type": "application/ld+json"})
        for script in script_tags:
            try:
                json_data = json.loads(script.string)
                if isinstance(json_data, dict) and "image" in json_data:
                    image_data = json_data["image"]
                    
                    # Handle both string and array image data
                    image_urls = []
                    if isinstance(image_data, str):
                        image_urls.append(image_data)
                    elif isinstance(image_data, list):
                        image_urls.extend(image_data)
                        
                    for i, url in enumerate(image_urls):
                        if not self._is_icon_or_logo(url):
                            images.append({
                                "id": f"json-image-{i+1}",
                                "type": "image",
                                "url": url,
                                "thumbnail": url,
                                "title": f"Property Image {len(images) + 1}"
                            })
            except (json.JSONDecodeError, AttributeError):
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
    
    def _extract_features(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property features"""
        features = []
        
        # Look for feature lists
        feature_selectors = [
            ".listing-features li", 
            ".property-features li",
            ".features-list li",
            ".listing-amenities li",
            ".details-list li"
        ]
        
        for selector in feature_selectors:
            feature_elements = soup.select(selector)
            for element in feature_elements:
                feature_text = self._clean_text(element.text)
                if feature_text and len(feature_text) > 3:  # Ignore very short text
                    # Skip duplicates
                    if not any(f["name"] == feature_text for f in features):
                        features.append({
                            "name": feature_text,
                            "value": True
                        })
        
        # Look for property details tables
        detail_selectors = [
            ".listing-details tr", 
            ".property-details tr",
            ".details-table tr",
            ".specs-table tr"
        ]
        
        for selector in detail_selectors:
            detail_rows = soup.select(selector)
            for row in detail_rows:
                cells = row.find_all(['th', 'td'])
                if len(cells) >= 2:
                    key = self._clean_text(cells[0].text)
                    value = self._clean_text(cells[1].text)
                    
                    if key and value and len(key) > 1:
                        # Skip duplicates
                        if not any(f["name"] == key for f in features):
                            features.append({
                                "name": key,
                                "value": value
                            })
        
        # Extract from key-value pairs outside of lists and tables
        detail_sections = soup.select(".property-details, .listing-details, .details-section")
        for section in detail_sections:
            # For key-value pairs structured like <dt>Key</dt><dd>Value</dd>
            terms = section.find_all("dt")
            for term in terms:
                key = self._clean_text(term.text)
                value_elem = term.find_next("dd")
                if value_elem:
                    value = self._clean_text(value_elem.text)
                    if key and value:
                        features.append({
                            "name": key,
                            "value": value
                        })
            
            # For key-value pairs in divs with class patterns
            detail_items = section.select(".detail-item, .property-detail, .listing-detail, .spec-item")
            for item in detail_items:
                key_elem = item.select_one(".detail-label, .detail-key, .property-label, .spec-label")
                value_elem = item.select_one(".detail-value, .property-value, .spec-value")
                
                if key_elem and value_elem:
                    key = self._clean_text(key_elem.text)
                    value = self._clean_text(value_elem.text)
                    
                    if key and value:
                        features.append({
                            "name": key,
                            "value": value
                        })
        
        # Extract from description keywords for terrain, water features, etc.
        if data["description"]:
            description_lower = data["description"].lower()
            
            # Terrain features
            terrain_types = [
                "rolling", "flat", "hilly", "mountainous", "wooded", 
                "open", "rocky", "sandy", "fertile", "elevated"
            ]
            
            for terrain in terrain_types:
                if terrain in description_lower:
                    features.append({
                        "name": "Terrain",
                        "value": terrain.capitalize()
                    })
                    break
            
            # Water features
            water_features = [
                "creek", "pond", "lake", "river", "stream", 
                "spring", "waterfront", "water access"
            ]
            
            for water in water_features:
                if water in description_lower:
                    features.append({
                        "name": "Water Feature",
                        "value": water.capitalize()
                    })
                    break
            
            # Road access
            road_features = [
                "paved road", "gravel road", "dirt road", "county road",
                "highway access", "road frontage", "road access"
            ]
            
            for road in road_features:
                if road in description_lower:
                    features.append({
                        "name": "Road Access",
                        "value": road.capitalize()
                    })
                    break
            
            # Utilities
            utility_features = [
                "electricity", "power", "water", "well", "septic",
                "natural gas", "propane", "internet", "broadband"
            ]
            
            for utility in utility_features:
                if utility in description_lower:
                    features.append({
                        "name": "Utilities",
                        "value": utility.capitalize()
                    })
        
        data["features"] = features
    
    def _extract_coordinates(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property coordinates"""
        # Look for coordinates in meta tags
        meta_latitude = soup.find("meta", {"property": "place:location:latitude"})
        meta_longitude = soup.find("meta", {"property": "place:location:longitude"})
        
        if meta_latitude and meta_longitude:
            try:
                data["coordinates"]["latitude"] = float(meta_latitude["content"])
                data["coordinates"]["longitude"] = float(meta_longitude["content"])
                return
            except (ValueError, KeyError):
                pass
        
        # Look for coordinates in scripts
        scripts = soup.find_all("script")
        for script in scripts:
            script_text = script.string if script.string else ""
            
            # Look for patterns like latitude: 35.1234, longitude: -85.1234
            lat_match = re.search(r'latitude["\s:=]+([0-9.-]+)', script_text)
            lng_match = re.search(r'longitude["\s:=]+([0-9.-]+)', script_text)
            
            if lat_match and lng_match:
                try:
                    data["coordinates"]["latitude"] = float(lat_match.group(1))
                    data["coordinates"]["longitude"] = float(lng_match.group(1))
                    return
                except (ValueError, IndexError):
                    pass
            
            # Look for map initialization
            coord_match = re.search(r'map\.setView\(\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]', script_text)
            if coord_match:
                try:
                    lat = float(coord_match.group(1))
                    lng = float(coord_match.group(2))
                    data["coordinates"]["latitude"] = lat
                    data["coordinates"]["longitude"] = lng
                    return
                except (ValueError, IndexError):
                    pass
        
        # Look for Google Maps URLs
        links = soup.find_all("a")
        for link in links:
            href = link.get("href", "")
            if "maps.google.com" in href or "google.com/maps" in href:
                coords_match = re.search(r'[q|@]=(-?\d+\.\d+),(\-?\d+\.\d+)', href)
                if coords_match:
                    try:
                        data["coordinates"]["latitude"] = float(coords_match.group(1))
                        data["coordinates"]["longitude"] = float(coords_match.group(2))
                        return
                    except (ValueError, IndexError):
                        pass
                        
        # Look for map divs with data attributes
        map_divs = soup.select("[data-latitude][data-longitude], [data-lat][data-lng], [data-mapbox-lat][data-mapbox-lng]")
        for div in map_divs:
            lat = div.get("data-latitude") or div.get("data-lat") or div.get("data-mapbox-lat")
            lng = div.get("data-longitude") or div.get("data-lng") or div.get("data-mapbox-lng")
            
            if lat and lng:
                try:
                    data["coordinates"]["latitude"] = float(lat)
                    data["coordinates"]["longitude"] = float(lng)
                    return
                except ValueError:
                    pass
    
    def _extract_json_ld_data(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract data from JSON-LD structured data"""
        # Look for JSON-LD structured data
        json_ld_scripts = soup.find_all("script", {"type": "application/ld+json"})
        for script in json_ld_scripts:
            try:
                if script.string:
                    json_data = json.loads(script.string)
                    
                    # Check for real estate structured data patterns
                    if isinstance(json_data, dict):
                        self._process_json_ld_item(json_data, data)
                        
                    # Check for JSON-LD array format
                    elif isinstance(json_data, list):
                        for item in json_data:
                            if isinstance(item, dict):
                                self._process_json_ld_item(item, data)
            except (json.JSONDecodeError, AttributeError, TypeError):
                pass
                
    def _process_json_ld_item(self, item: Dict[str, Any], data: Dict[str, Any]) -> None:
        """Process a JSON-LD item to extract property data"""
        # Only process if it's a relevant type
        relevant_types = ["RealEstateListing", "Product", "Place", "LandmarksOrHistoricalBuildings", "Residence"]
        
        if "@type" not in item or item["@type"] not in relevant_types:
            return
            
        # Extract data from structured format
        
        # Title
        if not data["title"] and item.get("name"):
            data["title"] = item["name"]
            
        # Description
        if not data["description"] and item.get("description"):
            data["description"] = item["description"]
            
        # Price
        if data["price"] is None and item.get("offers") and isinstance(item["offers"], dict):
            price_value = item["offers"].get("price")
            if price_value:
                if isinstance(price_value, str):
                    data["price"] = self._parse_price(price_value)
                elif isinstance(price_value, (int, float)):
                    data["price"] = float(price_value)
                    
        # Property type
        if data["property_type"] == "land" and item.get("category"):
            data["property_type"] = self._normalize_property_type(item["category"])
            
        # Location
        if item.get("address") and isinstance(item["address"], dict):
            address = item["address"]
            
            # Street address
            if address.get("streetAddress"):
                data["location"]["street"] = address["streetAddress"]
                
            # City
            if address.get("addressLocality"):
                data["location"]["city"] = address["addressLocality"]
                
            # State
            if address.get("addressRegion"):
                data["location"]["state"] = address["addressRegion"]
                data["state"] = address["addressRegion"]
                
            # Zip code
            if address.get("postalCode"):
                data["location"]["zip"] = address["postalCode"]
                
            # Construct full address if not already present
            if "address" not in data["location"]:
                address_parts = []
                if data["location"].get("street"):
                    address_parts.append(data["location"]["street"])
                if data["location"].get("city"):
                    address_parts.append(data["location"]["city"])
                if data["location"].get("state"):
                    address_parts.append(data["location"]["state"])
                if data["location"].get("zip"):
                    address_parts.append(data["location"]["zip"])
                    
                if address_parts:
                    data["location"]["address"] = ", ".join(address_parts)
                    
        # Coordinates
        if item.get("geo") and isinstance(item["geo"], dict):
            geo = item["geo"]
            if geo.get("latitude") and geo.get("longitude"):
                try:
                    lat = float(geo["latitude"])
                    lng = float(geo["longitude"])
                    data["coordinates"] = {"latitude": lat, "longitude": lng}
                except (ValueError, TypeError):
                    pass
    
    def _clean_data(self, data: Dict[str, Any]) -> None:
        """Clean and normalize the extracted data"""
        # Ensure all expected fields exist
        if "features" not in data:
            data["features"] = []
            
        if "assets" not in data:
            data["assets"] = []
            
        if "documents" not in data:
            data["documents"] = []
            
        if "location" not in data:
            data["location"] = {}
            
        if "coordinates" not in data:
            data["coordinates"] = {"latitude": None, "longitude": None}
            
        # Set coordinates array in the format expected by the application
        if data["coordinates"]["latitude"] and data["coordinates"]["longitude"]:
            data["coordinates_array"] = [data["coordinates"]["longitude"], data["coordinates"]["latitude"]]
            
        # Ensure basic values are of the right type
        if data["price"] is None:
            data["price"] = 0
            
        if data["acreage"] is None:
            data["acreage"] = 0
            
        # Clean up the title
        if data["title"]:
            # Remove price from title if redundant
            price_pattern = r'\$[\d,]+'
            data["title"] = re.sub(price_pattern, '', data["title"]).strip()
            
            # Remove extra spaces and normalize
            data["title"] = re.sub(r'\s+', ' ', data["title"]).strip()
            
        # Generate metrics for extraction quality
        data["confidence_metrics"] = {
            "has_title": bool(data["title"]),
            "has_description": bool(data["description"]),
            "has_price": data["price"] > 0,
            "has_acreage": data["acreage"] > 0,
            "has_location": bool(data["location"]),
            "has_coordinates": bool(data["coordinates"]["latitude"] and data["coordinates"]["longitude"]),
            "has_images": len(data["assets"]) > 0,
            "has_features": len(data["features"]) > 0
        }
        
        # Calculate overall confidence score
        confidence_weights = {
            "has_title": 0.1,
            "has_description": 0.15,
            "has_price": 0.2,
            "has_acreage": 0.2,
            "has_location": 0.1,
            "has_coordinates": 0.1,
            "has_images": 0.1,
            "has_features": 0.05
        }
        
        confidence_score = sum(
            confidence_weights[metric] * (1 if value else 0)
            for metric, value in data["confidence_metrics"].items()
        )
        
        data["confidence_metrics"]["overall_score"] = round(confidence_score, 2)
    
    def _clean_text(self, text: str) -> str:
        """Clean up text by removing extra whitespace and newlines"""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text).strip()
    
    def _parse_price(self, price_str: str) -> Optional[float]:
        """Extract price value from string"""
        if not price_str:
            return None
            
        # Extract digits and decimal point
        price_match = re.search(r'[\$€£]?([0-9,.]+)', str(price_str))
        if not price_match:
            return None
            
        try:
            # Remove non-numeric characters except decimal point
            price_clean = re.sub(r'[^\d.]', '', price_match.group(1).replace(',', ''))
            return float(price_clean)
        except (ValueError, IndexError):
            return None
    
    def _parse_acreage(self, acreage_str: str) -> Optional[float]:
        """Extract acreage value from string"""
        if not acreage_str:
            return None
            
        # Match patterns like "5.2 acres" or "5.2 acre" or just "5.2"
        acreage_match = re.search(r'([\d,.]+)\s*acres?', str(acreage_str), re.IGNORECASE)
        if not acreage_match:
            # Try matching just the number
            acreage_match = re.search(r'([\d,.]+)', str(acreage_str))
            
        if acreage_match:
            try:
                return float(acreage_match.group(1).replace(',', ''))
            except (ValueError, IndexError):
                pass
                
        return None
    
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
        if url_lower.endswith(('.svg', '.gif', '.ico')):
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
            
        return False
        
    def _get_state_code(self, state_name: str) -> Optional[str]:
        """Get state code from state name"""
        states_map = self._get_states_map()
        states_map_reversed = {v.lower(): k for k, v in states_map.items()}
        
        return states_map_reversed.get(state_name.lower())
            
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