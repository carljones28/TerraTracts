import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, MapPin, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface NearbyPropertiesProps {
  currentPropertyId: number;
  latitude?: number;
  longitude?: number;
  state?: string;
  limit?: number;
  agentName?: string;
  agentId?: number;
  showSold?: boolean;
}

interface Property {
  id: number;
  title: string;
  price: number;
  size: number;
  location: string;
  state: string;
  images: string[];
  propertyType: string;
  acreage?: number;
  latitude?: number;
  longitude?: number;
}

const adaptPropertyForCard = (property: Property) => ({
  id: property.id,
  title: property.title,
  acreage: property.acreage || property.size || 0,
  price: property.price,
  location: property.location,
  propertyType: property.propertyType,
  images: property.images,
  featured: false
});

const PropertyCardSkeleton = () => (
  <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const NearbyProperties = ({ 
  currentPropertyId, 
  latitude, 
  longitude, 
  state,
  limit = 8,
  agentName,
  agentId,
  showSold = false
}: NearbyPropertiesProps) => {
  const { data: allProperties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const nearbyProperties = allProperties
    .filter(p => {
      const isCurrent = p.id === currentPropertyId;
      if (isCurrent) return false;
      
      const propStatus = (p as any).status?.toLowerCase() || 'active';
      if (showSold) {
        return propStatus === 'sold';
      }
      return propStatus === 'active';
    })
    .map(p => {
      let distance = Infinity;
      if (latitude && longitude && p.latitude && p.longitude) {
        distance = calculateDistance(latitude, longitude, p.latitude, p.longitude);
      } else if (state && p.state === state) {
        distance = 100;
      }
      return { ...p, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8); // Changed limit to 8 for carousel

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {showSold ? (
            <BadgeCheck className="h-5 w-5 text-green-600" />
          ) : (
            <MapPin className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-xl font-bold text-gray-900">
            {showSold 
              ? `Properties Sold by ${agentName || 'Agent'}`
              : (agentName ? `Properties For Sale by ${agentName}` : 'Nearby Properties')
            }
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!nearbyProperties.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {showSold ? (
            <BadgeCheck className="h-5 w-5 text-green-600" />
          ) : (
            <MapPin className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-xl font-bold text-gray-900">
            {showSold 
              ? `Properties Sold by ${agentName || 'Agent'}`
              : (agentName ? `Properties For Sale by ${agentName}` : 'Nearby Properties')
            }
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200"
              onClick={scrollNext}
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link href={showSold ? `/agents/${agentId || 1}?tab=sold` : (agentId ? `/agents/${agentId}` : "/properties")} className="text-primary flex items-center hover:underline font-medium text-sm">
            <span>View All</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5 -ml-5">
          {nearbyProperties.map(property => (
            <div key={property.id} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.33%] xl:flex-[0_0_25%] min-w-0 pl-5">
              <Link href={`/properties/${property.id}`}>
                <PropertyCard 
                  property={adaptPropertyForCard(property)}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NearbyProperties;
