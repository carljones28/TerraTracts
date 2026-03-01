import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PropertyCard from '@/components/home/PropertyCard';
import { MapPin, Loader2, Filter, SortDesc } from 'lucide-react';

// Land categories with their descriptions
const CATEGORIES = [
  {
    id: 'residential',
    name: 'Residential Land',
    description: 'Perfect for building your dream home',
    icon: '🏡',
    features: ['Building sites', 'Utility access', 'Road frontage', 'Subdivision potential']
  },
  {
    id: 'recreational',
    name: 'Recreational Land',
    description: 'Ideal for outdoor activities and adventures',
    icon: '🏕️',
    features: ['Hunting grounds', 'Fishing access', 'Camping sites', 'ATV trails']
  },
  {
    id: 'farmland',
    name: 'Farmland',
    description: 'Prime agricultural property for farming operations',
    icon: '🌾',
    features: ['Fertile soil', 'Irrigation systems', 'Equipment storage', 'Crop production']
  },
  {
    id: 'commercial',
    name: 'Commercial Land',
    description: 'Strategic locations for business development',
    icon: '🏢',
    features: ['High traffic areas', 'Development potential', 'Commercial zoning', 'Investment opportunity']
  },
  {
    id: 'waterfront',
    name: 'Waterfront Property',
    description: 'Beautiful properties with water access',
    icon: '🌊',
    features: ['Lake views', 'River frontage', 'Ocean access', 'Beach rights']
  },
  {
    id: 'mountain',
    name: 'Mountain Property',
    description: 'Scenic land with mountain views and elevations',
    icon: '⛰️',
    features: ['Panoramic views', 'Hiking trails', 'Privacy', 'Natural beauty']
  },
  {
    id: 'ranch',
    name: 'Ranch Land',
    description: 'Large acreage ideal for livestock and ranch operations',
    icon: '🐎',
    features: ['Grazing land', 'Fencing', 'Water rights', 'Outbuildings']
  },
  {
    id: 'hunting',
    name: 'Hunting Land',
    description: 'Prime locations for wildlife and hunting enthusiasts',
    icon: '🦌',
    features: ['Wildlife habitats', 'Food plots', 'Hunting blinds', 'Trail systems']
  },
  {
    id: 'timberland',
    name: 'Timberland',
    description: 'Forested land with timber harvesting potential',
    icon: '🌲',
    features: ['Mature trees', 'Sustainable forestry', 'Conservation potential', 'Investment value']
  }
];

export default function LandCategories() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('residential');
  
  // Fetch properties for the active category
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['/api/properties/type', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/properties/type/${activeTab}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    },
  });
  
  const handleViewPropertyDetails = (propertyId: number) => {
    navigate(`/properties/${propertyId}`);
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Land Categories</h1>
          <p className="text-xl max-w-3xl">
            Explore our diverse selection of land properties categorized by type and purpose
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <Tabs 
          defaultValue="residential" 
          className="mb-10"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Browse by Category</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <SortDesc className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>
          
          <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {CATEGORIES.map((category) => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex items-center px-4 py-2"
              >
                <span className="mr-2">{category.icon}</span>
                <span className="hidden md:inline">{category.name.split(' ')[0]}</span>
                <span className="hidden lg:inline">{category.name.includes(' ') ? ' ' + category.name.split(' ').slice(1).join(' ') : ''}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {CATEGORIES.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                  </div>
                  
                  <div className="md:ml-8 bg-slate-50 p-4 rounded-lg mt-4 md:mt-0">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Common Features</h4>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {category.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-center">
                          <span className="text-primary mr-2">✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                    <p className="text-slate-500">Loading properties...</p>
                  </div>
                </div>
              ) : error ? (
                <Card className="my-6">
                  <CardContent className="py-8 text-center">
                    <p className="text-red-500 font-medium">Failed to load properties. Please try again later.</p>
                  </CardContent>
                </Card>
              ) : properties.length === 0 ? (
                <Card className="my-6">
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      No {category.name.toLowerCase()} properties found. Check back later!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {properties.map((property: any) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onViewDetails={() => handleViewPropertyDetails(property.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Popular Locations */}
        <section className="mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Popular Locations</h2>
            <Button variant="link" onClick={() => navigate('/properties')}>
              View all locations
            </Button>
          </div>
          
          {/* State cards with short description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Texas', description: 'Wide open spaces with abundant ranch and farmland opportunities', icon: '🤠' },
              { name: 'Florida', description: 'Beautiful waterfront properties and investment opportunities', icon: '🌴' },
              { name: 'Colorado', description: 'Breathtaking mountain views and recreational properties', icon: '⛰️' },
              { name: 'Montana', description: 'Vast ranches and pristine wilderness properties', icon: '🏔️' }
            ].map((state) => (
              <Card 
                key={state.name} 
                className="overflow-hidden transition-all hover:shadow-md cursor-pointer border-slate-200"
                onClick={() => navigate(`/properties?state=${state.name}`)}
              >
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 text-white flex items-center justify-between">
                  <h3 className="font-semibold">{state.name}</h3>
                  <span className="text-2xl">{state.icon}</span>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-600">{state.description}</p>
                  <div className="mt-4 flex items-center text-primary text-sm font-medium">
                    <span>View properties</span>
                    <MapPin className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Additional states as buttons */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-500 mb-3">More States</h3>
            <div className="flex flex-wrap gap-2">
              {['Arizona', 'California', 'Idaho', 'Nevada', 'New Mexico', 'Oregon', 'Utah', 'Washington', 'Wyoming'].map((state) => (
                <Button 
                  key={state} 
                  variant="outline" 
                  size="sm"
                  className="h-auto py-2"
                  onClick={() => navigate(`/properties?state=${state}`)}
                >
                  {state}
                </Button>
              ))}
            </div>
          </div>
        </section>
        
        {/* Educational Resources */}
        <section className="mt-16 mb-8 pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-bold mb-6">Learn About Land Investing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-primary text-3xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">Land Investment Guide</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Essential tips for evaluating land as an investment opportunity, including due diligence checklists.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/resources')}>
                  Read the guide
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-primary text-3xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">TerraNova AI Analysis</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Discover how our AI-powered tools can help you make better land purchasing decisions.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/resources#ai-tools')}>
                  Explore AI tools
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-primary text-3xl mb-4">📈</div>
                <h3 className="text-lg font-semibold mb-2">Market Trends</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Stay updated on the latest land market trends and opportunities in different regions.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/resources#market-trends')}>
                  View trends
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}