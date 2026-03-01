import React, { useState, useEffect, useCallback } from 'react';
import { Heart, ChevronLeft, ChevronRight, MoreHorizontal, EyeOff, Share2 } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { getOptimalImageLoadingProps, getOptimizedImageUrl } from '@/lib/utils';
import { getPropertyBadge, getPropertyTypeLabel, formatPropertyPrice, formatAcreage, formatLocation, generateDescriptiveHeadline } from '@/lib/propertyUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SharePropertyCard from './SharePropertyCard';

interface PropertyCardProps {
  property: {
    id: number;
    title: string;
    price: string | number;
    acreage: string | number;
    location: string;
    state?: string;
    streetAddress?: string;
    zipCode?: string;
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
    isWaterfront?: boolean;
    isMountainView?: boolean;
    agentName?: string;
    agentCompany?: string;
    priceReduced?: boolean;
    priceReductionPercent?: number;
  };
  onClick?: (propertyId: number) => void;
  layout?: 'vertical' | 'horizontal';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick, layout = 'vertical' }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const handleHide = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHidden(true);
  }, []);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  }, [isFavorite]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  if (isHidden) return null;

  const badgeText = getPropertyBadge({
    propertyType: property.propertyType || '',
    isWaterfront: property.isWaterfront,
    isMountainView: property.isMountainView,
    featured: property.featured,
    videoUrl: property.videoUrl,
    createdAt: property.createdAt,
    priceReduced: property.priceReduced,
    priceReductionPercent: property.priceReductionPercent,
    headline: generateDescriptiveHeadline(property.id),
  });
  
  const typeLabel = getPropertyTypeLabel(property.propertyType || '');

  const slideNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) {
      emblaApi.scrollNext();
      setCurrentIndex(prev => prev === property.images.length - 1 ? 0 : prev + 1);
    }
  };

  const slidePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) {
      emblaApi.scrollPrev();
      setCurrentIndex(prev => prev === 0 ? property.images.length - 1 : prev - 1);
    }
  };

  return (
    <>
    <div 
      className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white group"
      onClick={() => onClick && onClick(property.id)}
    >
      {/* Image Section */}
      <div className="relative h-52 overflow-hidden">
        <div className="embla overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {property.images && property.images.length > 0 ? (
              property.images.map((img, index) => (
                <div key={index} className="flex-none w-full h-full relative">
                  <img 
                    src={getOptimizedImageUrl(img, 600)} 
                    alt={`${property.title} - image ${index+1}`} 
                    className="w-full h-full object-cover"
                    {...getOptimalImageLoadingProps(property.images, index)}
                    onError={(e) => {
                      e.currentTarget.src = '/uploads/test-property-image.png';
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
        
        {/* Navigation arrows */}
        {property.images && property.images.length > 1 && (
          <>
            <button 
              onClick={slidePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button 
              onClick={slideNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </>
        )}
        
        {/* TOP LEFT: Property statement badge (Zillow-style) */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded">
          {badgeText}
        </div>
        
        {/* TOP RIGHT: Heart/Favorite button with glassmorphism */}
        <button 
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center transition-transform hover:scale-110 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            className={`h-5 w-5 drop-shadow-md ${isFavorite ? 'fill-blue-600 text-blue-600' : 'fill-white text-white'}`}
            strokeWidth={2}
          />
        </button>
        
        {/* Image dots indicator */}
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {property.images.slice(0, 5).map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'
                }`}
              />
            ))}
            {property.images.length > 5 && (
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            )}
          </div>
        )}
      </div>
      
      {/* Content Section (Zillow-style) */}
      <div className="p-4">
        {/* Price row with more options dropdown */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xl font-bold text-gray-900">{formatPropertyPrice(property.price)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleHide} className="flex items-center gap-2 text-sm cursor-pointer">
                <EyeOff className="h-4 w-4" />
                Hide listing
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShareModal(true); }}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Acreage and property type (bold acres like Zillow) */}
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-semibold text-gray-900">{formatAcreage(property.acreage)} acres</span>
          <span className="text-gray-400"> - </span>
          <span className="text-blue-600">{typeLabel}</span>
        </div>
        
        {/* Location/Address - Full Zillow-style format */}
        <div className="text-sm text-gray-600 line-clamp-2">
          {property.streetAddress 
            ? `${property.streetAddress}, ${property.location?.replace(`, ${property.state}`, '') || ''}, ${property.state || ''} ${property.zipCode || ''}`
            : formatLocation(property.location)
          }
        </div>
        
        {/* Agent/Realtor info - Zillow-style with company and agent name */}
        {(property.agentName || property.agentCompany) && (
          <div className="text-xs text-gray-500 mt-2 truncate">
            {property.agentCompany}{property.agentCompany && property.agentName ? ', ' : ''}{property.agentName}
          </div>
        )}
      </div>
    </div>
    
    {/* Share Modal */}
    <SharePropertyCard 
      property={{
        id: property.id,
        title: property.title,
        price: typeof property.price === 'string' ? property.price : property.price.toString(),
        location: property.location,
        state: property.state || '',
        size: typeof property.acreage === 'string' ? parseFloat(property.acreage) : property.acreage,
        propertyType: property.propertyType || 'land',
        images: Array.isArray(property.images) ? property.images : []
      }}
      isSidebarButton={false}
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
    />
    </>
  );
};

export default PropertyCard;