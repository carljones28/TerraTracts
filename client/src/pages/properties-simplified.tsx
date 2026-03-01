import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Search, Grid, List, Filter, SlidersHorizontal, MapPin, DollarSign, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

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
  images: string[];
  features?: string[];
  amenities?: string[];
  terrainType?: string;
  isWaterfront?: boolean;
  isMountainView?: boolean;
  status?: string;
  featured?: boolean;
}

interface Filters {
  search: string;
  propertyType: string;
  priceMin: string;
  priceMax: string;
  acreageMin: string;
  acreageMax: string;
  state: string;
  terrainType: string;
}

const PropertiesSimplified: React.FC = () => {
  const [_, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    propertyType: 'all',
    priceMin: '',
    priceMax: '',
    acreageMin: '',
    acreageMax: '',
    state: 'all',
    terrainType: 'all'
  });

  const [sortBy, setSortBy] = useState('newest');
  const propertiesPerPage = 12;

  // Fetch properties
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    refetchOnWindowFocus: false,
  });

  // Filter properties based on current filters
  const filteredProperties = useMemo(() => {
    if (!Array.isArray(properties) || !properties.length) return [];

    return (properties as Property[]).filter((property: Property) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = `${property.title} ${property.description} ${property.location} ${property.state}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Property type filter
      if (filters.propertyType !== 'all') {
        const propType = property.propertyType?.toLowerCase() || '';
        if (!propType.includes(filters.propertyType.toLowerCase())) return false;
      }

      // Price filters
      const price = Number(property.price) || 0;
      if (filters.priceMin && price < Number(filters.priceMin)) return false;
      if (filters.priceMax && price > Number(filters.priceMax)) return false;

      // Acreage filters
      const acreage = Number(property.acreage) || 0;
      if (filters.acreageMin && acreage < Number(filters.acreageMin)) return false;
      if (filters.acreageMax && acreage > Number(filters.acreageMax)) return false;

      // State filter
      if (filters.state !== 'all' && property.state !== filters.state) return false;

      // Terrain type filter
      if (filters.terrainType !== 'all') {
        const terrain = property.terrainType?.toLowerCase() || '';
        if (!terrain.includes(filters.terrainType.toLowerCase())) return false;
      }

      return true;
    });
  }, [properties, filters]);

  // Sort filtered properties
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-high':
        return sorted.sort((a, b) => Number(b.price) - Number(a.price));
      case 'acreage-low':
        return sorted.sort((a, b) => Number(a.acreage) - Number(b.acreage));
      case 'acreage-high':
        return sorted.sort((a, b) => Number(b.acreage) - Number(a.acreage));
      case 'newest':
      default:
        return sorted.sort((a, b) => b.id - a.id);
    }
  }, [filteredProperties, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedProperties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const currentProperties = sortedProperties.slice(startIndex, startIndex + propertiesPerPage);

  // Get unique values for filter dropdowns
  const uniqueStates = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    const states = (properties as Property[]).map((p: Property) => p.state).filter(Boolean);
    return Array.from(new Set(states)).sort();
  }, [properties]);

  const uniquePropertyTypes = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    const types = (properties as Property[])
      .map((p: Property) => p.propertyType)
      .filter((type): type is string => Boolean(type));
    return Array.from(new Set(types)).sort();
  }, [properties]);

  const formatPrice = (price: string | number) => {
    const num = Number(price);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  };

  const formatAcreage = (acreage: string | number) => {
    const num = Number(acreage);
    return num === 1 ? '1 acre' : `${num.toLocaleString()} acres`;
  };

  const handlePropertyClick = (propertyId: number) => {
    navigate(`/properties/${propertyId}`);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      propertyType: 'all',
      priceMin: '',
      priceMax: '',
      acreageMin: '',
      acreageMax: '',
      state: 'all',
      terrainType: 'all'
    });
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading properties</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Land Properties</h1>
        <p className="text-muted-foreground">
          {sortedProperties.length} {sortedProperties.length === 1 ? 'property' : 'properties'} found
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by location, title, or description..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {Object.values(filters).some(v => v && v !== 'all') && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="acreage-low">Size: Small to Large</SelectItem>
                <SelectItem value="acreage-high">Size: Large to Small</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Property Type</label>
                  <Select value={filters.propertyType} onValueChange={(value) => handleFilterChange('propertyType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniquePropertyTypes.map((type, index) => (
                        <SelectItem key={`${type}-${index}`} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">State</label>
                  <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {uniqueStates.map((state, index) => (
                        <SelectItem key={`${state}-${index}`} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Acreage Range</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.acreageMin}
                      onChange={(e) => handleFilterChange('acreageMin', e.target.value)}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.acreageMax}
                      onChange={(e) => handleFilterChange('acreageMax', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Properties Grid/List */}
      {currentProperties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">No properties found matching your criteria</p>
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {currentProperties.map((property: Property) => (
            <Card 
              key={property.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}
              onClick={() => handlePropertyClick(property.id)}
            >
              <div className={viewMode === 'list' ? 'w-1/3' : 'w-full'}>
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className={viewMode === 'list' ? 'w-2/3' : 'w-full'}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                      {property.title}
                    </h3>
                    {property.featured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location}
                  </div>
                </CardHeader>

                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(property.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatAcreage(property.acreage)}
                      </span>
                    </div>
                    
                    {property.propertyType && (
                      <Badge variant="outline">{property.propertyType}</Badge>
                    )}
                    
                    {property.description && viewMode === 'list' && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {property.description}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <div className="flex flex-wrap gap-1">
                    {property.isWaterfront && (
                      <Badge variant="secondary" className="text-xs">Waterfront</Badge>
                    )}
                    {property.isMountainView && (
                      <Badge variant="secondary" className="text-xs">Mountain View</Badge>
                    )}
                    {property.terrainType && (
                      <Badge variant="outline" className="text-xs">{property.terrainType}</Badge>
                    )}
                  </div>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesSimplified;