import React, { useEffect, useState } from 'react';
import { Map } from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import { 
  Pen, 
  Pencil, 
  Square, 
  Circle, 
  Ruler, 
  Hand, 
  X,
  Trash2 
} from 'lucide-react';

interface DrawingToolsProps {
  map: Map | null;
  isVisible: boolean;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({ map, isVisible }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const tools = [
    { id: 'select', icon: <Hand className="h-4 w-4" />, tooltip: 'Select' },
    { id: 'point', icon: <Pen className="h-4 w-4" />, tooltip: 'Drop Pin' },
    { id: 'line', icon: <Ruler className="h-4 w-4" />, tooltip: 'Draw Line' },
    { id: 'polygon', icon: <Pencil className="h-4 w-4" />, tooltip: 'Draw Shape' },
    { id: 'rectangle', icon: <Square className="h-4 w-4" />, tooltip: 'Draw Rectangle' },
    { id: 'circle', icon: <Circle className="h-4 w-4" />, tooltip: 'Draw Circle' },
  ];
  
  const handleToolClick = (toolId: string) => {
    // If clicking the same tool, deactivate it
    if (activeTool === toolId) {
      setActiveTool(null);
      // Here you would deactivate the current drawing mode in MapBox
      console.log(`Deactivated ${toolId} tool`);
    } else {
      setActiveTool(toolId);
      // Here you would activate the selected drawing mode in MapBox
      console.log(`Activated ${toolId} tool`);
    }
  };
  
  const clearDrawings = () => {
    // Clear all drawings from the map
    console.log('Clearing all drawings');
    // This would connect to MapBox draw to clear all features
  };
  
  // When the map changes or the drawing tools become invisible, reset the active tool
  useEffect(() => {
    if (!map || !isVisible) {
      setActiveTool(null);
    }
  }, [map, isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <div className="absolute top-4 left-4 z-20">
      {isExpanded ? (
        <div className="bg-white rounded-md shadow-md p-2">
          <div className="flex justify-between mb-2">
            <h3 className="text-sm font-medium">Drawing Tools</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0" 
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? "default" : "outline"}
                size="sm"
                className="p-1 h-8 w-8"
                onClick={() => handleToolClick(tool.id)}
                title={tool.tooltip}
              >
                {tool.icon}
              </Button>
            ))}
          </div>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={clearDrawings}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="shadow-md"
          onClick={() => setIsExpanded(true)}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Draw
        </Button>
      )}
    </div>
  );
};

export default DrawingTools;