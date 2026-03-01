import { useState, useEffect } from 'react';
import { useParams, Link, useSearch } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Building,
  Award,
  Calendar,
  MapPin,
  Clock,
  Star,
  Briefcase,
  Phone,
  Mail,
  Share2,
  Globe,
  MessageSquare,
  FileText,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ChevronRight,
  X,
  User,
  Users,
  Target,
  DollarSign,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  Home,
  Verified,
  MessageCircle,
  ThumbsUp,
  Calendar as CalendarIcon,
  Camera,
  Video,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  Map,
  List,
  Eye,
  Languages,
  Flag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AgentListings from '@/components/property/AgentListings';
import ContactAgentModal from '@/components/agent/ContactAgentModal';
import ShareAgentModal from '@/components/agent/ShareAgentModal';
import { DirectAgentContactModal } from '@/components/agent/DirectAgentContactModal';

const AgentProfile = () => {
  const { id } = useParams();
  const agentId = parseInt(id || '0');
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const tabParam = urlParams.get('tab');
  
  // Initialize filter based on URL tab parameter
  const getInitialFilter = () => {
    if (tabParam === 'sold') return 'sold';
    if (tabParam === 'for-sale' || tabParam === 'available') return 'for-sale';
    if (tabParam === 'for-rent') return 'for-rent';
    return 'all';
  };
  
  const [activeTab, setActiveTab] = useState(tabParam ? 'listings' : 'about');
  const [showFullBio, setShowFullBio] = useState(false);
  const [listingsFilter, setListingsFilter] = useState(getInitialFilter()); // 'all', 'for-sale', 'for-rent', 'sold'
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Helper function to get initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Helper function to truncate bio
  const truncateBio = (text: string, limit: number = 200) => {
    if (!text || text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  // Fetch agent data
  const { data: agent, isLoading: isLoadingAgent } = useQuery({
    queryKey: [`/api/agents/${agentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return response.json();
    },
    enabled: !!agentId
  });

  // Fetch agent certifications
  const { data: certifications, isLoading: isLoadingCerts } = useQuery({
    queryKey: [`/api/agents/${agentId}/certifications`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/certifications`);
      if (!response.ok) throw new Error('Failed to fetch certifications');
      return response.json();
    },
    enabled: !!agentId
  });
  
  // Fetch agent reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/agents/${agentId}/reviews`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!agentId
  });
  
  // Fetch agent transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: [`/api/agents/${agentId}/transactions`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!agentId
  });
  
  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Format currency amount
  const formatCurrency = (amount: string | number) => {
    if (!amount) return '$0';
    const num = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num);
  };
  
  if (isLoadingAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
          <div className="relative pt-24 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="w-48 h-48 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-4">
                      <div className="h-12 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
          <div className="relative pt-24 pb-20 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20 max-w-md mx-auto">
                <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                  <X className="h-12 w-12 text-red-600 mx-auto" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Agent Not Found</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  The agent you're looking for does not exist or may have been removed from our directory.
                </p>
                <Button 
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Link href="/agents">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Agent Directory
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Hero Section with Agent Profile */}
      <div className="relative overflow-hidden">
        {/* Dynamic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
        
        {/* Animated pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            animation: 'float 20s ease-in-out infinite'
          }}></div>
        </div>

        <div className="relative pt-24 pb-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8">
              <div className="flex items-center text-sm text-white/80 backdrop-blur-sm bg-white/10 rounded-full px-4 py-2 w-fit">
                <Link href="/" className="hover:text-white transition-colors">
                  <Home className="h-4 w-4" />
                </Link>
                <ChevronRight className="w-4 h-4 mx-2 text-white/60" />
                <Link href="/agents" className="hover:text-white transition-colors">Agents</Link>
                <ChevronRight className="w-4 h-4 mx-2 text-white/60" />
                <span className="text-white font-medium">
                  {agent.user?.firstName} {agent.user?.lastName}
                </span>
              </div>
            </div>

            {/* Main Profile Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 mb-8">
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25"></div>
                  <Avatar className="relative h-48 w-48 rounded-full border-4 border-white shadow-xl">
                    <AvatarImage 
                      src={agent.profileImage || "/api/placeholder/400/400"} 
                      alt={`${agent.user?.firstName} ${agent.user?.lastName}`} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-6xl font-bold">
                      {getInitials(agent.user?.firstName || '', agent.user?.lastName || '')}
                    </AvatarFallback>
                  </Avatar>
                  {/* Verified Badge */}
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg">
                    <Verified className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    {agent.user?.firstName} {agent.user?.lastName}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    {agent.brokerage && (
                      <div className="flex items-center text-blue-600 font-medium">
                        <Building className="h-5 w-5 mr-2" />
                        <span>{agent.brokerage}</span>
                      </div>
                    )}
                    
                    {agent.licenseNumber && (
                      <div className="flex items-center text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>License: {agent.licenseNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full px-4 py-2">
                      <Star className="h-5 w-5 text-white fill-white mr-2" />
                      <span className="text-white font-bold text-lg">
                        {parseFloat(agent.averageRating as string || '0').toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      ({agent.totalReviews || 0} reviews)
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <DirectAgentContactModal
                      agent={{
                        id: agent.id,
                        user: agent.user,
                        phoneNumber: agent.user?.phone,
                        brokerage: agent.brokerage,
                        licenseNumber: agent.licenseNumber,
                        responseTime: agent.responseTime,
                        averageRating: agent.averageRating,
                        totalReviews: agent.totalReviews
                      }}
                      triggerButton={
                        <Button 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Contact Agent
                        </Button>
                      }
                    />
                    
                    <Button 
                      variant="outline"
                      className="bg-white/80 border-blue-200 hover:bg-blue-50 text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      onClick={() => window.location.href = `tel:${agent.user?.phone || ''}`}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="bg-white/80 border-purple-200 hover:bg-purple-50 text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      onClick={() => setShowShareModal(true)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Profile
                    </Button>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {agent.totalTransactions || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Transactions</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
                  <Target className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {agent.totalAcresSold ? `${agent.totalAcresSold.toLocaleString()}` : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Acres Sold</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {agent.yearsExperience || 0}
                  </div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center">
                  <Star className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {parseFloat(agent.averageRating as string || '0').toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
              </div>

              {/* Specialties */}
              {agent.specialtyAreas && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Specialties</h3>
                  <div className="flex flex-wrap gap-3">
                    {(typeof agent.specialtyAreas === 'string' 
                      ? JSON.parse(agent.specialtyAreas)
                      : Array.isArray(agent.specialtyAreas) 
                        ? agent.specialtyAreas 
                        : []
                    ).map((specialty: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2 text-sm font-medium">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-2 mb-8">
            <TabsTrigger 
              value="about" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl font-semibold px-6 py-3"
            >
              About
            </TabsTrigger>
            <TabsTrigger 
              value="listings" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl font-semibold px-6 py-3"
            >
              Listings
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl font-semibold px-6 py-3"
            >
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* About Section */}
              <div className="lg:col-span-2">
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">About {agent.user?.firstName}</CardTitle>
                    <CardDescription className="text-gray-600">
                      Professional land specialist with expertise in {agent.specialtyAreas && typeof agent.specialtyAreas === 'string' ? JSON.parse(agent.specialtyAreas).slice(0, 2).join(' and ') : 'various property types'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Enhanced Bio with Show More/Less functionality */}
                    <div className="mb-6">
                      <div className="text-gray-700 leading-relaxed">
                        {showFullBio ? (
                          <div>
                            {agent.bio || `${agent.user?.firstName} ${agent.user?.lastName} is a dedicated land specialist who helps people buy, sell, and lease residential properties and land parcels. With ${agent.yearsExperience || 'extensive'} years of experience in the real estate industry, they have been managing and leasing properties while staying current with market trends and financing rates. Known for exceptional client service and deep market knowledge, they handle all the paperwork including MLS residential contracts and agreements for buyers, tenants, and sellers throughout the entire process. They provide comprehensive property reports and comparative market analysis to estimate current property values and help clients make informed decisions.`}
                            <button 
                              onClick={() => setShowFullBio(false)}
                              className="text-blue-600 hover:text-blue-800 font-medium ml-2 inline-flex items-center"
                            >
                              Show less <ChevronUp className="h-4 w-4 ml-1" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            {truncateBio(agent.bio || `${agent.user?.firstName} ${agent.user?.lastName} is a dedicated land specialist who helps people buy, sell, and lease residential properties and land parcels. With ${agent.yearsExperience || 'extensive'} years of experience in the real estate industry, they have been managing and leasing properties while staying current with market trends and financing rates.`)}
                            {(agent.bio && agent.bio.length > 200) && (
                              <button 
                                onClick={() => setShowFullBio(true)}
                                className="text-blue-600 hover:text-blue-800 font-medium ml-2 inline-flex items-center"
                              >
                                Show more <ChevronDown className="h-4 w-4 ml-1" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Languages Spoken */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Languages className="h-5 w-5 mr-2 text-blue-600" />
                        Languages
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          let languages = ['English']; // default
                          try {
                            if (agent.languages && typeof agent.languages === 'string') {
                              // Handle JSON string
                              const parsed = JSON.parse(agent.languages);
                              languages = Array.isArray(parsed) ? parsed : [parsed];
                            } else if (Array.isArray(agent.languages)) {
                              languages = agent.languages;
                            } else if (agent.languages) {
                              // Handle any other format
                              languages = [agent.languages];
                            }
                          } catch (error) {
                            console.log('Language parsing error:', error);
                            // Use default if parsing fails
                          }
                          
                          // Ensure we have at least one language
                          if (!languages || languages.length === 0) {
                            languages = ['English'];
                          }
                          
                          return languages.map((language: string, index: number) => (
                            <Badge key={index} variant="outline" className="border-green-200 text-green-700 bg-green-50">
                              {language}
                            </Badge>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Service Areas */}
                    {agent.serviceAreas && agent.serviceAreas.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Service Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {agent.serviceAreas.map((area: string, index: number) => (
                            <Badge key={index} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                              <MapPin className="h-3 w-3 mr-1" />
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social & Professional Links */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Professional Links</h4>
                      <div className="flex flex-wrap gap-3">
                        {agent.linkedin && (
                          <a
                            href={`https://linkedin.com/in/${agent.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </a>
                        )}
                        {agent.website && (
                          <a
                            href={agent.website.startsWith('http') ? agent.website : `https://${agent.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                      <div className="space-y-3">
                        {agent.user?.email && (
                          <div className="flex items-center text-gray-700">
                            <Mail className="h-4 w-4 mr-3 text-blue-600" />
                            <a href={`mailto:${agent.user.email}`} className="hover:text-blue-600 transition-colors">
                              {agent.user.email}
                            </a>
                          </div>
                        )}
                        {agent.user?.phone && (
                          <div className="flex items-center text-gray-700">
                            <Phone className="h-4 w-4 mr-3 text-green-600" />
                            <a href={`tel:${agent.user.phone}`} className="hover:text-green-600 transition-colors">
                              {agent.user.phone}
                            </a>
                          </div>
                        )}
                        {agent.brokerage && (
                          <div className="flex items-center text-gray-700">
                            <Building className="h-4 w-4 mr-3 text-purple-600" />
                            <span>{agent.brokerage}</span>
                          </div>
                        )}
                        {agent.licenseNumber && (
                          <div className="flex items-center text-gray-700">
                            <FileText className="h-4 w-4 mr-3 text-gray-600" />
                            <span>License: {agent.licenseNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Certifications */}
              <div className="space-y-6">
                {!isLoadingCerts && certifications && certifications.length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                        <Award className="h-5 w-5 mr-2 text-yellow-600" />
                        Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {certifications.map((cert: any, index: number) => (
                          <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                            <div className="font-semibold text-gray-900">{cert.name}</div>
                            <div className="text-sm text-gray-600">
                              Issued: {formatDate(cert.issuedDate)}
                            </div>
                            {cert.expiresDate && (
                              <div className="text-sm text-gray-600">
                                Expires: {formatDate(cert.expiresDate)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-white/20 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Years Active</span>
                        <span className="font-bold text-gray-900">{agent.yearsExperience || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Sales</span>
                        <span className="font-bold text-gray-900">{agent.totalTransactions || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Acres Sold</span>
                        <span className="font-bold text-gray-900">{agent.totalAcresSold ? Number(agent.totalAcresSold).toLocaleString() : '0'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Client Rating</span>
                        <span className="font-bold text-gray-900">{parseFloat(agent.averageRating as string || '0').toFixed(1)}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                      {agent.user?.firstName}'s listings & sales ({agent.totalTransactions || 194})
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Complete transaction history and active listings
                    </CardDescription>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center gap-4 mt-4 lg:mt-0">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          viewMode === 'map' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Map className="h-4 w-4 mr-2 inline-block" />
                        Map
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          viewMode === 'list' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <List className="h-4 w-4 mr-2 inline-block" />
                        List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs - Zillow Style */}
                <div className="flex flex-wrap gap-2 mt-6 p-2 bg-gray-50 rounded-xl">
                  <button
                    onClick={() => setListingsFilter('for-sale')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      listingsFilter === 'for-sale'
                        ? 'bg-white text-blue-600 shadow-md border-2 border-blue-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    For Sale
                  </button>
                  <button
                    onClick={() => setListingsFilter('for-rent')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      listingsFilter === 'for-rent'
                        ? 'bg-white text-blue-600 shadow-md border-2 border-blue-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    For Rent
                  </button>
                  <button
                    onClick={() => setListingsFilter('sold')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      listingsFilter === 'sold'
                        ? 'bg-white text-blue-600 shadow-md border-2 border-blue-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    Sold
                  </button>
                </div>
              </CardHeader>
              
              <CardContent>
                {viewMode === 'map' ? (
                  /* Map View */
                  <div className="space-y-6">
                    <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
                      <div className="text-center">
                        <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Interactive Property Map</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Showing the most recent {listingsFilter === 'sold' ? '100 sales' : '100 listings'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Property Cards Grid Below Map */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Sample property cards - in real app, these would be filtered from agent's properties */}
                      {[1, 2, 3].map((property) => (
                        <div key={property} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                          <div className="aspect-video bg-gray-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Camera className="h-8 w-8 text-gray-400" />
                            </div>
                            {listingsFilter === 'sold' && (
                              <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                SOLD
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="text-xl font-bold text-gray-900 mb-1">
                              {listingsFilter === 'for-rent' ? '$2,695/mo' : '$374,999'}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              3 bed, 3 bath • 2.5 acres
                            </div>
                            <div className="text-sm text-gray-700">
                              7304 Lake Whitney Dr<br />
                              Arlington, TX 76002
                            </div>
                            {listingsFilter === 'sold' && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Sold: 7/15/2025</span>
                                  <Badge variant="secondary" className="text-xs">
                                    <Flag className="h-3 w-3 mr-1" />
                                    Buyer
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* List View - Table Format like Zillow */
                  <div className="space-y-6">
                    {listingsFilter === 'sold' ? (
                      /* Sold Properties Table */
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-4 px-2 font-semibold text-gray-900">Address</th>
                              <th className="text-left py-4 px-2 font-semibold text-gray-900">Sold date</th>
                              <th className="text-left py-4 px-2 font-semibold text-gray-900">Closing price</th>
                              <th className="text-left py-4 px-2 font-semibold text-gray-900">Represented</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Sample sold properties */}
                            {[
                              { address: "928 Thistle Ridge Ln, Arlington, TX 76017", date: "7/15/2025", price: "$364,999", represented: "Buyer" },
                              { address: "4578 Oak Valley Dr, Dallas, TX 75244", date: "6/22/2025", price: "$289,500", represented: "Seller" },
                              { address: "12 Sunset Ridge Way, Plano, TX 75025", date: "5/18/2025", price: "$445,000", represented: "Both" }
                            ].map((property, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-2">
                                  <div className="flex items-start">
                                    <div className="w-16 h-12 bg-gray-200 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                      <Camera className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-blue-600 hover:text-blue-800">
                                        {property.address}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-2 text-gray-700">{property.date}</td>
                                <td className="py-4 px-2 font-semibold text-gray-900">{property.price}</td>
                                <td className="py-4 px-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Flag className="h-3 w-3 mr-1" />
                                    {property.represented}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* For Sale/Rent Properties Table */
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-4 px-2 font-semibold text-gray-900">Address</th>
                              <th className="text-left py-4 px-2 font-semibold text-gray-900">Bed/Bath</th>
                              <th className="text-left py-4 px-2 font-semibold text-gray-900">
                                {listingsFilter === 'for-rent' ? 'Monthly Rent' : 'Listing price'}
                              </th>
                              <th className="text-left py-4 px-2 font-semibold text-gray-900">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Sample active listings */}
                            {[
                              { address: "7304 Lake Whitney Dr, Arlington, TX 76002", beds: "3 Bed, 3 Bath", price: listingsFilter === 'for-rent' ? '$2,695/mo' : '$374,999', status: 'Active' },
                              { address: "1030 Speargrass Ln, Prosper, TX 75078", beds: "4 Bed, 3 Bath", price: listingsFilter === 'for-rent' ? '$3,500/mo' : '$669,999', status: 'Active' },
                              { address: "841 Snapdragon Ln, Plano, TX 75075", beds: "4 Bed, 3 Bath", price: listingsFilter === 'for-rent' ? '$2,695/mo' : '$514,999', status: 'Pending' }
                            ].map((property, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-2">
                                  <div className="flex items-start">
                                    <div className="w-16 h-12 bg-gray-200 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                      <Camera className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-blue-600 hover:text-blue-800">
                                        {property.address}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-2 text-gray-700">{property.beds}</td>
                                <td className="py-4 px-2 font-semibold text-gray-900">{property.price}</td>
                                <td className="py-4 px-2">
                                  <Badge 
                                    variant={property.status === 'Active' ? 'default' : 'secondary'}
                                    className={`text-xs ${
                                      property.status === 'Active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {property.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Client Reviews</CardTitle>
                <CardDescription>What clients are saying about {agent.user?.firstName} {agent.user?.lastName}</CardDescription>
              </CardHeader>
              <CardContent>
                {!isLoadingReviews && reviews && reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review: any, index: number) => (
                      <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="font-semibold text-gray-900">{review.clientName || 'Anonymous Client'}</div>
                            <div className="text-sm text-gray-600">{formatDate(review.createdAt)}</div>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        {review.propertyAddress && (
                          <div className="mt-3 text-sm text-gray-600">
                            Property: {review.propertyAddress}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet. Be the first to leave a review!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Agent Modal */}
      <ContactAgentModal
        agent={agent}
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      {/* Share Agent Modal */}
      <ShareAgentModal
        agent={agent}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

export default AgentProfile;