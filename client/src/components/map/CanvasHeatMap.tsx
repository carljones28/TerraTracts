import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface HeatMapProps {
  map: mapboxgl.Map | null;
  isMapReady: boolean;
  activeRiskTypes: {
    fire: boolean;
    flood: boolean;
    heat: boolean;
    wind: boolean;
  };
}

export function CanvasHeatMap({ map, isMapReady, activeRiskTypes }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heatMapData, setHeatMapData] = useState<any[]>([]);

  useEffect(() => {
    if (!map || !isMapReady) return;

    const updateHeatMap = () => {
      generateHeatMapData();
    };

    map.on('move', updateHeatMap);
    map.on('zoom', updateHeatMap);
    updateHeatMap();

    return () => {
      map.off('move', updateHeatMap);
      map.off('zoom', updateHeatMap);
    };
  }, [map, isMapReady, activeRiskTypes]);

  useEffect(() => {
    if (heatMapData.length > 0) {
      renderHeatMap();
    }
  }, [heatMapData]);

  const generateHeatMapData = () => {
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    // USA bounds check
    const usaBounds = {
      north: 49.0,
      south: 24.5,
      east: -66.0,
      west: -125.0
    };

    const viewIntersectsUSA = !(
      bounds.getNorth() < usaBounds.south ||
      bounds.getSouth() > usaBounds.north ||
      bounds.getEast() < usaBounds.west ||
      bounds.getWest() > usaBounds.east
    );

    if (!viewIntersectsUSA) {
      setHeatMapData([]);
      return;
    }

    const heatSources = {
      fire: [
        // Western US comprehensive coverage like Zillow
        { lat: 42.0, lng: -124.0, intensity: 0.6, radius: 400 }, // Oregon Coast
        { lat: 41.0, lng: -122.0, intensity: 0.8, radius: 350 }, // Northern CA
        { lat: 39.0, lng: -121.0, intensity: 0.9, radius: 380 }, // Sacramento Valley
        { lat: 37.7, lng: -122.4, intensity: 0.85, radius: 320 }, // Bay Area
        { lat: 36.0, lng: -119.0, intensity: 0.95, radius: 450 }, // Central Valley
        { lat: 34.0, lng: -118.0, intensity: 0.9, radius: 380 }, // Los Angeles
        { lat: 32.7, lng: -117.0, intensity: 0.7, radius: 280 }, // San Diego
        { lat: 45.5, lng: -121.0, intensity: 0.7, radius: 350 }, // Portland area
        { lat: 47.6, lng: -122.0, intensity: 0.6, radius: 300 }, // Seattle area
        { lat: 39.0, lng: -114.0, intensity: 0.75, radius: 320 }, // Nevada
        { lat: 37.0, lng: -109.0, intensity: 0.7, radius: 350 }, // Utah
        { lat: 35.0, lng: -106.0, intensity: 0.8, radius: 380 }, // New Mexico
        { lat: 39.7, lng: -105.0, intensity: 0.6, radius: 300 }, // Colorado
        { lat: 44.0, lng: -110.0, intensity: 0.65, radius: 320 }, // Wyoming
        { lat: 46.9, lng: -114.0, intensity: 0.7, radius: 350 }, // Montana
        { lat: 43.5, lng: -116.0, intensity: 0.75, radius: 330 }, // Idaho
      ],
      heat: [
        // Southwest heat belt comprehensive coverage
        { lat: 33.4, lng: -112.1, intensity: 0.95, radius: 400 }, // Phoenix
        { lat: 31.8, lng: -106.4, intensity: 0.9, radius: 350 }, // El Paso
        { lat: 32.8, lng: -96.8, intensity: 0.85, radius: 320 }, // Dallas
        { lat: 29.4, lng: -98.5, intensity: 0.9, radius: 350 }, // San Antonio
        { lat: 29.8, lng: -95.4, intensity: 0.8, radius: 300 }, // Houston
        { lat: 35.2, lng: -101.8, intensity: 0.85, radius: 320 }, // Amarillo
        { lat: 32.2, lng: -110.9, intensity: 0.9, radius: 350 }, // Tucson
        { lat: 36.1, lng: -115.1, intensity: 0.95, radius: 380 }, // Las Vegas
        { lat: 34.7, lng: -92.3, intensity: 0.8, radius: 300 }, // Little Rock
        { lat: 35.8, lng: -78.6, intensity: 0.75, radius: 280 }, // Raleigh
        { lat: 33.8, lng: -84.4, intensity: 0.8, radius: 300 }, // Atlanta
      ],
      flood: [
        // Coastal and river comprehensive coverage
        { lat: 25.8, lng: -80.2, intensity: 0.85, radius: 250 }, // Miami
        { lat: 28.5, lng: -81.4, intensity: 0.8, radius: 280 }, // Orlando
        { lat: 29.8, lng: -95.3, intensity: 0.9, radius: 300 }, // Houston
        { lat: 30.0, lng: -90.1, intensity: 0.95, radius: 250 }, // New Orleans
        { lat: 38.9, lng: -77.0, intensity: 0.7, radius: 200 }, // Washington DC
        { lat: 40.7, lng: -74.0, intensity: 0.75, radius: 220 }, // New York
        { lat: 39.9, lng: -75.1, intensity: 0.7, radius: 200 }, // Philadelphia
        { lat: 42.4, lng: -71.1, intensity: 0.65, radius: 180 }, // Boston
        { lat: 32.1, lng: -81.1, intensity: 0.8, radius: 200 }, // Savannah
        { lat: 35.2, lng: -75.5, intensity: 0.75, radius: 220 }, // Outer Banks
      ],
      wind: [
        // Tornado Alley and hurricane zones comprehensive coverage
        { lat: 35.2, lng: -97.4, intensity: 0.85, radius: 350 }, // Oklahoma City
        { lat: 39.1, lng: -94.6, intensity: 0.8, radius: 320 }, // Kansas City
        { lat: 32.8, lng: -97.3, intensity: 0.75, radius: 300 }, // Fort Worth
        { lat: 36.1, lng: -95.9, intensity: 0.7, radius: 280 }, // Tulsa
        { lat: 41.6, lng: -93.6, intensity: 0.7, radius: 300 }, // Des Moines
        { lat: 40.8, lng: -96.7, intensity: 0.75, radius: 320 }, // Lincoln
        { lat: 39.7, lng: -86.1, intensity: 0.7, radius: 280 }, // Indianapolis
        { lat: 38.2, lng: -92.4, intensity: 0.75, radius: 300 }, // Missouri
        { lat: 29.8, lng: -95.4, intensity: 0.8, radius: 250 }, // Houston (hurricane)
        { lat: 25.8, lng: -80.2, intensity: 0.85, radius: 220 }, // Miami (hurricane)
      ]
    };

    const activeTypes = Object.keys(activeRiskTypes).filter(
      key => activeRiskTypes[key as keyof typeof activeRiskTypes]
    );

    const allSources: any[] = [];
    activeTypes.forEach(type => {
      const sources = heatSources[type as keyof typeof heatSources] || [];
      sources.forEach(source => {
        allSources.push({
          ...source,
          type,
          color: getColorForRisk(type)
        });
      });
    });

    setHeatMapData(allSources);
  };

  const getColorForRisk = (riskType: string): string => {
    switch (riskType) {
      case 'fire': return '#8B2635';
      case 'flood': return '#1E6091';
      case 'heat': return '#B91C1C';
      case 'wind': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const renderHeatMap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const container = canvas.parentElement;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create data points grid for smooth interpolation
    const bounds = map.getBounds();
    if (!bounds) return;

    const gridResolution = 40; // Higher resolution for smoother gradients
    const dataGrid: number[][] = [];
    
    // Initialize grid
    for (let i = 0; i <= gridResolution; i++) {
      dataGrid[i] = [];
      for (let j = 0; j <= gridResolution; j++) {
        dataGrid[i][j] = 0;
      }
    }

    // Calculate intensity for each grid point based on heat sources
    for (let i = 0; i <= gridResolution; i++) {
      for (let j = 0; j <= gridResolution; j++) {
        const lat = bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) * (i / gridResolution);
        const lng = bounds.getWest() + (bounds.getEast() - bounds.getWest()) * (j / gridResolution);
        
        let totalIntensity = 0;
        
        heatMapData.forEach(source => {
          const distance = Math.sqrt(
            Math.pow((lat - source.lat) * 69, 2) + // Convert to miles
            Math.pow((lng - source.lng) * 54.6, 2)
          );
          
          const maxDistance = source.radius;
          if (distance < maxDistance) {
            const falloff = Math.max(0, 1 - (distance / maxDistance));
            const localIntensity = source.intensity * Math.pow(falloff, 0.7);
            totalIntensity = Math.max(totalIntensity, localIntensity);
          }
        });
        
        dataGrid[i][j] = totalIntensity;
      }
    }

    // Render smooth interpolated heat map
    const cellWidth = canvas.width / gridResolution;
    const cellHeight = canvas.height / gridResolution;

    for (let i = 0; i < gridResolution; i++) {
      for (let j = 0; j < gridResolution; j++) {
        const intensity = dataGrid[i][j];
        if (intensity > 0.1) {
          // Get color from first active heat source
          const color = heatMapData.length > 0 ? heatMapData[0].color : '#FF6B35';
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          // Create gradient for each cell
          const gradient = ctx.createLinearGradient(
            j * cellWidth, i * cellHeight,
            (j + 1) * cellWidth, (i + 1) * cellHeight
          );
          
          const opacity = intensity * 0.7;
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${opacity * 0.8})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    // Apply smoothing filter for seamless blending
    ctx.filter = 'blur(3px)';
    ctx.globalCompositeOperation = 'source-over';
  };

  if (!map || !isMapReady) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}