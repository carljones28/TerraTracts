import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl, Marker, Popup } from 'react-map-gl';
import * as turf from '@turf/turf';
import { parseCoordinates, calculateAreaAndPerimeter, getCenter, getBounds } from '@/utils/coordinateParser';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MapPin, Layers, Maximize, Download, Ruler, Move, Square, Trash2, Check, AlertCircle, Save } from "lucide-react";

// Type definitions
interface LandMapProps {
  coordinates?: any; // Can be string, array, or GeoJSON
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  mapboxAccessToken: string;
  onBoundaryChange?: (geojson: GeoJSON.Feature | null) => void;
  readOnly?: boolean;
  mapStyle?: string;
  startDrawing?: boolean; // Automatically start in drawing mode
}

// Default mapbox style URLs for different views
const MAP_STYLES = {
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  STREETS: 'mapbox://styles/mapbox/streets-v11',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v11',
  TOPO: 'mapbox://styles/mapbox/light-v10',
  HYBRID: 'mapbox://styles/mapbox/satellite-streets-v11'
};

// Layer styles
const BOUNDARY_LAYER_STYLE = {
  id: 'boundary-layer',
  type: 'fill' as const,
  paint: {
    'fill-color': '#ff9800',
    'fill-opacity': 0.3
  }
};

const BOUNDARY_OUTLINE_STYLE = {
  id: 'boundary-outline',
  type: 'line' as const,
  paint: {
    'line-color': '#ff7800',
    'line-width': 2
  }
};

const VERTEX_LAYER_STYLE = {
  id: 'vertex-layer',
  type: 'circle' as const,
  paint: {
    'circle-radius': 5,
    'circle-color': '#ff7800',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff'
  }
};

export default function LandMap({
  coordinates,
  initialViewState,
  mapboxAccessToken,
  onBoundaryChange,
  readOnly = false,
  mapStyle = MAP_STYLES.HYBRID,
  startDrawing = false
}: LandMapProps) {
  // Get toast for notifications
  const { toast } = useToast();
  
  // States
  const [viewState, setViewState] = useState(initialViewState);
  const [boundary, setBoundary] = useState<GeoJSON.Feature | null>(null);
  // Initialize drawing mode if startDrawing is true
  const [drawMode, setDrawMode] = useState<'view' | 'draw' | 'edit'>(startDrawing ? 'draw' : 'view');
  const [activeMapStyle, setActiveMapStyle] = useState(mapStyle);
  const [coordinateInput, setCoordinateInput] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<{
    acres: number;
    sqft: number;
    perimeter: { feet: number; miles: number };
  } | null>(null);

  const mapRef = useRef<any>(null);
  const drawingPointsRef = useRef<[number, number][]>([]);

  // Parse coordinates into GeoJSON when provided
  useEffect(() => {
    if (coordinates) {
      try {
        const parsed = parseCoordinates(coordinates);
        setBoundary(parsed);
        
        try {
          const measurements = calculateAreaAndPerimeter(parsed);
          setMeasurements(measurements);
        } catch (measureError) {
          setMeasurements({ acres: 0, sqft: 0, perimeter: { feet: 0, miles: 0 } });
        }
        
        try {
          if (mapRef.current && parsed.geometry && parsed.geometry.type === 'Polygon') {
            const bounds = getBounds(parsed);
            mapRef.current.fitBounds(bounds, { padding: 40 });
          }
        } catch (fitError) {
          // Silently fail - boundary visualization will still work
        }
        
        try {
          if (!initialViewState && parsed.geometry && parsed.geometry.type === 'Polygon') {
            const center = getCenter(parsed);
            setViewState({ longitude: center[0], latitude: center[1], zoom: 14 });
          } else if (!initialViewState) {
            setViewState({ longitude: -98.5795, latitude: 39.8283, zoom: 3 });
          }
        } catch (viewError) {
          setViewState({ longitude: -98.5795, latitude: 39.8283, zoom: 3 });
        }
      } catch (error) {
        const defaultPolygon = turf.polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
        setBoundary(defaultPolygon);
        setMeasurements({ acres: 0, sqft: 0, perimeter: { feet: 0, miles: 0 } });
        if (!initialViewState) {
          setViewState({ longitude: -98.5795, latitude: 39.8283, zoom: 3 });
        }
      }
    }
  }, [coordinates, initialViewState]);

  // Update parent component when boundary changes
  useEffect(() => {
    if (boundary && onBoundaryChange) {
      onBoundaryChange(boundary);
    }
  }, [boundary, onBoundaryChange]);
  
  // Initialize drawing mode when startDrawing changes or component mounts
  useEffect(() => {
    if (startDrawing) {
      setDrawMode('draw');
      if (!boundary) {
        drawingPointsRef.current = [];
      }
    }
  }, [startDrawing, boundary]);

  // Create GeoJSON sources
  const boundarySource = useMemo(() => {
    if (!boundary) return null;
    return boundary;
  }, [boundary]);

  // Vertices for editing
  const verticesSource = useMemo(() => {
    if (!boundary || !boundary.geometry || boundary.geometry.type !== 'Polygon') return null;
    
    try {
      // Extract vertices from polygon with type casting for TypeScript
      const polygonGeometry = boundary.geometry as GeoJSON.Polygon;
      if (!polygonGeometry.coordinates || !polygonGeometry.coordinates[0]) return null;
      
      const coords = polygonGeometry.coordinates[0];
      return turf.multiPoint(coords.slice(0, -1)); // Exclude last point (duplicate of first)
    } catch (error) {
      console.error('Failed to extract vertices from boundary:', error);
      return null;
    }
  }, [boundary]);

  // Drawing points state for visualization
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  
  // Create a drawing line for visualization
  const drawingLineSource = useMemo(() => {
    if (drawingPointsRef.current.length < 2) return null;
    
    try {
      // Create a GeoJSON LineString from drawing points
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: drawingPointsRef.current
        },
        properties: {}
      } as GeoJSON.Feature;
    } catch (error) {
      console.error('Failed to create drawing line:', error);
      return null;
    }
  }, [drawingPoints]);
  
  // Drawing line style
  const DRAWING_LINE_STYLE = {
    id: 'drawing-line',
    type: 'line' as const,
    paint: {
      'line-color': '#4f46e5', // Indigo
      'line-width': 3,
      'line-dasharray': [3, 2]
    }
  };
  
  // Completely redesigned map click handler with stability fixes
  const handleMapClick = (event: any) => {
    if (drawMode === 'draw') {
      try {
        // Ensure we have valid coordinates
        if (!event.lngLat || typeof event.lngLat.lng !== 'number' || typeof event.lngLat.lat !== 'number') {
          return;
        }
        
        // Prevent event from affecting map position
        event.preventDefault?.();
        event.stopPropagation?.();
        
        // Format coordinates consistently to 6 decimal places
        const lng = Number(event.lngLat.lng.toFixed(6));
        const lat = Number(event.lngLat.lat.toFixed(6));
        
        // Create point with explicit typing
        const newPoint: [number, number] = [lng, lat];
        
        // Create a new array to avoid mutation issues - using slice to create a true copy
        const updatedPoints = drawingPointsRef.current.slice();
        updatedPoints.push(newPoint);
        
        // Create a fresh array for state updates to prevent reference issues
        const pointsForState = updatedPoints.map(p => [p[0], p[1]] as [number, number]);
        
        // Update both the ref and state with the correct new arrays
        drawingPointsRef.current = updatedPoints;
        setDrawingPoints(pointsForState);
        
        console.log('Added point:', newPoint, 'Total points:', updatedPoints.length);
        
        // We don't automatically create a polygon here anymore - that will be done
        // only when the user explicitly clicks "Save Boundary"
        
        // However, we still update the preview line for visual feedback
        if (updatedPoints.length >= 2) {
          // This will trigger a re-render of the line preview via the drawingLineSource memo
          setDrawingPoints([...pointsForState]);
        }
      } catch (error) {
        console.error('Error in draw mode:', error);
      }
    } else if (drawMode === 'edit') {
      addVertex(event);
    }
  };
  
  // Helper to ensure polygon ring is in clockwise order
  const ensureClockwiseOrder = (ring: [number, number][]): [number, number][] => {
    try {
      // Check if points are already in clockwise order using turf
      const isClockwise = turf.booleanClockwise(ring);
      if (isClockwise) {
        return ring;
      }
      
      // Reverse the array if not clockwise
      return [...ring].reverse();
    } catch (e) {
      // If turf fails, return original array
      return ring;
    }
  };

  // Create polygon from current drawing points
  const createPolygonFromDrawing = useCallback(() => {
    try {
      console.log('Creating polygon from drawing points:', drawingPointsRef.current);
      
      // Need at least 3 points to create a valid polygon
      if (drawingPointsRef.current.length < 3) {
        toast({
          title: "Insufficient Points",
          description: "Need at least 3 points to create a valid boundary.",
          variant: "destructive",
        });
        return;
      }
      
      // Close the polygon by adding the first point again at the end
      const closedRing = [...drawingPointsRef.current, drawingPointsRef.current[0]];
      
      // Ensure clockwise order for turf.js compatibility
      const orderedRing = ensureClockwiseOrder(closedRing);
      
      // Create polygon using turf.js
      const polygon = turf.polygon([orderedRing]);
      
      // Validate the polygon
      if (!turf.booleanValid(polygon)) {
        toast({
          title: "Invalid Boundary",
          description: "The boundary is self-intersecting or invalid. Please adjust your points.",
          variant: "destructive",
        });
        return;
      }
      
      // Update local state
      setBoundary(polygon);
      
      // Calculate measurements
      try {
        const measurements = calculateAreaAndPerimeter(polygon);
        setMeasurements(measurements);
      } catch (error) {
        console.error('Failed to calculate measurements:', error);
        setMeasurements({
          acres: 0,
          sqft: 0,
          perimeter: { feet: 0, miles: 0 }
        });
      }
      
      // Fit the map to the boundary with controlled zoom
      try {
        const bounds = getBounds(polygon);
        if (mapRef.current && bounds && bounds.length === 2) {
          mapRef.current.fitBounds(bounds, {
            padding: 100,
            duration: 600,
            maxZoom: 14 // Limit maximum zoom level
          });
        }
      } catch (e) {
        console.error('Error fitting to bounds after creating polygon:', e);
      }
      
      // Notify parent component
      if (onBoundaryChange) {
        onBoundaryChange(polygon);
      }
      
      // Show feedback
      toast({
        title: "Boundary Saved",
        description: `Successfully created boundary with ${drawingPointsRef.current.length} vertices.`,
        variant: "default",
      });
      
      // Switch to view mode
      setDrawMode('view');
      
      return polygon;
    } catch (error) {
      console.error('Failed to create polygon from drawing:', error);
      toast({
        title: "Boundary Creation Failed",
        description: "Could not create a valid boundary. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [drawingPointsRef, onBoundaryChange, ensureClockwiseOrder, toast, getBounds]);

  // Reset drawing - completely revamped for reliability
  const clearDrawing = useCallback(() => {
    console.log('Clearing drawing...');
    // Clear drawing points
    drawingPointsRef.current = [];
    setDrawingPoints([]);
    
    // Clear boundary
    setBoundary(null);
    
    // Reset measurements
    setMeasurements(null);
    
    // Signal to parent component
    if (onBoundaryChange) {
      setTimeout(() => {
        onBoundaryChange(null);
      }, 0);
    }
    
    // Show feedback
    toast({
      title: "Drawing Cleared",
      description: "All drawing data has been cleared successfully.",
      variant: "default",
    });
    
    // Stay in drawing mode
    setDrawMode('draw');
    
    return true;
  }, [onBoundaryChange, toast]);

  // Handle vertex drag in edit mode
  const handleMarkerDrag = (index: number, event: any) => {
    if (!boundary || !boundary.geometry || boundary.geometry.type !== 'Polygon') return;
    
    try {
      const polygonGeometry = boundary.geometry as GeoJSON.Polygon;
      if (!polygonGeometry.coordinates || !polygonGeometry.coordinates[0]) {
        console.error('Invalid polygon geometry for drag operation');
        return;
      }
      
      const newCoords = [...polygonGeometry.coordinates[0]];
      newCoords[index] = [event.lngLat.lng, event.lngLat.lat];
      
      // Update the last point to match the first (closing the polygon)
      if (index === 0) {
        newCoords[newCoords.length - 1] = newCoords[0];
      }
      
      const newBoundary = turf.polygon([newCoords]);
      
      // Update local state
      setBoundary(newBoundary);
      
      // Calculate new measurements
      setMeasurements(calculateAreaAndPerimeter(newBoundary));
      
      // Call the callback to update parent component
      if (onBoundaryChange) {
        console.log('Edit mode: Calling onBoundaryChange with updated boundary');
        onBoundaryChange(newBoundary);
      }
    } catch (error) {
      console.error('Error handling marker drag:', error);
    }
  };

  // Add vertex to boundary
  const addVertex = (event: any) => {
    if (!boundary || !boundary.geometry || boundary.geometry.type !== 'Polygon' || drawMode !== 'edit') return;
    
    try {
      const polygonGeometry = boundary.geometry as GeoJSON.Polygon;
      if (!polygonGeometry.coordinates || !polygonGeometry.coordinates[0]) {
        console.error('Invalid polygon geometry for add vertex operation');
        return;
      }
      
      // Find closest edge to click point
      const clickPoint = turf.point([event.lngLat.lng, event.lngLat.lat]);
      const coords = polygonGeometry.coordinates[0];
      
      let minDistance = Infinity;
      let insertIndex = -1;
      
      // Skip last coord since it's duplicate of first
      for (let i = 0; i < coords.length - 1; i++) {
        const start = turf.point(coords[i]);
        const end = turf.point(coords[(i + 1) % (coords.length - 1)]);
        const line = turf.lineString([coords[i], coords[(i + 1) % (coords.length - 1)]]);
        
        const pointOnLine = turf.nearestPointOnLine(line, clickPoint);
        const distance = turf.distance(clickPoint, pointOnLine);
        
        if (distance < minDistance) {
          minDistance = distance;
          insertIndex = i + 1;
        }
      }
      
      if (insertIndex !== -1 && minDistance < 0.01) { // Only add vertex if close to a line
        const newCoords = [...coords];
        newCoords.splice(insertIndex, 0, [event.lngLat.lng, event.lngLat.lat]);
        
        const newBoundary = turf.polygon([newCoords]);
        // Update local state
        setBoundary(newBoundary);
        setMeasurements(calculateAreaAndPerimeter(newBoundary));
        
        // Call the callback to update parent component
        if (onBoundaryChange) {
          console.log('Edit mode: Adding vertex and updating boundary');
          onBoundaryChange(newBoundary);
        }
      }
    } catch (error) {
      console.error('Error adding vertex:', error);
    }
  };

  // Remove vertex
  const removeVertex = (index: number) => {
    if (!boundary || !boundary.geometry || boundary.geometry.type !== 'Polygon') return;
    
    try {
      const polygonGeometry = boundary.geometry as GeoJSON.Polygon;
      if (!polygonGeometry.coordinates || !polygonGeometry.coordinates[0]) {
        console.error('Invalid polygon geometry for remove vertex operation');
        return;
      }
      
      // Need at least 3 vertices for a valid polygon
      if (polygonGeometry.coordinates[0].length <= 4) {
        console.warn('Cannot remove vertex - polygon would have fewer than 3 vertices');
        return; // 4 because the last one is duplicate of first
      }
      
      const newCoords = [...polygonGeometry.coordinates[0]];
      newCoords.splice(index, 1);
      
      // Make sure polygon is closed
      if (index === 0) {
        newCoords[newCoords.length - 1] = newCoords[0];
      }
      
      const newBoundary = turf.polygon([newCoords]);
      
      // Update local state
      setBoundary(newBoundary);
      setMeasurements(calculateAreaAndPerimeter(newBoundary));
      
      // Call the callback to update parent component
      if (onBoundaryChange) {
        console.log('Edit mode: Removing vertex and updating boundary');
        onBoundaryChange(newBoundary);
      }
    } catch (error) {
      console.error('Error removing vertex:', error);
    }
  };

  // Completely redesigned coordinate parser with robust error handling
  const parseCoordinatesFromInput = () => {
    try {
      // Validate input is not empty
      if (!coordinateInput || coordinateInput.trim() === '') {
        toast({
          title: "Empty Coordinates",
          description: "Please enter coordinate data before submitting.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Parsing coordinates from input text:', coordinateInput);
      
      // Try to parse coordinates with improved error handling
      let parsed: GeoJSON.Feature | null = null;
      
      try {
        parsed = parseCoordinates(coordinateInput);
        
        // Immediately validate the polygon to catch issues early
        if (!parsed || !parsed.geometry || parsed.geometry.type !== 'Polygon') {
          throw new Error('Invalid polygon geometry');
        }
        
        // Check if we have valid coordinates
        if (!parsed.geometry.coordinates || 
            !Array.isArray(parsed.geometry.coordinates) || 
            parsed.geometry.coordinates.length === 0 ||
            !parsed.geometry.coordinates[0] ||
            !Array.isArray(parsed.geometry.coordinates[0]) ||
            parsed.geometry.coordinates[0].length < 4) { // Need at least 3 points + closing point
          throw new Error('Invalid polygon coordinates');
        }
        
        // Check for self-intersection
        if (!turf.booleanValid(parsed)) {
          throw new Error('Self-intersecting polygon');
        }
        
        // Validate coordinates are within reasonable bounds
        const polygonCoords = (parsed.geometry as GeoJSON.Polygon).coordinates[0];
        for (const point of polygonCoords) {
          if (point.length < 2 || 
              !isFinite(point[0]) || !isFinite(point[1]) ||
              Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) {
            throw new Error('Coordinates out of valid geographic range');
          }
        }
        
        console.log('Successfully parsed coordinates:', parsed);
      } catch (parseError) {
        console.error('Coordinate parsing failed:', parseError);
        toast({
          title: "Invalid Coordinates",
          description: `Could not parse coordinates: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }
      
      // If we get here, we have valid coordinates - update drawing points
      try {
        const polygonCoords = (parsed.geometry as GeoJSON.Polygon).coordinates[0];
        // Last point is always duplicate of first for closed polygons
        const uniqueCoords = polygonCoords.slice(0, -1).map(point => {
          // Ensure each point is exactly [number, number] with 6 decimal precision
          return [
            Number(point[0].toFixed(6)), 
            Number(point[1].toFixed(6))
          ] as [number, number];
        });
        
        // Update drawing points
        drawingPointsRef.current = uniqueCoords;
        setDrawingPoints([...uniqueCoords]);
      } catch (error) {
        console.error('Error syncing drawing points:', error);
      }
      
      // Update boundary
      setBoundary(parsed);
      
      // Calculate and update measurements
      try {
        const measurements = calculateAreaAndPerimeter(parsed);
        setMeasurements(measurements);
        console.log('Area calculated:', measurements.acres, 'acres');
      } catch (measureError) {
        console.error('Failed to calculate measurements:', measureError);
        // Set default blank measurements to avoid UI issues
        setMeasurements({
          acres: 0,
          sqft: 0,
          perimeter: { feet: 0, miles: 0 }
        });
      }
      
      // Don't need to set location type since this is handled at the PropertyMapCreator level
      
      // Call the callback to update parent component
      if (onBoundaryChange) {
        console.log('Coordinate Editor: Updating boundary from manual input');
        onBoundaryChange(parsed);
      }
      
      // Fit map to new boundary
      if (mapRef.current && parsed.geometry && parsed.geometry.type === 'Polygon') {
        try {
          // Use a delay to ensure map is ready for bounds change
          setTimeout(() => {
            try {
              const bounds = getBounds(parsed);
              if (bounds && bounds.length === 2) {
                // Use moderate animation and zoom settings to prevent excessive zooming
                mapRef.current.fitBounds(bounds, { 
                  padding: 120,
                  duration: 800,
                  maxZoom: 14 // Limit maximum zoom level
                });
                
                // Ensure map style is still visible after fitting bounds
                if (activeMapStyle) {
                  mapRef.current.setStyle(activeMapStyle);
                } else {
                  // If no style is active, set a default
                  setActiveMapStyle(MAP_STYLES.STREETS);
                  mapRef.current.setStyle(MAP_STYLES.STREETS);
                }
                
                toast({
                  title: "Coordinates Loaded",
                  description: `Successfully created boundary with ${drawingPointsRef.current.length} vertices.`,
                  variant: "default",
                });
              }
            } catch (delayedFitError) {
              console.error('Delayed fit to bounds failed:', delayedFitError);
            }
          }, 300);
        } catch (fitError) {
          console.error('Failed to schedule fit to bounds:', fitError);
        }
      }
      
      // Close the editor but don't change draw mode
      setShowEditor(false);
      // Keep drawing mode as "Complex" to preserve the boundary work
      setDrawMode('draw');
    } catch (error) {
      console.error('Failed to parse coordinates:', error);
      toast({
        title: "Error Processing Coordinates",
        description: "Failed to process coordinates. Please check the format and try again.",
        variant: "destructive",
      });
    }
  };

  // Export boundary as GeoJSON
  const exportGeoJSON = () => {
    if (!boundary) return;
    
    const dataStr = JSON.stringify(boundary);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'boundary.geojson';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative h-[500px] w-full">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={activeMapStyle}
          mapboxAccessToken={mapboxAccessToken}
          onClick={!readOnly ? handleMapClick : undefined}
          onDblClick={!readOnly && drawMode === 'edit' ? addVertex : undefined}
          ref={mapRef}
          attributionControl={false}
        >
          <NavigationControl position="top-right" />
          
          {/* Property Boundary */}
          {boundarySource && (
            <Source type="geojson" data={boundarySource}>
              <Layer {...BOUNDARY_LAYER_STYLE} />
              <Layer {...BOUNDARY_OUTLINE_STYLE} />
            </Source>
          )}
          
          {/* Drawing Line (for draw mode) */}
          {!readOnly && drawMode === 'draw' && drawingLineSource && (
            <Source type="geojson" data={drawingLineSource}>
              <Layer {...DRAWING_LINE_STYLE} />
            </Source>
          )}
          
          {/* Drawing Points (for draw mode) */}
          {!readOnly && drawMode === 'draw' && drawingPointsRef.current.map((point, index) => (
            <Marker
              key={`drawing-point-${index}`}
              longitude={point[0]}
              latitude={point[1]}
              color="#4f46e5" // Indigo color to match drawing line
            >
              <div className="bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                {index + 1}
              </div>
            </Marker>
          ))}
          
          {/* Vertex Markers (for edit mode) */}
          {!readOnly && drawMode === 'edit' && boundary && 
           boundary.geometry && boundary.geometry.type === 'Polygon' && 
           (boundary.geometry as GeoJSON.Polygon).coordinates && 
           (boundary.geometry as GeoJSON.Polygon).coordinates[0] && 
            (boundary.geometry as GeoJSON.Polygon).coordinates[0].slice(0, -1).map((coord, index) => (
              <Marker
                key={`vertex-${index}`}
                longitude={coord[0]}
                latitude={coord[1]}
                draggable
                onClick={() => setSelectedMarker(index)}
                onDragEnd={e => handleMarkerDrag(index, e)}
              />
            ))
          }
          
          {/* Selected vertex popup */}
          {selectedMarker !== null && boundary && 
           boundary.geometry && boundary.geometry.type === 'Polygon' && 
           (boundary.geometry as GeoJSON.Polygon).coordinates && 
           (boundary.geometry as GeoJSON.Polygon).coordinates[0] && 
           selectedMarker < (boundary.geometry as GeoJSON.Polygon).coordinates[0].length && (
            <Popup
              longitude={(boundary.geometry as GeoJSON.Polygon).coordinates[0][selectedMarker][0] || 0}
              latitude={(boundary.geometry as GeoJSON.Polygon).coordinates[0][selectedMarker][1] || 0}
              onClose={() => setSelectedMarker(null)}
              closeButton={true}
              closeOnClick={false}
              anchor="top"
            >
              <div className="p-2">
                <p className="text-xs font-medium">Vertex {selectedMarker + 1}</p>
                <p className="text-xs">
                  {(boundary.geometry as GeoJSON.Polygon).coordinates[0][selectedMarker][0].toFixed(6)},
                  {(boundary.geometry as GeoJSON.Polygon).coordinates[0][selectedMarker][1].toFixed(6)}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    removeVertex(selectedMarker);
                    setSelectedMarker(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            </Popup>
          )}
        </Map>
        
        {/* Map Controls Overlay */}
        {!readOnly && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
            <Card className="w-auto shadow-lg">
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm" 
                    variant={drawMode === 'view' ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      setDrawMode('view');
                    }}
                    title="View Mode"
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    <Move className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={drawMode === 'draw' ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      setDrawMode('draw');
                      drawingPointsRef.current = [];
                      // Update state for visualization
                      setDrawingPoints([]);
                    }}
                    title="Draw Mode"
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Draw
                  </Button>
                  
                  {drawMode === 'draw' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          e.stopPropagation(); // Stop event propagation
                          
                          // Use the dedicated clearDrawing function
                          clearDrawing();
                        }}
                        title="Clear Drawing"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      
                      {/* Save Drawing Button - Only show if we have at least 3 points */}
                      {drawingPointsRef.current.length >= 3 && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent form submission
                            e.stopPropagation(); // Stop event propagation
                            
                            // Call our save function to create polygon and update state
                            createPolygonFromDrawing();
                          }}
                          title="Save Boundary"
                          type="button"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save Boundary
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    size="sm"
                    variant={drawMode === 'edit' ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      setDrawMode('edit');
                    }}
                    title="Edit Mode"
                    disabled={!boundary}
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      setShowEditor(!showEditor);
                    }}
                    title="Coordinate Editor"
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    <Ruler className="h-4 w-4 mr-1" />
                    Coords
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      exportGeoJSON();
                    }}
                    title="Export GeoJSON"
                    disabled={!boundary}
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="w-auto shadow-lg">
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={activeMapStyle === MAP_STYLES.HYBRID ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      setActiveMapStyle(MAP_STYLES.HYBRID);
                    }}
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    Hybrid
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={activeMapStyle === MAP_STYLES.SATELLITE ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      setActiveMapStyle(MAP_STYLES.SATELLITE);
                    }}
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    Satellite
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={activeMapStyle === MAP_STYLES.OUTDOORS ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      setActiveMapStyle(MAP_STYLES.OUTDOORS);
                    }}
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    Terrain
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={activeMapStyle === MAP_STYLES.STREETS ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event propagation
                      setActiveMapStyle(MAP_STYLES.STREETS);
                    }}
                    type="button" // Explicitly set button type to avoid form submission
                  >
                    Streets
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Coordinate Editor Panel */}
            {showEditor && (
              <Card className="w-[300px] shadow-lg">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base">Coordinate Editor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="coordinateInput">Enter Coordinates</Label>
                      <Textarea
                        id="coordinateInput"
                        placeholder="Enter coordinates in any format: GeoJSON array, DMS, or Decimal"
                        value={coordinateInput}
                        onChange={(e) => setCoordinateInput(e.target.value)}
                        rows={5}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          e.stopPropagation(); // Stop event propagation
                          setShowEditor(false);
                        }}
                        type="button" // Explicitly set button type to avoid form submission
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          e.stopPropagation(); // Stop event propagation
                          parseCoordinatesFromInput();
                        }}
                        disabled={!coordinateInput.trim()}
                        type="button" // Explicitly set button type to avoid form submission
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Measurements Display */}
        {measurements && (
          <div className="absolute bottom-4 right-4 z-10">
            <Card className="shadow-lg">
              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-medium flex justify-between">
                  <span>Area:</span> 
                  <span>{measurements.acres.toFixed(2)} acres</span>
                </p>
                <p className="text-xs text-gray-600 flex justify-between">
                  <span>Square Feet:</span>
                  <span>{Math.round(measurements.sqft).toLocaleString()} sq ft</span>
                </p>
                <p className="text-sm font-medium flex justify-between">
                  <span>Perimeter:</span>
                  <span>{measurements.perimeter.miles.toFixed(2)} miles</span>
                </p>
                <p className="text-xs text-gray-600 flex justify-between">
                  <span>Feet:</span>
                  <span>{Math.round(measurements.perimeter.feet).toLocaleString()} ft</span>
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}