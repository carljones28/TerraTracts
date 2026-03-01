import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropertyCard from './PropertyCard';

interface RecentlyViewedProps {
  onViewDetails: (propertyId: number) => void;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number | string;
  acreage: number | string;
  location: string;
  images: string[];
  propertyType?: string;
  amenities?: string[];
}

const RecentlyViewed = ({ onViewDetails }: RecentlyViewedProps) => {
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  
  useEffect(() => {
    // In a real app, this would come from localStorage or a user's session
    // For now, we'll simulate it by getting 5 random properties from the API
    const fetchRecentProperties = async () => {
      try {
        const response = await fetch('/api/properties');
        const allProperties = await response.json();
        
        // Randomly select 5 properties
        const shuffled = [...allProperties].sort(() => 0.5 - Math.random());
        setRecentProperties(shuffled.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recent properties:', error);
      }
    };
    
    fetchRecentProperties();
  }, []);
  
  const scrollLeft = () => {
    const container = document.getElementById('recently-viewed-container');
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    const container = document.getElementById('recently-viewed-container');
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (recentProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Recently Viewed</h2>
            <p className="text-slate-600">Properties you've explored before</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={scrollLeft}
              className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={scrollRight}
              className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div 
          id="recently-viewed-container"
          className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar"
        >
          {recentProperties.map((property) => (
            <div key={property.id} className="min-w-[320px] snap-start">
              <PropertyCard 
                property={property}
                onViewDetails={() => onViewDetails(property.id)}
              />
            </div>
          ))}
        </div>
        
        {/* CSS for hiding scrollbar */}
      </div>
    </section>
  );
};

export default RecentlyViewed;