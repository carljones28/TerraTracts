import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { Link } from 'wouter';
import PropertyCard from './PropertyCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedListingsProps {
  onViewDetails: (propertyId: number) => void;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number | string;
  acreage: number | string;
  location: string;
  amenities?: string[];
  images: string[];
  featured?: boolean;
  valueTrend?: number;
}

const FeaturedListings = ({ onViewDetails }: FeaturedListingsProps) => {
  const { data: featuredProperties = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties/featured'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
              Featured Properties
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
              AI-curated selection of premium land matched to market trends and investment potential
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollLeft}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10 border-slate-300 bg-white hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollRight}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10 border-slate-300 bg-white hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            </Button>
            <Link href="/properties">
              <Button variant="outline" className="ml-2 text-sm border-slate-300 hover:bg-slate-50">
                View All
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex-none w-72 sm:w-80">
                <div className="rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-14 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-4 w-1 bg-gray-200 rounded-full"></div>
                      <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-lg border border-red-100 mb-6">
            <p className="text-red-500 font-medium">Unable to load properties. Please try again later.</p>
          </div>
        ) : featuredProperties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mb-6">
            <p className="text-gray-500 font-medium">No featured properties available</p>
          </div>
        ) : (
          <div 
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredProperties.map((property: Property) => (
              <div 
                key={property.id} 
                className="flex-none w-72 sm:w-80 snap-start"
              >
                <PropertyCard 
                  property={property} 
                  onViewDetails={() => onViewDetails(property.id)} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedListings;
