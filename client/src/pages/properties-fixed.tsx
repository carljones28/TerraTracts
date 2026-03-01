import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import SimpleMap from '@/components/map/SimpleMap';
import { Search, ChevronLeft, ChevronRight, Grid, Map, ArrowDownAZ, ArrowUpAZ, DollarSign, BarChart3, Star, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PropertyCard from '@/components/property/PropertyCard';
import ExactSearchBar, { PropertyFilters, PropertyFilterUpdate } from '@/components/property/ExactSearchBar';
import { PropertyListView } from '@/components/property/PropertyListView';
import SearchService, { Property as SearchProperty } from '@/lib/searchService';

interface Property {
  id: number;
  title: string;
  description?: string;
  price: string | number;
  acreage: string | number;
  location: string;
  state: string;
  latitude: string | number;
  longitude: string | number;
  
  // Property type fields (supporting both camelCase and snake_case)
  propertyType?: string;
  property_type?: string;
  
  // Features and amenities
  features?: string[];
  amenities?: string[];
  
  // Media
  images: string[];
  videoUrl?: string;
  video_url?: string;
  documents?: string[];
  
  // Property characteristics
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  
  // Terrain and landscape
  terrainType?: string;
  terrain_type?: string;
  vegetation?: string;
  waterResources?: string;
  water_resources?: string;
  
  // Property attributes
  roadAccess?: boolean | string;
  road_access?: boolean | string;
  utilities?: boolean | string;
  zoning?: string;
  
  // Special features
  isWaterfront?: boolean;
  is_waterfront?: boolean;
  isMountainView?: boolean;
  is_mountain_view?: boolean;
  
  // Listing information
  status?: string;
  featured?: boolean;
  is_featured?: boolean;
  listingAgentId?: number;
  listing_agent_id?: number;
  ownerId?: number;
  owner_id?: number;
  
  // Timestamps
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  
  // Metadata
  views?: number;
  coordinates?: any; // GeoJSON
  boundary?: any; // GeoJSON
}

// Filter property based on filter criteria
const filterProperty = (property: Property, filters: PropertyFilters): boolean => {
  if (!filters) return true;
  
  const propertyAsAny = property as any;
  
  // ====== Property Type filter ======
  if (filters.propertyTypes && Array.isArray(filters.propertyTypes) && filters.propertyTypes.length > 0) {
    const propType = property.propertyType || propertyAsAny.property_type || 'land';
    const normalizedPropType = propType.toLowerCase();
    
    const hasMatchingType = filters.propertyTypes.some(filterType => {
      const normalizedFilterType = filterType.toLowerCase();
      return normalizedPropType.includes(normalizedFilterType) || 
             normalizedFilterType.includes(normalizedPropType);
    });
    
    if (!hasMatchingType) {
      return false;
    }
  }

  // ====== Price range filter ======
  if (filters.priceRange && (filters.priceRange.min !== null || filters.priceRange.max !== null)) {
    const priceStr = typeof property.price === 'string' ? property.price : String(property.price);
    const priceNum = parseFloat(priceStr.replace(/[$,]/g, ''));
    
    if (!isNaN(priceNum)) {
      if (filters.priceRange.min !== null && priceNum < filters.priceRange.min) {
        return false;
      }
      if (filters.priceRange.max !== null && priceNum > filters.priceRange.max) {
        return false;
      }
    }
  }

  // ====== Acreage range filter ======
  if (filters.acreageRange && (filters.acreageRange.min !== null || filters.acreageRange.max !== null)) {
    const acreageStr = typeof property.acreage === 'string' ? property.acreage : String(property.acreage);
    const acreageNum = parseFloat(acreageStr.replace(/[^\d.-]/g, ''));
    
    if (!isNaN(acreageNum)) {
      if (filters.acreageRange.min !== null && acreageNum < filters.acreageRange.min) {
        return false;
      }
      if (filters.acreageRange.max !== null && acreageNum > filters.acreageRange.max) {
        return false;
      }
    }
  }

  // ====== Search query filter ======
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    const searchableText = [
      property.title,
      property.description,
      property.location,
      property.state,
      property.propertyType || propertyAsAny.property_type,
    ].filter(Boolean).join(' ').toLowerCase();
    
    if (!searchableText.includes(query)) {
      return false;
    }
  }

  // ====== Bedrooms filter ======
  if (filters.bedrooms > 0) {
    const bedrooms = property.bedrooms || propertyAsAny.bedrooms || 0;
    if (bedrooms < filters.bedrooms) {
      return false;
    }
  }

  // ====== Bathrooms filter ======
  if (filters.bathrooms > 0) {
    const bathrooms = property.bathrooms || propertyAsAny.bathrooms || 0;
    if (bathrooms < filters.bathrooms) {
      return false;
    }
  }

  // ====== Advanced Features filter ======
  if (filters.propertyVideo) {
    const hasVideo = property.videoUrl || propertyAsAny.video_url || false;
    if (!hasVideo) {
      return false;
    }
  }

  if (filters.includesMineralRights) {
    const propFeatures = property.features || propertyAsAny.features || [];
    const hasMineralRights = propFeatures.some((feature: any) => {
      const featureStr = typeof feature === 'string' ? feature : feature.name || '';
      return featureStr.toLowerCase().includes('mineral') || 
             featureStr.toLowerCase().includes('rights');
    });
    if (!hasMineralRights) {
      return false;
    }
  }

  if (filters.ownerFinancing) {
    const propFeatures = property.features || propertyAsAny.features || [];
    const hasOwnerFinancing = propFeatures.some((feature: any) => {
      const featureStr = typeof feature === 'string' ? feature : feature.name || '';
      return featureStr.toLowerCase().includes('owner financing') || 
             featureStr.toLowerCase().includes('seller financing');
    });
    if (!hasOwnerFinancing) {
      return false;
    }
  }

  // ====== Activities filter ======
  if (filters.activities && Array.isArray(filters.activities) && filters.activities.length > 0) {
    const propFeatures = property.features || propertyAsAny.features || [];
    const propAmenities = property.amenities || propertyAsAny.amenities || [];
    const propDescription = property.description || propertyAsAny.description || '';
    
    const hasMatchingActivity = filters.activities.some(activity => {
      const activityLower = activity.toLowerCase();
      
      // Check features
      const featureMatch = propFeatures.some((feature: any) => {
        const featureStr = typeof feature === 'string' ? feature : feature.name || '';
        return featureStr.toLowerCase().includes(activityLower);
      });
      
      // Check amenities
      const amenityMatch = propAmenities.some((amenity: any) => {
        const amenityStr = typeof amenity === 'string' ? amenity : amenity.name || '';
        return amenityStr.toLowerCase().includes(activityLower);
      });
      
      // Check description
      const descriptionMatch = propDescription.toLowerCase().includes(activityLower);
      
      return featureMatch || amenityMatch || descriptionMatch;
    });
    
    if (!hasMatchingActivity) {
      return false;
    }
  }

  // ====== Has Residence filter ======
  if (filters.hasResidence && filters.hasResidence !== 'either') {
    const bedrooms = property.bedrooms || propertyAsAny.bedrooms || 0;
    const sqft = property.sqft || propertyAsAny.sqft || 0;
    const hasResidence = bedrooms > 0 || sqft > 0;
    
    if (filters.hasResidence === 'yes' && !hasResidence) {
      return false;
    }
    if (filters.hasResidence === 'no' && hasResidence) {
      return false;
    }
  }

  // All filters passed, include this property
  return true;
};

// Filter properties based on filter criteria
const filterProperties = (properties: Property[], filters: PropertyFilters): Property[] => {
  if (!filters) return properties;
  
  return properties.filter(property => filterProperty(property, filters));
};

const PropertiesPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const [allProperties, setAllProperties] = useState<Property[]>([]); // Store all properties
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([]); // Filtered properties to display
  const [initialState, setInitialState] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(true); // Toggle between map and list view
  const [sortBy, setSortBy] = useState<string>("newest"); // Property sorting state
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({
    propertyTypes: [],
    hasResidence: 'either',
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: { min: null, max: null },
    activities: [],
    listingType: [],
    status: [],
    priceReduction: '',
    dateListed: '',
    keywords: '',
    includesMineralRights: false,
    ownerFinancing: false,
    propertyVideo: false,
    virtualTour: false,
    terrainType: [],
    searchQuery: '',
    priceRange: { min: null, max: null },
    acreageRange: { min: null, max: null },
    // Legacy support
    propertyType: null,
    features: [],
    hasVideo: false
  });

  // Fetch properties when component mounts
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched properties:', data.length);
        setAllProperties(data);
        setVisibleProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, []);

  // Property selection handler
  const handlePropertySelect = useCallback((propertyId: number) => {
    console.log('Property selected:', propertyId);
    navigate(`/property/${propertyId}`);
  }, [navigate]);

  // Handle properties change from map component
  const handlePropertiesChange = useCallback((newProperties: Property[]) => {
    console.log('Properties changed from map:', newProperties.length);
    setVisibleProperties(newProperties);
    setCurrentPage(1); // Reset to first page when properties change
  }, [setVisibleProperties, setCurrentPage]);

  // Sorting logic
  const filteredAndSortedProperties = useMemo(() => {
    let result = [...visibleProperties];
    
    switch (sortBy) {
      case "price-high":
        result.sort((a, b) => {
          const priceA = parseFloat(String(a.price).replace(/[$,]/g, '')) || 0;
          const priceB = parseFloat(String(b.price).replace(/[$,]/g, '')) || 0;
          return priceB - priceA;
        });
        break;
      case "price-low":
        result.sort((a, b) => {
          const priceA = parseFloat(String(a.price).replace(/[$,]/g, '')) || 0;
          const priceB = parseFloat(String(b.price).replace(/[$,]/g, '')) || 0;
          return priceA - priceB;
        });
        break;
      case "acreage-high":
        result.sort((a, b) => {
          const acreageA = parseFloat(String(a.acreage).replace(/[^\d.-]/g, '')) || 0;
          const acreageB = parseFloat(String(b.acreage).replace(/[^\d.-]/g, '')) || 0;
          return acreageB - acreageA;
        });
        break;
      case "acreage-low":
        result.sort((a, b) => {
          const acreageA = parseFloat(String(a.acreage).replace(/[^\d.-]/g, '')) || 0;
          const acreageB = parseFloat(String(b.acreage).replace(/[^\d.-]/g, '')) || 0;
          return acreageA - acreageB;
        });
        break;
      case "newest":
      default:
        // Keep original order (newest first)
        break;
    }
    
    return result;
  }, [visibleProperties, sortBy]);

  // Pagination logic
  const propertiesPerPage = 20;
  const totalPages = Math.ceil(filteredAndSortedProperties.length / propertiesPerPage);
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = filteredAndSortedProperties.slice(indexOfFirstProperty, indexOfLastProperty);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Function to explicitly set view mode
  const setMapView = (showMapView: boolean) => {
    console.log(`Setting map view to: ${showMapView}`);
    setShowMap(showMapView);
  };
  
  // Handler for PropertyFilters changes
  const handlePropertyFiltersChange = useCallback((updatedFilters: PropertyFilters) => {
    console.log('FILTER DEBUG - Filters updated:', updatedFilters);
    console.log('FILTER DEBUG - All properties count:', allProperties.length);
    setPropertyFilters(updatedFilters);
    
    // Apply the filters to the ALL properties (not just currently visible ones)
    if (allProperties.length > 0) {
      // Filter the properties based on the filter criteria
      const filteredProperties = filterProperties(allProperties, updatedFilters);
      console.log('FILTER DEBUG - Filtered properties count:', filteredProperties.length);
      console.log('FILTER DEBUG - First few filtered properties:', filteredProperties.slice(0, 3).map(p => ({ id: p.id, type: p.propertyType, title: p.title })));
      setVisibleProperties(filteredProperties);
      
      // Reset to first page when filters change
      setCurrentPage(1);
    }
  }, [allProperties, setPropertyFilters, setVisibleProperties, setCurrentPage]);

  // Simplified search implementation that always works
  const performSearch = useCallback(async (query: string) => {
    console.log('Performing search for query:', query);
    
    if (!query || !query.trim()) {
      // Empty query - show all properties
      setVisibleProperties(allProperties);
      setPropertyFilters(prevFilters => ({
        ...prevFilters,
        searchQuery: ''
      }));
      setCurrentPage(1);
      return;
    }
    
    // If it's a location-based search (contains ", United States"), clear search to let map bounds take precedence
    if (query.includes(', United States')) {
      console.log('Location-based search detected, clearing search query to allow map bounds filtering');
      setPropertyFilters(prevFilters => ({
        ...prevFilters,
        searchQuery: ''
      }));
      setCurrentPage(1);
      return;
    }
    
    // Update filter with search query which will trigger filtering
    setPropertyFilters(prevFilters => ({
      ...prevFilters,
      searchQuery: query
    }));
    setCurrentPage(1);
  }, [allProperties, setPropertyFilters, setVisibleProperties, setCurrentPage]);

  const convertFilterUpdateToFilters = useCallback((filterUpdate: PropertyFilterUpdate, currentFilters: PropertyFilters) => {
    const updatedFilters = { ...currentFilters };
    
    switch (filterUpdate.type) {
      case 'propertyType':
        if (Array.isArray(updatedFilters.propertyTypes)) {
          if (updatedFilters.propertyTypes.includes(filterUpdate.value)) {
            updatedFilters.propertyTypes = updatedFilters.propertyTypes.filter(type => type !== filterUpdate.value);
          } else {
            updatedFilters.propertyTypes = [...updatedFilters.propertyTypes, filterUpdate.value];
          }
        } else {
          updatedFilters.propertyTypes = [filterUpdate.value];
        }
        break;
      case 'priceRange':
        updatedFilters.priceRange = filterUpdate.value;
        break;
      case 'acreageRange':
        updatedFilters.acreageRange = filterUpdate.value;
        break;
      case 'features':
        // Handle adding or removing a feature
        const feature = filterUpdate.value;
        if (Array.isArray(updatedFilters.features)) {
          if (updatedFilters.features.includes(feature)) {
            updatedFilters.features = updatedFilters.features.filter(f => f !== feature);
          } else {
            updatedFilters.features = [...updatedFilters.features, feature];
          }
        } else {
          updatedFilters.features = [feature];
        }
        break;
      case 'terrainType':
        updatedFilters.terrainType = filterUpdate.value;
        break;
      case 'hasVideo':
        updatedFilters.hasVideo = filterUpdate.value;
        break;
      case 'searchQuery':
        updatedFilters.searchQuery = filterUpdate.value;
        break;
      case 'activities':
        updatedFilters.activities = filterUpdate.value;
        break;
      case 'hasResidence':
        updatedFilters.hasResidence = filterUpdate.value;
        break;
      case 'bedrooms':
        updatedFilters.bedrooms = filterUpdate.value;
        break;
      case 'bathrooms':
        updatedFilters.bathrooms = filterUpdate.value;
        break;
      case 'propertyVideo':
        updatedFilters.propertyVideo = filterUpdate.value;
        updatedFilters.hasVideo = filterUpdate.value; // Legacy support
        break;
      case 'includesMineralRights':
        updatedFilters.includesMineralRights = filterUpdate.value;
        break;
      case 'ownerFinancing':
        updatedFilters.ownerFinancing = filterUpdate.value;
        break;
      case 'comprehensive':
        // Replace entire filter state with comprehensive update
        console.log('FILTER DEBUG - Comprehensive update received:', filterUpdate.value);
        return filterUpdate.value;
    }
    
    return updatedFilters;
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Exact Search Bar matching reference image */}
      <ExactSearchBar
        propertyCount={filteredAndSortedProperties.length}
        showMapProp={showMap}
        onMapViewChange={(mapViewValue: boolean) => {
          console.log('Properties - Map view changed to:', mapViewValue);
          setMapView(mapViewValue);
        }}
        onFilterChange={(filterUpdate: PropertyFilterUpdate) => {
          console.log('FILTER DEBUG - Filter update received:', filterUpdate);
          const newFilters = convertFilterUpdateToFilters(filterUpdate, propertyFilters);
          console.log('FILTER DEBUG - New filters after conversion:', newFilters);
          handlePropertyFiltersChange(newFilters);
        }}
        onSearch={performSearch}
        currentFilters={propertyFilters}
      />
      
      {showMap ? (
        /* Zillow-style split view with map on left and properties on right */
        <div className="flex flex-1 overflow-hidden">
          {/* Map container - Left side (55%) */}
          <div className="w-[55%] h-full relative">
            <SimpleMap 
              onPropertySelect={handlePropertySelect} 
              onPropertiesChange={handlePropertiesChange}
              initialState={initialState}
            />
          </div>
          
          {/* Property listings - Right side (45%) */}
          <div className="w-[45%] bg-white border-l border-gray-200 overflow-y-auto">
            <div className="px-4 py-3">
              {/* Property count and controls */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filteredAndSortedProperties.length} Properties
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span>Sort by:</span>
                    <Select
                      value={sortBy}
                      onValueChange={(value) => setSortBy(value)}
                    >
                      <SelectTrigger className="h-9 w-[140px] text-sm border-gray-300 bg-white">
                        <SelectValue placeholder="Select sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-high">Price (High-Low)</SelectItem>
                        <SelectItem value="price-low">Price (Low-High)</SelectItem>
                        <SelectItem value="acreage-high">Acreage (High-Low)</SelectItem>
                        <SelectItem value="acreage-low">Acreage (Low-High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMapView(false)}
                    className="flex items-center gap-2 h-9 px-4 bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    <Grid className="h-4 w-4" />
                    <span className="font-medium">List View</span>
                  </Button>
                </div>
              </div>
              
              {/* Property grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentProperties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={{
                      ...property,
                      propertyType: (property.propertyType || property.property_type || 'Land') as string,
                      featured: property.id % 3 === 0
                    }}
                    onClick={handlePropertySelect}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Properties by Type section */}
              <div className="border-t border-gray-200 pt-6 pb-4 mt-6">
                <div className="mb-4">
                  <h3 className="font-medium text-xs mb-2">Properties by Type</h3>
                  <div className="grid grid-cols-1 gap-y-1">
                    <a href="#" className="text-green-600 text-xs hover:underline">Farms for Sale</a>
                    <a href="#" className="text-green-600 text-xs hover:underline">Ranches for Sale</a>
                    <a href="#" className="text-green-600 text-xs hover:underline">Residential Property</a>
                    <a href="#" className="text-green-600 text-xs hover:underline">Undeveloped Land</a>
                    <a href="#" className="text-green-600 text-xs hover:underline">Lakefront Property</a>
                    <a href="#" className="text-green-600 text-xs hover:underline">Recreational Land</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <PropertyListView 
          properties={filteredAndSortedProperties}
          onPropertySelect={handlePropertySelect}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}
    </div>
  );
};

export default PropertiesPage;