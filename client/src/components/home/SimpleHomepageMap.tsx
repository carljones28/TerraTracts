import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { MapPin, Search, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchPropertiesNearLocation } from '@/lib/mapUtils';

interface HomepageMapProps {
  onPropertySelect: (propertyId: number) => void;
}

interface Property {
  id: number;
  title: string;
  price: number | string;
  acreage: number | string;
  state: string;
  latitude: number | string;
  longitude: number | string;
  propertyType: string;
}

interface HomepageMapHandles {
  updateLocation: (location: { lat: number; lng: number; zoom: number }) => void;
}

// All 50 states with coordinates
const ALL_STATES: Array<{
  name: string;
  slug: string;
  label: string;
  coordinates: [number, number]; // Properly type coordinates as a tuple
  zoom: number;
}> = [
  { name: 'Alabama', slug: 'alabama', label: 'Alabama land for sale', coordinates: [-86.7923, 32.8067], zoom: 7 },
  { name: 'Alaska', slug: 'alaska', label: 'Alaska land for sale', coordinates: [-152.4044, 63.3883], zoom: 4 },
  { name: 'Arizona', slug: 'arizona', label: 'Arizona land for sale', coordinates: [-111.6503, 34.2744], zoom: 6 },
  { name: 'Arkansas', slug: 'arkansas', label: 'Arkansas land for sale', coordinates: [-92.4426, 34.8999], zoom: 7 },
  { name: 'California', slug: 'california', label: 'California land for sale', coordinates: [-119.4179, 37.1841], zoom: 5 },
  { name: 'Colorado', slug: 'colorado', label: 'Colorado land for sale', coordinates: [-105.5478, 38.9972], zoom: 6 },
  { name: 'Connecticut', slug: 'connecticut', label: 'Connecticut land for sale', coordinates: [-72.7622, 41.6219], zoom: 8 },
  { name: 'Delaware', slug: 'delaware', label: 'Delaware land for sale', coordinates: [-75.5148, 39.1454], zoom: 8 },
  { name: 'Florida', slug: 'florida', label: 'Florida land for sale', coordinates: [-81.5158, 27.6648], zoom: 6 },
  { name: 'Georgia', slug: 'georgia', label: 'Georgia land for sale', coordinates: [-83.4429, 32.6415], zoom: 7 },
  { name: 'Hawaii', slug: 'hawaii', label: 'Hawaii land for sale', coordinates: [-157.5067, 20.2899], zoom: 7 },
  { name: 'Idaho', slug: 'idaho', label: 'Idaho land for sale', coordinates: [-114.3487, 43.6447], zoom: 6 },
  { name: 'Illinois', slug: 'illinois', label: 'Illinois land for sale', coordinates: [-89.1965, 40.0417], zoom: 6 },
  { name: 'Indiana', slug: 'indiana', label: 'Indiana land for sale', coordinates: [-86.1349, 39.8942], zoom: 7 },
  { name: 'Iowa', slug: 'iowa', label: 'Iowa land for sale', coordinates: [-93.5000, 42.0751], zoom: 7 },
  { name: 'Kansas', slug: 'kansas', label: 'Kansas land for sale', coordinates: [-98.3804, 38.4937], zoom: 7 },
  { name: 'Kentucky', slug: 'kentucky', label: 'Kentucky land for sale', coordinates: [-85.3021, 37.5347], zoom: 7 },
  { name: 'Louisiana', slug: 'louisiana', label: 'Louisiana land for sale', coordinates: [-92.4450, 31.1695], zoom: 7 },
  { name: 'Maine', slug: 'maine', label: 'Maine land for sale', coordinates: [-69.2428, 45.3695], zoom: 7 },
  { name: 'Maryland', slug: 'maryland', label: 'Maryland land for sale', coordinates: [-76.6413, 39.0458], zoom: 7 },
  { name: 'Massachusetts', slug: 'massachusetts', label: 'Massachusetts land for sale', coordinates: [-71.5818, 42.2373], zoom: 8 },
  { name: 'Michigan', slug: 'michigan', label: 'Michigan land for sale', coordinates: [-85.4102, 44.3148], zoom: 6 },
  { name: 'Minnesota', slug: 'minnesota', label: 'Minnesota land for sale', coordinates: [-94.6859, 46.2807], zoom: 6 },
  { name: 'Mississippi', slug: 'mississippi', label: 'Mississippi land for sale', coordinates: [-89.6679, 32.7364], zoom: 7 },
  { name: 'Missouri', slug: 'missouri', label: 'Missouri land for sale', coordinates: [-92.5032, 38.3566], zoom: 7 },
  { name: 'Montana', slug: 'montana', label: 'Montana land for sale', coordinates: [-109.6333, 46.8797], zoom: 6 },
  { name: 'Nebraska', slug: 'nebraska', label: 'Nebraska land for sale', coordinates: [-99.7952, 41.4925], zoom: 7 },
  { name: 'Nevada', slug: 'nevada', label: 'Nevada land for sale', coordinates: [-116.6515, 39.3289], zoom: 6 },
  { name: 'New Hampshire', slug: 'new-hampshire', label: 'New Hampshire land for sale', coordinates: [-71.5724, 43.6805], zoom: 7 },
  { name: 'New Jersey', slug: 'new-jersey', label: 'New Jersey land for sale', coordinates: [-74.4054, 40.0583], zoom: 7 },
  { name: 'New Mexico', slug: 'new-mexico', label: 'New Mexico land for sale', coordinates: [-106.1084, 34.4071], zoom: 6 },
  { name: 'New York', slug: 'new-york', label: 'New York land for sale', coordinates: [-75.4653, 42.9538], zoom: 6 },
  { name: 'North Carolina', slug: 'north-carolina', label: 'North Carolina land for sale', coordinates: [-79.0193, 35.5557], zoom: 7 },
  { name: 'North Dakota', slug: 'north-dakota', label: 'North Dakota land for sale', coordinates: [-100.4659, 47.4501], zoom: 7 },
  { name: 'Ohio', slug: 'ohio', label: 'Ohio land for sale', coordinates: [-82.7937, 40.2862], zoom: 7 },
  { name: 'Oklahoma', slug: 'oklahoma', label: 'Oklahoma land for sale', coordinates: [-97.5170, 35.5889], zoom: 7 },
  { name: 'Oregon', slug: 'oregon', label: 'Oregon land for sale', coordinates: [-120.5583, 43.9336], zoom: 6 },
  { name: 'Pennsylvania', slug: 'pennsylvania', label: 'Pennsylvania land for sale', coordinates: [-77.7996, 40.8781], zoom: 7 },
  { name: 'Rhode Island', slug: 'rhode-island', label: 'Rhode Island land for sale', coordinates: [-71.5562, 41.6762], zoom: 9 },
  { name: 'South Carolina', slug: 'south-carolina', label: 'South Carolina land for sale', coordinates: [-80.9066, 33.8361], zoom: 7 },
  { name: 'South Dakota', slug: 'south-dakota', label: 'South Dakota land for sale', coordinates: [-99.4380, 44.3682], zoom: 7 },
  { name: 'Tennessee', slug: 'tennessee', label: 'Tennessee land for sale', coordinates: [-86.3505, 35.8605], zoom: 7 },
  { name: 'Texas', slug: 'texas', label: 'Texas land for sale', coordinates: [-99.3312, 31.4757], zoom: 5 },
  { name: 'Utah', slug: 'utah', label: 'Utah land for sale', coordinates: [-111.6780, 39.3055], zoom: 6 },
  { name: 'Vermont', slug: 'vermont', label: 'Vermont land for sale', coordinates: [-72.6658, 44.0687], zoom: 7 },
  { name: 'Virginia', slug: 'virginia', label: 'Virginia land for sale', coordinates: [-78.6569, 37.5215], zoom: 7 },
  { name: 'Washington', slug: 'washington', label: 'Washington land for sale', coordinates: [-120.4472, 47.3826], zoom: 6 },
  { name: 'West Virginia', slug: 'west-virginia', label: 'West Virginia land for sale', coordinates: [-80.9696, 38.6409], zoom: 7 },
  { name: 'Wisconsin', slug: 'wisconsin', label: 'Wisconsin land for sale', coordinates: [-89.7159, 44.6243], zoom: 6 },
  { name: 'Wyoming', slug: 'wyoming', label: 'Wyoming land for sale', coordinates: [-107.5512, 42.9957], zoom: 6 }
];

// Regions from LandSearch.com
const ALL_REGIONS: Array<{
  name: string;
  coordinates: [number, number]; // Properly type coordinates as a tuple
  zoom: number;
}> = [
  { name: 'Central Florida', coordinates: [-81.5158, 28.3232], zoom: 7 },
  { name: 'Upstate New York', coordinates: [-75.8098, 43.0481], zoom: 7 },
  { name: 'Texas Blacklands', coordinates: [-96.6925, 31.8160], zoom: 7 },
  { name: 'East Tennessee', coordinates: [-83.9207, 35.8605], zoom: 7 },
  { name: 'Southern California', coordinates: [-118.1552, 33.7866], zoom: 7 },
  { name: 'North Georgia', coordinates: [-83.8888, 34.5686], zoom: 7 },
  { name: 'Missouri Ozarks', coordinates: [-92.5571, 37.1153], zoom: 7 },
  { name: 'North Texas', coordinates: [-97.1331, 33.1251], zoom: 7 },
  { name: 'Eastern Pennsylvania', coordinates: [-75.7600, 40.9946], zoom: 7 },
  { name: 'North Florida', coordinates: [-82.4104, 30.4551], zoom: 7 },
  { name: 'Colorado Mountains', coordinates: [-106.1111, 39.5501], zoom: 7 },
  { name: 'Northern Arkansas', coordinates: [-92.4426, 36.3089], zoom: 7 },
  { name: 'Central Alabama', coordinates: [-86.8073, 32.7794], zoom: 7 },
  { name: 'North Carolina Piedmont', coordinates: [-80.2659, 35.7847], zoom: 7 },
  { name: 'Texas Hill Country', coordinates: [-98.8047, 30.0686], zoom: 7 },
  { name: 'Central California', coordinates: [-119.4696, 36.7783], zoom: 7 },
  { name: 'East Texas', coordinates: [-94.7291, 32.3513], zoom: 7 },
  { name: 'South Georgia', coordinates: [-83.2078, 31.2304], zoom: 7 },
  { name: 'Northern Ohio', coordinates: [-81.6944, 41.4993], zoom: 7 },
  { name: 'Texas Gulf Coast', coordinates: [-95.5555, 28.4212], zoom: 7 },
  { name: 'South Florida', coordinates: [-80.4984, 26.1224], zoom: 7 },
  { name: 'Northern Arizona', coordinates: [-111.6513, 35.1983], zoom: 7 },
  { name: 'West Texas', coordinates: [-103.5018, 31.8457], zoom: 7 },
  { name: 'Middle Tennessee', coordinates: [-86.7816, 35.8283], zoom: 7 },
  { name: 'Western Oregon', coordinates: [-123.0878, 44.0521], zoom: 7 }
];

// Counties from LandSearch.com
const POPULAR_COUNTIES: Array<{
  name: string;
  coordinates: [number, number]; // Properly type coordinates as a tuple
  zoom: number;
}> = [
  { name: 'Maricopa County, AZ', coordinates: [-112.0740, 33.4484], zoom: 9 },
  { name: 'Harris County, TX', coordinates: [-95.3698, 29.7752], zoom: 9 },
  { name: 'Los Angeles County, CA', coordinates: [-118.2437, 34.0522], zoom: 8 },
  { name: 'Cook County, IL', coordinates: [-87.6298, 41.8781], zoom: 9 },
  { name: 'Bexar County, TX', coordinates: [-98.4936, 29.4241], zoom: 9 },
  { name: 'Orange County, CA', coordinates: [-117.8311, 33.7175], zoom: 9 },
  { name: 'San Diego County, CA', coordinates: [-117.1611, 32.7157], zoom: 9 },
  { name: 'Riverside County, CA', coordinates: [-116.0593, 33.9533], zoom: 8 },
  { name: 'King County, WA', coordinates: [-122.3321, 47.6062], zoom: 9 },
  { name: 'Clark County, NV', coordinates: [-115.1391, 36.1699], zoom: 9 },
  { name: 'Tarrant County, TX', coordinates: [-97.3208, 32.7555], zoom: 9 },
  { name: 'Broward County, FL', coordinates: [-80.2712, 26.1224], zoom: 9 },
  { name: 'Santa Clara County, CA', coordinates: [-121.9552, 37.3541], zoom: 9 },
  { name: 'Palm Beach County, FL', coordinates: [-80.0533, 26.7056], zoom: 9 },
  { name: 'Alameda County, CA', coordinates: [-122.2416, 37.7749], zoom: 9 },
  { name: 'Sacramento County, CA', coordinates: [-121.4944, 38.5816], zoom: 9 },
  { name: 'Shelby County, TN', coordinates: [-89.8965, 35.1495], zoom: 9 },
  { name: 'Hillsborough County, FL', coordinates: [-82.4572, 27.9506], zoom: 9 },
  { name: 'Orange County, FL', coordinates: [-81.3789, 28.5383], zoom: 9 },
  { name: 'Franklin County, OH', coordinates: [-83.0007, 39.9612], zoom: 9 },
  { name: 'Hennepin County, MN', coordinates: [-93.2650, 44.9778], zoom: 9 },
  { name: 'Travis County, TX', coordinates: [-97.7431, 30.2672], zoom: 9 },
  { name: 'Fulton County, GA', coordinates: [-84.3963, 33.8034], zoom: 9 },
  { name: 'Pima County, AZ', coordinates: [-110.9265, 32.2226], zoom: 9 },
  { name: 'Collin County, TX', coordinates: [-96.6925, 33.1795], zoom: 9 },
  { name: 'Wake County, NC', coordinates: [-78.6382, 35.7796], zoom: 9 },
  { name: 'Gwinnett County, GA', coordinates: [-84.0721, 33.9604], zoom: 9 },
  { name: 'Cobb County, GA', coordinates: [-84.5521, 33.9402], zoom: 9 },
  { name: 'Milwaukee County, WI', coordinates: [-87.9677, 43.0389], zoom: 9 },
  { name: 'El Paso County, CO', coordinates: [-104.7235, 38.8339], zoom: 9 }
];

// Simple component without forward ref for now
const SimpleHomepageMap: React.FC<HomepageMapProps> = ({ onPropertySelect }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [_, navigate] = useLocation();
  const [mapTab, setMapTab] = useState<'State' | 'Region' | 'County'>('State');
  const [showAllLocations, setShowAllLocations] = useState(false);
  
  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Get Mapbox API key from server
  const { data: config } = useQuery<{mapboxApiKey: string}>({
    queryKey: ['/api/config'],
  });
  
  // State for terrain toggle
  const [showTerrain, setShowTerrain] = useState(false);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !config?.mapboxApiKey) return;
    
    try {
      // Set the API key
      mapboxgl.accessToken = config.mapboxApiKey;
      
      // Create a new map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-95.7129, 37.0902], // Center of the US
        zoom: 3
      });
      
      // Log when map is loaded
      map.current.on('load', () => {
        console.log('Homepage map successfully loaded');
        addMarkers();
        
        // Add terrain controls
        const terrainButton = document.createElement('button');
        terrainButton.className = 'mapboxgl-ctrl-terrain mapboxgl-ctrl-group mapboxgl-ctrl';
        terrainButton.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:29px;height:29px;">3D</span>`;
        terrainButton.title = 'Toggle Terrain';
        terrainButton.style.position = 'absolute';
        terrainButton.style.right = '10px';
        terrainButton.style.top = '80px';
        terrainButton.style.padding = '0';
        terrainButton.style.cursor = 'pointer';
        terrainButton.style.backgroundColor = 'white';
        terrainButton.style.border = '1px solid rgba(0,0,0,0.1)';
        terrainButton.style.borderRadius = '4px';
        terrainButton.style.fontWeight = 'bold';
        terrainButton.style.fontSize = '12px';
        terrainButton.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1)';
        
        terrainButton.addEventListener('click', () => {
          setShowTerrain(!showTerrain);
        });
        
        mapContainer.current?.appendChild(terrainButton);
      });
    } catch (error) {
      console.error('Error initializing homepage map:', error);
    }
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [config]);
  
  // Add markers when properties change
  useEffect(() => {
    if (map.current && properties.length > 0) {
      // Check if map is loaded first
      if (map.current.loaded()) {
        addMarkers();
      } else {
        // If not loaded yet, wait for the load event
        map.current.once('load', () => {
          setTimeout(addMarkers, 300); // Add a slight delay for stability
        });
      }
    }
  }, [properties]);
  
  // Function to add markers to the map
  const addMarkers = () => {
    if (!map.current || !properties.length) return;
    
    try {
      // Remove existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      // Add new markers
      properties.forEach(property => {
        try {
          // Parse coordinates
          const lat = typeof property.latitude === 'string' 
            ? parseFloat(property.latitude) 
            : property.latitude;
            
          const lng = typeof property.longitude === 'string' 
            ? parseFloat(property.longitude) 
            : property.longitude;
          
          if (isNaN(lat) || isNaN(lng)) return;
          
          // Create marker element
          const el = document.createElement('div');
          el.className = 'property-marker';
          el.style.width = '10px';
          el.style.height = '10px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#8b5cf6';
          el.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.3)';
          
          // Create and add the marker
          const marker = new mapboxgl.Marker({element: el})
            .setLngLat([lng, lat])
            .addTo(map.current!);
            
          // Add click handler
          el.addEventListener('click', () => {
            onPropertySelect(property.id);
          });
          
          // Store the marker for later cleanup
          markers.current.push(marker);
        } catch (err) {
          console.error('Error adding homepage marker for property:', property.id, err);
        }
      });
    } catch (error) {
      console.error('Error adding homepage markers:', error);
    }
  };
  
  // Handle terrain toggle
  useEffect(() => {
    if (!map.current) return;
    
    // Need to check if the map is fully loaded
    if (!map.current.loaded()) {
      map.current.once('load', handleTerrainChange);
      return;
    }
    
    handleTerrainChange();
    
    function handleTerrainChange() {
      try {
        if (showTerrain) {
          console.log('Enabling homepage terrain');
          
          // Check if style is loaded
          if (!map.current?.isStyleLoaded()) {
            console.log('Homepage map style not loaded yet, waiting...');
            map.current?.once('style.load', handleTerrainChange);
            return;
          }
          
          // Set appropriate pitch and bearing for terrain to be visible
          map.current.easeTo({
            pitch: 60, // Tilt the map to show terrain
            bearing: 0,
            duration: 800 // Smooth duration for glitch-free transition
          });
          
          // Add terrain source if it doesn't exist
          if (!map.current?.getSource('mapbox-dem')) {
            console.log('Adding terrain source to homepage map');
            map.current?.addSource('mapbox-dem', {
              'type': 'raster-dem',
              'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
              'tileSize': 512,
              'maxzoom': 14
            });
          }
          
          // Add hillshading layer for better terrain visibility
          if (!map.current?.getLayer('hillshading')) {
            console.log("Adding hillshading layer for better terrain visibility");
            map.current?.addLayer({
              'id': 'hillshading',
              'type': 'hillshade',
              'source': 'mapbox-dem',
              'layout': {'visibility': 'visible'},
              'paint': {
                'hillshade-illumination-direction': 270,
                'hillshade-exaggeration': 1.5,
                'hillshade-shadow-color': 'rgba(0, 0, 0, 0.5)'
              }
            }, 'waterway-label');
          }
          
          // Add enhanced sky layer for better visual effect
          if (!map.current?.getLayer('sky')) {
            console.log('Adding enhanced sky layer to homepage map');
            map.current?.addLayer({
              'id': 'sky',
              'type': 'sky',
              'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [45, 45], // Set sun position for better lighting
                'sky-atmosphere-sun-intensity': 5, // More subtle sun intensity
                'sky-atmosphere-halo-color': 'rgba(255, 255, 255, 0.3)', // Subtle halo
                'sky-atmosphere-color': 'rgba(186, 210, 235, 1.0)' // Pleasing blue tone
              }
            });
          }
          
          // Set terrain with exaggeration
          console.log('Setting homepage terrain');
          map.current?.setTerrain({
            'source': 'mapbox-dem',
            'exaggeration': 1.5
          });
          
        } else {
          console.log('Disabling homepage terrain');
          
          // Reset pitch and bearing
          map.current.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 800 // Smooth duration for glitch-free transition
          });
          
          // Remove terrain
          map.current?.setTerrain(null);
          
          // Remove hillshading layer if it exists
          if (map.current?.getLayer('hillshading')) {
            map.current.removeLayer('hillshading');
          }
          
          // Remove sky layer
          if (map.current?.getLayer('sky')) {
            map.current.removeLayer('sky');
          }
        }
      } catch (error) {
        console.error('Error toggling homepage terrain:', error);
      }
    }
  }, [showTerrain]);

  // Make the map available to the global map state in mapUtils
  useEffect(() => {
    if (map.current) {
      // Use window to expose the map instance for updateMapLocation to access
      // This is a simple workaround to avoid using forwardRef
      (window as any).__homepageMap = map.current;
    }
    
    return () => {
      // Clean up reference when component unmounts
      (window as any).__homepageMap = null;
    };
  }, [map.current]);

  // Fly to location and then navigate to properties page with coordinates and zoom data
  const handleLocationClick = useCallback((location: { name: string, coordinates: [number, number], zoom: number }) => {
    if (!map.current) return;
    
    // Store location data for properties page immediately
    const locationData = {
      name: location.name,
      lat: location.coordinates[1], 
      lng: location.coordinates[0],
      zoom: location.zoom
    };
    
    // Store in sessionStorage
    sessionStorage.setItem('selectedMapLocation', JSON.stringify(locationData));
    
    // Store globally for immediate access
    (window as any).__pendingMapLocation = locationData;
    
    console.log('Homepage navigation - storing location:', locationData);
    
    // Navigate immediately without animation to avoid flashing
    const stateName = location.name;
    navigate(`/properties?state=${encodeURIComponent(stateName)}&lat=${location.coordinates[1]}&lng=${location.coordinates[0]}&zoom=${location.zoom}`);
  }, [navigate]);

  // Determine which locations to show based on the current tab
  const getCurrentTabLocations = () => {
    switch (mapTab) {
      case 'State':
        return showAllLocations ? ALL_STATES : ALL_STATES.slice(0, 12);
      case 'Region':
        return showAllLocations ? ALL_REGIONS : ALL_REGIONS.slice(0, 12);
      case 'County':
        return showAllLocations ? POPULAR_COUNTIES : POPULAR_COUNTIES.slice(0, 12);
      default:
        return [];
    }
  };

  // Get label text based on the current tab
  const getLocationLabel = (location: { name: string }) => {
    if (mapTab === 'State') {
      return `${location.name} land for sale`;
    } else {
      return location.name;
    }
  };

  const locations = getCurrentTabLocations();

  return (
    <section className="py-10 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Explore Properties on the Map</h2>
          <p className="text-slate-600">Interactive map visualization of all available properties</p>
        </div>
                
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative">
            {/* Map container with fixed aspect ratio */}
            <div className="rounded-lg overflow-hidden shadow-md aspect-[16/9] w-full bg-white">
              <div ref={mapContainer} className="w-full h-full"></div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="bg-white rounded-lg shadow-md p-6 h-full">
              {/* Tab navigation */}
              <div className="flex gap-2 mb-6">
                {['State', 'Region', 'County'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setMapTab(tab as any);
                      setShowAllLocations(false);
                    }}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                      ${mapTab === tab 
                        ? 'bg-primary text-white' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-4">Find Properties by {mapTab}</h3>
              
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={`Enter ${mapTab.toLowerCase()}, or zip code`}
                  className="w-full px-10 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Popular Locations</h4>
                
                <div className="grid grid-cols-2 gap-y-2 max-h-[350px] overflow-y-auto pr-2">
                  {locations.map((location) => (
                    <div 
                      key={location.name}
                      onClick={() => handleLocationClick(location)}
                      className="flex items-center gap-2 py-1 cursor-pointer group"
                    >
                      <MapPin className="h-4 w-4 text-primary/70 flex-shrink-0" />
                      <span className="text-sm text-slate-700 group-hover:text-primary group-hover:underline transition-colors">
                        {getLocationLabel(location)}
                      </span>
                    </div>
                  ))}
                </div>
                
                {!showAllLocations && (
                  <button 
                    onClick={() => setShowAllLocations(true)}
                    className="flex items-center gap-1 text-sm text-primary mt-3 hover:underline"
                  >
                    <span>More {mapTab}s</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <Button 
                onClick={() => navigate('/properties')}
                className="w-full flex items-center justify-center gap-2 py-5"
              >
                <span>View Full Map</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimpleHomepageMap;