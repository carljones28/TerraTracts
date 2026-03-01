"""
FastAPI-based scraper service for property data extraction.
"""

import os
import time
import json
import asyncio
import logging
from typing import Dict, Any, Optional
import uvicorn
import nest_asyncio
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from scrapers.models import ScraperRequest, ScraperResponse, ScraperListResponse
from scrapers.scraper_factory import ScraperFactory


# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Property Scraper API",
    description="API for scraping property data from real estate websites",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create scraper factory
scraper_factory = ScraperFactory()

# Cache for storing recent scrape results
scrape_cache = {}
cache_expiry_seconds = 3600  # 1 hour cache expiry


@app.on_event("startup")
async def startup_event():
    """Run on app startup"""
    logger.info("Starting Property Scraper API")


@app.get("/api/scrapers", response_model=ScraperListResponse)
async def list_scrapers():
    """List all available scrapers"""
    return scraper_factory.get_scraper_info()


@app.post("/api/scrape", response_model=ScraperResponse)
async def scrape_url(request: ScraperRequest):
    """
    Scrape a URL for property data
    
    Args:
        request: ScraperRequest with URL and options
    
    Returns:
        ScraperResponse with the extracted data
    """
    url = str(request.url)
    strategy = request.strategy
    options = request.options or {}
    targeted = request.targeted
    
    # Add targeted extraction configuration to options if specified
    if targeted:
        options["targeted"] = targeted.dict()
        
        # Create a more specific cache key for targeted extraction
        cache_key_parts = [url, strategy]
        
        # Add targeted extraction settings to cache key
        for field, value in targeted.dict().items():
            if isinstance(value, bool) and value:
                cache_key_parts.append(field)
        
        cache_key = ":".join(cache_key_parts)
    else:
        cache_key = f"{url}:{strategy}"
    
    # Check cache first (only if not explicitly bypassed)
    if not options.get("bypass_cache", False):
        if cache_key in scrape_cache:
            cached_data, timestamp = scrape_cache[cache_key]
            
            # If cache is still valid (not expired)
            if time.time() - timestamp < cache_expiry_seconds:
                logger.info(f"Serving cached result for {url}")
                cached_data["from_cache"] = True
                return ScraperResponse(**cached_data)
    
    # Execute scraping
    if targeted:
        logger.info(f"Scraping URL: {url} with strategy: {strategy} (targeted extraction)")
    else:
        logger.info(f"Scraping URL: {url} with strategy: {strategy}")
        
    result = await scraper_factory.scrape_url(url, strategy, options)
    
    # Cache the result if successful
    if result.success and result.data:
        scrape_cache[cache_key] = (result.dict(), time.time())
    
    return result


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log all requests"""
    start_time = time.time()
    response = await call_next(request)
    process_time = round((time.time() - start_time) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} - {process_time}ms")
    return response


# Define a function to run the FastAPI app
def run_scraper_service(host: str = "0.0.0.0", port: int = 8000):
    """
    Run the scraper service
    
    Args:
        host: Host to listen on
        port: Port to listen on
    """
    uvicorn.run(app, host=host, port=port)


# For direct execution
if __name__ == "__main__":
    port = int(os.environ.get("SCRAPER_PORT", 8000))
    run_scraper_service(port=port)