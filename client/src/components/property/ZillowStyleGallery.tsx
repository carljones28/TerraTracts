import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Expand, 
  Image as ImageIcon,
  X,
  Grid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import VisualPinOverlay from './VisualPinOverlay';
import { VisualPin, CreateVisualPinInput, UpdateVisualPinInput } from '@/hooks/use-visual-pins';

interface ZillowStyleGalleryProps {
  images: string[];
  alt: string;
  pins?: VisualPin[];
  isPinMode?: boolean;
  propertyId?: number;
  favoriteId?: number;
  isEditable?: boolean;
  onPinAdd?: (data: CreateVisualPinInput) => void;
  onPinUpdate?: (id: number, data: UpdateVisualPinInput) => void;
  onPinDelete?: (id: number) => void;
}

const ZillowStyleGallery: React.FC<ZillowStyleGalleryProps> = ({ 
  images, 
  alt,
  pins = [],
  isPinMode = false,
  favoriteId,
  isEditable = false,
  onPinAdd,
  onPinUpdate,
  onPinDelete
}) => {
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  
  // Refs for image containers to get dimensions
  const mainImageRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  
  // State for container dimensions
  const [containerDimensions, setContainerDimensions] = useState({
    main: { width: 0, height: 0 },
    fullscreen: { width: 0, height: 0 },
    thumbs: Array(4).fill({ width: 0, height: 0 })
  });
  
  // Refs for thumbnail image containers
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Update container dimensions when component mounts or window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (mainImageRef.current) {
        setContainerDimensions(prev => ({
          ...prev,
          main: {
            width: mainImageRef.current?.offsetWidth || 0,
            height: mainImageRef.current?.offsetHeight || 0
          }
        }));
      }
      
      if (fullscreenContainerRef.current) {
        setContainerDimensions(prev => ({
          ...prev,
          fullscreen: {
            width: fullscreenContainerRef.current?.offsetWidth || 0,
            height: fullscreenContainerRef.current?.offsetHeight || 0
          }
        }));
      }
      
      // Update thumbnail dimensions
      const newThumbDimensions = thumbRefs.current.map(ref => ({
        width: ref?.offsetWidth || 0,
        height: ref?.offsetHeight || 0
      }));
      
      setContainerDimensions(prev => ({
        ...prev,
        thumbs: newThumbDimensions
      }));
    };
    
    // Initial update
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-400">
          <ImageIcon size={48} />
          <p className="mt-2">No images available</p>
        </div>
      </div>
    );
  }
  
  const handleFullscreenToggle = (index: number = 0) => {
    setFullscreenIndex(index);
    setFullscreenMode(!fullscreenMode);
  };
  
  const navigateFullscreen = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setFullscreenIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else {
      setFullscreenIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) {
      navigateFullscreen('next');
    } else if (touchStart - touchEnd < -50) {
      navigateFullscreen('prev');
    }
  };
  
  const handlePinAdd = (imageIndex: number, x: number, y: number) => {
    if (!favoriteId || !onPinAdd) return;
    
    onPinAdd({
      favoriteId,
      imageIndex,
      xPosition: x,
      yPosition: y,
      pinColor: '#ef4444', // Default to red
    });
  };
  
  if (fullscreenMode) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
        onClick={() => handleFullscreenToggle()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button 
          className="absolute top-4 right-4 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition"
          onClick={() => handleFullscreenToggle()}
          aria-label="Close fullscreen view"
        >
          <X size={24} />
        </button>
        
        <button 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition"
          onClick={(e) => {
            e.stopPropagation();
            navigateFullscreen('prev');
          }}
          aria-label="Previous image"
        >
          <ChevronLeft size={30} />
        </button>
        
        <div 
          className="max-h-[90vh] max-w-[90vw] relative"
          ref={fullscreenContainerRef}
        >
          <img 
            src={images[fullscreenIndex]} 
            alt={`${alt} - image ${fullscreenIndex + 1} of ${images.length}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          
          {/* Visual Pin Overlay in fullscreen mode */}
          {pins.length > 0 && (
            <VisualPinOverlay
              pins={pins}
              currentImageIndex={fullscreenIndex}
              containerWidth={containerDimensions.fullscreen.width}
              containerHeight={containerDimensions.fullscreen.height}
              isEditable={isEditable}
              isPinMode={isPinMode}
              onPinAdd={(x, y) => handlePinAdd(fullscreenIndex, x, y)}
              onPinUpdate={onPinUpdate}
              onPinDelete={onPinDelete}
            />
          )}
        </div>
        
        <button 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition"
          onClick={(e) => {
            e.stopPropagation();
            navigateFullscreen('next');
          }}
          aria-label="Next image"
        >
          <ChevronRight size={30} />
        </button>
        
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center">
          <span className="text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
            {fullscreenIndex + 1} / {images.length}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {/* Left side - main image */}
        <div 
          ref={mainImageRef}
          className={`relative h-[400px] md:h-[500px] overflow-hidden ${isPinMode ? 'cursor-crosshair' : 'cursor-pointer'}`} 
          onClick={isPinMode ? undefined : () => handleFullscreenToggle(0)}
        >
          <img 
            src={images[0]} 
            alt={`${alt} - main view`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          
          {/* Visual Pin Overlay for main image */}
          {(pins.length > 0 || isPinMode) && (
            <VisualPinOverlay
              pins={pins}
              currentImageIndex={0}
              containerWidth={containerDimensions.main.width}
              containerHeight={containerDimensions.main.height}
              isEditable={isEditable}
              isPinMode={isPinMode}
              onPinAdd={(x, y) => handlePinAdd(0, x, y)}
              onPinUpdate={onPinUpdate}
              onPinDelete={onPinDelete}
            />
          )}
          
          {/* Fullscreen button */}
          <Button 
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreenToggle(0);
            }}
            className="absolute top-3 right-3 bg-black bg-opacity-30 text-white hover:bg-opacity-50"
            aria-label="View fullscreen"
          >
            <Expand size={18} />
          </Button>
        </div>
        
        {/* Right side - 2x2 grid of additional images */}
        <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-1">
          {images.slice(1, 5).map((image, idx) => (
            <div 
              key={idx + 1}
              ref={el => thumbRefs.current[idx] = el}
              className={`relative h-[248px] overflow-hidden ${isPinMode ? 'cursor-crosshair' : 'cursor-pointer'}`}
              onClick={isPinMode ? undefined : () => handleFullscreenToggle(idx + 1)}
            >
              <img 
                src={image} 
                alt={`${alt} - view ${idx + 2}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              
              {/* Visual Pin Overlay for thumbnail images */}
              {(pins.length > 0 || isPinMode) && (
                <VisualPinOverlay
                  pins={pins}
                  currentImageIndex={idx + 1}
                  containerWidth={containerDimensions.thumbs[idx]?.width || 0}
                  containerHeight={containerDimensions.thumbs[idx]?.height || 0}
                  isEditable={isEditable}
                  isPinMode={isPinMode}
                  onPinAdd={(x, y) => handlePinAdd(idx + 1, x, y)}
                  onPinUpdate={onPinUpdate}
                  onPinDelete={onPinDelete}
                />
              )}
              
              {/* If we're on the last visible image and have more images, show count */}
              {idx === 3 && images.length > 5 && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullscreenToggle(5);
                  }}
                >
                  <div className="text-center">
                    <Grid className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-lg font-medium">+{images.length - 5} more</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* If we have less than 5 images, fill with placeholders */}
          {Array.from({ length: Math.max(0, 5 - images.length) }).map((_, idx) => (
            <div 
              key={`placeholder-${idx}`}
              className="bg-gray-100 h-[248px] flex items-center justify-center"
            >
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          ))}
        </div>
        
        {/* Mobile additional images indicator (shown only on mobile) */}
        <div className="flex md:hidden justify-center mt-4">
          <div className="flex space-x-1">
            {images.slice(0, 5).map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full ${idx === 0 ? 'w-6 bg-primary' : 'w-1.5 bg-gray-300'}`}
              ></div>
            ))}
            
            {images.length > 5 && (
              <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
            )}
          </div>
        </div>
        
        {/* Mobile view button */}
        <div className="mt-4 md:hidden">
          <Button 
            variant="outline" 
            onClick={() => handleFullscreenToggle(0)}
            className="w-full"
          >
            <Expand className="h-4 w-4 mr-2" />
            View All {images.length} Photos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ZillowStyleGallery;