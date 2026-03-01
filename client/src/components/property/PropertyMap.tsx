import React, { useEffect, useRef, useState } from 'react';
import { initMap } from '@/lib/mapUtils';
import { MapPin, AlertCircle, Info, X } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';

interface PropertyMapProps {
  coordinates: [number, number] | undefined;
  title: string;
  staticMapUrl?: string;
  staticMapCaption?: string;
  onViewFullMap?: () => void;
  isFullscreen?: boolean;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ 
  coordinates, 
  title,
  staticMapUrl,
  staticMapCaption = "Boundary reference only. Verify details with agent.",
  onViewFullMap,
  isFullscreen = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [fullscreenStatic, setFullscreenStatic] = useState(false);
  const [fullscreenMap, setFullscreenMap] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || !coordinates) return;

    // Reset error state on new render attempt
    setMapError(null);

    // Validate coordinates before attempting to use them
    if (!Array.isArray(coordinates) || coordinates.length !== 2 || 
        typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number' ||
        isNaN(coordinates[0]) || isNaN(coordinates[1])) {
      console.error('Invalid coordinates format:', coordinates);
      setMapError('Invalid location data');
      return;
    }

    // Initialize map with a timeout to ensure container is fully rendered
    const timer = setTimeout(async () => {
      if (!mapContainerRef.current) return;

      try {
        // Set up proper error handling for potential Promise rejections
        try {
          // Initialize the map
          const map = await initMap(mapContainerRef.current).catch(err => {
            console.error('Map initialization promise rejected:', err);
            setMapError('Failed to initialize map');
            return null;
          });
          
          if (!map) {
            setMapError('Could not load map');
            return;
          }
          
          mapRef.current = map;
          
          // Make sure we have valid coordinates before proceeding
          // Parse coordinates and handle possible lat/lng confusion
          let lat = parseFloat(coordinates[0].toString());
          let lng = parseFloat(coordinates[1].toString());
          
          // If coordinates appear to be in wrong order, swap them
          // MapBox expects [longitude, latitude] for setCenter
          // But our coordinates might be [latitude, longitude]
          if ((Math.abs(lat) > 90 || Math.abs(lng) < 10) && 
              (Math.abs(coordinates[1]) <= 90 && Math.abs(coordinates[0]) <= 180)) {
            console.log('Coordinates appear to be in wrong order, swapping...');
            const temp = lat;
            lat = lng;
            lng = temp;
          }
          
          if (isNaN(lat) || isNaN(lng) || 
              Math.abs(lat) > 90 || 
              Math.abs(lng) > 180) {
            console.error('Invalid coordinate values after parsing:', { lat, lng });
            setMapError('Invalid location coordinates');
            return;
          }
          
          console.log('Final coordinates for map (lat, lng):', { lat, lng });
          
          // In Mapbox, coordinates need to be in [longitude, latitude] order
          // This is different from the [latitude, longitude] order used in many other APIs
          console.log('Setting map coordinates with lng first, lat second');
          
          // Safe coordinates for setting center and marker - in MapBox format [lng, lat]
          const safeCoordinates: [number, number] = [
            // MapBox expects [longitude, latitude] order
            Math.max(-180, Math.min(180, lng)), // longitude (x-coordinate)
            Math.max(-90, Math.min(90, lat))    // latitude (y-coordinate)
          ];
          
          // Wait for map to load
          map.once('load', () => {
            try {
              console.log('Map loaded, using coordinates:', { lat, lng });
              
              // Create a debug message to verify the coordinate format is correct
              console.log('Setting map center to:', safeCoordinates);
              
              try {
                // Center the map on the property coordinates
                map.setCenter(safeCoordinates);
                map.setZoom(13); // Good zoom level for property details
              } catch (err) {
                console.error('Error setting map center:', err);
                // Try alternative format as fallback
                const alternateCoords = [safeCoordinates[1], safeCoordinates[0]];
                console.log('Trying alternate coordinate format:', alternateCoords);
                map.setCenter(alternateCoords as [number, number]);
              }
              
              try {
                // Add a marker for the property
                new mapboxgl.Marker({ color: '#6C27FF' })
                  .setLngLat(safeCoordinates)
                  .setPopup(new mapboxgl.Popup().setHTML(`<h3>${title}</h3>`))
                  .addTo(map);
              } catch (markerErr) {
                console.error('Error adding marker:', markerErr);
              }
            } catch (error) {
              console.error('Error configuring property map:', error);
              setMapError('Error setting up map display');
            }
          });
          
          // Set up error handling for map load failures
          map.on('error', (e) => {
            console.error('Mapbox error:', e);
            setMapError('Map failed to load correctly');
          });
        } catch (initError) {
          console.error('Map initialization error:', initError);
          setMapError('Error loading map component');
        }
      } catch (outerError) {
        console.error('Unexpected map error:', outerError);
        setMapError('Unexpected error loading map');
      }
    }, 300); // Increased timeout for better stability

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapRef.current = null;
      }
    };
  }, [coordinates, title]);
  
  // Effect to handle fullscreen map initialization  
  useEffect(() => {
    if (!fullscreenMap || !coordinates) return;
    
    let fsMap: mapboxgl.Map | null = null;
    let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

    // Use a small timeout to ensure DOM is ready
    const timeout = setTimeout(() => {
      const fullscreenMapContainer = document.getElementById('fullscreen-map');
      if (!fullscreenMapContainer) return;
      
      // Create a function to initialize the fullscreen map
      const initFullscreenMap = async () => {
        try {
          // Parse coordinates
          let lat = parseFloat(coordinates[0].toString());
          let lng = parseFloat(coordinates[1].toString());
          
          // Check if coordinates might be in wrong order
          if ((Math.abs(lat) > 90 || Math.abs(lng) < 10) && 
             (Math.abs(coordinates[1]) <= 90 && Math.abs(coordinates[0]) <= 180)) {
            const temp = lat;
            lat = lng;
            lng = temp;
          }
          
          // Safe coordinates for setting center and marker
          const safeCoordinates: [number, number] = [
            Math.max(-180, Math.min(180, lng)), // longitude
            Math.max(-90, Math.min(90, lat))    // latitude
          ];
          
          // Initialize the map with HTMLDivElement casting
          fsMap = await initMap(fullscreenMapContainer as HTMLDivElement);
          
          if (fsMap) {
            fsMap.once('load', () => {
              if (!fsMap) return;
              
              // Center the map on the property coordinates
              fsMap.setCenter(safeCoordinates);
              fsMap.setZoom(15); // Higher zoom level for fullscreen
              
              // Add a marker for the property
              new mapboxgl.Marker({ color: '#6C27FF' })
                .setLngLat(safeCoordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<h3>${title}</h3>`))
                .addTo(fsMap);
                
              // Add navigation controls
              fsMap.addControl(new mapboxgl.NavigationControl(), 'top-left');
              
              // Add fullscreen control
              fsMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
            });
          }
        } catch (error) {
          console.error('Error initializing fullscreen map:', error);
        }
      };
      
      // Call the initialization function
      initFullscreenMap();
    }, 200);
    
    cleanupTimeout = timeout;
    
    // Cleanup function
    return () => {
      if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
      }
      if (fsMap) {
        fsMap.remove();
      }
    };
  }, [fullscreenMap, coordinates, title]);

  const handleStaticMapClick = () => {
    setFullscreenStatic(true);
  };
  
  const handleFullscreenMapClick = () => {
    setFullscreenMap(true);
  };

  // If no coordinates or there's an error, show placeholder
  if (!coordinates || mapError) {
    return (
      <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-400 text-center">
          {mapError ? (
            <>
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p>{mapError}</p>
              <p className="text-sm mt-1">Please try refreshing the page</p>
            </>
          ) : (
            <>
              <MapPin className="h-6 w-6 mx-auto mb-2" />
              <p>Location information unavailable</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // If isFullscreen is true, render a map that fills the entire container
  if (isFullscreen) {
    return (
      <div className="absolute inset-0 z-10 w-full h-full">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0 
          }} 
        />
      </div>
    );
  }

  // Otherwise render the normal map with optional static map
  return (
    <>
      <div className="space-y-4">
        {/* Live interactive map */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Property Location</h3>
          <div className="w-full h-[300px] rounded-lg overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
        </div>
        
        {/* Optional static map */}
        {staticMapUrl && (
          <div>
            <div className="flex items-center mb-3">
              <h3 className="text-lg font-medium text-gray-900 mr-1">Property Boundaries</h3>
              <span className="inline-flex items-center text-xs text-gray-500">
                <Info className="h-3 w-3 mr-1" />
                Reference only
              </span>
            </div>
            <div 
              className="w-full rounded-lg overflow-hidden relative cursor-pointer"
              onClick={handleStaticMapClick}
            >
              <img 
                src={staticMapUrl} 
                alt="Property boundary map" 
                className="w-full h-auto object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                {staticMapCaption}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen static map modal */}
      {fullscreenStatic && staticMapUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setFullscreenStatic(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreenStatic(false)}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
          >
            <AlertCircle className="h-5 w-5" />
          </Button>
          
          <div className="max-w-4xl w-full px-4">
            <img
              src={staticMapUrl}
              alt="Property boundary map"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <p className="text-white text-center mt-4 bg-black bg-opacity-50 p-2 rounded">
              {staticMapCaption}
            </p>
          </div>
        </div>
      )}
      
      {/* Fullscreen live map modal */}
      {fullscreenMap && coordinates && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreenMap(false)}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white hover:bg-opacity-70 z-10"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="w-full h-full px-4 py-8 flex flex-col">
            <h2 className="text-white text-xl font-bold mb-4 text-center">{title}</h2>
            <div className="w-full h-full rounded-lg overflow-hidden flex-1 relative">
              <div className="absolute inset-0" id="fullscreen-map"></div>
            </div>
            <p className="text-white text-center mt-4 bg-black bg-opacity-50 p-2 rounded">
              Property location - Coordinates: {coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyMap;