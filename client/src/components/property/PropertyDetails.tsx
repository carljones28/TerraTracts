import React from 'react';
import { 
  MapPin, 
  Ruler, 
  Mountain, 
  Home, 
  Droplets, 
  CreditCard, 
  ArrowUpRight, 
  TrendingUp,
  Check,
  Map,
  Share2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import PropertyMap from './PropertyMap';
import SharePropertyCard from './SharePropertyCard';
import { DirectContactModal } from './DirectContactModal';

interface PropertyDetailsProps {
  property: any;
  onContactClick: () => void;
  onScheduleTourClick: () => void;
}

const PropertyDetails = ({ 
  property, 
  onContactClick,
  onScheduleTourClick
}: PropertyDetailsProps) => {
  const formatAcrePrice = (price: number, size: number) => {
    return formatPrice(Math.round(price / size));
  };

  // State for fullscreen map
  const [isFullscreenMapVisible, setIsFullscreenMapVisible] = React.useState(false);

  // Function to handle showing fullscreen map
  const showFullscreenMap = () => {
    // Prevent scrolling while map is open
    document.body.style.overflow = 'hidden';
    setIsFullscreenMapVisible(true);
  };

  // Function to hide fullscreen map
  const hideFullscreenMap = () => {
    // Restore scrolling
    document.body.style.overflow = '';
    setIsFullscreenMapVisible(false);
  };

  return (
    <div>
      {/* Fullscreen map modal using React state */}
      {isFullscreenMapVisible && (
        <div 
          className="fixed inset-0 bg-black z-[9999] flex flex-col" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              hideFullscreenMap();
            }
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={hideFullscreenMap}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white hover:bg-opacity-70 z-[10000]"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <h2 className="text-white text-xl font-bold py-4 text-center border-b border-gray-800">
            {property.title}
          </h2>
          
          <div className="flex-1 relative">
            <PropertyMap 
              coordinates={property.coordinates}
              title={property.title}
              isFullscreen={true}
            />
          </div>
          
          {property.coordinates && (
            <div className="border-t border-gray-800 p-2 text-center text-white bg-black bg-opacity-70">
              Property location - Coordinates: {property.coordinates[0].toFixed(6)}, {property.coordinates[1].toFixed(6)}
            </div>
          )}
        </div>
      )}
      
      {/* Zillow-style "About this property" section */}
      <div className="bg-white border-b border-gray-200 pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">About this property</h2>
          <div className="flex items-center gap-2">
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
              isSidebarButton={false}
            />
          </div>
        </div>

        <div className="space-y-4 max-w-none">
          <div className="text-gray-700 leading-relaxed overflow-hidden transition-all duration-300 relative">
            <p className="whitespace-pre-wrap">{property.description}</p>
          </div>
          
          <button className="text-blue-600 font-semibold hover:underline flex items-center gap-1 mt-2">
            Show more
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 text-sm">
          <div className="space-y-1">
            <p className="text-gray-500">Days on Zillow</p>
            <p className="font-semibold text-gray-900">18 days</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500">Views</p>
            <p className="font-semibold text-gray-900">{property.views?.toLocaleString() || '1,234'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500">Saves</p>
            <p className="font-semibold text-gray-900">42</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500">Price/acre</p>
            <p className="font-semibold text-gray-900">
              {property.price && property.size ? formatPrice(Math.round(Number(property.price) / Number(property.size))) : '--'}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-x-8 gap-y-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Listed by:</span>
            <span>{property.agent?.name || 'Robert Anderson'}</span>
            <span className="text-gray-400">|</span>
            <span>{property.agent?.brokerage || 'TerraTracts Realty'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Source:</span>
            <span>My State MLS, MLS#: {11000000 + (property.id || 0)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyDetails;