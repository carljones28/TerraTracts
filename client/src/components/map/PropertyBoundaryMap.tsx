import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { 
  PenTool, 
  Trash2, 
  Save, 
  Layers, 
  Plus,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import type { LandTract } from '@shared/schema';
import * as turf from '@turf/turf';

interface PropertyBoundaryMapProps {
  propertyId: number;
  center: [number, number];
  zoom?: number;
  isEditable?: boolean;
  onTractSelect?: (tract: LandTract | null) => void;
  className?: string;
}

const TRACT_COLORS: Record<string, { fill: string; stroke: string }> = {
  primary: { fill: '#3b82f6', stroke: '#1d4ed8' },
  subdivision: { fill: '#22c55e', stroke: '#16a34a' },
  easement: { fill: '#f59e0b', stroke: '#d97706' },
  buildable: { fill: '#10b981', stroke: '#059669' },
  restricted: { fill: '#ef4444', stroke: '#dc2626' },
  wetland: { fill: '#06b6d4', stroke: '#0891b2' },
  timber: { fill: '#65a30d', stroke: '#4d7c0f' },
  pasture: { fill: '#84cc16', stroke: '#65a30d' },
  cropland: { fill: '#fbbf24', stroke: '#f59e0b' },
  custom: { fill: '#8b5cf6', stroke: '#7c3aed' },
};

export default function PropertyBoundaryMap({
  propertyId,
  center,
  zoom = 15,
  isEditable = false,
  onTractSelect,
  className = ''
}: PropertyBoundaryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [selectedTractId, setSelectedTractId] = useState<number | null>(null);
  const [showAllTracts, setShowAllTracts] = useState(true);
  const [pendingTract, setPendingTract] = useState<GeoJSON.Feature | null>(null);

  const { data: tracts = [], isLoading } = useQuery<LandTract[]>({
    queryKey: ['/api/properties', propertyId, 'tracts'],
    enabled: !!propertyId,
  });

  const createTractMutation = useMutation({
    mutationFn: async (tractData: Partial<LandTract>) => {
      return apiRequest('POST', `/api/properties/${propertyId}/tracts`, tractData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId, 'tracts'] });
      setPendingTract(null);
    },
  });

  const updateTractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LandTract> }) => {
      return apiRequest('PUT', `/api/tracts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId, 'tracts'] });
    },
  });

  const deleteTractMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/tracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId, 'tracts'] });
      setSelectedTractId(null);
    },
  });

  const calculateAcreage = useCallback((geometry: GeoJSON.Geometry): number => {
    try {
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        const area = turf.area(geometry);
        return Math.round((area / 4046.86) * 100) / 100;
      }
    } catch (error) {
      console.error('Error calculating acreage:', error);
    }
    return 0;
  }, []);

  const getCentroid = useCallback((geometry: GeoJSON.Geometry): [number, number] | null => {
    try {
      const centroid = turf.centroid(geometry as any);
      return centroid.geometry.coordinates as [number, number];
    } catch (error) {
      console.error('Error calculating centroid:', error);
    }
    return null;
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      console.error('Mapbox access token not found');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 200 }), 'bottom-left');

    if (isEditable) {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        defaultMode: 'simple_select',
        styles: [
          {
            id: 'gl-draw-polygon-fill',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon']],
            paint: {
              'fill-color': '#3b82f6',
              'fill-opacity': 0.3,
            },
          },
          {
            id: 'gl-draw-polygon-stroke',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon']],
            paint: {
              'line-color': '#1d4ed8',
              'line-width': 2,
            },
          },
          {
            id: 'gl-draw-polygon-and-line-vertex-active',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
            paint: {
              'circle-radius': 6,
              'circle-color': '#fff',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#3b82f6',
            },
          },
          {
            id: 'gl-draw-polygon-midpoint',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
            paint: {
              'circle-radius': 4,
              'circle-color': '#3b82f6',
            },
          },
        ],
      });
      map.current.addControl(draw.current);
    }

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [center, zoom, isEditable]);

  useEffect(() => {
    if (!map.current || !isMapLoaded || !showAllTracts) return;

    const sourceId = 'tracts-source';
    const fillLayerId = 'tracts-fill';
    const strokeLayerId = 'tracts-stroke';

    if (map.current.getLayer(fillLayerId)) map.current.removeLayer(fillLayerId);
    if (map.current.getLayer(strokeLayerId)) map.current.removeLayer(strokeLayerId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

    const features: GeoJSON.Feature[] = tracts
      .filter(tract => tract.boundaryGeoJson && tract.isActive)
      .map(tract => ({
        type: 'Feature' as const,
        id: tract.id,
        properties: {
          id: tract.id,
          name: tract.name,
          tractType: tract.tractType,
          acreage: tract.acreage,
          fillColor: tract.fillColor || TRACT_COLORS[tract.tractType]?.fill || '#3b82f6',
          strokeColor: tract.strokeColor || TRACT_COLORS[tract.tractType]?.stroke || '#1d4ed8',
          fillOpacity: Number(tract.fillOpacity) || 0.3,
          selected: tract.id === selectedTractId,
        },
        geometry: tract.boundaryGeoJson as GeoJSON.Geometry,
      }));

    if (features.length === 0) return;

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    map.current.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': ['get', 'fillColor'],
        'fill-opacity': [
          'case',
          ['get', 'selected'],
          0.5,
          ['get', 'fillOpacity'],
        ],
      },
    });

    map.current.addLayer({
      id: strokeLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': ['get', 'strokeColor'],
        'line-width': [
          'case',
          ['get', 'selected'],
          4,
          2,
        ],
      },
    });

    map.current.on('click', fillLayerId, (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const tractId = feature.properties?.id;
        setSelectedTractId(tractId);
        const tract = tracts.find(t => t.id === tractId);
        onTractSelect?.(tract || null);
      }
    });

    map.current.on('mouseenter', fillLayerId, () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', fillLayerId, () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

  }, [tracts, isMapLoaded, selectedTractId, showAllTracts, onTractSelect]);

  useEffect(() => {
    if (!draw.current || !isMapLoaded) return;

    const handleCreate = (e: { features: GeoJSON.Feature[] }) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        setPendingTract(feature);
        setIsDrawMode(false);
      }
    };

    const handleUpdate = (e: { features: GeoJSON.Feature[] }) => {
      if (e.features.length > 0 && selectedTractId) {
        const feature = e.features[0];
        const geometry = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        const centroid = getCentroid(geometry);
        const acreage = calculateAcreage(geometry);

        updateTractMutation.mutate({
          id: selectedTractId,
          data: {
            boundaryGeoJson: geometry,
            centroidLat: centroid ? String(centroid[1]) : undefined,
            centroidLng: centroid ? String(centroid[0]) : undefined,
            acreage: String(acreage),
          },
        });
      }
    };

    map.current?.on('draw.create', handleCreate);
    map.current?.on('draw.update', handleUpdate);

    return () => {
      map.current?.off('draw.create', handleCreate);
      map.current?.off('draw.update', handleUpdate);
    };
  }, [isMapLoaded, selectedTractId, calculateAcreage, getCentroid, updateTractMutation]);

  const startDrawing = () => {
    if (draw.current) {
      draw.current.changeMode('draw_polygon');
      setIsDrawMode(true);
    }
  };

  const cancelDrawing = () => {
    if (draw.current) {
      draw.current.deleteAll();
      draw.current.changeMode('simple_select');
      setIsDrawMode(false);
      setPendingTract(null);
    }
  };

  const savePendingTract = (name: string, tractType: string) => {
    if (!pendingTract) return;

    const geometry = pendingTract.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const centroid = getCentroid(geometry);
    const acreage = calculateAcreage(geometry);
    const colors = TRACT_COLORS[tractType] || TRACT_COLORS.custom;

    createTractMutation.mutate({
      name,
      tractType: tractType as any,
      boundaryGeoJson: geometry,
      centroidLat: centroid ? String(centroid[1]) : undefined,
      centroidLng: centroid ? String(centroid[0]) : undefined,
      acreage: String(acreage),
      fillColor: colors.fill,
      strokeColor: colors.stroke,
      fillOpacity: '0.3',
    });

    if (draw.current) {
      draw.current.deleteAll();
      draw.current.changeMode('simple_select');
    }
  };

  const deleteSelectedTract = () => {
    if (selectedTractId) {
      deleteTractMutation.mutate(selectedTractId);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} data-testid="map-loading">
        <div className="animate-pulse text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
        data-testid="property-boundary-map"
      />

      {isEditable && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {!isDrawMode && !pendingTract && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={startDrawing}
                className="shadow-lg"
                data-testid="button-draw-tract"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Draw Tract
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAllTracts(!showAllTracts)}
                className="shadow-lg bg-white"
                data-testid="button-toggle-tracts"
              >
                {showAllTracts ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {showAllTracts ? 'Hide Tracts' : 'Show Tracts'}
              </Button>
            </>
          )}

          {isDrawMode && (
            <Button
              size="sm"
              variant="destructive"
              onClick={cancelDrawing}
              className="shadow-lg"
              data-testid="button-cancel-draw"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      )}

      {pendingTract && (
        <TractSaveDialog
          onSave={savePendingTract}
          onCancel={cancelDrawing}
          acreage={calculateAcreage(pendingTract.geometry)}
        />
      )}

      {selectedTractId && isEditable && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
          <div className="text-sm font-medium mb-2">
            Selected: {tracts.find(t => t.id === selectedTractId)?.name}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedTractId(null);
                onTractSelect?.(null);
              }}
              data-testid="button-deselect-tract"
            >
              Deselect
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={deleteSelectedTract}
              data-testid="button-delete-tract"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {tracts.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-[200px]">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Tracts ({tracts.length})
          </div>
          <div className="space-y-1 max-h-[150px] overflow-y-auto">
            {tracts.filter(t => t.isActive).map(tract => (
              <div
                key={tract.id}
                className={`text-xs p-1 rounded cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${
                  selectedTractId === tract.id ? 'bg-blue-50 ring-1 ring-blue-300' : ''
                }`}
                onClick={() => {
                  setSelectedTractId(tract.id);
                  onTractSelect?.(tract);
                }}
                data-testid={`tract-item-${tract.id}`}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: tract.fillColor || TRACT_COLORS[tract.tractType]?.fill }}
                />
                <span className="truncate flex-1">{tract.name}</span>
                <span className="text-gray-400">{tract.acreage}ac</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TractSaveDialogProps {
  onSave: (name: string, tractType: string) => void;
  onCancel: () => void;
  acreage: number;
}

function TractSaveDialog({ onSave, onCancel, acreage }: TractSaveDialogProps) {
  const [name, setName] = useState('');
  const [tractType, setTractType] = useState('primary');

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white rounded-lg shadow-xl p-4 w-80">
      <h3 className="font-semibold text-lg mb-3">Save New Tract</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., North Pasture"
            className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="input-tract-name"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Type</label>
          <select
            value={tractType}
            onChange={(e) => setTractType(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="select-tract-type"
          >
            <option value="primary">Primary Tract</option>
            <option value="subdivision">Subdivision</option>
            <option value="easement">Easement</option>
            <option value="buildable">Buildable Area</option>
            <option value="restricted">Restricted Area</option>
            <option value="wetland">Wetland</option>
            <option value="timber">Timber</option>
            <option value="pasture">Pasture</option>
            <option value="cropland">Cropland</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="bg-gray-50 p-2 rounded text-sm">
          <span className="text-gray-500">Calculated Area:</span>
          <span className="ml-2 font-medium">{acreage} acres</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-testid="button-cancel-save-tract"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => onSave(name || 'Unnamed Tract', tractType)}
            disabled={!name.trim()}
            data-testid="button-save-tract"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
