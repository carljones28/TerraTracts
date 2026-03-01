import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import PropertyCard from './PropertyCard';

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
  status?: string;
  featured?: boolean;
  is_featured?: boolean;
  listingAgentId?: number;
  listing_agent_id?: number;
  ownerId?: number;
  owner_id?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  views?: number;
  coordinates?: any;
  boundary?: any;
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
  const [gridView, setGridView] = useState<'grid' | 'list'>('grid');

  // Simplified property selection handler
  const handlePropertyClick = (propertyId: number) => {
    onPropertySelect(propertyId);
  };

  const toggleGridView = () => {
    setGridView(gridView === 'grid' ? 'list' : 'grid');
  };

  // Sort properties based on selected sort option
  const sortedProperties = useMemo(() => {
    const sorted = [...properties];
    
    switch (sortBy) {
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.price).replace(/[$,]/g, '')) || 0;
          const priceB = parseFloat(String(b.price).replace(/[$,]/g, '')) || 0;
          return priceB - priceA;
        });
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.price).replace(/[$,]/g, '')) || 0;
          const priceB = parseFloat(String(b.price).replace(/[$,]/g, '')) || 0;
          return priceA - priceB;
        });
      case 'acreage-high':
        return sorted.sort((a, b) => {
          const acreageA = parseFloat(String(a.acreage).replace(/[^\d.-]/g, '')) || 0;
          const acreageB = parseFloat(String(b.acreage).replace(/[^\d.-]/g, '')) || 0;
          return acreageB - acreageA;
        });
      case 'acreage-low':
        return sorted.sort((a, b) => {
          const acreageA = parseFloat(String(a.acreage).replace(/[^\d.-]/g, '')) || 0;
          const acreageB = parseFloat(String(b.acreage).replace(/[^\d.-]/g, '')) || 0;
          return acreageA - acreageB;
        });
      case 'newest':
      default:
        return sorted;
    }
  }, [properties, sortBy]);

  // Pagination logic
  const propertiesPerPage = 20;
  const totalPages = Math.ceil(sortedProperties.length / propertiesPerPage);
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = sortedProperties.slice(indexOfFirstProperty, indexOfLastProperty);

  const paginate = (pageNumber: number) => onPageChange(pageNumber);

  return (
    <div className="fixed top-[136px] left-0 right-0 bottom-0 bg-gray-50 overflow-y-auto">
      {/* Fixed header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {sortedProperties.length.toLocaleString()} Properties
              </h1>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <span>•</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Sort dropdown */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="hidden sm:inline">Sort by:</span>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger className="h-9 w-[140px] text-sm border-gray-300 bg-white">
                    <SelectValue placeholder="Select sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest Listed</SelectItem>
                    <SelectItem value="price-high">Price (High-Low)</SelectItem>
                    <SelectItem value="price-low">Price (Low-High)</SelectItem>
                    <SelectItem value="acreage-high">Size (Large-Small)</SelectItem>
                    <SelectItem value="acreage-low">Size (Small-Large)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                <Button
                  variant={gridView === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridView('grid')}
                  className="rounded-r-none h-9"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridView('list')}
                  className="rounded-l-none h-9"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="w-full px-6 py-6">
        {/* Properties grid/list */}
        <div className={`
          ${gridView === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }
        `}>
          {currentProperties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={{
                ...property,
                propertyType: (property.propertyType || property.property_type || 'Land') as string,
                featured: property.id % 3 === 0
              }}
              onClick={handlePropertyClick}
            />
          ))}
        </div>

        {/* Empty state */}
        {currentProperties.length === 0 && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-6">We couldn't find any properties matching your current filters.</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="bg-white"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-12 mb-8">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => paginate(pageNum)}
                    className={currentPage === pageNum ? "" : "bg-white"}
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
                className="bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstProperty + 1}-{Math.min(indexOfLastProperty, sortedProperties.length)} of {sortedProperties.length.toLocaleString()} properties
            </div>
          </div>
        )}

        {/* Enhanced Footer Section */}
        <div className="border-t border-gray-200 bg-white mt-16 -mx-4 px-4 py-12 rounded-t-lg">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">TerraTracts</h3>
                <p className="text-gray-600 text-sm mb-4">
                  The premier marketplace for land investments, connecting buyers with premium agricultural, recreational, and commercial properties nationwide.
                </p>
                <div className="flex space-x-3">
                  {['facebook', 'twitter', 'linkedin', 'instagram'].map((social) => (
                    <a
                      key={social}
                      href={`https://${social}.com/terratracts`}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-600">{social[0].toUpperCase()}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Browse Properties</h4>
                <div className="space-y-2">
                  {['Agricultural Land', 'Recreational Properties', 'Commercial Land', 'Residential Lots', 'Ranch Properties'].map((link) => (
                    <a key={link} href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
                <div className="space-y-2">
                  {['Market Reports', 'Investment Guide', 'Financing Options', 'Property Valuation', 'Legal Resources'].map((link) => (
                    <a key={link} href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
                <div className="space-y-2">
                  {['Help Center', 'Contact Us', 'Live Chat', 'Agent Directory', 'Submit Listing'].map((link) => (
                    <a key={link} href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-600 mb-4 md:mb-0">
                © 2024 TerraTracts. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm text-gray-600">
                <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};