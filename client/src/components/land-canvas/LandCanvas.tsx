import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Paintbrush, 
  Download, 
  Plus, 
  Trash, 
  Image as ImageIcon,
  Text,
  Palette,
  Move,
  Undo,
  Redo,
  Save,
  RefreshCw,
  CircleDollarSign,
  Lightbulb,
  Trees
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface LandCanvasProps {
  property: any;
}

interface CanvasElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  style?: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
  };
}

interface InspirationItem {
  id: string;
  type: 'image' | 'text' | 'color';
  content: string;
  thumbnail?: string;
  description?: string;
}

interface MoodBoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  backgroundColor: string;
}

const LandCanvas: React.FC<LandCanvasProps> = ({ property }) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasTitle, setCanvasTitle] = useState('My Land Vision');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inspiration' | 'canvas'>('inspiration');
  const [templates, setTemplates] = useState<MoodBoardTemplate[]>([
    {
      id: 'eco-retreat',
      name: 'Eco Retreat',
      description: 'Sustainable living with minimal environmental impact',
      icon: <Trees className="h-5 w-5" />,
      backgroundColor: 'from-green-900 to-green-800'
    },
    {
      id: 'luxury-estate',
      name: 'Luxury Estate',
      description: 'High-end property development with premium features',
      icon: <CircleDollarSign className="h-5 w-5" />,
      backgroundColor: 'from-amber-700 to-amber-600'
    },
    {
      id: 'creative-concept',
      name: 'Creative Concept',
      description: 'Artistic and unique development ideas',
      icon: <Lightbulb className="h-5 w-5" />,
      backgroundColor: 'from-purple-800 to-purple-700'
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Generate inspiration items based on property details
  useEffect(() => {
    if (property) {
      generateInspirationItems();
    }
  }, [property]);

  // Save to history when canvas elements change
  useEffect(() => {
    if (canvasElements.length > 0 && JSON.stringify(canvasElements) !== JSON.stringify(history[historyIndex])) {
      setHistory([...history.slice(0, historyIndex + 1), [...canvasElements]]);
      setHistoryIndex(historyIndex + 1);
    }
  }, [canvasElements]);

  // Generate inspiration items based on property details and trends
  const generateInspirationItems = async () => {
    setIsLoading(true);

    try {
      // Get the style type based on the selected template
      let styleType = 'modern';
      if (selectedTemplate === 'eco-retreat') {
        styleType = 'eco';
      } else if (selectedTemplate === 'luxury-estate') {
        styleType = 'luxury';
      } else if (selectedTemplate === 'creative-concept') {
        styleType = 'minimalist';
      }
      
      // Call the AI mood board API
      const response = await fetch(`/api/ai/property/${property.id}/mood-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ styleType }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood board inspiration');
      }
      
      const data = await response.json();
      
      // Process images from the response
      const imageItems = (data.images || []).map((image: any, index: number) => ({
        id: `img-${Date.now()}-${index}`,
        type: 'image' as const,
        content: image.url || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739',
        description: image.description || 'Architectural inspiration',
        tags: image.tags || [],
      }));
      
      // Process color palette from the response
      const colorItems = (data.colors || []).map((color: any, index: number) => ({
        id: `color-${Date.now()}-${index}`,
        type: 'color' as const,
        content: color.hex || '#2B4257',
        description: color.name || 'Color palette',
      }));
      
      // Process keywords and style description
      const keywordItems = (data.keywords || []).map((keyword: string, index: number) => ({
        id: `text-${Date.now()}-${index}`,
        type: 'text' as const,
        content: keyword,
        description: 'Design keyword',
      }));
      
      // Add style description as a text item
      const styleDescriptionItem = {
        id: `text-${Date.now()}-style`,
        type: 'text' as const,
        content: data.styleDescription || `${styleType} design style`,
        description: 'Style description',
      };
      
      // Add development suggestions as text items
      const suggestionItems = (data.developmentSuggestions || []).map((suggestion: string, index: number) => ({
        id: `text-${Date.now()}-suggestion-${index}`,
        type: 'text' as const,
        content: suggestion,
        description: 'Development suggestion',
      }));
      
      // Combine all inspiration items
      const newInspirationItems = [
        ...imageItems,
        ...colorItems,
        ...keywordItems,
        styleDescriptionItem,
        ...suggestionItems,
      ];
      
      setInspirationItems(newInspirationItems);
      
      toast({
        title: 'Inspiration ready',
        description: `Generated ${styleType} mood board inspiration for your property.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating inspiration items:', error);
      
      // Fallback to basic inspiration if API fails
      const propertyType = property.propertyType?.toLowerCase() || '';
      const features = property.features || [];
      
      // Default images based on property type
      const defaultImages = [
        {
          id: `img-${Date.now()}-1`,
          type: 'image' as const,
          content: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739',
          description: 'Mountain vista with cabin',
        },
        {
          id: `img-${Date.now()}-2`,
          type: 'image' as const,
          content: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8',
          description: 'Woodland stream',
        },
        {
          id: `img-${Date.now()}-3`,
          type: 'image' as const,
          content: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e',
          description: 'Lakeside retreat',
        },
      ];
      
      // Texts based on property features
      const featureTexts = features.map((feature: string, index: number) => ({
        id: `text-${Date.now()}-${index}`,
        type: 'text' as const,
        content: feature,
        description: 'Property feature',
      }));
      
      // Color schemes based on terrain
      const colorSchemes = [
        {
          id: `color-${Date.now()}-1`,
          type: 'color' as const,
          content: '#2B4257',
          description: 'Forest green',
        },
        {
          id: `color-${Date.now()}-2`,
          type: 'color' as const,
          content: '#8A6642',
          description: 'Earth tone',
        },
        {
          id: `color-${Date.now()}-3`,
          type: 'color' as const,
          content: '#4B88A2',
          description: 'Sky blue',
        },
      ];
      
      // Combine all inspiration items
      const newInspirationItems = [
        ...defaultImages,
        ...featureTexts,
        ...colorSchemes,
      ];
      
      setInspirationItems(newInspirationItems);
      
      toast({
        title: 'Using basic inspiration',
        description: 'Failed to generate AI inspiration. Using basic templates instead.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding an element to the canvas
  const handleAddElement = (item: InspirationItem) => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type: item.type === 'color' ? 'shape' : item.type,
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: item.type === 'text' ? 150 : 100,
      height: item.type === 'text' ? 50 : 100,
      rotation: 0,
      content: item.content,
      style: {
        color: item.type === 'text' ? '#ffffff' : undefined,
        backgroundColor: item.type === 'color' ? item.content : undefined,
        borderRadius: item.type === 'color' ? 8 : 0,
        opacity: 1,
      },
    };
    
    setCanvasElements([...canvasElements, newElement]);
    toast({
      title: 'Added to canvas',
      description: `${item.description || item.type} added to your mood board.`,
      duration: 1500,
    });
  };

  // Handle removing an element from the canvas
  const handleRemoveElement = (id: string) => {
    setCanvasElements(canvasElements.filter(element => element.id !== id));
    setSelectedElement(null);
  };

  // Handle element selection
  const handleSelectElement = (id: string) => {
    setSelectedElement(id === selectedElement ? null : id);
  };

  // Handle element dragging
  const handleElementDrag = (e: React.MouseEvent, id: string) => {
    if (!selectedElement) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const element = canvasElements.find(el => el.id === id);
    if (!element) return;
    
    const startElementX = element.x;
    const startElementY = element.y;
    
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      setCanvasElements(canvasElements.map(el => {
        if (el.id === id) {
          return {
            ...el,
            x: startElementX + dx,
            y: startElementY + dy,
          };
        }
        return el;
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    setIsDragging(true);
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCanvasElements([...history[historyIndex - 1]]);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCanvasElements([...history[historyIndex + 1]]);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplate(id);
    
    // Clear canvas and set background based on template
    setCanvasElements([]);
    
    // Generate new inspiration items based on the selected template
    generateInspirationItems();
    
    toast({
      title: 'Template selected',
      description: `${templates.find(t => t.id === id)?.name} template applied.`,
      duration: 2000,
    });
  };

  // Handle canvas export/download
  const handleExportCanvas = () => {
    // In a real implementation, this would capture the canvas as an image
    // For now, we'll just show a success message
    toast({
      title: 'Canvas exported',
      description: 'Your mood board has been downloaded.',
      duration: 2000,
    });
  };

  // Handle saving the canvas
  const handleSaveCanvas = () => {
    // In a real implementation, this would save the canvas to the user's account
    toast({
      title: 'Mood board saved',
      description: 'Your mood board has been saved to your account.',
      duration: 2000,
    });
  };

  // Get canvas background class based on selected template
  const getCanvasBackgroundClass = () => {
    if (!selectedTemplate) return 'bg-gray-900';
    
    const template = templates.find(t => t.id === selectedTemplate);
    return template ? `bg-gradient-to-br ${template.backgroundColor}` : 'bg-gray-900';
  };

  return (
    <div className="bg-glass rounded-xl p-6">
      <div className="flex items-center mb-6">
        <div className="h-12 w-12 bg-primary-lighter rounded-full flex items-center justify-center mr-4">
          <Paintbrush className="text-secondary text-lg" />
        </div>
        <div>
          <h3 className="text-white font-medium text-lg">LandCanvas™ Mood Board</h3>
          <p className="text-neutral-light text-sm">
            Visualize design ideas for your property
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex mb-6 bg-primary-darker rounded-lg p-1">
        <button 
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === 'inspiration' 
              ? "bg-primary-lighter text-white" 
              : "text-neutral-light hover:text-white"
          )}
          onClick={() => setActiveTab('inspiration')}
        >
          <span>Inspiration</span>
        </button>
        <button 
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === 'canvas' 
              ? "bg-primary-lighter text-white" 
              : "text-neutral-light hover:text-white"
          )}
          onClick={() => setActiveTab('canvas')}
        >
          <span>Canvas</span>
        </button>
      </div>
      
      {activeTab === 'inspiration' ? (
        <>
          {/* Templates */}
          <div className="mb-6">
            <h4 className="text-white text-sm font-medium mb-3">Templates</h4>
            <div className="grid grid-cols-3 gap-3">
              {templates.map(template => (
                <button
                  key={template.id}
                  className={cn(
                    "p-3 rounded-lg bg-gradient-to-br flex flex-col items-center text-white text-sm transition-all",
                    template.backgroundColor,
                    selectedTemplate === template.id ? "ring-2 ring-secondary" : "opacity-80 hover:opacity-100"
                  )}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <div className="bg-white/10 rounded-full p-2 mb-2">
                    {template.icon}
                  </div>
                  <span>{template.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Inspiration Gallery */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white text-sm font-medium">Inspiration Gallery</h4>
              <button 
                className="text-secondary hover:text-secondary/80 flex items-center text-xs"
                onClick={generateInspirationItems}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                <span>Refresh</span>
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-secondary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {inspirationItems.map(item => (
                  <div 
                    key={item.id}
                    className="bg-primary-darker rounded-lg overflow-hidden relative group"
                  >
                    {item.type === 'image' && (
                      <img 
                        src={item.content} 
                        alt={item.description || 'Inspiration image'} 
                        className="w-full h-24 object-cover"
                      />
                    )}
                    {item.type === 'text' && (
                      <div className="w-full h-24 flex items-center justify-center bg-primary p-2">
                        <p className="text-white text-sm break-words text-center">{item.content}</p>
                      </div>
                    )}
                    {item.type === 'color' && (
                      <div 
                        className="w-full h-24 flex items-center justify-center"
                        style={{ backgroundColor: item.content }}
                      >
                        <span className="text-white text-xs bg-black/30 px-2 py-1 rounded">
                          {item.description}
                        </span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        className="bg-primary p-2 rounded-full"
                        onClick={() => handleAddElement(item)}
                        title="Add to canvas"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Canvas Toolbar */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex space-x-2">
              <button 
                className="bg-primary-darker p-2 rounded text-white hover:bg-primary transition-colors"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button 
                className="bg-primary-darker p-2 rounded text-white hover:bg-primary transition-colors"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="bg-primary-darker p-2 rounded text-white hover:bg-primary transition-colors"
                onClick={handleSaveCanvas}
                title="Save"
              >
                <Save className="h-4 w-4" />
              </button>
              <button 
                className="bg-primary-darker p-2 rounded text-white hover:bg-primary transition-colors"
                onClick={handleExportCanvas}
                title="Export"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Canvas Title */}
          <div className="mb-3">
            <input 
              type="text"
              value={canvasTitle}
              onChange={(e) => setCanvasTitle(e.target.value)}
              className="w-full bg-primary-darker border-none rounded p-2 text-white focus:ring-1 focus:ring-secondary"
              placeholder="Canvas Title"
            />
          </div>
          
          {/* Canvas Area */}
          <div 
            className={cn(
              "w-full h-96 rounded-lg relative overflow-hidden",
              getCanvasBackgroundClass()
            )}
            ref={canvasRef}
          >
            {canvasElements.map(element => (
              <div 
                key={element.id}
                className={cn(
                  "absolute cursor-move transition-shadow",
                  selectedElement === element.id ? "ring-2 ring-secondary" : ""
                )}
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  width: `${element.width}px`,
                  height: `${element.height}px`,
                  transform: `rotate(${element.rotation}deg)`,
                  backgroundColor: element.style?.backgroundColor,
                  borderRadius: element.style?.borderRadius ? `${element.style.borderRadius}px` : undefined,
                  opacity: element.style?.opacity,
                }}
                onClick={() => handleSelectElement(element.id)}
                onMouseDown={(e) => handleElementDrag(e, element.id)}
              >
                {element.type === 'image' && (
                  <img 
                    src={element.content}
                    alt="Canvas element"
                    className="w-full h-full object-cover"
                  />
                )}
                {element.type === 'text' && (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p 
                      style={{ 
                        color: element.style?.color, 
                        fontSize: element.style?.fontSize, 
                        fontFamily: element.style?.fontFamily 
                      }}
                      className="text-center break-words"
                    >
                      {element.content}
                    </p>
                  </div>
                )}
                
                {selectedElement === element.id && (
                  <button 
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    onClick={() => handleRemoveElement(element.id)}
                  >
                    <Trash className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>
            ))}
            
            {canvasElements.length === 0 && !selectedTemplate && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                <Paintbrush className="h-10 w-10 mb-2" />
                <p className="text-sm">Select a template and add elements from the Inspiration tab</p>
              </div>
            )}
          </div>
          
          {/* Element Count */}
          <div className="mt-2 text-xs text-neutral-light">
            {canvasElements.length} {canvasElements.length === 1 ? 'element' : 'elements'} on canvas
          </div>
        </>
      )}
      
      <div className="mt-4">
        <div className="text-xs text-neutral-light mb-1">About This Feature</div>
        <p className="text-sm text-neutral-light">
          LandCanvas™ helps you create visual mood boards to plan your land development.
          Collect inspiration, arrange elements, and visualize your future property.
        </p>
      </div>
    </div>
  );
};

export default LandCanvas;