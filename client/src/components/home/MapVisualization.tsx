import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'wouter';
import * as mapboxgl from 'mapbox-gl';
import { initMap, addPropertyMarkers } from '@/lib/mapUtils';

interface Property {
  id: number;
  title: string;
  price: string | number;
  acreage: string | number;
  location: string;
  latitude: string | number;
  longitude: string | number;
  propertyType: string;
  amenities?: string[];
  images?: string[];
  terrainType?: string;
  vegetation?: string;
  featured?: boolean;
}

interface MapVisualizationProps {
  properties: Property[];
  onMarkerClick: (propertyId: number) => void;
}

const MapVisualization = ({ properties, onMarkerClick }: MapVisualizationProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    if (!map.current) {
      map.current = initMap(mapContainer.current, handleMarkerClick);
      
      // Clean up on unmount
      return () => {
        map.current?.remove();
      };
    }
  }, []);
  
  useEffect(() => {
    if (!map.current) return;
    
    if (properties?.length > 0) {
      try {
        // Just add markers for properties - our custom implementation
        // handles the zoom/positioning
        addPropertyMarkers(map.current, properties, handleMarkerClick);
        console.log(`Added ${properties.length} markers to map`);
      } catch (error) {
        console.error('Error updating map markers:', error);
      }
    }
  }, [properties]);
  
  const handleMarkerClick = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
    }
    
    // Also call the passed onMarkerClick
    onMarkerClick(propertyId);
  };
  
  const handleViewDetails = () => {
    if (selectedProperty) {
      window.location.href = `/properties/${selectedProperty.id}`;
    }
  };
  
  const handle3DView = () => {
    if (selectedProperty) {
      // For now just show a popup when 3D view is clicked
      alert(`3D View for ${selectedProperty.title} will be implemented in the future.`);
    }
  };

  return (
    <div className="map-container bg-primary-light rounded-2xl border border-primary-lighter overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button className="bg-glass p-2 rounded-lg hover:bg-primary-lighter transition-colors">
          <i className="fas fa-expand text-white"></i>
        </button>
        <button className="bg-glass p-2 rounded-lg hover:bg-primary-lighter transition-colors">
          <i className="fas fa-layer-group text-white"></i>
        </button>
        <button className="bg-glass p-2 rounded-lg hover:bg-primary-lighter transition-colors">
          <i className="fas fa-compass text-white"></i>
        </button>
        <button className="bg-glass p-2 rounded-lg hover:bg-primary-lighter transition-colors">
          <i className="fas fa-globe text-white"></i>
        </button>
      </div>
      
      <div className="absolute bottom-4 left-4 z-10 bg-glass p-3 rounded-lg flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-secondary"></div>
          <span className="text-sm">For Sale</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-warning"></div>
          <span className="text-sm">Pending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-danger"></div>
          <span className="text-sm">Risk Zone</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 bg-glass p-2 rounded-full flex items-center space-x-2">
        <button className="h-8 w-8 flex items-center justify-center text-white">
          <i className="fas fa-minus"></i>
        </button>
        <button className="h-8 w-8 flex items-center justify-center text-white">
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <div ref={mapContainer} className="h-full w-full relative">
        {/* Mapbox GL will render here */}
      </div>
      
      {/* Selected Property Tooltip */}
      {selectedProperty && (
        <div className="absolute top-[40%] left-[40%] bg-glass rounded-xl p-4 shadow-card max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">{selectedProperty.title}</h3>
            <span className="text-secondary font-mono font-medium">
              ${typeof selectedProperty.price === 'string' 
                ? parseInt(selectedProperty.price).toLocaleString() 
                : selectedProperty.price.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-neutral-light mb-3">
            <span>
              {typeof selectedProperty.acreage === 'string' 
                ? parseFloat(selectedProperty.acreage).toFixed(1) 
                : selectedProperty.acreage.toFixed(1)} acres
            </span>
            <span className="h-1 w-1 rounded-full bg-neutral"></span>
            <span>{selectedProperty.location.split(',')[0]}</span>
          </div>
          <div className="flex space-x-2">
            <button 
              className="bg-secondary hover:bg-secondary-light text-xs rounded-full px-3 py-1 text-primary font-medium"
              onClick={handleViewDetails}
            >
              View Details
            </button>
            <button 
              className="bg-primary-lighter hover:bg-primary-light text-xs rounded-full px-3 py-1 text-white"
              onClick={handle3DView}
            >
              3D View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapVisualization;
