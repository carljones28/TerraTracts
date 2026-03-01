import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface ClimateOverlayProps {
  map: mapboxgl.Map | null;
  activeRiskTypes: { [key: string]: boolean };
  isMapReady: boolean;
}

export function ClimateOverlay({ map, activeRiskTypes, isMapReady }: ClimateOverlayProps) {
  const overlayRef = useRef<string>('climate-overlay-layer');

  useEffect(() => {
    if (!map || !isMapReady) return;

    const layerId = overlayRef.current;
    
    // Clean up existing layer
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
    }

    // Check for active risk types
    const activeTypes = Object.keys(activeRiskTypes).filter(type => activeRiskTypes[type]);
    if (activeTypes.length === 0) {
      return;
    }

    // Add climate overlay
    addClimateOverlay(map, layerId, activeTypes);

  }, [map, activeRiskTypes, isMapReady]);

  return null; // This is a utility component with no visual output
}

async function addClimateOverlay(map: mapboxgl.Map, layerId: string, activeTypes: string[]) {
  try {
    const bounds = map.getBounds();
    if (!bounds) return;

    // Fetch climate data
    const apiUrl = `/api/climate-risk-polygons?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}&types=${activeTypes.join(',')}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error('Climate API failed:', response.status);
      return;
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      console.log('No climate data available for current view');
      return;
    }

    // Create GeoJSON source
    map.addSource(layerId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: data.features.map((feature: any) => ({
          type: 'Feature',
          properties: {
            color: feature.properties.color || '#FF4444',
            opacity: Math.max(0.4, feature.properties.opacity || 0.5)
          },
          geometry: feature.geometry
        }))
      }
    });

    // Add fill layer
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': ['get', 'opacity']
      }
    });

    console.log(`Climate overlay added with ${data.features.length} features`);

  } catch (error) {
    console.error('Failed to add climate overlay:', error);
  }
}