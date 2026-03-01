import asyncio
import datetime
import json
import logging
import re
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urlparse

from playwright.async_api import async_playwright, Playwright, Browser, BrowserContext, Page
from .base_scraper import BaseScraper

logger = logging.getLogger(__name__)

class PlaywrightScraper(BaseScraper):
    """Advanced headless browser scraper using Playwright"""
    
    def __init__(self):
        super().__init__()
    
    def get_name(self) -> str:
        return "Playwright Scraper"
    
    def get_description(self) -> str:
        return "Advanced scraper with full browser capabilities for JavaScript-heavy sites"
    
    def get_supported_domains(self) -> List[str]:
        return ["*"]  # Supports any domain
    
    async def extract_data(self, url: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Extract property data from URL using Playwright headless browser"""
        options = options or {}
        
        timeout = options.get('timeout', 30000)  # In milliseconds
        wait_for = options.get('wait_for', 5000)  # Wait time after page load in milliseconds
        
        data = {
            'source_url': url,
            'scraped_at': datetime.datetime.now().isoformat()
        }
        
        playwright = None
        browser = None
        context = None
        page = None
        
        try:
            # Initialize browser
            playwright = await async_playwright().start()
            browser = await playwright.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--mute-audio'
                ]
            )
            
            # Create a context with realistic browser fingerprint
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
                viewport={'width': 1280, 'height': 800},
                locale='en-US',
                ignore_https_errors=True
            )
            
            # Create a new page
            page = await context.new_page()
            
            # Navigate to the URL with timeout
            logger.info(f"Navigating to {url} with Playwright")
            await page.goto(url, wait_until='domcontentloaded', timeout=timeout)
            
            # Wait for dynamic content to load
            if wait_for > 0:
                await page.wait_for_timeout(wait_for)
            
            # First try to extract structured data
            structured_data = await self._extract_structured_data(page)
            if structured_data:
                logger.info(f"Extracted structured data from {url}")
                structured_data['source_url'] = url
                structured_data['scraped_at'] = datetime.datetime.now().isoformat()
                
                # Add screenshots if requested
                if options.get('capture_screenshots', False):
                    try:
                        await self._capture_screenshots(page, structured_data)
                    except Exception as e:
                        logger.error(f"Error capturing screenshots: {e}")
                
                return structured_data
            
            # Get the domain to use domain-specific extraction rules
            domain = urlparse(url).netloc.lower()
            
            # Extract data from page with error handling for each section
            # This ensures that if one extraction fails, others can still proceed
            
            # Extract page title
            try:
                page_title = await page.title()
                data['title'] = page_title
            except Exception as e:
                logger.error(f"Error extracting page title: {e}")
            
            # Extract description
            try:
                description = await self._extract_description(page)
                if description:
                    data['description'] = description
            except Exception as e:
                logger.error(f"Error extracting description: {e}")
            
            # Extract price, acreage, and other key details
            try:
                core_details = await self._extract_core_details(page, domain)
                if core_details:
                    data.update(core_details)
            except Exception as e:
                logger.error(f"Error extracting core details: {e}")
            
            # Extract location information
            try:
                location_info = await self._extract_location(page, domain)
                if location_info:
                    data['location'] = location_info
                    # Extract state for convenience
                    if isinstance(location_info, dict) and location_info.get('state'):
                        data['state'] = location_info.get('state')
            except Exception as e:
                logger.error(f"Error extracting location: {e}")
            
            # Extract coordinates
            try:
                coordinates = await self._extract_coordinates(page, domain)
                if coordinates:
                    data['coordinates'] = coordinates
            except Exception as e:
                logger.error(f"Error extracting coordinates: {e}")
            
            # Extract property features
            try:
                features = await self._extract_features(page, domain)
                if features:
                    data['features'] = features
            except Exception as e:
                logger.error(f"Error extracting features: {e}")
            
            # Extract property type
            try:
                property_type = await self._extract_property_type(page, domain)
                if property_type:
                    data['property_type'] = property_type
            except Exception as e:
                logger.error(f"Error extracting property type: {e}")
            
            # Extract images
            try:
                images = await self.extract_images(page)
                if images:
                    data['assets'] = images
            except Exception as e:
                logger.error(f"Error extracting images: {e}")
            
            # Extract documents
            try:
                documents = await self._extract_documents(page, domain)
                if documents:
                    if 'assets' not in data:
                        data['assets'] = []
                    data['assets'].extend(documents)
            except Exception as e:
                logger.error(f"Error extracting documents: {e}")
            
            # Add screenshots if requested
            if options.get('capture_screenshots', False):
                try:
                    await self._capture_screenshots(page, data)
                except Exception as e:
                    logger.error(f"Error capturing screenshots: {e}")
                
            # Calculate confidence metrics
            try:
                confidence_metrics = {}
                
                # Calculate core details confidence
                if 'title' in data or 'price' in data or 'acreage' in data:
                    core_confidence = 0.7  # Base confidence
                    if 'title' in data:
                        core_confidence += 0.1
                    if 'price' in data:
                        core_confidence += 0.1
                    if 'acreage' in data:
                        core_confidence += 0.1
                    confidence_metrics['core_details'] = min(1.0, core_confidence)
                
                # Calculate location confidence
                if 'location' in data:
                    location_info = data['location']
                    location_confidence = 0.5  # Base confidence
                    if isinstance(location_info, dict):
                        if location_info.get('address'):
                            location_confidence += 0.2
                        if location_info.get('city'):
                            location_confidence += 0.1
                        if location_info.get('state'):
                            location_confidence += 0.1
                        if location_info.get('postal_code'):
                            location_confidence += 0.1
                    confidence_metrics['location'] = min(1.0, location_confidence)
                
                # Calculate coordinates confidence
                if 'coordinates' in data:
                    coordinates = data['coordinates']
                    coord_confidence = 0.5  # Base confidence
                    if isinstance(coordinates, dict):
                        if 'latitude' in coordinates and 'longitude' in coordinates:
                            lat = coordinates.get('latitude')
                            lng = coordinates.get('longitude')
                            if lat is not None and lng is not None:
                                if -90 <= lat <= 90 and -180 <= lng <= 180:
                                    coord_confidence = 0.9  # Valid coordinate range
                    confidence_metrics['coordinates'] = coord_confidence
                
                # Calculate features confidence
                if 'features' in data and data['features']:
                    features = data['features']
                    feature_confidence = 0.5  # Base confidence
                    feature_count = len(features)
                    if feature_count > 10:
                        feature_confidence = 0.9
                    elif feature_count > 5:
                        feature_confidence = 0.8
                    elif feature_count > 0:
                        feature_confidence = 0.7
                    confidence_metrics['features'] = feature_confidence
                
                # Calculate assets confidence
                if 'assets' in data and data['assets']:
                    assets = data['assets']
                    asset_confidence = 0.5  # Base confidence
                    image_count = len([a for a in assets if a.get('type') == 'image'])
                    if image_count > 10:
                        asset_confidence = 0.9
                    elif image_count > 5:
                        asset_confidence = 0.8
                    elif image_count > 0:
                        asset_confidence = 0.7
                    confidence_metrics['assets'] = asset_confidence
                
                # Calculate overall confidence
                confidence_values = list(confidence_metrics.values())
                if confidence_values:
                    overall_confidence = sum(confidence_values) / len(confidence_values)
                    confidence_metrics['overall'] = overall_confidence
                
                data['confidence_metrics'] = confidence_metrics
            except Exception as e:
                logger.error(f"Error calculating confidence metrics: {e}")
                
            return data
                
        except Exception as e:
            logger.error(f"Error extracting data with Playwright: {str(e)}")
            data['error'] = str(e)
            data['title'] = f"Failed to process: {url}"
            data['description'] = f"Unable to extract data from this URL. Error: {str(e)}"
            return data
            
        finally:
            # Clean up resources
            try:
                if page:
                    try:
                        await page.close()
                    except Exception:
                        pass
                if context:
                    try:
                        await context.close()
                    except Exception:
                        pass
                if browser:
                    try:
                        await browser.close()
                    except Exception:
                        pass
                if playwright:
                    try:
                        await playwright.stop()
                    except Exception:
                        pass
            except Exception as cleanup_error:
                logger.error(f"Error during Playwright cleanup: {str(cleanup_error)}")
    
    async def _extract_description(self, page: Page) -> Optional[str]:
        """Extract property description"""
        try:
            # Try to find the main description
            description_selectors = [
                '.property-description', '.listing-description', '.description',
                '[data-testid="description"]', '.property-desc', 'section.description',
                '.cms-content', '.listing-details-section',
                '#description', '[itemprop="description"]'
            ]
            
            for selector in description_selectors:
                if await page.locator(selector).count() > 0:
                    description = await page.locator(selector).first.inner_text()
                    if description and len(description.strip()) > 20:  # Ensure it's not just a short text
                        return description.strip()
            
            # If no description found with selectors, try paragraph extraction
            paragraphs = await page.locator('main p, article p, .main-content p, .property-content p').all()
            if paragraphs:
                description_paragraphs = []
                for p in paragraphs:
                    text = await p.inner_text()
                    if text and len(text.strip()) > 40:  # Only consider paragraphs with substantial text
                        description_paragraphs.append(text.strip())
                
                if description_paragraphs:
                    return ' '.join(description_paragraphs)
            
            return None
        except Exception as e:
            logger.error(f"Error extracting description: {e}")
            return None
    
    async def _extract_core_details(self, page: Page, domain: str) -> Dict[str, Any]:
        """Extract core property details like price and acreage"""
        details = {}
        
        try:
            # Extract price
            price = await self._extract_price(page, domain)
            if price is not None:
                details['price'] = price
            
            # Extract acreage
            acreage = await self._extract_acreage(page, domain)
            if acreage is not None:
                details['acreage'] = acreage
            
            return details
        except Exception as e:
            logger.error(f"Error extracting core details: {e}")
            return {}
    
    async def _extract_price(self, page: Page, domain: str) -> Optional[float]:
        """Extract property price"""
        try:
            # Try to extract price from meta tags first
            price_meta = await page.locator('meta[property="product:price:amount"], meta[property="og:price:amount"], meta[name="price"]').first.get_attribute('content')
            if price_meta:
                try:
                    return float(self._clean_price_string(price_meta))
                except ValueError:
                    pass
            
            # Domain-specific selectors
            price_selectors = {
                'zillow.com': '.ds-summary-row span[data-testid="price"], span[data-testid="price"]',
                'realtor.com': '.Price__Component-rui__x3geed-0, .rui__x3geed-0',
                'landwatch.com': '.list_price, .price, .propertyInfo-price',
                'land.com': '.price-display, .property-price, .price',
                'trulia.com': '.Text__TextBase-sc-1cait9d-0-div',
                'default': [
                    '.price', '.list-price', '.listing-price', '.property-price',
                    '[data-testid="price"]', '.price-display', '[itemprop="price"]',
                    '.PriceSection', '.property-info-price', '.Price', '.product-price',
                    '.main-price', '.text-price'
                ]
            }
            
            # Use domain-specific selectors or fallback to default
            selectors = price_selectors.get(domain, price_selectors['default'])
            if isinstance(selectors, str):
                selectors = [selectors]
            
            for selector in selectors:
                if await page.locator(selector).count() > 0:
                    price_element = page.locator(selector).first
                    price_text = await price_element.inner_text()
                    try:
                        return float(self._clean_price_string(price_text))
                    except ValueError:
                        continue
            
            # If selectors don't work, try to extract price from text
            price_regex = r'(?:price|listing price|asking price)[:\s]*[$€£]?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)'
            price_match = await page.evaluate(f'''() => {{
                const regex = new RegExp('{price_regex}', 'i');
                const text = document.body.innerText;
                const match = regex.exec(text);
                return match ? match[1] : null;
            }}''')
            
            if price_match:
                try:
                    return float(self._clean_price_string(price_match))
                except ValueError:
                    pass
            
            return None
        except Exception as e:
            logger.error(f"Error extracting price: {e}")
            return None
    
    def _clean_price_string(self, price_str: str) -> str:
        """Clean a price string to prepare for conversion to float"""
        if not price_str:
            return ''
        
        # Extract just numbers, decimal point, and commas
        price_str = re.sub(r'[^\d.,]', '', price_str)
        
        # Replace commas with nothing (US format)
        price_str = price_str.replace(',', '')
        
        return price_str
    
    async def _extract_acreage(self, page: Page, domain: str) -> Optional[float]:
        """Extract property acreage"""
        try:
            # Domain-specific selectors
            acreage_selectors = {
                'zillow.com': '.ds-home-fact-value, .ds-bed-bath-living-area-container span',
                'landwatch.com': '.acreage, .acres, .propertyInfo-acres',
                'land.com': '.acreage-display, .property-acreage, .acres',
                'default': [
                    '.acres', '.acreage', '.lot-size', '.property-acres',
                    '[data-testid="acres"]', '.acreage-display', '[itemprop="landSize"]',
                    '.property-info-acres', '.Acres', '.lot-acres'
                ]
            }
            
            # Use domain-specific selectors or fallback to default
            selectors = acreage_selectors.get(domain, acreage_selectors['default'])
            if isinstance(selectors, str):
                selectors = [selectors]
            
            for selector in selectors:
                if await page.locator(selector).count() > 0:
                    elements = await page.locator(selector).all()
                    for element in elements:
                        acreage_text = await element.inner_text()
                        
                        # Check if the text contains 'acre' or related words
                        if 'acre' in acreage_text.lower():
                            try:
                                return self._extract_acreage_from_text(acreage_text)
                            except ValueError:
                                continue
            
            # If selectors don't work, try to extract acreage from text
            acreage_regexes = [
                r'(\d+(?:\.\d+)?)\s*acres?',
                r'(\d+(?:\.\d+)?)\s*ac',
                r'acreage[:\s]*(\d+(?:\.\d+)?)',
                r'lot size[:\s]*(\d+(?:\.\d+)?)\s*acres?'
            ]
            
            for regex in acreage_regexes:
                acreage_match = await page.evaluate(f'''() => {{
                    const regex = new RegExp('{regex}', 'i');
                    const text = document.body.innerText;
                    const match = regex.exec(text);
                    return match ? match[1] : null;
                }}''')
                
                if acreage_match:
                    try:
                        return float(acreage_match)
                    except ValueError:
                        continue
            
            return None
        except Exception as e:
            logger.error(f"Error extracting acreage: {e}")
            return None
    
    def _extract_acreage_from_text(self, text: str) -> float:
        """Extract acreage value from text"""
        # Extract digits and decimal point
        match = re.search(r'(\d+(?:\.\d+)?)', text)
        if match:
            return float(match.group(1))
        raise ValueError("Could not extract acreage from text")
    
    async def _extract_structured_data(self, page: Page) -> Optional[Dict[str, Any]]:
        """Extract structured data from page (JSON-LD, microdata, etc)"""
        try:
            # Try to extract JSON-LD data
            json_ld = await page.evaluate('''() => {
                const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                if (jsonLdScripts.length === 0) return null;
                
                const results = [];
                for (const script of jsonLdScripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        results.push(data);
                    } catch (e) {
                        // Ignore JSON parsing errors
                    }
                }
                
                // Look for RealEstateListing, Product, PropertyListing, or Place types
                for (const data of results) {
                    if (
                        data['@type'] === 'RealEstateListing' || 
                        data['@type'] === 'Product' || 
                        data['@type'] === 'PropertyListing' || 
                        data['@type'] === 'Place' ||
                        data['@type'] === 'LandmarksOrHistoricalBuildings'
                    ) {
                        return data;
                    }
                }
                
                // If no specific types found, return first result
                return results.length > 0 ? results[0] : null;
            }''')
            
            if json_ld:
                structured_data = {}
                
                # Extract basic information
                if 'name' in json_ld:
                    structured_data['title'] = json_ld['name']
                
                if 'description' in json_ld:
                    structured_data['description'] = json_ld['description']
                
                # Extract price
                if 'offers' in json_ld and 'price' in json_ld['offers']:
                    try:
                        structured_data['price'] = float(json_ld['offers']['price'])
                    except (ValueError, TypeError):
                        pass
                
                # Extract location
                if 'address' in json_ld:
                    address = json_ld['address']
                    location = {}
                    
                    if 'streetAddress' in address:
                        location['address'] = address['streetAddress']
                    
                    if 'addressLocality' in address:
                        location['city'] = address['addressLocality']
                    
                    if 'addressRegion' in address:
                        location['state'] = address['addressRegion']
                    
                    if 'postalCode' in address:
                        location['postal_code'] = address['postalCode']
                    
                    if location:
                        structured_data['location'] = location
                
                # Extract coordinates
                if 'geo' in json_ld:
                    geo = json_ld['geo']
                    if 'latitude' in geo and 'longitude' in geo:
                        try:
                            structured_data['coordinates'] = {
                                'latitude': float(geo['latitude']),
                                'longitude': float(geo['longitude'])
                            }
                        except (ValueError, TypeError):
                            pass
                
                # Extract images
                if 'image' in json_ld:
                    images = json_ld['image']
                    if isinstance(images, str):
                        images = [images]
                    
                    if images and isinstance(images, list):
                        structured_data['assets'] = [
                            {'type': 'image', 'url': img} 
                            for img in images if isinstance(img, str)
                        ]
                
                return structured_data if structured_data else None
            
            return None
        except Exception as e:
            logger.error(f"Error extracting structured data: {e}")
            return None
    
    async def _extract_location(self, page: Page, domain: str) -> Optional[Dict[str, Any]]:
        # Will be implemented
        return None
        
    async def _extract_coordinates(self, page: Page, domain: str) -> Optional[Dict[str, float]]:
        # Will be implemented
        return None
        
    async def _extract_features(self, page: Page, domain: str) -> Optional[List[Dict[str, Any]]]:
        # Will be implemented
        return None
        
    async def _extract_property_type(self, page: Page, domain: str) -> Optional[str]:
        # Will be implemented
        return None
        
    async def extract_images(self, page: Page) -> Optional[List[Dict[str, Any]]]:
        """Extract property images from the page"""
        assets = []
        
        try:
            # Get the domain to use domain-specific selectors
            url = page.url
            domain = urlparse(url).netloc.lower()
            
            # Extract page title for image naming
            page_title = await page.title()
            
            # First, try to extract images from structured data
            structured_data = await self._extract_structured_data(page)
            if structured_data and 'images' in structured_data and structured_data['images']:
                image_urls = structured_data['images']
                for i, img_url in enumerate(image_urls):
                    if not img_url or self._is_icon_or_logo(img_url):
                        continue
                        
                    assets.append({
                        'id': f'asset-{i+1}',
                        'type': 'image',
                        'url': img_url,
                        'thumbnail': img_url,
                        'title': f'{page_title} - Image {i+1}' if page_title else f'Property Image {i+1}',
                        'description': '',
                        'selected': i == 0  # First image is selected by default
                    })
                logger.info(f"Extracted {len(assets)} images from structured data")
            
            # If no images from structured data, try domain-specific selectors
            if not assets:
                # Define domain-specific image selectors
                image_selectors = self._get_domain_image_selectors(domain)
                
                # Try each selector until we find images
                for selector in image_selectors:
                    try:
                        logger.info(f"Trying image selector: {selector}")
                        img_elements = await page.locator(selector).all()
                        if not img_elements:
                            continue
                            
                        for i, img in enumerate(img_elements):
                            try:
                                # Try multiple attributes where image URLs might be stored
                                img_url = None
                                for attr in ['src', 'data-src', 'data-lazy-src', 'data-original']:
                                    if not img_url:
                                        img_url = await img.get_attribute(attr)
                                
                                if not img_url or self._is_icon_or_logo(img_url):
                                    continue
                                    
                                # Get alt text if available
                                alt_text = await img.get_attribute('alt') or ''
                                title = await img.get_attribute('title') or ''
                                
                                # Create image asset
                                assets.append({
                                    'id': f'asset-{i+1}',
                                    'type': 'image',
                                    'url': img_url,
                                    'thumbnail': img_url,
                                    'title': title or alt_text or f'{page_title} - Image {i+1}',
                                    'description': alt_text,
                                    'selected': i == 0  # First image is selected by default
                                })
                            except Exception as element_error:
                                logger.warning(f"Error extracting from image element: {element_error}")
                        
                        # If we found images, break out of the loop
                        if assets:
                            logger.info(f"Found {len(assets)} images with selector: {selector}")
                            break
                    except Exception as selector_error:
                        logger.warning(f"Error using selector '{selector}': {selector_error}")
            
            # If we still don't have images, try to extract from 'srcset' attribute
            if not assets:
                try:
                    srcset_images = await page.evaluate('''() => {
                        const images = Array.from(document.querySelectorAll('img[srcset]'));
                        return images.map(img => {
                            const srcset = img.getAttribute('srcset');
                            if (!srcset) return null;
                            const parts = srcset.split(',');
                            // Get the highest resolution image
                            const highestRes = parts.sort((a, b) => {
                                const aMatch = a.match(/\\s+(\\d+)w$/);
                                const bMatch = b.match(/\\s+(\\d+)w$/);
                                if (!aMatch) return -1;
                                if (!bMatch) return 1;
                                return parseInt(bMatch[1]) - parseInt(aMatch[1]);
                            })[0];
                            // Extract the URL
                            const url = highestRes.trim().split(' ')[0];
                            return url;
                        }).filter(url => url);
                    }''')
                    
                    for i, img_url in enumerate(srcset_images):
                        if not img_url or self._is_icon_or_logo(img_url):
                            continue
                            
                        assets.append({
                            'id': f'asset-{i+1}',
                            'type': 'image',
                            'url': img_url,
                            'thumbnail': img_url,
                            'title': f'{page_title} - Image {i+1}' if page_title else f'Property Image {i+1}',
                            'description': '',
                            'selected': i == 0
                        })
                    
                    logger.info(f"Extracted {len(assets)} images from srcset attributes")
                except Exception as srcset_error:
                    logger.warning(f"Error extracting srcset images: {srcset_error}")
            
            # If we still don't have images, try to extract from background images
            if not assets:
                try:
                    bg_images = await page.evaluate('''() => {
                        function getBackgroundImageUrl(element) {
                            const style = window.getComputedStyle(element);
                            const bg = style.backgroundImage;
                            if (bg !== 'none') {
                                const match = bg.match(/url\\(['"]?([^'")]+)['"]?\\)/);
                                return match ? match[1] : null;
                            }
                            return null;
                        }
                        
                        const elements = Array.from(document.querySelectorAll('.carousel, .gallery, .slider, .photo-carousel, .property-photos, [style*="background-image"]'));
                        const urls = [];
                        
                        for (const el of elements) {
                            const url = getBackgroundImageUrl(el);
                            if (url) urls.push(url);
                            
                            // Also check children
                            const children = Array.from(el.querySelectorAll('[style*="background-image"]'));
                            for (const child of children) {
                                const childUrl = getBackgroundImageUrl(child);
                                if (childUrl) urls.push(childUrl);
                            }
                        }
                        
                        return urls;
                    }''')
                    
                    for i, img_url in enumerate(bg_images):
                        if not img_url or self._is_icon_or_logo(img_url):
                            continue
                            
                        assets.append({
                            'id': f'asset-{i+1}',
                            'type': 'image',
                            'url': img_url,
                            'thumbnail': img_url,
                            'title': f'{page_title} - Image {i+1}' if page_title else f'Property Image {i+1}',
                            'description': 'Background Image',
                            'selected': i == 0
                        })
                    
                    logger.info(f"Extracted {len(assets)} background images")
                except Exception as bg_error:
                    logger.warning(f"Error extracting background images: {bg_error}")
            
            # Filter out duplicates
            seen_urls = set()
            unique_assets = []
            
            for asset in assets:
                url = asset['url']
                if url not in seen_urls:
                    seen_urls.add(url)
                    unique_assets.append(asset)
            
            if unique_assets:
                return unique_assets
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting images: {e}")
            return None
            
    def _get_domain_image_selectors(self, domain: str) -> List[str]:
        """Get image selectors for a specific domain"""
        # Default selectors that work for most sites
        default_selectors = [
            'img.primary-image', 'img.main-image', 'img.hero-image',
            '.property-photos img', '.listing-photos img', '.gallery img', 
            '.carousel img', '.slider img', '.listing-carousel img',
            '.property-image img', '.main-photo img', '.photos img',
            'img[data-testid*="image"]', 'img[data-testid*="photo"]',
            '.main img', 'article img', 'main img', '.content img'
        ]
        
        # Domain-specific selectors
        domain_selectors = {
            'zillow.com': [
                'img[data-testid="image"]', '.media-stream-image', 
                '[data-testid="hdp-hero-img"] img', '.media-stream img',
                '.photo-tile img', '.media-column img', '.gallery-content img'
            ],
            'landwatch.com': [
                '.listingSlides img', '.carousel img', '.listingImage img',
                '.propertyImage img', '.listing-media img', '.swiper-slide img'
            ],
            'land.com': [
                '.gallery-image img', '.image-gallery img', '.photo-gallery img',
                '.carousel-item img', '.property-photos img'
            ],
            'landandfarm.com': [
                '.slide img', '.property-gallery img', '.listing-photo img',
                '.carousel img', '.gallery img'
            ],
            'trulia.com': [
                '.SlideShowNavigatorSlideTemplate img', '.heroUnit img',
                '.mediaItem img', '.carousel img'
            ],
            'realtor.com': [
                '.photo-gallery img', '.component_slideshow__photo img',
                '[data-testid="gallery"] img'
            ]
        }
        
        # Get domain-specific selectors or default to empty list
        specific_selectors = []
        for d, selectors in domain_selectors.items():
            if d in domain:
                specific_selectors = selectors
                break
        
        # Combine domain-specific selectors with default ones
        # Put domain-specific ones first as they're more likely to work
        return specific_selectors + default_selectors
        
    def _is_icon_or_logo(self, url: str) -> bool:
        """Check if the URL points to an icon or logo"""
        if not url:
            return True
            
        # These patterns suggest icons/logos rather than property images
        icon_patterns = [
            'logo', 'icon', 'favicon', 'banner', 'marker', 'avatar',
            'pixel', 'blank', 'button', 'badge', 'sprite', 'loading'
        ]
        
        for pattern in icon_patterns:
            if pattern in url.lower():
                return True
                
        # Check file extensions that are typically not property photos
        if url.lower().endswith(('.svg', '.gif', '.ico')):
            return True
            
        # Check for small dimensions in URL (e.g., 30x30)
        dim_match = re.search(r'(\d+)x(\d+)', url)
        if dim_match:
            width = int(dim_match.group(1))
            height = int(dim_match.group(2))
            if width < 200 or height < 200:
                return True
                
        # Check for very short URLs which are often icons
        if len(url) < 30 and '/img/' in url:
            return True
            
        return False
        
    async def _extract_documents(self, page: Page, domain: str) -> Optional[List[Dict[str, Any]]]:
        # Will be implemented
        return None
        
    async def _capture_screenshots(self, page: Page, data: Dict[str, Any]) -> None:
        # Will be implemented
        pass
