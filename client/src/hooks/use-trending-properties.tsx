import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserLocation, findNearbyProperties } from '@/services/location-service';

interface Property {
  id: number;
  title: string;
  description: string;
  price: number | string;
  acreage: number | string;
  location: string;
  latitude: number;
  longitude: number;
  images: string[];
  featured?: boolean;
  state?: string;
  createdAt?: string;
  [key: string]: any; // For any other properties
}

export const useTrendingProperties = () => {
  const [userLocation, setUserLocation] = useState<{
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // Fetch the user's location on component mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setIsLoadingLocation(true);
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('Error fetching user location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    fetchLocation();
  }, []);
  
  // Fetch all properties
  const { data: allProperties = [], isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !isLoadingLocation
  });
  
  // Fetch properties specific to the user's location, if available
  const { data: cityProperties = [], isLoading: isLoadingCityProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties/trending/location', userLocation?.city],
    enabled: !!userLocation?.city
  });
  
  // Combined loading state
  const isLoading = isLoadingLocation || isLoadingProperties || isLoadingCityProperties;
  
  // Logic to determine which properties to display
  const getTrendingProperties = (): Property[] => {
    // If we have city-specific properties, use those
    if (cityProperties && cityProperties.length > 0) {
      return cityProperties;
    }
    
    // If we have user location and all properties, filter for nearby properties
    if (userLocation && allProperties && allProperties.length > 0) {
      // Find properties within 200km (adjustable)
      const nearby = findNearbyProperties(
        allProperties,
        userLocation.latitude,
        userLocation.longitude,
        200 // 200km radius
      );
      
      if (nearby.length > 0) {
        return nearby.slice(0, 8); // Limit to 8 nearby properties
      }
    }
    
    // Fallback: return featured or random properties
    if (allProperties && allProperties.length > 0) {
      // Try to get featured properties first
      const featured = allProperties.filter(p => p.featured);
      if (featured.length > 0) {
        return featured.slice(0, 8);
      }
      
      // Otherwise return random selection
      return [...allProperties]
        .sort(() => 0.5 - Math.random())
        .slice(0, 8);
    }
    
    return [];
  };
  
  // Get the trending properties
  const trendingProperties = getTrendingProperties();
  
  // Generate an appropriate section title based on available data
  const getTrendingTitle = (): string => {
    if (cityProperties && cityProperties.length > 0 && userLocation) {
      return `Trending in ${userLocation.city}, ${userLocation.state}`;
    }
    
    if (trendingProperties.length > 0 && userLocation) {
      return `Properties near ${userLocation.city}, ${userLocation.state}`;
    }
    
    return 'Currently Trending';
  };
  
  return {
    trendingProperties,
    trendingTitle: getTrendingTitle(),
    isLoading,
    userLocation
  };
}