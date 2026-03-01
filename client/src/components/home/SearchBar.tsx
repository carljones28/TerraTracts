import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { performAISearch } from '@/lib/openai';
import { Search, Mic, SlidersHorizontal, Loader2, Brain, Tag, MapPin, DollarSign, LayoutGrid } from 'lucide-react';

interface AISearchResponse {
  properties: any[];
  interpretation: {
    intent: string;
    extractedCriteria: {
      priceRange: string;
      location: string;
      propertyType: string;
      size: string;
      features: string[];
    };
    suggestedFilters: string[];
  };
}

interface SearchBarProps {
  onSearchResults?: (results: AISearchResponse) => void;
}

const SearchBar = ({ onSearchResults }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchInterpretation, setSearchInterpretation] = useState<AISearchResponse['interpretation'] | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchInterpretation(null);
    
    try {
      const results = await performAISearch(searchQuery);
      
      // Store the search interpretation for display
      if (results.interpretation) {
        setSearchInterpretation(results.interpretation);
      }
      
      // Pass results to parent component if the callback exists
      if (onSearchResults) {
        onSearchResults(results);
      }
      
      // Show search results in a toast notification
      toast({
        title: `${results.properties.length} properties found`,
        description: `SmartMatch™ found ${results.properties.length} properties matching your criteria`,
        duration: 3000,
      });
      
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to perform AI search. Please try again.",
        variant: "destructive",
      });
      setSearchInterpretation(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-bar w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          
          <input 
            type="text" 
            placeholder="Try 'hunting land in Montana under $500k'" 
            className="light-input w-full py-3 pl-12 pr-32"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div className="absolute right-2 flex items-center space-x-2">
            <button 
              type="button"
              className="light-button-secondary md:flex items-center px-3 py-1.5"
            >
              <SlidersHorizontal className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline text-sm">Filters</span>
            </button>
            
            <button 
              type="button"
              className="light-button-primary rounded-md p-2 text-white flex items-center justify-center"
              onClick={() => toast({
                title: "Voice Search",
                description: "Voice search functionality coming soon!"
              })}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="mt-3 w-full light-button-primary py-3 flex items-center justify-center disabled:opacity-50"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              <span>SmartMatch™ Search</span>
            </>
          )}
        </button>
      </form>
      
      {/* AI Search Interpretation */}
      {searchInterpretation && (
        <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Brain className="h-4 w-4 text-primary mr-2" />
            <h3 className="text-sm font-semibold text-slate-800">SmartMatch™ Interpretation</h3>
          </div>
          
          <p className="text-sm text-slate-600 mb-3">{searchInterpretation.intent}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {searchInterpretation.extractedCriteria.location && (
              <div className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs">
                <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                <span>{searchInterpretation.extractedCriteria.location}</span>
              </div>
            )}
            
            {searchInterpretation.extractedCriteria.priceRange && (
              <div className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs">
                <DollarSign className="h-3 w-3 mr-1 text-slate-400" />
                <span>{searchInterpretation.extractedCriteria.priceRange}</span>
              </div>
            )}
            
            {searchInterpretation.extractedCriteria.propertyType && (
              <div className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs">
                <LayoutGrid className="h-3 w-3 mr-1 text-slate-400" />
                <span>{searchInterpretation.extractedCriteria.propertyType}</span>
              </div>
            )}
            
            {searchInterpretation.extractedCriteria.size && (
              <div className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs">
                <Tag className="h-3 w-3 mr-1 text-slate-400" />
                <span>{searchInterpretation.extractedCriteria.size}</span>
              </div>
            )}
            
            {searchInterpretation.extractedCriteria.features?.map((feature, index) => (
              <div key={index} className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs">
                <Tag className="h-3 w-3 mr-1 text-slate-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          
          {searchInterpretation.suggestedFilters && searchInterpretation.suggestedFilters.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-slate-500 mb-1">Also consider:</div>
              <div className="flex flex-wrap gap-1.5">
                {searchInterpretation.suggestedFilters.map((filter, index) => (
                  <div key={index} className="text-xs bg-blue-50 text-blue-600 rounded-md px-2 py-0.5 cursor-pointer hover:bg-blue-100">
                    {filter}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
