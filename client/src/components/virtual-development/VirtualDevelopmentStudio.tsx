import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  RefreshCw, 
  Download, 
  Home, 
  Tent, 
  TreePine, 
  Castle, 
  Factory, 
  Plus, 
  Minus, 
  RotateCw,
  PanelLeft,
  PanelRight,
  EyeOff,
  View,
  Layers
} from 'lucide-react';
import { generateDevelopmentConcept, VirtualDevelopmentResponse } from '@/lib/openai';
import Development3DScene from './Development3DScene';

interface VirtualDevelopmentStudioProps {
  propertyId: number;
  propertyTitle: string;
  coordinates: [number, number];
  terrainType: string;
  imageUrl: string;
  property: any;
}

// Available development types
const developmentTypes = [
  { id: 'cabin', name: 'Cabin', icon: Home },
  { id: 'eco_retreat', name: 'Eco Retreat', icon: Tent },
  { id: 'conservation', name: 'Conservation', icon: TreePine },
  { id: 'estate', name: 'Estate', icon: Castle },
  { id: 'commercial', name: 'Commercial', icon: Factory },
];

const VirtualDevelopmentStudio: React.FC<VirtualDevelopmentStudioProps> = ({ 
  propertyId, 
  propertyTitle, 
  coordinates, 
  terrainType,
  imageUrl,
  property
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDevType, setSelectedDevType] = useState('cabin');
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [concept, setConcept] = useState<VirtualDevelopmentResponse | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Generate development concept
  const handleGenerateConcept = async () => {
    setIsGenerating(true);
    
    try {
      const developmentData = await generateDevelopmentConcept({
        ...property,
        developmentType: selectedDevType
      });
      
      if (developmentData) {
        setConcept(developmentData);
        
        toast({
          title: "Development Concept Generated",
          description: "AI has created a development concept for this property.",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error generating development concept:', error);
      toast({
        title: "Error Generating Concept",
        description: "Unable to generate development concept. Please try again later.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image loading and processing
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Store the original image data
      setOriginalImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      setIsImageLoaded(true);
    };
    
    return () => {
      img.onload = null;
    };
  }, [imageUrl]);

  // Apply development visualization when concept changes
  useEffect(() => {
    if (!canvasRef.current || !concept || !isImageLoaded || !originalImageData) return;
    
    renderDevelopmentVisualization();
  }, [concept, isImageLoaded, rotation, zoom, originalImageData]);

  // Reset the visualization
  const handleReset = () => {
    if (!canvasRef.current || !originalImageData) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Reset rotation and zoom
    setRotation(0);
    setZoom(1);
    
    // Restore the original image
    ctx.putImageData(originalImageData, 0, 0);
  };

  // Visualize the development concept on the canvas
  const renderDevelopmentVisualization = () => {
    if (!canvasRef.current || !originalImageData || !concept) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Start with the original image
    ctx.putImageData(originalImageData, 0, 0);
    
    // Set up transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Draw development visualization based on concept
    // This is a simplified version - in a real implementation, 
    // we'd use more sophisticated rendering based on the AI response
    const structures = concept.structures || [];
    
    // Draw each structure
    structures.forEach((structure: VirtualDevelopmentResponse['structures'][0]) => {
      // Position is normalized 0-1, convert to canvas coordinates
      const x = structure.position[0] * canvas.width;
      const y = structure.position[1] * canvas.height;
      
      // Size is also normalized, scale based on canvas
      const width = structure.size[0] * canvas.width * 0.2;
      const height = structure.size[1] * canvas.height * 0.15;
      
      // Draw a representation of the structure
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
      ctx.lineWidth = 2;
      
      // Simple building representation
      if (structure.type === 'building') {
        // Building body
        ctx.fillRect(x - width / 2, y - height / 2, width, height);
        ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        
        // Roof (triangular for cabins, flat for others)
        if (selectedDevType === 'cabin') {
          ctx.beginPath();
          ctx.moveTo(x - width / 2 - 10, y - height / 2);
          ctx.lineTo(x, y - height / 2 - 20);
          ctx.lineTo(x + width / 2 + 10, y - height / 2);
          ctx.closePath();
          ctx.fillStyle = 'rgba(150, 100, 50, 0.7)';
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(120, 120, 120, 0.7)';
          ctx.fillRect(x - width / 2 - 5, y - height / 2 - 5, width + 10, 5);
          ctx.strokeRect(x - width / 2 - 5, y - height / 2 - 5, width + 10, 5);
        }
        
        // Windows
        ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
        const windowWidth = width / 6;
        const windowHeight = height / 4;
        ctx.fillRect(x - width / 3, y - height / 4, windowWidth, windowHeight);
        ctx.fillRect(x + width / 6, y - height / 4, windowWidth, windowHeight);
        
        // Door
        ctx.fillStyle = 'rgba(120, 80, 50, 0.9)';
        ctx.fillRect(x - windowWidth / 2, y + height / 4 - windowHeight / 2, windowWidth, windowHeight);
      }
      
      // Natural features (trees, landscaping)
      else if (structure.type === 'natural') {
        // Tree or natural feature
        ctx.fillStyle = 'rgba(50, 150, 50, 0.6)';
        
        // Tree crown
        ctx.beginPath();
        ctx.arc(x, y - height / 3, width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Tree trunk
        ctx.fillStyle = 'rgba(100, 70, 30, 0.7)';
        ctx.fillRect(x - width / 10, y - height / 3, width / 5, height / 2);
        ctx.strokeRect(x - width / 10, y - height / 3, width / 5, height / 2);
      }
      
      // Road or pathway
      else if (structure.type === 'pathway' && structure.path && structure.path.length > 0) {
        ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)';
        ctx.lineWidth = width / 4;
        ctx.beginPath();
        
        // Safe access to path array with type assertions
        const startPoint = structure.path[0] as [number, number];
        ctx.moveTo(startPoint[0] * canvas.width, startPoint[1] * canvas.height);
        
        for (let i = 1; i < structure.path.length; i++) {
          const point = structure.path[i] as [number, number];
          ctx.lineTo(point[0] * canvas.width, point[1] * canvas.height);
        }
        
        ctx.stroke();
      }
      
      // Label the structure if it has a name
      if (structure.name) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(structure.name, x, y + height / 2 + 20);
      }
    });
    
    ctx.restore();
    
    // Add overlay with development description
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    
    // Get development type name
    const devType = developmentTypes.find(type => type.id === selectedDevType)?.name || 'Development';
    
    // Title
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${devType} Concept`, 15, canvas.height - 55);
    
    // Description (fit and truncate to available space)
    ctx.font = '14px sans-serif';
    const description = concept.description || 'AI-generated development concept visualization';
    const maxWidth = canvas.width - 30;
    
    let text = description;
    if (ctx.measureText(text).width > maxWidth) {
      // Truncate text to fit
      let truncated = '';
      for (let i = 0; i < text.length; i++) {
        const testText = truncated + text[i] + '...';
        if (ctx.measureText(testText).width > maxWidth) break;
        truncated += text[i];
      }
      text = truncated + '...';
    }
    
    ctx.fillText(text, 15, canvas.height - 30);
  };

  // Handle rotation
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  // Handle download image
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    // Create temporary link
    const link = document.createElement('a');
    link.download = `${propertyTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-development-concept.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-white">
          <Building2 className="h-5 w-5 text-secondary inline-block mr-2" />
          Virtual Development Studio
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-light">AI-Generated Concepts</span>
          <div className="bg-primary-lighter rounded-full px-2 py-0.5 text-xs">Beta</div>
        </div>
      </div>
      
      <div className="flex gap-4 flex-col md:flex-row">
        {/* Development types sidebar */}
        <div className={`flex-none ${showControls ? 'w-full md:w-48' : 'w-0 overflow-hidden'}`}>
          <div className="bg-primary rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-white mb-2">Development Type</h4>
            <div className="space-y-2">
              {developmentTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedDevType(type.id)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md ${
                    selectedDevType === type.id 
                      ? 'bg-primary-light text-white' 
                      : 'text-neutral-light hover:bg-primary-lighter hover:text-white'
                  }`}
                >
                  <type.icon className="h-4 w-4" />
                  <span className="text-sm">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-primary rounded-lg p-3">
            <h4 className="text-sm font-medium text-white mb-2">Controls</h4>
            <div className="space-y-2">
              <button
                onClick={handleGenerateConcept}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-light text-primary font-medium px-3 py-1.5 rounded-md"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" />
                    <span>Generate Concept</span>
                  </>
                )}
              </button>
              
              {/* View mode toggle */}
              <div className="flex gap-1 bg-primary-darker p-1 rounded-md">
                <button
                  onClick={() => setViewMode('2d')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded ${
                    viewMode === '2d' 
                      ? 'bg-primary-light text-white' 
                      : 'text-neutral-light hover:bg-primary-lighter hover:text-white'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span className="text-xs">2D View</span>
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded ${
                    viewMode === '3d' 
                      ? 'bg-primary-light text-white' 
                      : 'text-neutral-light hover:bg-primary-lighter hover:text-white'
                  }`}
                >
                  <View className="h-4 w-4" />
                  <span className="text-xs">3D View</span>
                </button>
              </div>
              
              {viewMode === '2d' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleRotate}
                    className="flex items-center justify-center gap-1 bg-primary-lighter hover:bg-primary-light text-white px-2 py-1 rounded-md"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span className="text-xs">Rotate</span>
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1 bg-primary-lighter hover:bg-primary-light text-white px-2 py-1 rounded-md"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="text-xs">Reset</span>
                  </button>
                  
                  <button
                    onClick={handleZoomIn}
                    className="flex items-center justify-center gap-1 bg-primary-lighter hover:bg-primary-light text-white px-2 py-1 rounded-md"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs">Zoom In</span>
                  </button>
                  
                  <button
                    onClick={handleZoomOut}
                    className="flex items-center justify-center gap-1 bg-primary-lighter hover:bg-primary-light text-white px-2 py-1 rounded-md"
                  >
                    <Minus className="h-3.5 w-3.5" />
                    <span className="text-xs">Zoom Out</span>
                  </button>
                </div>
              )}
              
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-primary-lighter hover:bg-primary-light text-white px-3 py-1.5 rounded-md"
                disabled={!concept}
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Download Image</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Visualization container */}
        <div className="flex-grow relative">
          {/* Show 2D canvas or 3D view based on viewMode */}
          {viewMode === '2d' ? (
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-primary-darker to-primary-dark shadow-lg">
              <canvas 
                ref={canvasRef}
                className="w-full h-auto max-h-[500px] object-contain"
              />
              
              {/* Toggle controls button */}
              <button
                onClick={toggleControls}
                className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm rounded-full p-1.5 shadow-md border border-secondary/50 text-white"
                aria-label={showControls ? "Hide controls" : "Show controls"}
              >
                {showControls ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              </button>
              
              {/* Overlay when no concept is generated yet */}
              {!concept && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                  <Building2 className="h-16 w-16 text-secondary/80 mb-4" />
                  <h4 className="text-white text-lg font-medium mb-2">No Development Concept Yet</h4>
                  <p className="text-neutral-light text-sm max-w-sm text-center mb-4">
                    Select a development type and generate a concept to visualize potential development ideas for this property.
                  </p>
                  <button
                    onClick={handleGenerateConcept}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-light text-primary font-medium px-4 py-2 rounded-lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4" />
                        <span>Generate Concept</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-primary-darker to-primary-dark shadow-lg">
              {/* 3D Visualization */}
              <Development3DScene
                concept={concept}
                terrainType={terrainType as any}
                developmentType={selectedDevType}
              />
              
              {/* Toggle controls button */}
              <button
                onClick={toggleControls}
                className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm rounded-full p-1.5 shadow-md border border-secondary/50 text-white"
                aria-label={showControls ? "Hide controls" : "Show controls"}
              >
                {showControls ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              </button>
            </div>
          )}
          
          
          {/* Development features */}
          {concept && (
            <div className="mt-4 p-3 bg-primary rounded-lg">
              <div className="text-xs text-neutral-light mb-2">Development Features</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {concept.features?.map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="mt-0.5 h-4 w-4 rounded-full bg-secondary/20 flex items-center justify-center flex-none">
                      <div className="h-2 w-2 rounded-full bg-secondary"></div>
                    </div>
                    <span className="text-sm text-white">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-xs text-neutral-light mb-1">About This Feature</div>
        <p className="text-sm text-neutral-light">
          Virtual Development Studio uses AI to generate concept visualizations of potential development ideas
          for the property. Explore different development types to see what possibilities your land holds.
        </p>
      </div>
    </div>
  );
};

export default VirtualDevelopmentStudio;