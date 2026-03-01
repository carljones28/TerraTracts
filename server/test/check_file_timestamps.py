import os
import datetime

def check_file(file_path):
    if not os.path.exists(file_path):
        print(f"ERROR: File does not exist: {file_path}")
        return
    
    # Get file size
    size = os.path.getsize(file_path)
    
    # Get modification time
    mod_time = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
    
    # Read file content to check for specific patterns
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check for specific extraction patterns we added
    patterns = {
        "price extraction": "price_patterns = [",
        "acreage extraction": "acreage_patterns = [",
        "price from ID": "price_from_id_match = re.search",
        "enhanced description": "description = f\"This is a {property_type or 'land'} property",
        "price formatting in title": "${:,.0f}",
        "confidence metrics updating": "confidence_metrics['price'] = 0.6",
    }
    
    found_patterns = {}
    for key, pattern in patterns.items():
        found_patterns[key] = pattern in content
    
    print(f"File: {file_path}")
    print(f"Size: {size} bytes")
    print(f"Last modified: {mod_time}")
    print("Pattern check:")
    for key, found in found_patterns.items():
        status = "✓ FOUND" if found else "✗ NOT FOUND"
        print(f"  - {key}: {status}")
    
    print("\n")

# Check the files we modified
files_to_check = [
    "scrapers/simple_extractor.py"
]

for file in files_to_check:
    check_file(file)

# Also check the imported version in case it's cached
print("Checking if module is cached correctly:")
try:
    import sys
    import scrapers.simple_extractor
    print(f"Module path: {scrapers.simple_extractor.__file__}")
    module_size = os.path.getsize(scrapers.simple_extractor.__file__)
    module_time = datetime.datetime.fromtimestamp(os.path.getmtime(scrapers.simple_extractor.__file__))
    print(f"Module size: {module_size} bytes")
    print(f"Module modified: {module_time}")
except Exception as e:
    print(f"Error importing module: {e}")
