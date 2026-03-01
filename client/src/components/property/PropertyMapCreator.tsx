import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import LandMap from '../map/LandMap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, Info, MapPin, Edit } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import Map, { Marker } from 'react-map-gl';
import * as turf from '@turf/turf';

interface PropertyMapCreatorProps {
  initialCoordinates?: any;
  initialBoundary?: any;
  initialLatitude?: string | null;
  initialLongitude?: string | null;
  onCoordinatesChange: (coordinates: any) => void;
  onLatLongChange: (lat: string, lng: string) => void;
  onBoundaryChange: (boundary: any) => void;
  className?: string;
}

// Map mode types
type MapMode = 'simple' | 'complex';

export default function PropertyMapCreator({
  initialCoordinates,
  initialBoundary,
  initialLatitude,
  initialLongitude,
  onCoordinatesChange,
  onLatLongChange,
  onBoundaryChange,
  className = ''
}: PropertyMapCreatorProps) {
  const { toast } = useToast();
  const [mapMode, setMapMode] = useState<MapMode>('simple');
  const [localBoundary, setLocalBoundary] = useState<any>(null);
  const [markerPosition, setMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  // Get Mapbox API key from config endpoint
  const { data: config } = useQuery<{ mapboxApiKey: string }>({
    queryKey: ['/api/config'],
    staleTime: Infinity,
  });
  
  const mapboxToken = config?.mapboxApiKey || import.meta.env.VITE_MAPBOX_API_KEY || '';
  
  // Initialize marker position from initial values
  useEffect(() => {
    // Only try to use values if both are present and valid
    const lat = initialLatitude ? parseFloat(initialLatitude) : NaN;
    const lng = initialLongitude ? parseFloat(initialLongitude) : NaN;
    
    if (!isNaN(lat) && !isNaN(lng)) {
      console.log('Setting initial marker position:', { lat, lng });
      setMarkerPosition({
        latitude: lat,
        longitude: lng
      });
    } else if (initialLatitude || initialLongitude) {
      // Log warning if one value is set but invalid
      console.warn('Invalid initial coordinates:', { 
        initialLatitude, 
        initialLongitude,
        parsedLat: lat,
        parsedLng: lng
      });
    }
  }, [initialLatitude, initialLongitude]);
  
  // Initialize boundary from initial values
  useEffect(() => {
    try {
      // Log all initial values for debugging
      console.log('PropertyMapCreator initializing with:', {
        initialBoundary: initialBoundary ? typeof initialBoundary : 'null/undefined',
        initialCoordinates: initialCoordinates ? typeof initialCoordinates : 'null/undefined',
        initialLatitude, 
        initialLongitude
      });
      
      // Check boundary first (most specific)
      if (initialBoundary && initialBoundary !== null) {
        console.log('Setting initial boundary:', initialBoundary);
        setLocalBoundary(initialBoundary);
        setMapMode('complex');
      } 
      // Then check coordinates
      else if (initialCoordinates && initialCoordinates !== null) {
        console.log('Setting initial coordinates:', initialCoordinates);
        setLocalBoundary(initialCoordinates);
        setMapMode('complex');
      } 
      // If only lat/lng are provided, use simple mode
      else if (initialLatitude && initialLongitude) {
        const lat = parseFloat(initialLatitude);
        const lng = parseFloat(initialLongitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log('Setting map mode to simple with valid lat/lng:', lat, lng);
          
          // Create a point feature for consistency
          const point = turf.point([lng, lat]);
          onCoordinatesChange(point);
          
          setMapMode('simple');
        } else {
          console.warn('Invalid lat/lng values, defaulting to simple mode', { initialLatitude, initialLongitude });
          setMapMode('simple');
        }
      } 
      // Default to simple mode
      else {
        console.log('No initial boundary or coordinates detected, using simple mode');
        setMapMode('simple');
      }
    } catch (error) {
      console.error('Error setting initial boundary:', error);
      setMapMode('simple'); // Default to simple mode on error
    }
  }, [initialBoundary, initialCoordinates, initialLatitude, initialLongitude, onCoordinatesChange]);
  
  // Handler for single marker placement in simple mode
  const handleMarkerPlacement = (event: any) => {
    if (mapMode !== 'simple') return;
    
    try {
      // Extract coordinates from the click event
      const lng = event.lngLat.lng;
      const lat = event.lngLat.lat;
      
      // Validate coordinates are within valid ranges
      const validLat = Math.min(Math.max(lat, -90), 90);
      const validLng = Math.min(Math.max(lng, -180), 180);
      
      // Check if coordinates needed adjustment
      if (validLat !== lat || validLng !== lng) {
        console.warn('Invalid coordinates were adjusted:', { 
          original: { lat, lng }, 
          adjusted: { lat: validLat, lng: validLng } 
        });
        
        toast({
          title: "Coordinates Adjusted",
          description: "Some coordinates were outside valid ranges and have been adjusted."
        });
      }
      
      const newPosition = {
        longitude: validLng,
        latitude: validLat
      };
      
      setMarkerPosition(newPosition);
      onLatLongChange(
        validLat.toString(),
        validLng.toString()
      );
      
      // Also create a simple point feature for consistency
      const point = turf.point([validLng, validLat]);
      onCoordinatesChange(point);
    } catch (error) {
      console.error('Error handling marker placement:', error);
      toast({
        title: "Error",
        description: "Failed to place marker. Please try again or enter coordinates manually.",
        variant: "destructive"
      });
    }
  };
  
  // Handler for boundary changes in complex mode
  const handleBoundaryChange = (newBoundary: any) => {
    console.log('PropertyMapCreator received boundary change:', 
      newBoundary ? 
        `boundary with type: ${newBoundary?.geometry?.type}` : 
        'null boundary (clear)'
    );
    
    // When boundary is null, it was explicitly cleared
    if (newBoundary === null) {
      console.log('Clearing boundary in PropertyMapCreator');
      
      // Clear the local boundary
      setLocalBoundary(null);
      
      // Propagate to parent component - important to update both!
      onBoundaryChange(null);
      onCoordinatesChange(null);
      
      // Provide user feedback
      toast({
        title: "Boundary Cleared",
        description: "The property boundary has been removed. You can draw a new one.",
        variant: "default",
      });
      
      // Don't modify the lat/long or marker position - keep the current point
      return;
    }
    
    // Validate the boundary has a proper geometry
    if (!newBoundary || !newBoundary.geometry) {
      console.error('Invalid boundary received (missing geometry):', newBoundary);
      toast({
        title: "Invalid Boundary",
        description: "The boundary is missing geometry data.",
        variant: "destructive",
      });
      return;
    }
    
    // Store the boundary locally
    setLocalBoundary(newBoundary);
    
    // Propagate to parent component - ensure BOTH are updated
    onBoundaryChange(newBoundary);
    onCoordinatesChange(newBoundary);
    
    // Extract center coordinates for lat/long fields
    try {
      const center = turf.center(newBoundary);
      if (center && center.geometry && center.geometry.coordinates) {
        const [lng, lat] = center.geometry.coordinates;
        
        // Validate coordinates are within bounds
        const validLat = Math.min(Math.max(lat, -90), 90);
        const validLng = Math.min(Math.max(lng, -180), 180);
        
        // Update the marker position with validated coordinates
        setMarkerPosition({
          latitude: validLat,
          longitude: validLng
        });
        
        // Update latitude/longitude fields
        onLatLongChange(validLat.toString(), validLng.toString());
      }
    } catch (e) {
      console.error("Failed to calculate center:", e);
    }
  };
  
  // Handler for map mode change
  const handleMapModeChange = (newMode: MapMode) => {
    // If we're already in this mode, no need to do anything
    if (newMode === mapMode) {
      return;
    }
    
    // Clear existing data when switching modes
    if (newMode === 'simple') {
      // When switching to simple mode, use the center of the boundary if it exists
      if (localBoundary) {
        try {
          const center = turf.center(localBoundary);
          
          if (center && center.geometry && center.geometry.coordinates) {
            const [lng, lat] = center.geometry.coordinates;
            
            // Validate coordinates
            if (!isNaN(lng) && !isNaN(lat)) {
              // Set marker position from boundary center
              const newPosition = { latitude: lat, longitude: lng };
              setMarkerPosition(newPosition);
              
              // Update lat/long fields
              onLatLongChange(lat.toString(), lng.toString());
              
              // Create a point feature for consistency
              const point = turf.point([lng, lat]);
              onCoordinatesChange(point);
            }
          }
        } catch (e) {
          // If we can't get center from boundary, keep current marker position
          if (markerPosition) {
            // Ensure point is updated
            const point = turf.point([markerPosition.longitude, markerPosition.latitude]);
            onCoordinatesChange(point);
          }
        }
      } else if (markerPosition) {
        // If no boundary but we have a marker, make sure to update coordinates
        const point = turf.point([markerPosition.longitude, markerPosition.latitude]);
        onCoordinatesChange(point);
      }
    } else if (newMode === 'complex') {
      // Switching to complex mode
      
      // Use marker position to create initial boundary if possible
      if (markerPosition) {
        const lng = markerPosition.longitude;
        const lat = markerPosition.latitude;
        
        if (!isNaN(lng) && !isNaN(lat)) {
          // Start with a small square boundary (easier to see and edit)
          // Create square with sides of roughly 100 meters
          const size = 0.0005; // roughly 50m in each direction at equator
          const coords = [
            [lng - size, lat - size], // bottom left
            [lng + size, lat - size], // bottom right
            [lng + size, lat + size], // top right
            [lng - size, lat + size], // top left
            [lng - size, lat - size]  // back to start (closing the polygon)
          ];
          
          try {
            const newBoundary = turf.polygon([coords]);
            
            // Set the boundary and update both boundary and coordinates
            setLocalBoundary(newBoundary);
            onBoundaryChange(newBoundary);
            onCoordinatesChange(newBoundary);
          } catch (error) {
            // Fallback to circle if polygon creation fails
            try {
              const smallPolygon = turf.circle([lng, lat], 0.05, { steps: 8, units: 'kilometers' });
              setLocalBoundary(smallPolygon);
              onBoundaryChange(smallPolygon);
              onCoordinatesChange(smallPolygon);
            } catch (circleError) {
              console.error('Failed to create initial boundary:', circleError);
            }
          }
        }
      }
    }
    
    // Set the mode 
    setMapMode(newMode);
  };
  
  // Manual input handlers for simple mode
  const handleLatitudeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store the input value in the state
    const inputValue = e.target.value;
    const lat = parseFloat(inputValue);
    
    if (!isNaN(lat)) {
      // Validate latitude is within valid range (-90 to 90)
      const validLat = Math.min(Math.max(lat, -90), 90);
      
      if (validLat !== lat) {
        // If value was invalid, show toast warning
        toast({
          title: "Invalid Latitude",
          description: "Latitude must be between -90 and 90 degrees. Value has been adjusted."
        });
      }
      
      // Make sure we have a valid longitude to pair with it
      const lng = markerPosition?.longitude || 0;
      
      const newPosition = { 
        longitude: lng,
        latitude: validLat
      };
      
      setMarkerPosition(newPosition);
      onLatLongChange(validLat.toString(), lng.toString());
      
      // Update point feature
      if (mapMode === 'simple') {
        try {
          const point = turf.point([lng, validLat]);
          onCoordinatesChange(point);
        } catch (error) {
          console.error("Error creating point from coordinates:", error);
        }
      }
    } else if (inputValue === '') {
      // Handle empty input - only clear the latitude
      if (markerPosition) {
        const longitude = markerPosition.longitude;
        onLatLongChange('', longitude.toString());
      } else {
        onLatLongChange('', '');
      }
    }
  };
  
  const handleLongitudeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store the input value in the state
    const inputValue = e.target.value;
    const lng = parseFloat(inputValue);
    
    if (!isNaN(lng)) {
      // Validate longitude is within valid range (-180 to 180)
      const validLng = Math.min(Math.max(lng, -180), 180);
      
      if (validLng !== lng) {
        // If value was invalid, show toast warning
        toast({
          title: "Invalid Longitude",
          description: "Longitude must be between -180 and 180 degrees. Value has been adjusted.",
          variant: "default"
        });
      }
      
      // Make sure we have a valid latitude to pair with it
      const lat = markerPosition?.latitude || 0;
      
      // Also ensure latitude is valid (in case it wasn't validated earlier)
      const validLat = Math.min(Math.max(lat, -90), 90);
      
      const newPosition = { 
        latitude: validLat,
        longitude: validLng
      };
      
      setMarkerPosition(newPosition);
      onLatLongChange(validLat.toString(), validLng.toString());
      
      // Update point feature
      if (mapMode === 'simple') {
        try {
          const point = turf.point([validLng, validLat]);
          onCoordinatesChange(point);
        } catch (error) {
          console.error("Error creating point from coordinates:", error);
        }
      }
    } else if (inputValue === '') {
      // Handle empty input - only clear the longitude
      if (markerPosition) {
        const latitude = markerPosition.latitude;
        onLatLongChange(latitude.toString(), '');
      } else {
        onLatLongChange('', '');
      }
    }
  };
  
  if (!mapboxToken) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Mapbox API key is missing. Please configure your Mapbox API key to use the map creator.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>Property Location</CardTitle>
        <CardDescription>
          Define your property location using a simple pin or a complex boundary
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="simple-mode"
                checked={mapMode === 'simple'}
                onChange={(e) => {
                  e.preventDefault(); // Prevent form submission
                  e.stopPropagation(); // Stop event propagation
                  handleMapModeChange('simple');
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="simple-mode" className="cursor-pointer flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Simple Location (Pin)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="complex-mode"
                checked={mapMode === 'complex'}
                onChange={(e) => {
                  e.preventDefault(); // Prevent form submission
                  e.stopPropagation(); // Stop event propagation
                  handleMapModeChange('complex');
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="complex-mode" className="cursor-pointer flex items-center">
                <Edit className="w-4 h-4 mr-1" />
                Complex Boundary (Shape)
              </Label>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          {mapMode === 'simple' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    placeholder="e.g. 40.7128"
                    value={markerPosition?.latitude || ''}
                    onChange={(e) => {
                      e.stopPropagation(); // Stop event propagation
                      handleLatitudeInput(e);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission on Enter key
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    placeholder="e.g. -74.0060"
                    value={markerPosition?.longitude || ''}
                    onChange={(e) => {
                      e.stopPropagation(); // Stop event propagation
                      handleLongitudeInput(e);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission on Enter key
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="h-[400px] relative bg-gray-50 rounded-md overflow-hidden">
                <Map
                  initialViewState={{
                    longitude: (markerPosition?.longitude && !isNaN(markerPosition.longitude)) 
                              ? markerPosition.longitude 
                              : -98.5795,
                    latitude: (markerPosition?.latitude && !isNaN(markerPosition.latitude)) 
                             ? markerPosition.latitude 
                             : 39.8283,
                    zoom: (markerPosition && !isNaN(markerPosition.latitude) && !isNaN(markerPosition.longitude)) 
                         ? 10 
                         : 3
                  }}
                  mapStyle="mapbox://styles/mapbox/satellite-streets-v11"
                  mapboxAccessToken={mapboxToken}
                  onClick={handleMarkerPlacement}
                >
                  {markerPosition && !isNaN(markerPosition.latitude) && !isNaN(markerPosition.longitude) && (
                    <Marker
                      longitude={markerPosition.longitude}
                      latitude={markerPosition.latitude}
                      draggable
                      onDragEnd={(e) => {
                        handleMarkerPlacement(e);
                      }}
                    />
                  )}
                </Map>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                  <span>
                    Click on the map to place the property location pin, or enter coordinates manually.
                    The pin can be dragged to adjust its position.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-[450px] relative bg-gray-50 rounded-md overflow-hidden">
                <LandMap
                  coordinates={localBoundary}
                  initialViewState={
                    markerPosition && !isNaN(markerPosition.latitude) && !isNaN(markerPosition.longitude)
                    ? {
                        longitude: markerPosition.longitude,
                        latitude: markerPosition.latitude,
                        zoom: 14
                      }
                    : {
                        longitude: -98.5795,
                        latitude: 39.8283,
                        zoom: 3
                      }
                  }
                  mapboxAccessToken={mapboxToken}
                  onBoundaryChange={handleBoundaryChange}
                  readOnly={false}
                  startDrawing={true} // Auto-start drawing mode when rendered
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                  <span>
                    Define the property boundary by:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Using the <Badge variant="outline">Draw</Badge> tool to click and create vertices</li>
                      <li>Using the <Badge variant="outline">Coords</Badge> tool to enter coordinates manually</li>
                      <li>Using the <Badge variant="outline">Edit</Badge> tool to adjust an existing boundary</li>
                    </ul>
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}