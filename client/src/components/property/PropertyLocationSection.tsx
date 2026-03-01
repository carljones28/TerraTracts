import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Plus, Minus, ExternalLink, CheckCircle2, Layers, Grid3X3, Eye, EyeOff, Map, Satellite, Mountain } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';

interface Tract {
  id: number;
  name: string;
  tractType?: string;
  acreage?: string | number;
  fillColor?: string;
  strokeColor?: string;
  fillOpacity?: string | number;
  boundaryGeoJson?: any;
  isCurrentTract?: boolean;
}

interface PropertyLocationSectionProps {
  latitude: string | number;
  longitude: string | number;
  state: string;
  roadAccess?: string;
  onViewFullMap?: () => void;
  boundary?: any;
  tracts?: Tract[];
  currentTractId?: number;
  propertyName?: string;
}

const TRACT_COLORS = [
  { fill: '#f59e0b', stroke: '#b45309', name: 'Amber' },
  { fill: '#06b6d4', stroke: '#0e7490', name: 'Cyan' },
  { fill: '#8b5cf6', stroke: '#6d28d9', name: 'Violet' },
  { fill: '#ec4899', stroke: '#be185d', name: 'Pink' },
  { fill: '#14b8a6', stroke: '#0d9488', name: 'Teal' },
  { fill: '#f97316', stroke: '#c2410c', name: 'Orange' },
  { fill: '#a855f7', stroke: '#7c3aed', name: 'Purple' },
  { fill: '#22d3ee', stroke: '#06b6d4', name: 'Sky' },
];

const CURRENT_TRACT_COLOR = { fill: '#10b981', stroke: '#059669', glow: '#34d399' };

const MAP_STYLES = {
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
  streets: 'mapbox://styles/mapbox/streets-v12'
};

const PropertyLocationSection: React.FC<PropertyLocationSectionProps> = ({
  latitude,
  longitude,
  state,
  roadAccess,
  onViewFullMap,
  boundary,
  tracts = [],
  currentTractId,
  propertyName
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'terrain' | 'streets'>('satellite');
  
  const hasMultipleTracts = tracts.length > 1;
  const hasBoundary = boundary || (tracts.length > 0 && tracts.some(t => t.boundaryGeoJson));
  
  const [showBoundary, setShowBoundary] = useState(false);
  const [showAllTracts, setShowAllTracts] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [hasAutoEnabled, setHasAutoEnabled] = useState(false);

  useEffect(() => {
    if (hasMultipleTracts && !hasAutoEnabled) {
      setShowBoundary(true);
      setShowAllTracts(true);
      setHasAutoEnabled(true);
    }
  }, [hasMultipleTracts, hasAutoEnabled]);

  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

  const hasValidCoordinates = !isNaN(lat) && !isNaN(lng) && 
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          if (config?.mapboxApiKey) {
            setMapToken(config.mapboxApiKey);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Mapbox config:', error);
      }
    };
    fetchToken();
  }, []);

  const formatCoordinate = (coord: number, isLat: boolean) => {
    const formatted = Math.abs(coord).toFixed(4);
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${formatted}° ${direction}`;
  };

  const getAccessStatus = (access: string | undefined) => {
    if (!access) return 'Good';
    const lower = access.toLowerCase();
    if (lower.includes('paved') || lower.includes('public') || lower.includes('highway')) {
      return 'Good';
    }
    if (lower.includes('gravel') || lower.includes('dirt') || lower.includes('private')) {
      return 'Fair';
    }
    if (lower.includes('none') || lower.includes('limited')) {
      return 'Limited';
    }
    return 'Good';
  };

  const accessStatus = getAccessStatus(roadAccess);

  const getTractCenter = useCallback((geoJson: any): [number, number] | null => {
    try {
      let geometry = geoJson;
      if (geoJson.type === 'Feature') {
        geometry = geoJson.geometry;
      }
      
      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0];
        let sumLng = 0, sumLat = 0;
        for (const coord of coords) {
          sumLng += coord[0];
          sumLat += coord[1];
        }
        return [sumLng / coords.length, sumLat / coords.length];
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates[0][0];
        let sumLng = 0, sumLat = 0;
        for (const coord of coords) {
          sumLng += coord[0];
          sumLat += coord[1];
        }
        return [sumLng / coords.length, sumLat / coords.length];
      }
    } catch (e) {
      console.error('Failed to calculate tract center:', e);
    }
    return null;
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !hasValidCoordinates || mapRef.current || !mapToken) return;

    mapboxgl.accessToken = mapToken;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLES[mapStyle],
        center: [lng, lat],
        zoom: hasMultipleTracts ? 13.5 : 14.5,
        attributionControl: false,
        interactive: true,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true,
        pitch: 0,
        bearing: 0
      });

      mapRef.current = map;

      map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'imperial' }), 'bottom-right');

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError(true);
      });

      map.on('load', () => {
        setMapLoaded(true);

        if (!hasMultipleTracts) {
          const markerEl = document.createElement('div');
          markerEl.innerHTML = `
            <div style="position: relative;">
              <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                border: 3px solid white;
              "></div>
              <div style="
                position: absolute;
                top: 6px;
                left: 6px;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 8px;
                  height: 8px;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  border-radius: 50%;
                "></div>
              </div>
            </div>
          `;
          markerEl.style.cssText = 'cursor: pointer;';

          new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .addTo(map);
        }
      });
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapError(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, hasValidCoordinates, mapToken, hasMultipleTracts]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    
    map.setStyle(MAP_STYLES[mapStyle]);
  }, [mapStyle, mapLoaded]);

  const staticMapUrl = hasValidCoordinates && mapToken
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-l+10b981(${lng},${lat})/${lng},${lat},14,0/600x350@2x?access_token=${mapToken}`
    : null;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const tractsToShow = showAllTracts ? tracts : tracts.slice(0, 1);

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const removeLayersAndSources = () => {
      ['property-boundary-fill', 'property-boundary-line', 'property-boundary-outline'].forEach(layerId => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource('property-boundary')) map.removeSource('property-boundary');

      tracts.forEach((_, index) => {
        [`tract-fill-${index}`, `tract-line-${index}`, `tract-outline-${index}`, `tract-glow-${index}`].forEach(layerId => {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });
        if (map.getSource(`tract-${index}`)) map.removeSource(`tract-${index}`);
      });
    };

    const drawBoundaries = () => {
      if (!showBoundary) return;

      if (boundary && !tracts.length) {
        try {
          const boundaryGeoJson = typeof boundary === 'string' ? JSON.parse(boundary) : boundary;
          
          map.addSource('property-boundary', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: boundaryGeoJson,
              properties: {}
            }
          });

          map.addLayer({
            id: 'property-boundary-fill',
            type: 'fill',
            source: 'property-boundary',
            paint: {
              'fill-color': CURRENT_TRACT_COLOR.fill,
              'fill-opacity': 0.15
            }
          });

          map.addLayer({
            id: 'property-boundary-outline',
            type: 'line',
            source: 'property-boundary',
            paint: {
              'line-color': '#ffffff',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          map.addLayer({
            id: 'property-boundary-line',
            type: 'line',
            source: 'property-boundary',
            paint: {
              'line-color': CURRENT_TRACT_COLOR.stroke,
              'line-width': 2.5
            }
          });
        } catch (err) {
          console.error('Failed to parse boundary:', err);
        }
      }

      tractsToShow.forEach((tract, index) => {
        if (!tract.boundaryGeoJson) return;

        try {
          const geoJson = tract.boundaryGeoJson as any;
          let geometry: any;
          
          if (geoJson.type === 'Feature') {
            geometry = geoJson.geometry;
          } else if (geoJson.type === 'Polygon' || geoJson.type === 'MultiPolygon') {
            geometry = geoJson;
          } else {
            return;
          }

          const isCurrentTract = tract.isCurrentTract || tract.id === currentTractId || index === 0;
          const colorSet = isCurrentTract ? CURRENT_TRACT_COLOR : TRACT_COLORS[index % TRACT_COLORS.length];
          
          map.addSource(`tract-${index}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: geometry,
              properties: { 
                name: tract.name, 
                type: tract.tractType,
                acreage: tract.acreage,
                isCurrentTract
              }
            }
          });

          map.addLayer({
            id: `tract-fill-${index}`,
            type: 'fill',
            source: `tract-${index}`,
            paint: {
              'fill-color': colorSet.fill,
              'fill-opacity': isCurrentTract ? 0.25 : 0.12
            }
          });

          if (isCurrentTract) {
            map.addLayer({
              id: `tract-glow-${index}`,
              type: 'line',
              source: `tract-${index}`,
              paint: {
                'line-color': '#ffffff',
                'line-width': 6,
                'line-blur': 3,
                'line-opacity': 0.9
              }
            });
          }

          map.addLayer({
            id: `tract-outline-${index}`,
            type: 'line',
            source: `tract-${index}`,
            paint: {
              'line-color': '#ffffff',
              'line-width': isCurrentTract ? 4 : 2,
              'line-opacity': isCurrentTract ? 1 : 0.7
            }
          });

          map.addLayer({
            id: `tract-line-${index}`,
            type: 'line',
            source: `tract-${index}`,
            paint: {
              'line-color': colorSet.stroke,
              'line-width': isCurrentTract ? 2.5 : 1.5
            }
          });

          if (showLabels) {
            const center = getTractCenter(geoJson);
            if (center) {
              const tractNumber = tract.name.replace(/[^0-9]/g, '') || String(index + 1);
              const acreage = tract.acreage ? parseFloat(String(tract.acreage)).toFixed(1) : null;
              
              const labelEl = document.createElement('div');
              labelEl.innerHTML = `
                <div class="tract-label-container" style="
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 2px;
                  cursor: pointer;
                  transition: transform 0.2s ease;
                ">
                  <div style="
                    background: ${isCurrentTract ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'};
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 16px;
                    box-shadow: ${isCurrentTract ? '0 0 20px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.4)'};
                    border: 3px solid white;
                    font-family: system-ui, -apple-system, sans-serif;
                  ">${tractNumber}</div>
                  ${acreage ? `
                    <div style="
                      background: rgba(255,255,255,0.95);
                      color: #1e293b;
                      padding: 2px 8px;
                      border-radius: 10px;
                      font-size: 11px;
                      font-weight: 600;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                      font-family: system-ui, -apple-system, sans-serif;
                      white-space: nowrap;
                    ">${acreage} ac</div>
                  ` : ''}
                </div>
              `;
              
              const marker = new mapboxgl.Marker({
                element: labelEl,
                anchor: 'center'
              })
                .setLngLat(center as [number, number])
                .addTo(map);
              
              markersRef.current.push(marker);
            }
          }
        } catch (err) {
          console.error(`Failed to draw tract ${tract.name}:`, err);
        }
      });

      if (hasMultipleTracts && tractsToShow.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        let hasValidBounds = false;
        
        tractsToShow.forEach(tract => {
          if (!tract.boundaryGeoJson) return;
          const center = getTractCenter(tract.boundaryGeoJson);
          if (center) {
            bounds.extend(center as [number, number]);
            hasValidBounds = true;
          }
        });
        
        if (hasValidBounds) {
          map.fitBounds(bounds, { 
            padding: 80,
            maxZoom: 15,
            duration: 800
          });
        }
      }
    };

    if (map.isStyleLoaded()) {
      removeLayersAndSources();
      drawBoundaries();
    } else {
      map.once('style.load', () => {
        removeLayersAndSources();
        drawBoundaries();
      });
    }
  }, [showBoundary, showAllTracts, showLabels, boundary, tracts, mapLoaded, currentTractId, hasMultipleTracts, getTractCenter, mapStyle]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn({ duration: 200 });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut({ duration: 200 });
    }
  };

  const handleViewOnMap = () => {
    if (onViewFullMap) {
      onViewFullMap();
    } else if (hasValidCoordinates) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  const stateAbbreviation = state?.length === 2 ? state.toUpperCase() : 
    state?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '--';

  const currentTract = tracts.find(t => t.isCurrentTract || t.id === currentTractId) || tracts[0];
  const totalAcreage = tracts.reduce((sum, t) => sum + (parseFloat(String(t.acreage || 0))), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Property Location</h3>
            {hasMultipleTracts && (
              <p className="text-sm text-gray-500 mt-1">
                {tracts.length} tracts · {totalAcreage.toFixed(1)} total acres
              </p>
            )}
          </div>
          <button
            onClick={handleViewOnMap}
            className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
          >
            Open in Maps
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="relative aspect-[16/10] w-full">
          {mapError && staticMapUrl ? (
            <img 
              src={staticMapUrl}
              alt="Property location map"
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              ref={mapContainerRef}
              className="w-full h-full bg-slate-100"
            />
          )}

          {!hasValidCoordinates && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Location not available</p>
              </div>
            </div>
          )}

          {hasValidCoordinates && (
            <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
              {!mapError && (
                <>
                  <button
                    onClick={handleZoomIn}
                    className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center hover:bg-white transition-all border border-gray-200/50"
                    aria-label="Zoom in"
                  >
                    <Plus className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center hover:bg-white transition-all border border-gray-200/50"
                    aria-label="Zoom out"
                  >
                    <Minus className="h-4 w-4 text-gray-700" />
                  </button>
                  <div className="h-2" />
                </>
              )}
              <div className="flex flex-col bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 overflow-hidden">
                <button
                  onClick={() => setMapStyle('satellite')}
                  className={`w-9 h-9 flex items-center justify-center transition-all ${mapStyle === 'satellite' ? 'bg-emerald-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  aria-label="Satellite view"
                  title="Satellite"
                >
                  <Satellite className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMapStyle('terrain')}
                  className={`w-9 h-9 flex items-center justify-center transition-all ${mapStyle === 'terrain' ? 'bg-emerald-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  aria-label="Terrain view"
                  title="Terrain"
                >
                  <Mountain className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMapStyle('streets')}
                  className={`w-9 h-9 flex items-center justify-center transition-all ${mapStyle === 'streets' ? 'bg-emerald-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  aria-label="Streets view"
                  title="Streets"
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {hasValidCoordinates && hasBoundary && (
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-10">
              <Button
                variant={showBoundary ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBoundary(!showBoundary)}
                className={showBoundary 
                  ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg border-0" 
                  : "bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-gray-200/50"
                }
              >
                <Layers className="h-4 w-4 mr-1.5" />
                {showBoundary ? 'Hide Boundary' : 'Show Boundary'}
              </Button>
              
              {hasMultipleTracts && showBoundary && (
                <>
                  <Button
                    variant={showAllTracts ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAllTracts(!showAllTracts)}
                    className={showAllTracts 
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg border-0" 
                      : "bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-gray-200/50"
                    }
                  >
                    <Grid3X3 className="h-4 w-4 mr-1.5" />
                    {showAllTracts ? 'This Tract Only' : `All ${tracts.length} Tracts`}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLabels(!showLabels)}
                    className={`bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-gray-200/50 ${!showLabels ? 'text-gray-400' : ''}`}
                    title={showLabels ? 'Hide labels' : 'Show labels'}
                  >
                    {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>
          )}

          {hasMultipleTracts && showBoundary && showAllTracts && (
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden min-w-[180px]">
              <div className="px-3 py-2 bg-slate-50 border-b border-gray-100">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tract Legend</div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-white shadow-md" 
                      style={{ background: `linear-gradient(135deg, ${CURRENT_TRACT_COLOR.fill} 0%, ${CURRENT_TRACT_COLOR.stroke} 100%)` }} 
                    />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">This Tract</span>
                    {currentTract?.acreage && (
                      <span className="text-xs text-slate-500 ml-1">({parseFloat(String(currentTract.acreage)).toFixed(1)} ac)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    {TRACT_COLORS.slice(0, 3).map((color, i) => (
                      <div 
                        key={i}
                        className="w-4 h-4 rounded-full border-2 border-white" 
                        style={{ background: color.fill, zIndex: 3 - i }} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">Other Tracts ({tracts.length - 1})</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">{stateAbbreviation}</span>
          </div>

          {hasValidCoordinates && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sm text-slate-600">
                {formatCoordinate(lat, true)}, {formatCoordinate(lng, false)}
              </span>
            </div>
          )}

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${
            accessStatus === 'Good' 
              ? 'bg-emerald-50 border-emerald-200' 
              : accessStatus === 'Fair'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
          }`}>
            <CheckCircle2 className={`h-3.5 w-3.5 ${
              accessStatus === 'Good' 
                ? 'text-emerald-500' 
                : accessStatus === 'Fair'
                ? 'text-amber-500'
                : 'text-slate-400'
            }`} />
            <span className={`text-sm font-medium ${
              accessStatus === 'Good' 
                ? 'text-emerald-700' 
                : accessStatus === 'Fair'
                ? 'text-amber-700'
                : 'text-slate-700'
            }`}>
              {roadAccess || 'Road Access'}
            </span>
          </div>

          {hasMultipleTracts && currentTract && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-700">
                Tract {currentTract.name?.replace(/[^0-9]/g, '') || '1'} of {tracts.length}
              </span>
              {currentTract.acreage && (
                <span className="text-sm text-emerald-600">
                  · {parseFloat(String(currentTract.acreage)).toFixed(1)} acres
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyLocationSection;
