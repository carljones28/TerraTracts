import { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import TerrainToggle from './TerrainToggle';
import MapVisualization from './MapVisualization';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ArrowRight, Mountain, Trees, Droplets, Wheat, Building2, Brain } from 'lucide-react';

interface HeroSectionProps {
  onViewPropertyDetails: (propertyId: number) => void;
}

// Define property interface
interface Property {
  id: number;
  title: string;
  price: number;
  size: number;
  state: string;
  coordinates: [number, number];
  propertyType: string;
  features?: string[];
}

// AI Search response interface
interface AISearchResponse {
  properties: Property[];
  interpretation: {
    intent: string;
    extractedCriteria: {
      priceRange: string;
      location: string;
      propertyType: string;
      size: string;
      features: string[];
    };
    suggestedFilters: string[];
  };
}

const HeroSection = ({ onViewPropertyDetails }: HeroSectionProps) => {
  const [selectedTerrainType, setSelectedTerrainType] = useState<string | null>(null);
  const [aiSearchResults, setAiSearchResults] = useState<Property[] | null>(null);
  
  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Filter properties based on selected terrain type or AI search results
  const filteredProperties = aiSearchResults || (selectedTerrainType 
    ? properties.filter((property) => property.propertyType === selectedTerrainType)
    : properties);
  
  // Handle search results from SmartMatch™
  const handleSearchResults = (results: AISearchResponse) => {
    if (results && results.properties) {
      setAiSearchResults(results.properties);
      // Clear any terrain filters when searching
      setSelectedTerrainType(null);
    }
  };
  
  // Terrain toggle options with Lucide icons
  const terrainTypes = [
    { icon: <Mountain className="h-4 w-4" />, label: 'Mountain', value: 'Mountain' },
    { icon: <Trees className="h-4 w-4" />, label: 'Forest', value: 'Forest' },
    { icon: <Droplets className="h-4 w-4" />, label: 'Waterfront', value: 'Waterfront' },
    { icon: <Wheat className="h-4 w-4" />, label: 'Farmland', value: 'Farmland' },
    { icon: <Building2 className="h-4 w-4" />, label: 'Development', value: 'Development' }
  ];
  
  const handleTerrainToggle = (terrainType: string) => {
    // Clear AI search results when toggling terrain types
    setAiSearchResults(null);
    
    if (selectedTerrainType === terrainType) {
      setSelectedTerrainType(null); // Toggle off if already selected
    } else {
      setSelectedTerrainType(terrainType);
    }
  };

  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-20 bg-gradient-to-b from-white to-slate-50">
      <div className="clickup-container">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-50 rounded-full filter blur-3xl opacity-40 -z-10"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-blue-50 rounded-full filter blur-2xl opacity-30 -z-10"></div>
        
        {/* Hero content */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-12">
          <div className="w-full lg:w-1/2 lg:pr-6">
            <div className="mb-2">
              <div className="light-badge px-3 py-1 text-sm mb-4">
                <span className="font-medium">AI-Powered Land Marketplace</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight mb-6">
              Find Your Perfect 
              <span className="clickup-gradient-bg text-white px-2 mx-1 rounded whitespace-nowrap">Plot of Land</span> 
              with AI
            </h1>
            
            <p className="text-slate-600 text-lg mb-8 max-w-xl">
              Discover, analyze, and visualize land properties with our AI-powered platform featuring immersive 3D views, predictive valuation, and smart matching.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <button className="light-button-primary py-3 px-6 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Explore Properties</span>
              </button>
              
              <button className="light-button-secondary py-3 px-6 flex items-center gap-2">
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-1 text-sm text-slate-500">
              <div className="flex -space-x-2">
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-purple-100 flex items-center justify-center text-xs text-purple-700 font-bold">T</div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-bold">S</div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-100 flex items-center justify-center text-xs text-amber-700 font-bold">R</div>
              </div>
              <span className="ml-3">Trusted by 10,000+ land investors</span>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 rounded-xl overflow-hidden shadow-md">
            {/* Map visualization component */}
            <div className="aspect-[16/9] w-full h-full bg-slate-100 rounded-xl overflow-hidden">
              <MapVisualization 
                properties={filteredProperties} 
                onMarkerClick={onViewPropertyDetails} 
              />
            </div>
          </div>
        </div>
        
        {/* Search and filter section */}
        <div className="light-card p-6 mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Find Your Ideal Property</h2>
            <p className="text-slate-500">Use natural language to describe what you're looking for</p>
          </div>
          
          <SearchBar onSearchResults={handleSearchResults} />
          
          <div className="mt-6">
            <div className="text-sm font-medium text-slate-700 mb-3">Filter by terrain type:</div>
            <div className="flex flex-wrap gap-2 md:gap-4">
              {terrainTypes.map((terrainType) => (
                <div
                  key={terrainType.value}
                  onClick={() => handleTerrainToggle(terrainType.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all ${
                    selectedTerrainType === terrainType.value
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-slate-50 text-slate-700 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {terrainType.icon}
                  <span className="text-sm font-medium">{terrainType.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
