import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Award, 
  TrendingUp,
  Building,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  Target,
  ChevronRight,
  Shield,
  Globe,
  Zap,
  BarChart3,
  Trophy,
  Clock
} from 'lucide-react';

interface Agent {
  id: number;
  user?: {
    firstName: string;
    lastName: string;
  };
  brokerage: string;
  specialtyAreas: string[];
  yearsExperience: number;
  averageRating: number;
  totalReviews: number;
  totalTransactions: number;
  totalAcresSold: number;
  profileImage?: string;
  responseTime: number;
  featuredAgent: boolean;
  verificationStatus: boolean;
  statesLicensed: string[];
  website?: string;
  languages: string[];
}

interface TeamStats {
  totalAgents: number;
  totalBrokerages: number;
  avgExperience: number;
  avgRating: number;
  totalSales: number;
}

interface SpecialtyData {
  main_specialty: string;
  agent_count: number;
}

export default function Teams() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedExperience, setSelectedExperience] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  const { data: teamStats, isLoading: statsLoading } = useQuery<TeamStats>({
    queryKey: ['/api/teams/stats'],
  });

  const { data: specialties = [], isLoading: specialtiesLoading } = useQuery<SpecialtyData[]>({
    queryKey: ['/api/teams/specialties'],
  });

  // Filter agents based on search and filters
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = !searchTerm || 
      `${agent.user?.firstName} ${agent.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.brokerage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.specialtyAreas?.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty = selectedSpecialty === 'all' || 
      agent.specialtyAreas?.includes(selectedSpecialty);

    const matchesExperience = selectedExperience === 'all' || 
      (selectedExperience === 'junior' && agent.yearsExperience < 5) ||
      (selectedExperience === 'mid' && agent.yearsExperience >= 5 && agent.yearsExperience < 15) ||
      (selectedExperience === 'senior' && agent.yearsExperience >= 15);

    return matchesSearch && matchesSpecialty && matchesExperience;
  });

  // Group agents by brokerage for team display
  const agentsByBrokerage = filteredAgents.reduce((acc, agent) => {
    const brokerage = agent.brokerage || 'Independent';
    if (!acc[brokerage]) {
      acc[brokerage] = [];
    }
    acc[brokerage].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatAcreage = (acres: number) => {
    if (acres >= 1000) {
      return `${(acres / 1000).toFixed(1)}K acres`;
    }
    return `${Math.floor(acres)} acres`;
  };

  const formatRating = (rating: any): string => {
    const numRating = Number(rating);
    return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-blue-300 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-purple-300 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-40 right-1/4 w-16 h-16 bg-indigo-300 rounded-full animate-bounce delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Users className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-6">
              Meet Our Expert Teams
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover industry-leading real estate professionals across the nation. 
              Our certified agents and brokerages deliver exceptional results with local expertise.
            </p>

            {!statsLoading && teamStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-2">{teamStats.totalAgents.toLocaleString()}</div>
                  <div className="text-blue-200 font-medium">Expert Agents</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-2">{teamStats.totalBrokerages}</div>
                  <div className="text-blue-200 font-medium">Brokerages</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-2">{Math.round(teamStats.avgExperience)}</div>
                  <div className="text-blue-200 font-medium">Avg Experience</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-2">{formatRating(teamStats.avgRating)} ⭐</div>
                  <div className="text-blue-200 font-medium">Avg Rating</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-2">{teamStats.totalSales.toLocaleString()}</div>
                  <div className="text-blue-200 font-medium">Total Sales</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-12 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search agents, brokerages, or specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 bg-gray-50 font-medium text-gray-900"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 bg-gray-50 font-medium text-gray-900 min-w-40"
              >
                <option value="all">All Specialties</option>
                {specialties.map((specialty) => (
                  <option key={specialty.main_specialty} value={specialty.main_specialty}>
                    {specialty.main_specialty} ({specialty.agent_count})
                  </option>
                ))}
              </select>

              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 bg-gray-50 font-medium text-gray-900 min-w-40"
              >
                <option value="all">All Experience</option>
                <option value="junior">Junior (0-5 years)</option>
                <option value="mid">Mid-Level (5-15 years)</option>
                <option value="senior">Senior (15+ years)</option>
              </select>

              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-md text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-md text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(agentsLoading || statsLoading || specialtiesLoading) && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Teams by Brokerage */}
        {!agentsLoading && (
          <div className="space-y-12">
            {Object.entries(agentsByBrokerage).map(([brokerage, brokerageAgents]) => (
              <div key={brokerage} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Brokerage Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{brokerage}</h2>
                      <div className="flex items-center gap-6 text-blue-100">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{brokerageAgents.length} agents</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          <span className="font-medium">
                            {brokerageAgents.length > 0 ? formatRating(brokerageAgents.reduce((sum, agent) => sum + (agent.averageRating || 0), 0) / brokerageAgents.length) : '0.0'} avg rating
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">
                            {formatAcreage(brokerageAgents.reduce((sum, agent) => sum + (agent.totalAcresSold || 0), 0))} sold
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
                      <Building className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                {/* Agents Grid/List */}
                <div className="p-8">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {brokerageAgents.map((agent) => (
                        <Link key={agent.id} href={`/agents/${agent.id}`}>
                          <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105">
                            <div className="flex items-center mb-4">
                              <div className="relative">
                                {agent.profileImage ? (
                                  <img 
                                    src={agent.profileImage} 
                                    alt={`${agent.user?.firstName} ${agent.user?.lastName}`}
                                    className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold shadow-lg">
                                    {getInitials(agent.user?.firstName, agent.user?.lastName)}
                                  </div>
                                )}
                                {agent.verificationStatus && (
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <Shield className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {agent.featuredAgent && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <Trophy className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex-1">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {agent.user?.firstName} {agent.user?.lastName}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-3 w-3" />
                                  <span className="font-medium">{agent.yearsExperience} years exp.</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-sm text-yellow-600">
                                  <Star className="h-4 w-4 fill-current" />
                                  <span className="font-semibold">{formatRating(agent.averageRating)}</span>
                                  <span className="text-gray-500">({agent.totalReviews || 0})</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-blue-600">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-medium">{agent.responseTime || 0}h response</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="text-gray-700 font-medium">
                                  <Briefcase className="h-3 w-3 inline mr-1" />
                                  {agent.totalTransactions || 0} sales
                                </div>
                                <div className="text-green-600 font-semibold">
                                  {formatAcreage(agent.totalAcresSold || 0)}
                                </div>
                              </div>

                              {agent.specialtyAreas && agent.specialtyAreas.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {agent.specialtyAreas.slice(0, 2).map((specialty, index) => (
                                    <span 
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                                    >
                                      {specialty}
                                    </span>
                                  ))}
                                  {agent.specialtyAreas.length > 2 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                      +{agent.specialtyAreas.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}

                              {agent.languages && agent.languages.length > 1 && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Globe className="h-3 w-3" />
                                  <span className="font-medium">Speaks {agent.languages.join(', ')}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{agent.statesLicensed?.length || 1} states licensed</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {brokerageAgents.map((agent) => (
                        <Link key={agent.id} href={`/agents/${agent.id}`}>
                          <div className="group bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  {agent.profileImage ? (
                                    <img 
                                      src={agent.profileImage} 
                                      alt={`${agent.user?.firstName} ${agent.user?.lastName}`}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                                      {getInitials(agent.user?.firstName, agent.user?.lastName)}
                                    </div>
                                  )}
                                  {agent.verificationStatus && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                      <Shield className="h-2 w-2 text-white" />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {agent.user?.firstName} {agent.user?.lastName}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="font-medium">{agent.yearsExperience || 0} years experience</span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                      <span className="font-medium">{formatRating(agent.averageRating)} ({agent.totalReviews || 0})</span>
                                    </div>
                                    <span className="font-medium">{agent.totalTransactions || 0} sales</span>
                                    <span className="text-green-600 font-semibold">{formatAcreage(agent.totalAcresSold || 0)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {agent.specialtyAreas && agent.specialtyAreas.length > 0 && (
                                  <div className="flex gap-2">
                                    {agent.specialtyAreas.slice(0, 3).map((specialty, index) => (
                                      <span 
                                        key={index}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                                      >
                                        {specialty}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!agentsLoading && filteredAgents.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No agents found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Try adjusting your search terms or filters to find the perfect agent for your needs.
            </p>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty('all');
                setSelectedExperience('all');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}