import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MapPin, ChevronLeft, ChevronRight, MoreHorizontal, EyeOff, Share2 } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { getOptimalImageLoadingProps, getOptimizedImageUrl } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PropertyCardProps {
  property: {
    id: number;
    title: string;
    price: string | number;
    acreage: string | number;
    location: string;
    state?: string;
    propertyType: string;
    images: string[];
    featured?: boolean;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    description?: string;
    videoUrl?: string;
    createdAt?: string;
    status?: string;
  };
  onClick?: (propertyId: number) => void;
  layout?: 'vertical' | 'horizontal';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick, layout = 'vertical' }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentIndex, setCurrentIndex] = useState(0);

  // Format price for display to match design (K for thousands, M for millions)
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    
    if (numPrice >= 1000000) {
      return `$${Math.floor(numPrice / 1000000)}M`;
    } else if (numPrice >= 1000) {
      return `$${Math.floor(numPrice / 1000)}K`;
    } else {
      return `$${Math.floor(numPrice)}`;
    }
  };

  // Extract county and zip code from location if available
  const formatLocation = (location: string) => {
    // Remove country if it exists
    let formattedLocation = location.replace(/, USA$/, '').replace(/, United States$/, '');
    
    // Extract components if possible using regex
    const cityStateMatch = formattedLocation.match(/^([^,]+),\s*([A-Z]{2})(.*?)$/);
    
    if (cityStateMatch) {
      const [_, city, stateAbbrev, rest] = cityStateMatch;
      
      // Try to extract county and zip if they exist in the rest of the string
      const countyZipMatch = rest.match(/,\s*([^,]+)\s*County,\s*(\d{5})/i);
      const zipMatch = rest.match(/,\s*(\d{5})/);
      
      if (countyZipMatch) {
        return `${city}, ${stateAbbrev}, ${countyZipMatch[1]} County, ${countyZipMatch[2]}`;
      } else if (zipMatch) {
        return `${city}, ${stateAbbrev}${rest}`;
      } else {
        return formattedLocation;
      }
    }
    
    return formattedLocation;
  };

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  }, [isFavorite]);

  const handleHideProperty = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHidden(true);
    console.log(`Property ${property.id} hidden by user`);
  }, [property.id]);

  const handleShareProperty = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareData = {
      title: property.title,
      text: `Check out this ${formatPrice(property.price)} property in ${formatLocation(property.location)}`,
      url: window.location.origin + `/properties/${property.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        console.log('Property link copied to clipboard');
      }
    } catch (error) {
      console.log('Error sharing property:', error);
    }
  }, [property.id, property.title]);

  // Carousel navigation
  const slideNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) {
      emblaApi.scrollNext();
      setCurrentIndex(prev => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const slidePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) {
      emblaApi.scrollPrev();
      setCurrentIndex(prev => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };
  
  // Handle carousel events
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on('select', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // For horizontal (list) layout
  if (layout === 'horizontal') {
    return (
      <div 
        className="rounded-xl overflow-hidden shadow-sm border border-gray-200/60 hover:shadow-lg hover:border-gray-300 transition-all duration-300 cursor-pointer bg-white group flex"
        onClick={() => onClick && onClick(property.id)}
      >
        {/* Carousel image section - smaller for horizontal layout */}
        <div className="relative w-[220px] overflow-hidden flex-shrink-0">
          <div className="embla overflow-hidden h-full" ref={emblaRef}>
            <div className="flex h-full">
              {property.images && property.images.length > 0 ? (
                property.images.map((img, index) => (
                  <div 
                    key={index} 
                    className="flex-none w-full h-full relative"
                  >
                    <img 
                      src={getOptimizedImageUrl(img, 400)} 
                      alt={`${property.title} - image ${index+1}`} 
                      className="w-full h-full object-cover"
                      {...getOptimalImageLoadingProps(property.images, index)}
                      onError={(e) => {
                        e.currentTarget.src = '/uploads/test-property-image.png';
                        e.currentTarget.alt = 'Property image not available';
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="flex-none w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400 text-sm">No image available</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation arrows - only show if more than one image */}
          {property.images && property.images.length > 1 && (
            <>
              <button 
                onClick={slidePrev}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 rounded-full p-1"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button 
                onClick={slideNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 rounded-full p-1"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </>
          )}
          
          {/* Featured label */}
          {property.featured && (
            <div className="absolute top-2 left-2 bg-purple-500 rounded-md px-2 py-1 shadow-sm">
              <span className="text-white text-xs font-medium">Featured</span>
            </div>
          )}
          
          {/* Favorite button */}
          <button 
            className={`absolute top-2 right-2 ${
              isFavorite ? 'text-red-500' : 'text-white'
            }`}
            onClick={handleToggleFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        {/* Content area for horizontal layout */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Status badge if exists */}
          {property.status && property.status !== 'active' && (
            <div className="mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                property.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                property.status === 'sold' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </span>
            </div>
          )}
          
          {/* Title */}
          <h3 className="font-semibold text-gray-800 text-lg leading-tight mb-1">
            {property.title}
          </h3>
          
          {/* Location */}
          <div className="flex items-center mt-1 text-gray-500">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-sm truncate">{formatLocation(property.location)}</span>
          </div>
          
          {/* Description Preview */}
          {property.description && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {property.description}
            </p>
          )}
          
          {/* Property Type */}
          <div className="mt-2 text-xs text-gray-500">
            <span className="capitalize">{property.propertyType || 'Land'}</span>
          </div>
          
          <div className="mt-auto pt-3 flex items-center justify-between">
            {/* Price and acreage */}
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-gray-900">{formatPrice(property.price)}</span>
              <div className="flex items-center">
                <span className="text-base font-medium text-gray-900">
                  {Math.floor(typeof property.acreage === 'string' ? parseFloat(property.acreage) : property.acreage)}
                </span>
                <span className="text-sm text-gray-900 ml-1">acres</span>
              </div>
            </div>
            
            {/* Has video indicator */}
            {property.videoUrl && (
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                Video
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default vertical layout (grid)
  return (
    <div 
      className="rounded-xl overflow-hidden shadow-sm border border-gray-200/60 hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white group"
      onClick={() => onClick && onClick(property.id)}
    >
      {/* Carousel image section */}
      <div className="relative h-56 overflow-hidden">
        <div className="embla overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {property.images && property.images.length > 0 ? (
              property.images.map((img, index) => (
                <div 
                  key={index} 
                  className="flex-none w-full h-full relative"
                >
                  <img 
                    src={getOptimizedImageUrl(img, 600)} 
                    alt={`${property.title} - image ${index+1}`} 
                    className="w-full h-full object-cover"
                    {...getOptimalImageLoadingProps(property.images, index)}
                    onError={(e) => {
                      e.currentTarget.src = '/uploads/test-property-image.png';
                      e.currentTarget.alt = 'Property image not available';
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="flex-none w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-400 text-sm">No image available</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation arrows - only show if more than one image */}
        {property.images && property.images.length > 1 && (
          <>
            <button 
              onClick={slidePrev}
              className="absolute left-3 bottom-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft className="h-5 w-5 text-white hover:text-gray-200" />
            </button>
            <button 
              onClick={slideNext}
              className="absolute right-3 bottom-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight className="h-5 w-5 text-white hover:text-gray-200" />
            </button>
          </>
        )}
        
        {/* Status badge if exists */}
        {property.status && property.status !== 'active' && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              property.status === 'pending' ? 'bg-orange-100 text-orange-800' :
              property.status === 'sold' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </span>
          </div>
        )}
        
        {/* Featured label */}
        {property.featured && (
          <div className={`absolute ${property.status && property.status !== 'active' ? 'top-12' : 'top-3'} left-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-sm`}>
            <span className="text-white text-xs font-semibold tracking-wide">FEATURED</span>
          </div>
        )}
        
        {/* Video indicator */}
        {property.videoUrl && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-sm">
            <span className="text-white text-xs font-semibold">🎥 VIDEO TOUR</span>
          </div>
        )}
        
        {/* Favorite button */}
        <button 
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
            isFavorite 
              ? 'bg-red-500/90 text-white shadow-lg' 
              : 'bg-black/20 text-white hover:bg-black/30'
          }`}
          onClick={handleToggleFavorite}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      {/* Price and acreage */}
      <div className="px-5 py-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">{formatPrice(property.price)}</span>
          <div className="flex items-center text-gray-600">
            <span className="text-lg font-semibold">
              {Math.floor(typeof property.acreage === 'string' ? parseFloat(property.acreage) : property.acreage)}
            </span>
            <span className="text-sm text-gray-900 ml-1">acres Lot/Land for sale</span>
          </div>
        </div>
      </div>
      
      {/* Property details */}
      <div className="px-5 pb-5">
        <div className="flex items-start text-gray-600 mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold text-gray-900 line-clamp-2 leading-relaxed">
              {formatLocation(property.location)}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              <span className="font-medium">Listed by TerraNova Realty</span>
            </div>
            <div className="text-xs text-blue-600 font-medium">
              View Details
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;