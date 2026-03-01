import React, { memo } from 'react';
import { LazyImage } from './LazyImage';
import { MapPin, Eye, Heart } from 'lucide-react';

interface Property {
  id: number;
  title: string;
  price: number;
  acreage: number;
  location: string;
  images: string[];
  views: number;
  isWaterfront?: boolean;
  isMountainView?: boolean;
}

interface PropertyCardOptimizedProps {
  property: Property;
  onView?: (id: number) => void;
  onFavorite?: (id: number) => void;
}

// Memoized property card for better performance
export const PropertyCardOptimized = memo(function PropertyCardOptimized({
  property,
  onView,
  onFavorite
}: PropertyCardOptimizedProps) {
  const handleClick = () => {
    onView?.(property.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const primaryImage = property.images?.[0] || '/api/placeholder/400/300';

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        <LazyImage
          src={primaryImage}
          alt={property.title}
          className="w-full h-48 object-cover"
          placeholder="Loading..."
        />
        
        {/* Property badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {property.isWaterfront && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Waterfront
            </span>
          )}
          {property.isMountainView && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
              Mountain View
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.(property.id);
          }}
        >
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
          {property.title}
        </h3>
        
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{property.location}</span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(property.price)}
            </div>
            <div className="text-sm text-gray-500">
              {property.acreage} acres
            </div>
          </div>
          
          <div className="flex items-center text-gray-500 text-sm">
            <Eye className="w-4 h-4 mr-1" />
            {property.views}
          </div>
        </div>
      </div>
    </div>
  );
});

PropertyCardOptimized.displayName = 'PropertyCardOptimized';