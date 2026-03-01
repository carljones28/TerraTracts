import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import useDebounce from '@/hooks/use-debounce';
import { drawSearchBoundary, clearSearchBoundary } from '@/lib/mapBoundary';

// Filter types
export interface PropertyFilters {
  propertyTypes: string[];
  hasResidence: 'yes' | 'no' | 'either';
  bedrooms: number;
  bathrooms: number;
  squareFeet: { min: number | null; max: number | null };
  activities: string[];
  listingType: string[];
  status: string[];
  priceReduction: string;
  dateListed: string;
  keywords: string;
  includesMineralRights: boolean;
  ownerFinancing: boolean;
  propertyVideo: boolean;
  virtualTour: boolean;
  terrainType: string[];
  searchQuery: string;
  priceRange: {
    min: number | null;
    max: number | null;
  };
  acreageRange: {
    min: number | null;
    max: number | null;
  };
  // Legacy support
  propertyType: string | null;
  features: string[];
  hasVideo: boolean;
}

export interface PropertyFilterUpdate {
  type: 'status' | 'propertyType' | 'propertyTypes' | 'priceRange' | 'acreageRange' | 'features' | 'terrainType' | 'hasVideo' | 'searchQuery' | 'activities' | 'hasResidence' | 'bedrooms' | 'bathrooms' | 'propertyVideo' | 'includesMineralRights' | 'ownerFinancing' | 'virtualTour' | 'comprehensive';
  value: any;
}

// Helper functions for price range
const parsePriceRange = (range: string): { min: number | null; max: number | null } => {
  if (range === 'any') {
    return { min: null, max: null };
  }
  
  if (range.endsWith('+')) {
    const min = parseInt(range.slice(0, -1));
    return { min, max: null };
  }
  
  const [min, max] = range.split('-').map(val => parseInt(val));
  return { min, max };
};

// Helper function for acreage range
const parseAcreageRange = (range: string): { min: number | null; max: number | null } => {
  if (range === 'any') {
    return { min: null, max: null };
  }
  
  if (range.endsWith('+')) {
    const min = parseInt(range.slice(0, -1));
    return { min, max: null };
  }
  
  const [min, max] = range.split('-').map(val => parseInt(val));
  return { min, max };
};

// Interface for location suggestions
interface LocationSuggestion {
  id: string;
  placeName: string;
  mainText: string;
  secondaryText: string;
  type: 'city' | 'county' | 'neighborhood' | 'address' | 'region' | 'place';
  center: [number, number];
  bbox?: [number, number, number, number];
  state: string;
}

// Function to fetch suggestions from Mapbox API
async function fetchLocationSuggestions(
  query: string,
  mapboxToken: string,
  limit: number = 5
): Promise<LocationSuggestion[]> {
  try {
    // Encode query for URL
    const encodedQuery = encodeURIComponent(query);
    
    // Create URL for Mapbox Geocoding API
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&types=place,district,locality,neighborhood,address,region&limit=${limit}&language=en`;
    
    const response = await fetch(geocodingUrl);
    
    if (!response.ok) {
      throw new Error(`Geocoding API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      return [];
    }
    
    return data.features.map((feature: any) => {
      const { id, place_type, text, place_name, context = [] } = feature;
      
      let type: 'city' | 'county' | 'neighborhood' | 'address' | 'region' | 'place' = 'place';
      
      // Map place_type to our types
      if (place_type.includes('region')) {
        type = 'region';
      } else if (place_type.includes('place')) {
        type = 'city';
      } else if (place_type.includes('district')) {
        type = 'county';
      } else if (place_type.includes('neighborhood')) {
        type = 'neighborhood';
      } else if (place_type.includes('address')) {
        type = 'address';
      }
      
      // Extract state from context
      let state = '';
      const stateItem = context.find((item: any) => item.id.startsWith('region'));
      if (stateItem) {
        state = stateItem.text;
      }
      
      // Format display text
      let mainText = text;
      let secondaryText = '';
      
      // For non-region types, extract and format the context
      if (type !== 'region') {
        secondaryText = context
          .map((item: any) => item.text)
          .filter(Boolean)
          .join(', ');
      }
      
      return {
        id,
        placeName: place_name,
        mainText,
        secondaryText,
        type,
        center: feature.center,
        bbox: feature.bbox,
        state
      };
    });
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
}

// Function to geocode a location
async function geocodeLocation(locationString: string, mapboxToken: string) {
  try {
    const encodedLocation = encodeURIComponent(locationString);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log(`No geocoding results found for "${locationString}"`);
      return null;
    }
    
    // Get the best feature
    const feature = data.features[0];
    
    // Extract state from context if available
    let state = '';
    if (feature.context) {
      const stateContext = feature.context.find((c: any) => c.id.startsWith('region'));
      if (stateContext) {
        state = stateContext.text;
      }
    }
    
    // Determine appropriate zoom level based on result type
    let zoom = 10;
    if (feature.place_type.includes('region')) {
      zoom = 6;
    } else if (feature.place_type.includes('place')) {
      zoom = 10;
    } else if (feature.place_type.includes('address')) {
      zoom = 15;
    }
    
    // Return formatted location data with zoom and state info
    return {
      longitude: feature.center[0],
      latitude: feature.center[1],
      placeName: feature.place_name,
      type: feature.place_type[0],
      bbox: feature.bbox,
      zoom,
      state
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

interface ExactSearchBarProps {
  onSearch?: (query: string, coordinates?: { lat: number; lng: number }) => void;
  propertyCount?: number;
  onFilterChange?: (filterUpdate: PropertyFilterUpdate) => void;
  showMapProp?: boolean;
  onMapViewChange?: (showMap: boolean) => void;
  currentFilters?: PropertyFilters;
  currentLocation?: string;
  filteredProperties?: any[];
  visiblePropertyCount?: number;
  initialQuery?: string;
}

const ExactSearchBar = ({ 
  onSearch,
  propertyCount = 143,
  onFilterChange,
  showMapProp,
  onMapViewChange,
  currentLocation,
  filteredProperties,
  visiblePropertyCount,
  initialQuery
}: ExactSearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  
  // Sync searchQuery with initialQuery prop when it changes
  useEffect(() => {
    if (initialQuery && initialQuery !== searchQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);
  
  // Use parent's map state if provided, otherwise use local state
  const [localShowMap, setLocalShowMap] = useState(true);
  const showMap = showMapProp !== undefined ? showMapProp : localShowMap;
  
  // Custom handler that updates both local state and parent state
  const handleMapToggle = (value: boolean) => {
    console.log('ExactSearchBar - Toggle map to:', value);
    setLocalShowMap(value);
    if (onMapViewChange) {
      onMapViewChange(value);
    }
  };
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isFieldFocused, setIsFieldFocused] = useState(false);
  const [showAllPropertyTypes, setShowAllPropertyTypes] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState<'yes' | 'no' | 'either'>('either');
  const [selectedBedrooms, setSelectedBedrooms] = useState<number>(0);
  const [selectedBathrooms, setSelectedBathrooms] = useState<number>(0);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  
  // Enhanced price filter states
  const [priceFilterMode, setPriceFilterMode] = useState<'list' | 'monthly'>('list');
  const [customPriceRange, setCustomPriceRange] = useState<{min: number | null, max: number | null}>({min: null, max: null});
  const [monthlyPaymentRange, setMonthlyPaymentRange] = useState<{min: number | null, max: number | null}>({min: null, max: null});
  const [showPurchasabilityModal, setShowPurchasabilityModal] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>('20');
  const [creditScore, setCreditScore] = useState<string>('good');
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedTerrainTypes, setSelectedTerrainTypes] = useState<string[]>([]);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [_, navigate] = useLocation();
  
  // Filter state
  const [filters, setFilters] = useState<PropertyFilters>({
    propertyTypes: [],
    hasResidence: 'either',
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: { min: null, max: null },
    activities: [],
    listingType: [],
    status: [],
    priceReduction: '',
    dateListed: '',
    keywords: '',
    includesMineralRights: false,
    ownerFinancing: false,
    propertyVideo: false,
    virtualTour: false,
    terrainType: [],
    searchQuery: '',
    priceRange: { min: null, max: null },
    acreageRange: { min: null, max: null },
    propertyType: null,
    features: [],
    hasVideo: false
  });
  
  // Fetch MapBox API key
  const { data: configData } = useQuery({
    queryKey: ['/api/config'],
    staleTime: 3600000, // 1 hour
  });
  
  const mapboxToken = (configData as any)?.mapboxApiKey || '';
  
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
  
  // Load search history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          // Keep only the last 5 searches
          setSearchHistory(parsedHistory.slice(0, 5));
        }
      } else {
        // Demo values if no history
        setSearchHistory(['Dallas, TX', 'Los Angeles, CA', 'Florida']);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
      // Default demo values
      setSearchHistory(['Dallas, TX', 'Los Angeles, CA', 'Florida']);
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFieldFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ExactSearchBar - Form submitted with query:', searchQuery);
    
    if (!searchQuery.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a location to search for properties.",
        variant: "destructive"
      });
      return;
    }
    
    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
    setSearchHistory(newHistory);
    try {
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    // Geocode first to get coordinates for "nearest properties" fallback
    let searchCoordinates: { lat: number; lng: number } | undefined;
    
    if (mapboxToken) {
      try {
        const geocodeResult = await geocodeLocation(searchQuery, mapboxToken);
        if (geocodeResult) {
          searchCoordinates = { lat: geocodeResult.latitude, lng: geocodeResult.longitude };
          console.log(`Geocoded "${searchQuery}" to:`, searchCoordinates);
        }
      } catch (error) {
        console.error('Geocoding failed, proceeding without coordinates:', error);
      }
    }
    
    // Trigger search with coordinates for "nearest properties" fallback
    if (onSearch) {
      console.log('ExactSearchBar - Triggering search callback with query:', searchQuery, 'coordinates:', searchCoordinates);
      onSearch(searchQuery, searchCoordinates);
    } else {
      console.error('ExactSearchBar - No onSearch callback provided');
    }
    
    // Skip map navigation if we don't have a mapbox token
    if (!mapboxToken) {
      console.warn('MapBox token not available - search will work but no map centering');
      setIsSearching(false);
      return;
    }
    
    try {
      // Geocode the location for map positioning
      const geocodeResult = await geocodeLocation(searchQuery, mapboxToken);
      
      if (geocodeResult) {
        console.log(`Flying map to "${searchQuery}":`, geocodeResult);
        
        // Store geocoded location data with proper typing
        const geocodedLocation: {
          longitude: number;
          latitude: number;
          placeName: string;
          type: string;
          state: string;
          zoom: number;
          bbox?: number[];
          useBbox?: boolean;
        } = {
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
            geocodedLocation.bbox = geocodeResult.bbox;
            geocodedLocation.useBbox = true;
            
            // Store bbox data separately for safety
            sessionStorage.setItem('pendingMapBounds', JSON.stringify(geocodeResult.bbox));
          }
        }
        
        // Always fetch + draw the boundary — the boundary module queues if map isn't ready yet
        drawSearchBoundary(geocodeResult.placeName);

        // Instead of reloading the page, we'll directly fly to the location
        const mapInstance = (window as any).__simpleMap;
        
        if (mapInstance) {
          console.log('Flying to location:', geocodedLocation);
          
          // Use flyTo for smooth, glitch-free transition
          mapInstance.flyTo({
            center: [geocodedLocation.longitude, geocodedLocation.latitude],
            zoom: geocodedLocation.zoom,
            duration: 800, // Smooth duration for glitch-free transition
            essential: true,
            animate: true,
            curve: 1.42, // Standard smooth curve
            speed: 1.5, // Moderate speed for smoothness
            screenSpeed: 1.2, // Moderate screen speed
          });
          
          // If we have a valid bbox, fit to bounds instead
          if (geocodedLocation.bbox && geocodedLocation.useBbox) {
            console.log('Fitting map to bbox:', geocodedLocation.bbox);
            const bounds = [
              [geocodedLocation.bbox[0], geocodedLocation.bbox[1]], // Southwest
              [geocodedLocation.bbox[2], geocodedLocation.bbox[3]]  // Northeast
            ];
            
            // Use smooth transition for glitch-free experience
            mapInstance.fitBounds(bounds, {
              padding: { top: 80, bottom: 80, left: 80, right: 80 }, // Adequate padding for smooth transition
              duration: 800, // Smooth duration for glitch-free transition
              essential: true, // Ensures the animation completes
              animate: true,
              maxZoom: 15, // Limit maximum zoom
              linear: false, // Use easing
            });
          }

          // Fetch properties for this location
          try {
            const fetchPropertiesNearFn = (window as any).__fetchPropertiesNear;
            if (typeof fetchPropertiesNearFn === 'function') {
              const radiusMiles = 20;
              console.log(`Using exposed fetchPropertiesNear function to load properties within ${radiusMiles} miles`);
              fetchPropertiesNearFn(geocodedLocation.longitude, geocodedLocation.latitude, radiusMiles);
            }
          } catch (error) {
            console.error('Error fetching properties for location:', error);
          }
        } else {
          console.warn('Map instance not found, storing location in session storage for next page load');
          // Fall back to storing in session storage
          sessionStorage.setItem('geocodedLocation', JSON.stringify(geocodedLocation));
          // Don't reload the page as we've already triggered a search
        }
      } else {
        toast({
          title: "Location not found",
          description: "We couldn't find that location. Please try a different search.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Something went wrong with your search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const selectedLocation = suggestion.placeName;
    console.log('ExactSearchBar - Suggestion selected:', selectedLocation);
    
    // Update search field with selected location
    setSearchQuery(selectedLocation);
    setShowSuggestions(false);
    
    // Get coordinates from the suggestion for "nearest properties" fallback
    const searchCoordinates = suggestion.center 
      ? { lat: suggestion.center[1], lng: suggestion.center[0] } // Note: Mapbox returns [lng, lat]
      : undefined;
    
    // CRITICAL FIX: Trigger search IMMEDIATELY with coordinates
    // This ensures search is triggered without waiting for any async operations
    if (onSearch) {
      console.log('ExactSearchBar - Triggering search from suggestion with:', selectedLocation, 'coordinates:', searchCoordinates);
      onSearch(selectedLocation, searchCoordinates);
    } else {
      console.error('ExactSearchBar - No onSearch callback provided!');
      toast({
        title: "Search unavailable",
        description: "Search function not connected. Please try typing and pressing Enter.",
        variant: "destructive"
      });
      return;
    }
    
    // Now handle map and geocoding asynchronously WITHOUT blocking the search
    handleMapUpdateForLocation(suggestion);
  };
  
  // Separate function to handle map updates asynchronously without blocking search
  const handleMapUpdateForLocation = (suggestion: LocationSuggestion) => {
    try {
      // Create location data for storage
      const locationData = {
        longitude: suggestion.center[0],
        latitude: suggestion.center[1],
        placeName: suggestion.placeName,
        type: suggestion.type,
        state: suggestion.state,
        zoom: suggestion.type === 'region' ? 6 : suggestion.type === 'place' || suggestion.type === 'city' ? 10 : 14,
        bbox: suggestion.bbox,
        useBbox: Boolean(suggestion.bbox && suggestion.bbox.length === 4)
      };
      
      // Get the map instance
      const mapInstance = (window as any).__simpleMap;
      
      // Always fetch boundary — the boundary module queues if MapBox isn't ready yet
      drawSearchBoundary(suggestion.placeName);

      if (!mapInstance) {
        // FALLBACK: Map not loaded yet - store location for when it does load
        console.warn('Map instance not ready yet, storing location for later');
        
        // Store in both global and sessionStorage (SimpleMap checks both)
        (window as any).__pendingMapLocation = {
          lat: locationData.latitude,
          lng: locationData.longitude,
          zoom: locationData.zoom
        };
        sessionStorage.setItem('selectedMapLocation', JSON.stringify({
          lat: locationData.latitude,
          lng: locationData.longitude,
          zoom: locationData.zoom
        }));
        
        // Store bbox separately if available
        if (locationData.bbox) {
          sessionStorage.setItem('pendingMapBounds', JSON.stringify(locationData.bbox));
        }
        
        console.log('Location stored for pending map initialization:', locationData.placeName);
        return;
      }
      
      console.log('Map zoom triggered for:', suggestion.placeName);
      
      // Clear any pending location data since we're applying it now
      (window as any).__pendingMapLocation = null;
      sessionStorage.removeItem('selectedMapLocation');
      sessionStorage.removeItem('pendingMapBounds');
      
      // If we have a bounding box, use fitBounds for better results
      if (locationData.useBbox && locationData.bbox) {
        console.log('Fitting map to bbox:', locationData.bbox);
        
        // Create bounds array in correct format: [[west, south], [east, north]]
        const bounds: [[number, number], [number, number]] = [
          [locationData.bbox[0], locationData.bbox[1]], // Southwest corner
          [locationData.bbox[2], locationData.bbox[3]]  // Northeast corner
        ];
        
        // Fit bounds with animation - map's moveend event will trigger property updates
        mapInstance.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          duration: 800,
          essential: true,
          maxZoom: 15
        });
      } else {
        // No bbox, just fly to center point
        console.log('Flying to center:', suggestion.center, 'zoom:', locationData.zoom);
        
        // Fly to location - map's moveend event will trigger property updates
        mapInstance.flyTo({
          center: [locationData.longitude, locationData.latitude],
          zoom: locationData.zoom,
          duration: 800,
          essential: true
        });
      }
      
      // Properties will be automatically updated by SimpleMap's moveend event handler
      console.log('Map animation started - properties will update when animation completes');
      
    } catch (error) {
      console.error('Error updating map for suggestion:', error);
      toast({
        title: "Map update failed",
        description: "Could not zoom to the selected location. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Function to extract state from location string or filtered properties
  const getCurrentState = () => {
    // First try to get state from current location prop
    if (currentLocation) {
      // Check for state abbreviations at the end
      const stateMatch = currentLocation.match(/,\s*([A-Z]{2})$/);
      if (stateMatch) {
        return stateMatch[1];
      }
      
      // Check for full state names
      const stateNames: { [key: string]: string } = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
      };
      
      for (const [fullName, abbrev] of Object.entries(stateNames)) {
        if (currentLocation.toLowerCase().includes(fullName.toLowerCase())) {
          return abbrev;
        }
      }
    }
    
    // Fallback to analyzing filtered properties for most common state
    if (filteredProperties && filteredProperties.length > 0) {
      const stateCounts: { [key: string]: number } = {};
      
      filteredProperties.forEach(property => {
        if (property.state) {
          stateCounts[property.state] = (stateCounts[property.state] || 0) + 1;
        }
      });
      
      // Return the most common state
      const mostCommonState = Object.entries(stateCounts)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (mostCommonState) {
        return mostCommonState[0];
      }
    }
    
    // Default fallback
    return 'TX';
  };

  // Function to get the display count for properties
  const getDisplayCount = () => {
    if (visiblePropertyCount !== undefined) {
      return visiblePropertyCount;
    }
    return propertyCount;
  };

  // Function to generate dynamic location text
  const getLocationText = () => {
    const state = getCurrentState();
    const count = getDisplayCount();
    const startIndex = 1;
    const endIndex = Math.min(14, count);
    
    if (currentLocation) {
      // If we have a specific location, use it
      return `Land for Sale in ${currentLocation}: ${startIndex} - ${endIndex} of ${count} listings`;
    } else {
      // Use state as fallback
      const stateNames: { [key: string]: string } = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
      };
      
      const stateName = stateNames[state] || state;
      return `Land for Sale in ${stateName}: ${startIndex} - ${endIndex} of ${count} listings`;
    }
  };
  
  // States for managing dropdown visibility
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypesDropdown, setShowTypesDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showAcresDropdown, setShowAcresDropdown] = useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  
  // Refs for all dropdown elements
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const typesDropdownRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const acresDropdownRef = useRef<HTMLDivElement>(null);
  const filtersDropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside of any dropdown to close it - DISABLED TO PREVENT UNWANTED CLOSING
  // Dropdowns will only close via explicit user actions (Apply/Clear buttons or clicking dropdown toggle)
  useEffect(() => {
    // Temporarily disabled to fix filter dropdown closing issue
    // Users can click dropdown toggles or Apply/Clear to close dropdowns
    return () => {}; // No-op cleanup
  }, []);
  
  const handleFilterClick = (filterName: string) => {
    // Close only other dropdowns, not the one being toggled
    const closeOtherDropdowns = (exceptDropdown: string) => {
      if (exceptDropdown !== 'status') setShowStatusDropdown(false);
      if (exceptDropdown !== 'types') setShowTypesDropdown(false);
      if (exceptDropdown !== 'price') setShowPriceDropdown(false);
      if (exceptDropdown !== 'acres') setShowAcresDropdown(false);
      if (exceptDropdown !== 'filters') setShowFiltersDropdown(false);
    };
    
    // Toggle the clicked dropdown
    if (filterName === 'For Sale') {
      closeOtherDropdowns('status');
      setShowStatusDropdown(!showStatusDropdown);
    } else if (filterName === 'All Types') {
      closeOtherDropdowns('types');
      setShowTypesDropdown(!showTypesDropdown);
    } else if (filterName === 'Price' || filterName === 'Any Price') {
      closeOtherDropdowns('price');
      setShowPriceDropdown(!showPriceDropdown);
    } else if (filterName === 'Any Acres') {
      closeOtherDropdowns('acres');
      setShowAcresDropdown(!showAcresDropdown);
    } else if (filterName === 'Filters') {
      closeOtherDropdowns('filters');
      setShowFiltersDropdown(!showFiltersDropdown);
    }
  };
  
  // Helper function to update filters and notify parent
  const updateFilters = (filterUpdate: PropertyFilterUpdate) => {
    const updatedFilters = { ...filters };
    
    switch (filterUpdate.type) {
      case 'status':
        updatedFilters.status = filterUpdate.value;
        break;
      case 'propertyType':
        updatedFilters.propertyType = filterUpdate.value;
        break;
      case 'propertyTypes':
        updatedFilters.propertyTypes = filterUpdate.value;
        break;
      case 'priceRange':
        updatedFilters.priceRange = filterUpdate.value;
        break;
      case 'acreageRange':
        updatedFilters.acreageRange = filterUpdate.value;
        break;
      case 'features':
        // Initialize features array if undefined
        if (!updatedFilters.features) {
          updatedFilters.features = [];
        }
        // Toggle the feature in the array
        if (updatedFilters.features.includes(filterUpdate.value)) {
          updatedFilters.features = updatedFilters.features.filter(f => f !== filterUpdate.value);
        } else {
          updatedFilters.features = [...updatedFilters.features, filterUpdate.value];
        }
        break;
      case 'terrainType':
        updatedFilters.terrainType = filterUpdate.value;
        break;
      case 'hasVideo':
        updatedFilters.hasVideo = filterUpdate.value;
        break;
      case 'activities':
        updatedFilters.activities = filterUpdate.value;
        break;
      case 'hasResidence':
        updatedFilters.hasResidence = filterUpdate.value;
        break;
      case 'bedrooms':
        updatedFilters.bedrooms = filterUpdate.value;
        break;
      case 'bathrooms':
        updatedFilters.bathrooms = filterUpdate.value;
        break;
      case 'propertyVideo':
        updatedFilters.propertyVideo = filterUpdate.value;
        updatedFilters.hasVideo = filterUpdate.value;
        break;
      case 'includesMineralRights':
        updatedFilters.includesMineralRights = filterUpdate.value;
        break;
      case 'ownerFinancing':
        updatedFilters.ownerFinancing = filterUpdate.value;
        break;
      case 'virtualTour':
        updatedFilters.virtualTour = filterUpdate.value;
        break;
    }
    
    setFilters(updatedFilters);
    
    // Notify parent component of filter changes
    if (onFilterChange) {
      // Send comprehensive filter update to ensure all advanced filters work with map
      onFilterChange({ type: 'comprehensive', value: updatedFilters });
    }
    
    return updatedFilters;
  };

  const handleStatusChange = (status: string) => {
    const currentStatus = filters.status || [];
    let updatedStatus: string[];
    
    if (status === 'all') {
      updatedStatus = [];
    } else {
      // Toggle the status in the array for multi-select
      if (currentStatus.includes(status)) {
        updatedStatus = currentStatus.filter(s => s !== status);
      } else {
        updatedStatus = [...currentStatus, status];
      }
    }
    
    updateFilters({ type: 'status', value: updatedStatus });
    
    // Create a user-friendly display status for the button and toast
    let displayStatus = 'All Properties';
    if (updatedStatus.length === 1) {
      if (updatedStatus[0] === 'active') displayStatus = 'For Sale';
      if (updatedStatus[0] === 'pending') displayStatus = 'Pending';
      if (updatedStatus[0] === 'expired') displayStatus = 'Expired';
      if (updatedStatus[0] === 'sold') displayStatus = 'Sold (Last 3 months)';
    } else if (updatedStatus.length > 1) {
      displayStatus = `${updatedStatus.length} Status Types`;
    }
    
    // Update button text to reflect selection
    const buttonElement = document.querySelector('[data-status-button]');
    if (buttonElement) {
      const textSpan = buttonElement.querySelector('span');
      if (textSpan) {
        textSpan.textContent = displayStatus;
      }
    }
    
    toast({
      title: `Status filter updated`,
      description: `Showing ${displayStatus}`
    });
    // Keep dropdown open for multiple selections
  };
  
  const handlePropertyTypeChange = (type: string) => {
    const currentTypes = filters.propertyTypes || [];
    let updatedTypes: string[];
    
    if (type === 'all') {
      updatedTypes = [];
    } else {
      // Toggle the type in the array
      if (currentTypes.includes(type)) {
        updatedTypes = currentTypes.filter(t => t !== type);
      } else {
        updatedTypes = [...currentTypes, type];
      }
    }
    
    updateFilters({ type: 'propertyTypes', value: updatedTypes });
    
    toast({
      title: `Property type filter updated`,
      description: updatedTypes.length > 0 ? `Selected types: ${updatedTypes.join(', ')}` : 'All property types'
    });
    // Keep dropdown open for multiple selections
  };
  
  const handlePriceChange = (priceRange: string) => {
    const parsedRange = parsePriceRange(priceRange);
    updateFilters({ type: 'priceRange', value: parsedRange });
    
    toast({
      title: `Price filter updated`,
      description: `Properties filtered by price range: ${priceRange}`
    });
    // Keep dropdown open for multiple selections
  };

  const handleApplyPriceFilter = () => {
    if (priceFilterMode === 'list') {
      updateFilters({ type: 'priceRange', value: customPriceRange });
      
      let description = 'All Properties';
      if (customPriceRange.min || customPriceRange.max) {
        const minStr = customPriceRange.min ? `$${customPriceRange.min.toLocaleString()}` : 'No Min';
        const maxStr = customPriceRange.max ? `$${customPriceRange.max.toLocaleString()}` : 'No Max';
        description = `${minStr} - ${maxStr}`;
      }
      
      toast({
        title: `Price filter updated`,
        description: description
      });
    } else {
      // For monthly payment mode, convert to approximate list price
      // Land financing typically: 10-20% down, 6-8% interest, 10-20 year terms
      // Using conservative estimate: 15% down, 7% interest, 15 years
      const downPaymentPercent = 0.15;
      const interestRate = 0.07 / 12; // Monthly rate
      const termMonths = 15 * 12; // 15 years
      
      const calculateMaxPrice = (monthlyPayment: number) => {
        // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
        // Solving for P: P = PMT * [(1+r)^n - 1] / [r(1+r)^n]
        const factor = Math.pow(1 + interestRate, termMonths);
        const loanAmount = monthlyPayment * (factor - 1) / (interestRate * factor);
        return loanAmount / (1 - downPaymentPercent); // Total price considering down payment
      };
      
      let estimatedMin = monthlyPaymentRange.min ? Math.round(calculateMaxPrice(monthlyPaymentRange.min)) : null;
      let estimatedMax = monthlyPaymentRange.max ? Math.round(calculateMaxPrice(monthlyPaymentRange.max)) : null;
      
      updateFilters({ type: 'priceRange', value: { min: estimatedMin, max: estimatedMax } });
      
      let description = 'All Properties';
      if (monthlyPaymentRange.min || monthlyPaymentRange.max) {
        const minStr = monthlyPaymentRange.min ? `$${monthlyPaymentRange.min}/mo` : 'No Min';
        const maxStr = monthlyPaymentRange.max ? `$${monthlyPaymentRange.max}/mo` : 'No Max';
        description = `${minStr} - ${maxStr} (Est. 15% down, 7% APR, 15yr)`;
      }
      
      toast({
        title: `Monthly payment filter updated`,
        description: description
      });
    }
    
    setShowPriceDropdown(false);
  };
  
  const handleAcreageChange = (acreageRange: string) => {
    const parsedRange = parseAcreageRange(acreageRange);
    updateFilters({ type: 'acreageRange', value: parsedRange });
    
    toast({
      title: `Acreage filter updated`,
      description: `Properties filtered by acreage range: ${acreageRange}`
    });
    // Keep dropdown open for multiple selections
  };
  
  const handleFilterChange = (filter: string) => {
    // Determine which type of filter is being updated
    let filterType: 'status' | 'propertyType' | 'features' | 'terrainType' | 'hasVideo' | 'activities' | 'hasResidence' | 'bedrooms' | 'bathrooms' | 'propertyVideo' | 'includesMineralRights' | 'ownerFinancing' | 'virtualTour' = 'features';
    let filterValue: any = filter;
    let filterDisplay = filter;
    
    if (filter === 'clearAll') {
      // Reset all filters in a single comprehensive update to avoid batching issues
      const resetFilters: PropertyFilters = {
        propertyTypes: [],
        hasResidence: 'either',
        bedrooms: 0,
        bathrooms: 0,
        squareFeet: { min: null, max: null },
        activities: [],
        listingType: [],
        status: [],
        priceReduction: '',
        dateListed: '',
        keywords: '',
        includesMineralRights: false,
        ownerFinancing: false,
        propertyVideo: false,
        virtualTour: false,
        terrainType: [],
        searchQuery: '',
        priceRange: { min: null, max: null },
        acreageRange: { min: null, max: null },
        propertyType: null,
        features: [],
        hasVideo: false
      };
      
      // Reset local filters state
      setFilters(resetFilters);
      
      // Notify parent component
      if (onFilterChange) {
        onFilterChange({ type: 'comprehensive', value: resetFilters });
      }
      // Keep dropdown open for multiple selections
      return;
    }
    
    if (filter === 'waterfront') {
      filterType = 'features';
      filterValue = 'waterfront';
      filterDisplay = 'Waterfront Properties';
    } else if (filter === 'mountainView') {
      filterType = 'features';
      filterValue = 'mountain view';
      filterDisplay = 'Mountain View Properties';
    } else if (filter === 'roadAccess') {
      filterType = 'features';
      filterValue = 'road access';
      filterDisplay = 'Properties with Road Access';
    } else if (filter === 'utilities') {
      filterType = 'features';
      filterValue = 'utilities';
      filterDisplay = 'Properties with Utilities';
    } else if (filter.startsWith('terrain:')) {
      filterType = 'terrainType';
      filterValue = filter.split(':')[1]; // Extract terrain type
      filterDisplay = `${filterValue.charAt(0).toUpperCase() + filterValue.slice(1)} Terrain`;
    } else if (filter === 'hasVideo') {
      filterType = 'hasVideo';
      filterValue = !filters.hasVideo; // Toggle the value
      filterDisplay = 'Properties with Video';
    } else if (filter.startsWith('activity:')) {
      filterType = 'activities';
      const activityName = filter.split(':')[1];
      const currentActivities = filters.activities || [];
      filterValue = currentActivities.includes(activityName)
        ? currentActivities.filter(a => a !== activityName)
        : [...currentActivities, activityName];
      filterDisplay = `Activities: ${filterValue.join(', ')}`;
    } else if (filter.startsWith('hasResidence:')) {
      filterType = 'hasResidence';
      filterValue = filter.split(':')[1] as 'yes' | 'no' | 'either';
      filterDisplay = `Has Residence: ${filterValue}`;
    } else if (filter.startsWith('bedrooms:')) {
      filterType = 'bedrooms';
      filterValue = parseInt(filter.split(':')[1]);
      filterDisplay = `${filterValue}+ Bedrooms`;
    } else if (filter.startsWith('bathrooms:')) {
      filterType = 'bathrooms';
      filterValue = parseInt(filter.split(':')[1]);
      filterDisplay = `${filterValue}+ Bathrooms`;
    } else if (filter === 'propertyVideo') {
      filterType = 'propertyVideo';
      filterValue = !filters.propertyVideo;
      filterDisplay = 'Properties with Video Tours';
    } else if (filter === 'includesMineralRights') {
      filterType = 'includesMineralRights';
      filterValue = !filters.includesMineralRights;
      filterDisplay = 'Includes Mineral Rights';
    } else if (filter === 'ownerFinancing') {
      filterType = 'ownerFinancing';
      filterValue = !filters.ownerFinancing;
      filterDisplay = 'Owner Financing Available';
    } else if (filter === 'virtualTour') {
      filterType = 'virtualTour';
      filterValue = !filters.virtualTour;
      filterDisplay = 'Properties with Virtual Tour';
    }
    
    updateFilters({ type: filterType, value: filterValue });
    
    toast({
      title: `Filter Applied`,
      description: `Showing ${filterDisplay}`
    });
    // Keep dropdown open for multiple selections
  };

  const handleSaveSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error saving search",
        description: "Please enter a search query first.",
        variant: "destructive",
      });
      return;
    }
    
    // Save to search history
    try {
      const existingHistory = localStorage.getItem('searchHistory');
      let newHistory = [];
      
      if (existingHistory) {
        const parsedHistory = JSON.parse(existingHistory);
        if (Array.isArray(parsedHistory)) {
          // Only add if it's not already at the top of history
          if (parsedHistory[0] !== searchQuery) {
            // Add current search to beginning
            newHistory = [searchQuery, ...parsedHistory.filter(q => q !== searchQuery)];
            
            // Keep only the last 5 searches
            newHistory = newHistory.slice(0, 5);
          } else {
            newHistory = parsedHistory;
          }
        } else {
          newHistory = [searchQuery];
        }
      } else {
        newHistory = [searchQuery];
      }
      
      // Update state and localStorage
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
      toast({
        title: "Search saved",
        description: "Your search has been saved successfully."
      });
    } catch (error) {
      console.error('Error saving search history:', error);
      toast({
        title: "Error saving search",
        description: "Failed to save search history.",
        variant: "destructive",
      });
    }
  };
  
  const handleHistoryItemClick = (location: string) => {
    setSearchQuery(location);
    setShowSuggestions(false);
    
    // Trigger search with the selected location
    if (mapboxToken) {
      geocodeLocation(location, mapboxToken)
        .then(geocodeResult => {
          if (geocodeResult) {
            const locationData = {
              longitude: geocodeResult.longitude,
              latitude: geocodeResult.latitude,
              placeName: geocodeResult.placeName,
              type: geocodeResult.type,
              state: geocodeResult.state,
              zoom: geocodeResult.zoom || 10
            };
            
            // Get map instance
            const mapInstance = (window as any).__simpleMap;
            if (mapInstance) {
              // Use smooth transition for glitch-free experience
              mapInstance.flyTo({
                center: [locationData.longitude, locationData.latitude],
                zoom: locationData.zoom,
                duration: 800, // Smooth duration for glitch-free transition
                essential: true, // Ensures the animation completes
                animate: true,
                curve: 1.42, // Standard smooth curve
                speed: 1.5, // Moderate speed for smoothness
                screenSpeed: 1.2, // Moderate screen speed
              });
              
              // Fetch properties for this location
              try {
                const fetchPropertiesNearFn = (window as any).__fetchPropertiesNear;
                if (typeof fetchPropertiesNearFn === 'function') {
                  fetchPropertiesNearFn(locationData.longitude, locationData.latitude, 20);
                }
              } catch (error) {
                console.error('Error fetching properties for history location:', error);
              }
            }
          }
        })
        .catch(error => {
          console.error('Error geocoding history location:', error);
        });
    }
  };
  
  const handleCurrentLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Set the search query to show we're using current location
          setSearchQuery('Current Location');
          setShowSuggestions(false);
          
          // Get map instance
          const mapInstance = (window as any).__simpleMap;
          if (mapInstance) {
            // Use smooth transition for glitch-free experience
            mapInstance.flyTo({
              center: [longitude, latitude],
              zoom: 12,
              duration: 800, // Smooth duration for glitch-free transition
              essential: true, // Ensures the animation completes
              animate: true,
              curve: 1.42, // Standard smooth curve
              speed: 1.5, // Moderate speed for smoothness
              screenSpeed: 1.2, // Moderate screen speed
            });
            
            // Fetch properties near current location
            try {
              const fetchPropertiesNearFn = (window as any).__fetchPropertiesNear;
              if (typeof fetchPropertiesNearFn === 'function') {
                fetchPropertiesNearFn(longitude, latitude, 20);
              }
            } catch (error) {
              console.error('Error fetching properties for current location:', error);
            }
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          toast({
            title: "Location error",
            description: "Unable to get your current location. Please check browser permissions.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed top-16 left-0 right-0 w-full p-3 bg-white border-b border-gray-200 z-50 shadow-sm">
      {/* Single row with all controls aligned */}
      <div className="flex items-center justify-between">
        {/* Left side with search and filters */}
        <div className="flex items-center space-x-3">
          {/* 50px spacing at left */}
          <div className="w-[50px]"></div>
          
          {/* Search input with dropdown */}
          <div className="relative w-72" ref={searchBarRef}>
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                placeholder="Address, City, ZIP, Neighborhood"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setShowSuggestions(true);
                  setIsFieldFocused(true);
                }}
                className={`w-full h-9 pl-3 pr-9 text-sm font-medium rounded
                  ${isFieldFocused || showSuggestions ? 'rounded-t-lg rounded-b-none border-2 border-blue-500 shadow-md text-gray-800' : 'border border-gray-300 text-gray-700'} 
                  focus:outline-none transition-all duration-150`}
                autoComplete="off"
              />
              
              {isSearching ? (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                </span>
              ) : searchQuery ? (
                <button
                  type="button"
                  className="absolute right-7 top-1/2 transform -translate-y-1/2"
                  onClick={handleClearSearch}
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              ) : null}
              
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                disabled={isSearching}
              >
                <Search className="h-4 w-4 text-gray-400" />
              </button>
            </form>
            
            {/* Current Location & Search History dropdown when field clicked */}
            {showSuggestions && (!searchQuery || searchQuery.length < 2) && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-md overflow-hidden z-50 border-x-2 border-b-2 border-blue-500">
                {/* Current Location Option */}
                <div
                  className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-200"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCurrentLocationClick();
                  }}
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-sm text-gray-800">Current Location</span>
                  </div>
                </div>
                
                {/* Search History Section */}
                {searchHistory.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 bg-gray-100 text-xs font-bold uppercase text-gray-500">
                      Search History
                    </div>
                    <ul>
                      {searchHistory.map((location, index) => (
                        <li
                          key={`history-${index}`}
                          className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 flex items-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleHistoryItemClick(location);
                          }}
                        >
                          <svg className="h-3 w-3 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{location}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
            
            {/* Location suggestions dropdown */}
            {showSuggestions && (searchQuery.length >= 2) && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-md overflow-hidden z-50 border-x-2 border-b-2 border-blue-500">
                {isLoadingSuggestions ? (
                  <div className="p-3 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading suggestions...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No locations found</div>
                ) : (
                  <ul className="max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <li 
                        key={suggestion.id}
                        className="cursor-pointer hover:bg-gray-100 transition-colors p-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSuggestionClick(suggestion);
                        }}
                      >
                        <div className="flex items-start">
                          <div className="flex-1 overflow-hidden">
                            <div className="font-semibold text-sm text-gray-800">{suggestion.mainText}</div>
                            {suggestion.secondaryText && (
                              <div className="text-xs text-gray-600 font-medium truncate">{suggestion.secondaryText}</div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* For Sale dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <Button 
              onClick={() => handleFilterClick('For Sale')}
              className={`h-10 min-w-28 rounded-lg border-2 transition-all duration-200 ${
                showStatusDropdown 
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' 
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
              } flex items-center justify-between px-4 text-base font-semibold text-gray-800`}
              variant="default"
              type="button"
              data-status-button="true"
            >
              <span className="text-gray-900">For Sale</span>
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${
                showStatusDropdown ? 'rotate-180 text-blue-600' : 'text-gray-500'
              }`} />
            </Button>
            
            {/* Status dropdown menu */}
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-xl rounded-xl overflow-hidden z-50 border-2 border-gray-200">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-gray-50 text-sm font-bold uppercase text-gray-700 border-b border-gray-200">
                  Property Status
                </div>
                <ul className="py-1">
                  <li className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleStatusChange('active')}>
                      <div className={`w-4 h-4 rounded-full border ${filters.status && filters.status.includes('active') ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                        {filters.status && filters.status.includes('active') && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">For Sale (Active)</span>
                    </div>
                  </li>
                  <li className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleStatusChange('pending')}>
                      <div className={`w-4 h-4 rounded-full border ${filters.status && filters.status.includes('pending') ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                        {filters.status && filters.status.includes('pending') && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Pending</span>
                    </div>
                  </li>
                  <li className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleStatusChange('expired')}>
                      <div className={`w-4 h-4 rounded-full border ${filters.status && filters.status.includes('expired') ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                        {filters.status && filters.status.includes('expired') && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Expired</span>
                    </div>
                  </li>
                  <li className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleStatusChange('all')}>
                      <div className={`w-4 h-4 rounded-full border ${!filters.status || filters.status.length === 0 ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                        {(!filters.status || filters.status.length === 0) && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">All Properties</span>
                    </div>
                  </li>
                  <li className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleStatusChange('sold')}>
                      <div className={`w-4 h-4 rounded-full border ${filters.status && filters.status.includes('sold') ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                        {filters.status && filters.status.includes('sold') && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Sold (Last 3 months)</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* All Types dropdown */}
          <div className="relative" ref={typesDropdownRef}>
            <Button
              onClick={() => handleFilterClick('All Types')}
              className={`h-10 min-w-28 rounded-lg border-2 transition-all duration-200 ${
                showTypesDropdown 
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' 
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
              } flex items-center justify-between px-4 text-base font-semibold text-gray-800`}
              variant="default"
              type="button"
            >
              <span className="text-gray-900">All Types</span>
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${
                showTypesDropdown ? 'rotate-180 text-blue-600' : 'text-gray-500'
              }`} />
            </Button>
            
            {/* Property Types dropdown menu */}
            {showTypesDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-xl rounded-xl overflow-hidden z-50 border-2 border-gray-200">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-gray-50 text-sm font-bold uppercase text-gray-700 border-b border-gray-200">
                  Property Type
                </div>
                <ul>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('residential')}
                  >
                    Residential
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('agricultural')}
                  >
                    Agricultural
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('farm')}
                  >
                    Farm
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('ranch')}
                  >
                    Ranch
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('recreational')}
                  >
                    Recreational
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('commercial')}
                  >
                    Commercial
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('conservation')}
                  >
                    Conservation
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('timberland')}
                  >
                    Timberland
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('undeveloped')}
                  >
                    Undeveloped
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('horse')}
                  >
                    Horse
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('hunting')}
                  >
                    Hunting Land
                  </li>
                </ul>
                
                <div className="px-3 py-1.5 bg-gray-100 text-xs font-bold uppercase text-gray-500">
                  Waterfront Properties
                </div>
                <ul>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('lakefront')}
                  >
                    Lakefront
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('riverfront')}
                  >
                    Riverfront
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('beachfront')}
                  >
                    Beachfront
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('waterfront')}
                  >
                    Waterfront
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 text-sm font-medium text-gray-700"
                    onClick={() => handlePropertyTypeChange('all')}
                  >
                    All Property Types
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Price dropdown - World-class design */}
          <div className="relative" ref={priceDropdownRef}>
            <Button
              onClick={() => handleFilterClick('Price')}
              className={`h-10 min-w-28 rounded-lg border-2 transition-all duration-200 ${
                showPriceDropdown 
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' 
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
              } flex items-center justify-between px-4 text-base font-semibold text-gray-800`}
              variant="default"
              type="button"
            >
              <span className="text-gray-900">Price</span>
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${
                showPriceDropdown ? 'rotate-180 text-blue-600' : 'text-gray-500'
              }`} />
            </Button>
            
            {/* World-class Price dropdown menu */}
            {showPriceDropdown && (
              <div 
                className="absolute top-full left-0 mt-2 w-96 bg-white shadow-2xl rounded-xl overflow-hidden z-50 border-2 border-gray-200 max-h-[85vh] overflow-y-auto scrollbar-hide"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Premium Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-gray-50 border-b-2 border-gray-200">
                  <h3 className="text-sm font-bold uppercase text-gray-700">Price Range</h3>
                  <p className="text-xs text-gray-600 mt-1">Find properties within your budget</p>
                </div>

                {/* Enhanced Tab Navigation */}
                <div className="px-6 pt-5">
                  <div className="flex bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                    <button
                      className={`flex-1 px-4 py-3 text-sm font-semibold rounded-md transition-all duration-200 ${
                        priceFilterMode === 'list' 
                          ? 'bg-white text-blue-700 shadow-md border border-blue-100' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      onClick={() => setPriceFilterMode('list')}
                    >
                      <div className="flex flex-col items-center">
                        <span>List Price</span>
                        <span className="text-xs opacity-75">Total cost</span>
                      </div>
                    </button>
                    <button
                      className={`flex-1 px-4 py-3 text-sm font-semibold rounded-md transition-all duration-200 ${
                        priceFilterMode === 'monthly' 
                          ? 'bg-white text-blue-700 shadow-md border border-blue-100' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      onClick={() => setPriceFilterMode('monthly')}
                    >
                      <div className="flex flex-col items-center">
                        <span>Monthly Payment</span>
                        <span className="text-xs opacity-75">With financing</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Enhanced List Price Content */}
                {priceFilterMode === 'list' && (
                  <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
                    {/* Quick Price Ranges */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Popular Price Ranges</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Under $100K', min: 0, max: 100000 },
                          { label: '$100K - $250K', min: 100000, max: 250000 },
                          { label: '$250K - $500K', min: 250000, max: 500000 },
                          { label: '$500K - $1M', min: 500000, max: 1000000 },
                          { label: '$1M - $2M', min: 1000000, max: 2000000 },
                          { label: '$2M+', min: 2000000, max: null }
                        ].map((range, index) => (
                          <button
                            key={index}
                            onClick={() => setCustomPriceRange({ min: range.min, max: range.max })}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                              customPriceRange.min === range.min && customPriceRange.max === range.max
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Range */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Custom Range</h4>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-base font-bold text-gray-900">Minimum Price</label>
                        <label className="text-base font-bold text-gray-900">Maximum Price</label>
                      </div>
                      <div className="flex items-center space-x-4">
                        <select 
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-400 text-gray-900"
                          value={customPriceRange.min || ''}
                          onChange={(e) => setCustomPriceRange(prev => ({ ...prev, min: e.target.value ? parseInt(e.target.value) : null }))}
                        >
                          <option value="">No Minimum</option>
                          <option value="10000">$10,000</option>
                          <option value="25000">$25,000</option>
                          <option value="50000">$50,000</option>
                          <option value="75000">$75,000</option>
                          <option value="100000">$100,000</option>
                          <option value="150000">$150,000</option>
                          <option value="200000">$200,000</option>
                          <option value="250000">$250,000</option>
                          <option value="300000">$300,000</option>
                          <option value="400000">$400,000</option>
                          <option value="500000">$500,000</option>
                          <option value="750000">$750,000</option>
                          <option value="1000000">$1,000,000</option>
                          <option value="1500000">$1,500,000</option>
                          <option value="2000000">$2,000,000</option>
                        </select>
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                          <span className="text-gray-500 font-bold">–</span>
                        </div>
                        <select 
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-400 text-gray-900"
                          value={customPriceRange.max || ''}
                          onChange={(e) => setCustomPriceRange(prev => ({ ...prev, max: e.target.value ? parseInt(e.target.value) : null }))}
                        >
                          <option value="">No Maximum</option>
                          <option value="25000">$25,000</option>
                          <option value="50000">$50,000</option>
                          <option value="75000">$75,000</option>
                          <option value="100000">$100,000</option>
                          <option value="150000">$150,000</option>
                          <option value="200000">$200,000</option>
                          <option value="250000">$250,000</option>
                          <option value="300000">$300,000</option>
                          <option value="400000">$400,000</option>
                          <option value="500000">$500,000</option>
                          <option value="750000">$750,000</option>
                          <option value="1000000">$1,000,000</option>
                          <option value="1500000">$1,500,000</option>
                          <option value="2000000">$2,000,000</option>
                          <option value="5000000">$5,000,000</option>
                          <option value="10000000">$10,000,000</option>
                        </select>
                      </div>
                      {(customPriceRange.min || customPriceRange.max) && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 font-medium">
                            Searching properties from {customPriceRange.min ? `$${customPriceRange.min.toLocaleString()}` : 'any price'} to {customPriceRange.max ? `$${customPriceRange.max.toLocaleString()}` : 'any price'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Monthly Payment Content */}
                {priceFilterMode === 'monthly' && (
                  <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
                    {/* Premium Info Panel */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-blue-900 mb-1">Land Financing Calculator</h4>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            Estimates based on 15% down payment, 7% APR, 15-year term for raw land purchases. 
                            Actual rates vary by credit score, property type, and lender requirements.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Payment Ranges */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Popular Monthly Payment Ranges</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Under $300', min: 0, max: 300 },
                          { label: '$300 - $600', min: 300, max: 600 },
                          { label: '$600 - $1K', min: 600, max: 1000 },
                          { label: '$1K - $2K', min: 1000, max: 2000 },
                          { label: '$2K - $4K', min: 2000, max: 4000 },
                          { label: '$4K+', min: 4000, max: null }
                        ].map((range, index) => (
                          <button
                            key={index}
                            onClick={() => setMonthlyPaymentRange({ min: range.min, max: range.max })}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                              monthlyPaymentRange.min === range.min && monthlyPaymentRange.max === range.max
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {range.label}/mo
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Monthly Range */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Custom Monthly Range</h4>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-base font-bold text-gray-900">Minimum Payment</label>
                        <label className="text-base font-bold text-gray-900">Maximum Payment</label>
                      </div>
                      <div className="flex items-center space-x-4">
                        <select 
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-400 text-gray-900"
                          value={monthlyPaymentRange.min || ''}
                          onChange={(e) => setMonthlyPaymentRange(prev => ({ ...prev, min: e.target.value ? parseInt(e.target.value) : null }))}
                        >
                          <option value="">No Minimum</option>
                          <option value="500">$500/month</option>
                          <option value="750">$750/month</option>
                          <option value="1000">$1,000/month</option>
                          <option value="1250">$1,250/month</option>
                          <option value="1500">$1,500/month</option>
                          <option value="2000">$2,000/month</option>
                          <option value="2500">$2,500/month</option>
                          <option value="3000">$3,000/month</option>
                          <option value="4000">$4,000/month</option>
                          <option value="5000">$5,000/month</option>
                        </select>
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                          <span className="text-gray-500 font-bold">–</span>
                        </div>
                        <select 
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-400 text-gray-900"
                          value={monthlyPaymentRange.max || ''}
                          onChange={(e) => setMonthlyPaymentRange(prev => ({ ...prev, max: e.target.value ? parseInt(e.target.value) : null }))}
                        >
                          <option value="">No Maximum</option>
                          <option value="1000">$1,000/month</option>
                          <option value="1500">$1,500/month</option>
                          <option value="2000">$2,000/month</option>
                          <option value="2500">$2,500/month</option>
                          <option value="3000">$3,000/month</option>
                          <option value="4000">$4,000/month</option>
                          <option value="5000">$5,000/month</option>
                          <option value="7500">$7,500/month</option>
                          <option value="10000">$10,000/month</option>
                          <option value="15000">$15,000/month</option>
                        </select>
                      </div>
                    </div>

                    {/* Enhanced Financial Options */}
                    <div className="grid grid-cols-2 gap-4 relative isolate">
                      {/* Down Payment */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-base font-bold text-gray-900">Down Payment</label>
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                if (tooltip) {
                                  tooltip.classList.toggle('opacity-0');
                                  tooltip.classList.toggle('opacity-100');
                                }
                              }}
                              className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center text-xs text-blue-600 cursor-help font-bold hover:bg-blue-50 transition-colors"
                            >
                              ?
                            </button>
                            <div className="absolute top-6 right-0 w-72 bg-gray-900 text-white text-xs rounded-xl p-4 opacity-0 transition-opacity z-40 shadow-2xl pointer-events-none">
                              <strong>Down Payment Impact:</strong><br/>
                              • Higher down payments = Lower monthly payments<br/>
                              • 20%+ avoids PMI insurance costs<br/>
                              • Better rates with larger down payments
                            </div>
                          </div>
                        </div>
                        <select 
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-400 text-gray-900"
                          value={downPaymentPercent}
                          onChange={(e) => setDownPaymentPercent(e.target.value)}
                        >
                          <option value="0">0% (No Down)</option>
                          <option value="3">3% Down</option>
                          <option value="5">5% Down</option>
                          <option value="10">10% Down</option>
                          <option value="15">15% Down</option>
                          <option value="20">20% Down ✨</option>
                          <option value="25">25% Down</option>
                          <option value="30">30% Down</option>
                        </select>
                      </div>

                      {/* Credit Score */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-base font-bold text-gray-900">Credit Score</label>
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                if (tooltip) {
                                  tooltip.classList.toggle('opacity-0');
                                  tooltip.classList.toggle('opacity-100');
                                }
                              }}
                              className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center text-xs text-blue-600 cursor-help font-bold hover:bg-blue-50 transition-colors"
                            >
                              ?
                            </button>
                            <div className="absolute top-6 left-0 w-72 bg-gray-900 text-white text-xs rounded-xl p-4 opacity-0 transition-opacity z-40 shadow-2xl pointer-events-none">
                              <strong>Credit Score Benefits:</strong><br/>
                              • 740+ = Best rates & terms<br/>
                              • 670+ = Good rates available<br/>
                              • Below 670 = Higher rates
                            </div>
                          </div>
                        </div>
                        <select 
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-400 text-gray-900"
                          value={creditScore}
                          onChange={(e) => setCreditScore(e.target.value)}
                        >
                          <option value="">Select Range</option>
                          <option value="excellent">740-850 (Excellent) 🌟</option>
                          <option value="good">670-739 (Good) ✓</option>
                          <option value="fair">580-669 (Fair)</option>
                          <option value="poor">300-579 (Building)</option>
                        </select>
                      </div>
                    </div>

                    {/* Payment Preview */}
                    {(monthlyPaymentRange.min || monthlyPaymentRange.max) && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4">
                        <h5 className="text-sm font-bold text-green-800 mb-2">Monthly Payment Range</h5>
                        <p className="text-sm text-green-700 font-medium">
                          Searching properties with payments from {monthlyPaymentRange.min ? `$${monthlyPaymentRange.min.toLocaleString()}/mo` : 'any amount'} to {monthlyPaymentRange.max ? `$${monthlyPaymentRange.max.toLocaleString()}/mo` : 'any amount'}
                        </p>
                      </div>
                    )}

                    {/* Enhanced Save Preferences */}
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 text-slate-600">💾</div>
                          <span className="text-base font-bold text-slate-900">Save Payment Preferences</span>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                          Save Settings
                        </button>
                      </div>
                      <div className="text-sm text-slate-700 leading-relaxed font-medium">
                        <a href="#" className="text-blue-700 hover:underline font-bold">Privacy Policy</a> • 
                        Your financial information is encrypted with bank-level security and never shared with third parties.
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Action Buttons */}
                <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-4 bg-white">
                  {/* Purchasability Button */}
                  <button
                    onClick={() => setShowPurchasabilityModal(true)}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-3 border-2 border-emerald-500 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md font-semibold"
                  >
                    <div className="w-5 h-5 border-2 border-emerald-500 rounded-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>
                    </div>
                    <span>Calculate your Purchasability™</span>
                  </button>

                  {/* Apply Filters Button */}
                  <button
                    onClick={handleApplyPriceFilter}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-base hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Apply Price Filters
                  </button>
                  
                  {/* Clear filters link */}
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setCustomPriceRange({ min: null, max: null })}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear all price filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Purchasability Modal */}
          {showPurchasabilityModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Purchasability™ Calculator</h2>
                    <p className="text-sm text-gray-600 mt-1">Discover your property buying power</p>
                  </div>
                  <button
                    onClick={() => setShowPurchasabilityModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  <div className="text-center bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Purchasing property is a significant investment. We're here to guide you through every step.
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Let's calculate your purchasing power and track how market changes affect your options. 
                      Provide your best estimates - you can always update them later.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column - Property Plans */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Property Investment Plans</h4>
                      
                      {/* Where to buy */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Target Property Location <span className="text-red-500">*</span>
                        </label>
                        <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                          <option>Select a state</option>
                          <option>Texas</option>
                          <option>California</option>
                          <option>Florida</option>
                          <option>New York</option>
                          <option>Georgia</option>
                          <option>North Carolina</option>
                          <option>Arizona</option>
                          <option>Colorado</option>
                          <option>Washington</option>
                          <option>Oregon</option>
                        </select>
                        <p className="text-xs text-gray-500">Choose your preferred investment region.</p>
                      </div>

                      {/* Down payment */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Available Down Payment <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            className="w-full pl-6 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder="50,000"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Funds available for initial investment.</p>
                      </div>

                      {/* Monthly budget */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Comfortable Monthly Payment
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            className="w-full pl-6 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder="2,500"
                          />
                        </div>
                        <p className="text-xs text-gray-500">We'll keep calculated payments within your comfort zone.</p>
                      </div>
                    </div>

                    {/* Right Column - Financial Profile */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Financial Profile</h4>

                      {/* Annual income */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Annual Gross Income <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            className="w-full pl-6 pr-16 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder="75,000"
                          />
                          <span className="absolute right-3 top-2.5 text-gray-500">/year</span>
                        </div>
                        <p className="text-xs text-gray-500">Before taxes and deductions.</p>
                      </div>

                      {/* Monthly obligations */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Monthly Debt Obligations <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            className="w-full pl-6 pr-20 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder="800"
                          />
                          <span className="absolute right-3 top-2.5 text-gray-500">/month</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Credit cards, student loans, auto loans, and other recurring debt payments.
                        </p>
                      </div>

                      {/* Credit score */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Credit Score Range <span className="text-red-500">*</span>
                        </label>
                        <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                          <option>Select credit score range</option>
                          <option>Excellent (740-850) - Premium Rates</option>
                          <option>Good (670-739) - Competitive Rates</option>
                          <option>Fair (580-669) - Standard Rates</option>
                          <option>Building Credit (300-579) - Higher Rates</option>
                        </select>
                        <p className="text-xs text-gray-500">Affects your interest rate and loan terms.</p>
                      </div>
                    </div>
                  </div>

                  {/* Privacy & Security */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 text-emerald-600 mt-0.5">🔒</div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-1">Your Privacy Matters</h5>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          All information is encrypted and stored securely. We never share personal data with third parties. 
                          <a href="#" className="text-emerald-600 hover:underline ml-1">Read our Privacy Policy</a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 shadow-lg">
                      Calculate My Purchasing Power
                    </button>
                    <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Save for Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Any Acres dropdown */}
          <div className="relative" ref={acresDropdownRef}>
            <Button
              onClick={() => handleFilterClick('Any Acres')}
              className={`h-10 min-w-28 rounded-lg border-2 transition-all duration-200 ${
                showAcresDropdown 
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' 
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
              } flex items-center justify-between px-4 text-base font-semibold text-gray-800`}
              variant="default"
              type="button"
            >
              <span className="text-gray-900">Any Acres</span>
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${
                showAcresDropdown ? 'rotate-180 text-blue-600' : 'text-gray-500'
              }`} />
            </Button>
            
            {/* Acres dropdown menu */}
            {showAcresDropdown && (
              <div 
                className="absolute top-full left-0 mt-2 w-64 bg-white shadow-xl rounded-xl overflow-hidden z-50 border-2 border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-gray-50 text-sm font-bold uppercase text-gray-700 border-b border-gray-200">
                  Acreage Range
                </div>
                <ul>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('0-1');
                    }}
                  >
                    Under 1 acre
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('1-5');
                    }}
                  >
                    1 to 5 acres
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('5-10');
                    }}
                  >
                    5 to 10 acres
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('10-20');
                    }}
                  >
                    10 to 20 acres
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('20-50');
                    }}
                  >
                    20 to 50 acres
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('50-100');
                    }}
                  >
                    50 to 100 acres
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('100-500');
                    }}
                  >
                    100 to 500 acres
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 border-b border-gray-100 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('500+');
                    }}
                  >
                    500+ acres
                  </li>
                  <li 
                    className="cursor-pointer hover:bg-gray-100 transition-colors px-3 py-2 text-sm font-medium text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcreageChange('any');
                    }}
                  >
                    Any Acreage
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Advanced Filters dropdown with slider icon */}
          <div className="relative" ref={filtersDropdownRef}>
            <Button
              onClick={() => handleFilterClick('Filters')}
              className={`h-10 min-w-28 rounded-lg border-2 transition-all duration-200 ${
                showFiltersDropdown 
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' 
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
              } flex items-center justify-between px-4 text-base font-semibold text-gray-800`}
              variant="default"
              type="button"
            >
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7H8C8 5.89543 8.89543 5 10 5C11.1046 5 12 5.89543 12 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 12H14C14 10.8954 14.8954 10 16 10C17.1046 10 18 10.8954 18 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 17H10C10 15.8954 10.8954 15 12 15C13.1046 15 14 15.8954 14 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-gray-900">Filters</span>
              </div>
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${
                showFiltersDropdown ? 'rotate-180 text-blue-600' : 'text-gray-500'
              }`} />
            </Button>
            
            {/* Advanced Filters mega-dropdown */}
            {showFiltersDropdown && (
              <div 
                className="absolute top-full left-0 mt-2 w-[720px] max-h-[85vh] overflow-y-auto bg-white shadow-2xl rounded-xl z-50 border-2 border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with filter count */}
                <div className="px-4 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 7H8C8 5.89543 8.89543 5 10 5C11.1046 5 12 5.89543 12 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M4 12H14C14 10.8954 14.8954 10 16 10C17.1046 10 18 10.8954 18 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M4 17H10C10 15.8954 10.8954 15 12 15C13.1046 15 14 15.8954 14 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
                  </div>
                  <button 
                    onClick={() => setShowFiltersDropdown(false)}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                {/* Grid layout for filters */}
                <div className="grid grid-cols-2 gap-4 p-4">
                  {/* Property Types Section */}
                  <div className="bg-white rounded p-3 border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      Property Types
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(showAllPropertyTypes 
                        ? ['Farm', 'Ranch', 'Recreational', 'Residential', 'Timberland', 'Undeveloped', 'Agricultural', 'Commercial', 'Conservation', 'Land', 'Waterfront', 'Mountain', 'Investment', 'Hunting', 'Horse', 'Livestock', 'Orchard', 'Vineyard', 'Dairy', 'Poultry', 'Equestrian', 'Ranching']
                        : ['Farm', 'Ranch', 'Recreational', 'Residential', 'Timberland', 'Undeveloped']
                      ).map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`property-type-${type}`} 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedPropertyTypes.includes(type.toLowerCase())}
                            onChange={() => {
                              const typeLower = type.toLowerCase();
                              const newTypes = selectedPropertyTypes.includes(typeLower)
                                ? selectedPropertyTypes.filter(t => t !== typeLower)
                                : [...selectedPropertyTypes, typeLower];
                              setSelectedPropertyTypes(newTypes);
                              handlePropertyTypeChange(typeLower);
                              console.log('🏠 Property type clicked:', type, 'Selected:', newTypes);
                            }}
                          />
                          <label htmlFor={`property-type-${type}`} className="text-sm font-medium text-gray-800 cursor-pointer">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                    <button 
                      className="mt-2 text-blue-600 text-xs flex items-center font-medium hover:text-blue-800 transition-colors"
                      onClick={() => {
                        console.log('🔥 SEE MORE TYPES CLICKED! Current state:', showAllPropertyTypes);
                        setShowAllPropertyTypes(!showAllPropertyTypes);
                      }}
                    >
                      {showAllPropertyTypes ? '- See Less Types' : '+ See More Types'}
                    </button>
                  </div>
                  
                  {/* Land Features */}
                  <div className="bg-white rounded p-3 border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Land Features</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      <div 
                        className={`flex items-center justify-between px-2 py-1.5 border rounded-md cursor-pointer transition-colors ${
                          selectedFeatures.includes('waterfront')
                            ? 'bg-blue-50 border-blue-200'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFeatures = selectedFeatures.includes('waterfront')
                            ? selectedFeatures.filter(f => f !== 'waterfront')
                            : [...selectedFeatures, 'waterfront'];
                          setSelectedFeatures(newFeatures);
                          handleFilterChange('waterfront');
                          console.log('🌊 Waterfront clicked, Selected features:', newFeatures);
                        }}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12l6-6M5 12l6 6" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h18M3 19h18" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-900">Waterfront</span>
                        </div>
                        {selectedFeatures.includes('waterfront') && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div 
                        className={`flex items-center justify-between px-2 py-1.5 border rounded-md cursor-pointer transition-colors ${
                          selectedFeatures.includes('mountainView')
                            ? 'bg-blue-50 border-blue-200'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFeatures = selectedFeatures.includes('mountainView')
                            ? selectedFeatures.filter(f => f !== 'mountainView')
                            : [...selectedFeatures, 'mountainView'];
                          setSelectedFeatures(newFeatures);
                          handleFilterChange('mountainView');
                          console.log('🏔️ Mountain View clicked, Selected features:', newFeatures);
                        }}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12V7a1 1 0 011-1h4l2 2h4a1 1 0 011 1v11a2 2 0 01-2 2H7a2 2 0 01-2-2v-5zm8-8l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-900">Mountain View</span>
                        </div>
                        {selectedFeatures.includes('mountainView') && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div 
                        className={`flex items-center justify-between px-2 py-1.5 border rounded-md cursor-pointer transition-colors ${
                          selectedFeatures.includes('roadAccess')
                            ? 'bg-blue-50 border-blue-200'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFeatures = selectedFeatures.includes('roadAccess')
                            ? selectedFeatures.filter(f => f !== 'roadAccess')
                            : [...selectedFeatures, 'roadAccess'];
                          setSelectedFeatures(newFeatures);
                          handleFilterChange('roadAccess');
                          console.log('🛣️ Road Access clicked, Selected features:', newFeatures);
                        }}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6M2 9l10-4 10 4-10 4z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-900">Road Access</span>
                        </div>
                        {selectedFeatures.includes('roadAccess') && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div 
                        className={`flex items-center justify-between px-2 py-1.5 border rounded-md cursor-pointer transition-colors ${
                          selectedFeatures.includes('utilities')
                            ? 'bg-blue-50 border-blue-200'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          const newFeatures = selectedFeatures.includes('utilities')
                            ? selectedFeatures.filter(f => f !== 'utilities')
                            : [...selectedFeatures, 'utilities'];
                          setSelectedFeatures(newFeatures);
                          handleFilterChange('utilities');
                          console.log('⚡ Utilities clicked, Selected features:', newFeatures);
                        }}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-900">Utilities</span>
                        </div>
                        {selectedFeatures.includes('utilities') && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Residence Features */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 className="text-base font-bold text-gray-900 mb-4">Residence</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Includes Residence</p>
                        <div className="flex space-x-2">
                          <button 
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                              selectedResidence === 'yes' 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResidence('yes');
                              handleFilterChange('hasResidence:yes');
                            }}
                          >
                            Yes
                          </button>
                          <button 
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                              selectedResidence === 'no' 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResidence('no');
                              handleFilterChange('hasResidence:no');
                            }}
                          >
                            No
                          </button>
                          <button 
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                              selectedResidence === 'either' 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResidence('either');
                              handleFilterChange('hasResidence:either');
                            }}
                          >
                            Either
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-2">Bedrooms</label>
                          <div className="flex space-x-1">
                            <button 
                              className={`flex-1 px-2 py-2 rounded-md text-sm font-medium border transition-colors ${
                                selectedBedrooms === 1 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBedrooms(1);
                                handleFilterChange('bedrooms:1');
                              }}
                            >
                              1+
                            </button>
                            <button 
                              className={`flex-1 px-2 py-2 rounded-md text-sm font-medium border transition-colors ${
                                selectedBedrooms === 2 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBedrooms(2);
                                handleFilterChange('bedrooms:2');
                              }}
                            >
                              2+
                            </button>
                            <button 
                              className={`flex-1 px-2 py-2 rounded-md text-sm font-medium border transition-colors ${
                                selectedBedrooms === 3 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBedrooms(3);
                                handleFilterChange('bedrooms:3');
                              }}
                            >
                              3+
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-2">Bathrooms</label>
                          <div className="flex space-x-1">
                            <button 
                              className={`flex-1 px-2 py-2 rounded-md text-sm font-medium border transition-colors ${
                                selectedBathrooms === 1 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBathrooms(1);
                                handleFilterChange('bathrooms:1');
                              }}
                            >
                              1+
                            </button>
                            <button 
                              className={`flex-1 px-2 py-2 rounded-md text-sm font-medium border transition-colors ${
                                selectedBathrooms === 2 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBathrooms(2);
                                handleFilterChange('bathrooms:2');
                              }}
                            >
                              2+
                            </button>
                            <button 
                              className={`flex-1 px-2 py-2 rounded-md text-sm font-medium border transition-colors ${
                                selectedBathrooms === 3 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBathrooms(3);
                                handleFilterChange('bathrooms:3');
                              }}
                            >
                              3+
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terrain Types */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 className="text-base font-bold text-gray-900 mb-3">Terrain Type</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {['flat', 'hilly', 'mountainous', 'wooded'].map((terrainType, index) => {
                        const icons = [
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18M3 12l6-6M3 12l6 6" />,
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 10.5L12 3l7.5 7.5M3 21h18M12 3v18" />,
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 17l4-8 4 4 6-12 6 8" />,
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L8 8l4 4 4-4-4-6zM8 8v10l4 2 4-2V8" />
                        ];
                        const labels = ['Flat', 'Hilly', 'Mountainous', 'Wooded'];
                        
                        return (
                          <div 
                            key={terrainType}
                            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                              selectedTerrainTypes.includes(terrainType)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newTerrainTypes = selectedTerrainTypes.includes(terrainType)
                                ? selectedTerrainTypes.filter(t => t !== terrainType)
                                : [...selectedTerrainTypes, terrainType];
                              setSelectedTerrainTypes(newTerrainTypes);
                              handleFilterChange(`terrain:${terrainType}`);
                            }}
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {icons[index]}
                              </svg>
                              <span className="text-sm font-medium">{labels[index]}</span>
                            </div>
                            {selectedTerrainTypes.includes(terrainType) && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Activities Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 className="text-base font-bold text-gray-900 mb-3">Activities</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {['Fishing', 'Hunting', 'Hiking', 'Camping', 'Boating'].map((activity, index) => {
                        const activityIcons = [
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />, // Fishing
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />, // Hunting
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, // Hiking
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />, // Camping
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> // Boating
                        ];
                        
                        return (
                          <button 
                            key={activity}
                            className={`flex items-center justify-between px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                              selectedActivities.includes(activity.toLowerCase())
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const activityLower = activity.toLowerCase();
                              const newActivities = selectedActivities.includes(activityLower)
                                ? selectedActivities.filter(a => a !== activityLower)
                                : [...selectedActivities, activityLower];
                              setSelectedActivities(newActivities);
                              handleFilterChange(`activity:${activityLower}`);
                            }}
                          >
                            <div className="flex items-center">
                              <svg className={`w-4 h-4 mr-2 ${selectedActivities.includes(activity.toLowerCase()) ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {activityIcons[index]}
                              </svg>
                              <span>{activity}</span>
                            </div>
                            {selectedActivities.includes(activity.toLowerCase()) && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Advanced Features */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 className="text-base font-bold text-gray-900 mb-3">Advanced Features</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded-md transition-colors">
                        <input 
                          type="checkbox" 
                          id="include-mineral-rights" 
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filters.includesMineralRights}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFilterChange('includesMineralRights');
                          }}
                        />
                        <label htmlFor="include-mineral-rights" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Mineral Rights
                        </label>
                      </div>
                      <div className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded-md transition-colors">
                        <input 
                          type="checkbox" 
                          id="owner-financing" 
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filters.ownerFinancing}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFilterChange('ownerFinancing');
                          }}
                        />
                        <label htmlFor="owner-financing" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Owner Financing
                        </label>
                      </div>
                      <div className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded-md transition-colors">
                        <input 
                          type="checkbox" 
                          id="property-video" 
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filters.hasVideo}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFilterChange('hasVideo');
                          }}
                        />
                        <label htmlFor="property-video" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Property Video
                        </label>
                      </div>
                      <div className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded-md transition-colors">
                        <input 
                          type="checkbox" 
                          id="virtual-tour" 
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filters.virtualTour}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFilterChange('virtualTour');
                          }}
                        />
                        <label htmlFor="virtual-tour" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Virtual Tour
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer with action buttons */}
                <div className="border-t border-gray-200 p-4 flex justify-between bg-gray-50">
                  <button 
                    className="text-gray-700 text-base font-semibold hover:text-gray-900 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                    onClick={() => {
                      console.log('Clear Filters clicked - resetting all states');
                      setSelectedResidence('either');
                      setSelectedBedrooms(0);
                      setSelectedBathrooms(0);
                      setSelectedActivities([]);
                      setSelectedPropertyTypes([]);
                      setSelectedFeatures([]);
                      setSelectedTerrainTypes([]);
                      handleFilterChange('clearAll');
                    }}
                  >
                    Clear Filters
                  </button>
                  <button 
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-bold hover:bg-blue-700 shadow-md transition-all transform hover:scale-105"
                    onClick={() => setShowFiltersDropdown(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side with property counter, save search, and map toggle */}
        <div className="flex items-center">
          {/* Property counter with 60px spacing before Save Search */}
          <div className="text-xs font-medium text-gray-800 mr-[60px]">
            {getLocationText()}
          </div>
          
          <Button
            onClick={handleSaveSearch}
            className="text-xs h-7 px-3 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 font-semibold border border-gray-300"
            type="button"
          >
            Save Search
          </Button>
          
          {/* 60px spacing after Save Search */}
          <div className="ml-[60px] flex items-center mr-[70px]">
            <span className="text-xs font-semibold text-gray-800 mr-2">Show Map</span>
            <Switch 
              checked={showMap} 
              onCheckedChange={handleMapToggle}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExactSearchBar;