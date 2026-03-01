import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid, List, ArrowUpDown, ListFilter, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PropertyCard from './PropertyCard';
import FiltersSidebar from './FiltersSidebar';
import FilterDrawer from './FilterDrawer';
import ExactSearchBar, { PropertyFilters, PropertyFilterUpdate } from './ExactSearchBar';
import { cn } from '@/lib/utils';

// Property types array
const propertyTypes = [
  'farm', 'ranch', 'recreational', 'residential', 'timberland', 'undeveloped',
  'agricultural', 'commercial', 'conservation', 'land', 'waterfront', 'mountain',
  'investment', 'hunting', 'horse', 'livestock', 'orchard', 'vineyard',
  'dairy', 'poultry', 'equestrian', 'ranching'
];

// Inline Property Types Filter Component
const PropertyTypesFilterInline: React.FC = () => {
  const [showAllTypes, setShowAllTypes] = useState(false);

  console.log('INLINE FILTER: PropertyTypesFilterInline rendering with showAllTypes:', showAllTypes);

  const typesToShow = showAllTypes ? propertyTypes : propertyTypes.slice(0, 6);

  return (
    <div className="bg-white p-4 border rounded-lg mb-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Property Types</h4>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        {typesToShow.map((type) => (
          <button
            key={type}
            className="px-3 py-2 text-sm rounded-md border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-all capitalize"
          >
            {type}
          </button>
        ))}
      </div>
      
      <button
        type="button"
        onClick={() => {
          console.log('INLINE SHOW MORE CLICKED! Changing from', showAllTypes, 'to', !showAllTypes);
          setShowAllTypes(!showAllTypes);
        }}
        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg px-3 py-2 border border-blue-200 transition-all flex items-center justify-center"
      >
        {showAllTypes ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Show All {propertyTypes.length} Types
          </>
        )}
      </button>
    </div>
  );
};

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
  propertyType?: string;
  property_type?: string;
  features?: string[];
  amenities?: string[];
  images: string[];
  videoUrl?: string;
  video_url?: string;
  documents?: string[];
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  terrainType?: string;
  terrain_type?: string;
  vegetation?: string;
  waterResources?: string;
  water_resources?: string;
  roadAccess?: boolean | string;
  road_access?: boolean | string;
  utilities?: string;
  zoning?: string;
  isWaterfront?: boolean;
  is_waterfront?: boolean;
  isMountainView?: boolean;
  is_mountain_view?: boolean;
  featured?: boolean;
  status?: string;
  views?: number;
  ownerId?: number;
  owner_id?: number;
  listingAgentId?: number;
  listing_agent_id?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface FilterState {
  propertyTypes: string[];
  hasResidence: 'yes' | 'no' | 'either';
  bedrooms: number;
  bathrooms: number;
  squareFeet: { min: number | null; max: number | null };
  activities: string[];
  listingType: string[];
  status: string[];
  priceReduction: string;
  dateListed: string;
  keywords: string;
  includesMineralRights: boolean;
  ownerFinancing: boolean;
  propertyVideo: boolean;
  virtualTour: boolean;
  terrainType: string[];
}

interface PropertyListViewProps {
  properties: Property[];
  onPropertySelect: (propertyId: number) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const PropertyListView: React.FC<PropertyListViewProps> = ({
  properties,
  onPropertySelect,
  currentPage,
  onPageChange,
  sortBy,
  onSortChange
}) => {
  const { toast } = useToast();
  const [gridView, setGridView] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showMobileFilterDrawer, setShowMobileFilterDrawer] = useState(false);
  const [showAllPropertyTypes, setShowAllPropertyTypes] = useState(false);

  // Simplified property selection handler
  const handlePropertyClick = (property: Property) => {
    onPropertySelect(property.id);
  };

  const toggleGridView = () => {
    setGridView(gridView === 'grid' ? 'list' : 'grid');
  };

  // Function to convert PropertyFilters to FilterState format
  const propertyFiltersToFilterState = (filters: PropertyFilters): FilterState => {
    return {
      propertyTypes: filters.propertyTypes || [],
      hasResidence: filters.hasResidence || 'either',
      bedrooms: filters.bedrooms || 0,
      bathrooms: filters.bathrooms || 0,
      squareFeet: filters.squareFeet || { min: null, max: null },
      activities: filters.activities || [],
      listingType: filters.listingType || [],
      status: filters.status || [],
      priceReduction: filters.priceReduction || '',
      dateListed: filters.dateListed || '',
      keywords: filters.keywords || '',
      includesMineralRights: filters.includesMineralRights || false,
      ownerFinancing: filters.ownerFinancing || false,
      propertyVideo: filters.propertyVideo || false,
      virtualTour: filters.virtualTour || false,
      terrainType: filters.terrainType || []
    };
  };

  // Create a FilterState object from our PropertyFilters for FiltersSidebar
  const filtersForSidebar: FilterState = React.useMemo(() => {
    return propertyFiltersToFilterState(filters);
  }, [filters]);

  // Calculate active filter count
  const activeFilterCount = 
    (filters.propertyTypes?.length || 0) +
    (filters.activities?.length || 0) +
    (filters.terrainType?.length || 0) +
    (filters.status?.length || 0) +
    (filters.hasResidence !== 'either' ? 1 : 0) +
    (filters.bedrooms > 0 ? 1 : 0) +
    (filters.bathrooms > 0 ? 1 : 0) +
    (filters.includesMineralRights ? 1 : 0) +
    (filters.ownerFinancing ? 1 : 0) +
    (filters.propertyVideo ? 1 : 0) +
    (filters.virtualTour ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Search bar at top */}
      <div className="z-10 sticky top-[64px] bg-white shadow-sm w-full">
        <ExactSearchBar 
          onFilterChange={(update) => {
            // Handle individual filter updates manually
            if (typeof update === 'object' && 'type' in update) {
              // It's a PropertyFilterUpdate
              onFilterChange(update);
            } else {
              console.error('Unexpected filter update format', update);
            }
          }}
          propertyCount={properties?.length || 0}
          onSearch={(query: string) => {
            console.log('Search query:', query);
            toast({
              title: "Search initiated",
              description: `Searching for: ${query}`
            });
          }}
        />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar for filters - always visible for debugging */}
        <div className="block w-[280px] border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Filter Properties</h2>
            {/* Direct Property Types Filter with Show More Button */}
            <div className="bg-yellow-50 p-4 border-2 border-yellow-300 rounded-lg mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Property Types (DEBUG: {showAllPropertyTypes ? 'EXPANDED' : 'COLLAPSED'})</h4>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(showAllPropertyTypes ? propertyTypes : propertyTypes.slice(0, 6)).map((type, index) => {
                  console.log(`DEBUG: Rendering property type ${index + 1}: ${type}`);
                  return (
                    <button
                      key={type}
                      className="px-3 py-2 text-sm rounded-md border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-all capitalize"
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔥🔥🔥 SHOW MORE BUTTON CLICKED! Current state:', showAllPropertyTypes);
                  console.log('🔥🔥🔥 About to change to:', !showAllPropertyTypes);
                  setShowAllPropertyTypes(!showAllPropertyTypes);
                  console.log('🔥🔥🔥 setShowAllPropertyTypes called');
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white text-lg font-bold rounded-lg px-4 py-3 border-2 border-red-700 transition-all flex items-center justify-center cursor-pointer"
                style={{ minHeight: '50px' }}
              >
                {showAllPropertyTypes ? (
                  <>
                    <ChevronUp className="h-6 w-6 mr-2" />
                    🔼 SHOW LESS TYPES 🔼
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-6 w-6 mr-2" />
                    🔽 SHOW ALL {propertyTypes.length} TYPES 🔽
                  </>
                )}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                DEBUG: Currently showing {showAllPropertyTypes ? propertyTypes.length : 6} of {propertyTypes.length} types
              </p>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Control bar with sort, map/list toggle, etc. */}
          <div className="sticky top-0 z-10 bg-white px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="md:hidden flex items-center gap-1"
                onClick={() => setShowMobileFilterDrawer(true)}
              >
                <ListFilter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
              
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-sm text-gray-600 font-medium">
                  {properties.length} Properties
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Select
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value as any)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="acreage-low">Acreage: Low to High</SelectItem>
                    <SelectItem value="acreage-high">Acreage: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={gridView === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridView('grid')}
                  className="h-8 px-2"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridView('list')}
                  className="h-8 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Properties grid/list */}
          <div className="p-4">
            {gridView === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {properties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={{
                      ...property,
                      propertyType: (property.propertyType || property.property_type || 'Land') as string,
                      featured: property.id % 3 === 0
                    }}
                    onClick={() => onPropertySelect(property)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={{
                      ...property,
                      propertyType: (property.propertyType || property.property_type || 'Land') as string,
                      featured: property.id % 3 === 0
                    }}
                    onClick={() => onPropertySelect(property)}
                    layout="horizontal"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilterDrawer && (
        <FilterDrawer
          filters={filtersForSidebar}
          onFiltersChange={handleSidebarFilterChange}
          onApplyFilters={() => setShowMobileFilterDrawer(false)}
          onClearFilters={() => {
            const clearedFilters: FilterState = {
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
              terrainType: []
            };
            
            handleSidebarFilterChange(clearedFilters);
            setShowMobileFilterDrawer(false);
          }}
          activeFilterCount={activeFilterCount}
        />
      )}
    </div>
  );
};