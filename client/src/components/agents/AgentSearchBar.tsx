import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { MapPin, User, Loader2, X } from 'lucide-react';
import { geocodeLocation } from '@/lib/mapUtils';
import SearchSuggestions, { LocationSuggestion } from '@/components/home/SearchSuggestions';
import { fetchLocationSuggestions } from '@/lib/geocodingSuggestions';
import useDebounce from '@/hooks/use-debounce';
import { AgentWithUserInfo } from '@/hooks/use-agents';
import { useQuery } from '@tanstack/react-query';

interface AgentSearchBarProps {
  agents: any[]; // Using any for agent type since the provided agents may differ
  searchTab: 'location' | 'name';
  setSearchTab: (tab: 'location' | 'name') => void;
  onLocationSearch: (location: string) => void;
  onAgentSearch: (name: string) => void;
}

const AgentSearchBar: React.FC<AgentSearchBarProps> = ({ 
  agents, 
  searchTab, 
  setSearchTab,
  onLocationSearch,
  onAgentSearch
}) => {
  const { toast } = useToast();
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [agentSuggestions, setAgentSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Fetch Mapbox token
  const { data: configData } = useQuery({
    queryKey: ['/api/config'],
    staleTime: 3600000, // 1 hour
  });
  
  const mapboxToken = configData?.mapboxApiKey || '';
  
  // Fetch suggestions when search query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setLocationSuggestions([]);
      setAgentSuggestions([]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    
    if (searchTab === 'location' && mapboxToken) {
      // Fetch location suggestions
      fetchLocationSuggestions(debouncedQuery, mapboxToken)
        .then(results => {
          setLocationSuggestions(results);
          setIsLoadingSuggestions(false);
        })
        .catch(error => {
          console.error('Error fetching location suggestions:', error);
          setLocationSuggestions([]);
          setIsLoadingSuggestions(false);
        });
    } else if (searchTab === 'name') {
      // Filter agents for name suggestions
      const query = debouncedQuery.toLowerCase();
      const filteredAgents = agents
        .filter(agent => {
          const firstName = agent.firstName || agent.user?.firstName || '';
          const lastName = agent.lastName || agent.user?.lastName || '';
          const brokerage = agent.brokerage || '';
          
          return firstName.toLowerCase().includes(query) || 
                lastName.toLowerCase().includes(query) ||
                brokerage.toLowerCase().includes(query);
        })
        .slice(0, 10);
      
      setAgentSuggestions(filteredAgents);
      setIsLoadingSuggestions(false);
    }
  }, [debouncedQuery, searchTab, mapboxToken, agents]);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      if (searchTab === 'location') {
        console.log('Searching for agents in', searchQuery);
        // Geocode the location query
        const geocodeResult = await geocodeLocation(searchQuery);
        console.log('Geocoding location:', searchQuery);
        
        if (geocodeResult) {
          console.log('Best geocoding result chosen:', geocodeResult);
          
          // Search with the formatted location
          onLocationSearch(geocodeResult.placeName);
        } else {
          // Search with the raw query as a fallback
          onLocationSearch(searchQuery);
        }
      } else {
        // Searching by agent name
        onAgentSearch(searchQuery);
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast({
        title: "Search Error",
        description: "There was an error processing your search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };
  
  const handleSelectLocationSuggestion = (suggestion: LocationSuggestion) => {
    setSearchQuery(suggestion.placeName);
    setShowSuggestions(false);
    
    // Submit the search immediately
    onLocationSearch(suggestion.placeName);
  };
  
  const handleSelectAgentSuggestion = (agent: any) => {
    const firstName = agent.firstName || agent.user?.firstName || '';
    const lastName = agent.lastName || agent.user?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    setSearchQuery(fullName);
    setShowSuggestions(false);
    
    // Submit the search immediately
    onAgentSearch(fullName);
  };
  
  // Handle tabs
  const handleTabChange = (tab: 'location' | 'name') => {
    setSearchTab(tab);
    setSearchQuery('');
    setShowSuggestions(false);
    setLocationSuggestions([]);
    setAgentSuggestions([]);
  };
  
  // Component to render agent suggestions
  const AgentSuggestionsComponent = () => {
    if (!showSuggestions || searchQuery.length < 2) return null;
    
    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-1 w-full bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden">
        {isLoadingSuggestions ? (
          <div className="px-4 py-3 text-sm text-gray-500 font-medium">
            Loading suggestions...
          </div>
        ) : agentSuggestions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 font-medium">
            No agent suggestions found
          </div>
        ) : (
          <ul className="max-h-60 overflow-y-auto py-1">
            {agentSuggestions.map((agent) => {
              const firstName = agent.firstName || agent.user?.firstName || '';
              const lastName = agent.lastName || agent.user?.lastName || '';
              const brokerage = agent.brokerage || '';
              
              return (
                <li 
                  key={agent.id}
                  className="px-3 py-3 hover:bg-primary/5 cursor-pointer flex items-center transition-colors duration-150"
                  onClick={() => handleSelectAgentSuggestion(agent)}
                >
                  <div className="flex-shrink-0 text-primary mr-3">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {firstName} {lastName}
                    </span>
                    {brokerage && (
                      <span className="text-xs text-gray-500 mt-0.5">{brokerage}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="w-full" ref={searchBarRef}>
      {/* Search tabs */}
      <div className="flex border-b border-gray-200 mb-2">
        <button 
          type="button"
          className={`py-3 px-6 font-medium text-sm ${searchTab === 'location' ? 'text-[#006aff] border-b-2 border-[#006aff]' : 'text-gray-700'}`}
          onClick={() => handleTabChange('location')}
        >
          Location
        </button>
        <button 
          type="button"
          className={`py-3 px-6 font-medium text-sm ${searchTab === 'name' ? 'text-[#006aff] border-b-2 border-[#006aff]' : 'text-gray-700'}`}
          onClick={() => handleTabChange('name')}
        >
          Name
        </button>
      </div>
      
      {/* Search container with suggestions dropdown */}
      <div className="relative w-full" style={{ position: 'static' }}>
        {/* Zillow-style search bar */}
        <div className="bg-white rounded-full shadow-lg overflow-hidden flex border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <form onSubmit={handleSubmit} className="relative flex w-full items-center">
            <div className="absolute left-4 text-gray-400">
              {searchTab === 'location' ? (
                <MapPin className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            
            <input 
              type="text" 
              placeholder={searchTab === 'location' ? "City, ZIP, Address" : "Agent name or brokerage"}
              className="w-full h-12 py-0 pl-12 pr-12 text-base text-black font-medium border-0 focus:outline-none focus:ring-0"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />
            
            {searchQuery && (
              <button
                type="button"
                className="absolute right-20 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={handleClearSearch}
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            <button 
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="h-12 px-5 bg-[#006aff] text-white text-sm font-medium rounded-r-full hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="font-bold">Search</span>
              )}
            </button>
          </form>
        </div>
        
        {/* Suggestions Dropdown */}
        {searchTab === 'location' && showSuggestions && searchQuery.length >= 2 && (
          <div 
            className="fixed mt-1 bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden"
            style={{ 
              zIndex: 9999, 
              width: '100%', 
              maxWidth: '500px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {isLoadingSuggestions ? (
              <div className="px-4 py-3 text-sm text-gray-500 font-medium">
                Loading suggestions...
              </div>
            ) : locationSuggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 font-medium">
                No suggestions found
              </div>
            ) : (
              <ul className="max-h-60 overflow-y-auto py-1">
                {locationSuggestions.map((suggestion) => (
                  <li 
                    key={suggestion.id}
                    className="px-3 py-3 hover:bg-primary/5 cursor-pointer flex items-center transition-colors duration-150"
                    onClick={() => handleSelectLocationSuggestion(suggestion)}
                  >
                    <div className="flex-shrink-0 text-primary mr-3">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">{suggestion.mainText}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{suggestion.secondaryText}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {/* Agent suggestions - directly in component */}
        {searchTab === 'name' && showSuggestions && searchQuery.length >= 2 && (
          <div 
            className="fixed mt-1 bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden"
            style={{ 
              zIndex: 9999, 
              width: '100%', 
              maxWidth: '500px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {isLoadingSuggestions ? (
              <div className="px-4 py-3 text-sm text-gray-500 font-medium">
                Loading suggestions...
              </div>
            ) : agentSuggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 font-medium">
                No agent suggestions found
              </div>
            ) : (
              <ul className="max-h-60 overflow-y-auto py-1">
                {agentSuggestions.map((agent) => {
                  const firstName = agent.firstName || agent.user?.firstName || '';
                  const lastName = agent.lastName || agent.user?.lastName || '';
                  const brokerage = agent.brokerage || '';
                  
                  return (
                    <li 
                      key={agent.id}
                      className="px-3 py-3 hover:bg-primary/5 cursor-pointer flex items-center transition-colors duration-150"
                      onClick={() => handleSelectAgentSuggestion(agent)}
                    >
                      <div className="flex-shrink-0 text-primary mr-3">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                          {firstName} {lastName}
                        </span>
                        {brokerage && (
                          <span className="text-xs text-gray-500 mt-0.5">{brokerage}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentSearchBar;