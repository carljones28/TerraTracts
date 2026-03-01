import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MapNavigationTabsProps {
  onLocationSelected: (location: {
    name: string;
    type: 'state' | 'region' | 'city';
    coordinates?: [number, number];
    zoom?: number;
  }) => void;
}

// Lists of states, regions, and cities based on LandSearch design
const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida',
  'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana',
  'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin',
  'Wyoming'
];

const REGIONS = [
  'Central Florida', 'Upstate New York', 'Texas Blacklands', 'East Tennessee',
  'Southern California', 'North Georgia', 'Missouri Ozarks', 'North Texas', 
  'Eastern Pennsylvania', 'North Florida', 'Colorado Mountains', 'Northern Arkansas',
  'Central Alabama', 'North Carolina Piedmont', 'Texas Hill Country', 'Central California',
  'East Texas', 'South Georgia', 'Northern Ohio', 'Texas Gulf Coast',
  'South Florida', 'Northern Arizona', 'West Texas', 'Middle Tennessee', 'Western Oregon'
];

const CITIES = [
  'San Antonio, TX', 'Charlotte, NC', 'Knoxville, TN', 'Tucson, AZ',
  'Lexington, KY', 'Houston, TX', 'Atlanta, GA', 'Las Vegas, NV',
  'Chattanooga, TN', 'Fort Worth, TX', 'Orlando, FL', 'Colorado Springs, CO',
  'Huntsville, AL', 'Asheville, NC', 'Tampa, FL', 'Austin, TX',
  'Springfield, MO', 'Oklahoma City, OK', 'Rochester, NY', 'Louisville, KY',
  'Cincinnati, OH', 'Omaha, NE', 'Fort Wayne, IN', 'Dallas, TX',
  'Kansas City, MO', 'Hot Springs, AR', 'Richmond, VA', 'Raleigh, NC',
  'Indianapolis, IN'
];

// Approximate coordinates data for states (center points)
const STATE_COORDINATES: Record<string, { coordinates: [number, number], zoom: number }> = {
  'Alabama': { coordinates: [-86.7923, 32.8067], zoom: 7 },
  'Alaska': { coordinates: [-152.4044, 63.3883], zoom: 4 },
  'Arizona': { coordinates: [-111.6503, 34.2744], zoom: 6 },
  'Arkansas': { coordinates: [-92.4426, 34.8999], zoom: 7 },
  'California': { coordinates: [-119.4179, 37.1841], zoom: 5 },
  'Colorado': { coordinates: [-105.5478, 38.9972], zoom: 6 },
  'Connecticut': { coordinates: [-72.7622, 41.6219], zoom: 8 },
  'Delaware': { coordinates: [-75.5148, 39.1454], zoom: 8 },
  'District of Columbia': { coordinates: [-77.0147, 38.9072], zoom: 10 },
  'Florida': { coordinates: [-81.5158, 27.6648], zoom: 6 },
  'Georgia': { coordinates: [-83.4429, 32.6415], zoom: 7 },
  'Hawaii': { coordinates: [-157.5067, 20.2899], zoom: 7 },
  'Idaho': { coordinates: [-114.3487, 43.6447], zoom: 6 },
  'Illinois': { coordinates: [-89.1965, 40.0417], zoom: 6 },
  'Indiana': { coordinates: [-86.1349, 39.8942], zoom: 7 },
  'Iowa': { coordinates: [-93.5000, 42.0751], zoom: 7 },
  'Kansas': { coordinates: [-98.3804, 38.4937], zoom: 7 },
  'Kentucky': { coordinates: [-85.3021, 37.5347], zoom: 7 },
  'Louisiana': { coordinates: [-92.4450, 31.1695], zoom: 7 },
  'Maine': { coordinates: [-69.2428, 45.3695], zoom: 7 },
  'Maryland': { coordinates: [-76.6413, 39.0458], zoom: 7 },
  'Massachusetts': { coordinates: [-71.5818, 42.2373], zoom: 8 },
  'Michigan': { coordinates: [-85.4102, 44.3148], zoom: 6 },
  'Minnesota': { coordinates: [-94.6859, 46.2807], zoom: 6 },
  'Mississippi': { coordinates: [-89.6679, 32.7364], zoom: 7 },
  'Missouri': { coordinates: [-92.5032, 38.3566], zoom: 7 },
  'Montana': { coordinates: [-109.6333, 46.8797], zoom: 6 },
  'Nebraska': { coordinates: [-99.7952, 41.4925], zoom: 7 },
  'Nevada': { coordinates: [-116.6515, 39.3289], zoom: 6 },
  'New Hampshire': { coordinates: [-71.5724, 43.6805], zoom: 7 },
  'New Jersey': { coordinates: [-74.4054, 40.0583], zoom: 7 },
  'New Mexico': { coordinates: [-106.1084, 34.4071], zoom: 6 },
  'New York': { coordinates: [-75.4653, 42.9538], zoom: 6 },
  'North Carolina': { coordinates: [-79.0193, 35.5557], zoom: 7 },
  'North Dakota': { coordinates: [-100.4659, 47.4501], zoom: 7 },
  'Ohio': { coordinates: [-82.7937, 40.2862], zoom: 7 },
  'Oklahoma': { coordinates: [-97.5170, 35.5889], zoom: 7 },
  'Oregon': { coordinates: [-120.5583, 43.9336], zoom: 6 },
  'Pennsylvania': { coordinates: [-77.7996, 40.8781], zoom: 7 },
  'Rhode Island': { coordinates: [-71.5562, 41.6762], zoom: 9 },
  'South Carolina': { coordinates: [-80.9066, 33.8361], zoom: 7 },
  'South Dakota': { coordinates: [-99.4380, 44.3682], zoom: 7 },
  'Tennessee': { coordinates: [-86.3505, 35.8605], zoom: 7 },
  'Texas': { coordinates: [-99.3312, 31.4757], zoom: 5 },
  'Utah': { coordinates: [-111.6780, 39.3055], zoom: 6 },
  'Vermont': { coordinates: [-72.6658, 44.0687], zoom: 7 },
  'Virginia': { coordinates: [-78.6569, 37.5215], zoom: 7 },
  'Washington': { coordinates: [-120.4472, 47.3826], zoom: 6 },
  'West Virginia': { coordinates: [-80.9696, 38.6409], zoom: 7 },
  'Wisconsin': { coordinates: [-89.7159, 44.6243], zoom: 6 },
  'Wyoming': { coordinates: [-107.5512, 42.9957], zoom: 6 }
};

// Approximate coordinates for regions
const REGION_COORDINATES: Record<string, { coordinates: [number, number], zoom: number }> = {
  'Central Florida': { coordinates: [-81.5158, 28.3232], zoom: 7 },
  'Upstate New York': { coordinates: [-75.8098, 43.0481], zoom: 7 },
  'Texas Blacklands': { coordinates: [-96.6925, 31.8160], zoom: 7 },
  'East Tennessee': { coordinates: [-83.9207, 35.8605], zoom: 7 },
  'Southern California': { coordinates: [-118.1552, 33.7866], zoom: 7 },
  'North Georgia': { coordinates: [-83.8888, 34.5686], zoom: 7 },
  'Missouri Ozarks': { coordinates: [-92.5571, 37.1153], zoom: 7 },
  'North Texas': { coordinates: [-97.1331, 33.1251], zoom: 7 },
  'Eastern Pennsylvania': { coordinates: [-75.7600, 40.9946], zoom: 7 },
  'North Florida': { coordinates: [-82.4104, 30.4551], zoom: 7 },
  'Colorado Mountains': { coordinates: [-106.1111, 39.5501], zoom: 7 },
  'Northern Arkansas': { coordinates: [-92.4426, 36.3089], zoom: 7 },
  'Central Alabama': { coordinates: [-86.8073, 32.7794], zoom: 7 },
  'North Carolina Piedmont': { coordinates: [-80.2659, 35.7847], zoom: 7 },
  'Texas Hill Country': { coordinates: [-98.8047, 30.0686], zoom: 7 },
  'Central California': { coordinates: [-119.4696, 36.7783], zoom: 7 },
  'East Texas': { coordinates: [-94.7291, 32.3513], zoom: 7 },
  'South Georgia': { coordinates: [-83.2078, 31.2304], zoom: 7 },
  'Northern Ohio': { coordinates: [-81.6944, 41.4993], zoom: 7 },
  'Texas Gulf Coast': { coordinates: [-95.5555, 28.4212], zoom: 7 },
  'South Florida': { coordinates: [-80.4984, 26.1224], zoom: 7 },
  'Northern Arizona': { coordinates: [-111.6513, 35.1983], zoom: 7 },
  'West Texas': { coordinates: [-103.5018, 31.8457], zoom: 7 },
  'Middle Tennessee': { coordinates: [-86.7816, 35.8283], zoom: 7 },
  'Western Oregon': { coordinates: [-123.0878, 44.0521], zoom: 7 }
};

// Approximate coordinates for cities
const CITY_COORDINATES: Record<string, { coordinates: [number, number], zoom: number }> = {
  'San Antonio, TX': { coordinates: [-98.4936, 29.4252], zoom: 10 },
  'Charlotte, NC': { coordinates: [-80.8431, 35.2271], zoom: 10 },
  'Knoxville, TN': { coordinates: [-83.9207, 35.9606], zoom: 10 },
  'Tucson, AZ': { coordinates: [-110.9265, 32.2226], zoom: 10 },
  'Lexington, KY': { coordinates: [-84.5037, 38.0406], zoom: 10 },
  'Houston, TX': { coordinates: [-95.3698, 29.7604], zoom: 9 },
  'Atlanta, GA': { coordinates: [-84.3880, 33.7490], zoom: 10 },
  'Las Vegas, NV': { coordinates: [-115.1398, 36.1699], zoom: 10 },
  'Chattanooga, TN': { coordinates: [-85.3097, 35.0456], zoom: 10 },
  'Fort Worth, TX': { coordinates: [-97.3208, 32.7555], zoom: 10 },
  'Orlando, FL': { coordinates: [-81.3789, 28.5383], zoom: 10 },
  'Colorado Springs, CO': { coordinates: [-104.8214, 38.8339], zoom: 10 },
  'Huntsville, AL': { coordinates: [-86.5861, 34.7304], zoom: 10 },
  'Asheville, NC': { coordinates: [-82.5515, 35.5951], zoom: 10 },
  'Tampa, FL': { coordinates: [-82.4572, 27.9506], zoom: 10 },
  'Austin, TX': { coordinates: [-97.7431, 30.2672], zoom: 10 },
  'Springfield, MO': { coordinates: [-93.2982, 37.2090], zoom: 10 },
  'Oklahoma City, OK': { coordinates: [-97.5164, 35.4676], zoom: 10 },
  'Rochester, NY': { coordinates: [-77.6088, 43.1566], zoom: 10 },
  'Louisville, KY': { coordinates: [-85.7585, 38.2527], zoom: 10 },
  'Cincinnati, OH': { coordinates: [-84.5120, 39.1031], zoom: 10 },
  'Omaha, NE': { coordinates: [-95.9345, 41.2565], zoom: 10 },
  'Fort Wayne, IN': { coordinates: [-85.1393, 41.0793], zoom: 10 },
  'Dallas, TX': { coordinates: [-96.7970, 32.7767], zoom: 9 },
  'Kansas City, MO': { coordinates: [-94.5786, 39.0997], zoom: 10 },
  'Hot Springs, AR': { coordinates: [-93.0552, 34.5037], zoom: 10 },
  'Richmond, VA': { coordinates: [-77.4360, 37.5407], zoom: 10 },
  'Raleigh, NC': { coordinates: [-78.6382, 35.7796], zoom: 10 },
  'Indianapolis, IN': { coordinates: [-86.1581, 39.7684], zoom: 10 }
};

const MapNavigationTabs: React.FC<MapNavigationTabsProps> = ({ onLocationSelected }) => {
  const [activeTab, setActiveTab] = useState<'states' | 'regions' | 'cities'>('states');

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'states' | 'regions' | 'cities');
  };

  const handleStateClick = (state: string) => {
    const locationData = STATE_COORDINATES[state] || { coordinates: [-98.5795, 39.8283], zoom: 5 };
    onLocationSelected({
      name: state,
      type: 'state',
      coordinates: locationData.coordinates,
      zoom: locationData.zoom
    });
  };

  const handleRegionClick = (region: string) => {
    const locationData = REGION_COORDINATES[region] || { coordinates: [-98.5795, 39.8283], zoom: 7 };
    onLocationSelected({
      name: region,
      type: 'region',
      coordinates: locationData.coordinates,
      zoom: locationData.zoom
    });
  };

  const handleCityClick = (city: string) => {
    const locationData = CITY_COORDINATES[city] || { coordinates: [-98.5795, 39.8283], zoom: 10 };
    onLocationSelected({
      name: city,
      type: 'city',
      coordinates: locationData.coordinates,
      zoom: locationData.zoom
    });
  };

  return (
    <div className="w-full bg-slate-50 border-t border-b border-slate-100 py-6 mb-6">
      <div className="container mx-auto px-4">
        <Tabs
          defaultValue="states"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="flex justify-center mb-6">
            <TabsList className="bg-slate-200/50">
              <TabsTrigger 
                value="states"
                className="px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                States
              </TabsTrigger>
              <TabsTrigger 
                value="regions"
                className="px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Regions
              </TabsTrigger>
              <TabsTrigger 
                value="cities"
                className="px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Cities
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="states" className="mt-2">
            <div className="flex flex-wrap justify-center gap-y-2 gap-x-4">
              {STATES.map((state) => (
                <button
                  key={state}
                  onClick={() => handleStateClick(state)}
                  className="text-slate-700 hover:text-primary transition-colors"
                >
                  {state} land for sale
                </button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="regions" className="mt-2">
            <div className="flex flex-wrap justify-center gap-y-2 gap-x-4">
              {REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => handleRegionClick(region)}
                  className="text-slate-700 hover:text-primary transition-colors"
                >
                  {region}
                </button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="cities" className="mt-2">
            <div className="flex flex-wrap justify-center gap-y-2 gap-x-4">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityClick(city)}
                  className="text-slate-700 hover:text-primary transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MapNavigationTabs;