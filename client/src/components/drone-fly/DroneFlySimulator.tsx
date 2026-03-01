import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Pause, Play, RotateCcw, PlaneTakeoff, ZoomIn, ZoomOut, Compass, ArrowUp } from 'lucide-react';
import { generateDroneFootage, DroneFootageResponse } from '@/lib/openai';

// Types
interface DroneFlySimulatorProps {
  propertyId: number;
  propertyTitle: string;
  coordinates: [number, number];
  terrainType: string;
  imageUrl: string;
  property: any;
}

interface SimulationPoint {
  x: number;
  y: number;
  description: string;
  altitude: number;
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
}

// Simulation path generator
const generateSimulationPath = (terrainType: string): SimulationPoint[] => {
  // In a real implementation, this would be dynamically generated based on property features
  // For now, we'll use a predefined path with different descriptions based on terrain type
  
  const descriptions = {
    mountain: [
      "Flying over rugged mountain terrain with steep rocky outcroppings and scattered pine trees.",
      "Ascending over a natural spring flowing downhill, creating vibrant green vegetation against the rocky landscape.",
      "Circling above a spacious clearing with panoramic valley views, ideal for a mountain cabin.",
      "Heading toward the property boundary where dense forest begins, providing natural privacy.",
      "Descending for a close view of a unique rock formation that adds character to the landscape.",
      "Gaining altitude to showcase the property's elevation advantage and commanding views."
    ],
    forest: [
      "Hovering above a dense canopy of mature trees with occasional natural clearings.",
      "Moving over a small stream that winds through the property, providing a natural water source.",
      "Approaching a sunny clearing perfect for a cabin or small sustainable dwelling.",
      "Flying along the eastern boundary marked by a change in vegetation density.",
      "Descending near a cluster of old-growth trees that create a natural focal point.",
      "Rising to display the property's position relative to surrounding forest lands."
    ],
    coastal: [
      "Soaring above pristine coastal land with direct ocean views and gentle sea breezes.",
      "Tracking along the shoreline where the property offers private beach access.",
      "Circling over relatively flat terrain with excellent drainage and buildable areas.",
      "Approaching protected dunes that provide natural landscaping and privacy.",
      "Descending to showcase the transition zone between beach and more vegetated areas.",
      "Gaining altitude to display the breathtaking panoramic ocean views and coastal access."
    ],
    desert: [
      "Flying over striking desert terrain with unique rock formations and sparse vegetation.",
      "Moving past a seasonal wash that creates a natural division in the landscape.",
      "Circling above a flat area perfect for building, with mountains visible in the distance.",
      "Approaching the northern boundary where cacti and desert flora create a natural border.",
      "Descending near a natural depression that could be developed into a water catchment system.",
      "Rising to showcase the vast open space and incredible stargazing potential of this desert property."
    ],
    farmland: [
      "Hovering above gently rolling fertile fields ready for agricultural development.",
      "Tracking along a natural windbreak of trees that provides protection from prevailing winds.",
      "Circling over a level area ideal for a homestead with excellent southern exposure.",
      "Approaching the western boundary where a small pond provides irrigation potential.",
      "Descending to show rich topsoil and well-drained land suitable for various crops.",
      "Gaining altitude to display the property's advantageous position in the agricultural landscape."
    ]
  };
  
  // Default to forest if terrain type not found
  const terrainDescriptions = descriptions[terrainType as keyof typeof descriptions] || descriptions.forest;
  
  // Create a circular flight path with the descriptions
  const centerX = 50;
  const centerY = 50;
  const radius = 30;
  const points: SimulationPoint[] = [];
  const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  
  for (let i = 0; i < terrainDescriptions.length; i++) {
    const angle = (i / terrainDescriptions.length) * Math.PI * 2;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      description: terrainDescriptions[i],
      altitude: 100 + Math.sin(angle * 2) * 30, // Varies between 70-130 meters
      direction: directions[i % directions.length] as SimulationPoint['direction']
    });
  }
  
  return points;
};

// Format time for display (mm:ss)
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const DroneFlySimulator: React.FC<DroneFlySimulatorProps> = ({ 
  propertyId, 
  propertyTitle, 
  coordinates, 
  terrainType,
  imageUrl,
  property
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(0);
  const [simulationPath, setSimulationPath] = useState<SimulationPoint[]>([]);
  const [altitude, setAltitude] = useState(100); // Meters
  const [zoom, setZoom] = useState(1);
  const [compassHeading, setCompassHeading] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [terrainAnalysis, setTerrainAnalysis] = useState<string>('');
  const [flightTime, setFlightTime] = useState(0); // Seconds
  const animationRef = useRef<number | null>(null);
  const flightTimerRef = useRef<number | null>(null);
  
  // Initialize the simulation path
  useEffect(() => {
    // Start with the default simulation path
    setSimulationPath(generateSimulationPath(terrainType));
    
    // Try to fetch AI generated drone footage on component mount
    async function fetchDroneFootage() {
      try {
        setIsGenerating(true);
        const droneData = await generateDroneFootage(property);
        
        if (droneData && droneData.simulationPoints.length > 0) {
          // Convert API response to our SimulationPoint format
          const apiSimulationPath = droneData.simulationPoints.map((point, index) => {
            // Calculate x, y positions in a circular pattern
            const angle = (index / droneData.simulationPoints.length) * Math.PI * 2;
            const centerX = 50;
            const centerY = 50;
            const radius = 30;
            
            return {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle),
              description: point.description,
              altitude: point.altitude,
              direction: point.direction.toLowerCase() as SimulationPoint['direction']
            };
          });
          
          setSimulationPath(apiSimulationPath);
          setTerrainAnalysis(droneData.terrainAnalysis);
          
          toast({
            title: "DroneFly™ Simulation Ready",
            description: "AI-generated drone footage loaded successfully.",
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Error loading drone footage:', error);
        // Keep using the default simulation path
      } finally {
        setIsGenerating(false);
      }
    }
    
    if (property && property.id) {
      fetchDroneFootage();
    }
  }, [terrainType, property, toast]);
  
  // Handle playback controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleReset = () => {
    setCurrentPoint(0);
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    drawFrame(0);
  };
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };
  
  // Generate new AI drone footage
  const handleGenerateFootage = async () => {
    setIsGenerating(true);
    
    try {
      // Call the actual API to generate new drone footage
      const droneData = await generateDroneFootage(property);
      
      if (droneData && droneData.simulationPoints.length > 0) {
        // Convert API response to our SimulationPoint format
        const apiSimulationPath = droneData.simulationPoints.map((point, index) => {
          // Calculate x, y positions in a circular pattern
          const angle = (index / droneData.simulationPoints.length) * Math.PI * 2;
          const centerX = 50;
          const centerY = 50;
          const radius = 30;
          
          return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            description: point.description,
            altitude: point.altitude,
            direction: point.direction.toLowerCase() as SimulationPoint['direction']
          };
        });
        
        setSimulationPath(apiSimulationPath);
        setTerrainAnalysis(droneData.terrainAnalysis);
        
        // Reset and start playing the new footage
        setCurrentPoint(0);
        setIsPlaying(true);
        
        toast({
          title: "DroneFly™ Simulation Ready",
          description: "AI-generated drone footage has been created for this property.",
          duration: 3000
        });
      } else {
        throw new Error("No simulation points returned from API");
      }
    } catch (error) {
      console.error('Error generating drone footage:', error);
      toast({
        title: "Error Generating Footage",
        description: "Unable to generate DroneFly™ footage. Please try again later.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Draw the simulation frame
  const drawFrame = (pointIndex: number) => {
    if (!canvasRef.current || simulationPath.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const point = simulationPath[pointIndex];
    if (!point) return;
    
    const canvas = canvasRef.current;
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sky gradient (changes based on altitude and time of day)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    
    // Calculate sky colors based on altitude
    const altitudeFactor = Math.min(1, point.altitude / 300);
    
    // Sky colors change with altitude - higher means deeper blue
    skyGradient.addColorStop(0, `rgb(${135 - altitudeFactor * 30}, ${206 - altitudeFactor * 20}, ${235 + altitudeFactor * 20})`); // Sky blue
    skyGradient.addColorStop(0.7, `rgb(${224 - altitudeFactor * 40}, ${247 - altitudeFactor * 30}, ${255})`); // Lighter blue
    skyGradient.addColorStop(1, '#FFFFFF'); // Horizon
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.65);
    
    // Add clouds based on altitude
    if (point.altitude > 50) {
      const cloudCount = Math.floor(3 + Math.random() * 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      
      for (let i = 0; i < cloudCount; i++) {
        const cloudX = (i * width / cloudCount) + (Math.sin(flightTime * 0.01 + i) * 20);
        const cloudY = height * 0.3 + (i * 15) + (Math.cos(flightTime * 0.01 + i) * 10);
        const cloudSize = 30 + Math.random() * 40;
        
        // Draw cloud as a collection of circles
        for (let j = 0; j < 5; j++) {
          ctx.beginPath();
          ctx.arc(
            cloudX + (j * 10) - 20, 
            cloudY + (j % 2 === 0 ? -5 : 5), 
            cloudSize * 0.3, 
            0, 
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
    
    // Set compass heading based on direction
    const headings = {
      'north': 0,
      'northeast': 45,
      'east': 90,
      'southeast': 135,
      'south': 180,
      'southwest': 225,
      'west': 270,
      'northwest': 315
    };
    setCompassHeading(headings[point.direction]);
    
    // Simulate image parallax effect based on current point
    if (isLoaded) {
      const img = new Image();
      img.src = imageUrl;
      
      // Calculate parallax offset based on point position with more pronounced effect
      const parallaxX = (point.x - 50) * 0.8;
      const parallaxY = (point.y - 50) * 0.6;
      
      // Draw the terrain (property image with parallax)
      ctx.save();
      ctx.translate(width/2, height*0.8);
      ctx.scale(zoom, zoom);
      ctx.translate(-width/2, -height*0.8);
      
      // Apply a slight perspective transform based on altitude
      const perspectiveStrength = Math.min(0.2, point.altitude / 1000);
      ctx.transform(
        1, 0, 
        0, 1 - perspectiveStrength, 
        0, perspectiveStrength * height * 0.2
      );
      
      // Draw the image with a light vignette effect
      ctx.drawImage(
        img, 
        -parallaxX, height * 0.4 - parallaxY, 
        width + parallaxX * 2, height * 0.9
      );
      
      // Add terrain-specific overlays
      if (terrainType === 'mountain') {
        // Add slight fog effect for mountains
        const fogGradient = ctx.createLinearGradient(0, height * 0.5, 0, height);
        fogGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        fogGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, height * 0.5, width, height * 0.5);
      } else if (terrainType === 'coastal') {
        // Add water sparkle effect for coastal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 50; i++) {
          const sparkleX = Math.random() * width;
          const sparkleY = height * 0.7 + Math.random() * (height * 0.3);
          const sparkleSize = 1 + Math.random();
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.restore();
    } else {
      // Placeholder if image hasn't loaded - better terrain representation
      const terrainColors = {
        'mountain': {base: '#8B4513', accent: '#6B8E23'},
        'forest': {base: '#228B22', accent: '#006400'},
        'coastal': {base: '#1E90FF', accent: '#F5DEB3'},
        'desert': {base: '#DAA520', accent: '#CD853F'},
        'farmland': {base: '#BDB76B', accent: '#556B2F'}
      };
      
      const terrain = terrainColors[terrainType as keyof typeof terrainColors] || terrainColors.forest;
      
      // Draw base terrain
      const terrainGradient = ctx.createLinearGradient(0, height * 0.65, 0, height);
      terrainGradient.addColorStop(0, terrain.accent);
      terrainGradient.addColorStop(1, terrain.base);
      ctx.fillStyle = terrainGradient;
      ctx.fillRect(0, height * 0.65, width, height * 0.35);
      
      // Add some random terrain features
      ctx.fillStyle = terrain.accent;
      for (let i = 0; i < 10; i++) {
        const featureX = Math.random() * width;
        const featureY = height * 0.7 + Math.random() * (height * 0.3);
        const featureWidth = 20 + Math.random() * 30;
        const featureHeight = 10 + Math.random() * 20;
        
        ctx.beginPath();
        ctx.arc(featureX, featureY, featureWidth, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw drone shadow with movement
    const shadowSize = 30 - point.altitude / 10; // Shadow gets smaller with altitude
    const shadowOpacity = Math.max(0.05, 0.3 - (point.altitude / 300)); // Shadow gets lighter with altitude
    
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.beginPath();
    ctx.ellipse(
      width / 2 + Math.sin(flightTime * 0.1) * 5, 
      height * 0.8 + Math.cos(flightTime * 0.1) * 5, 
      shadowSize, shadowSize / 3, 
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Add drone propeller shadows for more realism
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + (flightTime * 0.2);
      const offsetX = Math.cos(angle) * (shadowSize * 0.7);
      const offsetY = Math.sin(angle) * (shadowSize * 0.2);
      
      ctx.beginPath();
      ctx.ellipse(
        width / 2 + offsetX, 
        height * 0.8 + offsetY, 
        5, 2, 
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
    
    // Set altitude state for display
    setAltitude(point.altitude);
  };
  
  // Flight timer effect
  useEffect(() => {
    if (!isPlaying) {
      if (flightTimerRef.current) {
        clearInterval(flightTimerRef.current);
        flightTimerRef.current = null;
      }
      return;
    }
    
    flightTimerRef.current = window.setInterval(() => {
      setFlightTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (flightTimerRef.current) {
        clearInterval(flightTimerRef.current);
        flightTimerRef.current = null;
      }
    };
  }, [isPlaying]);
  
  // Reset flight timer when footage is reset
  useEffect(() => {
    if (currentPoint === 0 && !isPlaying) {
      setFlightTime(0);
    }
  }, [currentPoint, isPlaying]);
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying || simulationPath.length === 0) return;
    
    let lastTime = 0;
    let animationProgress = 0;
    
    const animate = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;
      
      // Progress at a rate of 15 seconds per full simulation
      animationProgress += delta / (15000 / simulationPath.length);
      
      if (animationProgress >= 1) {
        animationProgress = 0;
        setCurrentPoint(prev => {
          const next = prev + 1;
          if (next >= simulationPath.length) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      
      drawFrame(currentPoint);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, currentPoint, simulationPath.length]);
  
  // Draw initial frame
  useEffect(() => {
    drawFrame(currentPoint);
  }, [currentPoint, simulationPath, isLoaded, zoom]);
  
  // Handle image loading
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => setIsLoaded(true);
    
    return () => {
      img.onload = null;
    };
  }, [imageUrl]);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-white">
          <PlaneTakeoff className="h-5 w-5 text-secondary inline-block mr-2" />
          DroneFly™ Simulation
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-light">AI-Generated Footage</span>
          <div className="bg-primary-lighter rounded-full px-2 py-0.5 text-xs">Beta</div>
        </div>
      </div>
      
      <div className="relative rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-primary-darker to-primary-dark shadow-lg" style={{ height: '360px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none"></div>
        
        {/* Drone flight HUD overlay frame */}
        <div className="absolute inset-0 border-2 border-secondary/30 pointer-events-none z-10">
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-secondary"></div>
          <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-secondary"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-secondary"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-secondary"></div>
        </div>
        
        <canvas 
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full"
        />
        
        {/* Compass overlay */}
        <div className="absolute top-3 right-3 bg-primary/80 backdrop-blur-sm rounded-full p-2 shadow-md flex items-center justify-center border border-secondary/50">
          <Compass className="h-6 w-6 text-white" />
          <div 
            className="absolute h-2 w-2 bg-secondary rounded-full" 
            style={{ 
              transform: `translate(-50%, -50%) rotate(${compassHeading}deg) translateY(-8px)`,
              transformOrigin: 'center center'
            }}
          />
        </div>
        
        {/* Altitude meter */}
        <div className="absolute top-3 left-3 bg-primary/80 backdrop-blur-sm rounded-lg py-1 px-2 shadow-md border border-secondary/50">
          <div className="flex items-center gap-1.5">
            <ArrowUp className="h-4 w-4 text-secondary" />
            <span className="text-xs font-mono text-white">{Math.round(altitude)}m</span>
          </div>
        </div>
        
        {/* Recording indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-primary/80 backdrop-blur-sm rounded-lg py-1 px-2 shadow-md border border-secondary/50 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-mono text-white">REC</span>
          <span className="text-xs font-mono text-white opacity-75">{formatTime(flightTime)}</span>
        </div>
        
        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-white">
          <div className="font-medium mb-1">POI: {currentPoint + 1}/{simulationPath.length}</div>
          <p className="text-sm text-neutral-light">{simulationPath[currentPoint]?.description}</p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePlayPause}
            className="bg-primary-lighter hover:bg-primary-light p-2 rounded-full text-white"
            disabled={isGenerating}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button 
            onClick={handleReset}
            className="bg-primary-lighter hover:bg-primary-light p-2 rounded-full text-white"
            disabled={isGenerating}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className="flex items-center ml-4">
            <span className="text-xs text-neutral-light mr-2">Zoom:</span>
            <button 
              onClick={handleZoomOut}
              className="bg-primary-lighter hover:bg-primary-light p-1 rounded-full text-white"
              disabled={isGenerating || zoom <= 0.5}
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-sm mx-2 text-white">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={handleZoomIn}
              className="bg-primary-lighter hover:bg-primary-light p-1 rounded-full text-white"
              disabled={isGenerating || zoom >= 2}
            >
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        <button 
          onClick={handleGenerateFootage}
          className="bg-secondary hover:bg-secondary-light px-3 py-1.5 text-sm flex items-center gap-1.5 rounded-lg text-primary font-medium transition-colors"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              <PlaneTakeoff className="h-4 w-4" />
              <span>Generate New Footage</span>
            </>
          )}
        </button>
      </div>
      
      {/* Telemetry */}
      <div className="mt-4 p-3 bg-primary rounded-lg">
        <div className="text-xs text-neutral-light mb-1">Drone Telemetry</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-neutral-light">Altitude</div>
            <div className="text-sm font-medium text-white">{Math.round(altitude)}m</div>
          </div>
          <div>
            <div className="text-xs text-neutral-light">Coordinates</div>
            <div className="text-sm font-medium text-white">
              {coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-light">Direction</div>
            <div className="text-sm font-medium text-white capitalize">
              {simulationPath[currentPoint]?.direction || 'North'}
            </div>
          </div>
        </div>
      </div>
      
      {terrainAnalysis && (
        <div className="mt-4 p-3 bg-primary rounded-lg">
          <div className="text-xs text-neutral-light mb-1">Terrain Analysis</div>
          <p className="text-sm text-white">{terrainAnalysis}</p>
        </div>
      )}
      
      <div className="mt-4">
        <div className="text-xs text-neutral-light mb-1">About This Feature</div>
        <p className="text-sm text-neutral-light">
          DroneFly™ uses AI to generate simulated drone footage, providing a bird's-eye view of the property.
          This helps buyers visualize the land's features without requiring an in-person visit.
        </p>
      </div>
    </div>
  );
};

export default DroneFlySimulator;