"""
Base scraper module defining the interface for all property scrapers.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

from scrapers.models import ScrapedProperty


class BaseScraper(ABC):
    """Base class for all property scrapers"""
    
    @abstractmethod
    def get_name(self) -> str:
        """Get the name of the scraper"""
        pass
    
    @abstractmethod
    def get_description(self) -> str:
        """Get a description of the scraper"""
        pass
    
    @abstractmethod
    def get_supported_domains(self) -> List[str]:
        """Get a list of domains supported by this scraper"""
        pass
    
    @abstractmethod
    async def extract_data(self, url: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extract property data from the URL
        
        Args:
            url: The URL to scrape
            options: Additional options for the scraper
            
        Returns:
            A dictionary of property data
        """
        pass