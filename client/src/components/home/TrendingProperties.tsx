import { useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Loader2, TrendingUp, Navigation } from 'lucide-react';
import PropertyCard from './PropertyCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserLocation, findNearbyProperties, calculateDistance } from '@/services/location-service';

interface TrendingPropertiesProps {
  onViewDetails: (propertyId: number) => void;
}

// Base locations for Texas (will be replaced by nearby cities if possible)
const DEFAULT_TEXAS_LOCATIONS = [
  'Dallas, TX', 
  'Austin, TX', 
  'Houston, TX',
  'Fort Worth, TX'
];

const TrendingProperties = ({ onViewDetails }: TrendingPropertiesProps) => {
  // User's location data
  const [userLocation, setUserLocation] = useState<{
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    country: string;
  } | null>(null);
  
  // Loading state for location data
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // Nearby cities based on user location
  const [nearbyCities, setNearbyCities] = useState<string[]>(DEFAULT_TEXAS_LOCATIONS);
  
  // Selected location tab
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  // Fetch user location on component mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setIsLoadingLocation(true);
        const location = await getUserLocation();
        setUserLocation(location);
        
        // Set the initially selected location to user's current city
        setSelectedLocation(`${location.city}, ${location.state}`);
        
        // Get nearby cities based on our database
        fetchNearbyCities(location);
      } catch (error) {
        console.error('Error fetching user location:', error);
        // Set a default location if user location can't be determined
        setSelectedLocation(DEFAULT_TEXAS_LOCATIONS[0]);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    fetchLocation();
  }, []);
  
  // Fetch all properties to find nearby cities
  const { data: allProperties = [] } = useQuery<any[]>({
    queryKey: ['/api/properties'],
    enabled: !!userLocation // Only fetch when we have user location
  });
  
  // Function to find nearby cities from our property database
  const fetchNearbyCities = useCallback((location: any) => {
    if (!location || !allProperties || allProperties.length === 0) {
      return;
    }
    
    // Get unique city+state combinations from properties
    const uniqueLocations = new Set<string>();
    allProperties.forEach((property: any) => {
      if (property.location) {
        // Extract city and state from property location
        const parts = property.location.split(',');
        if (parts.length >= 2) {
          const city = parts[0].trim();
          const state = parts[1].trim();
          uniqueLocations.add(`${city}, ${state}`);
        }
      }
    });
    
    // Convert to array and calculate distances
    const locationsWithDistance = Array.from(uniqueLocations)
      .map((locationString) => {
        // Find a property in this location to get its coordinates
        const sampleProperty = allProperties.find((p: any) => p.location.includes(locationString));
        if (!sampleProperty) return null;
        
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          sampleProperty.latitude,
          sampleProperty.longitude
        );
        
        return {
          location: locationString,
          distance
        };
      })
      .filter(item => item !== null)
      .sort((a: any, b: any) => a.distance - b.distance);
    
    // Get user's current city and ensure it's in the format we need
    const userCity = `${location.city}, ${location.state}`;
    
    // Start with the user's city
    const nearby: string[] = [userCity];
    
    // Add unique nearby cities from our database, excluding the user's city
    locationsWithDistance
      .filter((item: any) => item.location !== userCity) // Filter out the user's city to avoid duplicates
      .slice(0, 3) // Get the next 3 closest locations (user's city + 3 nearby = 4 total)
      .forEach((item: any) => {
        // Only add if it's not already in the list (avoid duplicates)
        if (!nearby.includes(item.location)) {
          nearby.push(item.location);
        }
      });
    
    // If we don't have 4 unique nearby cities, add from defaults
    if (nearby.length < 4) {
      DEFAULT_TEXAS_LOCATIONS.forEach(defaultLoc => {
        // Only add default locations that aren't already in our list
        if (nearby.length < 4 && !nearby.includes(defaultLoc)) {
          nearby.push(defaultLoc);
        }
      });
    }
    
    // Safety check: ensure we have no more than 4 items
    while (nearby.length > 4) {
      nearby.pop();
    }
    
    setNearbyCities(nearby);
  }, [allProperties]);
  
  // Fetch properties trending in the selected location
  const {
    data: trendingProperties = [],
    isLoading,
    error,
    refetch
  } = useQuery<any[]>({
    queryKey: ['/api/properties/trending/location', selectedLocation],
    queryFn: async () => {
      const encodedLocation = encodeURIComponent(selectedLocation);
      const response = await fetch(`/api/properties/trending/location/${encodedLocation}`);
      if (!response.ok) {
        throw new Error('Failed to load trending properties');
      }
      return response.json();
    },
    enabled: !!selectedLocation // Only fetch when we have a selected location
  });
  
  // Change location and refetch properties
  const handleLocationChange = useCallback((location: string) => {
    setSelectedLocation(location);
  }, []);
  
  // Refetch when location changes
  useEffect(() => {
    if (selectedLocation) {
      refetch();
    }
  }, [selectedLocation, refetch]);
  
  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <TrendingUp className="h-5 w-5 text-primary mr-2" />
              Currently Trending in {selectedLocation}
            </h2>
            <p className="text-gray-600">
              Discover the most sought-after properties in this area
            </p>
            {userLocation && (
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                <span>Based on your location: {userLocation.city}, {userLocation.state}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            {nearbyCities.map((location) => (
              <Button 
                key={location}
                variant={selectedLocation === location ? "default" : "outline"}
                size="sm"
                onClick={() => handleLocationChange(location)}
                className={`flex items-center px-4 py-2 font-medium transition-all duration-200 ${
                  selectedLocation === location 
                    ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700 border-blue-600" 
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
                }`}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {location}
              </Button>
            ))}
          </div>
        </div>
        
        {isLoading || isLoadingLocation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">Unable to load trending properties. Please try again later.</p>
          </div>
        ) : trendingProperties.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No trending properties found in this area right now.</p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => {
                const randomLocation = nearbyCities[Math.floor(Math.random() * nearbyCities.length)];
                handleLocationChange(randomLocation);
              }}
            >
              Try another location
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProperties.map((property: any) => (
              <PropertyCard 
                key={property.id}
                property={property}
                onViewDetails={() => onViewDetails(property.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingProperties;