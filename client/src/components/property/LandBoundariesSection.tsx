import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, Layers, Maximize2, Info, ChevronDown, ChevronUp, MapPin, Ruler, FileText } from 'lucide-react';
import PropertyBoundaryMap from './PropertyBoundaryMap';
import TractManagementPanel from './TractManagementPanel';
import { Button } from '@/components/ui/button';

interface LandBoundariesSectionProps {
  propertyId: number;
  coordinates?: [number, number];
  boundary?: any;
  readOnly?: boolean;
  location?: string;
  state?: string;
  county?: string;
  acreage?: number;
}

interface LandTract {
  id: number;
  propertyId: number;
  name: string;
  description?: string;
  acreage: number;
  tractType: string;
  boundary?: any;
  color?: string;
  createdAt?: string;
}

const LandBoundariesSection = ({
  propertyId,
  coordinates,
  boundary,
  readOnly = true,
  location,
  state,
  county,
  acreage
}: LandBoundariesSectionProps) => {
  const [showTractDetails, setShowTractDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: tracts = [] } = useQuery<LandTract[]>({
    queryKey: [`/api/properties/${propertyId}/tracts`],
    enabled: !!propertyId
  });

  const hasMultipleTracts = tracts.length > 1;
  const totalTractAcreage = tracts.reduce((sum, t) => sum + (t.acreage || 0), 0);

  const tractColors: Record<string, string> = {
    residential: '#22c55e',
    agricultural: '#eab308',
    commercial: '#3b82f6',
    timber: '#16a34a',
    pasture: '#84cc16',
    cropland: '#f59e0b',
    wetland: '#06b6d4',
    recreational: '#8b5cf6',
    conservation: '#14b8a6',
    other: '#6b7280'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="bg-white shadow-md"
            >
              Exit Fullscreen
            </Button>
          </div>
        )}
        
        <div className={isFullscreen ? 'h-full' : 'h-[400px]'}>
          <PropertyBoundaryMap
            propertyId={propertyId}
            initialCoordinates={coordinates}
            boundary={boundary}
            readOnly={readOnly}
            className="h-full"
          />
        </div>

        {!isFullscreen && (
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-4 right-4 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors z-10"
            aria-label="View fullscreen map"
          >
            <Maximize2 className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-sm">
          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{location}</span>
            </div>
          )}
          {coordinates && (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">Access: Good</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandBoundariesSection;
