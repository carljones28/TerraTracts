import { useLocation } from 'wouter';
import { useState, useEffect, useCallback } from 'react';
import { Mountain, Trees, Droplets, Building2, Wheat, Home, Castle, MapPin, Wind } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

interface CategoryItem {
  icon: JSX.Element;
  label: string;
  value: string;
  imageUrl: string;
  count: number;
}

const PropertyCategories = () => {
  const [_, navigate] = useLocation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const categories: CategoryItem[] = [
    {
      icon: <Home className="h-5 w-5 text-blue-600" />,
      label: 'Residential Lots',
      value: 'residential',
      imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      count: 47
    },
    {
      icon: <Castle className="h-5 w-5 text-green-600" />,
      label: 'Agricultural Land',
      value: 'agricultural',
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80',
      count: 53
    },
    {
      icon: <Mountain className="h-5 w-5 text-purple-600" />,
      label: 'Recreational Land',
      value: 'recreational',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      count: 45
    },
    {
      icon: <Droplets className="h-5 w-5 text-cyan-600" />,
      label: 'Waterfront',
      value: 'waterfront',
      imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      count: 42
    },
    {
      icon: <Trees className="h-5 w-5 text-emerald-600" />,
      label: 'Timberland',
      value: 'timberland',
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      count: 38
    },
    {
      icon: <Wind className="h-5 w-5 text-amber-600" />,
      label: 'Hunting Land',
      value: 'hunting',
      imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      count: 29
    },
    {
      icon: <Building2 className="h-5 w-5 text-slate-600" />,
      label: 'Commercial',
      value: 'commercial',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      count: 31
    },
    {
      icon: <MapPin className="h-5 w-5 text-red-600" />,
      label: 'Investment',
      value: 'investment',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80',
      count: 22
    }
  ];

  useEffect(() => {
    if (!emblaApi) return undefined;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleCategoryClick = (category: string) => {
    // Navigate to properties page with category filter and trigger map view
    navigate(`/properties?propertyType=${category}&view=map`);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Browse by Category</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover your perfect property from our diverse selection of land types
          </p>
        </div>
        
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {categories.map((category) => (
                <div 
                  key={category.value}
                  className="flex-none w-80 group cursor-pointer"
                  onClick={() => handleCategoryClick(category.value)}
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={category.imageUrl} 
                        alt={category.label} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      
                      {/* Icon overlay */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-full shadow-lg">
                          {category.icon}
                        </div>
                      </div>
                      
                      {/* Content overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {category.label}
                          </h3>
                          <p className="text-white/90 text-sm font-medium">
                            {category.count} properties available
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
            <button 
              onClick={scrollPrev} 
              className="pointer-events-auto bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 text-gray-700 hover:text-blue-600"
              aria-label="Previous categories"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={scrollNext} 
              className="pointer-events-auto bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 text-gray-700 hover:text-blue-600"
              aria-label="Next categories"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center mt-8 gap-2">
          {categories.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === selectedIndex 
                  ? 'bg-blue-600 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertyCategories;