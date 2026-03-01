import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import PropertyBoundaryMapCore from '../map/PropertyBoundaryMap';
import TractManagementPanel from './TractManagementPanel';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Layers, Map, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { LandTract } from '@shared/schema';

interface PropertyBoundaryMapProps {
  propertyId: number;
  initialCoordinates?: [number, number] | null;
  boundary?: any;
  readOnly?: boolean;
  onBoundaryChange?: (boundary: any) => void;
  className?: string;
}

export default function PropertyBoundaryMap({
  propertyId,
  initialCoordinates,
  boundary,
  readOnly = false,
  onBoundaryChange,
  className = ''
}: PropertyBoundaryMapProps) {
  const [selectedTract, setSelectedTract] = useState<LandTract | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  
  const { data: config } = useQuery<{ mapboxApiKey?: string }>({
    queryKey: ['/api/config'],
    staleTime: Infinity,
  });
  
  const mapboxToken = config?.mapboxApiKey || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
  
  const center: [number, number] = initialCoordinates 
    ? [initialCoordinates[1], initialCoordinates[0]]
    : [-98.5795, 39.8283];
  
  const handleTractSelect = useCallback((tract: LandTract | null) => {
    setSelectedTract(tract);
    if (tract?.boundaryGeoJson && onBoundaryChange) {
      onBoundaryChange(tract.boundaryGeoJson);
    }
  }, [onBoundaryChange]);
  
  if (!mapboxToken) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>
              Mapbox API key is missing. Please configure your Mapbox API key to view property boundaries.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className} data-testid="property-boundary-section">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Property Boundaries & Tracts
            </CardTitle>
            <CardDescription>
              {readOnly 
                ? 'View property boundary tracts and land divisions'
                : 'Draw, edit, and manage property boundary tracts'}
            </CardDescription>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPanel(!showPanel)}
            className="hidden md:flex"
            data-testid="button-toggle-panel"
          >
            {showPanel ? (
              <>
                <PanelLeftClose className="h-4 w-4 mr-2" />
                Hide Panel
              </>
            ) : (
              <>
                <PanelLeftOpen className="h-4 w-4 mr-2" />
                Show Panel
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 md:p-0">
        <div className="flex flex-col md:flex-row">
          {showPanel && (
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r bg-gray-50/50 p-4 max-h-[400px] overflow-y-auto">
              <TractManagementPanel
                propertyId={propertyId}
                selectedTract={selectedTract}
                onTractSelect={handleTractSelect}
                isEditable={!readOnly}
              />
            </div>
          )}
          
          <div className={`flex-1 ${showPanel ? 'min-h-[400px]' : 'min-h-[500px]'}`}>
            <PropertyBoundaryMapCore
              propertyId={propertyId}
              center={center}
              zoom={initialCoordinates ? 15 : 4}
              isEditable={!readOnly}
              onTractSelect={handleTractSelect}
              className="h-full w-full rounded-b-lg md:rounded-bl-none md:rounded-r-lg"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
