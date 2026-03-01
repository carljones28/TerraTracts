import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Search, 
  Grid, 
  X, 
  Plus, 
  Minus, 
  Heart, 
  Filter, 
  Layers,
  ChevronDown,
  ChevronUp,
  Share2,
  Eye,
  Map,
  Image,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initMap, addPropertyMarkers } from '@/lib/mapUtils';

interface Property {
  id: number;
  title: string;
  price: string | number;
  acreage: string | number;
  location: string;
  state: string;
  latitude: string | number;
  longitude: string | number;
  propertyType: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

interface ZillowMapProps {
  onPropertySelect: (propertyId: number) => void;
}

const ZillowMap: React.FC<ZillowMapProps> = ({ onPropertySelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [showSchools, setShowSchools] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapView, setMapView] = useState<'satellite' | 'standard'>('satellite');
  const [drawMode, setDrawMode] = useState(false);
  const [priceFilter, setPriceFilter] = useState([0, 5000000]);
  const [acreageFilter, setAcreageFilter] = useState([0, 100]);
  const [priceFilterOpen, setPriceFilterOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Initialize map when component mounts
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

  // Update markers when properties change, with error handling
  useEffect(() => {
    try {
      if (mapInstance && properties.length > 0) {
        addPropertyMarkers(mapInstance, properties, onPropertySelect);
      }
    } catch (err) {
      console.error('Error adding property markers:', err);
    }
  }, [mapInstance, properties, onPropertySelect]);
  
  // Format price for display
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    
    if (numPrice >= 1000000) {
      return `$${(numPrice / 1000000).toFixed(1)}M`;
    } else if (numPrice >= 1000) {
      return `$${(numPrice / 1000).toFixed(0)}K`;
    }
    return `$${numPrice.toLocaleString()}`;
  };
  
  const handleZoomIn = () => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom();
      const newZoom = Math.min(currentZoom + 1, 20);
      setMapZoom(newZoom);
      
      mapInstance.zoomTo(newZoom, { duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom();
      const newZoom = Math.max(currentZoom - 1, 5); 
      setMapZoom(newZoom);
      
      mapInstance.zoomTo(newZoom, { duration: 300 });
    }
  };
  
  const toggleMapView = () => {
    try {
      const newView = mapView === 'satellite' ? 'standard' : 'satellite';
      setMapView(newView);
      
      if (!mapInstance) {
        console.error('Cannot toggle map view - map instance is null');
        return;
      }
      
      if (typeof mapInstance.setStyle !== 'function') {
        console.error('Map instance does not have setStyle method');
        return;
      }
      
      // Use proper Mapbox GL styles
      const style = newView === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/streets-v12';
      
      // Safe check for map readiness
      try {
        if (!mapInstance.isStyleLoaded()) {
          console.log('Map style not fully loaded, waiting for style load before changing...');
          
          // Set up a one-time style.load listener to change style
          const changeStyleWhenLoaded = () => {
            try {
              // Apply the style change after a short delay
              setTimeout(() => {
                try {
                  mapInstance.setStyle(style);
                  
                  // Also set up marker redrawing after style change
                  mapInstance.once('style.load', () => {
                    try {
                      if (properties.length > 0) {
                        addPropertyMarkers(mapInstance, properties, onPropertySelect);
                      }
                    } catch (err) {
                      console.error('Error adding markers after delayed style change:', err);
                    }
                  });
                } catch (styleErr) {
                  console.error('Delayed style change failed:', styleErr);
                }
              }, 300);
            } catch (err) {
              console.error('Error setting map style after load:', err);
            }
          };
          
          mapInstance.once('style.load', changeStyleWhenLoaded);
          return;
        }
      } catch (checkErr) {
        console.log('Using fallback method for style change:', checkErr);
        
        // Fallback to load event if isStyleLoaded fails
        const applyStyleChange = () => {
          setTimeout(() => {
            try {
              mapInstance.setStyle(style);
              
              mapInstance.once('style.load', () => {
                try {
                  if (properties.length > 0) {
                    addPropertyMarkers(mapInstance, properties, onPropertySelect);
                  }
                } catch (markerErr) {
                  console.error('Error adding markers with fallback method:', markerErr);
                }
              });
            } catch (styleErr) {
              console.error('Error changing style with fallback method:', styleErr);
            }
          }, 500);
        };
        
        // Check if the map is already loaded
        if (mapInstance._loaded) {
          applyStyleChange();
        } else {
          mapInstance.once('load', applyStyleChange);
        }
        return;
      }
      
      // Apply style change if map is loaded
      mapInstance.setStyle(style);
      
      // Redraw the map with the new style - with error handling
      mapInstance.once('style.load', () => {
        try {
          if (properties.length > 0) {
            addPropertyMarkers(mapInstance, properties, onPropertySelect);
          }
        } catch (err) {
          console.error('Error adding markers after style change:', err);
        }
      });
    } catch (err) {
      console.error('Error in toggleMapView:', err);
    }
  };
  
  const toggleDrawMode = () => {
    setDrawMode(!drawMode);
    // In a real implementation, this would enable drawing polygons on the map
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-white flex flex-col">
      {/* Top filter bar - Zillow style */}
      <div className="border-b border-gray-200 bg-white z-10">
        <div className="flex items-center px-3 py-2">
          {/* Search input - Zillow style */}
          <div className="w-full max-w-md mr-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Address, City, ZIP, Neighborhood"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Filters - Zillow style */}
          <div className="flex space-x-1">
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 px-3 flex items-center gap-1 text-gray-700 border-gray-300 rounded-md"
              >
                <span>For Sale</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 px-3 flex items-center gap-1 text-gray-700 border-gray-300 rounded-md"
                onClick={() => setPriceFilterOpen(!priceFilterOpen)}
              >
                <span>Price</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {/* Price dropdown */}
              {priceFilterOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-20 w-64">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <input 
                        type="text"
                        placeholder="Min"
                        className="w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      />
                      <span className="text-gray-400 mx-2">to</span>
                      <input 
                        type="text"
                        placeholder="Max"
                        className="w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {['$0+', '$50K+', '$100K+', '$200K+', '$300K+', '$400K+', '$500K+', '$750K+', '$1M+', '$1.5M+'].map(price => (
                        <button 
                          key={price}
                          className="py-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {price}
                        </button>
                      ))}
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 flex justify-between">
                      <button className="text-xs text-gray-500">Reset</button>
                      <button className="text-xs text-blue-600 font-medium">Done</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 px-3 flex items-center gap-1 text-gray-700 border-gray-300 rounded-md"
              >
                <span>Acreage</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 px-3 flex items-center gap-1 text-gray-700 border-gray-300 rounded-md"
              >
                <span>Type</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className={`text-xs h-8 px-3 flex items-center gap-1 ${filtersVisible ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-700 border-gray-300'} rounded-md`}
                onClick={() => setFiltersVisible(!filtersVisible)}
              >
                <Filter className="h-3.5 w-3.5 mr-0.5" />
                <span>More</span>
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
            
            <Button 
              size="sm" 
              className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Save search
            </Button>
          </div>
        </div>
        
        {/* Expanded filters panel - Zillow style */}
        {filtersVisible && (
          <div className="border-t border-gray-200 py-3 px-4">
            <div className="flex flex-wrap -mx-2">
              {/* Land Features */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 mb-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Land Features</h3>
                <div className="space-y-2">
                  {['Waterfront', 'Lake View', 'Ocean View', 'Mountain View', 'Fenced', 'Wooded'].map(feature => (
                    <div key={feature} className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`feature-${feature}`} 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`feature-${feature}`} className="ml-2 text-xs text-gray-700">{feature}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Property Type */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 mb-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Property Type</h3>
                <div className="space-y-2">
                  {['Land', 'Farm', 'Ranch', 'Recreational', 'Hunting', 'Development'].map(type => (
                    <div key={type} className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`type-${type}`} 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`type-${type}`} className="ml-2 text-xs text-gray-700">{type}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Utilities */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 mb-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Utilities</h3>
                <div className="space-y-2">
                  {['Electricity', 'Water', 'Sewer', 'Natural Gas', 'Internet', 'Phone'].map(util => (
                    <div key={util} className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`util-${util}`} 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`util-${util}`} className="ml-2 text-xs text-gray-700">{util}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Other Filters */}
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 mb-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Other Filters</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="reduced" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="reduced" className="ml-2 text-xs text-gray-700">Price Reduced</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="newlisting" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="newlisting" className="ml-2 text-xs text-gray-700">New Listing (24 hrs)</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="pending" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="pending" className="ml-2 text-xs text-gray-700">Exclude Pending</label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filter Actions Row */}
            <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-200">
              <div>
                <button className="text-xs text-blue-600 font-medium mr-4">
                  Reset All Filters
                </button>
                <span className="text-xs text-gray-500">
                  {properties.length} properties
                </span>
              </div>
              
              <div>
                <button 
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md"
                  onClick={() => setFiltersVisible(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Map */}
        <div className="w-[60%] relative">
          <div ref={mapContainerRef} className="w-full h-full absolute inset-0 bg-gray-100"></div>
          
          {/* Map overlay controls - Zillow style */}
          <div className="absolute top-3 right-3 z-10 flex flex-col shadow-md">
            {/* Map/Satellite toggle - exactly like Zillow */}
            <div className="relative bg-white rounded-sm mb-2 flex items-center">
              <button
                className={`flex items-center justify-center h-8 px-3 text-xs font-medium transition-colors ${mapView !== 'satellite' ? 'bg-gray-100 text-gray-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                onClick={() => {
                  if (mapView === 'satellite') {
                    toggleMapView(); // Call our improved toggle function
                  }
                }}
              >
                Map
              </button>
              <button
                className={`flex items-center justify-center h-8 px-3 text-xs font-medium transition-colors ${mapView === 'satellite' ? 'bg-gray-100 text-gray-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                onClick={() => {
                  if (mapView !== 'satellite') {
                    toggleMapView(); // Call our improved toggle function
                  }
                }}
              >
                Satellite
              </button>
            </div>
            
            {/* Zoom controls */}
            <div className="bg-white rounded shadow-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 w-8 rounded-none hover:bg-gray-100 border-b border-gray-200" 
                onClick={handleZoomIn}
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 w-8 rounded-none hover:bg-gray-100" 
                onClick={handleZoomOut}
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>
          
          {/* Bottom map controls section */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-between px-3 z-10">
            {/* Left side map controls */}
            <div className="flex space-x-2">
              {/* Schools toggle */}
              <div className="bg-white shadow rounded-md px-3 py-1.5 flex items-center gap-1.5 text-xs">
                <span className="font-medium text-gray-700">Schools</span>
                <button 
                  onClick={() => setShowSchools(!showSchools)}
                  className="text-blue-600 font-medium hover:underline"
                >
                  {showSchools ? 'On' : 'Off'}
                </button>
              </div>
              
              {/* Map Details (optional) */}
              <div className="bg-white shadow rounded-md px-3 py-1.5 flex items-center gap-1.5 text-xs">
                <span className="font-medium text-gray-700">Flood Factor</span>
                <button 
                  className="text-blue-600 font-medium hover:underline"
                >
                  Off
                </button>
              </div>
            </div>
            
            {/* Right side map controls */}
            <div className="flex space-x-2">
              {/* Street View (placeholder) */}
              <div className="bg-white shadow rounded-md px-3 py-1.5 text-xs">
                <button className="text-blue-600 font-medium flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>Street View</span>
                </button>
              </div>
              
              {/* Draw tool */}
              <div className="bg-white shadow rounded-md px-3 py-1.5">
                <button 
                  className={`text-xs font-medium flex items-center gap-1 ${drawMode ? 'text-blue-600' : 'text-blue-600'}`}
                  onClick={toggleDrawMode}
                >
                  <Filter className="h-3 w-3" />
                  <span>Draw</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Property listings */}
        <div className="w-[40%] bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            {/* Top results bar - Zillow style */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-gray-900">Land & Properties For Sale</h2>
                <p className="text-sm text-gray-600">{properties.length} results</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center rounded-md border border-gray-300 h-8 mr-2">
                  <button className="px-2 h-full text-xs text-gray-600 font-medium flex items-center gap-1 border-r border-gray-300">
                    <span>Recommended</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button className="px-2 h-full text-xs text-gray-600 flex items-center">
                    <Filter className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
                
                <div className="flex rounded-md border border-gray-300 h-8">
                  <button className="border-r border-gray-300 px-2 h-full flex items-center justify-center">
                    <Grid className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                  <button className="px-2 h-full flex items-center justify-center bg-gray-100">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Property cards - Grid layout like Zillow */}
            <div className="grid grid-cols-2 gap-3">
              {properties.slice(0, 8).map((property, index) => (
                <div 
                  key={property.id} 
                  className="group cursor-pointer border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition-all duration-200"
                  onClick={() => onPropertySelect(property.id)}
                >
                  <div className="flex flex-col h-full">
                    {/* Property image section - top */}
                    <div className="relative w-full h-32">
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Label for new/days on market */}
                      {index % 4 === 0 && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-sm z-10">
                          New
                        </div>
                      )}
                      
                      {/* Heart icon */}
                      <button 
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-80 hover:opacity-100 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to favorites logic
                        }}
                      >
                        <Heart className="h-4 w-4 text-gray-500 hover:text-red-500" />
                      </button>
                      
                      {/* Photo count and navigation */}
                      <div className="absolute bottom-2 right-2 flex text-xs z-10">
                        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-sm font-medium flex items-center gap-1">
                          <span>1/{property.images.length}</span>
                          <ChevronDown className="h-3 w-3 opacity-75" />
                        </div>
                      </div>
                      
                      {/* Hover photos navigation - only appears on hover */}
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-black bg-opacity-40 rounded-full p-1 text-white hover:bg-opacity-60">
                          <ChevronDown className="h-3 w-3 rotate-90" />
                        </button>
                        <button className="bg-black bg-opacity-40 rounded-full p-1 text-white hover:bg-opacity-60">
                          <ChevronDown className="h-3 w-3 -rotate-90" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Property details section - right side */}
                    <div className="p-3 flex flex-col justify-between flex-grow">
                      <div>
                        {/* Price and save/share bar */}
                        <div className="flex justify-between items-start">
                          <div className="text-xl font-bold text-gray-900">
                            {formatPrice(property.price)}
                          </div>
                          <div className="flex space-x-1">
                            <button 
                              className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Share functionality
                              }}
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Save for later
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Property specs - beds, baths, etc. */}
                        <div className="flex items-center mt-1 text-sm text-gray-700">
                          {property.bedrooms && (
                            <>
                              <span className="font-medium">{property.bedrooms} bd</span>
                              <span className="mx-1">•</span>
                            </>
                          )}
                          
                          {property.bathrooms && (
                            <>
                              <span className="font-medium">{property.bathrooms} ba</span>
                              <span className="mx-1">•</span>
                            </>
                          )}
                          
                          {typeof property.sqft === 'number' && (
                            <>
                              <span className="font-medium">{property.sqft.toLocaleString()} sqft</span>
                              <span className="mx-1">•</span>
                            </>
                          )}
                          
                          <span className="font-medium">{property.acreage || 10} acres</span>
                        </div>
                        
                        {/* Property address - on a separate line */}
                        <div className="mt-1.5 text-sm text-gray-700">
                          {property.location || `${property.title.split(' in ')[1] || property.state}`}
                        </div>
                      </div>
                      
                      {/* Bottom row with property type and agent info */}
                      <div className="mt-3 flex justify-between items-end">
                        {/* Property type */}
                        <div className="text-xs text-gray-500 flex flex-col">
                          <span>{property.propertyType || 'Land'}</span>
                          <span className="text-gray-400">Listed {index % 10 + 1}d ago</span>
                        </div>
                        
                        {/* Premier agent/brokerage */}
                        <div className="text-xs text-right">
                          <div className="text-gray-600">TerraTracts Realty</div>
                          {index % 3 === 0 && <div className="text-blue-600 font-medium">Premier Agent</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load more section - Zillow style */}
            <div className="border-t border-gray-200 mt-6 pt-4 flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="px-4 py-2 text-blue-600 border-blue-600 hover:bg-blue-50 rounded-md font-medium text-sm"
              >
                Show {properties.length - 8} more homes
              </Button>
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center border border-gray-300 rounded-md divide-x">
                <button className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 font-medium">1</button>
                <button className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">2</button>
                <button className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">3</button>
                <button className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZillowMap;