import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface DirectClimateOverlayProps {
  map: mapboxgl.Map | null;
  activeRiskTypes: { [key: string]: boolean };
  isMapReady: boolean;
}

interface ClimateFeature {
  lat: number;
  lng: number;
  latEnd?: number;
  lngEnd?: number;
  color: string;
  riskType: string;
  intensity?: number;
  isArea?: boolean;
}

export function DirectClimateOverlay({ map, activeRiskTypes, isMapReady }: DirectClimateOverlayProps) {
  const [climateData, setClimateData] = useState<ClimateFeature[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !isMapReady) return;

    const activeTypes = Object.keys(activeRiskTypes).filter(type => activeRiskTypes[type]);
    if (activeTypes.length === 0) {
      setClimateData([]);
      return;
    }

    loadClimateData(map, activeTypes);

    const updateHandler = () => loadClimateData(map, activeTypes);
    map.on('moveend', updateHandler);
    map.on('zoomend', updateHandler);

    return () => {
      map.off('moveend', updateHandler);
      map.off('zoomend', updateHandler);
    };

  }, [map, activeRiskTypes, isMapReady]);

  const loadClimateData = async (mapInstance: mapboxgl.Map, types: string[]) => {
    try {
      const bounds = mapInstance.getBounds();
      if (!bounds) return;

      // Only show climate data for USA continental bounds
      const usaBounds = {
        north: 49.0,
        south: 24.5,
        east: -66.0,
        west: -125.0
      };

      // Check if current view intersects with USA
      const viewIntersectsUSA = !(
        bounds.getNorth() < usaBounds.south ||
        bounds.getSouth() > usaBounds.north ||
        bounds.getEast() < usaBounds.west ||
        bounds.getWest() > usaBounds.east
      );

      if (!viewIntersectsUSA) {
        setClimateData([]);
        console.log('Climate data only available for USA');
        return;
      }

      // Get intersection of view and USA bounds
      const effectiveBounds = {
        north: Math.min(bounds.getNorth(), usaBounds.north),
        south: Math.max(bounds.getSouth(), usaBounds.south),
        east: Math.min(bounds.getEast(), usaBounds.east),
        west: Math.max(bounds.getWest(), usaBounds.west)
      };

      // Create clean Zillow-style regional heat map
      const climateZones: ClimateFeature[] = [];
      const zoom = mapInstance.getZoom();
      const gridSize = zoom > 10 ? 35 : zoom > 8 ? 28 : zoom > 6 ? 22 : 18;
      
      // Define clean regional patterns like Zillow
      const riskRegions = {
        fire: [
          { bounds: { n: 42, s: 32, e: -114, w: -125 }, intensity: 0.8 }, // California
          { bounds: { n: 39, s: 35, e: -116, w: -122 }, intensity: 0.9 }, // Central CA
          { bounds: { n: 35, s: 33, e: -116, w: -120 }, intensity: 0.85 } // Southern CA
        ],
        heat: [
          { bounds: { n: 35, s: 31, e: -109, w: -115 }, intensity: 0.9 }, // Arizona
          { bounds: { n: 33, s: 29, e: -103, w: -107 }, intensity: 0.85 }, // West Texas
          { bounds: { n: 36, s: 32, e: -94, w: -100 }, intensity: 0.8 } // Central Texas
        ],
        flood: [
          { bounds: { n: 27, s: 24, e: -79, w: -82 }, intensity: 0.8 }, // South Florida
          { bounds: { n: 31, s: 28, e: -93, w: -96 }, intensity: 0.85 }, // Houston area
          { bounds: { n: 31, s: 29, e: -88, w: -91 }, intensity: 0.9 } // New Orleans
        ],
        wind: [
          { bounds: { n: 37, s: 33, e: -95, w: -99 }, intensity: 0.8 }, // Oklahoma
          { bounds: { n: 40, s: 37, e: -92, w: -96 }, intensity: 0.75 } // Kansas
        ]
      };

      types.forEach(riskType => {
        const regions = riskRegions[riskType as keyof typeof riskRegions] || [];
        
        regions.forEach(region => {
          // Check if region intersects with current view
          if (region.bounds.s <= effectiveBounds.north && region.bounds.n >= effectiveBounds.south &&
              region.bounds.w <= effectiveBounds.east && region.bounds.e >= effectiveBounds.west) {
            
            // Create clean grid within region bounds
            const regionLatSpan = Math.min(region.bounds.n, effectiveBounds.north) - 
                                Math.max(region.bounds.s, effectiveBounds.south);
            const regionLngSpan = Math.min(region.bounds.e, effectiveBounds.east) - 
                                Math.max(region.bounds.w, effectiveBounds.west);
            
            const latStep = regionLatSpan / gridSize;
            const lngStep = regionLngSpan / gridSize;
            
            for (let i = 0; i <= gridSize; i++) {
              for (let j = 0; j <= gridSize; j++) {
                const lat = Math.max(region.bounds.s, effectiveBounds.south) + (i * latStep);
                const lng = Math.max(region.bounds.w, effectiveBounds.west) + (j * lngStep);
                
                // Calculate distance from region center for natural falloff
                const centerLat = (region.bounds.n + region.bounds.s) / 2;
                const centerLng = (region.bounds.e + region.bounds.w) / 2;
                const distanceFromCenter = Math.sqrt(
                  Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
                );
                
                const maxDistance = Math.sqrt(
                  Math.pow(region.bounds.n - region.bounds.s, 2) + 
                  Math.pow(region.bounds.e - region.bounds.w, 2)
                ) / 2;
                
                const falloff = Math.max(0.2, 1 - (distanceFromCenter / maxDistance));
                const intensity = region.intensity * falloff;
                
                if (intensity > 0.3) {
                  climateZones.push({
                    lat,
                    lng,
                    latEnd: lat + latStep,
                    lngEnd: lng + lngStep,
                    color: getColorForRisk(riskType),
                    riskType,
                    intensity,
                    isArea: true
                  });
                }
              }
            }
          }
        });
      });

      setClimateData(climateZones);
      console.log(`Natural climate zones created: ${climateZones.length} zones for USA regions`);

    } catch (error) {
      console.error('Climate zone error:', error);
    }
  };

  const getColorForRisk = (riskType: string): string => {
    // Exact Zillow color schemes from screenshots
    switch (riskType) {
      case 'fire': return '#8B2635'; // Deep red-brown for wildfire
      case 'flood': return '#1E6091'; // Deep blue for flooding  
      case 'heat': return '#B91C1C'; // Intense red for max temperature
      case 'wind': return '#DC2626'; // Red for wind speed
      case 'air': return '#7C3AED'; // Purple for air quality
      default: return '#6B7280';
    }
  };

  if (!map || !isMapReady || climateData.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {climateData.slice(0, 500).map((cell, index) => {
        if (cell.isArea && cell.latEnd && cell.lngEnd) {
          // Render clean regional grid cells
          const topLeft = map.project([cell.lng, cell.latEnd]);
          const bottomRight = map.project([cell.lngEnd, cell.lat]);
          
          const width = bottomRight.x - topLeft.x;
          const height = bottomRight.y - topLeft.y;
          
          // Skip cells that are too small
          if (width < 2 || height < 2) return null;
          
          const intensity = cell.intensity || 0.5;
          const opacity = Math.max(0.3, Math.min(0.8, intensity));
          
          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: topLeft.x,
                top: topLeft.y,
                width: width,
                height: height,
                backgroundColor: cell.color,
                opacity: opacity,
                pointerEvents: 'none',
                mixBlendMode: 'normal',
                borderRadius: '2px'
              }}
            />
          );
        }
        return null;
      }).filter(Boolean)}
    </div>
  );
}