import React, { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { WorkingClimateOverlay } from './WorkingClimateOverlay';
import { getPropertyBadge as getPropertyBadgeUtil, getPropertyTypeLabel as getPropertyTypeLabelUtil, generateDescriptiveHeadline } from '@/lib/propertyUtils';

interface Property {
  id: number;
  title: string;
  location: string;
  state: string;
  price: number | string;
  acreage: number | string;
  latitude: number | string;
  longitude: number | string;
  images: string[];
  coordinates?: [number, number];
  description?: string;
  propertyType?: string;
  property_type?: string;
  [key: string]: any;
}

interface PropertyFilters {
  propertyTypes?: string[];
  priceRange?: { min: number | null; max: number | null };
  acreageRange?: { min: number | null; max: number | null };
  searchQuery?: string;
  [key: string]: any;
}

interface SimpleMapProps {
  onPropertySelect: (propertyId: number) => void;
  onPropertiesChange?: (properties: Property[]) => void;
  onExitSearchMode?: () => void; // Callback when user manually moves map
  initialState?: string;
  searchQuery?: string;
  filters?: PropertyFilters;
  initialViewport?: {lat: number, lng: number, zoom: number} | null;
  initialBounds?: [number, number, number, number] | null;
  searchBounds?: [number, number, number, number] | null;
  searchCounter?: number;
  properties?: Property[];
  isSearchMode?: boolean; // Explicit flag for search mode (vs browse mode)
}

const SimpleMap: React.FC<SimpleMapProps> = ({ 
  onPropertySelect, 
  onPropertiesChange,
  onExitSearchMode,
  initialState,
  searchQuery,
  filters,
  initialViewport,
  initialBounds,
  searchBounds,
  searchCounter,
  properties,
  isSearchMode: isSearchModeProp
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const propertiesRef = useRef<Property[]>([]);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  const [showMapOptions, setShowMapOptions] = useState(false);
  const [activeRiskTypes, setActiveRiskTypes] = useState({
    fire: false,
    flood: false,
    heat: false,
    wind: false
  });
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const climateRiskLayerId = useRef<string>('climate-risk-layer');
  const mapOptionsRef = useRef<HTMLDivElement>(null);
  
  // Zillow-style property popup state
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [popupProperty, setPopupProperty] = useState<Property | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const selectedMarkerRef = useRef<HTMLDivElement | null>(null);
  
  // Track if we're currently zooming to search results (programmatic zoom)
  const isZoomingRef = useRef(false);
  
  // Track pending search transition - prevents viewport filtering during search updates
  const pendingSearchTransitionRef = useRef(false);
  
  // Track if user manually exited search mode (to prevent re-entering on next render)
  const userExitedSearchRef = useRef(false);
  
  // Track when search transition completes - grace period before allowing exit
  const searchTransitionCompleteTimeRef = useRef<number>(0);
  
  // Refs for callbacks to avoid stale closures in map event handlers
  const updateVisiblePropertiesRef = useRef<() => void>(() => {});
  
  // SYNCHRONOUS ref updates - must happen BEFORE any event handlers read them
  const searchCounterRef = useRef(searchCounter || 0);
  // Use explicit isSearchMode prop if provided, otherwise fall back to searchCounter check
  const isSearchModeRef = useRef(isSearchModeProp ?? (searchCounter !== undefined && searchCounter > 0));
  const lastKnownSearchCounterRef = useRef(searchCounter || 0);
  const prevSearchCounterRef = useRef(searchCounter || 0);
  
  // Update refs SYNCHRONOUSLY on each render (before any effects or handlers)
  const newSearchCounter = searchCounter || 0;
  // Use explicit prop for search mode detection
  const newIsSearchMode = isSearchModeProp ?? (searchCounter !== undefined && searchCounter > 0);
  
  // Only set pending if this is a GENUINE new search (counter increased from last known value)
  // Don't set pending if user manually exited and we're just re-rendering with stale prop
  if (newSearchCounter > lastKnownSearchCounterRef.current && !userExitedSearchRef.current) {
    console.log('SimpleMap: NEW SEARCH detected', lastKnownSearchCounterRef.current, '->', newSearchCounter);
    pendingSearchTransitionRef.current = true;
    lastKnownSearchCounterRef.current = newSearchCounter;
  }
  
  // Always keep searchCounterRef in sync with prop (for event handlers to read)
  if (searchCounterRef.current !== newSearchCounter) {
    console.log('SimpleMap: searchCounterRef SYNC update', searchCounterRef.current, '->', newSearchCounter);
    searchCounterRef.current = newSearchCounter;
  }
  
  // Update search mode ref
  if (isSearchModeRef.current !== newIsSearchMode) {
    console.log('SimpleMap: isSearchModeRef SYNC update', isSearchModeRef.current, '->', newIsSearchMode);
    isSearchModeRef.current = newIsSearchMode;
    // If exiting search mode (properties became undefined), clear the user exit flag
    if (!newIsSearchMode) {
      userExitedSearchRef.current = false;
    }
  }

  // Handle clicking outside map options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mapOptionsRef.current && !mapOptionsRef.current.contains(event.target as Node)) {
        setShowMapOptions(false);
      }
    };

    if (showMapOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMapOptions]);

  // Ref to hold the showPropertyPopup function for use in style toggle
  const showPropertyPopupRef = useRef<((property: Property, markerEl: HTMLDivElement) => void) | null>(null);

  // Toggle satellite/street view
  const toggleMapStyle = useCallback(() => {
    if (!map.current) return;
    
    // Clear existing markers and popup before style change
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    selectedMarkerRef.current = null;
    
    const newStyle = mapStyle === 'satellite' ? 'streets' : 'satellite';
    setMapStyle(newStyle);
    
    const styleUrl = newStyle === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/streets-v12';
    
    map.current.setStyle(styleUrl);
    
    // Re-add markers after style loads using same Zillow-style popup logic
    map.current.once('styledata', () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      propertiesRef.current.forEach(property => {
        const lat = parseFloat(property.latitude as string);
        const lng = parseFloat(property.longitude as string);

        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Invalid coordinates for property ${property.id}`);
          return;
        }

        // Consistent marker style with main addMarkersToMap
        const el = document.createElement('div');
        el.dataset.propertyId = String(property.id);
        el.style.cssText = `
          width: 16px;
          height: 16px;
          background-color: #3B82F6;
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          transition: width 0.15s ease, height 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);

        // Use same popup logic via ref
        el.onclick = (e) => {
          e.stopPropagation();
          if (showPropertyPopupRef.current) {
            showPropertyPopupRef.current(property, el);
          }
        };

        markers.current.push(marker);
      });
    });
  }, [mapStyle]);

  // Full properties cache (separate from propertiesRef which may hold search results)
  const fullPropertiesCacheRef = useRef<Property[]>([]);
  
  // Ultra-fast property loading with immediate caching
  const loadAllProperties = useCallback(async (forceReload: boolean = false) => {
    // Return cached full properties if available (not search results)
    if (!forceReload && fullPropertiesCacheRef.current.length > 0) {
      console.log('loadAllProperties: Returning cached full properties:', fullPropertiesCacheRef.current.length);
      return fullPropertiesCacheRef.current;
    }

    try {
      console.log('loadAllProperties: Fetching from server (forceReload:', forceReload, ')');
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const properties = await response.json();
      console.log('loadAllProperties: Got', properties.length, 'properties from server');
      fullPropertiesCacheRef.current = properties; // Cache the full dataset
      return properties;
    } catch (error) {
      console.error('Error loading properties:', error);
      return [];
    }
  }, []);

  // REMOVED: applyFilters - filtering is now done exclusively in properties.tsx
  // SimpleMap is a pure renderer - it shows exactly what it receives from parent

  // Update visible properties based on map bounds (NO FILTERING - parent handles that)
  const updateVisibleProperties = useCallback(() => {
    // Read refs synchronously (they're updated at the top of render)
    const isInSearchMode = isSearchModeRef.current;
    const currentSearchCounter = searchCounterRef.current;
    const isPendingTransition = pendingSearchTransitionRef.current;
    
    console.log('updateVisibleProperties called - mapReady:', mapReady, 'propertiesCount:', propertiesRef.current.length, 
      'isSearchMode:', isInSearchMode, 'searchCounterRef:', currentSearchCounter, 'pendingTransition:', isPendingTransition);
    
    if (!map.current || !mapReady || propertiesRef.current.length === 0) {
      console.log('updateVisibleProperties early return - map/ready/properties check failed');
      return;
    }

    // Skip only during active transitions (map animation in progress)
    if (isPendingTransition) {
      console.log('updateVisibleProperties skipped - pending search transition');
      return;
    }

    const bounds = map.current.getBounds();
    if (!bounds) {
      console.log('updateVisibleProperties early return - no bounds');
      return;
    }
    
    // In search mode: show ALL properties (parent already filtered, no viewport restriction)
    // In browse mode: show only properties visible in viewport
    let visibleProperties: Property[];
    
    if (isInSearchMode || currentSearchCounter > 0) {
      // Search mode: show all properties (parent already filtered)
      visibleProperties = propertiesRef.current;
      console.log('updateVisibleProperties (search mode) - showing all', visibleProperties.length, 'properties');
    } else {
      // Browse mode: filter by map bounds only (parent already filtered)
      visibleProperties = propertiesRef.current.filter(property => {
        const lat = parseFloat(property.latitude as string);
        const lng = parseFloat(property.longitude as string);
        
        if (isNaN(lat) || isNaN(lng)) return false;
        
        const isVisible = bounds.contains([lng, lat]);
        return isVisible;
      });
      console.log('updateVisibleProperties (browse mode) - visible in viewport:', visibleProperties.length, 'of', propertiesRef.current.length);
    }
    
    // Update parent component with viewport-filtered properties
    if (onPropertiesChange) {
      onPropertiesChange(visibleProperties);
    }
  }, [mapReady, onPropertiesChange]);

  // Keep ref updated with latest callback to avoid stale closures in map event handlers
  // Use useLayoutEffect to ensure ref is updated synchronously BEFORE any effects run
  useLayoutEffect(() => {
    updateVisiblePropertiesRef.current = updateVisibleProperties;
  }, [updateVisibleProperties]);

  // Format price for display (full format like Zillow: $85,000) - MUST match propertyUtils.ts
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    if (isNaN(numPrice)) return 'Price TBD';
    return `$${numPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Show property popup on marker click (Zillow-style)
  const showPropertyPopup = useCallback((property: Property, markerEl: HTMLDivElement) => {
    if (!map.current) return;
    
    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
    }
    
    // Reset previous selected marker style
    if (selectedMarkerRef.current && selectedMarkerRef.current !== markerEl) {
      selectedMarkerRef.current.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: #3B82F6;
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        transition: width 0.15s ease, height 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
      `;
    }
    
    // Highlight selected marker (Zillow-style blue larger marker)
    markerEl.style.cssText = `
      width: 24px;
      height: 24px;
      background-color: #1d4ed8;
      border: 4px solid white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(29, 78, 216, 0.5);
      z-index: 10;
      transition: width 0.15s ease, height 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    `;
    selectedMarkerRef.current = markerEl;
    
    // Get property details for popup (all text content set via textContent for XSS safety)
    const lat = parseFloat(property.latitude as string);
    const lng = parseFloat(property.longitude as string);
    const acreage = typeof property.acreage === 'string' ? parseFloat(property.acreage) : property.acreage;
    const propertyType = property.propertyType || property.property_type || 'Land';
    const locationText = property.location || property.state || '';
    const fallbackImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400';
    
    // Validate image URL (only allow http/https schemes)
    let imageUrl = fallbackImage;
    const rawImageUrl = property.images?.[0];
    if (rawImageUrl && typeof rawImageUrl === 'string') {
      try {
        const url = new URL(rawImageUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          imageUrl = rawImageUrl;
        }
      } catch {
        imageUrl = fallbackImage;
      }
    }
    
    // Format location like Zillow
    const formatLocation = (location: string) => {
      return location.replace(/, USA$/, '').replace(/, United States$/, '');
    };
    
    // Generate property badge text using shared utility
    const getPropertyBadge = () => {
      return getPropertyBadgeUtil({
        propertyType: propertyType,
        isWaterfront: property.isWaterfront,
        isMountainView: property.isMountainView,
        featured: property.featured,
        videoUrl: property.videoUrl,
        createdAt: property.createdAt,
        priceReduced: property.priceReduced,
        priceReductionPercent: property.priceReductionPercent,
        headline: generateDescriptiveHeadline(property.id),
      });
    };
    
    // Build popup with Zillow-style layout (better than Zillow)
    const popupContainer = document.createElement('div');
    popupContainer.className = 'property-popup';
    popupContainer.dataset.propertyId = String(property.id);
    popupContainer.style.cssText = `
      width: 300px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.18);
      font-family: system-ui, -apple-system, sans-serif;
      cursor: pointer;
    `;
    
    // Image container with carousel
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = 'position: relative; width: 100%; height: 180px; overflow: hidden;';
    
    // Track current image index for carousel
    let currentImageIndex = 0;
    const images = property.images && property.images.length > 0 ? property.images : [fallbackImage];
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Property';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; transition: opacity 0.2s ease;';
    img.onerror = () => { img.src = fallbackImage; };
    imageContainer.appendChild(img);
    
    // Add carousel arrows if multiple images
    if (images.length > 1) {
      // Left arrow
      const leftArrow = document.createElement('button');
      leftArrow.setAttribute('aria-label', 'Previous image');
      leftArrow.style.cssText = `
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: 32px;
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 10;
        transition: transform 0.15s ease, background 0.15s ease;
      `;
      leftArrow.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      leftArrow.onmouseenter = () => { leftArrow.style.background = 'white'; leftArrow.style.transform = 'translateY(-50%) scale(1.1)'; };
      leftArrow.onmouseleave = () => { leftArrow.style.background = 'rgba(255,255,255,0.9)'; leftArrow.style.transform = 'translateY(-50%)'; };
      leftArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        img.style.opacity = '0.5';
        img.src = images[currentImageIndex];
        setTimeout(() => { img.style.opacity = '1'; }, 50);
        updateDots();
      });
      imageContainer.appendChild(leftArrow);
      
      // Right arrow
      const rightArrow = document.createElement('button');
      rightArrow.setAttribute('aria-label', 'Next image');
      rightArrow.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: 32px;
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 10;
        transition: transform 0.15s ease, background 0.15s ease;
      `;
      rightArrow.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>';
      rightArrow.onmouseenter = () => { rightArrow.style.background = 'white'; rightArrow.style.transform = 'translateY(-50%) scale(1.1)'; };
      rightArrow.onmouseleave = () => { rightArrow.style.background = 'rgba(255,255,255,0.9)'; rightArrow.style.transform = 'translateY(-50%)'; };
      rightArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        currentImageIndex = (currentImageIndex + 1) % images.length;
        img.style.opacity = '0.5';
        img.src = images[currentImageIndex];
        setTimeout(() => { img.style.opacity = '1'; }, 50);
        updateDots();
      });
      imageContainer.appendChild(rightArrow);
    }
    
    // Function to update dots indicator
    const updateDots = () => {
      const dots = imageContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, i) => {
        (dot as HTMLElement).style.width = i === currentImageIndex ? '8px' : '6px';
        (dot as HTMLElement).style.background = i === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)';
      });
    };
    
    // TOP LEFT: Property statement badge (Zillow-style)
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 4px;
      letter-spacing: 0.01em;
    `;
    badge.textContent = getPropertyBadge();
    imageContainer.appendChild(badge);
    
    // TOP RIGHT: Heart/Favorite button with glassmorphism
    const heartBtn = document.createElement('button');
    heartBtn.setAttribute('aria-label', 'Save property');
    heartBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    heartBtn.onmouseenter = () => { heartBtn.style.transform = 'scale(1.1)'; };
    heartBtn.onmouseleave = () => { heartBtn.style.transform = 'scale(1)'; };
    
    const heartSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    heartSvg.setAttribute('width', '24');
    heartSvg.setAttribute('height', '24');
    heartSvg.setAttribute('viewBox', '0 0 24 24');
    heartSvg.setAttribute('fill', 'white');
    heartSvg.setAttribute('stroke', 'white');
    heartSvg.setAttribute('stroke-width', '2');
    heartSvg.style.cssText = 'filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));';
    const heartPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    heartPath.setAttribute('d', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');
    heartSvg.appendChild(heartPath);
    heartBtn.appendChild(heartSvg);
    
    heartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isFilled = heartSvg.getAttribute('fill') === '#2563eb';
      heartSvg.setAttribute('fill', isFilled ? 'white' : '#2563eb');
      heartSvg.setAttribute('stroke', isFilled ? 'white' : '#2563eb');
    });
    imageContainer.appendChild(heartBtn);
    
    // Image dots indicator (if multiple images)
    if (images.length > 1) {
      const dotsContainer = document.createElement('div');
      dotsContainer.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 5px;
      `;
      const numDots = Math.min(images.length, 5);
      for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot';
        dot.style.cssText = `
          width: ${i === 0 ? '8px' : '6px'};
          height: 6px;
          border-radius: 3px;
          background: ${i === 0 ? 'white' : 'rgba(255,255,255,0.5)'};
          transition: all 0.2s ease;
        `;
        dotsContainer.appendChild(dot);
      }
      imageContainer.appendChild(dotsContainer);
    }
    
    popupContainer.appendChild(imageContainer);
    
    // Content section
    const contentSection = document.createElement('div');
    contentSection.style.cssText = 'padding: 14px 16px;';
    
    // Price row with more options button
    const priceRow = document.createElement('div');
    priceRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;';
    
    const priceSpan = document.createElement('span');
    priceSpan.style.cssText = 'font-size: 22px; font-weight: 700; color: #111827;';
    priceSpan.textContent = formatPrice(property.price);
    priceRow.appendChild(priceSpan);
    
    // More options button (...)
    const moreBtn = document.createElement('button');
    moreBtn.setAttribute('aria-label', 'More options');
    moreBtn.style.cssText = `
      width: 32px;
      height: 32px;
      background: #f3f4f6;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease;
    `;
    moreBtn.onmouseenter = () => { moreBtn.style.background = '#e5e7eb'; };
    moreBtn.onmouseleave = () => { moreBtn.style.background = '#f3f4f6'; };
    
    const moreSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    moreSvg.setAttribute('width', '18');
    moreSvg.setAttribute('height', '18');
    moreSvg.setAttribute('viewBox', '0 0 24 24');
    moreSvg.setAttribute('fill', '#6b7280');
    // Three horizontal dots
    [5, 12, 19].forEach(cx => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(cx));
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '2');
      moreSvg.appendChild(circle);
    });
    moreBtn.appendChild(moreSvg);
    
    // Create dropdown menu for more options (opens UPWARD)
    const dropdownMenu = document.createElement('div');
    dropdownMenu.style.cssText = `
      display: none;
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 4px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      min-width: 140px;
      z-index: 100;
      overflow: hidden;
    `;
    
    // Hide option
    const hideOption = document.createElement('button');
    hideOption.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 14px;
      background: none;
      border: none;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      text-align: left;
    `;
    hideOption.onmouseenter = () => { hideOption.style.background = '#f3f4f6'; };
    hideOption.onmouseleave = () => { hideOption.style.background = 'none'; };
    hideOption.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> Hide listing`;
    hideOption.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close popup
      popupRef.current?.remove();
      popupRef.current = null;
      // Find and remove the marker for this property
      const propertyId = String(property.id);
      const markerIndex = markers.current.findIndex(m => {
        const el = m.getElement();
        return el && el.dataset.propertyId === propertyId;
      });
      if (markerIndex !== -1) {
        markers.current[markerIndex].remove();
        markers.current.splice(markerIndex, 1);
      }
      // Reset selected state
      selectedMarkerRef.current = null;
      setSelectedPropertyId(null);
      setPopupProperty(null);
    });
    dropdownMenu.appendChild(hideOption);
    
    // Share option
    const shareOption = document.createElement('button');
    shareOption.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 14px;
      background: none;
      border: none;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      text-align: left;
    `;
    shareOption.onmouseenter = () => { shareOption.style.background = '#f3f4f6'; };
    shareOption.onmouseleave = () => { shareOption.style.background = 'none'; };
    shareOption.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> Share`;
    shareOption.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = 'none';
      // Dispatch custom event to open React SharePropertyCard modal
      const shareEvent = new CustomEvent('openShareModal', {
        detail: {
          id: property.id,
          title: property.title || 'Property',
          price: property.price,
          location: property.location,
          state: property.state,
          size: acreage,
          propertyType: propertyType,
          images: property.images || []
        }
      });
      window.dispatchEvent(shareEvent);
    });
    dropdownMenu.appendChild(shareOption);
    
    // Wrap more button in relative container for dropdown positioning
    const moreContainer = document.createElement('div');
    moreContainer.style.cssText = 'position: relative;';
    moreContainer.appendChild(moreBtn);
    moreContainer.appendChild(dropdownMenu);
    
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });
    
    priceRow.appendChild(moreContainer);
    
    contentSection.appendChild(priceRow);
    
    // Acreage and property type row using shared utility
    const getPropertyTypeLabel = () => {
      return getPropertyTypeLabelUtil(propertyType);
    };
    
    const detailsRow = document.createElement('div');
    detailsRow.style.cssText = 'font-size: 14px; color: #374151; margin-bottom: 8px;';
    const acreageText = (!isNaN(acreage) && acreage !== null && acreage !== undefined) ? `${acreage.toFixed(2)} acres` : '— acres';
    
    const acreageSpan = document.createElement('span');
    acreageSpan.style.cssText = 'font-weight: 600; color: #111827;';
    acreageSpan.textContent = acreageText;
    detailsRow.appendChild(acreageSpan);
    
    const dashSpan = document.createElement('span');
    dashSpan.style.cssText = 'color: #9ca3af;';
    dashSpan.textContent = ' - ';
    detailsRow.appendChild(dashSpan);
    
    const typeSpan = document.createElement('span');
    typeSpan.style.cssText = 'color: #2563eb;';
    typeSpan.textContent = getPropertyTypeLabel();
    detailsRow.appendChild(typeSpan);
    
    contentSection.appendChild(detailsRow);
    
    // Location/Address (full address like Zillow with street, city, state, ZIP)
    const streetAddress = property.streetAddress || property.street_address;
    const zipCode = property.zipCode || property.zip_code;
    const locationDiv = document.createElement('div');
    locationDiv.style.cssText = 'font-size: 14px; color: #374151; line-height: 1.4;';
    if (streetAddress) {
      const city = locationText.replace(`, ${property.state}`, '');
      locationDiv.textContent = `${streetAddress}, ${city}, ${property.state || ''} ${zipCode || ''}`.trim();
    } else {
      locationDiv.textContent = formatLocation(locationText);
    }
    contentSection.appendChild(locationDiv);
    
    // Agent/Realtor info at bottom (Zillow-style: COMPANY, Agent Name)
    const agentName = property.agentName || property.agent_name;
    const agentCompany = property.agentCompany || property.agent_company;
    if (agentName || agentCompany) {
      const agentDiv = document.createElement('div');
      agentDiv.style.cssText = 'font-size: 12px; color: #6b7280; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
      const agentText = agentCompany && agentName ? `${agentCompany}, ${agentName}` : (agentCompany || agentName);
      agentDiv.textContent = agentText;
      contentSection.appendChild(agentDiv);
    }
    
    popupContainer.appendChild(contentSection);
    
    // Add click handler for SPA navigation via onPropertySelect
    popupContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      onPropertySelect(property.id);
    });
    
    // Create and show popup (no close button like Zillow)
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: true,
      offset: [0, -15],
      className: 'property-preview-popup',
      maxWidth: 'none'
    })
      .setLngLat([lng, lat])
      .setDOMContent(popupContainer)
      .addTo(map.current);
    
    // Handle popup close - reset marker style (only if element is still in DOM)
    popupRef.current.on('close', () => {
      if (selectedMarkerRef.current && document.contains(selectedMarkerRef.current)) {
        selectedMarkerRef.current.style.cssText = `
          width: 16px;
          height: 16px;
          background-color: #3B82F6;
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          transition: width 0.15s ease, height 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        `;
      }
      selectedMarkerRef.current = null;
      setSelectedPropertyId(null);
      setPopupProperty(null);
    });
    
    setSelectedPropertyId(property.id);
    setPopupProperty(property);
  }, [onPropertySelect]);

  // Keep showPropertyPopupRef updated for style toggle marker recreation
  useLayoutEffect(() => {
    showPropertyPopupRef.current = showPropertyPopup;
  }, [showPropertyPopup]);

  // Add markers to map (NO FILTERING - parent handles that)
  const addMarkersToMap = useCallback((properties: Property[]) => {
    if (!map.current) return;

    console.log('addMarkersToMap: Rendering', properties.length, 'markers');
    
    // Clear existing markers and popup
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    selectedMarkerRef.current = null;

    // Show all properties passed in (already filtered by parent)
    const maxMarkers = 1000;
    const limitedProperties = properties.slice(0, maxMarkers);
    
    console.log(`Enhanced render: ${limitedProperties.length} markers`);
    
    // Direct synchronous rendering for maximum speed
    limitedProperties.forEach(property => {
      const lat = parseFloat(property.latitude as string);
      const lng = parseFloat(property.longitude as string);

      if (isNaN(lat) || isNaN(lng)) {
        console.log('Invalid coordinates for property:', property.id, { lat: property.latitude, lng: property.longitude });
        return;
      }

      // Default marker style
      const el = document.createElement('div');
      el.dataset.propertyId = String(property.id);
      el.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: #3B82F6;
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        transition: width 0.15s ease, height 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Marker click - show popup and highlight
      el.onclick = (e) => {
        e.stopPropagation();
        showPropertyPopup(property, el);
      };
      
      markers.current.push(marker);
    });
    
    console.log(`Instant render complete: ${markers.current.length} markers`);
  }, [showPropertyPopup]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Get API key
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        mapboxgl.accessToken = config.mapboxApiKey;
        
        // Initialize map with optimized settings for performance
        const styleUrl = mapStyle === 'satellite' 
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : 'mapbox://styles/mapbox/streets-v12';
          
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: styleUrl, // Use satellite as default
          center: [-98.35, 39.5], // Center of US
          zoom: 4,
          // Performance optimizations
          renderWorldCopies: false,
          maxBounds: [[-180, -85], [180, 85]],
          attributionControl: false,
          // Additional performance settings
          preserveDrawingBuffer: false,
          antialias: false,
          maxTileCacheSize: 100,
          // Fast loading optimizations
          fadeDuration: 0,
          crossSourceCollisions: false
        });

        // Set ready immediately for instant UI response
        setMapReady(true);
        
        map.current.on('load', () => {
          // Expose map instance globally for search functionality
          (window as any).__simpleMap = map.current;
          
          // Expose protected flyTo/fitBounds for mobile search (prevents premature search mode exit)
          // Uses moveend event for reliable cleanup instead of fixed timeout
          (window as any).__simpleMapProtectedFly = (options: {
            center?: [number, number];
            zoom?: number;
            bbox?: [number, number, number, number];
          }) => {
            if (!map.current) return;
            
            // Set protection refs BEFORE animation (mirrors existing logic)
            isZoomingRef.current = true;
            pendingSearchTransitionRef.current = true;
            // Set grace period to 2 seconds from now to match existing behavior
            searchTransitionCompleteTimeRef.current = Date.now();
            
            // Clear protection on moveend (reliable even if animation interrupted)
            const clearProtection = () => {
              isZoomingRef.current = false;
              pendingSearchTransitionRef.current = false;
            };
            map.current.once('moveend', clearProtection);
            
            // Also set a safety timeout in case moveend doesn't fire
            setTimeout(clearProtection, 1500);
            
            if (options.bbox && Array.isArray(options.bbox) && options.bbox.length === 4) {
              const bounds: [[number, number], [number, number]] = [
                [options.bbox[0], options.bbox[1]],
                [options.bbox[2], options.bbox[3]]
              ];
              map.current.fitBounds(bounds, {
                padding: { top: 80, bottom: 80, left: 80, right: 80 },
                duration: 800,
                essential: true,
                maxZoom: 15
              });
            } else if (options.center) {
              map.current.flyTo({
                center: options.center,
                zoom: options.zoom || 10,
                duration: 800,
                essential: true
              });
            }
          };
          
          // INSTANT location handling for homepage navigation
          const applyNavigationLocation = () => {
            // Priority order: 
            // 1. initialBounds (from search geocoding)
            // 2. initialViewport (from search geocoding)
            // 3. pending global location
            // 4. URL params
            // 5. session storage
            
            // Check if we have initialBounds from search
            if (initialBounds && map.current) {
              console.log('Properties page: Applying initial bounds from search:', initialBounds);
              // Set grace period BEFORE fitBounds to prevent zoomend from exiting search mode
              isZoomingRef.current = true;
              searchTransitionCompleteTimeRef.current = Date.now();
              map.current.fitBounds(initialBounds as [number, number, number, number], {
                padding: 50,
                duration: 400,
                essential: true
              });
              // Reset isZooming after animation completes
              setTimeout(() => {
                isZoomingRef.current = false;
              }, 500);
              return;
            }
            
            // Check if we have initialViewport from search
            if (initialViewport && map.current) {
              console.log('Properties page: Applying initial viewport from search:', initialViewport);
              // Set grace period BEFORE flyTo to prevent zoomend from exiting search mode
              isZoomingRef.current = true;
              searchTransitionCompleteTimeRef.current = Date.now();
              map.current.flyTo({
                center: [initialViewport.lng, initialViewport.lat],
                zoom: initialViewport.zoom,
                duration: 400,
                essential: true
              });
              // Reset isZooming after animation completes
              setTimeout(() => {
                isZoomingRef.current = false;
              }, 500);
              return;
            }
            
            // Check multiple sources for location data (existing logic)
            const pendingLocation = (window as any).__pendingMapLocation;
            const sessionData = sessionStorage.getItem('selectedMapLocation');
            const urlParams = new URLSearchParams(window.location.search);
            const lat = urlParams.get('lat');
            const lng = urlParams.get('lng');
            const zoom = urlParams.get('zoom');
            
            let locationData = null;
            
            if (pendingLocation) {
              locationData = pendingLocation;
              console.log('Using pending location:', locationData);
            } else if (lat && lng && zoom) {
              locationData = {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                zoom: parseInt(zoom)
              };
              console.log('Using URL params:', locationData);
            } else if (sessionData) {
              try {
                locationData = JSON.parse(sessionData);
                console.log('Using session data:', locationData);
              } catch (e) {
                console.warn('Failed to parse session data');
              }
            }
            
            if (locationData && map.current) {
              console.log('Applying location immediately:', locationData);
              // Apply location immediately without animation to avoid flashing
              map.current.setCenter([locationData.lng, locationData.lat]);
              map.current.setZoom(locationData.zoom);
              
              // Clear all location data
              (window as any).__pendingMapLocation = null;
              sessionStorage.removeItem('selectedMapLocation');
            }
          };
          
          // Apply location immediately
          applyNavigationLocation();
        });

        // Enable bounds filtering - update list when map moves
        // Use ref wrapper to always call latest version (avoids stale closure)
        map.current.on('moveend', () => updateVisiblePropertiesRef.current());
        map.current.on('zoomend', () => updateVisiblePropertiesRef.current());
      })
      .catch(error => {
        console.error('Error initializing map:', error);
      });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]); // Only re-initialize when map style changes, not on callback changes

  // Re-render markers when filters change
  useEffect(() => {
    console.log('Filter effect triggered - mapReady:', mapReady, 'propertiesCount:', propertiesRef.current.length, 'filters:', JSON.stringify(filters));
    
    if (!mapReady) {
      console.log('Filter effect: Map not ready, skipping');
      return;
    }
    
    // Ensure we have properties to filter
    if (propertiesRef.current.length === 0) {
      console.log('Filter effect: No properties available, loading...');
      loadAllProperties(false).then(loadedProperties => {
        if (loadedProperties.length > 0) {
          console.log('Filter effect: Loaded', loadedProperties.length, 'properties for filtering');
          propertiesRef.current = loadedProperties;
          setAllProperties(loadedProperties);
          addMarkersToMap(loadedProperties);
          updateVisibleProperties();
        }
      });
      return;
    }
    
    console.log('Filter effect: Re-rendering', propertiesRef.current.length, 'markers with filters');
    addMarkersToMap(propertiesRef.current);
    updateVisibleProperties();
  }, [filters, mapReady, addMarkersToMap, updateVisibleProperties, loadAllProperties]);

  // Track previous properties IDs to detect actual dataset changes (not just array reference)
  const prevPropertiesIdsRef = useRef<Set<number>>(new Set());
  
  // Helper to check if properties dataset actually changed
  const propertiesActuallyChanged = useCallback((newProperties: Property[]) => {
    if (prevPropertiesIdsRef.current.size !== newProperties.length) return true;
    for (const prop of newProperties) {
      if (!prevPropertiesIdsRef.current.has(prop.id)) return true;
    }
    return false;
  }, []);
  
  // SIMPLIFIED: Update map when properties change from parent
  // Parent (properties.tsx) is the source of truth - we just render what we receive
  // ONLY re-render markers when dataset actually changes (not just viewport filtering)
  useEffect(() => {
    console.log('SimpleMap properties effect - mapReady:', mapReady, 'properties:', properties?.length);
    
    if (!mapReady) {
      console.log('SimpleMap: Map not ready, skipping');
      return;
    }
    
    // Always use properties from parent
    if (properties && properties.length > 0) {
      // Check if the properties dataset actually changed (not just array reference)
      const hasChanged = propertiesActuallyChanged(properties);
      
      if (!hasChanged && markers.current.length > 0) {
        console.log('SimpleMap: Properties unchanged, skipping marker re-render');
        // Still update the ref for future comparisons
        propertiesRef.current = properties;
        return;
      }
      
      console.log('SimpleMap: Received', properties.length, 'properties from parent (changed:', hasChanged, ')');
      propertiesRef.current = properties;
      setAllProperties(properties);
      
      // Update the IDs cache for future comparisons
      prevPropertiesIdsRef.current = new Set(properties.map(p => p.id));
      
      // Clear and re-add markers only when dataset changed
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      addMarkersToMap(properties);
      
      // Update visible properties (viewport filter + notify parent)
      pendingSearchTransitionRef.current = false;
      // Record when search transition completed - grace period before allowing exit
      searchTransitionCompleteTimeRef.current = Date.now();
      requestAnimationFrame(() => {
        updateVisibleProperties();
      });
    } else if (!properties || properties.length === 0) {
      // No properties from parent - load from API as fallback
      console.log('SimpleMap: No properties from parent, loading from API');
      loadAllProperties(false).then(loadedProperties => {
        if (loadedProperties.length > 0) {
          console.log('SimpleMap: Loaded', loadedProperties.length, 'properties from API');
          propertiesRef.current = loadedProperties;
          setAllProperties(loadedProperties);
          prevPropertiesIdsRef.current = new Set(loadedProperties.map((p: Property) => p.id));
          
          markers.current.forEach(marker => marker.remove());
          markers.current = [];
          addMarkersToMap(loadedProperties);
          
          requestAnimationFrame(() => {
            updateVisibleProperties();
          });
        }
      });
    }
  }, [properties, mapReady, addMarkersToMap, loadAllProperties, updateVisibleProperties, propertiesActuallyChanged]);

  // Zoom to search bounds when they change
  useEffect(() => {
    if (!searchBounds || !searchCounter || searchCounter === 0 || !map.current || !mapReady) {
      return;
    }
    
    isZoomingRef.current = true;
    // Set grace period BEFORE fitBounds to prevent zoomend from exiting search mode
    searchTransitionCompleteTimeRef.current = Date.now();
    
    map.current.fitBounds(searchBounds as [number, number, number, number], {
      padding: 80,
      duration: 600,
      essential: true,
      maxZoom: 12
    });
    
    // Reset zoom flag after animation completes
    const handleZoomComplete = () => {
      isZoomingRef.current = false;
      map.current?.off('moveend', handleZoomComplete);
    };
    
    map.current.once('moveend', handleZoomComplete);
    
    return () => {
      map.current?.off('moveend', handleZoomComplete);
    };
  }, [searchCounter, searchBounds, mapReady]);

  // When searchCounter transitions from non-zero to zero, update visible properties
  // This handles the case where user exits search mode via map drag
  useEffect(() => {
    const prevValue = prevSearchCounterRef.current;
    prevSearchCounterRef.current = searchCounter || 0;
    
    // If we just exited search mode (was > 0, now is 0 or undefined)
    if (prevValue && prevValue > 0 && (!searchCounter || searchCounter === 0)) {
      console.log('Search mode exited - refreshing viewport properties');
      // Use setTimeout to ensure state has fully propagated
      setTimeout(() => {
        updateVisibleProperties();
      }, 0);
    }
  }, [searchCounter, updateVisibleProperties]);

  // Handle user map interactions - exit search mode on drag, zoom, or other user-driven moves
  useEffect(() => {
    if (!map.current || !mapReady) return;
    
    // Generic handler for user-driven map interactions
    const handleUserInteraction = (eventType: string) => {
      // Use refs to get current search state (avoids stale closure)
      const isInSearchMode = isSearchModeRef.current;
      const currentSearchCounter = searchCounterRef.current;
      const isZooming = isZoomingRef.current;
      
      console.log(`Map ${eventType} - isSearchMode:`, isInSearchMode, 'searchCounterRef:', currentSearchCounter, 'isZooming:', isZooming);
      
      // If we're in search mode and not during an automated zoom, exit search mode
      if ((isInSearchMode || currentSearchCounter > 0) && !isZooming && onExitSearchMode) {
        console.log(`User ${eventType} - exiting search mode`);
        // Reset the refs immediately before calling the parent
        searchCounterRef.current = 0;
        isSearchModeRef.current = false;
        pendingSearchTransitionRef.current = false;
        // Reset grace period timestamp
        searchTransitionCompleteTimeRef.current = 0;
        // CRITICAL: Set flag to prevent re-entering search mode on next render
        userExitedSearchRef.current = true;
        onExitSearchMode();
        // Now update visible properties since we're out of search mode
        updateVisibleProperties();
      } else if (!isInSearchMode && currentSearchCounter === 0) {
        // Not in search mode - just update visible properties based on new viewport
        console.log(`Map ${eventType} - updating visible properties`);
        updateVisibleProperties();
      }
    };
    
    const handleDragEnd = () => handleUserInteraction('dragend');
    
    // Handler for user-driven zoom (wheel, double-click, pinch)
    // Check for originalEvent to distinguish from programmatic zoom
    const handleZoomEnd = (e: mapboxgl.MapboxEvent) => {
      // If isZoomingRef is true, this is a programmatic zoom - skip
      if (isZoomingRef.current) {
        console.log('Map zoomend - programmatic zoom, skipping');
        return;
      }
      
      // If we're in the middle of a search transition, ignore zoomend events
      if (pendingSearchTransitionRef.current) {
        console.log('Map zoomend - pending search transition, skipping');
        return;
      }
      
      // Grace period: don't exit search mode within 2 seconds of search transition completing
      // This prevents race conditions where multiple zoomend events fire after fitBounds
      const timeSinceTransition = Date.now() - searchTransitionCompleteTimeRef.current;
      if (searchTransitionCompleteTimeRef.current > 0 && timeSinceTransition < 2000) {
        console.log('Map zoomend - within search grace period, skipping exit');
        return;
      }
      
      // User-driven zoom - exit search mode
      handleUserInteraction('zoomend');
    };
    
    map.current.on('dragend', handleDragEnd);
    map.current.on('zoomend', handleZoomEnd);
    
    return () => {
      map.current?.off('dragend', handleDragEnd);
      map.current?.off('zoomend', handleZoomEnd);
    };
  }, [mapReady, onExitSearchMode, updateVisibleProperties]);

  return (
    <div className="h-full w-full relative">
      <div 
        ref={mapContainer} 
        className="h-full w-full"
        style={{ 
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      />

      {/* Zoom Controls - Right side, positioned with safe-area awareness */}
      <div className="absolute top-1/2 -translate-y-1/2 right-3 md:top-4 md:right-4 md:translate-y-0 z-10">
        <div className="flex flex-col bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-xl overflow-hidden">
          <button
            onClick={() => map.current?.zoomIn()}
            className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-gray-200/80"
            title="Zoom In"
            data-testid="map-zoom-in"
          >
            <svg className="w-5 h-5 md:w-4 md:h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={() => map.current?.zoomOut()}
            className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Zoom Out"
            data-testid="map-zoom-out"
          >
            <svg className="w-5 h-5 md:w-4 md:h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 12H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Map Controls - Bottom Right with safe-area for mobile bottom nav */}
      <div className="absolute bottom-[100px] md:bottom-16 right-3 md:right-6 z-20">
        <div className="relative" ref={mapOptionsRef}>
          <button
            onClick={() => setShowMapOptions(!showMapOptions)}
            className="bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-xl p-3 shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-2"
            title="Map Options"
            data-testid="map-options-button"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Map</span>
          </button>

          {showMapOptions && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden min-w-[280px] z-20">
              {/* Map Style Section */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Map Style</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{mapStyle === 'satellite' ? 'Satellite' : 'Street'}</span>
                </div>
                <button
                  onClick={() => {
                    toggleMapStyle();
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mapStyle === 'satellite' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                  Switch to {mapStyle === 'satellite' ? 'Street View' : 'Satellite View'}
                </button>
              </div>

              {/* Climate Data Section */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-800">Climate Data</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveRiskTypes(prev => ({ ...prev, fire: !prev.fire }))}
                      className={`w-full p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                        activeRiskTypes.fire 
                          ? 'border-red-500 bg-red-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                        activeRiskTypes.fire ? 'bg-red-500' : 'bg-gray-300'
                      }`}>
                        <svg className={`w-3 h-3 ${activeRiskTypes.fire ? 'text-white' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={`text-xs font-medium ${activeRiskTypes.fire ? 'text-red-700' : 'text-gray-700'}`}>
                        Fire
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveRiskTypes(prev => ({ ...prev, flood: !prev.flood }))}
                      className={`w-full p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                        activeRiskTypes.flood 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                        activeRiskTypes.flood ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <svg className={`w-3 h-3 ${activeRiskTypes.flood ? 'text-white' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={`text-xs font-medium ${activeRiskTypes.flood ? 'text-blue-700' : 'text-gray-700'}`}>
                        Flood
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveRiskTypes(prev => ({ ...prev, heat: !prev.heat }))}
                      className={`w-full p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                        activeRiskTypes.heat 
                          ? 'border-orange-500 bg-orange-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                        activeRiskTypes.heat ? 'bg-orange-500' : 'bg-gray-300'
                      }`}>
                        <svg className={`w-3 h-3 ${activeRiskTypes.heat ? 'text-white' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={`text-xs font-medium ${activeRiskTypes.heat ? 'text-orange-700' : 'text-gray-700'}`}>
                        Heat
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveRiskTypes(prev => ({ ...prev, wind: !prev.wind }))}
                      className={`w-full p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                        activeRiskTypes.wind 
                          ? 'border-purple-500 bg-purple-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                        activeRiskTypes.wind ? 'bg-purple-500' : 'bg-gray-300'
                      }`}>
                        <svg className={`w-3 h-3 ${activeRiskTypes.wind ? 'text-white' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3-3a1 1 0 011 1v5a1 1 0 11-2 0V9a1 1 0 011-1zm-2 2a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={`text-xs font-medium ${activeRiskTypes.wind ? 'text-purple-700' : 'text-gray-700'}`}>
                        Wind
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* State Information Display */}
      {(hoveredState || selectedState) && (
        <div className="absolute top-6 left-6 z-10 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[200px] animate-fadeIn backdrop-blur-sm bg-white/95">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-800">
              {hoveredState || selectedState}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {hoveredState ? 'Click to filter properties' : 'Properties filtered by state'}
          </div>
          {selectedState && (
            <button
              onClick={() => {
                setSelectedState(null);
                // Reset to show all properties
                if (onPropertiesChange && allProperties.length > 0) {
                  onPropertiesChange(allProperties);
                }
              }}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear state filter
            </button>
          )}
          {!selectedState && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {['Texas', 'Florida', 'California', 'North Carolina'].map(state => (
                <button
                  key={state}
                  onClick={() => {
                    setSelectedState(state);
                    setHoveredState(null);
                    // Filter properties by state
                    const filteredProperties = allProperties.filter(p => 
                      p.state && p.state.toLowerCase().includes(state.toLowerCase())
                    );
                    if (onPropertiesChange) {
                      onPropertiesChange(filteredProperties);
                    }
                  }}
                  className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                >
                  {state}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zillow-style Climate Risk Legend with Intensity Scale */}
      {Object.values(activeRiskTypes).some(active => active) && (
        <div className="absolute bottom-20 left-6 z-10 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[280px] animate-fadeIn backdrop-blur-sm bg-white/95">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {activeRiskTypes.heat ? 'Max temperature' : 
               activeRiskTypes.fire ? 'Fire risk intensity' :
               activeRiskTypes.flood ? 'Flood risk intensity' :
               activeRiskTypes.wind ? 'Wind risk intensity' : 'Climate intensity'}
            </div>
          </div>
          
          {/* Intensity Scale Bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-3 rounded-full overflow-hidden" 
                style={{
                  background: activeRiskTypes.heat ? 
                    'linear-gradient(to right, #FEF3C7, #FDE68A, #FBBF24, #F59E0B, #DC2626, #B91C1C, #7F1D1D)' :
                  activeRiskTypes.fire ? 
                    'linear-gradient(to right, #FEF2F2, #FECACA, #FCA5A5, #F87171, #EF4444, #DC2626, #B91C1C)' :
                  activeRiskTypes.flood ? 
                    'linear-gradient(to right, #EFF6FF, #DBEAFE, #BFDBFE, #93C5FD, #60A5FA, #3B82F6, #1D4ED8)' :
                  activeRiskTypes.wind ? 
                    'linear-gradient(to right, #F3E8FF, #E9D5FF, #C4B5FD, #A78BFA, #8B5CF6, #7C3AED, #6D28D9)' :
                    'linear-gradient(to right, #D1FAE5, #A7F3D0, #6EE7B7, #34D399, #10B981, #059669, #047857)'
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                {activeRiskTypes.heat ? '75°' :
                 activeRiskTypes.fire ? 'Minimal' :
                 activeRiskTypes.flood ? 'Minimal' :
                 activeRiskTypes.wind ? 'Minimal' : 'Low'}
              </span>
              <span>
                {activeRiskTypes.heat ? '92°' :
                 activeRiskTypes.fire ? 'High' :
                 activeRiskTypes.flood ? 'High' :
                 activeRiskTypes.wind ? 'High' : 'High'}
              </span>
              <span>
                {activeRiskTypes.heat ? '98°' :
                 activeRiskTypes.fire ? 'Severe' :
                 activeRiskTypes.flood ? 'Severe' :
                 activeRiskTypes.wind ? 'Severe' : 'Severe'}
              </span>
              <span>
                {activeRiskTypes.heat ? '110+°' :
                 activeRiskTypes.fire ? 'Extreme' :
                 activeRiskTypes.flood ? 'Extreme' :
                 activeRiskTypes.wind ? 'Extreme' : 'Extreme'}
              </span>
            </div>
          </div>
          
          {/* Data Source */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-xs text-gray-500">Climate Data</p>
              </div>
              <p className="text-xs text-gray-400">Zoom in to see properties.</p>
            </div>
          </div>
        </div>
      )}

      {/* Climate Risk Overlay - memoized to prevent excessive re-renders */}
      <WorkingClimateOverlay 
        map={map.current}
        activeRiskTypes={useMemo(() => activeRiskTypes, [
          activeRiskTypes.fire,
          activeRiskTypes.flood,
          activeRiskTypes.heat,
          activeRiskTypes.wind
        ])}
        isMapReady={mapReady}
      />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMap;