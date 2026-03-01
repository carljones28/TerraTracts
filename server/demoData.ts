import { InsertLandProperty, propertyTypeEnum } from "@shared/schema";

// Property types from our schema
const propertyTypes = ["residential", "commercial", "recreational", "agricultural", "conservation"];

// List of all US states
const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

// State abbreviations
const stateAbbreviations: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
  "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
  "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
  "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
  "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
  "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
  "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
};

// Common amenities and features
const amenities = [
  "Road Access", "Electricity", "Well Water", "Municipal Water", "Septic System", 
  "Natural Gas", "Internet Access", "Cell Service", "Creek/Stream", "Pond/Lake", 
  "River Frontage", "Mountain Views", "Ocean Views", "Lake Views", "Wooded", 
  "Cleared", "Flat", "Rolling", "Steep", "Southern Exposure", "Fenced", 
  "Gated Entrance", "Existing Structure", "RV Hookups", "Hunting"
];

// Different terrain types
const terrainTypes = [
  "forest", "mountain", "plains", "valley", "desert", "wetland", 
  "coastal", "grassland", "alpine", "canyon", "mesa", "piedmont"
];

// Different vegetation types
const vegetationTypes = [
  "old growth forest", "pine forest", "oak forest", "maple forest", "redwood grove",
  "prairie grassland", "desert scrub", "sagebrush", "chaparral", "alpine meadow",
  "riparian", "wetland marsh", "mangrove", "tropical", "savanna", "mixed forest"
];

// Real image URLs from Unsplash
function getPropertyImages(state: string, propertyType: string, id: number): string[] {
  // Each property type has a specific set of images 
  const imageCollections = {
    residential: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6",
      "https://images.unsplash.com/photo-1592595896551-12b371d546d5",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83"
    ],
    commercial: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
      "https://images.unsplash.com/photo-1464082354059-27db6ce50048"
    ],
    agricultural: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449",
      "https://images.unsplash.com/photo-1495107334309-fcf20f6a8343",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399"
    ],
    recreational: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      "https://images.unsplash.com/photo-1506260408121-e353d10b87c7",
      "https://images.unsplash.com/photo-1511497584788-876760111969",
      "https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6"
    ],
    conservation: [
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
      "https://images.unsplash.com/photo-1469827160215-9d29e96e72f4",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e"
    ]
  };
  
  // Ensure we have a valid property type, defaulting to residential if not
  const type = propertyTypeEnum.enumValues.includes(propertyType as any) ? 
    propertyType : "residential";
  
  // Add URL parameters to make each image unique based on property ID
  return imageCollections[type as keyof typeof imageCollections].map(url => 
    `${url}?property=${id}&state=${state.toLowerCase().replace(/\s+/g, '')}`
  );
}

// Random data generators
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomLatitude(state: string): number {
  // Approximate latitude ranges for US states
  const latRanges: Record<string, [number, number]> = {
    "Alabama": [30.2, 35.0], "Alaska": [54.0, 71.5], "Arizona": [31.3, 37.0],
    "Arkansas": [33.0, 36.5], "California": [32.5, 42.0], "Colorado": [37.0, 41.0],
    "Connecticut": [41.0, 42.0], "Delaware": [38.5, 39.8], "Florida": [25.0, 31.0],
    "Georgia": [30.5, 35.0], "Hawaii": [18.9, 22.2], "Idaho": [42.0, 49.0],
    "Illinois": [37.0, 42.5], "Indiana": [37.8, 41.8], "Iowa": [40.4, 43.5],
    "Kansas": [37.0, 40.0], "Kentucky": [36.5, 39.2], "Louisiana": [29.0, 33.0],
    "Maine": [43.0, 47.5], "Maryland": [38.0, 39.7], "Massachusetts": [41.2, 42.9],
    "Michigan": [41.7, 47.5], "Minnesota": [43.5, 49.4], "Mississippi": [30.0, 35.0],
    "Missouri": [36.0, 40.6], "Montana": [44.4, 49.0], "Nebraska": [40.0, 43.0],
    "Nevada": [35.0, 42.0], "New Hampshire": [42.7, 45.3], "New Jersey": [39.0, 41.4],
    "New Mexico": [31.3, 37.0], "New York": [40.5, 45.0], "North Carolina": [33.8, 36.6],
    "North Dakota": [45.9, 49.0], "Ohio": [38.4, 42.0], "Oklahoma": [33.6, 37.0],
    "Oregon": [42.0, 46.3], "Pennsylvania": [39.7, 42.3], "Rhode Island": [41.1, 42.0],
    "South Carolina": [32.0, 35.2], "South Dakota": [42.5, 46.0], "Tennessee": [34.9, 36.7],
    "Texas": [26.0, 36.5], "Utah": [37.0, 42.0], "Vermont": [42.7, 45.0],
    "Virginia": [36.5, 39.5], "Washington": [45.5, 49.0], "West Virginia": [37.2, 40.6],
    "Wisconsin": [42.5, 47.0], "Wyoming": [41.0, 45.0]
  };

  const range = latRanges[state] || [25.0, 49.0]; // Default if state not found
  return parseFloat((Math.random() * (range[1] - range[0]) + range[0]).toFixed(6));
}

function getRandomLongitude(state: string): number {
  // Approximate longitude ranges for US states (negative for western hemisphere)
  const longRanges: Record<string, [number, number]> = {
    "Alabama": [-88.5, -84.9], "Alaska": [-170.0, -130.0], "Arizona": [-114.8, -109.0],
    "Arkansas": [-94.7, -89.7], "California": [-124.4, -114.1], "Colorado": [-109.0, -102.0],
    "Connecticut": [-73.7, -71.8], "Delaware": [-75.8, -75.0], "Florida": [-87.6, -80.0],
    "Georgia": [-85.6, -80.8], "Hawaii": [-160.0, -154.8], "Idaho": [-117.2, -111.0],
    "Illinois": [-91.5, -87.5], "Indiana": [-88.1, -84.8], "Iowa": [-96.6, -90.1],
    "Kansas": [-102.0, -94.6], "Kentucky": [-89.6, -81.9], "Louisiana": [-94.0, -89.0],
    "Maine": [-71.1, -66.9], "Maryland": [-79.5, -75.0], "Massachusetts": [-73.5, -69.9],
    "Michigan": [-90.4, -82.4], "Minnesota": [-97.2, -89.5], "Mississippi": [-91.7, -88.1],
    "Missouri": [-95.8, -89.1], "Montana": [-116.0, -104.0], "Nebraska": [-104.0, -95.3],
    "Nevada": [-120.0, -114.0], "New Hampshire": [-72.6, -70.7], "New Jersey": [-75.6, -73.9],
    "New Mexico": [-109.0, -103.0], "New York": [-79.8, -71.8], "North Carolina": [-84.3, -75.5],
    "North Dakota": [-104.0, -96.6], "Ohio": [-84.8, -80.5], "Oklahoma": [-103.0, -94.4],
    "Oregon": [-124.6, -116.5], "Pennsylvania": [-80.5, -74.7], "Rhode Island": [-71.9, -71.1],
    "South Carolina": [-83.4, -78.5], "South Dakota": [-104.0, -96.4], "Tennessee": [-90.3, -81.7],
    "Texas": [-106.6, -93.5], "Utah": [-114.0, -109.0], "Vermont": [-73.4, -71.5],
    "Virginia": [-83.7, -75.2], "Washington": [-124.8, -116.9], "West Virginia": [-82.6, -77.7],
    "Wisconsin": [-92.9, -86.8], "Wyoming": [-111.0, -104.0]
  };

  const range = longRanges[state] || [-125.0, -66.0]; // Default if state not found
  return parseFloat((Math.random() * (range[1] - range[0]) + range[0]).toFixed(6));
}

// Generate property titles based on type, state, and features
function generatePropertyTitle(state: string, propertyType: string, acreage: number, terrain: string): string {
  const propertyAdjectives = [
    "Pristine", "Secluded", "Stunning", "Picturesque", "Beautiful", "Scenic", 
    "Serene", "Majestic", "Idyllic", "Peaceful", "Tranquil", "Enchanting", 
    "Charming", "Premium", "Historic", "Unique", "Exclusive", "Private"
  ];
  
  const propertyNouns = {
    "residential": ["Homesite", "Estate", "Retreat", "Building Lot", "Home Lot", "Sanctuary"],
    "commercial": ["Development", "Commercial Tract", "Business Center", "Office Park", "Retail Location", "Investment Site"],
    "recreational": ["Getaway", "Hunting Land", "Adventure Property", "Campsite", "Recreation Area", "Outdoor Haven"],
    "agricultural": ["Farm", "Ranch", "Farmland", "Orchard", "Vineyard", "Agricultural Land"],
    "conservation": ["Preserve", "Conservation Land", "Natural Area", "Wildlife Reserve", "Ecological Habitat"]
  };
  
  const terrainAdjectives = {
    "forest": ["Wooded", "Forested", "Timber", "Woodland"],
    "mountain": ["Mountain", "Peak", "Ridgetop", "Alpine"],
    "plains": ["Rolling", "Prairie", "Flatland", "Open"],
    "valley": ["Valley", "Riverside", "Hollow", "Streamside"],
    "desert": ["Desert", "Arid", "Mesa", "Canyon"],
    "wetland": ["Wetland", "Marsh", "Lakefront", "Bayou"],
    "coastal": ["Coastal", "Oceanfront", "Beachside", "Shoreline"],
    "grassland": ["Grassland", "Meadow", "Field", "Prairie"],
    "alpine": ["Alpine", "High-Elevation", "Mountain Top", "Highland"],
    "canyon": ["Canyon", "Gorge", "Ravine", "Pass"],
    "mesa": ["Mesa", "Plateau", "Bluff", "Hilltop"],
    "piedmont": ["Piedmont", "Foothill", "Rolling", "Hilly"]
  };
  
  const adj = getRandomElement(propertyAdjectives);
  const terrainAdj = getRandomElement(terrainAdjectives[terrain as keyof typeof terrainAdjectives] || ["Beautiful"]);
  const noun = getRandomElement(propertyNouns[propertyType as keyof typeof propertyNouns] || ["Property"]);
  
  return `${adj} ${terrainAdj} ${noun} in ${state} (${acreage} Acres)`;
}

// Generate property descriptions based on type, features, and state
function generatePropertyDescription(
  state: string, 
  propertyType: string, 
  acreage: number, 
  terrain: string, 
  vegetation: string, 
  selectedAmenities: string[],
  price: number
): string {
  // Location descriptions by state
  const stateDescriptions: Record<string, string[]> = {
    "Alabama": ["heart of the South", "just outside Birmingham", "near the Gulf shores", "Appalachian foothills"],
    "Alaska": ["last frontier", "wilderness area", "pristine backcountry", "unspoiled nature"],
    "Arizona": ["Sonoran Desert", "near the Grand Canyon", "high desert plateau", "red rock country"],
    "Arkansas": ["Ozark Mountains", "Natural State", "river valley", "timberlands"],
    "California": ["wine country", "Sierra foothills", "coastal region", "Central Valley"],
    "Colorado": ["Rocky Mountain", "Front Range", "mountain valley", "alpine meadows"],
    "Connecticut": ["New England countryside", "historic region", "Connecticut River Valley", "wooded hills"],
    "Delaware": ["coastal plains", "historic district", "Delaware Bay", "southern county"],
    "Florida": ["Gulf Coast", "near the Everglades", "central highlands", "Atlantic Coast"],
    "Georgia": ["Blue Ridge Mountains", "coastal plains", "pine forests", "historic district"],
    "Hawaii": ["tropical paradise", "volcanic slopes", "lush valley", "coastal property"],
    "Idaho": ["mountain wilderness", "lake country", "northern forests", "Snake River Plain"],
    "Illinois": ["rolling farmland", "prairie land", "river valley", "Shawnee Hills"],
    "Indiana": ["countryside", "lake region", "wooded hills", "farm country"],
    "Iowa": ["fertile plains", "Mississippi River Valley", "rolling hills", "prairie land"],
    "Kansas": ["Flint Hills", "prairie land", "western plains", "river valley"],
    "Kentucky": ["Bluegrass Region", "Cumberland Plateau", "horse country", "Appalachian foothills"],
    "Louisiana": ["bayou country", "river delta", "historic plantation area", "coastal wetlands"],
    "Maine": ["coastal peninsula", "northern woods", "lake region", "Acadia region"],
    "Maryland": ["Chesapeake Bay", "historic countryside", "coastal plains", "mountain highlands"],
    "Massachusetts": ["historic New England", "Cape Cod region", "Berkshire Mountains", "coastal area"],
    "Michigan": ["Great Lakes", "Upper Peninsula", "north woods", "lake country"],
    "Minnesota": ["lake country", "northern wilderness", "river valley", "prairie land"],
    "Mississippi": ["Delta region", "pine forests", "Gulf Coast", "hill country"],
    "Missouri": ["Ozark Mountains", "river valley", "rolling hills", "lake region"],
    "Montana": ["Big Sky Country", "Rocky Mountain", "wide-open plains", "Yellowstone region"],
    "Nebraska": ["Sandhills region", "prairie land", "river valley", "fertile plains"],
    "Nevada": ["high desert", "Sierra Nevada foothills", "valley land", "mountain region"],
    "New Hampshire": ["White Mountains", "lakes region", "historic countryside", "scenic valley"],
    "New Jersey": ["Pine Barrens", "countryside", "coastal area", "Delaware River Valley"],
    "New Mexico": ["high desert", "mountain valley", "mesa country", "historic region"],
    "New York": ["Adirondack Mountains", "Finger Lakes", "Catskill Mountains", "Hudson Valley"],
    "North Carolina": ["Blue Ridge Mountains", "Outer Banks region", "historic countryside", "coastal plains"],
    "North Dakota": ["prairie land", "Badlands region", "river valley", "plains"],
    "Ohio": ["rolling countryside", "lake region", "Appalachian foothills", "river valley"],
    "Oklahoma": ["plains country", "lake region", "prairie land", "Ozark foothills"],
    "Oregon": ["Pacific Northwest", "Cascade Mountains", "wine country", "high desert"],
    "Pennsylvania": ["Appalachian Mountains", "historic countryside", "river valley", "wooded hills"],
    "Rhode Island": ["coastal region", "bay area", "historic countryside", "wooded hills"],
    "South Carolina": ["coastal region", "historic district", "Blue Ridge foothills", "Low Country"],
    "South Dakota": ["Black Hills", "prairie land", "Badlands region", "Missouri River Valley"],
    "Tennessee": ["Smoky Mountains", "historic countryside", "river valley", "rolling hills"],
    "Texas": ["Hill Country", "coastal plains", "ranch land", "west Texas desert"],
    "Utah": ["mountain valley", "red rock country", "canyon lands", "high desert"],
    "Vermont": ["Green Mountains", "historic New England", "countryside", "valley region"],
    "Virginia": ["Blue Ridge Mountains", "historic countryside", "Shenandoah Valley", "coastal region"],
    "Washington": ["Cascade Mountains", "Pacific Northwest", "Puget Sound", "Columbia River Valley"],
    "West Virginia": ["Appalachian Mountains", "river valley", "historic countryside", "mountain highlands"],
    "Wisconsin": ["lake country", "north woods", "river valley", "rolling countryside"],
    "Wyoming": ["mountain valley", "high plains", "Yellowstone region", "Wind River Range"]
  };
  
  // Type-specific descriptions
  const typeDescriptions: Record<string, string[]> = {
    "residential": [
      "perfect for your dream home", 
      "ideal for a private residence", 
      "ready for your custom home designs", 
      "build your family estate"
    ],
    "commercial": [
      "prime location for business development", 
      "excellent investment opportunity", 
      "strategically located commercial tract", 
      "zoned for business use"
    ],
    "recreational": [
      "outdoor enthusiast's paradise", 
      "perfect for recreational activities", 
      "enjoy hunting, fishing, and hiking", 
      "nature lover's retreat"
    ],
    "agricultural": [
      "fertile land for farming", 
      "established agricultural property", 
      "productive agricultural land", 
      "ideal for sustainable farming"
    ],
    "conservation": [
      "pristine natural habitat", 
      "protect this ecological treasure", 
      "conservation opportunity", 
      "preserve this natural ecosystem"
    ]
  };
  
  const location = getRandomElement(stateDescriptions[state] || ["beautiful region"]);
  const typeDesc = getRandomElement(typeDescriptions[propertyType] || ["remarkable property"]);
  
  // Format price with commas
  const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  let amenitiesText = "";
  if (selectedAmenities.length > 0) {
    amenitiesText = `\n\nFeatures include: ${selectedAmenities.join(", ")}.`;
  }
  
  return `Experience this ${acreage}-acre ${propertyType} property in the ${location} of ${state}. ` +
    `This ${terrain} land with ${vegetation} is ${typeDesc}. ` +
    `At $${formattedPrice}, this represents an excellent opportunity to acquire land in one of ${state}'s most desirable areas.` +
    amenitiesText +
    `\n\nContact TerraNova Vision today to schedule a viewing of this exceptional property.`;
}

// Generate demo properties for the application
import { createPoint, createPolygon } from './postgis-utils';

export function generateDemoProperties(): InsertLandProperty[] {
  const properties: InsertLandProperty[] = [];
  let propertyId = 1;
  
  // Generate 5 properties for each state
  for (const state of states) {
    for (let i = 0; i < 5; i++) {
      // Randomly select property type
      const propertyType = getRandomElement(propertyTypes);
      
      // Generate acreage based on property type
      let acreage: number;
      switch (propertyType) {
        case "residential":
          acreage = getRandomNumber(1, 20);
          break;
        case "commercial":
          acreage = getRandomNumber(2, 50);
          break;
        case "recreational":
          acreage = getRandomNumber(10, 200);
          break;
        case "agricultural":
          acreage = getRandomNumber(40, 500);
          break;
        case "conservation":
          acreage = getRandomNumber(100, 1000);
          break;
        default:
          acreage = getRandomNumber(5, 100);
      }
      
      // Generate price based on property type and acreage
      let pricePerAcre: number;
      switch (propertyType) {
        case "residential":
          pricePerAcre = getRandomNumber(50000, 150000);
          break;
        case "commercial":
          pricePerAcre = getRandomNumber(100000, 300000);
          break;
        case "recreational":
          pricePerAcre = getRandomNumber(5000, 30000);
          break;
        case "agricultural":
          pricePerAcre = getRandomNumber(2000, 10000);
          break;
        case "conservation":
          pricePerAcre = getRandomNumber(1000, 5000);
          break;
        default:
          pricePerAcre = getRandomNumber(5000, 50000);
      }
      
      // Calculate total price (with some randomization)
      const basePrice = acreage * pricePerAcre;
      const variation = basePrice * (Math.random() * 0.4 - 0.2); // +/- 20% variation
      const price = Math.round((basePrice + variation) / 1000) * 1000; // Round to nearest thousand
      
      // Select terrain and vegetation
      const terrain = getRandomElement(terrainTypes);
      const vegetation = getRandomElement(vegetationTypes);
      
      // Select random amenities (between 3 and 8)
      const selectedAmenities = getRandomElements(amenities, getRandomNumber(3, 8));
      
      // Generate location coordinates within the state
      const latitude = getRandomLatitude(state);
      const longitude = getRandomLongitude(state);
      
      // Generate title and description
      const title = generatePropertyTitle(state, propertyType, acreage, terrain);
      const description = generatePropertyDescription(
        state, propertyType, acreage, terrain, vegetation, selectedAmenities, price
      );
      
      // Get images for the property
      const images = getPropertyImages(state, propertyType, propertyId);
      
      // Generate a property boundary - simulate a roughly rectangular property
      // based on the central coordinate and acreage
      // Approximately convert acreage to coordinate degrees
      const acreToDegreeFactor = 0.0001; // This is a rough approximation
      const halfSideLength = Math.sqrt(acreage * acreToDegreeFactor / 2);
      
      // Create four corners of the property, slight randomization to make it look natural
      const cornerRandomizationFactor = halfSideLength * 0.2; // 20% randomization
      
      const nwCorner: [number, number] = [
        longitude - halfSideLength + (Math.random() * cornerRandomizationFactor - cornerRandomizationFactor/2),
        latitude + halfSideLength + (Math.random() * cornerRandomizationFactor - cornerRandomizationFactor/2)
      ];
      
      const neCorner: [number, number] = [
        longitude + halfSideLength + (Math.random() * cornerRandomizationFactor - cornerRandomizationFactor/2),
        latitude + halfSideLength + (Math.random() * cornerRandomizationFactor - cornerRandomizationFactor/2)
      ];
      
      const seCorner: [number, number] = [
        longitude + halfSideLength + (Math.random() * cornerRandomizationFactor - cornerRandomizationFactor/2),
        latitude - halfSideLength + (Math.random() * cornerRandomizationFactor - cornerRandomizationFactor/2)
      ];
      
      const swCorner: [number, number] = [
        longitude - halfSideLength + (Math.random() * cornerRandomizationFactor - cornerRandomizationFactor/2), 
        latitude - halfSideLength + (Math.random() * cornerRandomizationFactor - cornerRandomizationFactor/2)
      ];
      
      // The polygon boundary for the property
      const propertyBoundary = [nwCorner, neCorner, seCorner, swCorner, nwCorner];
      
      // Generate a WKT representation of the boundary
      const wktPoints = propertyBoundary.map(([lon, lat]) => `${lon} ${lat}`).join(', ');
      const boundaryWkt = `POLYGON((${wktPoints}))`;
      
      // Create the property object
      const property: InsertLandProperty = {
        title,
        description,
        price: price.toString(),
        acreage: acreage.toString(),
        location: `${state}, USA`,
        state, // Add the state field explicitly
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        // Add PostGIS data
        coordinates: { x: longitude, y: latitude },
        boundary: `SRID=4326;${boundaryWkt}`,
        propertyType: propertyType as any,
        zoning: propertyType === "commercial" ? "Commercial" : 
                propertyType === "residential" ? "Residential" : "Rural",
        terrainType: terrain,
        vegetation,
        waterResources: selectedAmenities.includes("Creek/Stream") ? "Creek/Stream" :
                        selectedAmenities.includes("Pond/Lake") ? "Pond/Lake" :
                        selectedAmenities.includes("River Frontage") ? "River" : "None",
        roadAccess: selectedAmenities.includes("Road Access") ? "Yes" : "No",
        utilities: [
          ...selectedAmenities.filter(a => 
            ["Electricity", "Well Water", "Municipal Water", "Septic System", "Natural Gas", "Internet Access"]
            .includes(a)
          )
        ],
        amenities: selectedAmenities,
        images,
        isWaterfront: selectedAmenities.includes("Creek/Stream") || 
                      selectedAmenities.includes("Pond/Lake") || 
                      selectedAmenities.includes("River Frontage"),
        isMountainView: selectedAmenities.includes("Mountain Views"),
        featured: Math.random() < 0.2 // Make 20% of properties featured
      };
      
      properties.push(property);
      propertyId++;
    }
  }
  
  return properties;
}