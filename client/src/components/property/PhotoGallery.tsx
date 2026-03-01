import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X, Image as ImageIcon } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  alt: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  
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

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleFullscreenToggle = () => {
    setFullscreenMode((prev) => !prev);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) {
      handleNext();
    } else if (touchStart - touchEnd < -50) {
      handlePrev();
    }
  };

  if (fullscreenMode) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        onClick={handleFullscreenToggle}
      >
        <button 
          className="absolute top-4 right-4 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition"
          onClick={handleFullscreenToggle}
        >
          <X size={24} />
        </button>
        
        <button 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
        >
          <ChevronLeft size={30} />
        </button>
        
        <img 
          src={images[currentIndex]} 
          alt={`${alt} - fullscreen view ${currentIndex + 1} of ${images.length}`}
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
        
        <button 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
        >
          <ChevronRight size={30} />
        </button>
        
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center">
          <span className="text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div 
        className="relative h-[400px] md:h-[500px] w-full bg-gray-50"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={images[currentIndex]} 
          alt={`${alt} - view ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 text-gray-800 hover:bg-opacity-100 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            
            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 text-gray-800 hover:bg-opacity-100 transition-all"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        {/* Fullscreen button */}
        <button 
          onClick={handleFullscreenToggle}
          className="absolute top-3 right-3 bg-white bg-opacity-80 rounded-full p-2 text-gray-800 hover:bg-opacity-100 transition-all"
          aria-label="View in fullscreen"
        >
          <Expand size={18} />
        </button>
        
        {/* Image counter */}
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex overflow-x-auto p-2 border-t border-gray-100 gap-2 bg-gray-50">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => handleThumbnailClick(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden transition-all ${
                idx === currentIndex 
                  ? 'ring-2 ring-primary ring-offset-2' 
                  : 'ring-1 ring-gray-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;