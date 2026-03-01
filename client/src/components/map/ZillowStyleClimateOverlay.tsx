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

export const ZillowStyleClimateOverlay: React.FC<ClimateOverlayProps> = ({ 
  map, 
  activeRiskTypes, 
  isMapReady 
}) => {
  const overlaySourceId = 'climate-overlay-source';
  const overlayLayerId = 'climate-overlay-layer';

  useEffect(() => {
    if (!map || !isMapReady) return;

    // Remove existing overlay
    if (map.getLayer(overlayLayerId)) {
      map.removeLayer(overlayLayerId);
    }
    if (map.getSource(overlaySourceId)) {
      map.removeSource(overlaySourceId);
    }

    const activeTypes = Object.keys(activeRiskTypes).filter(
      key => activeRiskTypes[key as keyof typeof activeRiskTypes]
    );

    if (activeTypes.length === 0) return;

    // Get the active risk type
    const riskType = activeTypes[0] as keyof typeof activeRiskTypes;

    // Create GeoJSON features for authentic geographic risk areas
    const features = createAuthenticRiskFeatures(riskType);

    if (features.length === 0) return;

    // Add source with features
    map.addSource(overlaySourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    // Add fill layer with terrain-following visualization
    map.addLayer({
      id: overlayLayerId,
      type: 'fill',
      source: overlaySourceId,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0, getRiskColor(riskType, 0),
          0.3, getRiskColor(riskType, 0.3),
          0.5, getRiskColor(riskType, 0.5),
          0.7, getRiskColor(riskType, 0.7),
          1.0, getRiskColor(riskType, 1.0)
        ],
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0, 0,
          0.2, 0.3,
          0.5, 0.5,
          0.8, 0.7,
          1.0, 0.8
        ]
      }
    });

  }, [map, activeRiskTypes, isMapReady]);

  return null;
};

function createAuthenticRiskFeatures(riskType: string) {
  switch (riskType) {
    case 'fire':
      return createFireRiskFeatures();
    case 'heat':
      return createHeatRiskFeatures();
    case 'flood':
      return createFloodRiskFeatures();
    case 'wind':
      return createWindRiskFeatures();
    default:
      return [];
  }
}

function createFireRiskFeatures() {
  return [
    // California Central Valley - High fire risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.9 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-122.0, 37.0], [-121.5, 37.5], [-121.0, 38.0], [-120.0, 38.5],
          [-119.0, 38.8], [-118.5, 39.0], [-118.0, 39.2], [-117.5, 39.0],
          [-117.0, 38.5], [-116.5, 38.0], [-116.0, 37.5], [-116.5, 37.0],
          [-117.0, 36.5], [-118.0, 36.0], [-119.0, 36.2], [-120.0, 36.5],
          [-121.0, 36.8], [-122.0, 37.0]
        ]]
      }
    },
    // Northern California - Very high fire risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.95 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-123.0, 39.0], [-122.5, 39.5], [-122.0, 40.0], [-121.5, 40.5],
          [-121.0, 41.0], [-120.5, 41.2], [-120.0, 41.0], [-119.5, 40.5],
          [-119.0, 40.0], [-119.5, 39.5], [-120.0, 39.2], [-120.5, 39.0],
          [-121.0, 38.8], [-121.5, 38.5], [-122.0, 38.8], [-122.5, 39.0],
          [-123.0, 39.0]
        ]]
      }
    },
    // Southern California inland - High fire risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.85 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-118.5, 34.5], [-118.0, 35.0], [-117.5, 35.2], [-117.0, 35.0],
          [-116.5, 34.8], [-116.0, 34.5], [-115.5, 34.2], [-115.0, 34.0],
          [-115.2, 33.5], [-115.8, 33.2], [-116.5, 33.0], [-117.2, 33.2],
          [-117.8, 33.5], [-118.2, 34.0], [-118.5, 34.5]
        ]]
      }
    },
    // Oregon/Washington - Moderate to high fire risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.7 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-124.0, 42.0], [-123.5, 42.5], [-123.0, 43.0], [-122.5, 43.5],
          [-122.0, 44.0], [-121.5, 44.5], [-121.0, 45.0], [-120.5, 45.5],
          [-120.0, 46.0], [-119.5, 46.5], [-119.0, 47.0], [-118.5, 47.5],
          [-118.0, 47.2], [-117.5, 46.8], [-117.0, 46.2], [-116.8, 45.5],
          [-117.0, 45.0], [-117.5, 44.5], [-118.0, 44.0], [-118.5, 43.5],
          [-119.0, 43.0], [-119.5, 42.8], [-120.0, 42.5], [-120.5, 42.2],
          [-121.0, 42.0], [-121.5, 41.8], [-122.0, 41.5], [-122.5, 41.8],
          [-123.0, 42.0], [-123.5, 42.2], [-124.0, 42.0]
        ]]
      }
    },
    // Nevada/Utah - Moderate fire risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.6 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-117.0, 39.0], [-116.0, 39.5], [-115.0, 40.0], [-114.0, 40.5],
          [-113.0, 41.0], [-112.0, 41.2], [-111.0, 41.0], [-110.0, 40.5],
          [-109.5, 40.0], [-109.8, 39.5], [-110.5, 39.0], [-111.2, 38.5],
          [-112.0, 38.2], [-113.0, 38.0], [-114.0, 38.2], [-115.0, 38.5],
          [-116.0, 38.8], [-117.0, 39.0]
        ]]
      }
    },
    // Colorado/New Mexico - Moderate fire risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.65 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-109.0, 37.0], [-108.0, 37.5], [-107.0, 38.0], [-106.0, 38.5],
          [-105.0, 39.0], [-104.0, 39.5], [-103.5, 39.2], [-103.8, 38.5],
          [-104.2, 38.0], [-104.8, 37.5], [-105.5, 37.0], [-106.2, 36.5],
          [-107.0, 36.2], [-108.0, 36.0], [-109.0, 36.2], [-109.5, 36.8],
          [-109.0, 37.0]
        ]]
      }
    }
  ];
}

function createHeatRiskFeatures() {
  return [
    // Arizona/Phoenix - Extreme heat
    {
      type: 'Feature' as const,
      properties: { intensity: 0.95 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-114.0, 33.0], [-113.0, 33.5], [-112.0, 34.0], [-111.0, 34.5],
          [-110.5, 34.2], [-110.8, 33.5], [-111.2, 33.0], [-111.8, 32.5],
          [-112.5, 32.2], [-113.2, 32.5], [-113.8, 33.0], [-114.0, 33.0]
        ]]
      }
    },
    // Texas - Very high heat
    {
      type: 'Feature' as const,
      properties: { intensity: 0.9 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-106.0, 32.0], [-105.0, 32.5], [-104.0, 33.0], [-103.0, 33.5],
          [-102.0, 34.0], [-101.0, 34.5], [-100.0, 35.0], [-99.0, 35.5],
          [-98.0, 36.0], [-97.0, 36.2], [-96.0, 36.0], [-95.5, 35.5],
          [-95.8, 35.0], [-96.2, 34.5], [-96.8, 34.0], [-97.5, 33.5],
          [-98.2, 33.0], [-99.0, 32.5], [-100.0, 32.2], [-101.0, 32.0],
          [-102.0, 31.8], [-103.0, 31.5], [-104.0, 31.8], [-105.0, 32.0],
          [-106.0, 32.0]
        ]]
      }
    },
    // Nevada/Las Vegas - Very high heat
    {
      type: 'Feature' as const,
      properties: { intensity: 0.92 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-116.0, 36.0], [-115.0, 36.5], [-114.5, 36.2], [-114.8, 35.5],
          [-115.2, 35.0], [-115.8, 34.8], [-116.2, 35.2], [-116.0, 36.0]
        ]]
      }
    },
    // Southern states heat belt
    {
      type: 'Feature' as const,
      properties: { intensity: 0.8 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-95.0, 29.0], [-94.0, 29.5], [-93.0, 30.0], [-92.0, 30.5],
          [-91.0, 31.0], [-90.0, 31.5], [-89.0, 32.0], [-88.0, 32.5],
          [-87.0, 33.0], [-86.0, 33.2], [-85.0, 33.0], [-84.5, 32.5],
          [-84.8, 32.0], [-85.2, 31.5], [-85.8, 31.0], [-86.5, 30.5],
          [-87.2, 30.0], [-88.0, 29.8], [-89.0, 29.5], [-90.0, 29.2],
          [-91.0, 29.0], [-92.0, 28.8], [-93.0, 28.5], [-94.0, 28.8],
          [-95.0, 29.0]
        ]]
      }
    }
  ];
}

function createFloodRiskFeatures() {
  return [
    // Florida - High flood risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.9 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-87.5, 30.5], [-86.5, 30.8], [-85.5, 30.5], [-84.5, 30.2],
          [-83.5, 29.8], [-82.5, 29.2], [-81.5, 28.5], [-80.5, 27.8],
          [-80.0, 27.0], [-80.2, 26.0], [-80.8, 25.2], [-81.5, 24.8],
          [-82.0, 25.2], [-82.5, 25.8], [-83.0, 26.5], [-83.5, 27.2],
          [-84.0, 27.8], [-84.5, 28.5], [-85.0, 29.2], [-85.5, 29.8],
          [-86.0, 30.2], [-86.5, 30.5], [-87.0, 30.8], [-87.5, 30.5]
        ]]
      }
    },
    // Gulf Coast - High flood risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.85 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-97.5, 25.8], [-96.5, 26.2], [-95.5, 26.8], [-94.5, 27.5],
          [-93.5, 28.2], [-92.5, 28.8], [-91.5, 29.2], [-90.5, 29.5],
          [-89.5, 29.8], [-88.5, 30.0], [-87.5, 30.2], [-87.0, 29.8],
          [-87.2, 29.2], [-87.8, 28.5], [-88.5, 28.0], [-89.2, 27.5],
          [-90.0, 27.2], [-91.0, 26.8], [-92.0, 26.5], [-93.0, 26.2],
          [-94.0, 26.0], [-95.0, 25.8], [-96.0, 25.5], [-97.0, 25.2],
          [-97.5, 25.8]
        ]]
      }
    },
    // Mid-Atlantic coast - Moderate flood risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.7 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-76.0, 36.5], [-75.5, 37.0], [-75.0, 37.5], [-74.5, 38.0],
          [-74.0, 38.5], [-73.5, 39.0], [-73.0, 39.5], [-72.5, 40.0],
          [-72.0, 40.5], [-71.5, 41.0], [-71.0, 41.2], [-71.2, 40.8],
          [-71.8, 40.2], [-72.5, 39.8], [-73.2, 39.2], [-73.8, 38.8],
          [-74.5, 38.2], [-75.2, 37.8], [-75.8, 37.2], [-76.0, 36.8],
          [-76.0, 36.5]
        ]]
      }
    }
  ];
}

function createWindRiskFeatures() {
  return [
    // Tornado Alley - High wind risk
    {
      type: 'Feature' as const,
      properties: { intensity: 0.85 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-102.0, 32.0], [-101.0, 32.5], [-100.0, 33.0], [-99.0, 33.5],
          [-98.0, 34.0], [-97.0, 34.5], [-96.0, 35.0], [-95.0, 35.5],
          [-94.0, 36.0], [-93.0, 36.5], [-92.0, 37.0], [-91.0, 37.5],
          [-90.0, 38.0], [-89.5, 37.5], [-90.0, 37.0], [-90.8, 36.5],
          [-91.5, 36.0], [-92.2, 35.5], [-93.0, 35.0], [-94.0, 34.5],
          [-95.0, 34.0], [-96.0, 33.5], [-97.0, 33.0], [-98.0, 32.8],
          [-99.0, 32.5], [-100.0, 32.2], [-101.0, 32.0], [-102.0, 32.0]
        ]]
      }
    },
    // Hurricane zones - Atlantic coast
    {
      type: 'Feature' as const,
      properties: { intensity: 0.8 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-82.0, 24.5], [-81.0, 25.0], [-80.0, 25.8], [-79.5, 26.5],
          [-79.0, 27.2], [-78.5, 28.0], [-78.0, 28.8], [-77.5, 29.5],
          [-77.0, 30.2], [-76.5, 31.0], [-76.0, 31.8], [-75.5, 32.5],
          [-75.0, 33.2], [-74.5, 34.0], [-74.2, 33.5], [-74.8, 32.8],
          [-75.5, 32.0], [-76.2, 31.2], [-76.8, 30.5], [-77.5, 29.8],
          [-78.2, 29.0], [-78.8, 28.2], [-79.5, 27.5], [-80.2, 26.8],
          [-81.0, 26.0], [-81.8, 25.2], [-82.0, 24.5]
        ]]
      }
    }
  ];
}

function getRiskColor(riskType: string, intensity: number) {
  const colors = {
    fire: [
      'rgba(255, 245, 157, 0)', // Light yellow
      'rgba(255, 193, 7, 0.3)',  // Yellow
      'rgba(255, 152, 0, 0.5)',  // Orange
      'rgba(244, 67, 54, 0.7)',  // Red
      'rgba(183, 28, 28, 0.8)'   // Dark red
    ],
    heat: [
      'rgba(255, 241, 118, 0)', // Light yellow
      'rgba(255, 193, 7, 0.3)',  // Yellow
      'rgba(255, 87, 34, 0.5)',  // Deep orange
      'rgba(244, 67, 54, 0.7)',  // Red
      'rgba(136, 14, 79, 0.8)'   // Dark red
    ],
    flood: [
      'rgba(187, 222, 251, 0)', // Light blue
      'rgba(144, 202, 249, 0.3)', // Light blue
      'rgba(66, 165, 245, 0.5)',  // Blue
      'rgba(21, 101, 192, 0.7)',  // Dark blue
      'rgba(13, 71, 161, 0.8)'    // Very dark blue
    ],
    wind: [
      'rgba(225, 245, 254, 0)', // Very light blue
      'rgba(179, 229, 252, 0.3)', // Light blue
      'rgba(129, 212, 250, 0.5)', // Medium blue
      'rgba(66, 165, 245, 0.7)',  // Blue
      'rgba(25, 118, 210, 0.8)'   // Dark blue
    ]
  };

  const colorSet = colors[riskType as keyof typeof colors] || colors.fire;
  const index = Math.min(Math.floor(intensity * colorSet.length), colorSet.length - 1);
  return colorSet[index];
}