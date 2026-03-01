import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Layers, Map, Mountain, Droplets, Flame, Wind, Thermometer, X,
  TrendingUp, DollarSign, Activity, Clock 
} from 'lucide-react';

interface MapOptionsProps {
  isVisible: boolean;
  mapStyle: 'satellite' | 'streets';
  onMapStyleChange: (style: 'satellite' | 'streets') => void;
  onClimateLayerChange: (layer: string | null) => void;
  activeClimateLayer: string | null;
  onMarketTrendLayerChange?: (layer: string | null) => void;
  activeMarketTrendLayer?: string | null;
  onClose?: () => void;
  onTerrainToggle?: (showTerrain: boolean) => void;
  terrainActive?: boolean;
}

const MapOptions: React.FC<MapOptionsProps> = ({
  isVisible,
  mapStyle,
  onMapStyleChange,
  onClimateLayerChange,
  activeClimateLayer,
  onMarketTrendLayerChange = () => {},
  activeMarketTrendLayer = null,
  onClose,
  onTerrainToggle = () => {},
  terrainActive = false
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node) && onClose) {
        onClose();
      }
    };
    
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);
  
  if (!isVisible) return null;

  return (
    <div ref={ref} className="absolute top-14 right-4 bg-white p-4 rounded-md shadow-lg z-50 w-72 border border-gray-200" style={{border: '2px solid #e5e7eb'}}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-semibold text-gray-900">Map Options</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 border border-gray-200"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        
        {/* Map Style Toggles */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Map Style</h4>
          <div className="flex gap-2">
            <Button
              variant={mapStyle === 'streets' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMapStyleChange('streets')}
              className="flex-1 flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <Map className="h-4 w-4 mr-1" />
              Standard
            </Button>
            <Button
              variant={mapStyle === 'satellite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMapStyleChange('satellite')}
              className="flex-1 flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <Layers className="h-4 w-4 mr-1" />
              Satellite
            </Button>
          </div>
        </div>
        
        {/* Climate Risk Layers */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Climate Risk Layers</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeClimateLayer === 'flood' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onClimateLayerChange(activeClimateLayer === 'flood' ? null : 'flood')}
              className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <Droplets className="h-4 w-4 mr-1" />
              Flood Risk
            </Button>
            <Button
              variant={activeClimateLayer === 'fire' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onClimateLayerChange(activeClimateLayer === 'fire' ? null : 'fire')}
              className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <Flame className="h-4 w-4 mr-1" />
              Fire Risk
            </Button>
            <Button
              variant={activeClimateLayer === 'wind' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onClimateLayerChange(activeClimateLayer === 'wind' ? null : 'wind')}
              className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <Wind className="h-4 w-4 mr-1" />
              Wind Risk
            </Button>
            <Button
              variant={activeClimateLayer === 'heat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onClimateLayerChange(activeClimateLayer === 'heat' ? null : 'heat')}
              className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <Thermometer className="h-4 w-4 mr-1" />
              Heat Risk
            </Button>
          </div>
        </div>
        
        {/* Market Trend Heatmap */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Market Trend Heatmap</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeMarketTrendLayer === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMarketTrendLayerChange(activeMarketTrendLayer === 'price' ? null : 'price')}
              className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Price Trends
            </Button>
            <Button
              variant={activeMarketTrendLayer === 'growth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMarketTrendLayerChange(activeMarketTrendLayer === 'growth' ? null : 'growth')}
              className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Growth Rate
            </Button>
            <Button
              variant={activeMarketTrendLayer === 'activity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMarketTrendLayerChange(activeMarketTrendLayer === 'activity' ? null : 'activity')}
              className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <Activity className="h-4 w-4 mr-1" />
              Sales Activity
            </Button>
            <Button
              variant={activeMarketTrendLayer === 'time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMarketTrendLayerChange(activeMarketTrendLayer === 'time' ? null : 'time')}
              className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
            >
              <Clock className="h-4 w-4 mr-1" />
              Time on Market
            </Button>
          </div>
        </div>
        
        {/* Terrain */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Terrain Features</h4>
          <Button
            variant={terrainActive ? "default" : "outline"}
            size="sm"
            onClick={() => onTerrainToggle(!terrainActive)}
            className="flex items-center justify-center text-xs h-9 font-medium border-gray-400 shadow-sm text-gray-800 bg-gray-50"
          >
            <Mountain className="h-4 w-4 mr-1" />
            {terrainActive ? "Hide Terrain" : "Show Terrain"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapOptions;