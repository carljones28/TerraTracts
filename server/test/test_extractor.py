import sys
import os

# Add the parent directory to the sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import re
from bs4 import BeautifulSoup
from urllib.parse import urlparse

class SimpleExtractorTest:
    def __init__(self):
        self.logger = print
    
    def _clean_text(self, text):
        if not text:
            return ""
        return ' '.join(text.split())
    
    async def extract_from_url(self, url):
        data = {
            'title': '',
            'description': '',
            'state': '',
            'property_type': 'land',
            'price': None,
            'acreage': None,
            'location': {},
            'assets': []
        }
        
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        path = parsed_url.path
        
        print(f"Extracting from URL: {url}")
        print(f"Domain: {domain}")
        print(f"Path: {path}")
        
        # Handle LandWatch URLs
        if 'landwatch.com' in domain:
            path_parts = path.strip('/').split('/')
            print(f"Path parts: {path_parts}")
            
            if len(path_parts) >= 1:
                location_property_part = path_parts[0]
                print(f"Location property part: {location_property_part}")
                
                # Extract state, county, and property type from URL
                parts = location_property_part.split('-')
                print(f"Split parts: {parts}")
                
                # Look for possible price patterns in URL
                price_patterns = [
                    r'price[_\-](\d+)',
                    r'(\d+)[_\-]dollars',
                    r'(\d+)[_\-]per[_\-]acre',
                    r'(\d+k)',  # e.g. 500k
                    r'(\d+)k[_\-]',  # e.g. 500k-
                ]
                
                for pattern in price_patterns:
                    price_match = re.search(pattern, path.lower())
                    if price_match:
                        price_str = price_match.group(1)
                        print(f"Found price pattern match: {price_str}")
                        try:
                            # Handle special case like "500k" meaning 500,000
                            if price_str.endswith('k'):
                                price_str = price_str[:-1]
                                price_value = float(price_str) * 1000
                            else:
                                price_value = float(price_str)
                                
                            # Sanity check - real estate prices are rarely under $1000
                            if price_value > 1000:
                                data['price'] = price_value
                                print(f"Extracted price: {price_value}")
                                break
                        except ValueError:
                            pass
                
                # Try to extract acreage from URL patterns
                acreage_patterns = [
                    r'(\d+(?:\.\d+)?)[_\-]acres?',
                    r'(\d+(?:\.\d+)?)[_\-]ac',
                    r'acres?[_\-](\d+(?:\.\d+)?)',
                ]
                
                for pattern in acreage_patterns:
                    acreage_match = re.search(pattern, path.lower())
                    if acreage_match:
                        try:
                            acreage_value = float(acreage_match.group(1))
                            print(f"Found acreage pattern match: {acreage_value}")
                            # Sanity check - acreage is typically between 0.1 and 10,000
                            if 0.1 <= acreage_value <= 10000:
                                data['acreage'] = acreage_value
                                print(f"Extracted acreage: {acreage_value}")
                                break
                        except ValueError:
                            pass
                            
                # Property ID extraction
                property_id = None
                if len(path_parts) > 1 and path_parts[1].startswith('pid'):
                    try:
                        property_id = path_parts[1].split('/')[1]
                        print(f"Extracted property ID: {property_id}")
                    except IndexError:
                        pass
                        
                # Attempt to infer price/acreage from property ID by checking for numeric patterns
                if property_id and not data.get('price'):
                    # Some property IDs encode pricing information
                    price_from_id_match = re.search(r'(\d{5,7})', property_id)
                    if price_from_id_match:
                        try:
                            potential_price = int(price_from_id_match.group(1))
                            print(f"Potential price from ID: {potential_price}")
                            # Only use if it looks like a reasonable property price (over $10,000)
                            if potential_price > 10000 and potential_price < 100000000:
                                # Round to nearest thousand for cleaner numbers
                                data['price'] = round(potential_price / 1000) * 1000
                                print(f"Using price from ID: {data['price']}")
                        except ValueError:
                            pass
        
        return data

async def test():
    extractor = SimpleExtractorTest()
    urls = [
        "https://www.landwatch.com/crook-county-oregon-undeveloped-land-for-sale/pid/4520625",
        "https://www.landwatch.com/mariposa-county-california-farms-and-ranches-for-sale/pid/422126521",
        "https://www.zillow.com/homedetails/0-N-Charleau-Gap-Rd-Oracle-AZ-85623/353745752_zpid/",
        "https://www.landwatch.com/price-199000-madison-county-virginia-land-for-sale/pid/412225521", 
        "https://www.landwatch.com/75-acres-clark-county-nevada-land-for-sale/pid/4321001"
    ]
    
    for url in urls:
        print(f"\n=== Testing URL: {url} ===")
        data = await extractor.extract_from_url(url)
        print(f"Price: {data.get('price')}")
        print(f"Acreage: {data.get('acreage')}")
        print("========================\n")

asyncio.run(test())
