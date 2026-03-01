import { useState } from 'react';
import { Search, ChevronDown, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropertySearchBarSimpleProps {
  onSearch?: (query: string) => void;
}

const PropertySearchBarSimple = ({ onSearch }: PropertySearchBarSimpleProps) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchText);
    }
  };

  return (
    <div className="w-full bg-white p-4 border-b border-gray-200 flex items-center justify-between gap-3">
      {/* Search input */}
      <div className="relative flex-grow max-w-md">
        <input
          type="text"
          placeholder="Address, City, ZIP, Neighborhood"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full h-10 pl-4 pr-10 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button 
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          onClick={handleSearch}
        >
          <Search className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Filters dropdown */}
        <Button variant="outline" className="h-10 bg-gray-50 text-sm flex items-center text-gray-700 border-gray-300 px-4">
          <LayoutGrid className="h-4 w-4 mr-2 text-gray-500" />
          <span>Filters</span>
          <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
        </Button>

        {/* Map dropdown */}
        <Button variant="outline" className="h-10 bg-gray-50 text-sm flex items-center text-gray-700 border-gray-300 px-4">
          <span>Map</span>
          <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
        </Button>

        {/* Sort dropdown */}
        <Button variant="outline" className="h-10 bg-gray-50 text-sm flex items-center text-gray-700 border-gray-300 px-4">
          <span>Sort</span>
          <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
        </Button>
      </div>
    </div>
  );
};

export default PropertySearchBarSimple;