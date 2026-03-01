"""
Property Image Extraction Module

This module provides specialized functions for extracting property images
from various real estate websites. It uses multiple strategies to find
high-quality, relevant property images.
"""

import re
import json
from typing import List, Dict, Any, Optional, Set
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

# Configuration
MIN_IMAGE_WIDTH = 400  # Minimum width for a valid property image
MIN_IMAGE_AREA = 160000  # Minimum area (width*height) for a valid property image
MAX_IMAGES = 15  # Maximum number of images to extract

def extract_images(soup: BeautifulSoup, url: str) -> List[Dict[str, Any]]:
    """
    Extract property images using multiple strategies
    
    This function uses multiple image extraction strategies in order of reliability,
    combining results to create a comprehensive set of property images.
    
    Args:
        soup: BeautifulSoup object with parsed HTML
        url: Original URL of the property listing
        
    Returns:
        List of image objects with url, type, width, height, and confidence
    """
    all_images = []
    
    # Extract images using different strategies in order of reliability
    # 1. Structured data in JSON-LD
    json_ld_images = extract_images_from_json_ld(soup)
    if json_ld_images:
        all_images.extend(json_ld_images)
    
    # 2. Meta tags (OpenGraph, Twitter, etc.)
    meta_images = extract_images_from_meta_tags(soup, url)
    if meta_images:
        all_images.extend(meta_images)
    
    # 3. Property gallery in script data
    script_images = extract_images_from_scripts(soup)
    if script_images:
        all_images.extend(script_images)
    
    # 4. Dedicated gallery elements
    gallery_images = extract_images_from_galleries(soup, url)
    if gallery_images:
        all_images.extend(gallery_images)
    
    # 5. General image elements as fallback
    if len(all_images) < MAX_IMAGES // 2:
        general_images = extract_images_from_general(soup, url)
        if general_images:
            all_images.extend(general_images)
    
    # De-duplicate images based on URL
    seen_urls = set()
    unique_images = []
    
    for img in all_images:
        if 'url' in img and img['url'] not in seen_urls and not _is_icon_or_logo(img.get('url', '')):
            seen_urls.add(img['url'])
            unique_images.append(img)
    
    # Sort by confidence score and limit the number of images
    unique_images.sort(key=lambda x: x.get('confidence', 0), reverse=True)
    
    # Format as unified asset objects
    assets = []
    for img in unique_images[:MAX_IMAGES]:
        assets.append({
            'url': img['url'],
            'type': 'image',
            'width': img.get('width', 0),
            'height': img.get('height', 0),
            'confidence': img.get('confidence', 0.5)
        })
    
    return assets

def _clean_url(url: str, base_url: str) -> str:
    """Clean and normalize image URL"""
    if not url:
        return ""
    
    # Remove any whitespace
    url = url.strip()
    
    # Handle data URLs as-is
    if url.startswith('data:'):
        return url
    
    # Make relative URLs absolute
    if not url.startswith(('http://', 'https://')):
        url = urljoin(base_url, url)
    
    # Remove tracking parameters and URL fragments
    parsed_url = urlparse(url)
    clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
    
    # If the URL was relative, it might need the query string
    if parsed_url.query and not url.startswith(('http://', 'https://')):
        clean_url += f"?{parsed_url.query}"
    
    return clean_url

def extract_images_from_json_ld(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract images from JSON-LD structured data"""
    images = []
    
    # Find all JSON-LD scripts
    for script in soup.find_all('script', {'type': 'application/ld+json'}):
        try:
            # Extract and parse JSON data
            if not script.string:
                continue
                
            data = json.loads(script.string)
            
            # Handle both single objects and arrays of objects
            if isinstance(data, list):
                data_objects = data
            else:
                data_objects = [data]
            
            for obj in data_objects:
                # Look for images in different schema.org types
                
                # RealEstateListing might have image
                if obj.get('@type') in ('RealEstateListing', 'Product', 'Place', 'Accommodation'):
                    image_urls = obj.get('image', [])
                    
                    if isinstance(image_urls, str):
                        image_urls = [image_urls]
                    
                    if image_urls:
                        for img_url in image_urls:
                            if isinstance(img_url, dict) and 'url' in img_url:
                                img_url = img_url['url']
                            
                            if img_url and isinstance(img_url, str):
                                images.append({
                                    'url': img_url,
                                    'confidence': 0.9,  # High confidence for structured data
                                    'width': 800,  # Typical width for a property image
                                    'height': 600,  # Typical height for a property image
                                    'source': 'json-ld'
                                })
                
                # Check for ImageGallery type
                if obj.get('@type') == 'ImageGallery':
                    gallery_imgs = obj.get('image', [])
                    
                    if isinstance(gallery_imgs, str):
                        gallery_imgs = [gallery_imgs]
                        
                    if gallery_imgs:
                        for img in gallery_imgs:
                            if isinstance(img, dict) and 'url' in img:
                                img_url = img['url']
                                width = img.get('width', 800)
                                height = img.get('height', 600)
                            else:
                                img_url = img
                                width = 800
                                height = 600
                                
                            if img_url and isinstance(img_url, str):
                                images.append({
                                    'url': img_url,
                                    'confidence': 0.95,  # Very high confidence for gallery images
                                    'width': width,
                                    'height': height,
                                    'source': 'json-ld-gallery'
                                })
                                
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Error parsing JSON-LD: {e}")
            continue
    
    return images

def extract_images_from_meta_tags(soup: BeautifulSoup, base_url: str) -> List[Dict[str, Any]]:
    """Extract images from meta tags (OpenGraph, Twitter, etc.)"""
    images = []
    
    # OpenGraph image
    og_image = soup.find('meta', {'property': 'og:image'})
    if og_image and og_image.get('content'):
        image_url = _clean_url(og_image.get('content'), base_url)
        
        # Look for width and height in related meta tags
        og_width = soup.find('meta', {'property': 'og:image:width'})
        og_height = soup.find('meta', {'property': 'og:image:height'})
        
        width = int(og_width.get('content')) if og_width and og_width.get('content') else 1200
        height = int(og_height.get('content')) if og_height and og_height.get('content') else 630
        
        images.append({
            'url': image_url,
            'confidence': 0.85,  # High confidence for OG image
            'width': width,
            'height': height,
            'source': 'og-meta'
        })
    
    # Twitter image
    twitter_image = soup.find('meta', {'name': 'twitter:image'})
    if twitter_image and twitter_image.get('content'):
        image_url = _clean_url(twitter_image.get('content'), base_url)
        
        # Check if this is different from OG image
        if not any(img['url'] == image_url for img in images):
            images.append({
                'url': image_url,
                'confidence': 0.8,  # High confidence for Twitter image
                'width': 1200,  # Twitter recommends 1200x675
                'height': 675,
                'source': 'twitter-meta'
            })
    
    # Look for other image meta tags
    image_metas = soup.find_all('meta', {'property': re.compile(r'.*:image')})
    for meta in image_metas:
        if meta.get('content') and not meta.get('property') in ('og:image', 'og:image:width', 'og:image:height'):
            image_url = _clean_url(meta.get('content'), base_url)
            
            # Check if this is already included
            if not any(img['url'] == image_url for img in images):
                images.append({
                    'url': image_url,
                    'confidence': 0.75,  # Medium-high confidence
                    'width': 800,  # Assumed width
                    'height': 600,  # Assumed height
                    'source': 'other-meta'
                })
    
    return images

def extract_images_from_scripts(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract images from JavaScript data in script tags"""
    images = []
    
    # Common patterns for image galleries in scripts
    gallery_patterns = [
        r'"(?:images|photos|pictures|gallery)"\s*:\s*(\[.*?\])',  # "images": [...]
        r'var\s+(?:images|photos|gallery)\s*=\s*(\[.*?\])',  # var images = [...]
        r'data-images\s*=\s*\'(\[.*?\])\'',  # data-images = '[...]'
        r'property(?:Images|Photos|Pictures|Gallery)\s*[:=]\s*(\[.*?\])',  # propertyImages = [...]
    ]
    
    # Search all scripts
    scripts = soup.find_all('script')
    for script in scripts:
        if not script.string:
            continue
            
        script_text = script.string
        
        # Check each pattern
        for pattern in gallery_patterns:
            matches = re.findall(pattern, script_text)
            
            for match in matches:
                try:
                    # Try to parse as JSON
                    image_data = json.loads(match)
                    
                    if isinstance(image_data, list):
                        for item in image_data:
                            # Handle different image data formats
                            if isinstance(item, str):
                                # Simple URL string
                                image_url = item
                                width = 800
                                height = 600
                            elif isinstance(item, dict):
                                # Object with image data
                                image_url = item.get('url') or item.get('src') or item.get('path') or ""
                                width = item.get('width', 800)
                                height = item.get('height', 600)
                            else:
                                continue
                                
                            if image_url:
                                images.append({
                                    'url': image_url,
                                    'confidence': 0.8,  # High confidence for gallery script data
                                    'width': width,
                                    'height': height,
                                    'source': 'script-gallery'
                                })
                except json.JSONDecodeError:
                    # Try to extract URLs even if not valid JSON
                    url_pattern = r'(?:\'|")(?:https?://[^\'"\s]+\.(?:jpg|jpeg|png|webp))(?:\'|")'
                    for url_match in re.findall(url_pattern, match):
                        clean_url = url_match.strip('\'"')
                        images.append({
                            'url': clean_url,
                            'confidence': 0.7,  # Medium confidence for extracted URLs
                            'width': 800,
                            'height': 600,
                            'source': 'script-regex'
                        })
    
    return images

def extract_images_from_galleries(soup: BeautifulSoup, base_url: str) -> List[Dict[str, Any]]:
    """Extract images from dedicated gallery elements"""
    images = []
    seen_urls = set()
    
    # Common gallery container selectors
    gallery_selectors = [
        '.property-gallery', 
        '.listing-gallery',
        '.image-gallery',
        '.photo-gallery',
        '.property-images',
        '.carousel-inner',
        '.slider',
        '.gallery',
        '[data-gallery]',
        '.media-gallery'
    ]
    
    # Check each potential gallery container
    for selector in gallery_selectors:
        galleries = soup.select(selector)
        
        for gallery in galleries:
            # Look for images in the gallery
            for img in gallery.find_all('img'):
                # Use largest available image
                image_url = img.get('data-src-big') or img.get('data-src') or img.get('data-full') or img.get('data-large') or img.get('src')
                
                if not image_url:
                    continue
                    
                image_url = _clean_url(image_url, base_url)
                
                # Skip if already seen or if it's an icon/logo
                if image_url in seen_urls or _is_icon_or_logo(image_url):
                    continue
                    
                seen_urls.add(image_url)
                
                # Get width and height if available
                width = img.get('width', '')
                height = img.get('height', '')
                
                try:
                    width = int(width) if width else 800
                    height = int(height) if height else 600
                except ValueError:
                    width = 800
                    height = 600
                
                # Check minimal image dimensions
                if width >= MIN_IMAGE_WIDTH or width * height >= MIN_IMAGE_AREA:
                    images.append({
                        'url': image_url,
                        'confidence': 0.85,  # High confidence for gallery images
                        'width': width,
                        'height': height,
                        'source': 'gallery-img'
                    })
            
            # Look for background images in the gallery
            for elem in gallery.find_all(lambda tag: tag.has_attr('style') and 'background' in tag['style']):
                style = elem['style']
                bg_match = re.search(r'background(?:-image)?:\s*url\([\'"]?(.*?)[\'"]?\)', style)
                
                if bg_match:
                    image_url = _clean_url(bg_match.group(1), base_url)
                    
                    # Skip if already seen or if it's an icon/logo
                    if image_url in seen_urls or _is_icon_or_logo(image_url):
                        continue
                        
                    seen_urls.add(image_url)
                    
                    images.append({
                        'url': image_url,
                        'confidence': 0.8,  # Medium-high confidence for background images
                        'width': 800,  # Assumed width
                        'height': 600,  # Assumed height
                        'source': 'gallery-bg'
                    })
            
            # Check for linked images (common in galleries with thumbnails)
            for link in gallery.find_all('a'):
                href = link.get('href', '')
                
                # If link points to an image
                if href and re.search(r'\.(jpg|jpeg|png|webp)(\?.*)?$', href, re.IGNORECASE):
                    image_url = _clean_url(href, base_url)
                    
                    # Skip if already seen or if it's an icon/logo
                    if image_url in seen_urls or _is_icon_or_logo(image_url):
                        continue
                        
                    seen_urls.add(image_url)
                    
                    images.append({
                        'url': image_url,
                        'confidence': 0.8,  # Medium-high confidence
                        'width': 1024,  # Assumed width for full-size linked images
                        'height': 768,  # Assumed height
                        'source': 'gallery-link'
                    })
                
                # Also check for data attributes pointing to images
                data_img = (
                    link.get('data-image') or link.get('data-img') or 
                    link.get('data-src') or link.get('data-full-image')
                )
                
                if data_img:
                    image_url = _clean_url(data_img, base_url)
                    
                    # Skip if already seen or if it's an icon/logo
                    if image_url in seen_urls or _is_icon_or_logo(image_url):
                        continue
                        
                    seen_urls.add(image_url)
                    
                    images.append({
                        'url': image_url,
                        'confidence': 0.85,  # High confidence for explicit data attributes
                        'width': 1024,  # Assumed width
                        'height': 768,  # Assumed height
                        'source': 'gallery-data-attr'
                    })
    
    return images

def extract_images_from_general(soup: BeautifulSoup, base_url: str) -> List[Dict[str, Any]]:
    """Extract images from general image elements as a fallback"""
    images = []
    seen_urls = set()
    
    # Common content areas where property images might be found
    content_areas = [
        'main',
        'article',
        '.content',
        '.property-content',
        '.listing-content',
        '.entry-content',
        '#content',
        '.main-content'
    ]
    
    # Priority search in content areas
    for selector in content_areas:
        content = soup.select_one(selector)
        
        if content:
            # Find all images in this content area
            for img in content.find_all('img'):
                # Get best available image
                image_url = (
                    img.get('data-src-big') or img.get('data-src') or 
                    img.get('data-full') or img.get('data-large') or 
                    img.get('src')
                )
                
                if not image_url:
                    continue
                    
                image_url = _clean_url(image_url, base_url)
                
                # Skip if already seen, too small, or an icon/logo
                if image_url in seen_urls or _is_icon_or_logo(image_url):
                    continue
                    
                seen_urls.add(image_url)
                
                # Get width and height if available
                width = img.get('width', '')
                height = img.get('height', '')
                
                try:
                    width = int(width) if width else 0
                    height = int(height) if height else 0
                except ValueError:
                    width = 0
                    height = 0
                
                # Check minimal dimensions if we have them
                # Otherwise, rely on the presence of certain classes or attributes
                if (width >= MIN_IMAGE_WIDTH or width * height >= MIN_IMAGE_AREA or
                    width == 0 or  # If dimensions unknown, we'll include and filter later
                    any(c in (img.get('class', []) or []) 
                        for c in ['property', 'listing', 'main', 'featured', 'large'])):
                    
                    # Higher confidence for images with certain classes
                    if any(c in (img.get('class', []) or []) 
                          for c in ['property', 'listing', 'main', 'featured']):
                        confidence = 0.75  # Higher confidence for likely property images
                    else:
                        confidence = 0.6  # Medium confidence for general content images
                    
                    images.append({
                        'url': image_url,
                        'confidence': confidence,
                        'width': width or 800,  # Use provided width or assume 800
                        'height': height or 600,  # Use provided height or assume 600
                        'source': 'content-img'
                    })
    
    # If we still don't have enough images, look throughout the page
    if len(images) < MAX_IMAGES // 2:
        # Find all reasonably-sized images on the page
        for img in soup.find_all('img'):
            # Skip tiny images and those without src
            if not img.get('src'):
                continue
                
            # Get dimensions
            width = img.get('width', '')
            height = img.get('height', '')
            
            try:
                width = int(width) if width else 0
                height = int(height) if height else 0
            except ValueError:
                width = 0
                height = 0
            
            # Skip small icons
            if 0 < width < MIN_IMAGE_WIDTH and 0 < height < MIN_IMAGE_WIDTH:
                continue
                
            image_url = _clean_url(img.get('src'), base_url)
            
            # Skip if already seen or if it's an icon/logo
            if image_url in seen_urls or _is_icon_or_logo(image_url):
                continue
                
            seen_urls.add(image_url)
            
            images.append({
                'url': image_url,
                'confidence': 0.5,  # Lower confidence for general page images
                'width': width or 640,
                'height': height or 480,
                'source': 'general-img'
            })
    
    return images

def _is_icon_or_logo(url: str) -> bool:
    """Check if the image URL likely points to an icon or logo"""
    # Check for common icon/logo patterns in the URL
    icon_patterns = [
        r'logo', r'icon', r'favicon', r'avatar', r'profile', 
        r'badge', r'thumbnail', r'thumb', r'button', r'social',
        r'header', r'footer'
    ]
    
    lower_url = url.lower()
    
    # Check if URL contains icon patterns
    if any(re.search(pattern, lower_url) for pattern in icon_patterns):
        # But allow if it also contains property-related terms
        if not any(term in lower_url for term in ['property', 'listing', 'house', 'home', 'real-estate']):
            return True
    
    # Check common icon dimensions in URL
    if re.search(r'[_-](16|24|32|48|64)x\d+', lower_url) or re.search(r'\d+x(16|24|32|48|64)[_-]', lower_url):
        return True
    
    # Check for file naming patterns
    if re.search(r'(header|footer|sidebar|social)[_-](image|img)', lower_url):
        return True
    
    return False