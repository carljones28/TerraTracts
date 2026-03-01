import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, PlusCircle, Home, LineChart, Users, MessageSquare, 
  Briefcase, BookOpenCheck, BarChart3, Calendar, MapPin, Mail,
  UserSquare, ClipboardEdit, Pencil, Upload, FolderUp, FileUp, Link2, 
  Settings
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LandProperty } from "@shared/schema";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AssetUploadHub } from "@/components/dashboard/AssetUploadHub";
import { PropertyImporter } from "@/components/dashboard/PropertyImporter";

export default function AgentDashboard() {
  return (
    <ProtectedRoute requiredRole="agent">
      <AgentDashboardContent />
    </ProtectedRoute>
  );
}

function AgentDashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch agent's listings
  const { data: agentListings, isLoading: listingsLoading } = useQuery<LandProperty[]>({
    queryKey: ['/api/properties/agent-listings'],
    enabled: !!user,
  });
  
  // Fetch client inquiries
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery<any[]>({
    queryKey: ['/api/inquiries'],
    enabled: !!user,
  });
  
  // Mock data that would be replaced with real API data
  const clientStats = {
    active: 24,
    new: 6,
    totalSales: 42,
    monthlySales: 3
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Agent Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your listings, clients, and view your performance metrics
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/agent/profile">
              <UserSquare className="mr-2 h-4 w-4" /> My Profile
            </Link>
          </Button>
          <Button className="flex items-center" asChild>
            <Link href="/properties/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Listing
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full md:w-auto mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          {/* Agent Profile Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={"https://randomuser.me/api/portraits/men/44.jpg"} alt={user?.firstName || "Agent"} />
                    <AvatarFallback>{user?.firstName?.charAt(0) || "A"}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h2>
                      <p className="text-gray-600">Land Property Specialist</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/agent/profile/edit">
                        <Pencil className="mr-2 h-3 w-3" /> Edit Profile
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Specialties</h3>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="secondary">Recreational Land</Badge>
                        <Badge variant="secondary">Waterfront</Badge>
                        <Badge variant="secondary">Ranch Properties</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Service Areas</h3>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="secondary">Colorado</Badge>
                        <Badge variant="secondary">Wyoming</Badge>
                        <Badge variant="secondary">Montana</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">License</h3>
                      <p className="mt-2 text-gray-900">CO #LN-12345678</p>
                      <p className="text-sm text-gray-500">Since 2018</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Home className="mr-2 h-4 w-4 text-primary" /> Active Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{agentListings?.filter(p => p.status === 'active').length || 0}</div>
                <p className="text-sm text-gray-500 mt-1">Properties you're representing</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-4 w-4 text-primary" /> Active Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{clientStats.active}</div>
                <p className="text-sm text-gray-500 mt-1">Buyers & sellers you represent</p>
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
                <p className="text-sm text-gray-500 mt-1">Unread messages from clients</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4 text-primary" /> Monthly Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{clientStats.monthlySales}</div>
                <p className="text-sm text-gray-500 mt-1">Properties sold this month</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
                <CardDescription>
                  Your meetings and appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 border-l-2 border-blue-500 pl-3 pb-3">
                    <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Property Showing: Mountain View Ranch</p>
                      <p className="text-sm text-gray-600">Today, 2:00 PM</p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" /> Boulder, CO
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 border-l-2 border-green-500 pl-3 pb-3">
                    <Calendar className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Client Meeting: Sarah Johnson</p>
                      <p className="text-sm text-gray-600">Tomorrow, 10:00 AM</p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" /> Remote - Video Call
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 border-l-2 border-purple-500 pl-3 pb-3">
                    <Calendar className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Closing: Lakefront Property</p>
                      <p className="text-sm text-gray-600">Apr 12, 9:00 AM</p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" /> Title Company Office
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="mt-4 w-full">
                  <Calendar className="mr-2 h-4 w-4" /> View Full Calendar
                </Button>
              </CardContent>
            </Card>
            
            {/* Recent Listings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Listings</CardTitle>
                <CardDescription>
                  Your most recently added properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {listingsLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex">
                        <div className="h-16 w-16 bg-gray-200 rounded"></div>
                        <div className="ml-3 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : agentListings?.length ? (
                  <div className="space-y-4">
                    {agentListings.slice(0, 3).map(property => (
                      <div key={property.id} className="flex items-start border-b border-gray-100 pb-3">
                        <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={Array.isArray(property.images) && property.images.length > 0 
                              ? property.images[0] 
                              : "https://images.unsplash.com/photo-1500382017468-9049fed747ef"}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-gray-900 line-clamp-1">
                              <Link href={`/properties/${property.id}`} className="hover:text-primary transition-colors">
                                {property.title}
                              </Link>
                            </h3>
                            <Badge variant={property.status === 'active' ? 'default' : 'outline'}>
                              {property.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{property.location}</p>
                          <p className="text-sm font-medium text-primary">${Number(property.price).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600">No listings yet</p>
                    <Button className="mt-2" asChild>
                      <Link href="/properties/create">Add a Listing</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="#listings" onClick={() => setActiveTab("listings")}>
                    View All Listings
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Recent Inquiries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Inquiries</CardTitle>
                <CardDescription>
                  Latest messages from potential clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inquiriesLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : inquiries?.length ? (
                  <div className="space-y-4">
                    {inquiries.slice(0, 3).map(inquiry => (
                      <div key={inquiry.id} className="flex items-start gap-3 pb-3 border-b border-gray-100">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{inquiry.fromUser?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{inquiry.subject}</p>
                          <p className="text-gray-600 text-sm line-clamp-1">{inquiry.message}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {inquiry.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(inquiry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No inquiries yet</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="#messages" onClick={() => setActiveTab("messages")}>
                    View All Messages
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Agent Resources */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Agent Resources</h2>
              <Button variant="link" asChild>
                <Link href="/resources" className="flex items-center">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Briefcase className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/agent-marketing">Digital Marketing Strategies</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Advanced techniques to market your listings effectively online.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <LineChart className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/agent-valuations">Expert Property Valuation</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    How to accurately determine land property values in today's market.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <ClipboardEdit className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/agent-contracts">Contract Templates</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Customizable contracts and agreement templates for land transactions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="listings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Listings</h2>
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
                Properties you're currently representing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
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
              ) : agentListings?.filter(p => p.status === 'active').length ? (
                <div className="space-y-4">
                  {agentListings.filter(p => p.status === 'active').map(property => (
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
                    Add your first property listing to start representing sellers.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/properties/create">Add Listing</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Other listing statuses would go here (pending, sold, etc.) */}
        </TabsContent>
        
        <TabsContent value="clients" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Clients</h2>
            <Button asChild>
              <Link href="/agent/clients/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Buyers</CardTitle>
                <CardDescription>
                  Clients looking to purchase properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>MJ</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">Michael Johnson</h3>
                          <p className="text-sm text-gray-500">Looking for: Mountain property, 20+ acres</p>
                          <p className="text-sm text-gray-500">Budget: $250,000 - $400,000</p>
                        </div>
                      </div>
                      <Badge>Active</Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Added: Mar 15, 2025</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/agent/clients/1">View Details</Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>SL</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">Sarah Lee</h3>
                          <p className="text-sm text-gray-500">Looking for: Waterfront property, 5-10 acres</p>
                          <p className="text-sm text-gray-500">Budget: $400,000 - $600,000</p>
                        </div>
                      </div>
                      <Badge>Active</Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Added: Feb 28, 2025</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/agent/clients/2">View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/agent/clients/buyers">
                    View All Buyers
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sellers</CardTitle>
                <CardDescription>
                  Clients you're representing as sellers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>RW</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">Robert Williams</h3>
                          <p className="text-sm text-gray-500">Selling: Mountain View Ranch, 40 acres</p>
                          <p className="text-sm text-gray-500">Listed at: $450,000</p>
                        </div>
                      </div>
                      <Badge>Active</Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Listed: Apr 1, 2025</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/agent/clients/3">View Details</Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">Jennifer Davis</h3>
                          <p className="text-sm text-gray-500">Selling: Lakefront Property, 8 acres</p>
                          <p className="text-sm text-gray-500">Listed at: $325,000</p>
                        </div>
                      </div>
                      <Badge>Pending</Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Listed: Mar 10, 2025</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/agent/clients/4">View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/agent/clients/sellers">
                    View All Sellers
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Client Activity</CardTitle>
              <CardDescription>
                Latest updates from your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-2 border-blue-500 pl-4 py-2">
                  <p className="font-medium text-gray-900">Michael Johnson viewed 5 new properties</p>
                  <p className="text-sm text-gray-500">Today at 10:23 AM</p>
                </div>
                
                <div className="border-l-2 border-green-500 pl-4 py-2">
                  <p className="font-medium text-gray-900">Offer received on Lakefront Property</p>
                  <p className="text-sm text-gray-500">Yesterday at 3:45 PM</p>
                </div>
                
                <div className="border-l-2 border-gray-300 pl-4 py-2">
                  <p className="font-medium text-gray-900">Sarah Lee saved 3 properties to favorites</p>
                  <p className="text-sm text-gray-500">Apr 3, 2025 at 2:15 PM</p>
                </div>
                
                <div className="border-l-2 border-gray-300 pl-4 py-2">
                  <p className="font-medium text-gray-900">Robert Williams updated property price</p>
                  <p className="text-sm text-gray-500">Apr 2, 2025 at 11:30 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Messages</CardTitle>
              <CardDescription>
                Inquiries and communications from clients and potential buyers
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
                  <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
                  <p className="text-gray-600 mt-1 max-w-md mx-auto">
                    When clients contact you about your listings, their messages will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>
                Your sales metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{clientStats.totalSales}</div>
                    <p className="text-sm text-gray-500 mt-1">Properties sold to date</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Average Sale Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$285,000</div>
                    <p className="text-sm text-gray-500 mt-1">Average property value</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Avg Days to Sale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">47</div>
                    <p className="text-sm text-gray-500 mt-1">Days from listing to sale</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Sales by Property Type</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Recreational Land</span>
                        <span className="text-sm text-gray-600">42%</span>
                      </div>
                      <Progress value={42} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Waterfront</span>
                        <span className="text-sm text-gray-600">28%</span>
                      </div>
                      <Progress value={28} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Ranch/Farm Land</span>
                        <span className="text-sm text-gray-600">18%</span>
                      </div>
                      <Progress value={18} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Other</span>
                        <span className="text-sm text-gray-600">12%</span>
                      </div>
                      <Progress value={12} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Monthly Sales (Last 6 Months)</h3>
                  <div className="bg-gray-50 p-4 rounded-lg h-64 flex items-center justify-center">
                    <div className="w-full h-full flex items-end justify-between gap-1 px-4">
                      {[2, 4, 3, 5, 3, 6].map((value, index) => (
                        <div 
                          key={index}
                          className="bg-primary hover:bg-primary/80 transition-colors rounded-t w-full"
                          style={{ height: `${(value / 6) * 100}%` }}
                          title={`Month ${index + 1}: ${value} sales`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Nov</span>
                    <span>Dec</span>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Market Insights</CardTitle>
              <CardDescription>
                Current trends in your service areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Hot Markets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">Colorado</h4>
                      <div className="flex items-center text-green-600 mt-1">
                        <ArrowRight className="h-4 w-4 rotate-45" />
                        <span className="text-sm font-medium ml-1">+12% YoY</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Strong demand for recreational and mountain properties
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">Wyoming</h4>
                      <div className="flex items-center text-green-600 mt-1">
                        <ArrowRight className="h-4 w-4 rotate-45" />
                        <span className="text-sm font-medium ml-1">+8% YoY</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Growing interest in ranch and larger acreage properties
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">Montana</h4>
                      <div className="flex items-center text-green-600 mt-1">
                        <ArrowRight className="h-4 w-4 rotate-45" />
                        <span className="text-sm font-medium ml-1">+15% YoY</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Significant uptick in demand for remote recreational land
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Market Trends Report</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      The land market in your service areas is seeing strong growth, particularly in recreational 
                      and lifestyle properties. Buyer demand continues to outpace inventory in most regions, 
                      with particular interest in properties offering privacy, views, and recreational opportunities.
                      Remote work trends continue to drive interest in rural land purchases.
                    </p>
                    <Button variant="link" className="px-0 mt-2">
                      <Link href="/resources/market-report" className="flex items-center">
                        Read full market report <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Agent Tools</h2>
            <p className="text-gray-600">
              Powerful tools to help manage your property listings and clients
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <AssetUploadHub 
                propertyTitle={agentListings?.find(p => p.status === 'active')?.title}
                propertyId={agentListings?.find(p => p.status === 'active')?.id}
              />
            </div>
            
            <div>
              <PropertyImporter
                onImportComplete={(data) => {
                  console.log('Import complete with data:', data);
                  // In a real implementation, you would use this data to create a new property listing
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}