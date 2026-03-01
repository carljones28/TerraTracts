import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { MapPin, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initMap, addPropertyMarkers } from '@/lib/mapUtils';

interface HomepageMapProps {
  onPropertySelect: (propertyId: number) => void;
}

interface Property {
  id: number;
  title: string;
  price: number;
  acreage: number;
  state: string;
  latitude: number | string;
  longitude: number | string;
  propertyType: string;
}

const HomepageMap = ({ onPropertySelect }: HomepageMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  
  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Regions for the quick filter
  const regions = [
    'All Regions',
    'Northeast',
    'Southeast',
    'Midwest',
    'Southwest',
    'West Coast',
    'Northwest'
  ];
  
  // Initialize map once container is available
  useEffect(() => {
    if (mapContainerRef.current && !mapInstance) {
      const initMapAsync = async () => {
        try {
          const map = await initMap(mapContainerRef.current!, onPropertySelect);
          setMapInstance(map);
          
          if (map && properties.length > 0) {
            addPropertyMarkers(map, properties, onPropertySelect);
          }
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      };
      
      initMapAsync();
    }
  }, [mapContainerRef, mapInstance, properties, onPropertySelect]);
  
  // Update markers when properties change
  useEffect(() => {
    if (mapInstance && properties.length > 0) {
      addPropertyMarkers(mapInstance, properties, onPropertySelect);
    }
  }, [mapInstance, properties, onPropertySelect]);

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Explore Properties on the Map</h2>
            <p className="text-slate-600">Interactive map visualization of all available properties</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`py-2 px-4 rounded-full text-sm font-medium transition-all
                  ${selectedRegion === region 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Map container with fixed aspect ratio */}
            <div className="rounded-lg overflow-hidden shadow-md aspect-[16/9] w-full bg-white">
              <div ref={mapContainerRef} className="w-full h-full"></div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="bg-white rounded-lg shadow-md p-6 h-full">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Find Properties by Location</h3>
              
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Enter city, state, or zip code" 
                  className="w-full px-10 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Popular Locations</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['Colorado', 'Montana', 'Oregon', 'Texas', 'Florida', 'New York'].map((location) => (
                    <div 
                      key={location}
                      className="flex items-center gap-2 py-2 px-3 rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm text-slate-700">{location}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Property Stats</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-md p-3">
                  <div className="text-2xl font-bold text-slate-800">{properties.length}</div>
                  <div className="text-sm text-slate-600">Total Properties</div>
                </div>
                <div className="bg-slate-50 rounded-md p-3">
                  <div className="text-2xl font-bold text-slate-800">50</div>
                  <div className="text-sm text-slate-600">States Covered</div>
                </div>
              </div>
              
              <Link href="/properties">
                <Button className="w-full flex items-center justify-center gap-2 py-6">
                  <span>View Full Map</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomepageMap;