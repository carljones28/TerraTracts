import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import SimpleMap from '@/components/map/SimpleMap';
import { Search, ChevronLeft, ChevronRight, Grid, Map, Wheat, Beef, TreePine, Waves, Trees, Target, Building2, Home, BarChart3, Zap, DollarSign, Bell, MapPin, TrendingUp, MapIcon, BookOpen, Wrench, MessageCircle, Facebook, Twitter, Instagram, Linkedin, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PropertyCard from '@/components/property/PropertyCard';
import ExactSearchBar, { PropertyFilters, PropertyFilterUpdate } from '@/components/property/ExactSearchBar';
import { PropertyListView } from '@/components/property/PropertyListView';
import { MobileFiltersSheet } from '@/components/property/MobileFiltersSheet';
import SharePropertyCard from '@/components/property/SharePropertyCard';
import { toast } from '@/hooks/use-toast';
import { clearSearchBoundary, drawSearchBoundary } from '@/lib/mapBoundary';
import * as turf from '@turf/turf';

interface Property {
  id: number;
  title: string;
  description?: string;
  price: string | number;
  acreage: string | number;
  location: string;
  state: string;
  latitude: string | number;
  longitude: string | number;
  propertyType?: string;
  property_type?: string;
  features?: string[];
  amenities?: string[];
  images: string[];
  videoUrl?: string;
  video_url?: string;
  documents?: string[];
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  terrainType?: string;
  terrain_type?: string;
  vegetation?: string;
  waterResources?: string;
  water_resources?: string;
  roadAccess?: boolean | string;
  road_access?: boolean | string;
  utilities?: string;
  zoning?: string;
  isWaterfront?: boolean;
  is_waterfront?: boolean;
  isMountainView?: boolean;
  is_mountain_view?: boolean;
  status?: string;
  featured?: boolean;
  is_featured?: boolean;
  listingAgentId?: number;
  listing_agent_id?: number;
  ownerId?: number;
  owner_id?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  views?: number;
  coordinates?: any;
  boundary?: any;
}

const filterProperty = (property: Property, filters: PropertyFilters): boolean => {
  if (!filters) return true;
  
  const propertyAsAny = property as any;
  
  // ====== Status filter ======
  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
    const propStatus = property.status || propertyAsAny.status || 'active';
    const normalizedPropStatus = propStatus.toLowerCase();
    
    const hasMatchingStatus = filters.status.some(filterStatus => {
      const normalizedFilterStatus = filterStatus.toLowerCase();
      
      // Direct match for database enum values: active, pending, sold, expired
      return normalizedPropStatus === normalizedFilterStatus;
    });
    
    if (!hasMatchingStatus) {
      return false;
    }
  }
  
  if (filters.propertyTypes && Array.isArray(filters.propertyTypes) && filters.propertyTypes.length > 0) {
    const propType = property.propertyType || propertyAsAny.property_type || 'land';
    const normalizedPropType = propType.toLowerCase();
    
    const hasMatchingType = filters.propertyTypes.some(filterType => {
      const normalizedFilterType = filterType.toLowerCase();
      return normalizedPropType.includes(normalizedFilterType) || 
             normalizedFilterType.includes(normalizedPropType);
    });
    
    if (!hasMatchingType) {
      return false;
    }
  }

  if (filters.priceRange && (filters.priceRange.min !== null || filters.priceRange.max !== null)) {
    const priceStr = typeof property.price === 'string' ? property.price : String(property.price);
    const priceNum = parseFloat(priceStr.replace(/[$,]/g, ''));
    
    if (!isNaN(priceNum)) {
      if (filters.priceRange.min !== null && priceNum < filters.priceRange.min) {
        return false;
      }
      if (filters.priceRange.max !== null && priceNum > filters.priceRange.max) {
        return false;
      }
    }
  }

  if (filters.acreageRange && (filters.acreageRange.min !== null || filters.acreageRange.max !== null)) {
    const acreageStr = typeof property.acreage === 'string' ? property.acreage : String(property.acreage);
    const acreageNum = parseFloat(acreageStr.replace(/[^\d.-]/g, ''));
    
    if (!isNaN(acreageNum)) {
      if (filters.acreageRange.min !== null && acreageNum < filters.acreageRange.min) {
        return false;
      }
      if (filters.acreageRange.max !== null && acreageNum > filters.acreageRange.max) {
        return false;
      }
    }
  }

  // Don't apply client-side searchQuery filter - rely on API search results
  // The API already handles intelligent search matching
  // if (filters.searchQuery && filters.searchQuery.trim()) {
  //   const query = filters.searchQuery.toLowerCase();
  //   const searchableText = [
  //     property.title,
  //     property.description,
  //     property.location,
  //     property.state,
  //     property.propertyType || propertyAsAny.property_type,
  //   ].filter(Boolean).join(' ').toLowerCase();
  //   
  //   if (!searchableText.includes(query)) {
  //     return false;
  //   }
  // }

  if (filters.bedrooms > 0) {
    const bedrooms = property.bedrooms || propertyAsAny.bedrooms || 0;
    if (bedrooms < filters.bedrooms) {
      return false;
    }
  }

  if (filters.bathrooms > 0) {
    const bathrooms = property.bathrooms || propertyAsAny.bathrooms || 0;
    if (bathrooms < filters.bathrooms) {
      return false;
    }
  }

  if (filters.propertyVideo) {
    const hasVideo = property.videoUrl || propertyAsAny.video_url || false;
    if (!hasVideo) {
      return false;
    }
  }

  if (filters.includesMineralRights) {
    const propFeatures = property.features || propertyAsAny.features || [];
    const hasMineralRights = propFeatures.some((feature: any) => {
      const featureStr = typeof feature === 'string' ? feature : feature.name || '';
      return featureStr.toLowerCase().includes('mineral') || 
             featureStr.toLowerCase().includes('rights');
    });
    if (!hasMineralRights) {
      return false;
    }
  }

  if (filters.ownerFinancing) {
    const propFeatures = property.features || propertyAsAny.features || [];
    const hasOwnerFinancing = propFeatures.some((feature: any) => {
      const featureStr = typeof feature === 'string' ? feature : feature.name || '';
      return featureStr.toLowerCase().includes('owner financing') || 
             featureStr.toLowerCase().includes('seller financing');
    });
    if (!hasOwnerFinancing) {
      return false;
    }
  }

  if (filters.virtualTour) {
    const propFeatures = property.features || propertyAsAny.features || [];
    const hasVirtualTour = propFeatures.some((feature: any) => {
      const featureStr = typeof feature === 'string' ? feature : feature.name || '';
      return featureStr.toLowerCase().includes('virtual tour') || 
             featureStr.toLowerCase().includes('3d tour');
    });
    if (!hasVirtualTour) {
      return false;
    }
  }

  if (filters.activities && Array.isArray(filters.activities) && filters.activities.length > 0) {
    const propFeatures = property.features || propertyAsAny.features || [];
    const propAmenities = property.amenities || propertyAsAny.amenities || [];
    const propDescription = property.description || propertyAsAny.description || '';
    
    const hasMatchingActivity = filters.activities.some(activity => {
      const activityLower = activity.toLowerCase();
      
      const featureMatch = propFeatures.some((feature: any) => {
        const featureStr = typeof feature === 'string' ? feature : feature.name || '';
        return featureStr.toLowerCase().includes(activityLower);
      });
      
      const amenityMatch = propAmenities.some((amenity: any) => {
        const amenityStr = typeof amenity === 'string' ? amenity : amenity.name || '';
        return amenityStr.toLowerCase().includes(activityLower);
      });
      
      const descriptionMatch = propDescription.toLowerCase().includes(activityLower);
      
      return featureMatch || amenityMatch || descriptionMatch;
    });
    
    if (!hasMatchingActivity) {
      return false;
    }
  }

  if (filters.hasResidence && filters.hasResidence !== 'either') {
    const bedrooms = property.bedrooms || propertyAsAny.bedrooms || 0;
    const sqft = property.sqft || propertyAsAny.sqft || 0;
    const hasResidence = bedrooms > 0 || sqft > 0;
    
    if (filters.hasResidence === 'yes' && !hasResidence) {
      return false;
    }
    if (filters.hasResidence === 'no' && hasResidence) {
      return false;
    }
  }

  return true;
};

const filterProperties = (properties: Property[], filters: PropertyFilters): Property[] => {
  if (!filters) return properties;
  return properties.filter(property => filterProperty(property, filters));
};

/**
 * Reliable country detection using GPS coordinates.
 * Zimbabwe: roughly lat -22.4 to -15.6, lng 25.2 to 33.1
 * US (including Alaska + Hawaii): lat 18 to 72, lng -180 to -66
 * Returns 'zw' | 'us' | 'other'
 */
function detectCountry(lat: number, lng: number): 'zw' | 'us' | 'other' {
  if (lat >= -22.5 && lat <= -15.5 && lng >= 25.0 && lng <= 33.2) return 'zw';
  if (lat >= 18.0 && lat <= 72.0 && lng >= -180.0 && lng <= -66.0) return 'us';
  return 'other';
}

function isZimbabweProperty(p: Property): boolean {
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return detectCountry(lat, lng) === 'zw';
  }
  // Fallback: location string
  const loc = ((p.location || '') + ' ' + (p.state || '') + ' ' + (p.title || '')).toLowerCase();
  return loc.includes('zimbabwe') || loc.includes('bulawayo') || loc.includes('harare') ||
         loc.includes('matabeleland') || loc.includes('mashonaland');
}

/**
 * Apply country-context filter: returns only properties from the expected country.
 * Only activates when a real search location is present — no filtering on the
 * default/empty state so the homepage view shows all properties.
 *
 * When searchLocation is Zimbabwe-related → keep ZW properties.
 * When searchLocation is US-related      → keep US properties.
 * When searchLocation is empty/unknown   → return all (no filter).
 */
function applyCountryFilter(properties: Property[], searchLocation: string): Property[] {
  if (properties.length === 0 || !searchLocation.trim()) return properties;
  const loc = searchLocation.toLowerCase();

  // Detect Zimbabwe intent
  const wantsZim = loc.includes('zimbabwe') || loc.includes('harare') ||
                   loc.includes('bulawayo') || loc.includes('matabeleland') ||
                   loc.includes('mashonaland');

  // Detect US intent (any recognizable US city, state, or "united states")
  const usKeywords = ['united states', 'usa', ', tx', ', ca', ', fl', ', ny', ', co',
    'texas', 'california', 'florida', 'new york', 'colorado', 'arizona', 'alaska',
    'hawaii', 'montana', 'wyoming', 'washington', 'oregon', 'nevada', 'utah',
    'dallas', 'austin', 'miami', 'denver', 'seattle', 'phoenix', 'las vegas',
    'los angeles', 'chicago', 'houston', 'nashville', 'fort worth'];
  const wantsUS = usKeywords.some(k => loc.includes(k));

  if (!wantsZim && !wantsUS) return properties; // Unknown location — show all
  return properties.filter(p => wantsZim ? isZimbabweProperty(p) : !isZimbabweProperty(p));
}

// Helper to read sessionStorage synchronously for initial state
// SSR-safe: guards for window/sessionStorage availability
const getInitialViewportFromSession = (): { lat: number; lng: number; zoom: number } | null => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const geocodedLocationStr = sessionStorage.getItem('geocodedLocation');
    if (geocodedLocationStr) {
      const geocodedLocation = JSON.parse(geocodedLocationStr);
      if (geocodedLocation.latitude && geocodedLocation.longitude) {
        return {
          lat: geocodedLocation.latitude,
          lng: geocodedLocation.longitude,
          zoom: geocodedLocation.zoom || 10
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse geocodedLocation from sessionStorage');
  }
  return null;
};

// SSR-safe: guards for window/sessionStorage availability
const getInitialBoundsFromSession = (): [number, number, number, number] | null => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const geocodedLocationStr = sessionStorage.getItem('geocodedLocation');
    const pendingBoundsStr = sessionStorage.getItem('pendingMapBounds');
    
    if (pendingBoundsStr) {
      const bbox = JSON.parse(pendingBoundsStr);
      if (Array.isArray(bbox) && bbox.length === 4 && bbox.every((c: number) => !isNaN(c) && isFinite(c))) {
        return bbox as [number, number, number, number];
      }
    }
    
    if (geocodedLocationStr) {
      const geocodedLocation = JSON.parse(geocodedLocationStr);
      if (geocodedLocation.useBbox && geocodedLocation.bbox && Array.isArray(geocodedLocation.bbox)) {
        const bbox = geocodedLocation.bbox;
        if (bbox.length === 4 && bbox.every((c: number) => !isNaN(c) && isFinite(c))) {
          return bbox as [number, number, number, number];
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse bounds from sessionStorage');
  }
  return null;
};

// Check if we're coming from a search (has ?q= param)
const getInitialSearchCounter = (): number => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q') ? 1 : 0; // Start in search mode if we have a query
  }
  return 0;
};

const PropertiesPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [displayProperties, setDisplayProperties] = useState<Property[]>([]); // Single source of truth for sidebar
  const [mapLoaded, setMapLoaded] = useState(false);
  const [initialState, setInitialState] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(true);
  const [hasBoundary, setHasBoundary] = useState(false);
  const [boundaryPolygon, setBoundaryPolygon] = useState<any>(null);
  // Reactive state (not ref) so boundary filter memos re-run when this populates
  const [fullPropertyList, setFullPropertyList] = useState<Property[]>([]);
  const [mobileViewMode, setMobileViewMode] = useState<'map' | 'list'>('map'); // Mobile-specific: which view is shown
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false); // Mobile filters sheet state
  const [sortBy, setSortBy] = useState<string>("newest");
  // Share modal state for map popup integration
  const [shareModalProperty, setShareModalProperty] = useState<{
    id: number;
    title: string;
    price: number | string;
    location?: string;
    state: string;
    size: number;
    propertyType: string;
    images: string[];
  } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState<string>('Dallas, TX');
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null);
  // CRITICAL FIX: Read sessionStorage SYNCHRONOUSLY in useState initializer
  // This ensures SimpleMap receives viewport/bounds on FIRST render, not after async useEffect
  const [initialViewport, setInitialViewport] = useState<{lat: number, lng: number, zoom: number} | null>(() => getInitialViewportFromSession());
  const [initialBounds, setInitialBounds] = useState<[number, number, number, number] | null>(() => getInitialBoundsFromSession());
  const [searchBounds, setSearchBounds] = useState<[number, number, number, number] | null>(null);
  // CRITICAL FIX: Initialize searchCounter based on URL params synchronously
  const [searchCounter, setSearchCounter] = useState<number>(() => getInitialSearchCounter());
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');
  const hasAppliedInitialViewport = useRef<boolean>(false); // Prevent initialViewport reapplication
  // CRITICAL FIX: Initialize ref synchronously to match state
  const searchCounterRef = useRef<number>(getInitialSearchCounter()); // Ref to avoid stale closure in callbacks
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({
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
  
  // Listen for share modal events from map popups
  useEffect(() => {
    const handleOpenShareModal = (event: CustomEvent) => {
      const propertyData = event.detail;
      setShareModalProperty({
        id: propertyData.id,
        title: propertyData.title,
        price: propertyData.price,
        location: propertyData.location,
        state: propertyData.state,
        size: propertyData.size,
        propertyType: propertyData.propertyType,
        images: propertyData.images
      });
      setShareModalOpen(true);
    };
    
    window.addEventListener('openShareModal', handleOpenShareModal as EventListener);
    return () => {
      window.removeEventListener('openShareModal', handleOpenShareModal as EventListener);
    };
  }, []);

  // Listen for boundary draw/clear events from mapBoundary
  useEffect(() => {
    const handleBoundaryChanged = (e: CustomEvent) => {
      const active = Boolean(e.detail?.active);
      setHasBoundary(active);
      setBoundaryPolygon(active && e.detail?.polygon ? e.detail.polygon : null);
    };
    window.addEventListener('boundaryChanged', handleBoundaryChanged as EventListener);
    return () => {
      window.removeEventListener('boundaryChanged', handleBoundaryChanged as EventListener);
    };
  }, []);

  // Pre-load the FULL property list for boundary filtering, but only if a search
  // query already loaded a subset (the main fetch below handles the no-search case).
  // Delayed to avoid a simultaneous flood of API calls on page load.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasSearch = Boolean(urlParams.get('q') || sessionStorage.getItem('searchResults'));
    if (!hasSearch) return; // No search → main fetch already gets all properties

    const delay = setTimeout(() => {
      if (fullPropertyList.length > 0) return; // Already populated
      fetch('/api/properties')
        .then(r => r.json())
        .then((data: Property[]) => {
          console.log(`[boundary] Full property cache loaded: ${data.length}`);
          setFullPropertyList(data);
        })
        .catch(err => console.warn('[boundary] Preload failed:', err));
    }, 1500); // Wait 1.5 s so the main search fetch can finish first

    return () => clearTimeout(delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // SIMPLIFIED: visibleProperties is just displayProperties (map already gave us viewport-filtered data)
  // Filters are applied ONCE in filteredAndSortedProperties below
  const visibleProperties = useMemo(() => {
    return displayProperties;
  }, [displayProperties]);

  // Point-in-polygon check using @turf/turf
  // boundaryPolygon is a GeoJSON FeatureCollection — turf needs the first Feature, not the collection
  const isInBoundary = useCallback((p: Property): boolean => {
    if (!boundaryPolygon) return true;
    try {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return false;
      const polyFeature = boundaryPolygon?.features?.[0] ?? boundaryPolygon;
      return turf.booleanPointInPolygon(turf.point([lng, lat]), polyFeature);
    } catch {
      return false;
    }
  }, [boundaryPolygon]);
  
  // CRITICAL: Filtered allProperties for the map - this is what gets passed to SimpleMap
  // When boundary is active we use the FULL db property list so markers outside the
  // boundary disappear even if the current search only returned a subset.
  const filteredPropertiesForMap = useMemo(() => {
    let base = boundaryPolygon && fullPropertyList.length > 0
      ? fullPropertyList
      : allProperties;
    // Always apply country filter — no Zimbabwe on a US map and vice versa
    base = applyCountryFilter(base, searchLocation);
    let filtered = filterProperties(base, propertyFilters);
    if (boundaryPolygon) filtered = filtered.filter(isInBoundary);
    console.log(`filteredPropertiesForMap: ${filtered.length} properties (boundary: ${boundaryPolygon ? 'ON' : 'OFF'}, country: ${searchLocation || 'US'})`);
    return filtered;
  }, [allProperties, fullPropertyList, propertyFilters, boundaryPolygon, isInBoundary, searchLocation]);

  // Reusable function to load all properties from API
  const loadAllProperties = useCallback(async () => {
    try {
      console.log('Loading all properties from API...');
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Loaded all properties:', data.length);
      setFullPropertyList(data); // Reactive cache for boundary filtering
      setAllProperties(data);
      setDisplayProperties(data);
      return data;
    } catch (error) {
      console.error('Error loading properties:', error);
      return [];
    }
  }, []);

  // Fetch all properties on mount OR perform search if URL has query parameter
  useEffect(() => {
    const fetchPropertiesOrSearch = async () => {
      try {
        // Parse URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        const hasSearchFlag = urlParams.get('search') === 'true';
        
        // Check for cached search results from homepage navigation
        const cachedSearchResults = sessionStorage.getItem('searchResults');
        let parsedCachedResults: any = null;
        if (cachedSearchResults) {
          try {
            parsedCachedResults = JSON.parse(cachedSearchResults);
            // Clear after reading to prevent stale data on refresh
            sessionStorage.removeItem('searchResults');
          } catch (e) {
            console.warn('Failed to parse cached search results');
          }
        }
        
        // Store the initial search query for the search bar
        if (searchQuery) {
          setInitialSearchQuery(searchQuery);
          // Draw boundary immediately for homepage → /properties navigation
          drawSearchBoundary(searchQuery);
        } else if (parsedCachedResults?.interpretation?.extractedCriteria?.location) {
          const loc = parsedCachedResults.interpretation.extractedCriteria.location;
          setInitialSearchQuery(loc);
          drawSearchBoundary(loc);
        }
        
        // Priority: 1. URL query param, 2. Cached search results from homepage, 3. Load all
        if (searchQuery) {
          // If we have a search query, call the AI search API
          
          const response = await fetch('/api/ai/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: searchQuery }),
          });
          
          if (!response.ok) {
            console.error('Search API failed, falling back to all properties');
            // Fallback to all properties if search fails
            const allResponse = await fetch('/api/properties');
            const allData = await allResponse.json();
            setAllProperties(allData);
            setDisplayProperties(allData); // Initialize display with all
          } else {
            const searchData = await response.json();
            
            if (searchData.properties && searchData.properties.length > 0) {
              setAllProperties(searchData.properties);
              setDisplayProperties(searchData.properties); // Display search results
              searchCounterRef.current = 1; // Update ref for search mode
              setSearchCounter(prev => prev + 1); // Mark as search mode
              
              // FALLBACK: If no geocoded location in sessionStorage, calculate bounds from search results
              // This ensures map shows markers even when geocoding fails
              const hasGeocodedLocation = sessionStorage.getItem('geocodedLocation');
              if (!hasGeocodedLocation && searchData.properties.length > 0) {
                console.log('No geocoded location - computing bounds from search results');
                let minLng = Infinity, maxLng = -Infinity;
                let minLat = Infinity, maxLat = -Infinity;
                let validCoords = 0;
                
                searchData.properties.forEach((prop: Property) => {
                  const lat = parseFloat(String(prop.latitude));
                  const lng = parseFloat(String(prop.longitude));
                  if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
                    minLat = Math.min(minLat, lat);
                    maxLat = Math.max(maxLat, lat);
                    minLng = Math.min(minLng, lng);
                    maxLng = Math.max(maxLng, lng);
                    validCoords++;
                  }
                });
                
                if (validCoords > 0) {
                  // Add padding to bounds (5% on each side)
                  const latPadding = (maxLat - minLat) * 0.05 || 0.1;
                  const lngPadding = (maxLng - minLng) * 0.05 || 0.1;
                  const fallbackBounds: [number, number, number, number] = [
                    minLng - lngPadding,
                    minLat - latPadding,
                    maxLng + lngPadding,
                    maxLat + latPadding
                  ];
                  console.log('Computed fallback bounds from results:', fallbackBounds);
                  setSearchBounds(fallbackBounds);
                }
              }
            } else {
              // No results from search, load all properties
              console.log('Properties page: No search results, loading all properties');
              const allResponse = await fetch('/api/properties');
              const allData = await allResponse.json();
              setAllProperties(allData);
              setDisplayProperties(allData); // Initialize display with all
            }
          }
        } else if (parsedCachedResults && parsedCachedResults.properties && parsedCachedResults.properties.length > 0) {
          // Use cached search results from homepage navigation
          console.log('Properties page: Using cached search results from homepage:', parsedCachedResults.properties.length);
          setAllProperties(parsedCachedResults.properties);
          setDisplayProperties(parsedCachedResults.properties);
          searchCounterRef.current = 1;
          setSearchCounter(prev => prev + 1);
          
          // Update search location from interpretation
          if (parsedCachedResults.interpretation?.extractedCriteria?.location) {
            setSearchLocation(parsedCachedResults.interpretation.extractedCriteria.location);
            setPropertyFilters(prev => ({
              ...prev,
              searchQuery: parsedCachedResults.interpretation.extractedCriteria.location
            }));
          }
        } else {
          // No search query or cached results, load all properties
          const response = await fetch('/api/properties');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log('Fetched all properties:', data.length);
          setFullPropertyList(data); // Reactive cache for boundary filtering
          setAllProperties(data);
          setDisplayProperties(data); // Initialize display with all - map will update via onPropertiesChange
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchPropertiesOrSearch();
  }, []);

  // Read geocoded location AND search results from sessionStorage on mount (only once to prevent flickering)
  // Note: initialViewport and initialBounds are now read synchronously in useState initializers
  // This useEffect now only handles hydrating search results and setting search location display
  useEffect(() => {
    // CRITICAL FIX: Mark as applied immediately since we read synchronously in useState
    // This prevents any double-application of viewport/bounds
    if (initialViewport || initialBounds) {
      hasAppliedInitialViewport.current = true;
    }
    
    try {
      // Read geocoded location from sessionStorage
      // Note: searchResults hydration is now handled in fetchPropertiesOrSearch useEffect
      const geocodedLocationStr = sessionStorage.getItem('geocodedLocation');
      
      // Only update search location display - viewport/bounds are already set from useState
      if (geocodedLocationStr) {
        const geocodedLocation = JSON.parse(geocodedLocationStr);
        console.log('Properties page: Found geocoded location from search:', geocodedLocation);
        
        // Update search location display
        if (geocodedLocation.placeName) {
          setSearchLocation(geocodedLocation.placeName);
        }
        
        // Update property filters based on location type
        if (geocodedLocation.state) {
          setInitialState(geocodedLocation.state);
        }
        
        // Clear sessionStorage after consuming
        sessionStorage.removeItem('geocodedLocation');
        sessionStorage.removeItem('pendingMapBounds');
        console.log('Properties page: Cleared geocoded location from sessionStorage');
      }
    } catch (error) {
      console.error('Error reading geocoded location from sessionStorage:', error);
    }
  }, []);

  const handlePropertySelect = useCallback((propertyId: number) => {
    navigate(`/property/${propertyId}`);
  }, [navigate]);


  // Handle properties change from map - ONLY updates display when not in search mode
  const handlePropertiesChange = useCallback((newProperties: Property[]) => {
    // Use ref to get current search state (avoids stale closure)
    const currentSearchCounter = searchCounterRef.current;
    console.log('Properties page: handlePropertiesChange called with', newProperties.length, 'properties, searchCounter:', currentSearchCounter);
    
    // Only update displayProperties when NOT in search mode
    // This is the key fix - map drags should update the sidebar list
    if (currentSearchCounter === 0) {
      setDisplayProperties(newProperties);
      setCurrentPage(1);
      
      // Update location header based on visible properties
      if (newProperties.length > 0) {
        const stateCounts: { [key: string]: number } = {};
        const cityCounts: { [key: string]: number } = {};
        
        newProperties.forEach(property => {
          if (property.state) {
            stateCounts[property.state] = (stateCounts[property.state] || 0) + 1;
          }
          if (property.location) {
            const parts = property.location.split(',').map(part => part.trim());
            if (parts.length >= 3) {
              const cityPart = parts[1].trim();
              if (cityPart && cityPart.length > 2) {
                cityCounts[cityPart] = (cityCounts[cityPart] || 0) + 1;
              }
            }
          }
        });
        
        const mostCommonState = Object.entries(stateCounts)
          .sort(([,a], [,b]) => b - a)[0];
        const mostCommonCity = Object.entries(cityCounts)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (mostCommonState && mostCommonCity) {
          setSearchLocation(`${mostCommonCity[0]}, ${mostCommonState[0]}`);
        } else if (mostCommonState) {
          setSearchLocation(mostCommonState[0]);
        }
      }
    }
  }, []);

  // Exit search mode - reset to show all properties until map updates viewport
  const handleExitSearchMode = useCallback(async () => {
    console.log('Exiting search mode - resetting to viewport-based display');
    searchCounterRef.current = 0; // Update ref immediately
    setSearchCounter(0);
    setSearchBounds(null);
    setSearchLocation('');
    // Reload full property dataset so viewport filtering has all 350 properties
    await loadAllProperties();
  }, [loadAllProperties]);

  const filteredAndSortedProperties = useMemo(() => {
    // When boundary is active, show ALL db properties inside the boundary (not just search results).
    // This matches Zillow-style behavior: the geographic boundary IS the primary filter.
    let base = boundaryPolygon && fullPropertyList.length > 0
      ? fullPropertyList
      : visibleProperties;

    // ALWAYS apply coordinate-based country filter so US searches never show Zimbabwe
    // and Zimbabwe searches never show US — regardless of whether a boundary is active.
    base = applyCountryFilter(base, searchLocation);

    let result = filterProperties(base, propertyFilters);
    if (boundaryPolygon) result = result.filter(isInBoundary);

    switch (sortBy) {
      case "price-high":
        result.sort((a, b) => {
          const priceA = parseFloat(String(a.price).replace(/[$,]/g, '')) || 0;
          const priceB = parseFloat(String(b.price).replace(/[$,]/g, '')) || 0;
          return priceB - priceA;
        });
        break;
      case "price-low":
        result.sort((a, b) => {
          const priceA = parseFloat(String(a.price).replace(/[$,]/g, '')) || 0;
          const priceB = parseFloat(String(b.price).replace(/[$,]/g, '')) || 0;
          return priceA - priceB;
        });
        break;
      case "acreage-high":
        result.sort((a, b) => {
          const acreageA = parseFloat(String(a.acreage).replace(/[^\d.-]/g, '')) || 0;
          const acreageB = parseFloat(String(b.acreage).replace(/[^\d.-]/g, '')) || 0;
          return acreageB - acreageA;
        });
        break;
      case "acreage-low":
        result.sort((a, b) => {
          const acreageA = parseFloat(String(a.acreage).replace(/[^\d.-]/g, '')) || 0;
          const acreageB = parseFloat(String(b.acreage).replace(/[^\d.-]/g, '')) || 0;
          return acreageA - acreageB;
        });
        break;
      case "newest":
      default:
        break;
    }
    
    return result;
  }, [visibleProperties, fullPropertyList, sortBy, propertyFilters, boundaryPolygon, isInBoundary, searchLocation]);

  // Calculate active filter count for the mobile filter button badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (propertyFilters.propertyTypes?.length > 0) count += propertyFilters.propertyTypes.length;
    if (propertyFilters.priceRange?.min !== null || propertyFilters.priceRange?.max !== null) count++;
    if (propertyFilters.acreageRange?.min !== null || propertyFilters.acreageRange?.max !== null) count++;
    if (propertyFilters.includesMineralRights) count++;
    if (propertyFilters.ownerFinancing) count++;
    if (propertyFilters.hasResidence !== 'either') count++;
    if (propertyFilters.terrainType?.length > 0) count += propertyFilters.terrainType.length;
    if (propertyFilters.virtualTour) count++;
    return count;
  }, [propertyFilters]);

  const propertiesPerPage = 20;
  const totalPages = Math.ceil(filteredAndSortedProperties.length / propertiesPerPage);
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = filteredAndSortedProperties.slice(indexOfFirstProperty, indexOfLastProperty);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  const setMapView = (showMapView: boolean) => {
    console.log(`Setting map view to: ${showMapView}`);
    setShowMap(showMapView);
  };
  
  const handlePropertyFiltersChange = useCallback((updatedFilters: PropertyFilters) => {
    console.log('FILTER DEBUG - Filters updated:', updatedFilters);
    console.log('FILTER DEBUG - All properties count:', allProperties.length);
    setPropertyFilters(updatedFilters);
    setCurrentPage(1);
  }, [allProperties, setPropertyFilters, setCurrentPage]);

  const performSearch = useCallback(async (query: string, coordinates?: { lat: number; lng: number }) => {
    console.log('=== performSearch CALLED ===');
    console.log('Query:', query, 'Coordinates:', coordinates);
    
    // CRITICAL: Clear searchBounds at the START of every search
    // This prevents stale bounds from overriding ExactSearchBar's flyTo positioning
    setSearchBounds(null);
    
    setSearchLocation(query || 'Dallas, TX');
    
    if (!query || !query.trim()) {
      console.log('Empty query - fetching all properties');
      try {
        const response = await fetch('/api/properties');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched all properties:', data.length);
          setAllProperties(data);
          setDisplayProperties(data);
          searchCounterRef.current = 0;
          setSearchCounter(0);
          setSearchBounds(null);
        }
      } catch (error) {
        console.error('Error fetching all properties:', error);
      }
      setCurrentPage(1);
      return;
    }
    
    console.log(`Calling AI search API with query: "${query}"${coordinates ? ` at ${coordinates.lat}, ${coordinates.lng}` : ''}`);
    try {
      // Build request body with optional coordinates for "nearest properties" fallback
      const requestBody: { query: string; latitude?: number; longitude?: number } = { query };
      if (coordinates) {
        requestBody.latitude = coordinates.lat;
        requestBody.longitude = coordinates.lng;
      }
      
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('AI search response status:', response.status);
      
      if (!response.ok) {
        console.error('Search API failed with status:', response.status);
        toast({
          title: "Search failed",
          description: "Unable to perform search. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      const searchData = await response.json();
      console.log('AI search returned data:', {
        propertiesCount: searchData.properties?.length || 0,
        interpretation: searchData.interpretation
      });
      
      if (searchData.properties && searchData.properties.length > 0) {
        console.log(`Setting ${searchData.properties.length} properties from search`);
        
        // CRITICAL: Update ref FIRST before any state changes
        // This ensures map event handlers see search mode immediately
        searchCounterRef.current = searchCounterRef.current + 1;
        console.log('Search mode activated - searchCounterRef:', searchCounterRef.current);
        
        // Now update state (map events that fire will see the ref value)
        setAllProperties(searchData.properties);
        setDisplayProperties(searchData.properties); // Display search results in sidebar
        setSearchCounter(prev => prev + 1);
        
        // NOTE: Do NOT set searchBounds here!
        // The ExactSearchBar handles map positioning via flyTo/fitBounds to the SEARCHED address.
        // If we set searchBounds here, the map would zoom to where PROPERTIES are located,
        // overriding the user's searched address. Let ExactSearchBar control map position.
      } else {
        console.log(`Search returned zero results for query: "${query}"`);
        setAllProperties([]);
        setDisplayProperties([]); // Clear display
        setSearchBounds(null);
        searchCounterRef.current = 0;
        setSearchCounter(0);
        
        toast({
          title: "No results found",
          description: `No properties found for "${query}". Try a different search.`,
        });
      }
    } catch (error) {
      console.error('Error performing search:', error);
      toast({
        title: "Search error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
    }
    
    setCurrentPage(1);
  }, []);

  const convertFilterUpdateToFilters = useCallback((filterUpdate: PropertyFilterUpdate, currentFilters: PropertyFilters) => {
    const updatedFilters = { ...currentFilters };
    
    switch (filterUpdate.type) {
      case 'propertyType':
        if (Array.isArray(updatedFilters.propertyTypes)) {
          if (updatedFilters.propertyTypes.includes(filterUpdate.value)) {
            updatedFilters.propertyTypes = updatedFilters.propertyTypes.filter(type => type !== filterUpdate.value);
          } else {
            updatedFilters.propertyTypes = [...updatedFilters.propertyTypes, filterUpdate.value];
          }
        } else {
          updatedFilters.propertyTypes = [filterUpdate.value];
        }
        break;
      case 'propertyTypes':
        // Direct set for propertyTypes array (used by clearAll)
        updatedFilters.propertyTypes = filterUpdate.value || [];
        break;
      case 'priceRange':
        updatedFilters.priceRange = filterUpdate.value;
        break;
      case 'acreageRange':
        updatedFilters.acreageRange = filterUpdate.value;
        break;
      case 'features':
        const feature = filterUpdate.value;
        if (Array.isArray(updatedFilters.features)) {
          if (updatedFilters.features.includes(feature)) {
            updatedFilters.features = updatedFilters.features.filter(f => f !== feature);
          } else {
            updatedFilters.features = [...updatedFilters.features, feature];
          }
        } else {
          updatedFilters.features = [feature];
        }
        break;
      case 'terrainType':
        updatedFilters.terrainType = filterUpdate.value;
        break;
      case 'hasVideo':
        updatedFilters.hasVideo = filterUpdate.value;
        break;
      case 'searchQuery':
        updatedFilters.searchQuery = filterUpdate.value;
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
      case 'status':
        updatedFilters.status = filterUpdate.value;
        break;
      case 'comprehensive':
        console.log('FILTER DEBUG - Comprehensive update received:', filterUpdate.value);
        return filterUpdate.value;
    }
    
    return updatedFilters;
  }, []);

  // Mobile search state - synced with initial query
  const [mobileSearchQuery, setMobileSearchQuery] = useState(initialSearchQuery || propertyFilters.searchQuery || '');
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);
  const [isMobileSearching, setIsMobileSearching] = useState(false);
  const [mobileSuggestions, setMobileSuggestions] = useState<Array<{id: string, placeName: string, mainText: string, secondaryText: string, center: [number, number], bbox?: [number, number, number, number]}>>([]);
  const [isLoadingMobileSuggestions, setIsLoadingMobileSuggestions] = useState(false);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  
  // Keep mobile search query synced with filter changes
  useEffect(() => {
    // Sync on any change including empty strings
    if (propertyFilters.searchQuery !== undefined && propertyFilters.searchQuery !== mobileSearchQuery) {
      setMobileSearchQuery(propertyFilters.searchQuery || '');
    }
  }, [propertyFilters.searchQuery]);
  
  // Fetch mobile suggestions when query changes (debounced)
  useEffect(() => {
    const fetchMobileSuggestions = async () => {
      if (!mobileSearchQuery || mobileSearchQuery.length < 2) {
        setMobileSuggestions([]);
        setShowMobileSuggestions(false);
        return;
      }
      
      setIsLoadingMobileSuggestions(true);
      try {
        const configResponse = await fetch('/api/config');
        if (!configResponse.ok) return;
        const config = await configResponse.json();
        const mapboxToken = config.mapboxApiKey;
        if (!mapboxToken) return;
        
        const encodedQuery = encodeURIComponent(mobileSearchQuery);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&types=place,district,locality,neighborhood,address,region&limit=5&language=en`;
        
        const response = await fetch(url);
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.features) return;
        
        const suggestions = data.features.map((feature: any) => ({
          id: feature.id,
          placeName: feature.place_name,
          mainText: feature.text,
          secondaryText: (feature.context || []).map((c: any) => c.text).join(', '),
          center: feature.center as [number, number],
          bbox: feature.bbox
        }));
        
        setMobileSuggestions(suggestions);
        if (suggestions.length > 0 && mobileSearchFocused) {
          setShowMobileSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching mobile suggestions:', error);
      } finally {
        setIsLoadingMobileSuggestions(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchMobileSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [mobileSearchQuery, mobileSearchFocused]);
  
  // Handle mobile suggestion selection
  const handleMobileSuggestionSelect = async (suggestion: typeof mobileSuggestions[0]) => {
    setMobileSearchQuery(suggestion.placeName);
    setShowMobileSuggestions(false);
    setMobileSuggestions([]);
    setIsMobileSearching(true);
    
    try {
      // Store geocoded location
      const geocodedLocation = {
        longitude: suggestion.center[0],
        latitude: suggestion.center[1],
        placeName: suggestion.placeName,
        bbox: suggestion.bbox,
        useBbox: !!suggestion.bbox
      };
      sessionStorage.setItem('geocodedLocation', JSON.stringify(geocodedLocation));
      
      // Fly map to location using protected method (prevents premature search mode exit)
      const protectedFly = (window as any).__simpleMapProtectedFly;
      if (protectedFly) {
        if (suggestion.bbox && Array.isArray(suggestion.bbox) && suggestion.bbox.length === 4) {
          protectedFly({ bbox: suggestion.bbox as [number, number, number, number] });
        } else {
          protectedFly({ center: suggestion.center, zoom: 10 });
        }
      }
      
      // Update filters and search location
      const updatedFilters = { ...propertyFilters, searchQuery: suggestion.placeName };
      setPropertyFilters(updatedFilters);
      setSearchLocation(suggestion.placeName);
      
      // Perform search
      await performSearch(suggestion.placeName, { lat: suggestion.center[1], lng: suggestion.center[0] });
    } catch (error) {
      console.error('Mobile suggestion select error:', error);
    } finally {
      setIsMobileSearching(false);
    }
  };
  
  // Geocode function for mobile search - mirrors desktop ExactSearchBar exactly
  const geocodeMobileSearch = async (query: string): Promise<{ lat: number; lng: number; state?: string; bbox?: [number, number, number, number] } | undefined> => {
    try {
      // Get mapbox token from config
      const configResponse = await fetch('/api/config');
      if (!configResponse.ok) return undefined;
      const config = await configResponse.json();
      const mapboxToken = config.mapboxApiKey;
      if (!mapboxToken) return undefined;
      
      const encodedLocation = encodeURIComponent(query);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) return undefined;
      
      const data = await response.json();
      if (!data.features || data.features.length === 0) return undefined;
      
      const feature = data.features[0];
      
      // Extract state from context (like desktop ExactSearchBar)
      let state = '';
      if (feature.context) {
        const stateContext = feature.context.find((c: any) => c.id?.startsWith('region'));
        if (stateContext) {
          state = stateContext.text;
        }
      }
      
      // Determine zoom level based on result type (like desktop ExactSearchBar)
      let zoom = 10;
      if (feature.place_type?.includes('region')) {
        zoom = 6;
      } else if (feature.place_type?.includes('place')) {
        zoom = 10;
      } else if (feature.place_type?.includes('address')) {
        zoom = 15;
      }
      
      // Store geocoded location in sessionStorage for map positioning (full payload like desktop)
      const geocodedLocation = {
        longitude: feature.center[0],
        latitude: feature.center[1],
        placeName: feature.place_name,
        type: feature.place_type?.[0] || 'place',
        state,
        zoom,
        bbox: feature.bbox,
        useBbox: !!feature.bbox && Array.isArray(feature.bbox) && feature.bbox.length === 4
      };
      sessionStorage.setItem('geocodedLocation', JSON.stringify(geocodedLocation));
      if (feature.bbox && Array.isArray(feature.bbox) && feature.bbox.length === 4) {
        sessionStorage.setItem('pendingMapBounds', JSON.stringify(feature.bbox));
      }
      
      // CRITICAL: Use protected fly method to prevent premature search mode exit
      const protectedFly = (window as any).__simpleMapProtectedFly;
      if (protectedFly) {
        console.log('Mobile search: Flying map to', geocodedLocation.placeName);
        
        if (feature.bbox && Array.isArray(feature.bbox) && feature.bbox.length === 4) {
          protectedFly({ bbox: feature.bbox as [number, number, number, number] });
        } else {
          protectedFly({ center: [feature.center[0], feature.center[1]] as [number, number], zoom: zoom });
        }
      }
      
      return { 
        lat: feature.center[1], 
        lng: feature.center[0], 
        state,
        bbox: feature.bbox 
      };
    } catch (error) {
      console.error('Mobile geocoding error:', error);
      return undefined;
    }
  };
  
  const handleMobileSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileSearchFocused(false);
    
    // Handle empty query - reset to browse mode (like desktop)
    if (!mobileSearchQuery.trim()) {
      // Clear all search state
      const updatedFilters = { ...propertyFilters, searchQuery: '' };
      setPropertyFilters(updatedFilters);
      setSearchLocation('');
      
      // Clear sessionStorage
      sessionStorage.removeItem('geocodedLocation');
      sessionStorage.removeItem('pendingMapBounds');
      
      // Reset search mode
      searchCounterRef.current = 0;
      setSearchCounter(0);
      setSearchBounds(null);
      
      // Reload all properties
      await loadAllProperties();
      return;
    }
    
    setIsMobileSearching(true);
    
    try {
      // Geocode the query first (like desktop ExactSearchBar)
      const geocodeResult = await geocodeMobileSearch(mobileSearchQuery);
      
      // Update filter state to sync search query (keeps capsule in sync)
      const updatedFilters = { ...propertyFilters, searchQuery: mobileSearchQuery };
      setPropertyFilters(updatedFilters);
      
      // Update search location display
      setSearchLocation(mobileSearchQuery);
      
      // Update initial state if geocoding found a state
      if (geocodeResult?.state) {
        setInitialState(geocodeResult.state);
      }
      
      // Perform search with coordinates for nearest-properties fallback
      await performSearch(mobileSearchQuery, geocodeResult ? { lat: geocodeResult.lat, lng: geocodeResult.lng } : undefined);
    } catch (error) {
      console.error('Mobile search error:', error);
      // On failure, restore full inventory like desktop
      toast({
        title: "Search error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
      await loadAllProperties();
    } finally {
      setIsMobileSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop: Original ExactSearchBar */}
      <div className="hidden md:block">
        <ExactSearchBar
          propertyCount={filteredAndSortedProperties.length}
          showMapProp={showMap}
          onMapViewChange={(mapViewValue: boolean) => {
            console.log('Properties - Map view changed to:', mapViewValue);
            setMapView(mapViewValue);
          }}
          onFilterChange={(filterUpdate: PropertyFilterUpdate) => {
            console.log('FILTER DEBUG - Filter update received:', filterUpdate);
            const newFilters = convertFilterUpdateToFilters(filterUpdate, propertyFilters);
            console.log('FILTER DEBUG - New filters after conversion:', newFilters);
            handlePropertyFiltersChange(newFilters);
          }}
          onSearch={performSearch}
          currentLocation={searchLocation || 'Dallas, TX'}
          filteredProperties={filteredAndSortedProperties}
          initialQuery={initialSearchQuery}
          visiblePropertyCount={filteredAndSortedProperties.length}
        />
      </div>
      
      {/* Mobile: Award-winning glassmorphism search capsule */}
      <div className="md:hidden fixed top-[56px] left-0 right-0 z-[70] px-3 pt-2 pb-3">
        {/* Glassmorphism background - pointer-events-none so it doesn't block interactions */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/0 backdrop-blur-xl pointer-events-none" />
        
        {/* Search capsule with suggestions dropdown */}
        <div className="relative">
          <form onSubmit={handleMobileSearch}>
            <div className={`
              flex items-center gap-2 bg-white rounded-2xl shadow-lg border transition-all duration-300
              ${mobileSearchFocused 
                ? 'border-purple-500 shadow-purple-100 shadow-xl ring-4 ring-purple-500/20' 
                : 'border-gray-200/80 shadow-gray-200/50'
              }
            `}>
              {/* Search icon */}
              <div className="pl-4">
                <Search className={`h-5 w-5 transition-colors ${mobileSearchFocused ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              
              {/* Search input */}
              <input
                ref={mobileSearchRef}
                type="text"
                placeholder="Search city, state, or ZIP..."
                value={mobileSearchQuery}
                onChange={(e) => {
                  setMobileSearchQuery(e.target.value);
                  if (e.target.value.length >= 2) {
                    setShowMobileSuggestions(true);
                  }
                }}
                onFocus={() => {
                  setMobileSearchFocused(true);
                  if (mobileSearchQuery.length >= 2 && mobileSuggestions.length > 0) {
                    setShowMobileSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => {
                  setMobileSearchFocused(false);
                  setShowMobileSuggestions(false);
                }, 300)}
                className="flex-1 py-3.5 pr-2 text-[15px] font-medium text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                data-testid="mobile-search-input"
              />
              
              {/* Clear button - shows when there's text */}
              {mobileSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchQuery('');
                    setMobileSuggestions([]);
                    setShowMobileSuggestions(false);
                    mobileSearchRef.current?.focus();
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  data-testid="mobile-search-clear"
                >
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Search button */}
              <button
                type="submit"
                disabled={isMobileSearching}
                className="mr-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-400 disabled:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:cursor-not-allowed flex items-center gap-1.5"
                data-testid="mobile-search-button"
              >
                {isMobileSearching ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>
          
          {/* Mobile suggestions dropdown */}
          {showMobileSuggestions && mobileSearchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[80] max-h-[300px] overflow-y-auto">
              {isLoadingMobileSuggestions ? (
                <div className="flex items-center justify-center py-4 px-4">
                  <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-2 text-sm text-gray-500">Searching...</span>
                </div>
              ) : mobileSuggestions.length > 0 ? (
                <div>
                  {mobileSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id || index}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleMobileSuggestionSelect(suggestion);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-purple-50 active:bg-purple-100 border-b border-gray-100 last:border-0 transition-colors"
                      data-testid={`mobile-suggestion-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{suggestion.mainText}</div>
                          <div className="text-xs text-gray-500 truncate">{suggestion.secondaryText}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 px-4 text-center text-sm text-gray-500">
                  No locations found
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Controls row - Map/List toggle + Filters */}
        <div className="relative mt-3 flex items-center justify-between">
          {/* Property count pill */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg">
              {filteredAndSortedProperties.length} properties
            </span>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Map/List Toggle - pill style */}
            <div className="flex bg-white/95 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200/80">
              <button
                onClick={() => setMobileViewMode('map')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  mobileViewMode === 'map'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="mobile-map-toggle"
              >
                <Map className="h-3.5 w-3.5" />
                Map
              </button>
              <button
                onClick={() => setMobileViewMode('list')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  mobileViewMode === 'list'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="mobile-list-toggle"
              >
                <Grid className="h-3.5 w-3.5" />
                List
              </button>
            </div>
            
            {/* Filters Button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full text-xs font-semibold text-gray-700 transition-all duration-200 shadow-lg border border-gray-200/80 active:scale-95"
              data-testid="mobile-filters-button"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-purple-600 text-white text-[10px] font-bold rounded-full px-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {showMap ? (
        <div className="fixed top-[148px] md:top-[136px] left-0 right-0 bottom-[72px] md:bottom-0 flex flex-col md:flex-row">
          {/* Mobile: Show only map OR list based on mobileViewMode state */}
          {/* Desktop: Show both side by side */}
          
          {/* Map container - shown on mobile when mobileViewMode is 'map', always on desktop */}
          <div className={`${mobileViewMode === 'list' ? 'hidden' : 'block'} md:block w-full md:w-[60%] h-full relative`}>
            <SimpleMap 
              onPropertySelect={handlePropertySelect} 
              onPropertiesChange={handlePropertiesChange}
              onExitSearchMode={handleExitSearchMode}
              initialState={initialState}
              filters={propertyFilters}
              initialViewport={initialViewport}
              initialBounds={initialBounds}
              searchBounds={searchBounds}
              searchCounter={searchCounter}
              properties={filteredPropertiesForMap}
              isSearchMode={searchCounter > 0}
            />

            {/* Zillow-style Remove Boundary button — absolute inside the map container */}
            {hasBoundary && (
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              >
                <button
                  onClick={() => {
                    setBoundaryPolygon(null);
                    setHasBoundary(false);
                    clearSearchBoundary();
                    if (fullPropertyList.length > 0) {
                      const countryFiltered = applyCountryFilter(fullPropertyList, searchLocation);
                      setAllProperties(countryFiltered);
                      setDisplayProperties(countryFiltered);
                    }
                  }}
                  style={{ pointerEvents: 'auto' }}
                  className="flex items-center gap-1.5 bg-white rounded-full px-3.5 py-2 shadow-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-150 whitespace-nowrap"
                >
                  Remove Boundary
                  <X className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                </button>
              </div>
            )}
          </div>
          
          {/* Sidebar - shown on mobile when mobileViewMode is 'list', always on desktop */}
          <div className={`${mobileViewMode === 'map' ? 'hidden' : 'block'} md:block w-full md:w-[40%] bg-white border-l border-gray-200 overflow-y-auto`}>
            <div className="px-3 sm:px-4 py-3 sm:py-4">
              {/* Mobile sort section - scrolls naturally without overlay */}
              <div className="md:hidden mb-4 flex items-center justify-end">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Sort by:</span>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value)}
                  >
                    <SelectTrigger className="h-8 w-[120px] text-xs border-gray-300 bg-white">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-high">Price: High</SelectItem>
                      <SelectItem value="price-low">Price: Low</SelectItem>
                      <SelectItem value="acreage-high">Acres: High</SelectItem>
                      <SelectItem value="acreage-low">Acres: Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Desktop only header - hidden on mobile since we have the sticky header */}
              <div className="hidden md:flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filteredAndSortedProperties.length} Properties
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span>Sort by:</span>
                    <Select
                      value={sortBy}
                      onValueChange={(value) => setSortBy(value)}
                    >
                      <SelectTrigger className="h-9 w-[140px] text-sm border-gray-300 bg-white">
                        <SelectValue placeholder="Select sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-high">Price (High-Low)</SelectItem>
                        <SelectItem value="price-low">Price (Low-High)</SelectItem>
                        <SelectItem value="acreage-high">Acreage (High-Low)</SelectItem>
                        <SelectItem value="acreage-low">Acreage (Low-High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMapView(false)}
                    className="flex items-center gap-2 h-9 px-4 bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    <Grid className="h-4 w-4" />
                    <span className="font-medium">List View</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {currentProperties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={{
                      ...property,
                      propertyType: (property.propertyType || property.property_type || 'Land') as string,
                      featured: property.id % 3 === 0
                    }}
                    onClick={handlePropertySelect}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Advanced Footer Section */}
              <div className="border-t border-gray-100 bg-gradient-to-br from-slate-50 to-blue-50 mt-8 -mx-4 px-4 py-8">
                <div className="space-y-8">
                  
                  {/* Property Types Grid with Enhanced Design */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Browse by Property Type</h3>
                        <p className="text-sm text-gray-600">Discover specialized land opportunities across all categories</p>
                      </div>
                      <div className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        {filteredAndSortedProperties.length} Properties
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { name: 'Agricultural Land', dbType: 'agricultural', count: '132', icon: Wheat, color: 'bg-green-50 hover:bg-green-100 border-green-200', iconColor: 'text-green-600' },
                        { name: 'Ranches & Farms', dbType: 'ranch', count: '55', icon: Beef, color: 'bg-amber-50 hover:bg-amber-100 border-amber-200', iconColor: 'text-amber-600' },
                        { name: 'Recreational Land', dbType: 'recreational', count: '149', icon: TreePine, color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200', iconColor: 'text-emerald-600' },
                        { name: 'Waterfront Property', dbType: 'waterfront', count: '10', icon: Waves, color: 'bg-blue-50 hover:bg-blue-100 border-blue-200', iconColor: 'text-blue-600' },
                        { name: 'Timberland', dbType: 'timberland', count: '26', icon: Trees, color: 'bg-teal-50 hover:bg-teal-100 border-teal-200', iconColor: 'text-teal-600' },
                        { name: 'Commercial Land', dbType: 'commercial', count: '101', icon: Building2, color: 'bg-purple-50 hover:bg-purple-100 border-purple-200', iconColor: 'text-purple-600' },
                        { name: 'Residential Lots', dbType: 'residential', count: '157', icon: Home, color: 'bg-rose-50 hover:bg-rose-100 border-rose-200', iconColor: 'text-rose-600' },
                        { name: 'Conservation Land', dbType: 'conservation', count: '69', icon: Target, color: 'bg-orange-50 hover:bg-orange-100 border-orange-200', iconColor: 'text-orange-600' }
                      ].map((type, index) => {
                        const IconComponent = type.icon;
                        return (
                          <button
                            key={index}
                            className={`${type.color} border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md group`}
                            onClick={() => {
                              console.log('Category clicked:', type.name, 'DB Type:', type.dbType);
                              // Apply property type filter using the correct database type
                              const newFilters = {
                                ...propertyFilters,
                                propertyTypes: [type.dbType]
                              };
                              console.log('Setting filters:', newFilters);
                              handlePropertyFiltersChange(newFilters);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <IconComponent className={`w-5 h-5 ${type.iconColor}`} />
                              <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                                {type.count}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm text-gray-900 group-hover:text-gray-800">
                              {type.name}
                            </h4>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Market Intelligence & Analytics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Market Trends */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Market Insights</h3>
                          <p className="text-xs text-gray-600">Real-time market analytics</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-700">Avg. Price per Acre</span>
                          <span className="font-semibold text-green-600">$8,450</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-700">Market Activity</span>
                          <span className="flex items-center text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="font-semibold text-sm">High</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-700">New Listings (7d)</span>
                          <span className="font-semibold text-blue-600">+23</span>
                        </div>
                      </div>
                      
                      <Link to="/market-reports" className="block w-full mt-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors text-center">
                        View Market Report
                      </Link>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                          <p className="text-xs text-gray-600">Get started instantly</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Link to="/sell-land" className="flex flex-col items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                          <DollarSign className="w-5 h-5 text-green-600 mb-1" />
                          <span className="text-xs font-medium text-green-800 group-hover:text-green-900">Sell Land</span>
                        </Link>
                        <button 
                          className="flex flex-col items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                          onClick={() => {
                            // Create a custom alert functionality
                            const email = prompt("Enter your email to set up property alerts:");
                            if (email) {
                              alert(`Property alerts will be sent to ${email} when new listings match your criteria!`);
                            }
                          }}
                        >
                          <Bell className="w-5 h-5 text-blue-600 mb-1" />
                          <span className="text-xs font-medium text-blue-800 group-hover:text-blue-900">Set Alerts</span>
                        </button>
                        <button 
                          className="flex flex-col items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
                          onClick={() => {
                            setShowMap(true); // Switch to map view
                            // Scroll to top to show the map
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <MapPin className="w-5 h-5 text-orange-600 mb-1" />
                          <span className="text-xs font-medium text-orange-800 group-hover:text-orange-900">Map Search</span>
                        </button>
                        <Link to="/investment-tools" className="flex flex-col items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                          <TrendingUp className="w-5 h-5 text-purple-600 mb-1" />
                          <span className="text-xs font-medium text-purple-800 group-hover:text-purple-900">Valuations</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Navigation Links */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      
                      {/* Popular Locations */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <MapIcon className="w-4 h-4 mr-2 text-gray-700" />
                          Popular Locations
                        </h4>
                        <div className="space-y-2">
                          {['Texas Land', 'California Farms', 'Montana Ranches', 'Florida Waterfront', 'Colorado Mountains'].map((location, index) => (
                            <button 
                              key={index}
                              className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors w-full text-left"
                              onClick={() => {
                                const searchTerm = location.split(' ')[0]; // Extract state name
                                const newFilters = {
                                  ...propertyFilters,
                                  searchTerm: searchTerm,
                                  states: [searchTerm]
                                };
                                handlePropertyFiltersChange(newFilters);
                                performSearch(searchTerm);
                              }}
                            >
                              {location}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Resources */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <BookOpen className="w-4 h-4 mr-2 text-gray-700" />
                          Resources
                        </h4>
                        <div className="space-y-2">
                          {[
                            { name: 'Land Buying Guide', path: '/land-buying-guide' },
                            { name: 'Market Reports', path: '/market-reports' },
                            { name: 'Investment Tools', path: '/investment-tools' },
                            { name: 'Legal Resources', path: '/resources' },
                            { name: 'Financing Options', path: '/resources' }
                          ].map((resource, index) => (
                            <Link 
                              key={index}
                              to={resource.path}
                              className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              {resource.name}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Wrench className="w-4 h-4 mr-2 text-gray-700" />
                          Services
                        </h4>
                        <div className="space-y-2">
                          {[
                            { name: 'Property Valuation', path: '/investment-tools' },
                            { name: 'Land Surveys', path: '/help-center' },
                            { name: 'Legal Assistance', path: '/help-center' },
                            { name: 'Financing', path: '/land-buying-guide' },
                            { name: 'Investment Analysis', path: '/investment-tools' }
                          ].map((service, index) => (
                            <Link 
                              key={index}
                              to={service.path}
                              className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              {service.name}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Support */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2 text-gray-700" />
                          Support
                        </h4>
                        <div className="space-y-2">
                          {[
                            { name: 'Help Center', path: '/help-center' },
                            { name: 'Contact Us', path: '/help-center' },
                            { name: 'Agent Directory', path: '/agents' },
                            { name: 'Community Forum', path: '/help-center' },
                            { name: 'API Documentation', path: '/help-center' }
                          ].map((support, index) => (
                            <Link 
                              key={index}
                              to={support.path}
                              className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              {support.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Newsletter Subscription */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-lg font-semibold mb-1">Stay Ahead of the Market</h3>
                        <p className="text-blue-100 text-sm">Get exclusive land deals and market insights delivered weekly</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <input 
                          type="email" 
                          placeholder="Enter your email"
                          className="flex-1 md:w-64 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const email = (e.target as HTMLInputElement).value;
                              if (email && email.includes('@')) {
                                alert(`Thank you! You'll receive market insights at ${email}`);
                                (e.target as HTMLInputElement).value = '';
                              } else {
                                alert('Please enter a valid email address');
                              }
                            }
                          }}
                        />
                        <button 
                          className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            const email = input?.value;
                            if (email && email.includes('@')) {
                              alert(`Thank you! You'll receive market insights at ${email}`);
                              input.value = '';
                            } else {
                              alert('Please enter a valid email address');
                            }
                          }}
                        >
                          Subscribe
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar with Social & Legal */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                      <div className="flex items-center space-x-6 mb-4 md:mb-0">
                        <span className="text-sm text-gray-600">© 2024 TerraTracts. All rights reserved.</span>
                        <div className="flex space-x-4">
                          <a href="#" className="text-sm text-gray-600 hover:text-blue-600">Privacy</a>
                          <a href="#" className="text-sm text-gray-600 hover:text-blue-600">Terms</a>
                          <a href="#" className="text-sm text-gray-600 hover:text-blue-600">Cookies</a>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 mr-2">Follow us:</span>
                        {[
                          { icon: Facebook, color: 'hover:bg-blue-100 hover:text-blue-600', url: 'https://facebook.com/terratracts' },
                          { icon: Twitter, color: 'hover:bg-sky-100 hover:text-sky-600', url: 'https://twitter.com/terratracts' },
                          { icon: Instagram, color: 'hover:bg-pink-100 hover:text-pink-600', url: 'https://instagram.com/terratracts' },
                          { icon: Linkedin, color: 'hover:bg-blue-100 hover:text-blue-700', url: 'https://linkedin.com/company/terratracts' }
                        ].map((social, index) => {
                          const IconComponent = social.icon;
                          return (
                            <button 
                              key={index}
                              className={`w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200 text-gray-600 ${social.color}`}
                              onClick={() => window.open(social.url, '_blank')}
                              title={`Follow us on ${social.icon.name}`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <PropertyListView 
          properties={filteredAndSortedProperties}
          onPropertySelect={handlePropertySelect}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}
      
      {/* Mobile Filters Sheet */}
      <MobileFiltersSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={propertyFilters}
        onFiltersChange={handlePropertyFiltersChange}
        totalResults={filteredAndSortedProperties.length}
      />
      
      {/* Share Modal for map popup integration */}
      {shareModalProperty && (
        <SharePropertyCard
          property={shareModalProperty}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareModalProperty(null);
          }}
        />
      )}
    </div>
  );
};

export default PropertiesPage;