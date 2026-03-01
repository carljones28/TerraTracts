import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface SVGClimateOverlayProps {
  map: mapboxgl.Map | null;
  activeRiskTypes: { [key: string]: boolean };
  isMapReady: boolean;
}

export function SVGClimateOverlay({ map, activeRiskTypes, isMapReady }: SVGClimateOverlayProps) {
  const [overlayData, setOverlayData] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !isMapReady) return;

    const activeTypes = Object.keys(activeRiskTypes).filter(type => activeRiskTypes[type]);
    if (activeTypes.length === 0) {
      setOverlayData([]);
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

      const response = await fetch(`/api/climate-risk-polygons?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}&types=${types.join(',')}`);
      if (!response.ok) return;

      const data = await response.json();
      if (!data.features?.length) {
        setOverlayData([]);
        return;
      }

      // Convert to screen coordinates
      const screenFeatures = data.features.map((feature: any) => {
        if (!feature.geometry?.coordinates) return null;

        const coords = feature.geometry.coordinates;
        let screenPolygons: any[] = [];

        if (feature.geometry.type === 'Polygon') {
          screenPolygons = [convertRingToScreen(coords[0], mapInstance)];
        } else if (feature.geometry.type === 'MultiPolygon') {
          screenPolygons = coords.map((polygon: any) => 
            convertRingToScreen(polygon[0], mapInstance)
          );
        }

        return {
          polygons: screenPolygons,
          color: getColorForRisk(feature.properties.riskType),
          riskType: feature.properties.riskType
        };
      }).filter(Boolean);

      setOverlayData(screenFeatures);
      console.log(`SVG overlay updated: ${screenFeatures.length} polygons`);

    } catch (error) {
      console.error('SVG overlay error:', error);
    }
  };

  const convertRingToScreen = (ring: number[][], mapInstance: mapboxgl.Map): string => {
    const points = ring.map(coord => {
      const point = mapInstance.project([coord[0], coord[1]]);
      return `${point.x},${point.y}`;
    });
    return points.join(' ');
  };

  const getColorForRisk = (riskType: string): string => {
    switch (riskType) {
      case 'fire': return '#ff4444';
      case 'flood': return '#4444ff';
      case 'heat': return '#ff8844';
      case 'wind': return '#8844ff';
      default: return '#ff4444';
    }
  };

  if (!map || !isMapReady || overlayData.length === 0) return null;

  const container = map.getContainer();
  const { width, height } = container.getBoundingClientRect();

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        {overlayData.map((feature, index) =>
          feature.polygons.map((polygon: string, polyIndex: number) => (
            <polygon
              key={`${index}-${polyIndex}`}
              points={polygon}
              fill={feature.color}
              fillOpacity={0.6}
              stroke={feature.color}
              strokeWidth={1}
              strokeOpacity={0.8}
            />
          ))
        )}
      </svg>
    </div>
  );
}