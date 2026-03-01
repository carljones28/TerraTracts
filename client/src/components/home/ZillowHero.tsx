import { useQuery } from '@tanstack/react-query';
import ZillowSearchBar from './ZillowSearchBar';

interface ZillowHeroProps {
  onViewPropertyDetails: (propertyId: number) => void;
  onMapLocationChange?: (location: { lat: number; lng: number; zoom: number }) => void;
  onSearchResults?: (results: AISearchResponse) => void;
}

// AI Search response interface
interface AISearchResponse {
  properties: any[];
  interpretation?: {
    intent: string;
    extractedCriteria: {
      priceRange?: string;
      location?: string;
      propertyType?: string;
      size?: string;
      features?: string[];
    };
    suggestedFilters?: string[];
  };
}

const ZillowHero = ({ onViewPropertyDetails, onMapLocationChange, onSearchResults }: ZillowHeroProps) => {
  // Fetch properties - we'll only use this to get the count
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ['/api/properties'],
  });

  const handleSearchResults = (results: AISearchResponse) => {
    if (results.properties.length > 0) {
      // Update map location if we have coordinates
      if (onMapLocationChange && results.properties[0].coordinates) {
        const [lat, lng] = results.properties[0].coordinates;
        onMapLocationChange({ lat, lng, zoom: 10 });
      }
      
      // Pass the search results to the parent component
      if (onSearchResults) {
        onSearchResults(results);
      }
    }
  };

  return (
    <section className="relative w-full min-h-[280px] h-[40vh] max-h-[320px] md:h-[350px] md:max-h-[400px] lg:h-[400px] lg:max-h-[450px] bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 bg-cover bg-center overflow-visible">
      {/* Creative animated pattern background with exact property type icons */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="exactPropertyPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              {/* Agricultural Land - Exact wheat grain icon */}
              <g opacity="0.6" fill="#10b981" stroke="#10b981" transform="translate(10, 10) rotate(15)">
                <path d="M8 5 Q6 7 6 10 Q6 13 8 15 L8 20 Q10 18 10 15 Q10 13 8 10 Q8 7 8 5" fill="#10b981"/>
                <path d="M12 5 Q10 7 10 10 Q10 13 12 15 L12 20 Q14 18 14 15 Q14 13 12 10 Q12 7 12 5" fill="#10b981"/>
                <path d="M16 5 Q14 7 14 10 Q14 13 16 15 L16 20 Q18 18 18 15 Q18 13 16 10 Q16 7 16 5" fill="#10b981"/>
                <circle cx="8" cy="4" r="1" fill="#10b981"/>
                <circle cx="12" cy="4" r="1" fill="#10b981"/>
                <circle cx="16" cy="4" r="1" fill="#10b981"/>
              </g>
              
              {/* Ranches & Farms - Exact barn with silo */}
              <g opacity="0.5" fill="#f59e0b" stroke="#f59e0b" transform="translate(70, 5) rotate(-10)">
                <path d="M6 20 L6 12 L15 8 L24 12 L24 20 Z" stroke="#f59e0b" strokeWidth="2" fill="none"/>
                <rect x="12" y="15" width="2" height="5" fill="#f59e0b"/>
                <rect x="16" y="10" width="4" height="10" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                <ellipse cx="18" cy="8" rx="2" ry="1" fill="#f59e0b"/>
                <rect x="8" y="17" width="2" height="2" fill="#f59e0b"/>
              </g>
              
              {/* Recreational Land - Exact tent with mountain */}
              <g opacity="0.6" fill="#059669" stroke="#059669" transform="translate(10, 70) rotate(8)">
                <path d="M5 20 L15 5 L25 20 Z" stroke="#059669" strokeWidth="2" fill="none"/>
                <path d="M15 5 L15 20" stroke="#059669" strokeWidth="1"/>
                <path d="M5 20 L25 20" stroke="#059669" strokeWidth="2"/>
                <path d="M0 20 L5 15 L8 20" stroke="#059669" strokeWidth="1" fill="none"/>
                <path d="M22 20 L25 15 L30 20" stroke="#059669" strokeWidth="1" fill="none"/>
              </g>
              
              {/* Waterfront Property - Exact wave pattern */}
              <g opacity="0.7" fill="#0ea5e9" stroke="#0ea5e9" transform="translate(75, 70) rotate(-5)">
                <path d="M5 12 Q8 9 12 12 Q16 15 20 12" stroke="#0ea5e9" strokeWidth="2" fill="none"/>
                <path d="M5 16 Q8 13 12 16 Q16 19 20 16" stroke="#0ea5e9" strokeWidth="2" fill="none"/>
                <path d="M5 20 Q8 17 12 20 Q16 23 20 20" stroke="#0ea5e9" strokeWidth="2" fill="none"/>
                <circle cx="7" cy="10" r="1" fill="#0ea5e9"/>
                <circle cx="14" cy="10" r="1" fill="#0ea5e9"/>
                <circle cx="18" cy="10" r="1" fill="#0ea5e9"/>
              </g>
              
              {/* Timberland - Exact pine tree cluster */}
              <g opacity="0.5" fill="#065f46" stroke="#065f46" transform="translate(40, 40) rotate(12)">
                <path d="M8 20 L8 15 L5 15 L8 5 L11 15 L8 15" fill="#065f46"/>
                <path d="M15 20 L15 15 L12 15 L15 5 L18 15 L15 15" fill="#065f46"/>
                <path d="M22 20 L22 15 L19 15 L22 5 L25 15 L22 15" fill="#065f46"/>
                <rect x="7" y="15" width="2" height="5" fill="#065f46"/>
                <rect x="14" y="15" width="2" height="5" fill="#065f46"/>
                <rect x="21" y="15" width="2" height="5" fill="#065f46"/>
              </g>
              
              {/* Hunting Land - Exact target with crosshairs */}
              <g opacity="0.6" fill="#92400e" stroke="#92400e" transform="translate(85, 40) rotate(-8)">
                <circle cx="8" cy="8" r="7" fill="none" stroke="#92400e" strokeWidth="1.5"/>
                <circle cx="8" cy="8" r="4" fill="none" stroke="#92400e" strokeWidth="1.5"/>
                <circle cx="8" cy="8" r="1.5" fill="#92400e"/>
                <path d="M8 1 L8 4" stroke="#92400e" strokeWidth="1.5"/>
                <path d="M8 12 L8 15" stroke="#92400e" strokeWidth="1.5"/>
                <path d="M1 8 L4 8" stroke="#92400e" strokeWidth="1.5"/>
                <path d="M12 8 L15 8" stroke="#92400e" strokeWidth="1.5"/>
              </g>
              
              {/* Commercial Land - Exact building skyline */}
              <g opacity="0.5" fill="#7c3aed" stroke="#7c3aed" transform="translate(40, 85) rotate(5)">
                <rect x="2" y="8" width="5" height="12" fill="none" stroke="#7c3aed" strokeWidth="2"/>
                <rect x="7" y="5" width="6" height="15" fill="none" stroke="#7c3aed" strokeWidth="2"/>
                <rect x="13" y="10" width="5" height="10" fill="none" stroke="#7c3aed" strokeWidth="2"/>
                <rect x="3" y="12" width="1" height="1" fill="#7c3aed"/>
                <rect x="5" y="12" width="1" height="1" fill="#7c3aed"/>
                <rect x="9" y="8" width="1" height="1" fill="#7c3aed"/>
                <rect x="11" y="8" width="1" height="1" fill="#7c3aed"/>
                <rect x="14" y="13" width="1" height="1" fill="#7c3aed"/>
                <rect x="16" y="13" width="1" height="1" fill="#7c3aed"/>
              </g>
              
              {/* Residential Lots - Exact house with details */}
              <g opacity="0.6" fill="#dc2626" stroke="#dc2626" transform="translate(85, 85) rotate(-12)">
                <path d="M3 12 L12 6 L21 12 L21 18 L3 18 Z" stroke="#dc2626" strokeWidth="2" fill="none"/>
                <rect x="10" y="14" width="2" height="4" fill="#dc2626"/>
                <rect x="16" y="10" width="2" height="2" fill="none" stroke="#dc2626" strokeWidth="1"/>
                <rect x="6" y="10" width="2" height="2" fill="none" stroke="#dc2626" strokeWidth="1"/>
                <circle cx="11" cy="15" r="0.3" fill="#dc2626"/>
                <path d="M12 6 L12 4" stroke="#dc2626" strokeWidth="1"/>
              </g>
            </pattern>
            
            {/* Animated floating pattern overlay */}
            <pattern id="floatingDots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="#ffffff" opacity="0.1">
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite"/>
              </circle>
              <circle cx="15" cy="15" r="0.5" fill="#ffffff" opacity="0.05">
                <animate attributeName="opacity" values="0.05;0.2;0.05" dur="6s" repeatCount="indefinite"/>
              </circle>
              <circle cx="45" cy="45" r="0.8" fill="#ffffff" opacity="0.08">
                <animate attributeName="opacity" values="0.08;0.25;0.08" dur="5s" repeatCount="indefinite"/>
              </circle>
            </pattern>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#exactPropertyPattern)"/>
          <rect width="100%" height="100%" fill="url(#floatingDots)"/>
        </svg>
      </div>
      
      {/* Background overlay for text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 pt-6 sm:pt-10 md:pt-14 lg:pt-16 h-full flex flex-col justify-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-2 sm:mb-3 md:mb-4 animate-slide-up mobile-heading-xl">
          Find your <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">perfect</span> land
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-white/85 text-center max-w-xl md:max-w-2xl mx-auto mb-4 sm:mb-6 md:mb-8 animate-slide-up px-2" style={{ animationDelay: '0.1s' }}>
          AI-powered search across thousands of properties
        </p>
        
        {/* Zillow-inspired compact search */}
        <div className="mx-auto mb-4 sm:mb-6 w-full max-w-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <ZillowSearchBar 
            onSearchResults={handleSearchResults}
          />
        </div>
        
        {/* Mobile: Quick action chips */}
        <div className="flex md:hidden items-center justify-center gap-2 flex-wrap animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <a href="/properties?type=residential" className="px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20 touch-manipulation">
            Residential
          </a>
          <a href="/properties?type=agricultural" className="px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20 touch-manipulation">
            Agricultural
          </a>
          <a href="/properties?type=commercial" className="px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20 touch-manipulation">
            Commercial
          </a>
        </div>
      </div>
    </section>
  );
};

export default ZillowHero;