import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Compass, Filter, Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import droneVideoSrc from '../../assets/drone-video.mp4';

interface VideoHeroProps {
  onViewPropertyDetails: (propertyId: number) => void;
}

// AI Search response interface
interface AISearchResponse {
  properties: any[];
  interpretation: {
    intent: string;
    extractedCriteria: {
      priceRange: string;
      location: string;
      propertyType: string;
      size: string;
      features: string[];
    };
    suggestedFilters: string[];
  };
}

// Single beautiful drone video of land
const droneVideo = {
  src: droneVideoSrc, // Using the imported video asset
  type: 'TerraTracts - Aerial Land View',
  label: 'Explore'
};

const VideoHero = ({ onViewPropertyDetails }: VideoHeroProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Fetch properties - we'll only use this to get the count
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ['/api/properties'],
  });

  // Handle video loaded event
  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch(e => {
        console.error('Error playing video:', e);
        setVideoError(true);
      });
    }
  };
  
  // Handle video error
  const handleVideoError = () => {
    console.error(`Error loading video`);
    setVideoError(true);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      const data: AISearchResponse = await response.json();
      
      if (data.properties.length > 0) {
        // Navigate to the first property as an example
        onViewPropertyDetails(data.properties[0].id);
      }
    } catch (error) {
      console.error('Error performing AI search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="relative w-full h-[700px] overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="absolute inset-0 transition-opacity duration-1000 opacity-100 z-10">
          {videoError ? (
            // Fallback for when video fails to load
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white text-center">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium">{droneVideo.type}</p>
              </div>
            </div>
          ) : (
            // Video element
            <video
              ref={videoRef}
              src={droneVideo.src}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={handleVideoLoaded}
              onError={handleVideoError}
            />
          )}
          
          {/* Video fade in animation */}
          <div className={`absolute inset-0 bg-black transition-opacity duration-1000 ${
            videoLoaded && !videoError ? 'opacity-0' : 'opacity-100'
          }`}></div>
        </div>
      </div>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-20"></div>
      
      {/* Content */}
      <div className="relative z-30 container mx-auto px-4 pt-32 pb-28 md:pt-40 md:pb-32 h-full flex flex-col justify-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-6">
          Find your place on <span className="text-primary-400">Earth</span>
        </h1>
        
        <p className="text-xl text-white text-center max-w-3xl mx-auto mb-8 md:mb-12">
          Discover land properties matched to your vision using AI-powered insights and immersive visualization.
        </p>
        
        {/* Zillow-style tab search */}
        <div className="max-w-4xl mx-auto rounded-xl shadow-xl bg-white">
          <Tabs defaultValue="buy" className="w-full">
            <div className="px-4 pt-4">
              <TabsList className="grid grid-cols-3 h-12">
                <TabsTrigger value="buy" className="text-base font-medium data-[state=active]:bg-white">Buy</TabsTrigger>
                <TabsTrigger value="rent" className="text-base font-medium data-[state=active]:bg-white">Rent</TabsTrigger>
                <TabsTrigger value="sell" className="text-base font-medium data-[state=active]:bg-white">Sell</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="buy" className="p-0">
              <form onSubmit={handleSearch} className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                      type="text" 
                      placeholder="Enter a location, terrain type, or natural language query..." 
                      className="pl-10 pr-4 py-6 text-md rounded-lg border-slate-300 focus:ring-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-white h-auto py-3 px-8 text-base"
                    disabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{properties.length} properties</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Compass className="h-4 w-4" />
                    <span>50 states covered</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    <span>Try "Forest land in Colorado with mountain views"</span>
                  </span>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="rent" className="p-4 pt-0">
              <div className="h-32 flex items-center justify-center border-t border-slate-100">
                <p className="text-slate-500">Rental properties coming soon.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="sell" className="p-4 pt-0">
              <div className="h-32 flex items-center justify-center border-t border-slate-100">
                <p className="text-slate-500">Selling options coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default VideoHero;