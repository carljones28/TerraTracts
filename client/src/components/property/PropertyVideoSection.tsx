import { Play } from 'lucide-react';
import { useState } from 'react';

interface PropertyVideoSectionProps {
  videoUrl?: string;
}

const PropertyVideoSection: React.FC<PropertyVideoSectionProps> = ({ videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videoUrl) return null;

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isVimeo = videoUrl.includes('vimeo.com');

  const getEmbedUrl = (url: string): string => {
    if (isYouTube) {
      const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
    }
    if (isVimeo) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : url;
    }
    return url;
  };

  const getThumbnailUrl = (url: string): string | null => {
    if (isYouTube) {
      const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)?.[1];
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl(videoUrl);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4">
        <h3 className="text-xl font-bold text-gray-900">Property Video</h3>
      </div>

      <div className="px-6 pb-6">
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-900 relative">
          {!isPlaying && thumbnailUrl ? (
            <button
              onClick={() => setIsPlaying(true)}
              className="relative w-full h-full group cursor-pointer"
            >
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = thumbnailUrl.replace('maxresdefault', 'hqdefault');
                }}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/95 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl">
                  <Play className="h-7 w-7 md:h-8 md:w-8 text-gray-900 ml-1" fill="currentColor" />
                </div>
              </div>
            </button>
          ) : (
            <iframe
              src={getEmbedUrl(videoUrl)}
              title="Property Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyVideoSection;
