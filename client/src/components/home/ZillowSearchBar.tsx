import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, X } from 'lucide-react';
import { performAISearch } from '@/lib/openai';
import { useLocation } from 'wouter';
import { geocodeLocation } from '@/lib/mapUtils';
import SearchSuggestions, { LocationSuggestion } from './SearchSuggestions';
import { fetchLocationSuggestions, getGeocodeTypeFromSuggestion } from '@/lib/geocodingSuggestions';
import useDebounce from '@/hooks/use-debounce';

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

interface ZillowSearchBarProps {
  onSearchResults?: (results: AISearchResponse) => void;
  mapboxApiKey?: string;
}

const ZillowSearchBar = ({ onSearchResults, mapboxApiKey }: ZillowSearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Fetch MapBox API key if not passed as prop
  const [mapboxToken, setMapboxToken] = useState<string | undefined>(mapboxApiKey);
  
  useEffect(() => {
    if (!mapboxToken) {
      // Fetch MapBox API key from config endpoint if not provided
      fetch('/api/config')
        .then(response => response.json())
        .then(data => {
          if (data.mapboxApiKey) {
            setMapboxToken(data.mapboxApiKey);
          }
        })
        .catch(error => console.error('Error fetching API key:', error));
    }
  }, [mapboxToken]);
  
  // Fetch suggestions when search query changes
  useEffect(() => {
    const getSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !mapboxToken) {
        setSuggestions([]);
        return;
      }
      
      setIsLoadingSuggestions(true);
      try {
        const results = await fetchLocationSuggestions(debouncedQuery, mapboxToken);
        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    
    getSuggestions();
  }, [debouncedQuery, mapboxToken]);
  
  // Handle clicks outside the search bar to hide suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle suggestion selection - geocode FIRST, then navigate
  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    setSearchQuery(suggestion.placeName);
    setShowSuggestions(false);
    setIsSearching(true);
    
    try {
      // Save the search query
      sessionStorage.setItem('lastSearch', suggestion.placeName);
      
      // CRITICAL: Geocode BEFORE navigation to ensure sessionStorage is set when properties page loads
      const geocodeType = getGeocodeTypeFromSuggestion(suggestion);
      const geocodeResult = await geocodeLocation(suggestion.placeName, geocodeType);
      
      if (geocodeResult) {
        console.log(`Selected suggestion "${suggestion.placeName}" geocoded to:`, geocodeResult);
        
        // Store geocoded location data BEFORE navigation
        const geocodedLocation = {
          longitude: geocodeResult.longitude,
          latitude: geocodeResult.latitude,
          placeName: geocodeResult.placeName,
          type: geocodeResult.type,
          state: geocodeResult.state,
          zoom: geocodeResult.zoom || 10
        };
        
        // Handle bounding box if available
        if (geocodeResult.bbox && Array.isArray(geocodeResult.bbox) && geocodeResult.bbox.length === 4) {
          const validBbox = geocodeResult.bbox.every((coord: number) => 
            !isNaN(coord) && isFinite(coord)
          );
          
          if (validBbox) {
            Object.assign(geocodedLocation, {
              bbox: geocodeResult.bbox,
              useBbox: true
            });
            
            sessionStorage.setItem('pendingMapBounds', JSON.stringify(geocodeResult.bbox));
          }
        }
        
        // Store the complete location object BEFORE navigation
        sessionStorage.setItem('geocodedLocation', JSON.stringify(geocodedLocation));
        console.log(`Saved geocoded location for selected suggestion to be used by map`);
      } else {
        console.log(`Couldn't geocode "${suggestion.placeName}", will use fallback search`);
      }
      
      // Navigate AFTER geocoding is complete so sessionStorage has the data
      navigate(`/properties?q=${encodeURIComponent(suggestion.placeName)}`);
    } catch (error) {
      console.error("Error processing suggestion:", error);
      toast({
        title: "Search failed",
        description: "Unable to process your selection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // Save the search query to session storage for the map to use
    try {
      sessionStorage.setItem('lastSearch', searchQuery);
    } catch (storageError) {
      console.error("Unable to save search to session storage:", storageError);
    }
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    try {
      // CRITICAL: Geocode BEFORE navigation so sessionStorage is set when properties page loads
      const geocodeResult = await geocodeLocation(searchQuery);
      
      if (geocodeResult) {
        console.log(`Geocoded "${searchQuery}" to:`, geocodeResult);
        
        // Store the geocoded data in sessionStorage BEFORE navigation
        const geocodedLocationData: Record<string, any> = {
          longitude: geocodeResult.longitude,
          latitude: geocodeResult.latitude,
          placeName: geocodeResult.placeName,
          type: geocodeResult.type,
          state: geocodeResult.state,
          zoom: geocodeResult.zoom || 10
        };
        
        // If we have a valid bounding box, add it with a flag to use it
        if (geocodeResult.bbox && Array.isArray(geocodeResult.bbox) && geocodeResult.bbox.length === 4) {
          const validBbox = geocodeResult.bbox.every((coord: number) => 
            !isNaN(coord) && isFinite(coord)
          );
          
          if (validBbox) {
            geocodedLocationData.bbox = geocodeResult.bbox;
            geocodedLocationData.useBbox = true;
            sessionStorage.setItem('pendingMapBounds', JSON.stringify(geocodeResult.bbox));
          }
        }
        
        // Store the complete location object BEFORE navigation
        sessionStorage.setItem('geocodedLocation', JSON.stringify(geocodedLocationData));
        console.log(`Saved geocoded location for "${searchQuery}" to be used by map`);
      } else {
        console.log(`Couldn't geocode "${searchQuery}", will use fallback search`);
      }
      
      // Navigate AFTER geocoding is complete
      navigate(`/properties?q=${encodeURIComponent(searchQuery)}`);
    } catch (error) {
      console.error("Error performing search:", error);
      toast({
        title: "Search failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Clear the search input
  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="zillow-search-bar w-full max-w-xl mx-auto relative" ref={searchBarRef}>
      <div className="bg-white rounded-full shadow-xl overflow-hidden flex border-2 border-gray-300 hover:shadow-2xl hover:border-blue-400 transition-all duration-300">
        <form onSubmit={handleSubmit} className="relative flex w-full items-center">
          <div className="absolute left-4 text-primary">
            <Search className="h-5 w-5" />
          </div>
          
          <input 
            type="text" 
            placeholder="City, ZIP, Address" 
            className="w-full h-14 py-0 pl-14 pr-14 text-base text-black font-medium border-0 focus:outline-none focus:ring-0 placeholder-gray-500"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
          />
          
          {searchQuery && (
            <button
              type="button"
              className="absolute right-24 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={handleClearSearch}
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          <button 
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="h-14 px-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base font-bold rounded-r-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="font-bold">Search</span>
            )}
          </button>
        </form>
      </div>
      
      <SearchSuggestions
        suggestions={suggestions}
        isLoading={isLoadingSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
        visible={showSuggestions && searchQuery.length >= 2}
      />
    </div>
  );
};

export default ZillowSearchBar;