import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Heart, Search, BookOpenCheck, Calendar, Bell, BellOff, Map, Home, Eye, User, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LandProperty } from "@shared/schema";
import { Link } from "wouter";
import { useSavedSearches, SavedSearch, SavedSearchFormData } from "@/hooks/use-saved-searches";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function BuyerDashboard() {
  return (
    <ProtectedRoute 
      requiredRole="buyer" 
      allowGuest={true}
    >
      <BuyerDashboardContent />
    </ProtectedRoute>
  );
}

function BuyerDashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  
  // Fetch saved properties
  const { data: favoriteProperties, isLoading: favoritesLoading } = useQuery<{ property: LandProperty }[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user,
  });
  
  // Fetch saved searches using our custom hook
  const { 
    savedSearches, 
    isLoading: searchesLoading,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    isCreating,
    isUpdating,
    isDeleting
  } = useSavedSearches();
  
  // Fetch recommended properties
  const { data: recommendedProperties, isLoading: recommendationsLoading } = useQuery<LandProperty[]>({
    queryKey: ['/api/recommendations'],
    // We can now fetch recommendations even when not logged in
    retry: 1,
  });
  
  // Setup form for creating/editing saved searches
  const form = useForm<SavedSearchFormData>({
    defaultValues: {
      name: '',
      criteria: {},
      notifyEmail: false,
      notifyFrequency: 'weekly'
    }
  });
  
  // Handle form submission
  const onSubmit = (data: SavedSearchFormData) => {
    if (editingSearch) {
      updateSavedSearch({
        id: editingSearch.id,
        searchData: data
      });
    } else {
      createSavedSearch(data);
    }
    
    setShowSaveSearchModal(false);
    setEditingSearch(null);
    form.reset();
  };
  
  // Handle edit search
  const handleEditSearch = (search: SavedSearch) => {
    setEditingSearch(search);
    form.reset({
      name: search.name,
      criteria: search.criteria,
      notifyEmail: search.notifyEmail,
      notifyFrequency: search.notifyFrequency
    });
    setShowSaveSearchModal(true);
  };
  
  // Handle delete search
  const handleDeleteSearch = (id: number) => {
    if (confirm('Are you sure you want to delete this saved search?')) {
      deleteSavedSearch(id);
    }
  };
  
  // Modal close handler
  const handleModalClose = () => {
    setShowSaveSearchModal(false);
    setEditingSearch(null);
    form.reset();
  };
  
  // Recent searches (placeholder)
  const recentSearches = [
    { id: 1, query: "Mountain land near Denver", date: "2 days ago" },
    { id: 2, query: "Waterfront property in Florida", date: "1 week ago" },
    { id: 3, query: "Farmland with water rights", date: "3 weeks ago" },
  ];
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Dialog for creating/editing saved searches */}
      <Dialog open={showSaveSearchModal} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSearch ? 'Edit Saved Search' : 'Save New Search'}</DialogTitle>
            <DialogDescription>
              Enter a name for your search and configure notification settings.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Search name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mountain land in Colorado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="criteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Criteria</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., { location: 'Colorado', propertyType: 'land' }"
                        value={typeof field.value === 'object' ? JSON.stringify(field.value) : field.value}
                        onChange={(e) => {
                          try {
                            // Try to parse as JSON if possible
                            const parsedValue = JSON.parse(e.target.value);
                            field.onChange(parsedValue);
                          } catch {
                            // Otherwise store as string
                            field.onChange(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter search parameters as JSON or from the search page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notifyEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Email Notifications</FormLabel>
                      <FormDescription>
                        Receive alerts when new properties match your criteria
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch('notifyEmail') && (
                <FormField
                  control={form.control}
                  name="notifyFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="immediately">Immediately</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often you'll receive notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleModalClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <>Saving...</>
                  ) : (
                    <>{editingSearch ? 'Update' : 'Save'}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user ? `Welcome back, ${user.firstName || user.username}` : "Welcome to TerraTracts"}
          </h1>
          <p className="text-gray-600 mt-1">
            {user ? "Manage your property search and stay updated on new listings" : "Sign in to save properties and get personalized recommendations"}
          </p>
        </div>
        
        <Button asChild>
          <Link href="/properties">
            <Search className="mr-2 h-4 w-4" /> Find Properties
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="searches">Searches</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Heart className="mr-2 h-4 w-4 text-primary" /> Saved Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{favoriteProperties?.length || 0}</div>
                <p className="text-sm text-gray-500 mt-1">Properties in your favorites</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Search className="mr-2 h-4 w-4 text-primary" /> Saved Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{savedSearches?.length || 0}</div>
                <p className="text-sm text-gray-500 mt-1">Custom search alerts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Eye className="mr-2 h-4 w-4 text-primary" /> Recently Viewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">16</div>
                <p className="text-sm text-gray-500 mt-1">Properties viewed in the last 30 days</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest activities and property interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-2 border-primary pl-4 py-1">
                  <div className="text-sm text-gray-500">Apr 5, 2025</div>
                  <div className="font-medium">You saved Mountain View Ranch to your favorites</div>
                </div>
                
                <div className="border-l-2 border-gray-200 pl-4 py-1">
                  <div className="text-sm text-gray-500">Apr 3, 2025</div>
                  <div className="font-medium">You viewed 5 properties in Colorado</div>
                </div>
                
                <div className="border-l-2 border-gray-200 pl-4 py-1">
                  <div className="text-sm text-gray-500">Apr 2, 2025</div>
                  <div className="font-medium">You saved a search for "Lakefront property in Michigan"</div>
                </div>
                
                <div className="border-l-2 border-gray-200 pl-4 py-1">
                  <div className="text-sm text-gray-500">Apr 1, 2025</div>
                  <div className="font-medium">You contacted an agent about River Overlook Property</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Property Recommendations */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recommended For You</h2>
              <Button variant="link" asChild>
                <Link href="/properties" className="flex items-center">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendationsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="pt-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))
              ) : recommendedProperties && Array.isArray(recommendedProperties) && recommendedProperties.length > 0 ? (
                recommendedProperties
                  .filter(property => property && typeof property === 'object')
                  .slice(0, 3)
                  .map((property, index) => (
                    <Card key={property?.id || `recommended-property-${index}`} className="overflow-hidden group">
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={property?.images && Array.isArray(property.images) && property.images.length > 0 
                            ? property.images[0] 
                            : "https://images.unsplash.com/photo-1500382017468-9049fed747ef"}
                          alt={property?.title || "Property"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                          {property && property.id ? (
                            <Link href={`/properties/${property.id}`}>{property?.title || "Untitled Property"}</Link>
                          ) : (
                            <span>{property?.title || "Untitled Property"}</span>
                          )}
                        </h3>
                        <p className="text-gray-500 text-sm">{property?.location || "Location not specified"}</p>
                        <p className="text-lg font-bold text-primary mt-2">
                          ${property?.price ? Number(property.price).toLocaleString() : "N/A"}
                        </p>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <div className="bg-gray-50 rounded-lg p-6 inline-block mb-3">
                    <Map className="h-12 w-12 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No recommendations yet</h3>
                  <p className="text-gray-600 mt-1 max-w-md mx-auto">
                    Browse more properties to help us understand your preferences
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/properties">Browse Properties</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Resources Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Resources For Buyers</h2>
              <Button variant="link" asChild>
                <Link href="/resources" className="flex items-center">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <BookOpenCheck className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/buyers-guide">First-Time Land Buyer's Guide</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Learn essential tips and considerations for buying your first land property.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/buying-timeline">Property Buying Timeline</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    A complete breakdown of the land buying process from search to closing.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Home className="h-12 w-12 text-primary/50" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-gray-900">
                    <Link href="/resources/land-development">Land Development Basics</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    What you need to know about permits, utilities, and preparing land for building.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Properties</CardTitle>
              <CardDescription>
                Properties you've added to your favorites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full p-6 inline-block mb-3">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Sign in to save properties</h3>
                  <p className="text-gray-600 mt-1 max-w-md mx-auto">
                    Create an account or log in to save your favorite properties and access them from any device.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/auth">Sign In / Register</Link>
                  </Button>
                </div>
              ) : favoritesLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex animate-pulse">
                      <div className="h-24 w-32 bg-gray-200 rounded"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : favoriteProperties && Array.isArray(favoriteProperties) && favoriteProperties.length > 0 ? (
                <div className="space-y-4">
                  {favoriteProperties
                    .filter(item => item && typeof item === 'object' && item.property && typeof item.property === 'object')
                    .map(({ property }) => (
                    <div key={property?.id || Math.random()} className="flex border-b border-gray-100 pb-4 group">
                      <Link href={`/properties/${property?.id || '#'}`} className="h-24 w-32 relative overflow-hidden rounded">
                        <img 
                          src={property?.images && Array.isArray(property.images) && property.images.length > 0 
                            ? property.images[0] 
                            : "https://images.unsplash.com/photo-1500382017468-9049fed747ef"}
                          alt={property?.title || "Property"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="ml-4 flex-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                          <Link href={`/properties/${property?.id || '#'}`}>{property?.title || "Untitled Property"}</Link>
                        </h3>
                        <p className="text-gray-500 text-sm">{property?.location || "Location not specified"}</p>
                        <p className="text-lg font-bold text-primary mt-2">
                          ${property?.price ? Number(property.price).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full p-6 inline-block mb-3">
                    <Heart className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No saved properties</h3>
                  <p className="text-gray-600 mt-1 max-w-md mx-auto">
                    Start saving properties by clicking the heart icon on any property.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/properties">Browse Properties</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="searches" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Saved Searches</CardTitle>
                <CardDescription>
                  Get notified when new properties match your criteria
                </CardDescription>
              </div>
              {user && (
                <Button 
                  size="sm" 
                  onClick={() => {
                    form.reset({
                      name: '',
                      criteria: {},
                      notifyEmail: false,
                      notifyFrequency: 'weekly'
                    });
                    setEditingSearch(null);
                    setShowSaveSearchModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> New Search
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full p-6 inline-block mb-3">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Sign in to save searches</h3>
                  <p className="text-gray-600 mt-1 max-w-md mx-auto">
                    Create an account or log in to save search criteria and get notified about new matching properties.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/auth">Sign In / Register</Link>
                  </Button>
                </div>
              ) : searchesLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    </div>
                  ))}
                </div>
              ) : savedSearches && savedSearches.length > 0 ? (
                <div className="space-y-4">
                  {savedSearches.map(search => (
                    <div key={search.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{search.name}</h3>
                          <div className="text-gray-600 text-sm mt-1 flex flex-wrap gap-1">
                            {typeof search.criteria === 'object' 
                              ? Object.entries(search.criteria).map(([key, value]) => (
                                  <span key={key} className="inline-block px-2 py-1 bg-gray-100 text-xs rounded">
                                    {key}: {String(value)}
                                  </span>
                                ))
                              : JSON.stringify(search.criteria)
                            }
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditSearch(search)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteSearch(search.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="text-sm text-gray-500 flex items-center">
                          {search.notifyEmail ? (
                            <Bell className="h-3 w-3 mr-1 text-primary" />
                          ) : (
                            <BellOff className="h-3 w-3 mr-1 text-gray-400" />
                          )}
                          {search.notifyEmail ? `Notifications: ${search.notifyFrequency}` : 'Notifications off'}
                        </div>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto" 
                        >
                          <Link 
                            href={`/properties${typeof search.criteria === 'object' 
                              ? `?${new URLSearchParams(
                                  Object.entries(search.criteria).reduce((acc, [key, value]) => ({
                                    ...acc, 
                                    [key]: String(value)
                                  }), {})
                                ).toString()}`
                              : ''
                            }`}
                          >
                            View Results
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full p-6 inline-block mb-3">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No saved searches</h3>
                  <p className="text-gray-600 mt-1 max-w-md mx-auto">
                    Save your search criteria to receive notifications about new properties that match.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      form.reset();
                      setEditingSearch(null);
                      setShowSaveSearchModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Save New Search
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Searches</CardTitle>
              <CardDescription>
                Your most recent property searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSearches.map(search => (
                  <div key={search.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <p className="font-medium text-gray-900">{search.query}</p>
                      <p className="text-sm text-gray-500">{search.date}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        form.reset({
                          name: search.query,
                          criteria: {},
                          notifyEmail: false,
                          notifyFrequency: 'weekly'
                        });
                        setEditingSearch(null);
                        setShowSaveSearchModal(true);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Alerts</CardTitle>
              <CardDescription>
                Stay updated on your favorite properties and saved searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-2 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">New matching property</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        A new property matching your "Colorado Mountain Land" search is now available.
                      </p>
                      <p className="text-sm text-blue-500 mt-2">2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
                
                <div className="border-l-2 border-green-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Price reduction</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Price reduced on "Lakefront Property in Michigan" by $25,000.
                      </p>
                      <p className="text-sm text-green-500 mt-2">Yesterday</p>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
                
                <div className="border-l-2 border-orange-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Status change</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        A property you've saved "Mountain View Ranch" has changed status to "Pending".
                      </p>
                      <p className="text-sm text-orange-500 mt-2">2 days ago</p>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive property updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">New matching properties</h3>
                    <p className="text-gray-600 text-sm">When new properties match your saved searches</p>
                  </div>
                  <div className="flex items-center">
                    <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                      <option>Immediately</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">Price changes</h3>
                    <p className="text-gray-600 text-sm">When prices change on saved properties</p>
                  </div>
                  <div className="flex items-center">
                    <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                      <option>Immediately</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">Status updates</h3>
                    <p className="text-gray-600 text-sm">When status changes on saved properties</p>
                  </div>
                  <div className="flex items-center">
                    <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                      <option>Immediately</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <div>
                    <h3 className="font-medium text-gray-900">Resource updates</h3>
                    <p className="text-gray-600 text-sm">New buyer guides and educational content</p>
                  </div>
                  <div className="flex items-center">
                    <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <Button className="mt-6">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}