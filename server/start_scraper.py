"""
Script to start the property scraper service.
"""

import os
import sys
import time
import logging
import subprocess
import threading
from scraper_service import run_scraper_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def start_scraper_service():
    """Start the scraper service on port 5001"""
    logger.info("Starting property scraper service on port 5001")
    run_scraper_service(host="0.0.0.0", port=5001)

if __name__ == "__main__":
    # Start the service in a separate thread
    thread = threading.Thread(target=start_scraper_service)
    thread.daemon = True
    thread.start()
    
    logger.info("Scraper service started in background thread")
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down scraper service")
        sys.exit(0)