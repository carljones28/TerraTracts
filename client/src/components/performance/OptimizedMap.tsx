import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Property {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  isWaterfront?: boolean;
  isMountainView?: boolean;
}

interface OptimizedMapProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property) => void;
  viewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  onViewStateChange?: (viewState: any) => void;
}

// Memoized marker component
const PropertyMarker = memo(function PropertyMarker({
  property,
  isSelected,
  onClick
}: {
  property: Property;
  isSelected: boolean;
  onClick: (property: Property) => void;
}) {
  const handleClick = useCallback(() => {
    onClick(property);
  }, [property, onClick]);

  const markerColor = useMemo(() => {
    if (isSelected) return '#ef4444'; // red
    if (property.isWaterfront) return '#3b82f6'; // blue
    if (property.isMountainView) return '#10b981'; // emerald
    return '#6b7280'; // gray
  }, [isSelected, property.isWaterfront, property.isMountainView]);

  return (
    <Marker
      longitude={property.longitude}
      latitude={property.latitude}
      anchor="bottom"
      onClick={handleClick}
    >
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transform transition-transform hover:scale-110"
        style={{ backgroundColor: markerColor }}
      />
    </Marker>
  );
});

// Optimized map component with performance improvements
export const OptimizedMap = memo(function OptimizedMap({
  properties,
  selectedProperty,
  onPropertySelect,
  viewState,
  onViewStateChange
}: OptimizedMapProps) {
  const mapRef = useRef<any>(null);

  // Memoize filtered properties for better performance
  const visibleProperties = useMemo(() => {
    // Only show properties with valid coordinates
    return properties.filter(p => 
      p.latitude && 
      p.longitude && 
      !isNaN(p.latitude) && 
      !isNaN(p.longitude)
    );
  }, [properties]);

  const handlePropertySelect = useCallback((property: Property) => {
    onPropertySelect?.(property);
  }, [onPropertySelect]);

  const defaultViewState = useMemo(() => ({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 4
  }), []);

  // Optimize map updates
  const mapStyle = "mapbox://styles/mapbox/satellite-streets-v12";

  useEffect(() => {
    // Focus on selected property
    if (selectedProperty && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedProperty.longitude, selectedProperty.latitude],
        zoom: 12,
        duration: 1000
      });
    }
  }, [selectedProperty]);

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        {...(viewState || defaultViewState)}
        onMove={evt => onViewStateChange?.(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
        reuseMaps
        maxZoom={18}
        minZoom={2}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={[]}
      >
        {/* Render markers efficiently */}
        {visibleProperties.map(property => (
          <PropertyMarker
            key={property.id}
            property={property}
            isSelected={selectedProperty?.id === property.id}
            onClick={handlePropertySelect}
          />
        ))}

        {/* Map controls */}
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />
      </Map>

      {/* Property count indicator */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <span className="text-sm font-medium text-gray-700">
          {visibleProperties.length} properties
        </span>
      </div>
    </div>
  );
});

OptimizedMap.displayName = 'OptimizedMap';