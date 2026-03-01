import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, ArrowLeft, MapPin, Calendar, Clock, Tag, Droplet, Mountain, Zap, Shrub, File, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PropertyVideoTour from '@/components/property/PropertyVideoTour';
import { PropertyDocuments } from '@/components/property/PropertyDocuments';
import { DirectContactModal } from '@/components/property/DirectContactModal';

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'Price on request';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'Price on request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numValue);
}

function PropertyViewContent() {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showDescriptionFull, setShowDescriptionFull] = useState(false);

  // Fetch property data
  const { 
    data: property, 
    isLoading, 
    error,
    isError 
  } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !isNaN(propertyId)
  });

  // Handle image navigation
  const nextImage = () => {
    if (!property?.images?.length) return;
    setActiveImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!property?.images?.length) return;
    setActiveImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  // Handle description toggle
  const toggleDescription = () => {
    setShowDescriptionFull(prev => !prev);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading property details...</span>
      </div>
    );
  }

  // Error state
  if (isError || !property) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Property</CardTitle>
            <CardDescription>
              We couldn't find the property you're looking for. It may have been removed or you don't have access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine if user is the owner or an agent
  const isOwner = user?.id === property.ownerId;
  const userCanEdit = isOwner || user?.role === 'admin' || user?.role === 'agent';

  // Format property status
  const getStatusBadge = () => {
    switch (property.status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500">Sold</Badge>;
      case 'expired':
        return <Badge className="bg-red-500">Expired</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge>{property.status}</Badge>;
    }
  };

  // Render images
  const renderImages = () => {
    if (!property.images || property.images.length === 0) {
      return (
        <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-lg">
          <p className="text-gray-500">No images available</p>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="aspect-video bg-gray-100 overflow-hidden rounded-lg relative">
          <img
            src={property.images[activeImageIndex]}
            alt={`Property ${activeImageIndex + 1}`}
            className="w-full h-full object-contain bg-slate-50"
            onError={(e) => {
              console.error("Failed to load image:", property.images[activeImageIndex]);
              // Set a fallback image from our uploads instead of Unsplash
              (e.target as HTMLImageElement).src = '/uploads/test-property-image.png';
              (e.target as HTMLImageElement).alt = 'Property image not available';
            }}
          />
          {property.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                aria-label="Previous image"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                aria-label="Next image"
              >
                <ArrowLeft size={20} className="rotate-180" />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {property.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-2 h-2 rounded-full ${
                      idx === activeImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {property.images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 overflow-hidden rounded ${
                  idx === activeImageIndex ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain bg-slate-50"
                  onError={(e) => {
                    console.error("Failed to load thumbnail:", img);
                    // Use the same local fallback image as the main image for consistency
                    (e.target as HTMLImageElement).src = '/uploads/test-property-image.png';
                    (e.target as HTMLImageElement).alt = 'Image not available';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Render property video tour
  const renderVideoTour = () => {
    return (
      <div className="mt-6">
        <PropertyVideoTour 
          videoUrl={property.videoUrl}
          propertyTitle={property.title || "Property"}
          thumbnailUrl={property.images && property.images.length > 0 ? property.images[0] : undefined}
          rawProperty={property} // Pass the entire property object so component can check both video URL formats
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{property.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center text-gray-500">
                <MapPin size={16} className="mr-1" />
                <span>{property.location}, {property.state}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Tag size={16} className="mr-1" />
                <span className="capitalize">{property.propertyType}</span>
              </div>
              {getStatusBadge()}
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:items-end">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(property.price)}
            </div>
            <div className="text-gray-500 mt-1">
              {property.acreage} acres
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Property Images */}
          {renderImages()}
          
          {/* Property Video Tour */}
          {renderVideoTour()}

          {/* Property Details Tabs */}
          <Tabs defaultValue="details" className="mt-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className={showDescriptionFull ? "" : "max-h-36 overflow-hidden relative"}
                  >
                    <p className="whitespace-pre-line">{property.description}</p>
                    {!showDescriptionFull && property.description && property.description.length > 200 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent"></div>
                    )}
                  </div>
                  {property.description && property.description.length > 200 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleDescription}
                      className="mt-2"
                    >
                      {showDescriptionFull ? 'Show Less' : 'Read More'}
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Property ID</p>
                      <p className="font-medium">{property.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">{formatCurrency(property.price)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Acreage</p>
                      <p className="font-medium">{property.acreage} acres</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Property Type</p>
                      <p className="font-medium capitalize">{property.propertyType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{property.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Listed</p>
                      <p className="font-medium">{formatDate(property.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Features & Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Terrain & Resources */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Mountain className="mr-2 h-5 w-5" />
                        Terrain & Resources
                      </h3>
                      <div className="space-y-2">
                        {property.terrainType && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Terrain:</span>
                            <span>{property.terrainType}</span>
                          </div>
                        )}
                        {property.vegetation && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Vegetation:</span>
                            <span>{property.vegetation}</span>
                          </div>
                        )}
                        {property.waterResources && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Water:</span>
                            <span>{property.waterResources}</span>
                          </div>
                        )}
                        {property.roadAccess && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Road Access:</span>
                            <span>{property.roadAccess}</span>
                          </div>
                        )}
                        {property.zoning && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-28">Zoning:</span>
                            <span>{property.zoning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Utilities & Amenities */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Zap className="mr-2 h-5 w-5" />
                        Utilities & Amenities
                      </h3>
                      
                      {property.utilities && property.utilities.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Utilities</h4>
                          <div className="flex flex-wrap gap-2">
                            {property.utilities.map((utility, i) => (
                              <Badge key={i} variant="secondary">{utility}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {property.amenities && property.amenities.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Amenities</h4>
                          <div className="flex flex-wrap gap-2">
                            {property.amenities.map((amenity, i) => (
                              <Badge key={i} variant="secondary">{amenity}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {property.features && property.features.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {property.features.map((feature, i) => (
                              <Badge key={i} variant="secondary">{feature}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 flex flex-wrap gap-3">
                        {property.isWaterfront && (
                          <div className="flex items-center">
                            <Droplet className="mr-1 h-4 w-4 text-blue-500" />
                            <span>Waterfront Property</span>
                          </div>
                        )}
                        {property.isMountainView && (
                          <div className="flex items-center">
                            <Mountain className="mr-1 h-4 w-4 text-green-700" />
                            <span>Mountain View</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Location Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Address</h3>
                      <p>{property.location}, {property.state}</p>
                    </div>
                    
                    {(property.latitude && property.longitude) ? (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                        <iframe
                          title="Property Location Map"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${property.latitude},${property.longitude}&zoom=12`}
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
                        <p className="text-gray-500">No map coordinates available</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Latitude</p>
                        <p className="font-medium">{property.latitude || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Longitude</p>
                        <p className="font-medium">{property.longitude || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Emergency Documents Section */}
          <div className="mt-8 p-4 bg-red-500 text-white rounded-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <FileText className="mr-2 h-6 w-6" />
              PROPERTY DOCUMENTS
            </h2>
            
            {/* Manual Document Rendering */}
            <div className="p-4 bg-white text-black rounded-lg">
              {property.documents && Array.isArray(property.documents) && property.documents.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-bold">Documents Available ({property.documents.length}):</p>
                  {property.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center text-red-500 border-red-500"
                          onClick={() => {
                            const url = doc.url.startsWith('http') ? doc.url : window.location.origin + (doc.url.startsWith('/') ? '' : '/') + doc.url;
                            window.open(url, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span>View Document</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-slate-900">No documents available</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This property doesn't have any documents attached
                  </p>
                </div>
              )}
            </div>
            
            {/* Debug info */}
            <div className="mt-4 bg-black text-white p-2 text-sm rounded">
              <p>Debug Info:</p>
              <p>Property ID: {property.id}</p>
              <p>Has documents property: {property.documents ? 'Yes' : 'No'}</p>
              <p>Documents is array: {property.documents && Array.isArray(property.documents) ? 'Yes' : 'No'}</p>
              <p>Documents count: {property.documents && Array.isArray(property.documents) ? property.documents.length : 0}</p>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Property Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userCanEdit && (
                <Button
                  className="w-full"
                  onClick={() => setLocation(`/properties/${property.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Property
                </Button>
              )}
              
              <DirectContactModal
                property={{
                  id: property.id,
                  title: property.title,
                  price: property.price,
                  location: property.location,
                  state: property.state,
                  size: property.acreage,
                  propertyType: property.propertyType,
                  images: property.images || []
                }}
                triggerButton={
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Contact Seller
                  </Button>
                }
              />
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Handle share functionality
                  const url = window.location.href;
                  navigator.clipboard.writeText(url).then(
                    () => {
                      toast({
                        title: "Link copied",
                        description: "Property link copied to clipboard",
                      });
                    },
                    (err) => {
                      console.error('Could not copy text: ', err);
                      toast({
                        title: "Copy failed",
                        description: "Could not copy link to clipboard",
                        variant: "destructive"
                      });
                    }
                  );
                }}
              >
                Share Property
              </Button>
            </CardContent>
          </Card>
          
          {/* Agent Card - Only show if there's an agent info */}
          {property.listingAgentId && (
            <Card>
              <CardHeader>
                <CardTitle>Listing Agent</CardTitle>
              </CardHeader>
              <CardContent>
                {/* We'd need to fetch agent info here */}
                <p className="text-gray-500">Contact the listing agent for more information.</p>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    // Handle contact agent logic
                    toast({
                      title: "Feature coming soon",
                      description: "Agent contact feature is under development",
                    });
                  }}
                >
                  Contact Agent
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Similar Properties Card */}
          <Card>
            <CardHeader>
              <CardTitle>Similar Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Similar properties feature is coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main component
export default function PropertyViewPage() {
  return <PropertyViewContent />;
}