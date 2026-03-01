"""
Universal Property Extractor Module

This module provides a comprehensive extraction system for property listings
from major real estate websites. It orchestrates a network of specialized
extractors for different sites, with robust fallback mechanisms and
standardized output.

Supported Sites:
- Zillow
- Land.com
- LandWatch
- LandFlip
- LandSearch
- LandAndFarm
- Landsofamerica
- LandCentury
- Trulia
- Redfin
- And generic real estate listings with smart detection
"""

import re
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Union, Tuple
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

# Import site-specific extractors
try:
    from scrapers.landflip_extractor import LandFlipExtractor
except ImportError:
    logging.warning("LandFlipExtractor not available")
    LandFlipExtractor = None

try:
    from scrapers.landsearch_extractor import LandSearchExtractor
except ImportError:
    logging.warning("LandSearchExtractor not available")
    LandSearchExtractor = None

logger = logging.getLogger(__name__)

class UniversalPropertyExtractor:
    """
    Orchestrates multiple specialized extractors to extract property data
    from various real estate websites with high reliability.
    """
    
    def __init__(self):
        """Initialize the universal extractor with all available site-specific extractors"""
        self.extractors = []
        self._load_extractors()
        
        # Generic patterns for common property data extraction
        self.common_patterns = {
            "price": [
                r'\$\s*([\d,]+(?:\.\d{1,2})?)',  # $100,000 or $100,000.00
                r'([\d,]+(?:\.\d{1,2})?)\s*dollars',  # 100,000 dollars
                r'Price[:\s]+\$\s*([\d,]+(?:\.\d{1,2})?)',  # Price: $100,000
                r'List[ed]* [Pp]rice[:\s]+\$\s*([\d,]+(?:\.\d{1,2})?)'  # List Price: $100,000
            ],
            "acreage": [
                r'([\d,]+(?:\.\d{1,3})?)\s*acres?',  # 100 acres
                r'([\d,]+(?:\.\d{1,3})?)\s*ac\.?',  # 100 ac or 100 ac.
                r'Acreage[:\s]+([\d,]+(?:\.\d{1,3})?)',  # Acreage: 100
                r'Acres[:\s]+([\d,]+(?:\.\d{1,3})?)',  # Acres: 100
                r'([\d,]+(?:\.\d{1,3})?)[- ]acre lot'  # 100-acre lot
            ],
            "property_types": {
                "land": ["land", "lot", "vacant", "acreage"],
                "farm": ["farm", "farmland", "agriculture", "agricultural"],
                "ranch": ["ranch", "cattle", "livestock", "ranching"],
                "recreational": ["hunting", "fishing", "recreational", "recreation", "sporting"],
                "waterfront": ["waterfront", "lakefront", "riverfront", "oceanfront", "beachfront"],
                "residential": ["home", "house", "residential", "cabin", "cottage", "homesite"],
                "commercial": ["commercial", "retail", "office", "business", "industrial"],
                "mountain": ["mountain", "mountainside", "mountain view", "highland"],
                "timber": ["timber", "forest", "woodland", "wooded", "trees"],
                "conservation": ["conservation", "preserve", "wildlife", "natural"]
            }
        }
    
    def _load_extractors(self):
        """Load all available specialized extractors"""
        # Add LandFlip extractor if available
        if LandFlipExtractor:
            self.extractors.append(LandFlipExtractor())
        
        # Add LandSearch extractor if available
        if LandSearchExtractor:
            self.extractors.append(LandSearchExtractor())
            
        # Log available extractors
        extractor_names = [e.__class__.__name__ for e in self.extractors]
        logger.info(f"Loaded extractors: {', '.join(extractor_names) if extractor_names else 'None'}")
    
    async def extract_property_data(self, html: str, url: str) -> Dict[str, Any]:
        """
        Extract property data from HTML content using the best available extractor
        
        Args:
            html: HTML content of the property listing page
            url: URL of the property listing
            
        Returns:
            Dictionary containing structured property data
        """
        domain = urlparse(url).netloc.lower()
        soup = BeautifulSoup(html, 'html.parser')
        
        # Initialize with empty data structure
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
            "source_domain": domain
        }
        
        # Try site-specific extractors first for best results
        for extractor in self.extractors:
            if hasattr(extractor, 'can_handle') and extractor.can_handle(url):
                try:
                    logger.info(f"Using {extractor.__class__.__name__} for {url}")
                    extracted_data = extractor.extract(soup, url)
                    if extracted_data and self._is_valid_extraction(extracted_data):
                        # Successful extraction with a specialized extractor
                        logger.info(f"Successfully extracted data with {extractor.__class__.__name__}")
                        extracted_data["extractor_used"] = extractor.__class__.__name__
                        return extracted_data
                except Exception as e:
                    logger.error(f"Error with {extractor.__class__.__name__}: {str(e)}")
        
        # If no specialized extractor worked, fall back to generic extraction
        logger.info(f"Using generic extraction for {url}")
        try:
            # Extract with our generic methods
            self._extract_title(soup, data)
            self._extract_description(soup, data)
            self._extract_price(soup, data)
            self._extract_acreage(soup, data)
            self._extract_location(soup, data)
            self._extract_property_type(soup, data)
            self._extract_features(soup, data)
            self._extract_coordinates(soup, data)
            self._extract_images(soup, data, url)
            
            # Extract structured data if available
            self._extract_structured_data(soup, data)
            
            # Clean up the data
            self._clean_data(data)
            
            # Add extraction source
            data["extractor_used"] = "universal_generic"
            
            return data
        except Exception as e:
            logger.error(f"Error in generic extraction: {str(e)}")
            data["extraction_error"] = str(e)
            data["extractor_used"] = "universal_generic_failed"
            return data
    
    def _is_valid_extraction(self, data: Dict[str, Any]) -> bool:
        """Check if the extracted data contains essential property information"""
        # Require at least title and one of: price, acreage, description
        if not data.get("title"):
            return False
            
        return bool(data.get("price") or data.get("acreage") or data.get("description"))
    
    def _extract_title(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property title using common patterns"""
        # Try h1 elements first (most common for titles)
        title_elements = soup.find_all('h1')
        for elem in title_elements:
            text = self._clean_text(elem.get_text())
            if text and len(text) > 5 and len(text) < 200:
                data["title"] = text
                return
                
        # Try common title selectors
        title_selectors = [
            ".property-title", ".listing-title", ".title-container",
            "h1.title", "h2.title", "h1[itemprop='name']", 
            ".detail-title", ".property-header h1", ".property-address",
            ".listing-header h1", "[data-testid='listing-title']"
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                data["title"] = self._clean_text(title_elem.get_text())
                return
    
    def _extract_description(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property description using common patterns"""
        # Try meta description first
        meta_desc = soup.find("meta", {"name": "description"})
        if meta_desc and meta_desc.get("content"):
            content = meta_desc.get("content")
            if len(content) > 50:  # Only use if substantial
                data["description"] = self._clean_text(content)
                return
                
        # Try common description selectors
        desc_selectors = [
            ".property-description", "#property-description", ".listing-description",
            "[itemprop='description']", ".description-text", ".property-details-description",
            ".property-desc", ".listing-details-text", "[data-testid='listing-description']"
        ]
        
        for selector in desc_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                data["description"] = self._clean_text(desc_elem.get_text())
                return
                
        # Look for description in paragraphs within main content
        content_selectors = [
            ".main-content", ".property-details", ".listing-content",
            ".property-main", ".main-container", "#main-content"
        ]
        
        for selector in content_selectors:
            content = soup.select_one(selector)
            if content:
                paragraphs = content.find_all("p")
                for p in paragraphs:
                    text = self._clean_text(p.get_text())
                    # Look for substantial paragraphs that are likely descriptions
                    if len(text) > 100:
                        data["description"] = text
                        return
    
    def _extract_price(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property price using common patterns"""
        # Try common price selectors
        price_selectors = [
            ".property-price", ".listing-price", "[itemprop='price']",
            ".price-value", ".property-details-price", "[data-testid='listing-price']",
            ".price-container", ".price", "span.price", "div.price"
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = self._clean_text(price_elem.get_text())
                parsed_price = self._parse_price(price_text)
                if parsed_price is not None:
                    data["price"] = parsed_price
                    return
                    
        # Try regex patterns on the entire page
        page_text = soup.get_text()
        for pattern in self.common_patterns["price"]:
            matches = re.findall(pattern, page_text)
            if matches:
                for match in matches:
                    parsed_price = self._parse_price(match)
                    if parsed_price is not None and parsed_price > 0:
                        data["price"] = parsed_price
                        return
    
    def _extract_acreage(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property acreage using common patterns"""
        # Try common acreage selectors
        acreage_selectors = [
            ".property-acreage", ".listing-acreage", "[data-acreage]",
            ".acreage-value", ".property-details-acreage", "[data-testid='listing-acreage']",
            ".acreage", "span.acres", "div.acres"
        ]
        
        for selector in acreage_selectors:
            acreage_elem = soup.select_one(selector)
            if acreage_elem:
                acreage_text = self._clean_text(acreage_elem.get_text())
                parsed_acreage = self._parse_acreage(acreage_text)
                if parsed_acreage is not None:
                    data["acreage"] = parsed_acreage
                    return
                    
        # Try regex patterns on the entire page
        page_text = soup.get_text()
        for pattern in self.common_patterns["acreage"]:
            matches = re.findall(pattern, page_text)
            if matches:
                for match in matches:
                    parsed_acreage = self._parse_acreage(match)
                    if parsed_acreage is not None and parsed_acreage > 0:
                        data["acreage"] = parsed_acreage
                        return
                        
        # Check if acreage is in the title or description
        if data["title"]:
            for pattern in self.common_patterns["acreage"]:
                matches = re.findall(pattern, data["title"])
                if matches:
                    data["acreage"] = self._parse_acreage(matches[0])
                    return
                    
        if data["description"]:
            for pattern in self.common_patterns["acreage"]:
                matches = re.findall(pattern, data["description"])
                if matches:
                    data["acreage"] = self._parse_acreage(matches[0])
                    return
    
    def _extract_location(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property location using common patterns"""
        # Try common location selectors
        location_selectors = [
            ".property-location", ".listing-location", "[itemprop='address']",
            ".location-value", ".property-details-location", "[data-testid='listing-location']",
            ".location", ".address", "span.address", "div.address"
        ]
        
        for selector in location_selectors:
            location_elem = soup.select_one(selector)
            if location_elem:
                location_text = self._clean_text(location_elem.get_text())
                if location_text:
                    # Basic location
                    data["location"]["address"] = location_text
                    
                    # Try to extract state
                    state_code = self._extract_state_from_text(location_text)
                    if state_code:
                        data["state"] = state_code
                        data["location"]["state"] = state_code
                    
                    # Try to parse more structured location parts
                    self._parse_location_parts(location_text, data)
                    return
        
        # Look for structured address data
        address_parts = {
            "street": soup.find("span", {"itemprop": "streetAddress"}),
            "city": soup.find("span", {"itemprop": "addressLocality"}),
            "state": soup.find("span", {"itemprop": "addressRegion"}),
            "zip": soup.find("span", {"itemprop": "postalCode"}),
        }
        
        if any(address_parts.values()):
            parts = {}
            for key, elem in address_parts.items():
                if elem:
                    parts[key] = self._clean_text(elem.get_text())
            
            if parts:
                data["location"].update(parts)
                if "state" in parts:
                    data["state"] = parts["state"]
                    
                # Reconstruct full address
                address_components = []
                if parts.get("street"):
                    address_components.append(parts["street"])
                if parts.get("city"):
                    address_components.append(parts["city"])
                if parts.get("state"):
                    address_components.append(parts["state"])
                if parts.get("zip"):
                    address_components.append(parts["zip"])
                    
                if address_components:
                    data["location"]["address"] = ", ".join(address_components)
                return
    
    def _extract_property_type(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property type using common patterns"""
        # Try common property type selectors
        type_selectors = [
            ".property-type", ".listing-type", "[data-property-type]",
            ".type-value", ".property-details-type", "[data-testid='listing-type']",
            ".listing-category", "span.category", "div.category"
        ]
        
        for selector in type_selectors:
            type_elem = soup.select_one(selector)
            if type_elem:
                property_type = self._clean_text(type_elem.get_text()).lower()
                data["property_type"] = self._normalize_property_type(property_type)
                return
                
        # Look for property type keywords in title and description
        if data["title"]:
            data["property_type"] = self._detect_property_type_from_text(data["title"])
            
        if data["property_type"] == "land" and data["description"]:
            detected_type = self._detect_property_type_from_text(data["description"])
            if detected_type != "land":  # Only update if we found something more specific
                data["property_type"] = detected_type
    
    def _extract_features(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property features using common patterns"""
        features = []
        
        # Try common feature list selectors
        feature_selectors = [
            ".property-features li", ".listing-features li", 
            ".features-list li", ".property-details-features li",
            "[data-testid='listing-features'] li", ".amenities li"
        ]
        
        for selector in feature_selectors:
            feature_elements = soup.select(selector)
            for elem in feature_elements:
                feature_text = self._clean_text(elem.get_text())
                if feature_text and len(feature_text) > 3:  # Ignore very short text
                    features.append({
                        "name": feature_text,
                        "value": True
                    })
        
        # Look for property details in tables
        detail_selectors = [
            ".property-details tr", ".listing-details tr",
            ".details-table tr", ".property-details-table tr",
            "[data-testid='listing-details'] tr"
        ]
        
        for selector in detail_selectors:
            detail_rows = soup.select(selector)
            for row in detail_rows:
                cells = row.find_all(['th', 'td'])
                if len(cells) >= 2:
                    key = self._clean_text(cells[0].get_text())
                    value = self._clean_text(cells[1].get_text())
                    
                    if key and value and len(key) > 1:
                        features.append({
                            "name": key,
                            "value": value
                        })
        
        # Deduplicate features
        unique_features = []
        seen_names = set()
        for feature in features:
            name = feature["name"].lower()
            if name not in seen_names:
                seen_names.add(name)
                unique_features.append(feature)
        
        data["features"] = unique_features
        
        # Extract terrain and water features from description if not found in features
        if data["description"]:
            self._extract_terrain_water_features(data)
    
    def _extract_coordinates(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property coordinates using common patterns"""
        # Try meta tags first
        meta_latitude = soup.find("meta", {"property": "place:location:latitude"})
        meta_longitude = soup.find("meta", {"property": "place:location:longitude"})
        
        if meta_latitude and meta_longitude:
            try:
                lat = float(meta_latitude["content"])
                lng = float(meta_longitude["content"])
                data["coordinates"] = {"latitude": lat, "longitude": lng}
                return
            except (ValueError, KeyError):
                pass
        
        # Look for coordinates in scripts
        scripts = soup.find_all("script")
        for script in scripts:
            script_text = script.string if script.string else ""
            
            # Pattern for latitude/longitude in JS variables
            coord_patterns = [
                r'latitude["\s:=]+([0-9.-]+)["\s,;]*longitude["\s:=]+([0-9.-]+)',
                r'lat["\s:=]+([0-9.-]+)["\s,;]*lng["\s:=]+([0-9.-]+)',
                r'latitude:\s*([0-9.-]+),\s*longitude:\s*([0-9.-]+)',
                r'center:\s*\[\s*([0-9.-]+),\s*([0-9.-]+)\s*\]',
                r'LatLng\(\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*\)'
            ]
            
            for pattern in coord_patterns:
                matches = re.search(pattern, script_text)
                if matches:
                    try:
                        lat = float(matches.group(1))
                        lng = float(matches.group(2))
                        
                        # Verify coordinates are valid
                        if -90 <= lat <= 90 and -180 <= lng <= 180:
                            data["coordinates"] = {"latitude": lat, "longitude": lng}
                            return
                    except (ValueError, IndexError):
                        pass
        
        # Look for Google Maps embeds
        map_embeds = soup.find_all("iframe")
        for iframe in map_embeds:
            src = iframe.get("src", "")
            if "google.com/maps" in src or "maps.google.com" in src:
                # Extract coordinates from map URL
                coord_match = re.search(r'q=(-?\d+\.\d+),(-?\d+\.\d+)', src)
                if coord_match:
                    try:
                        lat = float(coord_match.group(1))
                        lng = float(coord_match.group(2))
                        data["coordinates"] = {"latitude": lat, "longitude": lng}
                        return
                    except (ValueError, IndexError):
                        pass
    
    def _extract_images(self, soup: BeautifulSoup, data: Dict[str, Any], base_url: str) -> None:
        """Extract property images using common patterns"""
        images = []
        
        # Look for image galleries first
        gallery_selectors = [
            ".property-gallery img", ".listing-gallery img",
            ".image-gallery img", ".property-images img",
            ".carousel img", ".slider img", 
            "[data-gallery-images] img", ".main-image img"
        ]
        
        for selector in gallery_selectors:
            image_elements = soup.select(selector)
            for i, img in enumerate(image_elements):
                image_url = None
                
                # Try multiple attributes for image source
                for attr in ['data-src', 'data-original', 'data-lazy-src', 'data-url', 'src']:
                    if img.get(attr):
                        image_url = img.get(attr)
                        if image_url and len(image_url) > 10:
                            break
                
                # Skip if not a valid image or is an icon/logo
                if not image_url or self._is_icon_or_logo(image_url):
                    continue
                
                # Handle relative URLs
                if image_url.startswith("/"):
                    from urllib.parse import urlparse
                    domain = "{0.scheme}://{0.netloc}".format(urlparse(base_url))
                    image_url = domain + image_url
                
                # Add to images list
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
                if script.string:
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
        
        # If we still don't have images, look for any good candidates
        if not images:
            # Look for large images that are likely property photos
            img_tags = soup.find_all("img")
            for i, img in enumerate(img_tags):
                src = img.get("src", "")
                
                # Skip small images or icons
                if self._is_icon_or_logo(src):
                    continue
                    
                # Skip very small images (likely icons)
                width = img.get("width")
                height = img.get("height")
                if width and height:
                    try:
                        w, h = int(width), int(height)
                        if w < 200 or h < 200:
                            continue
                    except ValueError:
                        pass
                
                # Handle relative URLs
                if src.startswith("/"):
                    from urllib.parse import urlparse
                    domain = "{0.scheme}://{0.netloc}".format(urlparse(base_url))
                    src = domain + src
                
                images.append({
                    "id": f"img-{i+1}",
                    "type": "image",
                    "url": src,
                    "thumbnail": src,
                    "title": img.get("alt", f"Property Image {i+1}")
                })
        
        # Deduplicate images by URL
        unique_images = []
        seen_urls = set()
        
        for img in images:
            url = img["url"]
            if url not in seen_urls and not self._is_icon_or_logo(url):
                seen_urls.add(url)
                unique_images.append(img)
        
        data["assets"] = unique_images
    
    def _extract_structured_data(self, soup: BeautifulSoup, data: Dict[str, Any]) -> None:
        """Extract property data from structured JSON-LD data if available"""
        structured_data = None
        
        # Look for JSON-LD structured data
        json_ld_scripts = soup.find_all("script", {"type": "application/ld+json"})
        for script in json_ld_scripts:
            try:
                if script.string:
                    json_data = json.loads(script.string)
                    
                    # Check for real estate structured data patterns
                    if isinstance(json_data, dict):
                        # Look for RealEstateListing type
                        if json_data.get("@type") in ["RealEstateListing", "SingleFamilyResidence", "Place", "Product"]:
                            structured_data = json_data
                            break
                            
                        # Look for nested real estate data
                        if "@graph" in json_data and isinstance(json_data["@graph"], list):
                            for item in json_data["@graph"]:
                                if isinstance(item, dict) and item.get("@type") in ["RealEstateListing", "SingleFamilyResidence", "Place", "Product"]:
                                    structured_data = item
                                    break
                            if structured_data:
                                break
            except (json.JSONDecodeError, AttributeError, TypeError):
                pass
                
        if not structured_data:
            return
            
        # Extract data from structured format
        
        # Title
        if not data["title"] and structured_data.get("name"):
            data["title"] = structured_data["name"]
            
        # Description
        if not data["description"] and structured_data.get("description"):
            data["description"] = structured_data["description"]
            
        # Price
        if data["price"] is None and structured_data.get("price"):
            price_value = structured_data["price"]
            if isinstance(price_value, str):
                data["price"] = self._parse_price(price_value)
            elif isinstance(price_value, (int, float)):
                data["price"] = float(price_value)
            elif isinstance(price_value, dict) and price_value.get("price"):
                data["price"] = self._parse_price(price_value["price"])
                
        # Property type
        if data["property_type"] == "land" and structured_data.get("propertyType"):
            data["property_type"] = self._normalize_property_type(structured_data["propertyType"])
            
        # Location
        if structured_data.get("address") and isinstance(structured_data["address"], dict):
            address = structured_data["address"]
            
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
        if structured_data.get("geo") and isinstance(structured_data["geo"], dict):
            geo = structured_data["geo"]
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
    
    def _extract_terrain_water_features(self, data: Dict[str, Any]) -> None:
        """Extract terrain and water features from description text"""
        description = data["description"].lower()
        
        # Check for terrain features
        terrain_keywords = {
            "flat": ["flat", "level", "even"],
            "rolling": ["rolling", "gentle slopes", "undulating"],
            "hilly": ["hilly", "hills", "hillside"],
            "mountainous": ["mountain", "mountains", "mountainous", "mountain views"],
            "wooded": ["wooded", "woodland", "forest", "trees", "timber"],
            "open": ["open", "cleared", "meadow", "pasture", "grassland"],
            "rocky": ["rocky", "rock", "stone", "boulders"],
            "sandy": ["sandy", "sand", "beach"],
            "agricultural": ["agricultural", "farmland", "tillable", "cultivated", "crop"]
        }
        
        # Check for water features
        water_keywords = {
            "creek": ["creek", "stream", "brook"],
            "river": ["river", "riverfront"],
            "lake": ["lake", "lakefront", "pond"],
            "ocean": ["ocean", "oceanfront", "sea", "beach"],
            "spring": ["spring", "natural spring", "artesian"],
            "well": ["well", "water well"]
        }
        
        # Check for terrain features
        terrain_found = False
        for terrain, keywords in terrain_keywords.items():
            if any(keyword in description for keyword in keywords):
                data["features"].append({
                    "name": "Terrain",
                    "value": terrain.capitalize()
                })
                terrain_found = True
                break
                
        # Add generic terrain if none found but description mentions land
        if not terrain_found and any(word in description for word in ["land", "property", "acre", "lot"]):
            for feature in data["features"]:
                if feature["name"].lower() == "terrain":
                    terrain_found = True
                    break
                    
            if not terrain_found:
                data["features"].append({
                    "name": "Terrain",
                    "value": "Land"
                })
        
        # Check for water features
        water_found = False
        for water, keywords in water_keywords.items():
            if any(keyword in description for keyword in keywords):
                data["features"].append({
                    "name": "Water Feature",
                    "value": water.capitalize()
                })
                water_found = True
                break
                
        # Extract utilities if mentioned
        utilities = {
            "electricity": ["electricity", "electric", "power", "utilities"],
            "water": ["water service", "city water", "municipal water", "public water"],
            "sewer": ["sewer", "septic", "wastewater"],
            "natural gas": ["natural gas", "gas", "propane"],
            "internet": ["internet", "broadband", "fiber", "cable", "high-speed"]
        }
        
        for utility, keywords in utilities.items():
            if any(keyword in description for keyword in keywords):
                data["features"].append({
                    "name": "Utilities",
                    "value": utility.capitalize()
                })
    
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
            price_value = float(price_clean)
            
            # Validate it's a reasonable property price
            if 100 <= price_value <= 100000000:  # $100 to $100M
                return price_value
            return None
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
                acreage_value = float(acreage_match.group(1).replace(',', ''))
                
                # Validate it's a reasonable acreage
                if 0.1 <= acreage_value <= 100000:  # 0.1 to 100,000 acres
                    return acreage_value
                return None
            except (ValueError, IndexError):
                pass
                
        return None
    
    def _normalize_property_type(self, property_type: str) -> str:
        """Normalize property type to standard values"""
        if not property_type:
            return "land"
            
        property_type = str(property_type).lower().strip()
        
        # Check each property type for matching keywords
        for standard_type, keywords in self.common_patterns["property_types"].items():
            if any(keyword in property_type for keyword in keywords):
                return standard_type
                
        # Default to land
        return "land"
    
    def _detect_property_type_from_text(self, text: str) -> str:
        """Detect property type from descriptive text"""
        text = text.lower()
        
        # Check each property type for matching keywords
        for standard_type, keywords in self.common_patterns["property_types"].items():
            for keyword in keywords:
                # Use word boundary to avoid partial matches
                if re.search(r'\b' + keyword + r'\b', text):
                    return standard_type
                    
        # Default to land
        return "land"
    
    def _extract_state_from_text(self, text: str) -> Optional[str]:
        """Extract US state code from text"""
        # Try to extract state abbreviation (2 capital letters)
        state_match = re.search(r',\s*([A-Z]{2})\b', text)
        if state_match:
            state_code = state_match.group(1)
            # Verify it's a valid state code
            if state_code in self._get_states_map():
                return state_code
                
        # Try to extract state name
        text_lower = text.lower()
        states_map = self._get_states_map()
        for state_code, state_name in states_map.items():
            if state_name.lower() in text_lower:
                return state_code
                
        return None
    
    def _parse_location_parts(self, location_text: str, data: Dict[str, Any]) -> None:
        """Parse location text into city, county, state, zip parts"""
        # Common format: City, County, State ZIP
        parts = location_text.split(',')
        
        if len(parts) >= 2:
            # First part is usually the city or address
            if "street" not in data["location"]:
                data["location"]["city"] = parts[0].strip()
                
            # Last part usually contains state and ZIP
            last_part = parts[-1].strip()
            
            # Extract ZIP code
            zip_match = re.search(r'(\d{5}(?:-\d{4})?)', last_part)
            if zip_match:
                data["location"]["zip"] = zip_match.group(1)
                
            # Extract state (2 uppercase letters)
            state_match = re.search(r'\b([A-Z]{2})\b', last_part)
            if state_match:
                state_code = state_match.group(1)
                data["location"]["state"] = state_code
                data["state"] = state_code
                
            # Extract county (if present)
            county_match = re.search(r'([A-Za-z\s]+)\s+County', location_text)
            if county_match:
                data["location"]["county"] = county_match.group(1).strip()
    
    def _is_icon_or_logo(self, url: str) -> bool:
        """Check if the URL points to an icon or logo rather than a property image"""
        if not url:
            return True

        # These patterns suggest icons/logos rather than property images
        icon_patterns = [
            'logo', 'icon', 'favicon', 'banner', 'marker', 'avatar',
            'pixel', 'blank', 'button', 'badge', 'sprite', 'loading',
            'placeholder', 'profile', 'thumbnail-', 'symbol', 'header'
        ]
        
        url_lower = str(url).lower()
        
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
        if len(url) < 40 and ('/img/' in url_lower or '/images/' in url_lower or '/icons/' in url_lower):
            return True
            
        # Check for data URIs (not likely to be property images)
        if url_lower.startswith('data:image'):
            return True
            
        # Check for common placeholder or tracking pixel URLs
        if 'transparent' in url_lower or '1x1' in url_lower or '1-pixel' in url_lower:
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