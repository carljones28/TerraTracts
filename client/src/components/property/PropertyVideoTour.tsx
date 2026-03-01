import React, { useState, useEffect, useRef } from 'react';
import { Play, Video, Info, FileVideo } from 'lucide-react';

interface PropertyVideoTourProps {
  // Note: videoUrl can be provided directly or via the rawProperty
  videoUrl?: string;
  propertyTitle: string;
  thumbnailUrl?: string;
  rawProperty?: any;
}

const PropertyVideoTour: React.FC<PropertyVideoTourProps> = ({ 
  videoUrl, 
  propertyTitle,
  thumbnailUrl,
  rawProperty
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // This effect runs once to extract and process the video URL
  useEffect(() => {
    // Find a usable video URL from any available source
    let finalVideoUrl = null;
    let source = '';
    
    // Try all possible video URL sources with clear priority
    // First, try the direct videoUrl prop
    if (videoUrl) {
      finalVideoUrl = videoUrl;
      source = 'videoUrl-prop';
    } 
    // Then try videoUrl (camelCase) from rawProperty 
    else if (rawProperty?.videoUrl) {
      finalVideoUrl = rawProperty.videoUrl;
      source = 'videoUrl-camel';
    }
    // Finally try video_url (snake_case) from rawProperty
    else if (rawProperty?.video_url) {
      finalVideoUrl = rawProperty.video_url;
      source = 'video_url-snake';
    }
    
    // If we found a URL, process it to make it usable
    if (finalVideoUrl) {
      // Validate the URL - check if it's a real video URL or just placeholder data
      const isValidVideoUrl = (url: string): boolean => {
        // Local file uploads
        if (url.includes('/uploads/') || url.includes('/api/videos/')) return true;
        // Valid video file extensions
        if (url.match(/\.(mp4|webm|mov|avi|m4v)$/i)) return true;
        // Valid YouTube URLs with actual video IDs
        if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
          const idMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          return idMatch !== null;
        }
        // Valid Vimeo URLs with actual video IDs (numeric)
        if (url.includes('vimeo.com/')) {
          const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
          return vimeoMatch !== null;
        }
        return false;
      };
      
      // Skip placeholder/example URLs
      if (!isValidVideoUrl(finalVideoUrl)) {
        setVideoSrc(null);
        return;
      }
      
      // Process different URL formats to ensure they work
      if (finalVideoUrl.includes('/uploads/')) {
        // Convert /uploads/ URLs to /api/videos/ format for streaming
        const parts = finalVideoUrl.split('/uploads/');
        if (parts.length > 1) {
          const filename = parts[1];
          finalVideoUrl = `/api/videos/${filename}`;
        }
      } 
      else if (finalVideoUrl.match(/\.(mp4|webm|mov|avi)$/i)) {
        // Just a filename - route through API
        const filename = finalVideoUrl.split('/').pop();
        finalVideoUrl = `/api/videos/${filename}`;
      }
      
      // Set the video source for the player
      setVideoSrc(finalVideoUrl);
    } else {
      setVideoSrc(null);
    }
  }, [videoUrl, rawProperty]);
  
  // If no video URL could be found or processed, show a placeholder
  if (!videoSrc) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Property Video Tour</h2>
        
        {/* Debug warning removed */}
        
        <div className="bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center h-[300px]">
          <Video className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">Video tour coming soon!</p>
          <p className="text-gray-400 text-sm text-center mt-2">
            The property owner has not uploaded a video tour yet.
          </p>
        </div>
      </div>
    );
  }
  
  const handlePlayClick = () => {
    setIsPlaying(true);
    setVideoError(null);
  };
  
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('🎥 Video playback error:', e);
    setVideoError('Failed to load or play video. Please try again later.');
  };
  
  // Detect if the video is from YouTube
  const isYouTubeVideo = videoSrc && 
    (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be'));
  
  // Helper function to get the correct MIME type
  const getVideoType = (url: string): string => {
    if (!url) return 'video/mp4';
    
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'webm': return 'video/webm';
      case 'ogg': return 'video/ogg';
      case 'mov': return 'video/quicktime';
      default: return 'video/mp4';
    }
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Property Video Tour</h2>
      
      {videoError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{videoError}</span>
        </div>
      )}
      
      <div className="rounded-lg overflow-hidden relative">
        {isPlaying ? (
          <div className="aspect-video bg-slate-50">
            {isYouTubeVideo ? (
              <iframe 
                src={`${videoSrc}${videoSrc.includes('?') ? '&' : '?'}autoplay=1`}
                title={`Video tour of ${propertyTitle}`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video 
                ref={videoRef}
                className="w-full h-full object-contain bg-gray-100"
                controls
                autoPlay
                onError={handleVideoError}
                poster={thumbnailUrl}
                key={videoSrc} // Force re-render on URL change
              >
                <source 
                  src={videoSrc} 
                  type={getVideoType(videoSrc)} 
                />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ) : (
          <div 
            className="aspect-video bg-gray-200 flex items-center justify-center cursor-pointer relative group"
            onClick={handlePlayClick}
          >
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={`Video thumbnail for ${propertyTitle}`} 
                className="w-full h-full object-cover absolute inset-0"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/640x360?text=Property+Tour';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <FileVideo className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-white fill-current ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Debug information removed */}
    </div>
  );
};

export default PropertyVideoTour;