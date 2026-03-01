import React from 'react';
import { MapPin } from 'lucide-react';

export interface LocationSuggestion {
  id: string;
  placeName: string;
  mainText: string;
  secondaryText: string;
  type: 'city' | 'county' | 'neighborhood' | 'address' | 'region' | 'place';
}

interface SearchSuggestionsProps {
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: LocationSuggestion) => void;
  visible: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  isLoading,
  onSelectSuggestion,
  visible
}) => {
  if (!visible) return null;
  
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 w-full bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="px-4 py-3 text-sm text-gray-500 font-medium">
          Loading suggestions...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500 font-medium">
          No suggestions found
        </div>
      ) : (
        <ul className="max-h-60 overflow-y-auto py-1">
          {suggestions.map((suggestion) => (
            <li 
              key={suggestion.id}
              className="px-3 py-3 hover:bg-primary/5 cursor-pointer flex items-center transition-colors duration-150"
              onClick={() => onSelectSuggestion(suggestion)}
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
  );
};

export default SearchSuggestions;