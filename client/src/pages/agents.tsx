import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Award, Star, Briefcase, Phone, Mail, 
  Calendar, ArrowRight, Filter, UserCheck, Building, MapIcon,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, X,
  TrendingUp, Users, Clock, CheckCircle, Search, SlidersHorizontal,
  Verified, Trophy, Target, DollarSign, Home, MapPin, MessageCircle
} from 'lucide-react';
import { 
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import AgentSearchBar from '@/components/agents/AgentSearchBar';
import { getUserLocation } from '@/services/location-service';
import useDebounce from '@/hooks/use-debounce';
import { fetchLocationSuggestions } from '@/lib/geocodingSuggestions';
import { LocationSuggestion } from '@/types/location';
import ContactAgentModal from '@/components/agent/ContactAgentModal';
import { DirectAgentContactModal } from '@/components/agent/DirectAgentContactModal';

// Hero image background - update this to match your own image if needed
const heroBackground = "url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')";

// Multi-select component for filters
const MultiSelectFilter = ({ 
  options, 
  selected, 
  onSelectionChange, 
  placeholder, 
  icon: Icon, 
  gradientFrom, 
  gradientTo, 
  borderColor, 
  hoverBorderColor,
  iconColor,
  hoverBackgroundColor
}: {
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder: string;
  icon: any;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  hoverBorderColor: string;
  iconColor: string;
  hoverBackgroundColor: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    updatePosition();
    
    if (isOpen) {
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const handleOptionToggle = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter(item => item !== option));
    } else {
      onSelectionChange([...selected, option]);
    }
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-52 bg-gradient-to-r ${gradientFrom} ${gradientTo} ${borderColor} ${hoverBorderColor} rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-gray-900 font-medium px-4 py-3 flex items-center justify-between border-2`}
        >
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <span>{selected.length > 0 ? `${placeholder} (${selected.length})` : placeholder}</span>
          </div>
          <ChevronDown className={`h-4 w-4 ${iconColor} transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-96 overflow-hidden"
          style={{ 
            position: 'absolute',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 999999
          }}
        >
          <div className="p-4">
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => (
                <label
                  key={option}
                  className={`flex items-center space-x-3 py-2 px-3 rounded-lg cursor-pointer transition-colors ${hoverBackgroundColor} hover:bg-opacity-50`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => handleOptionToggle(option)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-900 font-medium capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-200 p-4">
            <Button
              onClick={handleApply}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
            >
              Apply
            </Button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const AgentDirectory = () => {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [locationBasedState, setLocationBasedState] = useState(''); // Track location-based state separately
  const [userSelectedState, setUserSelectedState] = useState(false); // Track if user manually selected state
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTab, setSearchTab] = useState<'location' | 'name'>('location');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{city: string, state: string} | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Initialize user location
  useEffect(() => {
    const initializeLocation = async () => {
      const location = await getUserLocation();
      setUserLocation(location);
      // Set default state based on user location
      if (!selectedState) {
        // Map state abbreviations to full names for the filter
        const stateAbbrevToName: Record<string, string> = {
          'TX': 'Texas', 'CA': 'California', 'CO': 'Colorado', 'MT': 'Montana', 'WY': 'Wyoming',
          'OR': 'Oregon', 'WA': 'Washington', 'OK': 'Oklahoma', 'NM': 'New Mexico', 'AZ': 'Arizona',
          'UT': 'Utah', 'NV': 'Nevada', 'ID': 'Idaho', 'FL': 'Florida', 'GA': 'Georgia',
          'NC': 'North Carolina', 'SC': 'South Carolina', 'VA': 'Virginia', 'TN': 'Tennessee',
          'KY': 'Kentucky', 'MO': 'Missouri', 'AR': 'Arkansas', 'LA': 'Louisiana', 'MS': 'Mississippi',
          'AL': 'Alabama', 'IL': 'Illinois', 'IN': 'Indiana', 'OH': 'Ohio', 'MI': 'Michigan',
          'WI': 'Wisconsin', 'MN': 'Minnesota', 'IA': 'Iowa', 'KS': 'Kansas', 'NE': 'Nebraska',
          'ND': 'North Dakota', 'SD': 'South Dakota', 'NY': 'New York', 'PA': 'Pennsylvania',
          'NJ': 'New Jersey', 'CT': 'Connecticut', 'MA': 'Massachusetts', 'VT': 'Vermont',
          'NH': 'New Hampshire', 'ME': 'Maine', 'RI': 'Rhode Island', 'DE': 'Delaware',
          'MD': 'Maryland', 'WV': 'West Virginia', 'AK': 'Alaska', 'HI': 'Hawaii'
        };
        
        // Convert state based on format (handle both abbreviations and full names)
        const stateName = location.state.length === 2 
          ? stateAbbrevToName[location.state] || location.state
          : location.state;
        
        setLocationBasedState(stateName); // Store location-based state separately
        // Only set selectedState if user hasn't manually selected a state
        if (!userSelectedState) {
          setSelectedState(stateName);
        }
      }
    };
    initializeLocation();
  }, []);

  // Fetch Mapbox API key
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          if (data.mapboxApiKey) {
            setMapboxToken(data.mapboxApiKey);
          }
        }
      } catch (error) {
        console.error('Error fetching Mapbox API key:', error);
      }
    };
    fetchMapboxToken();
  }, []);

  // No need for external API suggestions - we'll use local data directly
  
  // Map state names to abbreviations for comparison
  const stateAbbreviations: Record<string, string> = {
    'texas': 'TX', 'florida': 'FL', 'california': 'CA', 'new york': 'NY', 'illinois': 'IL',
    'pennsylvania': 'PA', 'ohio': 'OH', 'georgia': 'GA', 'north carolina': 'NC', 'michigan': 'MI',
    'new jersey': 'NJ', 'virginia': 'VA', 'washington': 'WA', 'arizona': 'AZ', 'massachusetts': 'MA',
    'tennessee': 'TN', 'indiana': 'IN', 'missouri': 'MO', 'maryland': 'MD', 'wisconsin': 'WI',
    'minnesota': 'MN', 'colorado': 'CO', 'alabama': 'AL', 'south carolina': 'SC', 'louisiana': 'LA',
    'kentucky': 'KY', 'oregon': 'OR', 'oklahoma': 'OK', 'connecticut': 'CT', 'utah': 'UT',
    'iowa': 'IA', 'nevada': 'NV', 'arkansas': 'AR', 'mississippi': 'MS', 'kansas': 'KS',
    'new mexico': 'NM', 'nebraska': 'NE', 'west virginia': 'WV', 'idaho': 'ID', 'hawaii': 'HI',
    'new hampshire': 'NH', 'maine': 'ME', 'montana': 'MT', 'rhode island': 'RI', 'delaware': 'DE',
    'south dakota': 'SD', 'north dakota': 'ND', 'alaska': 'AK', 'vermont': 'VT', 'wyoming': 'WY'
  };

  // Define agent type
  interface Agent {
    id: number;
    userId: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    brokerage: string;
    bio?: string;
    profileImage?: string;
    averageRating?: string | number;
    totalReviews?: number;
    specialtyAreas?: string[];
    expertiseCategories?: string[];
    statesLicensed?: string[];
    certifications?: Array<{id: number, certType: string}>;
    isTeam?: boolean;
    totalTransactions?: number;
    totalAcresSold?: number;
    activeListing?: number;
    minPrice?: string;
    maxPrice?: string;
  }

  // Example locations for autofill
  const locations = [
    "Dallas, TX", 
    "Austin, TX", 
    "Houston, TX", 
    "San Antonio, TX", 
    "New York, NY", 
    "Los Angeles, CA", 
    "Chicago, IL", 
    "Denver, CO", 
    "Seattle, WA", 
    "Miami, FL"
  ];
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedState, selectedSpecialties, selectedLanguages, selectedExperience, selectedRating, selectedPriceRange, searchTerm]);

  // Fetch agents
  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents', selectedState, selectedSpecialties, selectedLanguages, selectedExperience, selectedRating, selectedPriceRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState && selectedState !== 'all') {
        // Map full state names to abbreviations
        const stateMap: Record<string, string> = {
          'Texas': 'TX', 'California': 'CA', 'Colorado': 'CO', 'Montana': 'MT', 'Wyoming': 'WY',
          'Oregon': 'OR', 'Washington': 'WA', 'Oklahoma': 'OK', 'New Mexico': 'NM', 'Arizona': 'AZ',
          'Utah': 'UT', 'Nevada': 'NV', 'Idaho': 'ID', 'Florida': 'FL', 'Georgia': 'GA',
          'North Carolina': 'NC', 'South Carolina': 'SC', 'Virginia': 'VA', 'Tennessee': 'TN',
          'Kentucky': 'KY', 'Missouri': 'MO', 'Arkansas': 'AR', 'Louisiana': 'LA', 'Mississippi': 'MS',
          'Alabama': 'AL', 'Illinois': 'IL', 'Indiana': 'IN', 'Ohio': 'OH', 'Michigan': 'MI',
          'Wisconsin': 'WI', 'Minnesota': 'MN', 'Iowa': 'IA', 'Kansas': 'KS', 'Nebraska': 'NE',
          'North Dakota': 'ND', 'South Dakota': 'SD', 'New York': 'NY', 'Pennsylvania': 'PA',
          'New Jersey': 'NJ', 'Connecticut': 'CT', 'Massachusetts': 'MA', 'Vermont': 'VT',
          'New Hampshire': 'NH', 'Maine': 'ME', 'Rhode Island': 'RI', 'Delaware': 'DE',
          'Maryland': 'MD', 'West Virginia': 'WV', 'Alaska': 'AK', 'Hawaii': 'HI'
        };
        params.append('state', stateMap[selectedState] || selectedState);
      }
      if (selectedSpecialties.length > 0) params.append('expertise', selectedSpecialties.join(','));
      if (selectedLanguages.length > 0) params.append('language', selectedLanguages.join(','));
      if (selectedExperience && selectedExperience !== 'all') params.append('experience', selectedExperience);
      if (selectedRating && selectedRating !== 'all') params.append('rating', selectedRating);
      if (selectedPriceRange && selectedPriceRange !== 'all') params.append('priceRange', selectedPriceRange);
      
      const response = await fetch(`/api/agents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    }
  });
  
  // Comprehensive city-to-state mapping
  const cityToStateMap: Record<string, string> = {
    // Texas
    "dallas": "Texas", "austin": "Texas", "houston": "Texas", "san antonio": "Texas", 
    "fort worth": "Texas", "el paso": "Texas", "arlington": "Texas", "corpus christi": "Texas",
    "plano": "Texas", "lubbock": "Texas", "laredo": "Texas", "garland": "Texas",
    
    // California
    "los angeles": "California", "san diego": "California", "san jose": "California", 
    "san francisco": "California", "fresno": "California", "sacramento": "California",
    "long beach": "California", "oakland": "California", "bakersfield": "California",
    "anaheim": "California", "santa ana": "California", "riverside": "California",
    
    // Florida
    "jacksonville": "Florida", "miami": "Florida", "tampa": "Florida", "orlando": "Florida",
    "st petersburg": "Florida", "hialeah": "Florida", "tallahassee": "Florida",
    "fort lauderdale": "Florida", "port st lucie": "Florida", "cape coral": "Florida",
    
    // New York
    "new york": "New York", "buffalo": "New York", "rochester": "New York", "yonkers": "New York",
    "syracuse": "New York", "albany": "New York", "new rochelle": "New York",
    "mount vernon": "New York", "schenectady": "New York", "utica": "New York",
    
    // Illinois
    "chicago": "Illinois", "aurora-il": "Illinois", "rockford": "Illinois", "joliet": "Illinois",
    "naperville": "Illinois", "springfield-il": "Illinois", "peoria-il": "Illinois",
    "elgin": "Illinois", "waukegan": "Illinois", "cicero": "Illinois"
  };
  
  // Filter agents by search term AND selected state
  const filteredAgents = React.useMemo(() => {
    if (!agents) return [];
    
    let filtered = agents;
    
    console.log('=== FILTERING DEBUG ===');
    console.log('Total agents:', agents.length);
    console.log('Selected state:', selectedState);
    console.log('Search term:', searchTerm);
    
    // First, filter by selected state if any
    if (selectedState && selectedState !== 'all') {
      const stateAbbrev = stateAbbreviations[selectedState.toLowerCase()];
      console.log('State abbreviation for', selectedState, ':', stateAbbrev);
      
      filtered = filtered.filter((agent: Agent) => {
        const hasState = agent.statesLicensed && (
          agent.statesLicensed.includes(stateAbbrev) || 
          agent.statesLicensed.includes(selectedState)
        );
        return hasState;
      });
      
      console.log('After state filter:', filtered.length);
    }
    
    // Then, filter by search term if any
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      
      // Check if search term is a city that maps to a state
      const mappedState = cityToStateMap[searchLower];
      console.log('Mapped state for city', searchTerm, ':', mappedState);
      
      filtered = filtered.filter((agent: Agent) => {
        // Search in agent details (name, brokerage, bio, specialties)
        const matchesAgentDetails = (
          (agent.user?.firstName && agent.user.firstName.toLowerCase().includes(searchLower)) ||
          (agent.user?.lastName && agent.user.lastName.toLowerCase().includes(searchLower)) ||
          (agent.brokerage && agent.brokerage.toLowerCase().includes(searchLower)) ||
          (agent.bio && agent.bio.toLowerCase().includes(searchLower)) ||
          (agent.specialtyAreas && agent.specialtyAreas.some(specialty => 
            specialty.toLowerCase().includes(searchLower)
          )) ||
          (agent.expertiseCategories && agent.expertiseCategories.some(category => 
            category.toLowerCase().includes(searchLower)
          ))
        );
        
        // If search term is a city, match agents from that state
        const matchesLocation = mappedState && agent.statesLicensed && 
          agent.statesLicensed.some(state => {
            const stateAbbrev = stateAbbreviations[mappedState.toLowerCase()];
            return state === stateAbbrev;
          });
        
        // If search term is a state name, match agents from that state
        const searchStateAbbrev = stateAbbreviations[searchLower];
        const matchesState = searchStateAbbrev && agent.statesLicensed && 
          agent.statesLicensed.includes(searchStateAbbrev);
        
        // If search term is already a state abbreviation, match directly
        const matchesStateAbbrev = agent.statesLicensed && 
          agent.statesLicensed.some(state => state.toLowerCase() === searchLower);
        
        return matchesAgentDetails || matchesLocation || matchesState || matchesStateAbbrev;
      });
      
      console.log('After search filter:', filtered.length);
    }
    
    console.log('Final filtered count:', filtered.length);
    
    return filtered;
  }, [agents, searchTerm, selectedState, cityToStateMap, stateAbbreviations])
  // Sort by rating
  ?.sort((a, b) => {
    const ratingA = parseFloat(a.averageRating as string || '0');
    const ratingB = parseFloat(b.averageRating as string || '0');
    return ratingB - ratingA; // Sort by rating descending
  });

  // Pagination logic
  const AGENTS_PER_PAGE = 12;
  const totalPages = Math.ceil((filteredAgents?.length || 0) / AGENTS_PER_PAGE);
  const paginatedAgents = filteredAgents?.slice(
    (currentPage - 1) * AGENTS_PER_PAGE,
    currentPage * AGENTS_PER_PAGE
  );
  
  // Get agent names for autocomplete
  const agentNames = agents?.map(agent => `${agent.user?.firstName} ${agent.user?.lastName}`) || [];

  // US States for filter
  const stateNames = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", 
    "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", 
    "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];


  
  // Expertise specialties (comprehensive list from database)
  const specialties = [
    "recreational", "agricultural", "waterfront", "commercial", "residential", 
    "farm", "conservation", "development", "hunting", "timber", "mountain", 
    "ranch", "land sales", "property development", "investment advisory"
  ];
  

  
  // Function to get initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };
  
  // Generate comprehensive search suggestions from all available data
  const generateSearchSuggestions = React.useMemo(() => {
    const suggestions = new Set<string>();
    
    // Add all state names
    stateNames.forEach(state => suggestions.add(state));
    
    // Add all state abbreviations
    Object.values(stateAbbreviations).forEach(abbrev => suggestions.add(abbrev));
    
    // Add all cities from our city-to-state mapping
    Object.keys(cityToStateMap).forEach(city => {
      // Convert city key to proper display format (e.g., "dallas" -> "Dallas")
      const formattedCity = city.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
      suggestions.add(formattedCity);
    });
    
    // Add all specialties
    specialties.forEach(specialty => {
      // Capitalize first letter
      const formattedSpecialty = specialty.charAt(0).toUpperCase() + specialty.slice(1);
      suggestions.add(formattedSpecialty);
    });
    
    // Add agent names if available
    if (agents) {
      agents.forEach(agent => {
        if (agent.user?.firstName && agent.user?.lastName) {
          suggestions.add(`${agent.user.firstName} ${agent.user.lastName}`);
        }
      });
      
      // Add actual specialties from agents
      agents.forEach(agent => {
        if (agent.specialtyAreas) {
          agent.specialtyAreas.forEach(specialty => {
            suggestions.add(specialty);
          });
        }
        if (agent.expertiseCategories) {
          agent.expertiseCategories.forEach(category => {
            suggestions.add(category);
          });
        }
      });
    }
    
    return Array.from(suggestions);
  }, [agents, stateNames, stateAbbreviations, specialties]);
  
  // Filter suggestions based on search term
  const filteredSuggestions = React.useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = generateSearchSuggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Limit to 10 suggestions
    
    return filtered;
  }, [searchTerm, generateSearchSuggestions]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Show suggestions when typing
    if (value.length > 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };



  // Handle click outside to close suggestions
  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search submission
  const handleSearch = () => {
    const searchLower = searchTerm.toLowerCase().trim();
    const searchOriginal = searchTerm.trim();
    
    console.log('=== SEARCH DEBUG ===');
    console.log('Search term:', searchTerm);
    console.log('Search lower:', searchLower);
    console.log('Total agents:', agents?.length);
    
    // Check if the search term is a city
    const matchedState = cityToStateMap[searchLower];
    
    if (matchedState) {
      // If it's a city, set the state filter to the corresponding state
      setSelectedState(matchedState);
      setUserSelectedState(true);
      console.log(`City "${searchTerm}" mapped to state: ${matchedState}`);
    } else if (stateNames.includes(searchOriginal)) {
      // If it's a full state name, set it as the selected state
      setSelectedState(searchOriginal);
      setUserSelectedState(true);
      console.log(`State filter set to: ${searchOriginal}`);
    } else if (stateAbbreviations[searchLower]) {
      // If it's a state abbreviation, convert to full name and set as selected state
      const stateName = Object.keys(stateAbbreviations).find(key => 
        stateAbbreviations[key] === searchOriginal.toUpperCase()
      );
      if (stateName) {
        const formattedStateName = stateName.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        setSelectedState(formattedStateName);
        setUserSelectedState(true);
        console.log(`State abbreviation "${searchOriginal}" mapped to: ${formattedStateName}`);
      }
    } else {
      // If it's not a city or state, search in agent details
      console.log(`Searching for: ${searchTerm}`);
    }
    
    // Log filtered results after search
    setTimeout(() => {
      console.log('Filtered agents after search:', filteredAgents?.length);
      console.log('Selected state:', selectedState);
    }, 100);
    
    setShowSuggestions(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Hero Section */}
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
        
        <div className="relative pt-24 pb-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent block leading-normal py-2">
                Land Agent
              </span>
            </h1>
            
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Connect with top-rated land specialists who understand your unique needs and local market dynamics
            </p>
            
            {/* Premium Search Interface */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="flex-1 relative" ref={searchRef}>
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search by location, agent name, or specialty..."
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="pl-12 pr-4 py-4 text-lg border-0 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-500"
                    />
                    
                    {/* Search Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-[99999] max-h-64 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 text-gray-700 font-medium transition-colors"
                            onClick={() => {
                              setSearchTerm(suggestion);
                              setShowSuggestions(false);
                              // Trigger search immediately when suggestion is clicked
                              setTimeout(() => {
                                // Process the suggestion as a search
                                const searchLower = suggestion.toLowerCase().trim();
                                const matchedState = cityToStateMap[searchLower];
                                
                                if (matchedState) {
                                  // If it's a city, set the state filter
                                  setSelectedState(matchedState);
                                  setUserSelectedState(true);
                                  console.log(`City "${suggestion}" mapped to state: ${matchedState}`);
                                } else if (stateNames.includes(suggestion)) {
                                  // If it's a full state name, set it as the selected state
                                  setSelectedState(suggestion);
                                  setUserSelectedState(true);
                                  console.log(`State filter set to: ${suggestion}`);
                                } else if (stateAbbreviations[searchLower]) {
                                  // If it's a state abbreviation, convert to full name
                                  const stateName = Object.keys(stateAbbreviations).find(key => 
                                    stateAbbreviations[key] === suggestion.toUpperCase()
                                  );
                                  if (stateName) {
                                    const formattedStateName = stateName.split(' ').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ');
                                    setSelectedState(formattedStateName);
                                    setUserSelectedState(true);
                                    console.log(`State abbreviation "${suggestion}" mapped to: ${formattedStateName}`);
                                  }
                                }
                              }, 10);
                            }}
                          >
                            <Search className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-700 font-medium">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Find Agents
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Filters Section */}
      <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 shadow-lg border-b border-blue-200/30 py-8 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4" style={{ overflow: 'visible' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/40" style={{ overflow: 'visible' }}>
            <div className="flex flex-col lg:flex-row gap-6 items-center" style={{ overflow: 'visible' }}>
              {/* Filter Header */}
              <div className="flex items-center gap-3 min-w-max">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-lg">
                  <SlidersHorizontal className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Filter Agents</h3>
                  <p className="text-sm text-gray-600">Find the perfect specialist for your needs</p>
                </div>
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-end flex-1" style={{ overflow: 'visible' }}>
                <div className="relative">
                  <Select value={selectedState} onValueChange={(value) => {
                    setSelectedState(value);
                    setUserSelectedState(true);
                  }}>
                    <SelectTrigger className="w-52 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <SelectValue placeholder="Select State" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-200 rounded-2xl shadow-xl">
                      <SelectItem value="all" className="font-medium text-gray-900">All States</SelectItem>
                      {stateNames.map(state => (
                        <SelectItem key={state} value={state} className="hover:bg-blue-50">{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <MultiSelectFilter
                  options={specialties}
                  selected={selectedSpecialties}
                  onSelectionChange={setSelectedSpecialties}
                  placeholder="Specialty"
                  icon={Target}
                  gradientFrom="from-green-50"
                  gradientTo="to-green-100"
                  borderColor="border-green-200"
                  hoverBorderColor="hover:border-green-300"
                  iconColor="text-green-600"
                  hoverBackgroundColor="hover:bg-green-50"
                />
                
                <MultiSelectFilter
                  options={['English', 'Spanish', 'French', 'Mandarin', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Russian']}
                  selected={selectedLanguages}
                  onSelectionChange={setSelectedLanguages}
                  placeholder="Language"
                  icon={Users}
                  gradientFrom="from-purple-50"
                  gradientTo="to-purple-100"
                  borderColor="border-purple-200"
                  hoverBorderColor="hover:border-purple-300"
                  iconColor="text-purple-600"
                  hoverBackgroundColor="hover:bg-purple-50"
                />
                
                <div className="relative">
                  <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                    <SelectTrigger className="w-52 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:border-orange-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <SelectValue placeholder="Experience" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-orange-200 rounded-2xl shadow-xl">
                      <SelectItem value="all" className="font-medium text-gray-900">All Experience</SelectItem>
                      <SelectItem value="0-2" className="hover:bg-orange-50">0-2 years</SelectItem>
                      <SelectItem value="3-5" className="hover:bg-orange-50">3-5 years</SelectItem>
                      <SelectItem value="6-10" className="hover:bg-orange-50">6-10 years</SelectItem>
                      <SelectItem value="11+" className="hover:bg-orange-50">11+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <Select value={selectedRating} onValueChange={setSelectedRating}>
                    <SelectTrigger className="w-52 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <SelectValue placeholder="Rating" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-yellow-200 rounded-2xl shadow-xl">
                      <SelectItem value="all" className="font-medium text-gray-900">All Ratings</SelectItem>
                      <SelectItem value="5" className="hover:bg-yellow-50">5 stars</SelectItem>
                      <SelectItem value="4+" className="hover:bg-yellow-50">4+ stars</SelectItem>
                      <SelectItem value="3+" className="hover:bg-yellow-50">3+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                    <SelectTrigger className="w-52 bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 hover:border-teal-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-teal-600" />
                        <SelectValue placeholder="Price Range" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-teal-200 rounded-2xl shadow-xl">
                      <SelectItem value="all" className="font-medium text-gray-900">All Prices</SelectItem>
                      <SelectItem value="0-100k" className="hover:bg-teal-50">$0 - $100k</SelectItem>
                      <SelectItem value="100k-500k" className="hover:bg-teal-50">$100k - $500k</SelectItem>
                      <SelectItem value="500k-1m" className="hover:bg-teal-50">$500k - $1M</SelectItem>
                      <SelectItem value="1m+" className="hover:bg-teal-50">$1M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear Filters Button */}
                {((selectedState && selectedState !== locationBasedState) || selectedSpecialties.length > 0 || selectedLanguages.length > 0 || selectedExperience || selectedRating || selectedPriceRange) && (
                  <Button
                    onClick={() => {
                      setSelectedState(locationBasedState); // Reset to location-based state
                      setUserSelectedState(false); // Reset user selection flag
                      setSelectedSpecialties([]);
                      setSelectedLanguages([]);
                      setSelectedExperience('');
                      setSelectedRating('');
                      setSelectedPriceRange('');
                      setCurrentPage(1); // Reset to first page
                    }}
                    variant="outline"
                    className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:border-red-300 text-red-700 hover:bg-red-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
            
            {/* Active Filters Display */}
            {((selectedState && selectedState !== locationBasedState) || selectedSpecialties.length > 0 || selectedLanguages.length > 0 || selectedExperience || selectedRating || selectedPriceRange) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  {selectedState && selectedState !== locationBasedState && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-full px-3 py-1 text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedState}
                    </Badge>
                  )}
                  {selectedSpecialties.map((specialty) => (
                    <Badge key={specialty} className="bg-green-100 text-green-800 hover:bg-green-200 rounded-full px-3 py-1 text-sm capitalize">
                      <Target className="h-3 w-3 mr-1" />
                      {specialty}
                    </Badge>
                  ))}
                  {selectedLanguages.map((language) => (
                    <Badge key={language} className="bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-full px-3 py-1 text-sm">
                      <Users className="h-3 w-3 mr-1" />
                      {language}
                    </Badge>
                  ))}
                  {selectedExperience && (
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 rounded-full px-3 py-1 text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedExperience} years
                    </Badge>
                  )}
                  {selectedRating && (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-full px-3 py-1 text-sm">
                      <Star className="h-3 w-3 mr-1" />
                      {selectedRating} stars
                    </Badge>
                  )}
                  {selectedPriceRange && (
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 rounded-full px-3 py-1 text-sm">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {selectedPriceRange}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        
        
        {/* Agent Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i: number) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
                  <div className="flex flex-col items-center">
                    <div className="w-44 h-44 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                    <div className="flex space-x-1 mb-4">
                      {[...Array(5)].map((_, i: number) => (
                        <div key={i} className="h-5 w-5 rounded-full bg-gray-200"></div>
                      ))}
                    </div>
                    <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAgents?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedAgents?.map((agent: Agent) => (
              <div 
                key={agent.id}
                className="group block"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2 h-full">
                  <div className="flex flex-col items-center text-center">
                    {/* Agent Avatar */}
                    <div className="relative mb-6">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition-opacity"></div>
                      <Avatar className="relative h-[180px] w-[180px] rounded-full border-4 border-white shadow-xl">
                        <AvatarImage src={agent.profileImage} alt={`${agent.user?.firstName} ${agent.user?.lastName}`} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-4xl font-bold">
                          {getInitials(agent.user?.firstName || '', agent.user?.lastName || '')}
                        </AvatarFallback>
                      </Avatar>
                      {/* Verified Badge */}
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg">
                        <Verified className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    
                    {/* Agent Info */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {agent.user?.firstName} {agent.user?.lastName}
                      </h3>
                      <p className="text-blue-600 font-medium mb-2">
                        {agent.brokerage}
                      </p>
                      
                      {/* Rating */}
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full px-3 py-1">
                          <Star className="h-4 w-4 text-white fill-white mr-1" />
                          <span className="text-white font-bold text-sm">
                            {parseFloat(agent.averageRating as string || '0').toFixed(1)}
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          ({agent.totalReviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                    
                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 gap-4 w-full mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                        <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-sm font-bold text-gray-900">
                          {agent.totalTransactions || 0}
                        </div>
                        <div className="text-xs text-gray-600">Transactions</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
                        <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <div className="text-sm font-bold text-gray-900">
                          {agent.totalAcresSold ? `${Number(agent.totalAcresSold).toLocaleString()}` : '0'}
                        </div>
                        <div className="text-xs text-gray-600">Acres Sold</div>
                      </div>
                    </div>
                    
                    {/* Specialties */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {agent.specialtyAreas && (
                          typeof agent.specialtyAreas === 'string' 
                            ? JSON.parse(agent.specialtyAreas).slice(0, 3).map((specialty: string, index: number) => (
                                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">
                                  {specialty}
                                </Badge>
                              ))
                            : Array.isArray(agent.specialtyAreas) 
                              ? agent.specialtyAreas.slice(0, 3).map((specialty: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">
                                    {specialty}
                                  </Badge>
                                ))
                              : null
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        asChild
                      >
                        <Link href={`/agents/${agent.id}`}>
                          <Users className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </Button>
                      <Button 
                        variant="outline"
                        className="bg-white/80 border-blue-200 hover:bg-blue-50 text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Open contact modal for this specific agent
                          setSelectedAgent(agent);
                          setIsContactModalOpen(true);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                <UserCheck className="h-12 w-12 text-blue-600 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No agents found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or filters to find agents that match your needs.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedState('');
                  setSelectedSpecialties([]);
                  setSelectedLanguages([]);
                  setSelectedExperience('');
                  setSelectedRating('');
                  setSelectedPriceRange('');
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === totalPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Work with a Top Agent?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Our agents are standing by to help you find, buy, or sell your perfect piece of land.
          </p>
          <Button 
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-8 py-4 rounded-2xl text-lg shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Contact Agent Modal */}
      {selectedAgent && (
        <ContactAgentModal
          agent={selectedAgent}
          property={undefined}
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </div>
  );
};

export default AgentDirectory;