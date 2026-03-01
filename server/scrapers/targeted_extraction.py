"""
Targeted extraction module for precise property data extraction.
"""

import re
import logging
import urllib.parse
from typing import Dict, List, Any, Optional, Tuple, Set
from bs4 import BeautifulSoup, Tag

from scrapers.models import (
    ScrapedProperty, 
    PropertyDocument, 
    PropertyZoning, 
    BoundaryData,
    ConfidenceMetrics,
    TargetedExtraction,
    PropertyAsset
)

logger = logging.getLogger(__name__)

# Document type detection patterns
DOCUMENT_PATTERNS = {
    "survey": [r"survey", r"plat", r"boundary", r"plot plan"],
    "deed": [r"deed", r"title", r"ownership", r"legal document"],
    "soil_report": [r"soil", r"geological", r"perc test", r"percolation", r"ground survey"],
    "environmental": [r"environmental", r"wildlife", r"conservation", r"protected species"],
    "utility": [r"utility", r"electric", r"water", r"sewer", r"gas"]
}

# Zoning and land use patterns
ZONING_PATTERNS = {
    "residential": [r"residential", r"home", r"house", r"r1", r"r2", r"r3", r"single family"],
    "commercial": [r"commercial", r"business", r"retail", r"office", r"c1", r"c2", r"c3"],
    "agricultural": [r"agricultural", r"farm", r"ranch", r"ag", r"a1", r"a2", r"cultivation"],
    "industrial": [r"industrial", r"manufacturing", r"warehouse", r"processing", r"m1", r"m2"],
    "recreational": [r"recreational", r"park", r"campground", r"rv park", r"outdoor recreation"],
    "conservation": [r"conservation", r"protected", r"easement", r"wilderness", r"preserve"]
}

# Image quality patterns for filtering
IMAGE_SIZE_PATTERNS = {
    "high": (800, 600),  # Minimum width, height for high quality
    "medium": (400, 300),  # Minimum for medium quality
    "low": (200, 150)  # Minimum for low quality
}

class TargetedExtractor:
    """Targeted extraction utility for precise property data extraction"""
    
    def __init__(self, config: Optional[TargetedExtraction] = None):
        """Initialize with extraction configuration"""
        self.config = config or TargetedExtraction()
        self.uncertain_fields: List[str] = []
        self.missing_fields: List[str] = []
        
    def extract_from_html(self, soup: BeautifulSoup, url: str, domain: str) -> Dict[str, Any]:
        """
        Extract property data from HTML with targeted precision
        
        Args:
            soup: BeautifulSoup object with parsed HTML
            url: Source URL
            domain: Domain name of the source
            
        Returns:
            Dictionary with extracted property data
        """
        result = {}
        confidence_metrics = ConfidenceMetrics()
        
        try:
            # Extract core details if enabled
            if self.config.core_details:
                core_data = self._extract_core_details(soup, domain)
                result.update(core_data)
                
                # Update confidence metrics for core details
                confidence_metrics.price = self._calculate_confidence("price", result)
                confidence_metrics.acreage = self._calculate_confidence("acreage", result)
                confidence_metrics.location = self._calculate_confidence("location", result)
                confidence_metrics.zoning = self._calculate_confidence("zoning", result)
                confidence_metrics.land_use = self._calculate_confidence("land_use", result)
            
            # Extract media assets if enabled
            if self.config.media:
                assets = self._extract_and_filter_media(soup, domain, url)
                result["assets"] = assets
                confidence_metrics.images = self._calculate_asset_confidence(assets, "image")
            
            # Extract documents if enabled
            if self.config.documents:
                documents = self._extract_and_classify_documents(soup, domain, url)
                result["documents"] = documents
                confidence_metrics.documents = self._calculate_asset_confidence(documents, "document")
            
            # Extract map data if enabled
            if self.config.maps:
                map_data = self._extract_map_data(soup, domain)
                if "coordinates" in map_data:
                    result["coordinates"] = map_data["coordinates"]
                    confidence_metrics.coordinates = map_data.get("coordinates_confidence", 0.5)
                    
                if "boundary_data" in map_data:
                    result["boundary_data"] = map_data["boundary_data"]
                    confidence_metrics.boundary = map_data.get("boundary_confidence", 0.5)
            
            # Extract descriptions if enabled
            if self.config.descriptions:
                descriptions = self._extract_targeted_descriptions(soup, domain)
                result["description"] = descriptions.get("description", "")
                result["features"] = descriptions.get("features", [])
                confidence_metrics.description = self._calculate_confidence("description", result)
                confidence_metrics.features = self._calculate_confidence("features", result)
            
            # Calculate overall confidence
            confidence_metrics.overall = self._calculate_overall_confidence(confidence_metrics)
            result["confidence_metrics"] = confidence_metrics
            
            # Add data quality indicators
            result["uncertain_fields"] = self.uncertain_fields
            result["missing_required_fields"] = self.missing_fields
            
            return result
            
        except Exception as e:
            logger.error(f"Error in targeted extraction: {e}")
            return {}
    
    def _extract_core_details(self, soup: BeautifulSoup, domain: str) -> Dict[str, Any]:
        """Extract core property details with precision"""
        result = {}
        
        # Extract price using targeted selectors and patterns
        price = self._extract_price(soup, domain)
        if price is not None and price > 0:
            result["price"] = price
        else:
            self.missing_fields.append("price")
        
        # Extract acreage using targeted selectors and patterns
        acreage = self._extract_acreage(soup, domain)
        if acreage is not None and acreage > 0:
            result["acreage"] = acreage
        else:
            self.missing_fields.append("acreage")
        
        # Extract location details
        location = self._extract_location_details(soup, domain)
        if location:
            result["location"] = location
        else:
            self.missing_fields.append("location")
        
        # Extract zoning information
        zoning = self._extract_zoning(soup, domain)
        if zoning:
            result["zoning"] = zoning
            
            # Set land use based on zoning if possible
            if zoning.type:
                result["land_use"] = zoning.type
        
        # Extract utilities and road access
        utilities = self._extract_utilities(soup, domain)
        if utilities:
            result["utilities"] = utilities
            
        road_access = self._check_road_access(soup, domain)
        if road_access is not None:
            result["road_access"] = road_access
        
        return result
    
    def _extract_price(self, soup: BeautifulSoup, domain: str) -> Optional[float]:
        """Extract property price with precision"""
        # List of CSS selectors for price, in priority order
        price_selectors = [
            'span.listing-price', '.price', '.listing-price', '.property-price',
            'div[data-testid="price"]', 'span[itemprop="price"]',
            '.price-info', 'div.price', '.pdp-price', '.ds-summary-row-price',
            '.price-large', '.price-section', '.detail-info__price-label',
            'h4.price', '.regular-price', 'strong.price', '.price-display'
        ]
        
        # Try each selector
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem and price_elem.text.strip():
                # Clean up the price text
                price_text = price_elem.text.strip()
                return self._parse_price(price_text)
        
        # Try RegEx pattern for price
        price_patterns = [
            r'\$([0-9,]+)', 
            r'price[:\s]*\$?([0-9,]+)', 
            r'asking[:\s]*\$?([0-9,]+)',
            r'list price[:\s]*\$?([0-9,]+)',
            r'price[: ]*([\$£€])?([0-9,]+)'
        ]
        
        for pattern in price_patterns:
            matches = re.search(pattern, soup.text, re.IGNORECASE)
            if matches:
                try:
                    price_text = matches.group(1).strip()
                    return self._parse_price(price_text)
                except:
                    continue
        
        return None
    
    def _parse_price(self, price_text: str) -> Optional[float]:
        """Parse price text into a numeric value"""
        # Remove currency symbols and commas
        cleaned = re.sub(r'[^\d.]', '', price_text)
        
        try:
            price = float(cleaned)
            # Validate the price is reasonable
            if price <= 0 or price > 100000000:  # $100M upper limit
                self.uncertain_fields.append("price")
                return price
            return price
        except:
            return None
    
    def _extract_acreage(self, soup: BeautifulSoup, domain: str) -> Optional[float]:
        """Extract property acreage with precision"""
        # List of CSS selectors for acreage, in priority order
        acreage_selectors = [
            'span.acreage', '.property-acres', '[data-testid="acreage"]',
            'span[itemprop="landSize"]', '.acres', '.acreage', '.land-size',
            'div.acreage', '.property-details__acres', '.land-acres',
            'span.acres', 'div.acres', '.property-lot-size', '.lot-size'
        ]
        
        # Try each selector
        for selector in acreage_selectors:
            acreage_elem = soup.select_one(selector)
            if acreage_elem and acreage_elem.text.strip():
                # Clean up the acreage text
                acreage_text = acreage_elem.text.strip()
                return self._parse_acreage(acreage_text)
        
        # Try RegEx pattern for acreage
        acreage_patterns = [
            r'([0-9,.]+)\s*acres?', 
            r'([0-9,.]+)\s*ac\.?',
            r'acreage[:\s]*([0-9,.]+)',
            r'lot size[:\s]*([0-9,.]+)\s*acres?',
            r'size[:\s]*([0-9,.]+)\s*acres?'
        ]
        
        for pattern in acreage_patterns:
            matches = re.search(pattern, soup.text, re.IGNORECASE)
            if matches:
                try:
                    acreage_text = matches.group(1).strip()
                    return self._parse_acreage(acreage_text)
                except:
                    continue
        
        # If we still don't have acreage, try looking for square feet and convert
        sqft_patterns = [
            r'([0-9,.]+)\s*sq\.?\s*ft\.?',
            r'([0-9,.]+)\s*square\s*feet',
            r'([0-9,.]+)\s*sqft'
        ]
        
        for pattern in sqft_patterns:
            matches = re.search(pattern, soup.text, re.IGNORECASE)
            if matches:
                try:
                    sqft_text = matches.group(1).strip()
                    sqft = float(re.sub(r'[^\d.]', '', sqft_text))
                    # Convert square feet to acres (1 acre = 43,560 sq ft)
                    return round(sqft / 43560, 2)
                except:
                    continue
        
        return None
    
    def _parse_acreage(self, acreage_text: str) -> Optional[float]:
        """Parse acreage text into a numeric value"""
        # Remove non-numeric characters except decimal point
        cleaned = re.sub(r'[^\d.]', '', acreage_text)
        
        try:
            acreage = float(cleaned)
            # Validate the acreage is reasonable
            if acreage <= 0 or acreage > 100000:  # 100k acre upper limit
                self.uncertain_fields.append("acreage")
                return acreage
            return acreage
        except:
            return None
    
    def _extract_location_details(self, soup: BeautifulSoup, domain: str) -> Optional[Dict[str, Any]]:
        """Extract detailed location information"""
        location = {
            "address": None,
            "city": None,
            "county": None,
            "state": None,
            "zip_code": None,
            "country": "USA"  # Default
        }
        
        # Address selectors
        address_selectors = [
            '[itemprop="streetAddress"]', '.street-address', '.property-address',
            '.listing-address', '.address', 'span.address', 'div.address',
            '[data-testid="property-address"]', '.location-address'
        ]
        
        # City selectors
        city_selectors = [
            '[itemprop="addressLocality"]', '.locality', '.property-city',
            '.listing-city', '.city', 'span.city', 'div.city'
        ]
        
        # County selectors
        county_selectors = [
            '.county', 'span.county', 'div.county', '.property-county',
            '[data-testid="county"]'
        ]
        
        # State selectors
        state_selectors = [
            '[itemprop="addressRegion"]', '.region', '.property-state',
            '.listing-state', '.state', 'span.state', 'div.state'
        ]
        
        # Zip code selectors
        zip_selectors = [
            '[itemprop="postalCode"]', '.postal-code', '.property-zip',
            '.listing-zip', '.zip', 'span.zip', 'div.zip'
        ]
        
        # Try to extract each component
        for selector in address_selectors:
            elem = soup.select_one(selector)
            if elem and elem.text.strip():
                location["address"] = elem.text.strip()
                break
        
        for selector in city_selectors:
            elem = soup.select_one(selector)
            if elem and elem.text.strip():
                location["city"] = elem.text.strip()
                break
        
        for selector in county_selectors:
            elem = soup.select_one(selector)
            if elem and elem.text.strip():
                location["county"] = elem.text.strip()
                break
        
        for selector in state_selectors:
            elem = soup.select_one(selector)
            if elem and elem.text.strip():
                location["state"] = elem.text.strip()
                break
        
        for selector in zip_selectors:
            elem = soup.select_one(selector)
            if elem and elem.text.strip():
                location["zip_code"] = elem.text.strip()
                break
        
        # If we didn't find location components, try address patterns
        if not any(location.values()):
            # Look for full address pattern: City, State ZIP
            address_pattern = r'([^,]+),\s*([A-Z]{2})\s*(\d{5})'
            matches = re.search(address_pattern, soup.text)
            if matches:
                location["city"] = matches.group(1).strip()
                location["state"] = matches.group(2).strip()
                location["zip_code"] = matches.group(3).strip()
            
            # Look for county pattern
            county_pattern = r'([A-Za-z]+)\s+County'
            matches = re.search(county_pattern, soup.text)
            if matches:
                location["county"] = matches.group(1).strip() + " County"
        
        # Only return if we have useful location data
        if location["city"] or location["county"] or location["state"]:
            return location
        
        return None
    
    def _extract_zoning(self, soup: BeautifulSoup, domain: str) -> Optional[PropertyZoning]:
        """Extract zoning information"""
        zoning = PropertyZoning()
        
        # Zoning type selectors
        zoning_selectors = [
            '.zoning', 'span.zoning', 'div.zoning', '.property-zoning',
            '[data-testid="zoning"]', 'dt:contains("Zoning") + dd'
        ]
        
        # Try each selector
        for selector in zoning_selectors:
            zoning_elem = soup.select_one(selector)
            if zoning_elem and zoning_elem.text.strip():
                zoning_text = zoning_elem.text.strip()
                
                # Extract zoning code (typically alphanumeric code like R1, C2, etc.)
                code_match = re.search(r'([A-Za-z0-9\-]+)', zoning_text)
                if code_match:
                    zoning.code = code_match.group(1)
                
                # Determine zoning type based on patterns
                for zone_type, patterns in ZONING_PATTERNS.items():
                    for pattern in patterns:
                        if re.search(pattern, zoning_text, re.IGNORECASE):
                            zoning.type = zone_type
                            break
                    if zoning.type:
                        break
                
                # If we found a code but no type, try to infer type from code
                if zoning.code and not zoning.type:
                    first_char = zoning.code[0].upper()
                    if first_char == 'R':
                        zoning.type = "residential"
                    elif first_char == 'C':
                        zoning.type = "commercial"
                    elif first_char == 'A':
                        zoning.type = "agricultural"
                    elif first_char == 'I':
                        zoning.type = "industrial"
                
                break
        
        # If we didn't find zoning, try to infer from property description or features
        if not zoning.type and not zoning.code:
            # Look for zoning info in the full text
            for zone_type, patterns in ZONING_PATTERNS.items():
                for pattern in patterns:
                    regex_pattern = r'zon(ing|ed).*' + pattern
                    if re.search(regex_pattern, soup.text, re.IGNORECASE):
                        zoning.type = zone_type
                        break
                if zoning.type:
                    break
        
        # Only return if we have a type or code
        if zoning.type or zoning.code:
            return zoning
        
        return None
    
    def _extract_utilities(self, soup: BeautifulSoup, domain: str) -> Optional[List[str]]:
        """Extract utility information"""
        utilities = set()
        
        # Utility selectors
        utility_selectors = [
            '.utilities', 'span.utilities', 'div.utilities', '.property-utilities',
            '[data-testid="utilities"]', 'dt:contains("Utilities") + dd',
            '.features:contains("Utilities")', '.amenities:contains("Utilities")'
        ]
        
        # Utility patterns to look for
        utility_patterns = {
            "electricity": [r'electric', r'power', r'utilities\s+available'],
            "water": [r'water', r'well', r'city water', r'municipal water'],
            "sewer": [r'sewer', r'septic', r'waste'],
            "gas": [r'gas', r'natural gas', r'propane'],
            "internet": [r'internet', r'broadband', r'cable', r'fiber']
        }
        
        # Try each selector
        for selector in utility_selectors:
            utility_elem = soup.select_one(selector)
            if utility_elem and utility_elem.text.strip():
                utility_text = utility_elem.text.strip()
                
                # Check for each utility type
                for utility_name, patterns in utility_patterns.items():
                    for pattern in patterns:
                        if re.search(pattern, utility_text, re.IGNORECASE):
                            utilities.add(utility_name)
                            break
        
        # If we didn't find utilities, search in the full text
        if not utilities:
            for utility_name, patterns in utility_patterns.items():
                for pattern in patterns:
                    # Look for patterns like "electricity available" or "has well water"
                    regex_patterns = [
                        r'(' + pattern + r')\s+(available|on site|included)',
                        r'has\s+(' + pattern + r')'
                    ]
                    
                    for regex in regex_patterns:
                        if re.search(regex, soup.text, re.IGNORECASE):
                            utilities.add(utility_name)
                            break
        
        return list(utilities) if utilities else None
    
    def _check_road_access(self, soup: BeautifulSoup, domain: str) -> Optional[bool]:
        """Check if property has road access"""
        # Road access selectors
        road_selectors = [
            '.road-access', 'span.road-access', 'div.road-access', 
            '[data-testid="road-access"]', 'dt:contains("Road Access") + dd',
            '.features:contains("Road")', '.amenities:contains("Road")'
        ]
        
        # Access patterns to look for
        access_patterns = [
            r'road\s+access', r'street\s+access', r'highway\s+access',
            r'direct\s+access', r'access\s+road', r'paved\s+road',
            r'gravel\s+road', r'dirt\s+road'
        ]
        
        # Try each selector
        for selector in road_selectors:
            road_elem = soup.select_one(selector)
            if road_elem and road_elem.text.strip():
                for pattern in access_patterns:
                    if re.search(pattern, road_elem.text, re.IGNORECASE):
                        return True
        
        # Search in the full text
        for pattern in access_patterns:
            if re.search(pattern, soup.text, re.IGNORECASE):
                return True
        
        # If we find explicit mention of no access
        no_access_patterns = [
            r'no\s+road\s+access', r'no\s+direct\s+access',
            r'landlocked', r'no\s+access'
        ]
        
        for pattern in no_access_patterns:
            if re.search(pattern, soup.text, re.IGNORECASE):
                return False
        
        return None  # We don't know
    
    def _extract_and_filter_media(self, soup: BeautifulSoup, domain: str, base_url: str) -> List[PropertyAsset]:
        """Extract and filter media (images/videos) based on quality criteria"""
        assets = []
        
        # Image selectors
        image_selectors = [
            '.carousel img', '.listing-photos img', '.property-images img',
            '.gallery img', 'img.property-img', '.property-photo img',
            '.main-photo img', '.slide img', '.showcase img', '.photo-gallery img'
        ]
        
        # Video selectors
        video_selectors = [
            'iframe[src*="youtube"]', 'iframe[src*="vimeo"]',
            '.video-embed iframe', '.property-video iframe', '.video iframe',
            'a[href*="youtube.com/watch"]', 'a[href*="vimeo.com"]'
        ]
        
        # Process images
        images_found = set()  # Keep track of image URLs to avoid duplicates
        
        for selector in image_selectors:
            for img in soup.select(selector):
                # Get image URL
                img_url = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                
                if not img_url:
                    continue
                
                # Make absolute URL
                img_url = urllib.parse.urljoin(base_url, img_url)
                
                # Skip if already processed
                if img_url in images_found:
                    continue
                
                # Skip small images and icons
                width = self._parse_dimension(img.get('width'))
                height = self._parse_dimension(img.get('height'))
                quality_level = self.config.min_image_quality
                
                if width and height:
                    min_width, min_height = IMAGE_SIZE_PATTERNS.get(quality_level, (0, 0))
                    if width < min_width or height < min_height:
                        continue
                
                # Skip logos, icons by checking class names and dimensions
                if self._is_icon_or_logo(img):
                    continue
                
                # Add to assets
                asset = PropertyAsset(
                    id=f"image-{len(assets)}",
                    type="image",
                    url=img_url,
                    thumbnail=img_url,
                    title=img.get('alt') or f"Property Image {len(assets) + 1}",
                    selected=True
                )
                
                assets.append(asset)
                images_found.add(img_url)
                
                # Stop if we have enough images
                if len(images_found) >= self.config.min_image_count:
                    break
        
        # Process videos
        videos_found = set()  # Keep track of video URLs to avoid duplicates
        
        for selector in video_selectors:
            for vid in soup.select(selector):
                # Get video URL
                vid_url = None
                
                if vid.name == 'iframe':
                    vid_url = vid.get('src')
                elif vid.name == 'a':
                    vid_url = vid.get('href')
                
                if not vid_url:
                    continue
                
                # Make absolute URL
                vid_url = urllib.parse.urljoin(base_url, vid_url)
                
                # Skip if already processed
                if vid_url in videos_found:
                    continue
                
                # Add to assets
                asset = PropertyAsset(
                    id=f"video-{len(videos_found)}",
                    type="video",
                    url=vid_url,
                    title=f"Property Video {len(videos_found) + 1}",
                    selected=True
                )
                
                assets.append(asset)
                videos_found.add(vid_url)
        
        return assets
    
    def _extract_and_classify_documents(self, soup: BeautifulSoup, domain: str, base_url: str) -> List[PropertyDocument]:
        """Extract and classify documents (surveys, deeds, reports)"""
        documents = []
        
        # Document selectors
        document_selectors = [
            'a[href$=".pdf"]', 'a[href$=".doc"]', 'a[href$=".docx"]',
            'a[href$=".PDF"]', 'a[href$=".DOC"]', 'a[href$=".DOCX"]',
            '.documents a', '.property-documents a', '.attachments a',
            'a:contains("Survey")', 'a:contains("Deed")', 'a:contains("Report")',
            'a:contains("Plat")', 'a:contains("Map")'
        ]
        
        # Process document links
        docs_found = set()  # Keep track of document URLs to avoid duplicates
        
        for selector in document_selectors:
            for link in soup.select(selector):
                # Get document URL
                doc_url = link.get('href')
                
                if not doc_url:
                    continue
                
                # Make absolute URL
                doc_url = urllib.parse.urljoin(base_url, doc_url)
                
                # Skip if already processed
                if doc_url in docs_found:
                    continue
                
                # Get the link text
                link_text = link.text.strip()
                
                # Classify the document type
                doc_type = "other"
                confidence = 0.5
                
                for dtype, patterns in DOCUMENT_PATTERNS.items():
                    for pattern in patterns:
                        # Check URL and link text for patterns
                        if (re.search(pattern, doc_url, re.IGNORECASE) or 
                            re.search(pattern, link_text, re.IGNORECASE)):
                            doc_type = dtype
                            confidence = 0.9
                            break
                    if doc_type != "other":
                        break
                
                # Add to documents
                document = PropertyDocument(
                    type=doc_type,
                    url=doc_url,
                    title=link_text or f"{doc_type.capitalize()} Document",
                    confidence=confidence
                )
                
                documents.append(document)
                docs_found.add(doc_url)
        
        return documents
    
    def _extract_map_data(self, soup: BeautifulSoup, domain: str) -> Dict[str, Any]:
        """Extract map data including coordinates and boundaries"""
        result = {}
        
        # Try to extract coordinates from various sources
        coordinates = self._extract_coordinates_from_html(soup, domain)
        if coordinates:
            result["coordinates"] = coordinates
            result["coordinates_confidence"] = 0.9
        
        # Try to extract boundary data
        boundary = self._extract_boundary_data(soup, domain)
        if boundary:
            result["boundary_data"] = boundary
            result["boundary_confidence"] = 0.8
        
        return result
    
    def _extract_coordinates_from_html(self, soup: BeautifulSoup, domain: str) -> Optional[List[float]]:
        """Extract coordinates from HTML and return as [longitude, latitude] for MapBox compatibility"""
        # Try meta tags
        geo_position = soup.find('meta', {'name': 'geo.position'})
        if geo_position:
            content = geo_position.get('content', '')
            lat_lng = content.split(';')
            if len(lat_lng) == 2:
                try:
                    lat = float(lat_lng[0])
                    lng = float(lat_lng[1])
                    # Return as [longitude, latitude] for MapBox compatibility
                    return [lng, lat]
                except:
                    pass
        
        # Try meta with geo.placename and geo.region for location info
        geo_placename = soup.find('meta', {'name': 'geo.placename'})
        geo_region = soup.find('meta', {'name': 'geo.region'})
        if geo_placename and geo_region:
            try:
                # Store this for potential geocoding later
                self.location_info = {
                    "place": geo_placename.get('content', ''),
                    "region": geo_region.get('content', '')
                }
            except:
                pass
        
        # Try JSON+LD structured data (high accuracy source)
        for script in soup.find_all('script', {'type': 'application/ld+json'}):
            try:
                import json
                data = json.loads(script.string)
                
                # Handle both direct objects and arrays
                items = [data] if isinstance(data, dict) else data.get('@graph', [])
                
                for item in items:
                    # Check for several possible property paths
                    geo = item.get('geo') or item.get('spatialCoverage') or item.get('location')
                    
                    # If geo is directly an object
                    if geo and isinstance(geo, dict):
                        lat = geo.get('latitude')
                        lng = geo.get('longitude')
                        
                        if lat and lng:
                            try:
                                return [float(lng), float(lat)]  # [longitude, latitude] for MapBox
                            except:
                                pass
                    
                    # Check if location info is at top level
                    lat = item.get('latitude')
                    lng = item.get('longitude')
                    if lat and lng:
                        try:
                            return [float(lng), float(lat)]  # [longitude, latitude] for MapBox
                        except:
                            pass
            except Exception as e:
                logger.debug(f"Error parsing JSON-LD: {str(e)}")
                continue
        
        # Try to find coordinates in map-related attributes in divs
        map_div_selectors = ['div[data-map]', 'div.map', 'div#map', 'div.map-container', '[data-coordinates]']
        
        for selector in map_div_selectors:
            for div in soup.select(selector):
                # Look for data attributes that might contain coordinates
                for attr in ['data-map', 'data-coordinates', 'data-lat-lng', 'data-location']:
                    if div.has_attr(attr):
                        attr_value = div[attr]
                        # Try to parse as JSON
                        try:
                            import json
                            data = json.loads(attr_value)
                            lat = data.get('lat') or data.get('latitude')
                            lng = data.get('lng') or data.get('longitude')
                            if lat and lng:
                                return [float(lng), float(lat)]  # [longitude, latitude] for MapBox
                        except:
                            # Try regex patterns on the attribute value
                            try:
                                match = re.search(r'(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)', attr_value)
                                if match:
                                    lat = float(match.group(1))
                                    lng = float(match.group(2))
                                    return [lng, lat]  # [longitude, latitude] for MapBox
                            except:
                                pass
        
        # Try to find coordinates in Google Maps iframes (common on property sites)
        for iframe in soup.find_all('iframe'):
            src = iframe.get('src', '')
            if 'google.com/maps' in src or 'maps.google.com' in src:
                # Extract coordinates from Google Maps URL
                # Try the q= parameter (used in simple maps)
                match = re.search(r'q=(-?\d+\.\d+),(-?\d+\.\d+)', src)
                if match:
                    try:
                        lat = float(match.group(1))
                        lng = float(match.group(2))
                        return [lng, lat]  # [longitude, latitude] for MapBox
                    except:
                        pass
                        
                # Try the ll= parameter (used in some map URLs)
                match = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', src)
                if match:
                    try:
                        lat = float(match.group(1))
                        lng = float(match.group(2))
                        return [lng, lat]  # [longitude, latitude] for MapBox
                    except:
                        pass
                        
                # Try the center= parameter (used in embedded maps)
                match = re.search(r'center=(-?\d+\.\d+),(-?\d+\.\d+)', src)
                if match:
                    try:
                        lat = float(match.group(1))
                        lng = float(match.group(2))
                        return [lng, lat]  # [longitude, latitude] for MapBox
                    except:
                        pass
        
        # Check for Leaflet.js maps (used by many real estate sites)
        leaflet_scripts = soup.find_all('script', text=re.compile(r'L\.map|leaflet', re.IGNORECASE))
        for script in leaflet_scripts:
            if script.string:
                # Try to extract coordinates from Leaflet initialization
                match = re.search(r'setView\(\s*\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]', script.string)
                if match:
                    try:
                        lat = float(match.group(1))
                        lng = float(match.group(2))
                        return [lng, lat]  # [longitude, latitude] for MapBox
                    except:
                        pass
        
        # Try to find coordinates in text in the HTML
        coord_patterns = [
            r'latitude[:\s]*(-?\d+\.\d+)[,\s]+longitude[:\s]*(-?\d+\.\d+)',
            r'lat[:\s]*(-?\d+\.\d+)[,\s]+lng[:\s]*(-?\d+\.\d+)',
            r'lat[:\s]*(-?\d+\.\d+)[,\s]+long[:\s]*(-?\d+\.\d+)',
            r'coordinates[:\s]*(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)',
            r'location[:\s]*(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)',
            r'(-?\d+\.\d+)[°]\s*N[,\s]+(-?\d+\.\d+)[°]\s*W',
            r'(-?\d+\.\d+)[°]\s*S[,\s]+(-?\d+\.\d+)[°]\s*E'
        ]
        
        for pattern in coord_patterns:
            match = re.search(pattern, soup.text, re.IGNORECASE)
            if match:
                try:
                    lat = float(match.group(1))
                    lng = float(match.group(2))
                    
                    # Validate the coordinates are in a reasonable range
                    if abs(lat) <= 90 and abs(lng) <= 180:
                        return [lng, lat]  # [longitude, latitude] for MapBox
                except:
                    pass
        
        # If we have location info but no coordinates, we could use a geocoding service here
        # (implementation would depend on having access to a geocoding API)
        
        return None
    
    def _extract_boundary_data(self, soup: BeautifulSoup, domain: str) -> Optional[BoundaryData]:
        """Extract property boundary data"""
        boundary = BoundaryData()
        
        # Look for KML links
        kml_links = soup.select('a[href$=".kml"], a[href$=".kmz"], a[href*="kml"]')
        if kml_links:
            boundary.kml_url = kml_links[0].get('href')
            boundary.source = "kml"
            return boundary
        
        # Look for GeoJSON or boundary data in scripts
        for script in soup.find_all('script'):
            script_content = script.string
            if not script_content:
                continue
            
            # Look for GeoJSON
            if 'GeoJSON' in script_content or 'coordinates' in script_content:
                geojson_match = re.search(r'({[^}]*"type"\s*:\s*"Feature"[^}]*})', script_content)
                if geojson_match:
                    try:
                        import json
                        geojson = json.loads(geojson_match.group(1))
                        boundary.geojson = geojson
                        boundary.source = "geojson"
                        
                        # Extract points if available
                        coords = geojson.get('geometry', {}).get('coordinates', [])
                        if coords and isinstance(coords[0], list):
                            boundary.points = coords
                        
                        return boundary
                    except:
                        pass
            
            # Look for coordinate arrays
            coord_array_match = re.search(r'\[\s*\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]', script_content)
            if coord_array_match:
                # Found what looks like a coordinate array, try to extract all points
                try:
                    import json
                    # Find the array start and end
                    array_match = re.search(r'(\[\s*\[\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*\].*?\])', script_content)
                    if array_match:
                        coord_array = json.loads(array_match.group(1))
                        if coord_array and isinstance(coord_array[0], list):
                            boundary.points = coord_array
                            boundary.source = "coordinates"
                            return boundary
                except:
                    pass
        
        return None
    
    def _extract_targeted_descriptions(self, soup: BeautifulSoup, domain: str) -> Dict[str, Any]:
        """Extract only property-specific descriptions and features"""
        result = {
            "description": "",
            "features": []
        }
        
        # Description selectors that typically contain only property info
        description_selectors = [
            '.property-description', '.listing-description', '.description',
            'div[itemprop="description"]', '[data-testid="description"]',
            '.desc-block', '.property-desc', '.listing-details-text'
        ]
        
        # Feature selectors
        feature_selectors = [
            '.property-features', '.listing-features', '.features',
            'ul.features', '.amenities', 'ul.amenities', '.details-list',
            '[data-testid="features"]', '.feature-list', '.property-amenities'
        ]
        
        # Extract description
        for selector in description_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem and desc_elem.text.strip():
                # Clean up the description text
                description = desc_elem.text.strip()
                
                # Filter out disclaimers, agent info, etc.
                description = self._filter_description(description)
                
                if description:
                    result["description"] = description
                    break
        
        # If we couldn't find a specific description element, try to find paragraphs
        # in property details sections
        if not result["description"]:
            content_selectors = [
                '.property-details', '.listing-details', '.main-content',
                '#main-content', '.property-content', '.listing-content'
            ]
            
            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem:
                    paragraphs = content_elem.find_all('p')
                    description_parts = []
                    
                    for p in paragraphs:
                        text = p.text.strip()
                        if text and len(text) > 50:  # Avoid very short paragraphs
                            # Filter out disclaimers, agent info, etc.
                            filtered = self._filter_description(text)
                            if filtered:
                                description_parts.append(filtered)
                    
                    if description_parts:
                        result["description"] = " ".join(description_parts)
                        break
        
        # Extract features
        features = []
        
        for selector in feature_selectors:
            feature_elem = soup.select_one(selector)
            if feature_elem:
                # Check for list items
                feature_items = feature_elem.find_all('li')
                
                if feature_items:
                    for item in feature_items:
                        feature_text = item.text.strip()
                        if feature_text:
                            features.append(feature_text)
                else:
                    # If no list items, try to find feature labels/spans
                    for child in feature_elem.find_all(['span', 'div', 'p']):
                        feature_text = child.text.strip()
                        if feature_text and len(feature_text) < 100:  # Avoid descriptions
                            features.append(feature_text)
        
        # Convert features to the expected format
        result["features"] = [{"name": f, "value": "", "category": "property"} for f in features]
        
        return result
    
    def _filter_description(self, text: str) -> str:
        """Filter out non-property content from descriptions"""
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Filter out sentences that are likely disclaimers or ads
        filtered_sentences = []
        
        for sentence in sentences:
            # Skip disclaimer patterns
            disclaimer_patterns = [
                r'disclaimer', r'all information deemed reliable', 
                r'subject to change', r'all rights reserved',
                r'copyright', r'listing courtesy of', r'listing agent',
                r'call.*for.*details', r'contact.*for.*information',
                r'equal housing opportunity', r'fair housing'
            ]
            
            is_disclaimer = False
            for pattern in disclaimer_patterns:
                if re.search(pattern, sentence, re.IGNORECASE):
                    is_disclaimer = True
                    break
            
            if not is_disclaimer:
                filtered_sentences.append(sentence)
        
        return " ".join(filtered_sentences)
    
    def _is_icon_or_logo(self, img_tag: Tag) -> bool:
        """Check if an image tag is likely an icon or logo"""
        # Check class names
        class_str = img_tag.get('class', [])
        class_str = " ".join(class_str) if isinstance(class_str, list) else str(class_str)
        
        icon_patterns = [
            r'icon', r'logo', r'badge', r'thumbnail', r'avatar', 
            r'favicon', r'banner', r'social', r'button'
        ]
        
        for pattern in icon_patterns:
            if re.search(pattern, class_str, re.IGNORECASE):
                return True
        
        # Check dimensions
        width = self._parse_dimension(img_tag.get('width'))
        height = self._parse_dimension(img_tag.get('height'))
        
        if width and height:
            # Icons are typically small and square-ish
            if width <= 150 and height <= 150:
                # Square or nearly square
                if abs(width - height) < 20:
                    return True
        
        # Check alt text
        alt = img_tag.get('alt', '')
        for pattern in ['icon', 'logo', 'button']:
            if re.search(pattern, alt, re.IGNORECASE):
                return True
        
        return False
    
    def _parse_dimension(self, value: Optional[str]) -> Optional[int]:
        """Parse image dimension from string"""
        if not value:
            return None
        
        # Remove non-numeric characters
        try:
            # Handle percentage values
            if '%' in value:
                return None
            
            # Extract numeric part
            num_value = re.sub(r'[^0-9]', '', value)
            if num_value:
                return int(num_value)
        except:
            pass
        
        return None
    
    def _calculate_confidence(self, field: str, data: Dict[str, Any]) -> float:
        """Calculate confidence score for a field"""
        # Default confidence if field exists
        if field in data and data[field]:
            # For complex fields, check if they have all expected sub-fields
            if field == "location":
                location = data[field]
                
                # Number of valid sub-fields
                valid_fields = sum(1 for v in location.values() if v)
                
                # Confidence based on completeness
                return min(0.5 + (valid_fields / 10), 1.0)
            
            # For arrays, check count
            elif field == "features" and isinstance(data[field], list):
                count = len(data[field])
                return min(0.5 + (count / 20), 1.0)
            
            # For special fields with confidence already calculated
            elif field in self.uncertain_fields:
                return 0.5
            
            # Default confidence for populated fields
            return 0.9
        
        # Field is missing
        return 0.0
    
    def _calculate_asset_confidence(self, assets: List[Any], asset_type: str) -> float:
        """Calculate confidence for assets of a specific type"""
        if not assets:
            return 0.0
        
        # Count assets of the requested type
        count = sum(1 for a in assets if getattr(a, 'type', '') == asset_type)
        
        if count == 0:
            return 0.0
        
        # For images, check if we have enough
        if asset_type == "image":
            if count < self.config.min_image_count:
                return 0.5
            return 0.9
        
        # For other assets, any is good
        return 0.9
    
    def _calculate_overall_confidence(self, metrics: ConfidenceMetrics) -> float:
        """Calculate overall confidence from individual metrics"""
        # Get all available confidence values
        values = []
        
        for field in dir(metrics):
            # Skip non-confidence fields
            if field.startswith('_') or field == 'overall':
                continue
            
            value = getattr(metrics, field)
            if value is not None:
                values.append(value)
        
        # If no values, return 0
        if not values:
            return 0.0
        
        # Return average
        return sum(values) / len(values)