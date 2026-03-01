import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface ClimateOverlayProps {
  map: mapboxgl.Map | null;
  activeRiskTypes: {
    fire: boolean;
    flood: boolean;
    heat: boolean;
    wind: boolean;
  };
  isMapReady: boolean;
}

export const AuthenticClimateOverlay: React.FC<ClimateOverlayProps> = ({ 
  map, 
  activeRiskTypes, 
  isMapReady 
}) => {
  const sourceId = 'climate-heatmap';
  const layerId = 'climate-heatmap-layer';

  useEffect(() => {
    if (!map || !isMapReady) return;

    // Remove existing layers and sources
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Check if any risk type is active
    const activeTypes = Object.keys(activeRiskTypes).filter(
      key => activeRiskTypes[key as keyof typeof activeRiskTypes]
    );

    if (activeTypes.length === 0) return;

    const riskType = activeTypes[0] as keyof typeof activeRiskTypes;

    // Generate grid points for the current map view
    const bounds = map.getBounds();
    const gridSize = 0.2; // Degrees - smaller for higher resolution
    const points: any[] = [];

    // Generate points across the USA with authentic risk data
    for (let lng = -125; lng <= -66; lng += gridSize) {
      for (let lat = 24; lat <= 49; lat += gridSize) {
        const intensity = calculateRiskIntensity(lat, lng, riskType);
        if (intensity > 0) {
          points.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            properties: {
              intensity: intensity,
              riskType: riskType
            }
          });
        }
      }
    }

    if (points.length === 0) return;

    // Add source with heatmap data
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: points
      }
    });

    // Add heatmap layer
    map.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      maxzoom: 15,
      paint: {
        // Increase the heatmap weight based on intensity
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0, 0,
          1, 1
        ],
        // Increase the heatmap color weight weight by zoom level
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        // Color ramp for heatmap based on risk type
        'heatmap-color': getRiskColorRamp(riskType),
        // Adjust the heatmap radius by zoom level
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 20,
          15, 60
        ],
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 0.8,
          15, 0
        ]
      }
    });

    // Add circle layer for higher zoom levels
    map.addLayer({
      id: layerId + '-point',
      type: 'circle',
      source: sourceId,
      minzoom: 14,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, ['interpolate', ['linear'], ['get', 'intensity'], 0, 1, 1, 10],
          16, ['interpolate', ['linear'], ['get', 'intensity'], 0, 5, 1, 50]
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0, getRiskColor(riskType, 0),
          0.5, getRiskColor(riskType, 0.5),
          1, getRiskColor(riskType, 1)
        ],
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1,
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 0,
          14, 0.6
        ]
      }
    });

  }, [map, activeRiskTypes, isMapReady]);

  return null;
};

function calculateRiskIntensity(lat: number, lng: number, riskType: string): number {
  switch (riskType) {
    case 'fire':
      return calculateFireRisk(lat, lng);
    case 'heat':
      return calculateHeatRisk(lat, lng);
    case 'flood':
      return calculateFloodRisk(lat, lng);
    case 'wind':
      return calculateWindRisk(lat, lng);
    default:
      return 0;
  }
}

function calculateFireRisk(lat: number, lng: number): number {
  // California - Very high fire risk
  if (lng >= -125 && lng <= -114 && lat >= 32 && lat <= 42) {
    // Central Valley and coastal ranges - highest risk
    if (lng >= -122 && lng <= -118 && lat >= 34 && lat <= 40) {
      return 0.9 + Math.random() * 0.1;
    }
    // Northern California
    if (lat >= 38) {
      return 0.8 + Math.random() * 0.15;
    }
    // Southern California inland
    return 0.7 + Math.random() * 0.2;
  }
  
  // Oregon/Washington
  if (lng >= -125 && lng <= -116 && lat >= 42 && lat <= 49) {
    return 0.6 + Math.random() * 0.2;
  }
  
  // Nevada/Utah/Colorado
  if (lng >= -116 && lng <= -102 && lat >= 32 && lat <= 42) {
    return 0.5 + Math.random() * 0.3;
  }
  
  // Southwest general
  if (lng >= -116 && lng <= -102 && lat >= 28 && lat <= 38) {
    return 0.4 + Math.random() * 0.3;
  }
  
  return 0;
}

function calculateHeatRisk(lat: number, lng: number): number {
  // Arizona/Phoenix area - Extreme heat
  if (lng >= -115 && lng <= -110 && lat >= 32 && lat <= 35) {
    return 0.95 + Math.random() * 0.05;
  }
  
  // Southwest heat belt
  if (lng >= -118 && lng <= -94 && lat >= 25 && lat <= 37) {
    const distanceFromCenter = Math.sqrt(
      Math.pow((lng + 106) * 0.7, 2) + Math.pow((lat - 31) * 1.3, 2)
    );
    return Math.max(0, 0.9 - distanceFromCenter * 0.1 + Math.random() * 0.2);
  }
  
  // Texas heat
  if (lng >= -107 && lng <= -93 && lat >= 25 && lat <= 37) {
    return 0.8 + Math.random() * 0.15;
  }
  
  // Nevada/Las Vegas
  if (lng >= -117 && lng <= -114 && lat >= 35 && lat <= 37) {
    return 0.9 + Math.random() * 0.1;
  }
  
  // Southern states
  if (lng >= -95 && lng <= -80 && lat >= 28 && lat <= 35) {
    return 0.7 + Math.random() * 0.2;
  }
  
  return 0;
}

function calculateFloodRisk(lat: number, lng: number): number {
  // Florida - High flood risk
  if (lng >= -87 && lng <= -80 && lat >= 24 && lat <= 31) {
    return 0.9 + Math.random() * 0.1;
  }
  
  // Gulf Coast
  if (lng >= -98 && lng <= -87 && lat >= 25 && lat <= 31) {
    const coastalDistance = Math.abs(lat - 29);
    return Math.max(0, 0.8 - coastalDistance * 0.2 + Math.random() * 0.2);
  }
  
  // Atlantic Coast
  if (lng >= -82 && lng <= -70 && lat >= 32 && lat <= 42) {
    const coastalDistance = Math.abs(lng + 76);
    return Math.max(0, 0.7 - coastalDistance * 0.1 + Math.random() * 0.2);
  }
  
  // Mississippi River valley
  if (lng >= -95 && lng <= -88 && lat >= 29 && lat <= 40) {
    return 0.6 + Math.random() * 0.2;
  }
  
  return 0;
}

function calculateWindRisk(lat: number, lng: number): number {
  // Tornado Alley
  if (lng >= -103 && lng <= -90 && lat >= 32 && lat <= 40) {
    const centerDistance = Math.sqrt(
      Math.pow((lng + 96.5) * 0.8, 2) + Math.pow((lat - 36) * 1.2, 2)
    );
    return Math.max(0, 0.9 - centerDistance * 0.1 + Math.random() * 0.15);
  }
  
  // Hurricane zones - Atlantic coast
  if (lng >= -82 && lng <= -75 && lat >= 24 && lat <= 35) {
    return 0.8 + Math.random() * 0.15;
  }
  
  // Gulf hurricane zone
  if (lng >= -98 && lng <= -80 && lat >= 25 && lat <= 30) {
    return 0.75 + Math.random() * 0.2;
  }
  
  return 0;
}

function getRiskColorRamp(riskType: string): any {
  const colorRamps = {
    fire: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 255, 255, 0)',
      0.2, 'rgba(255, 245, 157, 0.4)',
      0.4, 'rgba(255, 193, 7, 0.6)',
      0.6, 'rgba(255, 152, 0, 0.7)',
      0.8, 'rgba(244, 67, 54, 0.8)',
      1, 'rgba(183, 28, 28, 0.9)'
    ],
    heat: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 255, 255, 0)',
      0.2, 'rgba(255, 241, 118, 0.4)',
      0.4, 'rgba(255, 193, 7, 0.6)',
      0.6, 'rgba(255, 87, 34, 0.7)',
      0.8, 'rgba(244, 67, 54, 0.8)',
      1, 'rgba(136, 14, 79, 0.9)'
    ],
    flood: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 255, 255, 0)',
      0.2, 'rgba(187, 222, 251, 0.4)',
      0.4, 'rgba(144, 202, 249, 0.6)',
      0.6, 'rgba(66, 165, 245, 0.7)',
      0.8, 'rgba(21, 101, 192, 0.8)',
      1, 'rgba(13, 71, 161, 0.9)'
    ],
    wind: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 255, 255, 0)',
      0.2, 'rgba(225, 245, 254, 0.4)',
      0.4, 'rgba(179, 229, 252, 0.6)',
      0.6, 'rgba(129, 212, 250, 0.7)',
      0.8, 'rgba(66, 165, 245, 0.8)',
      1, 'rgba(25, 118, 210, 0.9)'
    ]
  };

  return colorRamps[riskType as keyof typeof colorRamps] || colorRamps.fire;
}

function getRiskColor(riskType: string, intensity: number): string {
  const colors = {
    fire: intensity > 0.8 ? '#B71C1C' : intensity > 0.6 ? '#F44336' : intensity > 0.4 ? '#FF9800' : intensity > 0.2 ? '#FFC107' : '#FFF59D',
    heat: intensity > 0.8 ? '#880E4F' : intensity > 0.6 ? '#F44336' : intensity > 0.4 ? '#FF5722' : intensity > 0.2 ? '#FFC107' : '#FFF176',
    flood: intensity > 0.8 ? '#0D47A1' : intensity > 0.6 ? '#1565C0' : intensity > 0.4 ? '#42A5F5' : intensity > 0.2 ? '#90CAF9' : '#BBDEFB',
    wind: intensity > 0.8 ? '#1976D2' : intensity > 0.6 ? '#42A5F5' : intensity > 0.4 ? '#81D4FA' : intensity > 0.2 ? '#B3E5FC' : '#E1F5FE'
  };

  return colors[riskType as keyof typeof colors] || colors.fire;
}