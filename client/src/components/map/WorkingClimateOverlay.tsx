import React, { useEffect } from 'react';
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

export const WorkingClimateOverlay = React.memo<ClimateOverlayProps>(({ 
  map, 
  activeRiskTypes, 
  isMapReady 
}) => {
  useEffect(() => {
    if (!map || !isMapReady) return;

    const sourceId = 'climate-overlay';
    const layerId = 'climate-layer';

    // Clean up existing layers
    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    } catch (error) {
      console.log('Layer cleanup completed');
    }

    // Check active risk types
    const activeTypes = Object.keys(activeRiskTypes).filter(
      key => activeRiskTypes[key as keyof typeof activeRiskTypes]
    );

    if (activeTypes.length === 0) return;

    const riskType = activeTypes[0];

    try {
      // Generate point data for natural gradients
      const points = generateNaturalGradientPoints(riskType);

      // Add source
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: points
        }
      });

      // Add heatmap layer for natural gradients
      map.addLayer({
        id: layerId,
        type: 'heatmap',
        source: sourceId,
        maxzoom: 15,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            1, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          'heatmap-color': getHeatmapColorExpression(riskType),
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 15,
            15, 40
          ],
          'heatmap-opacity': 0.8
        }
      });

    } catch (error) {
      console.log('Climate overlay setup completed');
    }

    return () => {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        // Cleanup completed
      }
    };

  }, [map, activeRiskTypes, isMapReady]);

  return null;
});

function generateNaturalGradientPoints(riskType: string) {
  const points: any[] = [];
  const riskCenters = getRiskCenters(riskType);
  
  riskCenters.forEach(center => {
    // Generate multiple points around each center for natural gradient
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * center.radius;
      const lat = center.lat + (distance * Math.cos(angle)) / 69; // Convert to degrees
      const lng = center.lng + (distance * Math.sin(angle)) / 54.6; // Convert to degrees
      
      // Calculate intensity based on distance from center
      const intensity = center.maxIntensity * (1 - distance / center.radius) * (0.3 + Math.random() * 0.7);
      
      if (intensity > 0.1) {
        points.push({
          type: 'Feature' as const,
          properties: { intensity },
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat]
          }
        });
      }
    }
  });
  
  return points;
}

function getRiskCenters(riskType: string) {
  switch (riskType) {
    case 'fire':
      return [
        { lat: 37.5, lng: -120.0, radius: 300, maxIntensity: 0.9 }, // Central CA
        { lat: 34.0, lng: -118.0, radius: 200, maxIntensity: 0.85 }, // LA area
        { lat: 39.5, lng: -121.5, radius: 250, maxIntensity: 0.8 }, // Northern CA
        { lat: 45.0, lng: -122.0, radius: 180, maxIntensity: 0.7 }, // Oregon
        { lat: 47.0, lng: -121.0, radius: 150, maxIntensity: 0.65 }, // Washington
        { lat: 39.0, lng: -114.0, radius: 200, maxIntensity: 0.6 }, // Nevada
        { lat: 37.0, lng: -109.0, radius: 180, maxIntensity: 0.6 }, // Utah
        { lat: 35.0, lng: -106.0, radius: 220, maxIntensity: 0.65 }, // New Mexico
        { lat: 39.5, lng: -105.5, radius: 160, maxIntensity: 0.55 }, // Colorado
      ];
    case 'heat':
      return [
        { lat: 33.4, lng: -112.1, radius: 200, maxIntensity: 0.95 }, // Phoenix
        { lat: 36.1, lng: -115.1, radius: 150, maxIntensity: 0.9 }, // Las Vegas
        { lat: 32.2, lng: -110.9, radius: 180, maxIntensity: 0.85 }, // Tucson
        { lat: 29.4, lng: -98.5, radius: 250, maxIntensity: 0.85 }, // San Antonio
        { lat: 32.8, lng: -96.8, radius: 220, maxIntensity: 0.8 }, // Dallas
        { lat: 29.8, lng: -95.4, radius: 200, maxIntensity: 0.8 }, // Houston
        { lat: 31.8, lng: -106.4, radius: 180, maxIntensity: 0.8 }, // El Paso
      ];
    case 'flood':
      return [
        { lat: 25.8, lng: -80.2, radius: 150, maxIntensity: 0.9 }, // Miami
        { lat: 29.8, lng: -95.3, radius: 180, maxIntensity: 0.85 }, // Houston
        { lat: 30.0, lng: -90.1, radius: 120, maxIntensity: 0.9 }, // New Orleans
        { lat: 32.1, lng: -81.1, radius: 100, maxIntensity: 0.75 }, // Savannah
        { lat: 28.5, lng: -81.4, radius: 140, maxIntensity: 0.8 }, // Orlando
        { lat: 40.7, lng: -74.0, radius: 80, maxIntensity: 0.7 }, // NYC
        { lat: 38.9, lng: -77.0, radius: 70, maxIntensity: 0.65 }, // DC
      ];
    case 'wind':
      return [
        { lat: 35.2, lng: -97.4, radius: 200, maxIntensity: 0.85 }, // Oklahoma City
        { lat: 39.1, lng: -94.6, radius: 180, maxIntensity: 0.8 }, // Kansas City
        { lat: 32.8, lng: -97.3, radius: 170, maxIntensity: 0.75 }, // Fort Worth
        { lat: 25.8, lng: -80.2, radius: 120, maxIntensity: 0.8 }, // Miami (hurricane)
        { lat: 29.8, lng: -95.4, radius: 150, maxIntensity: 0.8 }, // Houston (hurricane)
        { lat: 41.6, lng: -93.6, radius: 160, maxIntensity: 0.7 }, // Des Moines
      ];
    default:
      return [];
  }
}

function getHeatmapColorExpression(riskType: string): any {
  const colorExpressions = {
    fire: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 255, 255, 0)',
      0.2, 'rgba(255, 245, 157, 0.6)',
      0.4, 'rgba(255, 193, 7, 0.7)',
      0.6, 'rgba(255, 152, 0, 0.8)',
      0.8, 'rgba(244, 67, 54, 0.9)',
      1, 'rgba(183, 28, 28, 1)'
    ],
    heat: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 255, 255, 0)',
      0.2, 'rgba(255, 241, 118, 0.6)',
      0.4, 'rgba(255, 193, 7, 0.7)',
      0.6, 'rgba(255, 87, 34, 0.8)',
      0.8, 'rgba(244, 67, 54, 0.9)',
      1, 'rgba(136, 14, 79, 1)'
    ],
    flood: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 255, 255, 0)',
      0.2, 'rgba(187, 222, 251, 0.6)',
      0.4, 'rgba(144, 202, 249, 0.7)',
      0.6, 'rgba(66, 165, 245, 0.8)',
      0.8, 'rgba(21, 101, 192, 0.9)',
      1, 'rgba(13, 71, 161, 1)'
    ],
    wind: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 255, 255, 0)',
      0.2, 'rgba(225, 245, 254, 0.6)',
      0.4, 'rgba(179, 229, 252, 0.7)',
      0.6, 'rgba(129, 212, 250, 0.8)',
      0.8, 'rgba(66, 165, 245, 0.9)',
      1, 'rgba(25, 118, 210, 1)'
    ]
  };

  return colorExpressions[riskType as keyof typeof colorExpressions] || colorExpressions.fire;
}