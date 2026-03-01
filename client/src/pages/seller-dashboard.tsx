import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, PlusCircle, Home, LineChart, Users, MessageSquare, Settings, 
  BookOpenCheck, BarChart3, Eye, Mail, Clock, Upload, FolderUp, FileUp, Link2,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LandProperty } from "@shared/schema";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AssetUploadHub } from "@/components/dashboard/AssetUploadHub";
import { PropertyImporter } from "@/components/dashboard/PropertyImporter";

export default function SellerDashboard() {
  return (
    <ProtectedRoute requiredRole="seller">
      <SellerDashboardContent />
    </ProtectedRoute>
  );
}

function SellerDashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [importedProperties, setImportedProperties] = useState<any[]>([]);
  const [propertyToEdit, setPropertyToEdit] = useState<any>(null);
  
  // Fetch user's properties
  const { data: myProperties, isLoading: propertiesLoading, refetch: refetchProperties } = useQuery<LandProperty[]>({
    queryKey: ['/api/properties/my-properties'],
    enabled: !!user,
  });
  
  // Mutation for creating a new property
  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create property');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      refetchProperties();
    },
  });
  
  // Fetch property inquiries
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery<any[]>({
    queryKey: ['/api/inquiries'],
    enabled: !!user,
  });
  
  // Mock data (would be replaced with actual API data)
  const propertyViews = {
    total: 253,
    change: 23,
    data: [12, 18, 24, 32, 28, 35, 42, 38, 42, 48, 52, 56]
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Seller Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your property listings and track interested buyers
          </p>
        </div>
        
        <Button className="flex items-center" asChild>
          <Link href="/properties/create">
            <PlusCircle className="mr-2 h-4 w-4" /> List a Property
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full md:w-auto mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Home className="mr-2 h-4 w-4 text-primary" /> Active Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myProperties?.filter(p => p.status === 'active').length || 0}</div>
                <p className="text-sm text-gray-500 mt-1">Properties for sale</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Eye className="mr-2 h-4 w-4 text-primary" /> Property Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold">{propertyViews.total}</div>
                  <div className="text-xs text-green-600 mb-1 flex items-center">
                    +{propertyViews.change}%
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4 text-primary" /> New Inquiries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{inquiries?.filter(i => i.status === 'new').length || 0}</div>
                <p className="text-sm text-gray-500 mt-1">Unread messages</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-4 w-4 text-primary" /> Interested Buyers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">18</div>
                <p className="text-sm text-gray-500 mt-1">In the last 30 days</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Listing Performance</CardTitle>
                  <CardDescription>
                    How your properties are performing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {propertiesLoading ? (
                    <div className="space-y-4 animate-pulse">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i}>
                          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                          <div className="h-8 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : myProperties?.length ? (
                    myProperties.slice(0, 3).map(property => (
                      <div key={property.id}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900">
                            <Link href={`/properties/${property.id}`} className="hover:text-primary transition-colors">
                              {property.title}
                            </Link>
                          </h3>
                          <Badge variant={property.status === 'active' ? 'default' : 'outline'}>
                            {property.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                          <span>Views: 86</span>
                          <span>Save rate: 12%</span>
                          <span>Inquiries: 5</span>
                        </div>
                        <Progress value={65} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1 text-right">65% visibility compared to similar listings</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-gray-50 rounded-full p-6 inline-block mb-3">
                        <Home className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No active listings</h3>
                      <p className="text-gray-600 mt-1">
                        Create your first property listing to start tracking performance.
                      </p>
                      <Button className="mt-4" asChild>
                        <Link href="/properties/create">Create Listing</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Inquiries</CardTitle>
                <CardDescription>
                  Latest messages from potential buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inquiriesLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : inquiries?.length ? (
                  inquiries.slice(0, 3).map(inquiry => (
                    <div key={inquiry.id} className="flex items-start gap-3 pb-3 border-b border-gray-100">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                        {inquiry.fromUser?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{inquiry.subject}</p>
                        <p className="text-gray-600 text-sm line-clamp-1">{inquiry.message}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {inquiry.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(inquiry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No inquiries yet</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="#inquiries" onClick={() => setActiveTab("inquiries")}>
                    View All Inquiries
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Seller Resources */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Seller Resources</h2>
              <Button variant="link" asChild>
                <Link href="/resources" className="flex items-center">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/maximizing-property-value">Maximizing Your Property's Value</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Strategies to enhance your land's appeal and increase its market value.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Settings className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/prepare-for-sale">Preparing Your Land for Sale</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Essential steps to take before listing your property on the market.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <BookOpenCheck className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/legal-guide">Legal Guide for Land Sellers</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Understanding contracts, disclosure requirements, and other legal aspects.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="listings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Properties</h2>
            <Button asChild>
              <Link href="/properties/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Listing
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Listings</CardTitle>
              <CardDescription>
                Properties currently available for sale
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="space-y-4 animate-pulse">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex">
                      <div className="h-24 w-32 bg-gray-200 rounded"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myProperties?.filter(p => p.status === 'active').length ? (
                <div className="space-y-4">
                  {myProperties.filter(p => p.status === 'active').map(property => (
                    <div key={property.id} className="flex border-b border-gray-100 pb-4 group">
                      <Link href={`/properties/${property.id}`} className="h-24 w-32 relative overflow-hidden rounded">
                        <img 
                          src={Array.isArray(property.images) && property.images.length > 0 
                            ? property.images[0] 
                            : "https://images.unsplash.com/photo-1500382017468-9049fed747ef"}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                            <Link href={`/properties/${property.id}`}>{property.title}</Link>
                          </h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/properties/${property.id}/edit`}>Edit</Link>
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm">{property.location}</p>
                        <div className="flex justify-between mt-2">
                          <p className="text-lg font-bold text-primary">
                            ${Number(property.price).toLocaleString()}
                          </p>
                          <div className="text-sm text-gray-600">
                            Views: {property.views || 0} · Inquiries: 3
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full p-6 inline-block mb-3">
                    <Home className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No active listings</h3>
                  <p className="text-gray-600 mt-1">
                    Create your first property listing to start selling.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/properties/create">Create Listing</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Imported Properties</CardTitle>
              <CardDescription>
                Properties imported but not yet published for sale
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importedProperties.length ? (
                <div className="space-y-4">
                  {importedProperties.map((property, index) => (
                    <div key={index} className="flex border-b border-gray-100 pb-4 group">
                      <div className="h-24 w-32 relative overflow-hidden rounded">
                        <img 
                          src={Array.isArray(property.images) && property.images.length > 0 
                            ? property.images[0] 
                            : "https://images.unsplash.com/photo-1500382017468-9049fed747ef"}
                          alt={property.title || "Property"}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-gray-900">
                            {property.title || "Imported Property"}
                          </h3>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setPropertyToEdit(property);
                                setActiveTab("tools");
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => {
                                try {
                                  // Handle publishing property
                                  console.log('Publishing property:', property);
                                  
                                  // Convert the imported property to the format expected by the API
                                  // NOTE: The API expects price and acreage as strings, not numbers
                                  // Safely extract coordinates, ensuring we have valid numeric values
                                  let longitude = 0;
                                  let latitude = 0;
                                  
                                  // Try to parse coordinates based on data type
                                  try {
                                    if (property.coordinates) {
                                      // Handle array format [longitude, latitude] (MapBox format)
                                      if (Array.isArray(property.coordinates)) {
                                        if (property.coordinates.length >= 2) {
                                          longitude = parseFloat(property.coordinates[0]) || 0;
                                          latitude = parseFloat(property.coordinates[1]) || 0;
                                          console.log('Using coordinates from array:', longitude, latitude);
                                        }
                                      } 
                                      // Handle string format (PostGIS POINT)
                                      else if (typeof property.coordinates === 'string') {
                                        if (property.coordinates.includes('POINT(')) {
                                          const coordPart = property.coordinates.split('POINT(')[1].split(')')[0].trim();
                                          const coordArray = coordPart.split(' ');
                                          if (coordArray.length >= 2) {
                                            longitude = parseFloat(coordArray[0]);
                                            latitude = parseFloat(coordArray[1]);
                                            console.log('Using coordinates from POINT string:', longitude, latitude);
                                          }
                                        }
                                      }
                                      // Handle object format with lat/lng properties
                                      else if (typeof property.coordinates === 'object') {
                                        if ('longitude' in property.coordinates && 'latitude' in property.coordinates) {
                                          longitude = parseFloat(property.coordinates.longitude) || 0;
                                          latitude = parseFloat(property.coordinates.latitude) || 0;
                                          console.log('Using coordinates from object:', longitude, latitude);
                                        } else if ('lng' in property.coordinates && 'lat' in property.coordinates) {
                                          longitude = parseFloat(property.coordinates.lng) || 0;
                                          latitude = parseFloat(property.coordinates.lat) || 0;
                                          console.log('Using coordinates from object (lng/lat):', longitude, latitude);
                                        }
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error parsing coordinates:', error);
                                  }
                                  
                                  // Fallback to property.longitude and property.latitude if coordinates parsing failed
                                  if (isNaN(longitude) || isNaN(latitude) || (longitude === 0 && latitude === 0)) {
                                    console.log('Falling back to direct longitude/latitude properties');
                                    longitude = typeof property.longitude === 'string' ? parseFloat(property.longitude) : 
                                               (typeof property.longitude === 'number' ? property.longitude : 0);
                                    latitude = typeof property.latitude === 'string' ? parseFloat(property.latitude) : 
                                              (typeof property.latitude === 'number' ? property.latitude : 0);
                                  }
                                  
                                  // Handle images properly based on the property format
                                  let images: string[] = [];
                                  
                                  // If property has assets array (from PropertyImporter)
                                  if (property.assets && Array.isArray(property.assets)) {
                                    images = property.assets
                                      .filter((a: { type: string, selected: boolean }) => a.type === 'image' && a.selected)
                                      .map((a: { url: string }) => a.url);
                                    console.log(`Found ${images.length} images from assets array`);
                                  } 
                                  // If property has images array (from transformed object)
                                  else if (property.images && Array.isArray(property.images)) {
                                    images = property.images;
                                    console.log(`Found ${images.length} images from images array`);
                                  }
                                  
                                  // Ensure we have valid coordinates - use center of US if all else fails
                                  if (isNaN(longitude) || isNaN(latitude) || (longitude === 0 && latitude === 0)) {
                                    console.log('No valid coordinates found, using fallback');
                                    longitude = -98.5795; // Center of US
                                    latitude = 39.8283;
                                  }
                                  
                                  // Ensure we have valid property data
                                  const propertyToSubmit = {
                                    title: property.title || 'Imported Property',
                                    description: property.description || '',
                                    price: property.price ? String(property.price) : '0',
                                    acreage: property.acreage ? String(property.acreage) : '0',
                                    location: property.location || 'Unknown Location',
                                    propertyType: property.propertyType || 'land',
                                    status: 'active',
                                    features: property.features || [],
                                    images: images,
                                    longitude: String(longitude),
                                    latitude: String(latitude),
                                    // Also include the coordinates in MapBox format for the server to use
                                    coordinates: [longitude, latitude],
                                    state: property.state || 'Unknown',
                                    ownerId: user?.id
                                  };
                                  
                                  // Call the create property mutation
                                  createPropertyMutation.mutate(propertyToSubmit, {
                                    onSuccess: (data) => {
                                      // Remove from imported properties
                                      setImportedProperties(prev => prev.filter((_, i) => i !== index));
                                      alert('Property published successfully!');
                                    },
                                    onError: (error) => {
                                      alert(`Failed to publish property: ${error.message}`);
                                    }
                                  });
                                } catch (error) {
                                  console.error('Error publishing property:', error);
                                  alert(`Error publishing property: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                }
                              }}
                              disabled={createPropertyMutation.isPending}
                            >
                              {createPropertyMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Publishing...
                                </>
                              ) : (
                                'Publish'
                              )}
                            </Button>

                          </div>
                        </div>
                        <p className="text-gray-500 text-sm">{property.location || "Location pending"}</p>
                        <div className="flex justify-between mt-2">
                          <p className="text-lg font-bold text-primary">
                            ${Number(property.price || 0).toLocaleString()}
                          </p>
                          <Badge variant="outline">Draft</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full p-6 inline-block mb-3">
                    <Upload className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No imported properties</h3>
                  <p className="text-gray-600 mt-1">
                    Import properties using the tools section to start preparing listings.
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab("tools")}>
                    Go to Tools
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Other Listings</CardTitle>
              <CardDescription>
                Properties that are pending, sold, or expired
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="space-y-4 animate-pulse">
                  {Array(2).fill(0).map((_, i) => (
                    <div key={i} className="flex">
                      <div className="h-24 w-32 bg-gray-200 rounded"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myProperties?.filter(p => p.status !== 'active').length ? (
                <div className="space-y-4">
                  {myProperties.filter(p => p.status !== 'active').map(property => (
                    <div key={property.id} className="flex border-b border-gray-100 pb-4 group">
                      <Link href={`/properties/${property.id}`} className="h-24 w-32 relative overflow-hidden rounded">
                        <img 
                          src={Array.isArray(property.images) && property.images.length > 0 
                            ? property.images[0] 
                            : "https://images.unsplash.com/photo-1500382017468-9049fed747ef"}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="outline" className="bg-white">
                            {property.status}
                          </Badge>
                        </div>
                      </Link>
                      <div className="ml-4 flex-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                          <Link href={`/properties/${property.id}`}>{property.title}</Link>
                        </h3>
                        <p className="text-gray-500 text-sm">{property.location}</p>
                        <div className="flex justify-between mt-2">
                          <p className="text-lg font-bold text-primary">
                            ${Number(property.price).toLocaleString()}
                          </p>
                          <div className="flex gap-2">
                            {property.status === 'sold' ? (
                              <Button variant="outline" size="sm">Download Records</Button>
                            ) : property.status === 'expired' ? (
                              <Button variant="outline" size="sm">Relist</Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No pending, sold, or expired listings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inquiries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buyer Inquiries</CardTitle>
              <CardDescription>
                Messages from interested buyers about your properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inquiriesLoading ? (
                <div className="space-y-6 animate-pulse">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5 mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : inquiries?.length ? (
                <div className="space-y-6">
                  {inquiries.map(inquiry => (
                    <Card key={inquiry.id} className={`border ${inquiry.status === 'new' ? 'border-primary/50' : 'border-gray-200'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{inquiry.subject}</CardTitle>
                          <Badge variant={inquiry.status === 'new' ? 'default' : 'outline'}>
                            {inquiry.status}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <span>From: {inquiry.fromUser?.firstName} {inquiry.fromUser?.lastName}</span>
                          <span>•</span>
                          <span>Property: {inquiry.property?.title}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{inquiry.message}</p>
                        <div className="text-sm text-gray-500 mb-3">
                          Received: {new Date(inquiry.createdAt).toLocaleDateString()} at {new Date(inquiry.createdAt).toLocaleTimeString()}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${inquiry.propertyId}`}>View Property</Link>
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Mark as Read</Button>
                          <Button size="sm">Reply</Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full p-6 inline-block mb-3">
                    <MessageSquare className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No inquiries yet</h3>
                  <p className="text-gray-600 mt-1 max-w-md mx-auto">
                    When potential buyers contact you about your properties, their messages will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Performance Analytics</CardTitle>
              <CardDescription>
                Insights to help you understand how your listings are performing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Visitor Trends (Last 30 Days)</h3>
                  <div className="bg-gray-50 p-4 rounded-lg h-64 flex items-center justify-center">
                    <div className="w-full h-full flex items-end justify-between gap-1 px-4">
                      {propertyViews.data.map((value, index) => (
                        <div 
                          key={index}
                          className="bg-primary hover:bg-primary/80 transition-colors rounded-t w-full"
                          style={{ height: `${(value / Math.max(...propertyViews.data)) * 100}%` }}
                          title={`Day ${index + 1}: ${value} views`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Apr 1</span>
                    <span>Apr 15</span>
                    <span>Apr 30</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Visitor Demographics</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Location</span>
                          <span className="text-sm text-gray-600">58%</span>
                        </div>
                        <Progress value={58} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">California, Washington, Oregon</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Buyer Type</span>
                          <span className="text-sm text-gray-600">72%</span>
                        </div>
                        <Progress value={72} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">Individual buyers, Developers</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Budget Range</span>
                          <span className="text-sm text-gray-600">45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">$100k-$250k</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">How Buyers Find Your Properties</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Direct search</span>
                        <span className="text-sm font-medium">42%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Map browsing</span>
                        <span className="text-sm font-medium">27%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Recommendations</span>
                        <span className="text-sm font-medium">18%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Saved searches</span>
                        <span className="text-sm font-medium">13%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Market Insights</CardTitle>
              <CardDescription>
                Current trends in the land market relevant to your properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <LineChart className="mr-2 h-4 w-4 text-green-500" /> Price Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-500">+4.2%</div>
                    <p className="text-sm text-gray-500 mt-1">Average price increase in your region</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-blue-500" /> Time on Market
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">62 days</div>
                    <p className="text-sm text-gray-500 mt-1">Average days to sell similar properties</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="mr-2 h-4 w-4 text-purple-500" /> Buyer Interest
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-purple-500">High</div>
                    <p className="text-sm text-gray-500 mt-1">Current demand in your price range</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8">
                <h3 className="font-medium text-gray-900 mb-3">Local Market Report</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">
                    Land properties in your area are seeing strong demand, particularly for recreational and residential development parcels. 
                    Buyers are increasingly interested in properties with water features, established utilities, and easy access.
                    Properties in the $150,000-$300,000 range are selling the fastest, with an average of 45-60 days on market.
                  </p>
                  <Button variant="link" className="px-0 mt-2">
                    <Link href="/resources/market-report" className="flex items-center">
                      Read full market report <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Property Tools</h2>
            <p className="text-gray-600">
              Useful tools to help manage your property listings
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <AssetUploadHub 
                propertyTitle={myProperties?.find(p => p.status === 'active')?.title}
                propertyId={myProperties?.find(p => p.status === 'active')?.id}
              />
            </div>
            
            <div>
              <PropertyImporter
                initialData={propertyToEdit}
                onImportComplete={(data) => {
                  console.log('Import complete with data:', data);
                  alert('Property import completed! Continuing to listings tab.');
                  
                  try {
                    // Create a transformed object that matches the expected format
                    const transformedProperty = {
                      title: data.title || 'New Imported Property',
                      description: data.description || '',
                      price: data.price,
                      acreage: data.acreage,
                      location: data.location,
                      state: data.state,
                      images: data.assets
                        .filter(asset => asset.type === 'image' && asset.selected)
                        .map(asset => asset.url),
                      sourceUrl: data.sourceUrl
                    };
                    
                    console.log('Transformed property data:', transformedProperty);
                    
                    // If we're editing an existing imported property
                    if (propertyToEdit) {
                      // Replace the existing property with the edited one
                      setImportedProperties(prev => 
                        prev.map(p => p === propertyToEdit ? transformedProperty : p)
                      );
                      // Clear the edit state
                      setPropertyToEdit(null);
                    } else {
                      // Add new property to imported properties
                      setImportedProperties(prev => [...prev, transformedProperty]);
                    }
                    
                    // Switch to listings tab to show the imported property
                    setActiveTab("listings");
                  } catch (err) {
                    console.error('Error processing imported property:', err);
                    alert('There was an error processing the imported property. See console for details.');
                  }
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}