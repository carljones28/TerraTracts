import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, Loader2, MapPin, Ruler, Tag, Info } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AgentListingsProps {
  agentId?: number;
  currentPropertyId?: number;
}

const AgentListings: React.FC<AgentListingsProps> = ({ agentId, currentPropertyId }) => {
  const [activeTab, setActiveTab] = useState<string>("active");
  
  // Fetch agent's property listings
  const { data: properties, isLoading, error } = useQuery({
    queryKey: [`/api/agents/${agentId}/properties`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/properties`);
      if (!response.ok) throw new Error('Failed to fetch agent listings');
      return response.json();
    },
    enabled: !!agentId,
  });
  
  // Filter properties by status based on active tab
  const filteredProperties = React.useMemo(() => {
    if (!properties) return [];
    
    if (activeTab === "all") return properties;
    return properties.filter((property: any) => property.status === activeTab);
  }, [properties, activeTab]);
  
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "Price on request";
    
    if (numPrice >= 1000000) {
      return `$${(numPrice / 1000000).toFixed(1)}M`;
    } else if (numPrice >= 1000) {
      return `$${(numPrice / 1000).toFixed(0)}K`;
    } else {
      return `$${numPrice.toLocaleString()}`;
    }
  };
  
  const formatAcres = (acres: string) => {
    const numAcres = parseFloat(acres);
    if (isNaN(numAcres)) return "";
    
    if (numAcres === 1) {
      return "1 acre";
    } else {
      return `${numAcres.toLocaleString()} acres`;
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-gray-600">Loading property listings...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load property listings. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!properties || properties.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-lg p-8 text-center">
        <Info className="h-10 w-10 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Listed</h3>
        <p className="text-gray-600 mb-0">
          This agent doesn't have any properties listed at the moment.
        </p>
      </div>
    );
  }
  
  const activeCount = properties.filter((p: any) => p.status === "active").length;
  const pendingCount = properties.filter((p: any) => p.status === "pending").length;
  const soldCount = properties.filter((p: any) => p.status === "sold").length;
  
  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="active">
              Active {activeCount > 0 && `(${activeCount})`}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </TabsTrigger>
            <TabsTrigger value="sold">
              Sold {soldCount > 0 && `(${soldCount})`}
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({properties.length})
            </TabsTrigger>
          </TabsList>
          <Link 
            href={activeTab === "sold" ? `/agents/${agentId}?tab=sold` : `/agents/${agentId}`} 
            className="text-primary flex items-center hover:underline font-medium text-sm"
          >
            <span>View All</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <TabsContent value={activeTab} className="mt-0">
          {filteredProperties.length === 0 ? (
            <div className="bg-gray-50 border rounded-lg p-6 text-center">
              <p className="text-gray-600">
                No {activeTab === "all" ? "" : activeTab} properties available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property: any) => (
                <Card 
                  key={property.id} 
                  className={`overflow-hidden hover:shadow-md transition-shadow ${
                    property.id === currentPropertyId ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={Array.isArray(property.images) && property.images.length > 0 
                        ? property.images[0] 
                        : "https://images.unsplash.com/photo-1500382017468-9049fed747ef"}
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant={
                        property.status === "active" ? "default" :
                        property.status === "pending" ? "secondary" :
                        property.status === "sold" ? "outline" : "default"
                      }>
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="leading-tight line-clamp-2 text-lg">
                      {property.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span className="truncate">
                          {property.location || property.state || "Location not specified"}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Ruler className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span>{formatAcres(property.acreage)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Tag className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span className="font-medium text-black">
                          {formatPrice(property.price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className="w-full"
                      variant={property.id === currentPropertyId ? "secondary" : "default"}
                      asChild
                    >
                      <Link href={`/properties/${property.id}`}>
                        {property.id === currentPropertyId ? 'Current Property' : 'View Details'}
                        {property.id !== currentPropertyId && (
                          <ArrowRight className="ml-2 h-4 w-4" />
                        )}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentListings;