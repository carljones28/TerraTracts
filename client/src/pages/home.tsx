import { useCallback } from 'react';
import { useLocation } from 'wouter';
import ZillowHero from '@/components/home/ZillowHero';
import PropertyCategories from '@/components/home/PropertyCategories';
import FeaturedListings from '@/components/home/FeaturedListings';
import TrendingProperties from '@/components/home/TrendingProperties';
import AIFeatures from '@/components/home/AIFeatures';
import RecentlyViewed from '@/components/home/RecentlyViewed';
import SimpleHomepageMap from '@/components/home/SimpleHomepageMap';
import CallToAction from '@/components/home/CallToAction';
import { updateMapLocation } from '@/lib/mapUtils';

// Define interface for AISearchResponse
interface AISearchResponse {
  properties: any[];
  interpretation?: {
    intent: string;
    extractedCriteria: {
      priceRange?: string;
      location?: string;
      propertyType?: string;
      size?: string;
      features?: string[];
    };
    suggestedFilters?: string[];
  };
}

const Home = () => {
  const [_, navigate] = useLocation();
  
  const handleViewPropertyDetails = useCallback((propertyId: number) => {
    navigate(`/properties/${propertyId}`);
  }, [navigate]);
  
  // Handle search results from ZillowHero search bar
  const handleSearchResults = useCallback((results: AISearchResponse) => {
    if (results.properties.length > 0) {
      // Store search results in sessionStorage to pass to properties page
      sessionStorage.setItem('searchResults', JSON.stringify(results));
      
      // Navigate to properties page to display all results
      navigate('/properties?search=true');
    }
  }, [navigate]);
  
  // Handle map location change from ZillowHero search bar
  const handleMapLocationChange = useCallback((location: { lat: number; lng: number; zoom: number }) => {
    try {
      // Use the utility function instead of a ref
      updateMapLocation(location);
    } catch (error) {
      console.error("Error updating map location:", error);
    }
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Zillow-style Hero with Search Bar and Geolocation */}
      <ZillowHero 
        onViewPropertyDetails={handleViewPropertyDetails} 
        onMapLocationChange={handleMapLocationChange}
        onSearchResults={handleSearchResults}
      />
      
      {/* Featured Properties Carousel */}
      <FeaturedListings onViewDetails={handleViewPropertyDetails} />
      
      {/* Trending Properties Section with Location-Based Tabs */}
      <TrendingProperties onViewDetails={handleViewPropertyDetails} />
      
      {/* Property Categories Carousel */}
      <PropertyCategories />
      
      {/* Map View Section */}
      <SimpleHomepageMap onPropertySelect={handleViewPropertyDetails} />
      
      {/* Recently Viewed Properties */}
      <RecentlyViewed onViewDetails={handleViewPropertyDetails} />
      
      {/* AI Features Section */}
      <AIFeatures />
      
      {/* Call to Action */}
      <CallToAction />
    </div>
  );
};

export default Home;
