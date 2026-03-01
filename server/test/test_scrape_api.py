import asyncio
import aiohttp
import json

async def test_scrape_api():
    async with aiohttp.ClientSession() as session:
        test_urls = [
            "https://www.landwatch.com/price-199000-madison-county-virginia-land-for-sale/pid/412225521",
            "https://www.landwatch.com/75-acres-clark-county-nevada-land-for-sale/pid/4321001",
            "https://www.zillow.com/homedetails/10-acres-beautiful-land-Tucson-AZ/255000_zpid/"
        ]
        
        for url in test_urls:
            print(f"\n=== Testing URL: {url} ===")
            
            # Call the API
            try:
                async with session.post(
                    "http://localhost:5001/api/scrape",
                    json={"url": url},
                    timeout=10
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("success"):
                            data = result.get("data", {})
                            
                            # Print the important parts
                            print(f"Title: {data.get('title', 'N/A')}")
                            print(f"Description: {data.get('description', 'N/A')}")
                            print(f"Price: {data.get('price', 'Not extracted')}")
                            print(f"Acreage: {data.get('acreage', 'Not extracted')}")
                            
                            if "confidence_metrics" in data:
                                print(f"Confidence Metrics:")
                                for key, value in data["confidence_metrics"].items():
                                    print(f"  - {key}: {value}")
                        else:
                            print(f"Error: {result.get('message', 'Unknown error')}")
                    else:
                        print(f"HTTP Error: {response.status}")
                        error_text = await response.text()
                        print(f"Response: {error_text}")
            except Exception as e:
                print(f"Exception: {e}")

try:
    asyncio.run(test_scrape_api())
except KeyboardInterrupt:
    print("Test interrupted")
