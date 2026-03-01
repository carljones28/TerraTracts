import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Heart, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import SharePropertyCard from './SharePropertyCard';

interface PropertyHeaderProps {
  property: {
    id: number;
    title: string;
    location?: string;
    state: string;
    price: number;
    size: number;
    propertyType: string;
    features?: string[];
    images?: string[];
  };
  onShare: () => void;
  onFavorite: () => void;
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({ property, onShare, onFavorite }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-start md:justify-between mb-4">
        <div>
          <Link to="/properties" className="text-gray-600 hover:text-primary mb-2 inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Listings
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{property.title}</h1>
          <div className="flex items-center mt-2 text-gray-600">
            <MapPin className="w-4 h-4 mr-1 text-primary" />
            <span>{property.location || property.state}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end">
          <div className="flex space-x-2 mb-2">
            <SharePropertyCard
              property={{
                id: property.id,
                title: property.title,
                price: property.price,
                location: property.location || property.state,
                state: property.state,
                size: property.size,
                propertyType: property.propertyType,
                images: Array.isArray(property.images) ? property.images : []
              }}
            />
            <button 
              onClick={onFavorite}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors group"
              aria-label="Save to favorites"
            >
              <Heart className="w-5 h-5 text-gray-700 group-hover:text-red-500 group-active:text-red-600 group-active:fill-red-600 transition-colors" />
            </button>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatPrice(property.price)}</div>
          <div className="text-gray-600">{formatPrice(Math.round(property.price / property.size))} per acre</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-3">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
          {property.size} acres
        </Badge>
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none capitalize">
          {property.propertyType}
        </Badge>
        {property.features?.slice(0, 3).map((feature, index) => (
          <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
            {feature}
          </Badge>
        ))}
        {property.features && property.features.length > 3 && (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none">
            +{property.features.length - 3} more
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PropertyHeader;