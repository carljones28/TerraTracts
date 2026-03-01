"""
Scraper Factory Module

This module provides a unified interface to all site-specific property extractors.
It handles dynamic loading of extractors, extractor selection based on URLs,
and fallback mechanisms to ensure the best possible data extraction.
"""

import re
import logging
import importlib
from typing import Dict, Any, List, Optional, Union, Type
from bs4 import BeautifulSoup

# Import the image extraction module for enhanced image extraction
try:
    # Try absolute import first
    from server.scrapers.image_extraction import extract_images
    ENHANCED_IMAGE_EXTRACTION = True
except ImportError:
    try:
        # Try relative import
        from .image_extraction import extract_images
        ENHANCED_IMAGE_EXTRACTION = True
    except ImportError:
        try:
            # Try direct import from same directory
            from image_extraction import extract_images
            ENHANCED_IMAGE_EXTRACTION = True
        except ImportError:
            # Define a basic fallback function if all imports fail
            def extract_images(soup, url):
                return []  # Return empty array as fallback
            ENHANCED_IMAGE_EXTRACTION = False
            logging.warning("Enhanced image extraction module not available. Using fallback methods.")

# Configure logging
logger = logging.getLogger(__name__)

class ScraperFactory:
    """
    Factory class for managing and accessing property extractors.
    
    This class maintains a registry of all available extractors,
    selects the appropriate extractor for a given URL,
    and provides fallback mechanisms when a specialized extractor fails.
    """
    
    def __init__(self):
        self.extractors = []
        self.universal_extractor = None
        self._load_extractors()
    
    def _load_extractors(self):
        """Load all available extractors"""
        # List of extractor modules to load
        extractor_modules = [
            # Use absolute imports
            {"module": "server.scrapers.universal_extractor", "class": "UniversalExtractor"},
            {"module": "server.scrapers.landflip_extractor", "class": "LandFlipExtractor"},
            {"module": "server.scrapers.landsearch_extractor", "class": "LandSearchExtractor"},
            {"module": "server.scrapers.zillow_extractor", "class": "ZillowExtractor"},
            {"module": "server.scrapers.landwatch_extractor", "class": "LandWatchExtractor"},
            {"module": "server.scrapers.wordpress_extractor", "function": "extract_data", "patterns": [
                r'.*wordpress.*', 
                r'.*wp-content.*',
                r'.*wp-include.*', 
                r'.*elementor.*',
                r'.*classiccountryland\.com.*',  # Specific site pattern
                r'.*findingflorida\.com.*',  # Another specific site pattern
                r'.*\.wp\.com.*'
            ]}
        ]
        
        # Load each extractor
        for extractor_info in extractor_modules:
            try:
                # Try different import strategies
                try:
                    # Try absolute import
                    module = importlib.import_module(extractor_info["module"])
                except ImportError:
                    try:
                        # Try relative import
                        rel_module = ".".join(extractor_info["module"].split(".")[-1:])
                        module = importlib.import_module(rel_module, package="server.scrapers")
                    except ImportError:
                        # Try direct import
                        direct_module = extractor_info["module"].split(".")[-1]
                        module = importlib.import_module(direct_module)
                
                # Check if this is a class-based or function-based extractor
                if "class" in extractor_info:
                    # Class-based extractor
                    extractor_class = getattr(module, extractor_info["class"])
                    extractor = extractor_class()
                    
                    # Store universal extractor separately for fallback
                    if extractor_info["class"] == "UniversalExtractor":
                        self.universal_extractor = extractor
                    else:
                        self.extractors.append(extractor)
                    
                    logger.info(f"Loaded class-based extractor: {extractor_info['class']}")
                    
                elif "function" in extractor_info:
                    # Function-based extractor (like WordPress extractor)
                    extract_func = getattr(module, extractor_info["function"])
                    
                    # Create a simple wrapper object that implements the extract method
                    class FunctionExtractorWrapper:
                        def __init__(self, extract_func, name, patterns):
                            self.extract_func = extract_func
                            self.name = name
                            self.domain_patterns = patterns
                        
                        def extract(self, soup, url):
                            return self.extract_func(soup, url)
                        
                        def can_handle(self, url):
                            for pattern in self.domain_patterns:
                                if re.search(pattern, url, re.IGNORECASE):
                                    return True
                            return False
                    
                    # Create a wrapper with the function and domain patterns
                    wrapper_name = extractor_info["module"].split('.')[-1].replace('_extractor', '').capitalize()
                    patterns = extractor_info.get("patterns", [])
                    
                    extractor = FunctionExtractorWrapper(
                        extract_func=extract_func,
                        name=f"{wrapper_name}Extractor",
                        patterns=patterns
                    )
                    
                    self.extractors.append(extractor)
                    logger.info(f"Loaded function-based extractor: {wrapper_name} with {len(patterns)} patterns")
                
            except (ImportError, AttributeError) as e:
                extractor_name = extractor_info.get("class", extractor_info.get("function", "unknown"))
                logger.warning(f"Failed to load extractor {extractor_name}: {str(e)}")
    
    def get_extractor_for_url(self, url: str) -> Optional[Any]:
        """
        Get the most appropriate extractor for the given URL
        
        Args:
            url: The URL of the property listing
            
        Returns:
            The appropriate extractor instance or None if no suitable extractor is found
        """
        if not url:
            return None
        
        # Check each specialized extractor
        for extractor in self.extractors:
            if hasattr(extractor, 'can_handle') and extractor.can_handle(url):
                logger.info(f"Using specialized extractor {extractor.__class__.__name__} for {url}")
                return extractor
        
        # If no specialized extractor is found, use the universal extractor
        if self.universal_extractor:
            logger.info(f"Using universal extractor for {url}")
            return self.universal_extractor
        
        logger.warning(f"No suitable extractor found for {url}")
        return None
    
    def extract_from_html(self, html: str, url: str) -> Dict[str, Any]:
        """
        Extract property data from HTML using the appropriate extractor
        
        Args:
            html: The raw HTML content of the property listing
            url: The URL of the property listing
            
        Returns:
            Dictionary containing extracted property data
        """
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        
        # Get the appropriate extractor
        extractor = self.get_extractor_for_url(url)
        
        if not extractor:
            return {
                "success": False,
                "error": "No suitable extractor found for this URL"
            }
        
        try:
            # Extract data using the selected extractor
            data = extractor.extract(soup, url)
            
            # Add metadata about the extraction
            data["extractor_used"] = extractor.__class__.__name__
            data["source_url"] = url
            data["source_domain"] = self._extract_domain(url)
            
            # Apply enhanced image extraction if available
            if ENHANCED_IMAGE_EXTRACTION:
                try:
                    logger.info(f"Applying enhanced image extraction for {url}")
                    enhanced_images = extract_images(soup, url)
                    
                    # Only use enhanced images if we found some
                    if enhanced_images and len(enhanced_images) > 0:
                        logger.info(f"Enhanced extraction found {len(enhanced_images)} images")
                        # Record original image count for metrics
                        original_image_count = len(data.get("assets", []))
                        data["assets"] = enhanced_images
                        
                        # Add metadata about the image extraction
                        data["image_extraction_enhanced"] = True
                        data["image_extraction_metrics"] = {
                            "original_count": original_image_count,
                            "enhanced_count": len(enhanced_images)
                        }
                except Exception as img_error:
                    logger.error(f"Enhanced image extraction failed: {str(img_error)}")
                    # Continue with original extraction data
            
            return {
                "success": True,
                "data": data
            }
        except Exception as e:
            logger.error(f"Extraction error with {extractor.__class__.__name__}: {str(e)}")
            
            # Fallback to universal extractor if a specialized one failed
            if extractor != self.universal_extractor and self.universal_extractor:
                logger.info(f"Falling back to universal extractor for {url}")
                try:
                    data = self.universal_extractor.extract(soup, url)
                    
                    # Add metadata about the extraction
                    data["extractor_used"] = f"{extractor.__class__.__name__} (failed) -> UniversalExtractor (fallback)"
                    data["source_url"] = url
                    data["source_domain"] = self._extract_domain(url)
                    
                    # Apply enhanced image extraction if available (for fallback case)
                    if ENHANCED_IMAGE_EXTRACTION:
                        try:
                            logger.info(f"Applying enhanced image extraction for fallback on {url}")
                            enhanced_images = extract_images(soup, url)
                            
                            # Only use enhanced images if we found some
                            if enhanced_images and len(enhanced_images) > 0:
                                logger.info(f"Enhanced fallback extraction found {len(enhanced_images)} images")
                                # Record original image count for metrics
                                original_image_count = len(data.get("assets", []))
                                data["assets"] = enhanced_images
                                
                                # Add metadata about the image extraction
                                data["image_extraction_enhanced"] = True
                                data["image_extraction_metrics"] = {
                                    "original_count": original_image_count,
                                    "enhanced_count": len(enhanced_images),
                                    "fallback": True
                                }
                        except Exception as img_error:
                            logger.error(f"Enhanced fallback image extraction failed: {str(img_error)}")
                            # Continue with original extraction data
                    
                    return {
                        "success": True,
                        "data": data
                    }
                except Exception as fallback_error:
                    logger.error(f"Universal extractor fallback also failed: {str(fallback_error)}")
            
            return {
                "success": False,
                "error": f"Extraction failed: {str(e)}",
                "extractor": extractor.__class__.__name__
            }
    
    def _extract_domain(self, url: str) -> str:
        """Extract the domain from a URL"""
        match = re.search(r'https?://(?:www\.)?([^/]+)', url)
        if match:
            return match.group(1)
        return ""
    
    def list_supported_sites(self) -> List[Dict[str, Any]]:
        """
        Get a list of all supported sites with their confidence levels
        
        Returns:
            List of dictionaries containing site information
        """
        sites = []
        
        # Add specialized extractors with high confidence
        for extractor in self.extractors:
            if hasattr(extractor, 'domain_patterns'):
                for domain in extractor.domain_patterns:
                    sites.append({
                        "domain": domain,
                        "name": self._get_site_name(domain),
                        "supported": True,
                        "confidence": 0.9,
                        "extractor": extractor.__class__.__name__
                    })
        
        # Add additional sites that the universal extractor can handle with moderate confidence
        additional_sites = [
            {"domain": "redfin.com", "name": "Redfin"},
            {"domain": "trulia.com", "name": "Trulia"},
            {"domain": "loopnet.com", "name": "LoopNet"},
            {"domain": "realtor.com", "name": "Realtor.com"},
            {"domain": "land.com", "name": "Land.com"},
            {"domain": "landsofamerica.com", "name": "Lands of America"},
            {"domain": "landleader.com", "name": "Land Leader"},
            {"domain": "landpin.com", "name": "LandPin"},
            {"domain": "landnet.com", "name": "LandNet"},
            {"domain": "farmandranch.com", "name": "Farm & Ranch"},
            {"domain": "classiccountryland.com", "name": "Classic Country Land", "extractor": "WordpressExtractor", "confidence": 0.9},
            {"domain": "findingflorida.com", "name": "Finding Florida", "extractor": "WordpressExtractor", "confidence": 0.9}
        ]
        
        # Check if these sites are already in the list
        existing_domains = [site["domain"] for site in sites]
        
        for site in additional_sites:
            if site["domain"] not in existing_domains:
                # Use site-specific extractor and confidence if provided, otherwise use defaults
                extractor = site.get("extractor", "UniversalExtractor")
                confidence = site.get("confidence", 0.7)
                
                sites.append({
                    "domain": site["domain"],
                    "name": site["name"],
                    "supported": True,
                    "confidence": confidence,
                    "extractor": extractor
                })
        
        return sites
    
    def _get_site_name(self, domain: str) -> str:
        """Convert a domain to a readable site name"""
        # Remove TLD and capitalize words
        base_name = domain.split('.')[0]
        
        # Handle special cases
        if base_name == "landwatch":
            return "LandWatch"
        elif base_name == "landflip":
            return "LandFlip"
        elif base_name == "landsearch":
            return "LandSearch"
        elif base_name == "zillow":
            return "Zillow"
        
        # Default: capitalize first letter of each word
        words = re.findall(r'[a-zA-Z][^A-Z]*', base_name)
        return ''.join(word.capitalize() for word in words)

# Create a singleton instance
scraper_factory = ScraperFactory()

# Export as module-level functions for easier access
def get_extractor_for_url(url: str):
    return scraper_factory.get_extractor_for_url(url)

def extract_from_html(html: str, url: str):
    return scraper_factory.extract_from_html(html, url)

def list_supported_sites():
    return scraper_factory.list_supported_sites()