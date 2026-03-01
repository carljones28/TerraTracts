import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, Search, Home, User, Building, FileText, BookOpenCheck,
  GanttChart, LineChart, Briefcase, ArrowRight, MapPin, Calendar, 
  Download, DownloadCloud
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ResourcesPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch resources from API
  const { data: resources, isLoading } = useQuery({
    queryKey: ['/api/resources'],
  });
  
  // Filter resources based on search query and selected tab
  const filteredResources = resources ? resources.filter(resource => {
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTab = activeTab === "all" || 
      (activeTab === "buyer-guides" && resource.category === "buyer-guide") ||
      (activeTab === "seller-guides" && resource.category === "seller-guide") ||
      (activeTab === "agent-resources" && resource.category === "agent-resource") ||
      (activeTab === "market-insights" && resource.category === "market-insight");
      
    return matchesSearch && matchesTab;
  }) : [];
  
  // Featured resource cards
  const featuredResources = [
    {
      id: 1,
      title: "The Complete Guide to Land Property Investment",
      description: "Everything you need to know about investing in land properties - from evaluation to purchase.",
      image: "https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "buyer-guide",
      icon: <BookOpenCheck />,
      slug: "complete-land-investment-guide"
    },
    {
      id: 2,
      title: "Land Property Value Optimization",
      description: "Strategies and techniques to maximize your property's value before selling.",
      image: "https://images.unsplash.com/photo-1593978301851-40c1849d47d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "seller-guide",
      icon: <LineChart />,
      slug: "property-value-optimization"
    },
    {
      id: 3,
      title: "2025 Land Market Trends Report",
      description: "Comprehensive analysis of current trends and forecasts for the land property market.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "market-insight",
      icon: <GanttChart />,
      slug: "2025-market-trends"
    }
  ];
  
  // Demo resources (would be replaced with real API data)
  const demoResources = [
    {
      id: 4,
      title: "Due Diligence Checklist for Land Buyers",
      description: "Essential items to investigate before purchasing any land property.",
      category: "buyer-guide",
      author: "Michael Roberts",
      authorRole: "Property Expert",
      date: "April 2, 2025",
      readTime: "12 min read",
      icon: <FileText />,
      slug: "due-diligence-checklist"
    },
    {
      id: 5,
      title: "Understanding Land Zoning Regulations",
      description: "A comprehensive guide to land zoning categories and restrictions.",
      category: "buyer-guide",
      author: "Jennifer Davis",
      authorRole: "Urban Planner",
      date: "March 28, 2025",
      readTime: "15 min read",
      icon: <MapPin />,
      slug: "land-zoning-guide"
    },
    {
      id: 6,
      title: "Preparing Your Land for Sale",
      description: "Step-by-step guide to optimize your property's presentation and appeal.",
      category: "seller-guide",
      author: "Robert Thompson",
      authorRole: "Land Sales Specialist",
      date: "March 25, 2025",
      readTime: "10 min read",
      icon: <Home />,
      slug: "prepare-land-for-sale"
    },
    {
      id: 7,
      title: "Land Survey Basics: What Every Owner Should Know",
      description: "Understanding property surveys, boundaries, and legal descriptions.",
      category: "seller-guide",
      author: "Sarah Johnson",
      authorRole: "Land Surveyor",
      date: "March 20, 2025",
      readTime: "8 min read",
      icon: <MapPin />,
      slug: "land-survey-basics"
    },
    {
      id: 8,
      title: "Digital Marketing Strategies for Land Agents",
      description: "Leveraging online platforms to effectively market land properties.",
      category: "agent-resource",
      author: "David Wilson",
      authorRole: "Digital Marketing Consultant",
      date: "April 5, 2025",
      readTime: "14 min read",
      icon: <Briefcase />,
      slug: "agent-digital-marketing"
    },
    {
      id: 9,
      title: "Seasonal Land Market Analysis: Spring 2025",
      description: "Market trends, pricing insights, and buyer behavior for the current season.",
      category: "market-insight",
      author: "Amanda Lee",
      authorRole: "Market Analyst",
      date: "April 1, 2025",
      readTime: "18 min read",
      icon: <Calendar />,
      slug: "spring-2025-market-analysis"
    },
    {
      id: 10,
      title: "Rural vs. Urban Land Investment Comparison",
      description: "Analyzing the pros, cons, and ROI potential of different property locations.",
      category: "market-insight",
      author: "James Peterson",
      authorRole: "Investment Advisor",
      date: "March 15, 2025",
      readTime: "16 min read",
      icon: <Building />,
      slug: "rural-urban-comparison"
    },
    {
      id: 11,
      title: "Land Financing Options Explained",
      description: "Comprehensive overview of financing methods for land purchases.",
      category: "buyer-guide",
      author: "Lisa Thompson",
      authorRole: "Financial Advisor",
      date: "March 10, 2025",
      readTime: "12 min read",
      icon: <FileText />,
      slug: "land-financing-options"
    },
    {
      id: 12,
      title: "Client Relationship Management for Land Agents",
      description: "Building and maintaining successful client relationships in land sales.",
      category: "agent-resource",
      author: "Thomas Anderson",
      authorRole: "Sales Coach",
      date: "March 5, 2025",
      readTime: "11 min read",
      icon: <User />,
      slug: "client-relationship-management"
    }
  ];
  
  // Downloadable resources
  const downloadableResources = [
    {
      id: 101,
      title: "Land Buyers Guide (PDF)",
      description: "Comprehensive guide for first-time land buyers",
      fileType: "PDF",
      fileSize: "4.2 MB",
      category: "buyer-guide",
      icon: <Download />,
      slug: "land-buyers-guide-pdf"
    },
    {
      id: 102,
      title: "Property Valuation Worksheet",
      description: "Excel template for calculating property values",
      fileType: "XLSX",
      fileSize: "1.8 MB",
      category: "seller-guide",
      icon: <Download />,
      slug: "property-valuation-worksheet"
    },
    {
      id: 103,
      title: "Land Purchase Agreement Template",
      description: "Customizable legal template for land transactions",
      fileType: "DOCX",
      fileSize: "2.5 MB",
      category: "agent-resource",
      icon: <Download />,
      slug: "purchase-agreement-template"
    },
    {
      id: 104,
      title: "Due Diligence Checklist",
      description: "Printable checklist for land property inspection",
      fileType: "PDF",
      fileSize: "1.2 MB",
      category: "buyer-guide",
      icon: <Download />,
      slug: "due-diligence-checklist-pdf"
    }
  ];
  
  // Resources for the current user based on their role
  const getCurrentUserResources = () => {
    if (!user) return [];
    
    switch (user.role) {
      case "buyer":
        return demoResources.filter(r => r.category === "buyer-guide" || r.category === "market-insight");
      case "seller":
        return demoResources.filter(r => r.category === "seller-guide" || r.category === "market-insight");
      case "agent":
        return demoResources.filter(r => r.category === "agent-resource" || r.category === "market-insight");
      default:
        return [];
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          TerraTracts Resources
        </h1>
        <p className="text-xl text-gray-600">
          Explore our comprehensive collection of guides, market insights, and tools
          to help you navigate the land property market with confidence.
        </p>
      </div>
      
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            type="text"
            placeholder="Search resources..."
            className="pl-10 py-6 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Resource Categories */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-12">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="buyer-guides">Buyer Guides</TabsTrigger>
          <TabsTrigger value="seller-guides">Seller Guides</TabsTrigger>
          <TabsTrigger value="agent-resources">Agent Resources</TabsTrigger>
          <TabsTrigger value="market-insights">Market Insights</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Featured Resources */}
      {activeTab === "all" && searchQuery === "" && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredResources.map(resource => (
              <Card key={resource.id} className="overflow-hidden group h-full">
                <div className="relative h-48">
                  <img 
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/80 text-primary hover:bg-white/90">{resource.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Badge>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-primary">
                      {resource.icon}
                    </div>
                    <Badge variant="outline">Featured</Badge>
                  </div>
                  <CardTitle className="mb-2 group-hover:text-primary transition-colors">
                    <Link href={`/resources/${resource.slug}`}>{resource.title}</Link>
                  </CardTitle>
                  <p className="text-gray-600">{resource.description}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/resources/${resource.slug}`}>
                      Read Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* For You Section (only if logged in) */}
      {isAuthenticated && user && activeTab === "all" && searchQuery === "" && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getCurrentUserResources().slice(0, 3).map(resource => (
              <Card key={resource.id} className="h-full group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {resource.icon}
                    </div>
                    <Badge>{resource.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    <Link href={`/resources/${resource.slug}`}>{resource.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{resource.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resource.author}</p>
                      <p className="text-xs text-gray-500">{resource.authorRole}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="w-full flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {resource.date} • {resource.readTime}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/resources/${resource.slug}`}>
                        Read <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* All Resources Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {searchQuery ? 'Search Results' : 'Browse All Resources'}
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
                <CardFooter>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (searchQuery !== "" && filteredResources?.length === 0) || demoResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchQuery 
                ? `We couldn't find any resources matching "${searchQuery}". Try different keywords or browse our categories.` 
                : "There are currently no resources in this category. Please check back later."}
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(filteredResources?.length > 0 ? filteredResources : demoResources).map(resource => (
              <Card key={resource.id} className="h-full group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {resource.icon}
                    </div>
                    <Badge variant="outline">{resource.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    <Link href={`/resources/${resource.slug}`}>{resource.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{resource.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resource.author}</p>
                      <p className="text-xs text-gray-500">{resource.authorRole}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="w-full flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {resource.date} • {resource.readTime}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/resources/${resource.slug}`}>
                        Read <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Downloadable Resources */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Downloadable Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {downloadableResources.map(resource => (
            <Card key={resource.id} className="group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <DownloadCloud className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                          <Link href={`/resources/download/${resource.slug}`}>
                            {resource.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm">{resource.description}</p>
                      </div>
                      <Badge variant="outline">{resource.fileType}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-500">{resource.fileSize}</span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/resources/download/${resource.slug}`}>
                          Download
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Newsletter Signup */}
      <div className="mb-16">
        <div className="bg-gray-50 rounded-lg p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Stay Updated with Land Market Insights
                </h2>
                <p className="text-gray-600 mb-6">
                  Subscribe to our newsletter to receive the latest resources, market trends, and expert advice directly in your inbox.
                </p>
                <div className="flex gap-3">
                  <Input 
                    type="email" 
                    placeholder="Your email address" 
                    className="flex-1"
                  />
                  <Button>Subscribe</Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
              <div className="flex-shrink-0 h-32 w-32 flex items-center justify-center rounded-full bg-primary/20">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Request Custom Resources */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Need Custom Resources?
                </h2>
                <p className="text-gray-600 mb-6">
                  Our team of experts can create customized guides and reports tailored to your specific needs.
                  Whether you're a buyer, seller, or agent, we're here to help.
                </p>
                <Button asChild>
                  <Link href="/contact">Request Custom Resources</Link>
                </Button>
              </div>
              <div className="flex-shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center text-primary">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center text-primary">
                    <LineChart className="h-8 w-8" />
                  </div>
                  <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center text-primary">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center text-primary">
                    <BookOpenCheck className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}