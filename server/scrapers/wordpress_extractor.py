"""
WordPress Property Data Extractor

This module specializes in extracting property data from WordPress-based property listing sites.
It leverages WordPress-specific patterns and structures to reliably extract property details.
"""

import re
import json
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# Try different import approaches
try:
    # Absolute import
    from server.scrapers.image_extraction import extract_images
except ImportError:
    try:
        # Relative import
        from .image_extraction import extract_images
    except ImportError:
        try:
            # Direct import from same directory
            from image_extraction import extract_images
        except ImportError:
            # If all imports fail, define a basic fallback function
            def extract_images(soup, url):
                return []  # Return empty array as fallback

def extract_data(soup: BeautifulSoup, url: str) -> Dict[str, Any]:
    """
    Extract property data from WordPress-based property listing pages
    
    Args:
        soup: BeautifulSoup object with parsed HTML
        url: Original URL of the property listing
        
    Returns:
        Dictionary containing the extracted property data
    """
    # Initialize with base structure and metadata
    data = {
        'title': '',
        'description': '',
        'price': 0,
        'acreage': 0,
        'location': {},
        'features': [],
        'assets': [],
        'source_url': url,
        'source_domain': urlparse(url).netloc,
        'extractor_used': 'wordpress',
        'confidence_metrics': {
            'overall_score': 0.7,  # Initial confidence score
            'component_scores': {}
        }
    }
    
    # Enhanced error handling
    try:
        # Extract property title - try various WordPress patterns
        title = _extract_title(soup)
        if title:
            data['title'] = title
            data['confidence_metrics']['component_scores']['title'] = 0.9
        
        # Extract property description
        description = _extract_description(soup)
        if description:
            data['description'] = description
            data['confidence_metrics']['component_scores']['description'] = 0.8
        
        # Extract price
        price = _extract_price(soup)
        if price is not None:
            data['price'] = price
            data['confidence_metrics']['component_scores']['price'] = 0.85
        
        # Extract acreage/size
        acreage = _extract_acreage(soup)
        if acreage is not None:
            data['acreage'] = acreage
            data['confidence_metrics']['component_scores']['acreage'] = 0.8
        
        # Extract location information
        location_data = _extract_location(soup)
        if location_data:
            data['location'] = location_data
            data['state'] = location_data.get('state', '')
            data['confidence_metrics']['component_scores']['location'] = 0.75
        
        # Extract property features
        features = _extract_features(soup)
        if features:
            data['features'] = features
            data['confidence_metrics']['component_scores']['features'] = 0.8
        
        # Extract property type
        property_type = _extract_property_type(soup)
        if property_type:
            data['property_type'] = property_type
            data['confidence_metrics']['component_scores']['property_type'] = 0.7
        
        # Extract coordinates with improved accuracy
        coordinates = _extract_coordinates(soup)
        if coordinates:
            data['coordinates'] = coordinates
            data['coordinates_array'] = [coordinates.get('longitude', 0), coordinates.get('latitude', 0)]
            data['latitude'] = coordinates.get('latitude', 0)
            data['longitude'] = coordinates.get('longitude', 0)
            data['confidence_metrics']['component_scores']['coordinates'] = 0.85
            
        # Extract video content
        video_data = _extract_videos(soup, url)
        if video_data:
            data['video_url'] = video_data.get('main_video_url', '')
            data['video_sources'] = video_data.get('all_videos', [])
            data['confidence_metrics']['component_scores']['videos'] = 0.8
            
        # Extract document links
        documents = _extract_documents(soup, url)
        if documents:
            data['documents'] = documents
            data['confidence_metrics']['component_scores']['documents'] = 0.75
        
        # Extract additional details
        details = _extract_details(soup)
        if details:
            # Merge details with main data
            for key, value in details.items():
                if key not in data or not data[key]:
                    data[key] = value
            data['confidence_metrics']['component_scores']['details'] = 0.75
        
        # Extract images using the optimized image extraction module
        images = extract_images(soup, url)
        if images:
            data['assets'] = images
            data['confidence_metrics']['component_scores']['images'] = 0.9
        
        # Calculate overall confidence score based on component scores
        component_scores = data['confidence_metrics']['component_scores']
        if component_scores:
            data['confidence_metrics']['overall_score'] = sum(component_scores.values()) / len(component_scores)
        
    except Exception as e:
        print(f"Error extracting data from WordPress site: {e}")
        # Set a lower confidence score if extraction had errors
        data['confidence_metrics']['overall_score'] = 0.4
        data['extraction_error'] = str(e)
    
    return data

def _extract_title(soup: BeautifulSoup) -> str:
    """Extract property title from WordPress page"""
    # Try in order of common WordPress patterns
    
    # 1. Look for h1 in article or main content
    for container in ['article', '.post', '.entry-content', 'main', '.main-content']:
        container_elem = soup.select_one(container)
        if container_elem and container_elem.find('h1'):
            return container_elem.find('h1').get_text(strip=True)
    
    # 2. Look for standard h1 anywhere
    if soup.find('h1'):
        return soup.find('h1').get_text(strip=True)
    
    # 3. Look for .entry-title class (common in WordPress)
    entry_title = soup.select_one('.entry-title')
    if entry_title:
        return entry_title.get_text(strip=True)
    
    # 4. Look in page title if nothing else
    title_tag = soup.find('title')
    if title_tag:
        # Remove site name from title if possible
        title_text = title_tag.get_text(strip=True)
        if ' | ' in title_text:
            return title_text.split(' | ')[0].strip()
        if ' - ' in title_text:
            return title_text.split(' - ')[0].strip()
        return title_text
    
    return ""

def _extract_description(soup: BeautifulSoup) -> str:
    """Extract property description from WordPress page"""
    # Common classes for description content in WordPress real estate themes
    description_selectors = [
        '.entry-content', 
        '.post-content', 
        '.property-description',
        '.description',
        '#property-description',
        '.content-area',
        '.property-content',
        '[itemprop="description"]'
    ]
    
    # Try each selector
    for selector in description_selectors:
        desc_elem = soup.select_one(selector)
        if desc_elem:
            # Remove any nested irrelevant elements
            for unwanted in desc_elem.select('.social-share, .property-meta, .property-features, .agent-box, .related-properties, script, style'):
                unwanted.decompose()
            
            # Get text and clean it up
            desc_text = desc_elem.get_text(separator=' ', strip=True)
            desc_text = re.sub(r'\s+', ' ', desc_text)
            
            # If description is too short, it's probably not the full description
            if len(desc_text) > 50:
                return desc_text
    
    # Try to find the first substantial paragraph after the title
    article = soup.select_one('article') or soup
    paragraphs = article.find_all('p')
    for p in paragraphs:
        p_text = p.get_text(strip=True)
        if len(p_text) > 100:  # Must be a substantial paragraph
            return p_text
    
    # If we still don't have a description, combine all paragraphs
    if paragraphs:
        all_text = ' '.join([p.get_text(strip=True) for p in paragraphs[:3]])
        return all_text
    
    return ""

def _extract_price(soup: BeautifulSoup) -> Optional[float]:
    """Extract property price from WordPress page"""
    # Check for classiccountryland.com specific pattern first
    if "classiccountryland.com" in str(soup):
        # Check for price in specific formats used by classiccountryland.com
        classic_price_patterns = [
            r'PRICE:\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',  # PRICE: $100,000.00
            r'Price:\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',  # Price: $100,000.00
            r'(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*per acre',  # 10,000.00 per acre
            r'(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/acre',        # 10,000.00/acre
        ]
        
        all_text = soup.get_text()
        # Try to find full property price first
        for pattern in classic_price_patterns[:2]:  # Just the first two patterns are for full price
            price_match = re.search(pattern, all_text, re.IGNORECASE)
            if price_match:
                price_str = price_match.group(1).replace(',', '')
                try:
                    return float(price_str)
                except ValueError:
                    continue
                
        # Look for price per acre and multiply by acreage if found
        for pattern in classic_price_patterns[2:]:  # Last two patterns are for price per acre
            price_match = re.search(pattern, all_text, re.IGNORECASE)
            if price_match:
                price_per_acre_str = price_match.group(1).replace(',', '')
                try:
                    price_per_acre = float(price_per_acre_str)
                    acreage_pattern = r'(\d+(?:\.\d+)?)\s*(?:acres|acre|ac)'
                    acreage_match = re.search(acreage_pattern, all_text, re.IGNORECASE)
                    if acreage_match:
                        acreage = float(acreage_match.group(1))
                        return price_per_acre * acreage
                except ValueError:
                    continue
    
    # Common price selectors in WordPress real estate themes
    price_selectors = [
        '.property-price', 
        '.price',
        '.listing-price',
        '[itemprop="price"]',
        '.property-meta .price',
        '.property-information .price',
        '.property-details .price',
        '.detail-price',  # Additional selector for some themes
        '.property-data .price'  # Additional selector
    ]
    
    for selector in price_selectors:
        price_elem = soup.select_one(selector)
        if price_elem:
            price_text = price_elem.get_text(strip=True)
            # Extract digits from price
            price_digits = re.sub(r'[^\d.]', '', price_text)
            if price_digits:
                try:
                    return float(price_digits)
                except ValueError:
                    continue
    
    # Try looking for price in the text with regex patterns
    price_patterns = [
        r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',  # $100,000.00
        r'(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*dollars',  # 100,000.00 dollars
        r'Price:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',  # Price: $100,000.00
        r'Listed for\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',  # Listed for $100,000.00
        r'List price:?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',  # List price: $100,000.00
    ]
    
    for pattern in price_patterns:
        all_text = soup.get_text()
        price_match = re.search(pattern, all_text)
        if price_match:
            price_str = price_match.group(1).replace(',', '')
            try:
                return float(price_str)
            except ValueError:
                continue
    
    return None

def _extract_acreage(soup: BeautifulSoup) -> Optional[float]:
    """Extract property acreage/size from WordPress page"""
    # Specific acreage/size selectors
    acreage_selectors = [
        '.property-size', 
        '.acreage',
        '.land-size',
        '.property-meta .size',
        '.property-information .size',
        '.property-details .size'
    ]
    
    for selector in acreage_selectors:
        acreage_elem = soup.select_one(selector)
        if acreage_elem:
            acreage_text = acreage_elem.get_text(strip=True)
            # Look for numbers followed by 'acres' or 'ac'
            acreage_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:acres|acre|ac)', acreage_text, re.IGNORECASE)
            if acreage_match:
                try:
                    return float(acreage_match.group(1))
                except ValueError:
                    continue
    
    # Try looking for acreage in the text with regex patterns
    acreage_patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:acres|acre|ac)',  # 10.5 acres
        r'Acreage:\s*(\d+(?:\.\d+)?)',  # Acreage: 10.5
        r'Lot Size:\s*(\d+(?:\.\d+)?)\s*(?:acres|acre|ac)',  # Lot Size: 10.5 acres
        r'Property Size:\s*(\d+(?:\.\d+)?)\s*(?:acres|acre|ac)',  # Property Size: 10.5 acres
    ]
    
    for pattern in acreage_patterns:
        all_text = soup.get_text()
        acreage_match = re.search(pattern, all_text, re.IGNORECASE)
        if acreage_match:
            try:
                return float(acreage_match.group(1))
            except ValueError:
                continue
    
    return None

def _extract_location(soup: BeautifulSoup) -> Dict[str, str]:
    """Extract property location information from WordPress page"""
    location_data = {}
    
    # Special handling for classiccountryland.com
    if "classiccountryland.com" in str(soup):
        all_text = soup.get_text()
        
        # Check URL path for state information
        url_path = ''
        canonical_link = soup.find('link', {'rel': 'canonical'})
        if canonical_link and canonical_link.get('href'):
            url_path = canonical_link.get('href').lower()
        else:
            # Try to find the URL in the HTML
            og_url = soup.find('meta', {'property': 'og:url'})
            if og_url and og_url.get('content'):
                url_path = og_url.get('content').lower()
        
        # Extract state from URL path if available
        state_matches = {
            'oklahoma': 'Oklahoma',
            'texas': 'Texas',
            'arkansas': 'Arkansas',
            'missouri': 'Missouri',
            'kansas': 'Kansas',
            'colorado': 'Colorado',
            'new-mexico': 'New Mexico',
            'arizona': 'Arizona',
            'california': 'California',
            'nevada': 'Nevada',
            'utah': 'Utah',
            'oregon': 'Oregon',
            'washington': 'Washington',
            'idaho': 'Idaho',
            'montana': 'Montana',
            'wyoming': 'Wyoming',
        }
        
        for state_key, state_name in state_matches.items():
            if f"/{state_key}-land-for-sale/" in url_path or f"/{state_key}/" in url_path:
                location_data['state'] = state_name
                break
                
        # Look for location information in paragraphs
        paragraphs = soup.find_all('p')
        for p in paragraphs:
            text = p.get_text(strip=True)
            
            # Check for common location patterns
            if 'county' in text.lower() and len(text) < 150:  # Avoid large paragraphs
                county_match = re.search(r'in\s+([A-Za-z\s]+)\s+County', text, re.IGNORECASE)
                if county_match:
                    location_data['county'] = county_match.group(1).strip()
            
            # Check for city or town mentions
            city_match = re.search(r'near\s+([A-Za-z\s]+),\s+([A-Z]{2}|[A-Za-z\s]+)', text)
            if city_match:
                location_data['city'] = city_match.group(1).strip()
                # If state is in the match and we don't have it yet
                if len(city_match.group(2)) == 2 and 'state' not in location_data:
                    location_data['state'] = city_match.group(2).strip()
                elif len(city_match.group(2)) > 2 and 'state' not in location_data:
                    location_data['state'] = city_match.group(2).strip()
            
            # Extract address component if we find a typical address format
            address_match = re.search(r'located\s+at\s+([^\.]+)', text, re.IGNORECASE)
            if address_match and 'address' not in location_data:
                location_data['address'] = address_match.group(1).strip()
        
        # If we found state in the URL but not in the text, check the title
        if 'state' not in location_data:
            title_elem = soup.find('title')
            if title_elem:
                title_text = title_elem.get_text()
                for state_name in state_matches.values():
                    if state_name in title_text:
                        location_data['state'] = state_name
                        break
        
        # If we still don't have a state, try heading elements
        if 'state' not in location_data:
            for heading in soup.find_all(['h1', 'h2', 'h3']):
                heading_text = heading.get_text(strip=True)
                for state_name in state_matches.values():
                    if state_name in heading_text:
                        location_data['state'] = state_name
                        break
                if 'state' in location_data:
                    break
        
        # Default to Oklahoma for classiccountryland if no state found
        if 'state' not in location_data:
            location_data['state'] = 'Oklahoma'
            
        return location_data
    
    # Standard extraction for other WordPress sites
    # Look for structured location data in meta tags
    location_meta = soup.find('meta', {'property': 'og:locality'}) or soup.find('meta', {'property': 'og:region'})
    if location_meta and location_meta.get('content'):
        location_data['address'] = location_meta.get('content')
    
    # Look for location in schema.org data
    schema_script = soup.find('script', {'type': 'application/ld+json'})
    if schema_script:
        try:
            schema_data = json.loads(schema_script.string)
            if isinstance(schema_data, list):
                schema_data = schema_data[0]
            
            if 'address' in schema_data:
                address = schema_data['address']
                location_data['address'] = address.get('streetAddress', '')
                location_data['city'] = address.get('addressLocality', '')
                location_data['state'] = address.get('addressRegion', '')
                location_data['zipcode'] = address.get('postalCode', '')
                location_data['country'] = address.get('addressCountry', '')
        except (json.JSONDecodeError, AttributeError):
            pass
    
    # Look for common location selectors
    location_selectors = [
        '.property-address', 
        '.property-location',
        '.address',
        '[itemprop="address"]',
        '.property-meta .location',
        '.property-information .location',
        '.property-details .location'
    ]
    
    for selector in location_selectors:
        location_elem = soup.select_one(selector)
        if location_elem:
            location_text = location_elem.get_text(strip=True)
            # If we already have address data, only take this if it's more complete
            if 'address' not in location_data or len(location_text) > len(location_data['address']):
                location_data['address'] = location_text
    
    # Try to extract city/state from text if we don't have it
    if 'city' not in location_data or 'state' not in location_data:
        # Look for City, State format
        city_state_regex = r'([A-Za-z\s.]+),\s*([A-Z]{2})'
        all_text = soup.get_text()
        matches = re.findall(city_state_regex, all_text)
        if matches:
            # Take the first match
            location_data['city'] = matches[0][0].strip()
            location_data['state'] = matches[0][1].strip()
    
    return location_data

def _extract_features(soup: BeautifulSoup) -> List[str]:
    """Extract property features from WordPress page"""
    features = []
    
    # Common feature selectors in WordPress real estate themes
    feature_selectors = [
        '.property-features', 
        '.features',
        '.amenities',
        '.property-details ul',
        '.property-information ul',
        '[itemprop="amenityFeature"]'
    ]
    
    for selector in feature_selectors:
        feature_elements = soup.select(selector)
        for element in feature_elements:
            # If it's a list, get all list items
            list_items = element.find_all('li')
            if list_items:
                for item in list_items:
                    feature_text = item.get_text(strip=True)
                    if feature_text and feature_text not in features:
                        features.append(feature_text)
            else:
                # If not a list, split by commas or new lines
                feature_text = element.get_text(strip=True)
                if feature_text:
                    for feature in re.split(r',|\n', feature_text):
                        clean_feature = feature.strip()
                        if clean_feature and clean_feature not in features:
                            features.append(clean_feature)
    
    # If we still don't have features, look for key feature words in paragraphs
    if not features:
        feature_keywords = ['feature', 'amenity', 'include', 'offer', 'provide', 'come with']
        paragraphs = soup.find_all('p')
        for p in paragraphs:
            p_text = p.get_text(strip=True).lower()
            # Check if paragraph contains feature keywords
            if any(keyword in p_text for keyword in feature_keywords):
                # Split into sentences
                sentences = re.split(r'[.!?]+', p_text)
                for sentence in sentences:
                    if any(keyword in sentence for keyword in feature_keywords):
                        features.append(sentence.strip().capitalize())
                        break
    
    return features

def _extract_property_type(soup: BeautifulSoup) -> str:
    """Extract property type from WordPress page"""
    # Check for type in meta keywords
    meta_keywords = soup.find('meta', {'name': 'keywords'})
    if meta_keywords and meta_keywords.get('content'):
        keywords = meta_keywords.get('content').lower()
        property_types = ['land', 'farm', 'ranch', 'residential', 'commercial', 'recreational', 'agricultural', 'conservation']
        for p_type in property_types:
            if p_type in keywords:
                return p_type
    
    # Look for property type selectors
    type_selectors = [
        '.property-type', 
        '.listing-type',
        '[itemprop="category"]'
    ]
    
    for selector in type_selectors:
        type_elem = soup.select_one(selector)
        if type_elem:
            type_text = type_elem.get_text(strip=True).lower()
            # Convert to standardized types
            if 'land' in type_text:
                return 'land'
            if 'farm' in type_text:
                return 'farm'
            if 'ranch' in type_text:
                return 'ranch'
            if 'residential' in type_text:
                return 'residential'
            if 'commercial' in type_text:
                return 'commercial'
            if 'recreation' in type_text:
                return 'recreational'
            if 'agricult' in type_text:
                return 'agricultural'
            if 'conservation' in type_text:
                return 'conservation'
    
    # Default to land if we can't determine
    return 'land'

def _extract_videos(soup: BeautifulSoup, base_url: str) -> Dict[str, Any]:
    """
    Extract video URLs from WordPress property page
    
    Args:
        soup: BeautifulSoup object with parsed HTML
        base_url: Original URL of the property listing
        
    Returns:
        Dictionary with main_video_url and list of all_videos
    """
    video_data = {
        'main_video_url': '',
        'all_videos': []
    }
    
    # Look for video elements
    video_elements = soup.find_all('video')
    for video in video_elements:
        source = video.find('source')
        if source and source.get('src'):
            video_url = source.get('src')
            # Make absolute URL if relative
            if not video_url.startswith(('http://', 'https://')):
                video_url = urljoin(base_url, video_url)
            
            # Store the first one as main, all in list
            if not video_data['main_video_url']:
                video_data['main_video_url'] = video_url
            
            if video_url not in video_data['all_videos']:
                video_data['all_videos'].append(video_url)
    
    # Look for iframe videos (YouTube, Vimeo, etc.)
    iframe_videos = soup.find_all('iframe')
    for iframe in iframe_videos:
        src = iframe.get('src', '')
        if src and any(service in src for service in ['youtube', 'vimeo', 'wistia']):
            # Store the first one as main if we don't have one yet
            if not video_data['main_video_url']:
                video_data['main_video_url'] = src
            
            if src not in video_data['all_videos']:
                video_data['all_videos'].append(src)
    
    # Look for video links in the HTML
    video_links = soup.find_all('a', href=True)
    for link in video_links:
        href = link.get('href', '')
        if href and any(ext in href.lower() for ext in ['.mp4', '.mov', '.avi', '.webm']):
            # Make absolute URL if relative
            if not href.startswith(('http://', 'https://')):
                href = urljoin(base_url, href)
                
            # Store the first one as main if we don't have one yet
            if not video_data['main_video_url']:
                video_data['main_video_url'] = href
            
            if href not in video_data['all_videos']:
                video_data['all_videos'].append(href)
    
    # Look for video URLs in script tags
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string:
            # Look for video URLs in the script
            video_patterns = [
                r'videoUrl\s*[=:]\s*[\'"]([^\'"]+)[\'"]',
                r'videoSrc\s*[=:]\s*[\'"]([^\'"]+)[\'"]',
                r'video_url\s*[=:]\s*[\'"]([^\'"]+)[\'"]'
            ]
            
            for pattern in video_patterns:
                matches = re.findall(pattern, script.string)
                for match in matches:
                    if match and any(ext in match.lower() for ext in ['.mp4', '.mov', '.avi', '.webm']):
                        # Make absolute URL if relative
                        if not match.startswith(('http://', 'https://')):
                            match = urljoin(base_url, match)
                        
                        # Store the first one as main if we don't have one yet
                        if not video_data['main_video_url']:
                            video_data['main_video_url'] = match
                        
                        if match not in video_data['all_videos']:
                            video_data['all_videos'].append(match)
    
    return video_data

def _extract_documents(soup: BeautifulSoup, base_url: str) -> List[Dict[str, str]]:
    """
    Extract document links from WordPress property page
    
    Args:
        soup: BeautifulSoup object with parsed HTML
        base_url: Original URL of the property listing
        
    Returns:
        List of document objects with url, name, and type
    """
    documents = []
    document_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv']
    
    # Find all links that could be documents
    links = soup.find_all('a', href=True)
    for link in links:
        href = link.get('href', '')
        if href and any(ext in href.lower() for ext in document_extensions):
            # Get the document name
            doc_name = link.get_text(strip=True)
            if not doc_name:
                # Use the filename as name if link text is empty
                doc_name = href.split('/')[-1]
            
            # Make absolute URL if relative
            if not href.startswith(('http://', 'https://')):
                href = urljoin(base_url, href)
            
            # Determine document type
            doc_type = 'application/octet-stream'  # Default MIME type
            if href.lower().endswith('.pdf'):
                doc_type = 'application/pdf'
            elif href.lower().endswith(('.doc', '.docx')):
                doc_type = 'application/msword'
            elif href.lower().endswith(('.xls', '.xlsx')):
                doc_type = 'application/excel'
            elif href.lower().endswith('.txt'):
                doc_type = 'text/plain'
            elif href.lower().endswith('.csv'):
                doc_type = 'text/csv'
            
            # Create document object
            doc = {
                'url': href,
                'name': doc_name,
                'type': doc_type
            }
            
            # Add to list if not already there
            if not any(d['url'] == href for d in documents):
                documents.append(doc)
    
    # Look for document sections
    doc_sections = soup.select('.documents, .property-documents, .files, .downloads')
    for section in doc_sections:
        links = section.find_all('a', href=True)
        for link in links:
            href = link.get('href', '')
            if href:
                # Get the document name
                doc_name = link.get_text(strip=True)
                if not doc_name:
                    # Use the filename as name if link text is empty
                    doc_name = href.split('/')[-1]
                
                # Make absolute URL if relative
                if not href.startswith(('http://', 'https://')):
                    href = urljoin(base_url, href)
                
                # Determine document type based on extension or Content-Type header
                doc_type = 'application/octet-stream'  # Default MIME type
                
                for ext, mime in [
                    ('.pdf', 'application/pdf'),
                    (('.doc', '.docx'), 'application/msword'),
                    (('.xls', '.xlsx'), 'application/excel'),
                    ('.txt', 'text/plain'),
                    ('.csv', 'text/csv')
                ]:
                    if isinstance(ext, tuple):
                        if any(href.lower().endswith(e) for e in ext):
                            doc_type = mime
                            break
                    elif href.lower().endswith(ext):
                        doc_type = mime
                        break
                
                # Create document object
                doc = {
                    'url': href,
                    'name': doc_name,
                    'type': doc_type
                }
                
                # Add to list if not already there
                if not any(d['url'] == href for d in documents):
                    documents.append(doc)
    
    return documents

def _extract_coordinates(soup: BeautifulSoup) -> Dict[str, float]:
    """Extract property coordinates from WordPress page with enhanced accuracy"""
    coordinates = {}
    
    # Special handling for classiccountryland.com
    if "classiccountryland.com" in str(soup):
        # Method 1: Check for Google Maps links in the page
        all_links = soup.find_all('a', href=True)
        for link in all_links:
            href = link.get('href', '').lower()
            if 'google.com/maps' in href:
                # Extract coordinates from Google Maps URL
                coord_match = re.search(r'/@(-?\d+\.\d+),(-?\d+\.\d+)', href)
                if coord_match:
                    try:
                        coordinates['latitude'] = float(coord_match.group(1))
                        coordinates['longitude'] = float(coord_match.group(2))
                        return coordinates
                    except (ValueError, TypeError):
                        pass
                
                # Try another format - ?q=lat,lng
                coord_match = re.search(r'[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)', href)
                if coord_match:
                    try:
                        coordinates['latitude'] = float(coord_match.group(1))
                        coordinates['longitude'] = float(coord_match.group(2))
                        return coordinates
                    except (ValueError, TypeError):
                        pass
        
        # Method 2: Look for coordinates in text with specific patterns common in classiccountryland
        all_text = soup.get_text()
        coord_patterns = [
            r'(?:GPS|coordinates|location):\s*(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)',
            r'latitude:?\s*(-?\d+\.\d+)[,\s]+longitude:?\s*(-?\d+\.\d+)',
            r'(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)\s*(?:GPS|coordinates|location)'
        ]
        
        for pattern in coord_patterns:
            coord_match = re.search(pattern, all_text, re.IGNORECASE)
            if coord_match:
                try:
                    lat = float(coord_match.group(1))
                    lng = float(coord_match.group(2))
                    # Verify coordinates are within reasonable range
                    if -90 <= lat <= 90 and -180 <= lng <= 180:
                        coordinates['latitude'] = lat
                        coordinates['longitude'] = lng
                        return coordinates
                except (ValueError, TypeError):
                    pass
        
        # Method 3: Look for coordinate information in paragraphs
        paragraphs = soup.find_all('p')
        for p in paragraphs:
            text = p.get_text(strip=True)
            if any(coord_term in text.lower() for coord_term in ['gps', 'coordinate', 'latitude', 'longitude', 'location', 'map']):
                # Look for numbers that could be coordinates
                number_matches = re.findall(r'(-?\d+\.\d+)', text)
                if len(number_matches) >= 2:
                    try:
                        lat = float(number_matches[0])
                        lng = float(number_matches[1])
                        # Verify coordinates are within reasonable range
                        if -90 <= lat <= 90 and -180 <= lng <= 180:
                            coordinates['latitude'] = lat
                            coordinates['longitude'] = lng
                            return coordinates
                    except (ValueError, TypeError, IndexError):
                        pass
        
        # Method 4: If we have a state from location data, use a fallback centroid
        # This is better than returning zeros which would place the property in the ocean
        state_centroids = {
            'Oklahoma': {'latitude': 35.5889, 'longitude': -97.4943},
            'Texas': {'latitude': 31.9686, 'longitude': -99.9018},
            'Arkansas': {'latitude': 34.7465, 'longitude': -92.2896},
            'Missouri': {'latitude': 38.5767, 'longitude': -92.1736},
            'New Mexico': {'latitude': 34.5199, 'longitude': -105.8701},
            'Colorado': {'latitude': 39.5501, 'longitude': -105.7821},
            'Kansas': {'latitude': 38.5266, 'longitude': -96.7265},
            'Arizona': {'latitude': 34.0489, 'longitude': -111.0937},
        }
        
        # Look for state name in the page
        location_data = _extract_location(soup)
        if 'state' in location_data and location_data['state'] in state_centroids:
            # Add a small random offset (up to ±0.05 degrees) to avoid all properties clustering at exact same point
            import random
            centroid = state_centroids[location_data['state']]
            offset_lat = random.uniform(-0.05, 0.05)
            offset_lng = random.uniform(-0.05, 0.05)
            coordinates['latitude'] = centroid['latitude'] + offset_lat
            coordinates['longitude'] = centroid['longitude'] + offset_lng
            # Mark these coordinates as approximate
            coordinates['approximate'] = True
            return coordinates
    
    # Standard extraction methods for other WordPress sites
    # Look for coordinates in schema.org data
    schema_script = soup.find('script', {'type': 'application/ld+json'})
    if schema_script:
        try:
            schema_data = json.loads(schema_script.string)
            if isinstance(schema_data, list):
                schema_data = schema_data[0]
            
            if 'geo' in schema_data:
                geo = schema_data['geo']
                lat_val = geo.get('latitude', 0)
                lng_val = geo.get('longitude', 0)
                # Ensure we're dealing with a proper numeric type
                if isinstance(lat_val, (int, float, str)) and isinstance(lng_val, (int, float, str)):
                    try:
                        coordinates['latitude'] = float(lat_val)
                        coordinates['longitude'] = float(lng_val)
                        return coordinates
                    except (ValueError, TypeError):
                        pass
        except (json.JSONDecodeError, AttributeError, ValueError):
            pass
    
    # Look for coordinates in map data
    map_scripts = soup.find_all('script')
    for script in map_scripts:
        if script.string and ('google.maps' in script.string or 'leaflet' in script.string.lower()):
            # Try to extract lat/lng from Google Maps initialization
            lat_match = re.search(r'lat\s*:\s*(-?\d+\.\d+)', script.string)
            lng_match = re.search(r'lng\s*:\s*(-?\d+\.\d+)', script.string)
            
            if lat_match and lng_match:
                try:
                    coordinates['latitude'] = float(lat_match.group(1))
                    coordinates['longitude'] = float(lng_match.group(1))
                    return coordinates
                except ValueError:
                    pass
    
    # Look for data-lat and data-lng attributes
    map_elem = soup.select_one('[data-lat][data-lng]')
    if map_elem:
        try:
            coordinates['latitude'] = float(map_elem.get('data-lat', 0))
            coordinates['longitude'] = float(map_elem.get('data-lng', 0))
            return coordinates
        except ValueError:
            pass
    
    return coordinates

def _extract_details(soup: BeautifulSoup) -> Dict[str, Any]:
    """Extract additional property details from WordPress page"""
    details = {}
    
    # Look for details in meta data
    meta_description = soup.find('meta', {'name': 'description'})
    if meta_description and meta_description.get('content'):
        details['meta_description'] = meta_description.get('content')
    
    # Extract terrain information
    terrain_selectors = ['.terrain', '.topography', '.property-terrain']
    for selector in terrain_selectors:
        terrain_elem = soup.select_one(selector)
        if terrain_elem:
            details['terrain'] = terrain_elem.get_text(strip=True)
            break
    
    # If we don't have terrain, try to determine from text
    if 'terrain' not in details:
        terrain_keywords = {
            'flat': ['flat', 'level', 'even'],
            'rolling': ['rolling', 'gentle slope', 'sloping', 'undulating'],
            'hilly': ['hilly', 'hill', 'ridge', 'elevation'],
            'mountainous': ['mountain', 'steep', 'rugged'],
            'wetland': ['wetland', 'marsh', 'swamp', 'bog'],
            'wooded': ['wooded', 'forest', 'tree cover', 'timber']
        }
        
        description = details.get('meta_description', '') or soup.get_text().lower()
        for terrain_type, keywords in terrain_keywords.items():
            if any(keyword in description.lower() for keyword in keywords):
                details['terrain'] = terrain_type
                break
    
    # Extract water resources
    water_selectors = ['.water-resources', '.water-features', '.water']
    for selector in water_selectors:
        water_elem = soup.select_one(selector)
        if water_elem:
            details['waterResources'] = water_elem.get_text(strip=True)
            break
    
    # Extract road access
    road_selectors = ['.road-access', '.access', '.roads']
    for selector in road_selectors:
        road_elem = soup.select_one(selector)
        if road_elem:
            details['roadAccess'] = road_elem.get_text(strip=True)
            break
    
    # Extract utilities
    utility_selectors = ['.utilities', '.utility-information', '.services']
    for selector in utility_selectors:
        utility_elem = soup.select_one(selector)
        if utility_elem:
            details['utilities'] = utility_elem.get_text(strip=True)
            break
    
    # Extract zoning
    zoning_selectors = ['.zoning', '.property-zoning']
    for selector in zoning_selectors:
        zoning_elem = soup.select_one(selector)
        if zoning_elem:
            details['zoning'] = zoning_elem.get_text(strip=True)
            break
    
    return details