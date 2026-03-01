"""
Data models for the property scraper service.
"""

from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel


class TargetedExtraction(BaseModel):
    """Configurable fields for targeted extraction"""
    core_details: bool = True  # Price, acreage, location, zoning
    documents: bool = True     # Surveys, deeds, soil reports
    media: bool = True         # Images, videos  
    maps: bool = True          # Coordinates, boundary diagrams
    descriptions: bool = True  # Property details and features text
    
    # Minimum validation thresholds
    min_image_count: int = 3
    min_image_quality: str = "high"  # low, medium, high
    min_confidence: float = 0.7      # Confidence threshold 0.0-1.0

class ScraperRequest(BaseModel):
    """Request model for scraping a URL"""
    url: str
    strategy: Optional[str] = "auto"
    options: Optional[Dict[str, Any]] = None
    targeted: Optional[TargetedExtraction] = None


class ScraperInfo(BaseModel):
    """Information about a scraper"""
    name: str
    description: str
    supported_domains: List[str]


class ScraperListResponse(BaseModel):
    """Response model for listing scrapers"""
    scrapers: List[ScraperInfo]


class LocationInfo(BaseModel):
    """Location information for a property"""
    address: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = "USA"


class Coordinates(BaseModel):
    """Geographic coordinates"""
    latitude: float
    longitude: float


class PropertyFeature(BaseModel):
    """A feature or amenity of a property"""
    name: str
    value: Optional[str] = None
    category: Optional[str] = None


class PropertyAsset(BaseModel):
    """An asset related to a property (image, document, etc.)"""
    id: Optional[str] = None
    type: str  # image, video, document, etc.
    url: str
    thumbnail: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    selected: Optional[bool] = True


class ConfidenceMetrics(BaseModel):
    """Confidence metrics for extracted data"""
    overall: float = 0.0
    
    # Core details confidence
    price: Optional[float] = None
    acreage: Optional[float] = None
    location: Optional[float] = None
    zoning: Optional[float] = None
    land_use: Optional[float] = None
    
    # Asset confidence
    images: Optional[float] = None
    documents: Optional[float] = None
    
    # Content confidence
    features: Optional[float] = None
    description: Optional[float] = None
    
    # Map confidence
    coordinates: Optional[float] = None
    boundary: Optional[float] = None


class PropertyDocument(BaseModel):
    """A document related to a property (survey, deed, soil report, etc)"""
    type: str  # survey, deed, soil_report, etc
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    confidence: float = 1.0

class PropertyZoning(BaseModel):
    """Zoning information for a property"""
    type: Optional[str] = None  # residential, commercial, agricultural
    code: Optional[str] = None  # R1, C2, etc
    description: Optional[str] = None
    permitted_uses: Optional[List[str]] = None
    restricted_uses: Optional[List[str]] = None

class BoundaryData(BaseModel):
    """Property boundary data"""
    points: Optional[List[List[float]]] = None  # List of [long, lat] coordinates
    geojson: Optional[Dict[str, Any]] = None
    kml_url: Optional[str] = None
    source: Optional[str] = None  # survey, gis, approximation

class ScrapedProperty(BaseModel):
    """Model for a scraped property"""
    # Basic details
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    acreage: Optional[float] = None
    property_type: Optional[str] = None
    status: Optional[str] = None
    
    # Location information
    location: Optional[LocationInfo] = None
    coordinates: Optional[Coordinates] = None
    
    # Enhanced property details
    zoning: Optional[PropertyZoning] = None
    land_use: Optional[str] = None  # residential, commercial, agricultural
    terrain_type: Optional[str] = None  # flat, hilly, mountainous, etc
    water_features: Optional[List[str]] = None  # creek, river, lake, etc
    road_access: Optional[bool] = None
    utilities: Optional[List[str]] = None  # electricity, water, sewer, etc
    
    # Assets and documents
    features: Optional[List[PropertyFeature]] = None
    assets: Optional[List[PropertyAsset]] = None
    documents: Optional[List[PropertyDocument]] = None
    boundary_data: Optional[BoundaryData] = None
    
    # Metadata
    source_url: Optional[str] = None
    scraped_at: Optional[str] = None
    confidence_metrics: Optional[ConfidenceMetrics] = None
    raw_data: Optional[Dict[str, Any]] = None
    
    # Data quality indicators
    uncertain_fields: Optional[List[str]] = None  # Fields with low confidence
    missing_required_fields: Optional[List[str]] = None  # Required fields that couldn't be found


class ScraperResponse(BaseModel):
    """Response model for scraper API"""
    success: bool
    message: Optional[str] = None
    strategy_used: Optional[str] = None
    data: Optional[ScrapedProperty] = None
    from_cache: Optional[bool] = False
    error: Optional[str] = None