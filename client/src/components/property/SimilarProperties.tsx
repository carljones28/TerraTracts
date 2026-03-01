import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { formatPrice, formatAcres } from '@/lib/utils';
import PropertyCard from '@/components/property/PropertyCard';

interface SimilarPropertiesProps {
  propertyId: number;
  propertyType?: string;
  state?: string;
}

// Property data model matching our API response
interface Property {
  id: number;
  title: string;
  price: number;
  size: number;
  location: string;
  state: string;
  images: string[];
  propertyType: string;
  acreage?: number; // Added for compatibility with PropertyCard
}

// Function to convert Property to PropertyCardProps format
const adaptPropertyForCard = (property: Property) => {
  return {
    id: property.id,
    title: property.title,
    acreage: property.acreage || property.size || 0, // Use acreage if available, fallback to size
    price: property.price,
    location: property.location,
    propertyType: property.propertyType,
    images: property.images,
    featured: false // Default to not featured
  };
};

// Skeleton loader component
const PropertyCardSkeleton: React.FC = () => (
  <div className="bg-white shadow-sm rounded-lg overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const SimilarProperties: React.FC<SimilarPropertiesProps> = ({ propertyId, propertyType, state }) => {
  // Fetch all properties as a fallback
  const { data: allProperties = [], isLoading: loadingAll } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Filter out the current property from all properties
  const filteredProperties = React.useMemo(() => {
    return allProperties.filter(p => p.id !== propertyId).slice(0, 6);
  }, [allProperties, propertyId]);
  
  // Show loading state
  if (loadingAll) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Similar Properties</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // No similar properties found
  if (!filteredProperties.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Similar Properties</h2>
        <Link href="/properties" className="text-primary flex items-center hover:underline font-medium">
          <span>View All</span>
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map(property => (
          <PropertyCard 
            key={property.id} 
            property={adaptPropertyForCard(property)}
            onClick={() => window.location.href = `/properties/${property.id}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SimilarProperties;