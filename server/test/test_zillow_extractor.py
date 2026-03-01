import sys
import os

# Add the parent directory to the sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import re

class ZillowExtractorTest:
    def __init__(self):
        self.logger = print
    
    async def extract_from_zillow_url(self, url):
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
        
        print(f"Extracting from Zillow URL: {url}")
        
        # Example: /homedetails/0-N-Charleau-Gap-Rd-Oracle-AZ-85623/353745752_zpid/
        path = url.split('://')[1].split('/', 1)[1]
        property_id = None
        location = None
        
        if 'homedetails' in path:
            parts = path.strip('/').split('/')
            print(f"Path parts: {parts}")
            
            if len(parts) >= 2:
                address_part = parts[1]
                print(f"Address part: {address_part}")
                
                if address_part:
                    # Try to extract acreage from address if available
                    acre_match = re.search(r'(\d+(?:\.\d+)?)[_\-]?acres?', address_part.lower())
                    if acre_match:
                        try:
                            acreage = float(acre_match.group(1))
                            if 0.1 <= acreage <= 10000:  # Reasonable acreage range
                                data['acreage'] = acreage
                                print(f"Extracted acreage: {acreage}")
                        except ValueError:
                            pass
                
                # Extract property ID
                if len(parts) >= 3 and 'zpid' in parts[2]:
                    property_id = parts[2].split('_')[0]
                    print(f"Property ID: {property_id}")
                    
                    # Try to extract price from property ID for Zillow
                    try:
                        if property_id and property_id.isdigit() and len(property_id) >= 6:
                            # Many Zillow IDs encode approximate value in first digits
                            potential_price = int(property_id[:6])
                            print(f"Potential price from ID: {potential_price}")
                            # Only use if it looks like a reasonable property price
                            if 100000 <= potential_price <= 9999999:
                                data['price'] = potential_price
                                print(f"Extracted price: {potential_price}")
                    except ValueError:
                        pass
        
        return data

async def test():
    extractor = ZillowExtractorTest()
    urls = [
        "https://www.zillow.com/homedetails/0-N-Charleau-Gap-Rd-Oracle-AZ-85623/353745752_zpid/",
        "https://www.zillow.com/homedetails/123-Acre-Road-City-State/399500_zpid/",
        "https://www.zillow.com/homedetails/10-acres-beautiful-land-Tucson-AZ/255000_zpid/"
    ]
    
    for url in urls:
        print(f"\n=== Testing URL: {url} ===")
        data = await extractor.extract_from_zillow_url(url)
        print(f"Price: {data.get('price')}")
        print(f"Acreage: {data.get('acreage')}")
        print("========================\n")

asyncio.run(test())
