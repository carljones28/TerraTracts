import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface PropertySearchBarProps {
  onSearch?: (query: string) => void;
  showMapToggle?: boolean;
  defaultLocation?: string;
  propertyCount?: number;
}

const PropertySearchBar = ({ 
  onSearch, 
  showMapToggle = true, 
  defaultLocation = '',
  propertyCount = 143,
}: PropertySearchBarProps) => {
  const [location, setLocation] = useState(defaultLocation);
  const [showMap, setShowMap] = useState(true);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(location);
    }
  };

  const handleSaveSearch = () => {
    console.log('Saving search');
  };

  return (
    <div className="flex items-center justify-between w-full bg-white py-2 px-4 border-b border-gray-200 gap-2">
      {/* Search input */}
      <div className="flex items-center gap-2 flex-grow">
        <div className="relative w-56">
          <input
            type="text"
            placeholder="Address, City, ZIP, Neighborhood"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-8 pl-3 pr-9 text-sm rounded border border-gray-300 focus:outline-none"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2" onClick={handleSearch}>
            <Search className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* For Sale Dropdown */}
        <Select defaultValue="For Sale">
          <SelectTrigger className="h-8 min-w-28 text-sm rounded border-gray-300">
            <SelectValue placeholder="For Sale" />
            <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="For Sale">For Sale</SelectItem>
            <SelectItem value="For Rent">For Rent</SelectItem>
            <SelectItem value="Sold">Sold</SelectItem>
          </SelectContent>
        </Select>

        {/* All Types Dropdown */}
        <Select defaultValue="All Types">
          <SelectTrigger className="h-8 min-w-28 text-sm rounded border-gray-300">
            <SelectValue placeholder="All Types" />
            <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Types">All Types</SelectItem>
            <SelectItem value="Farm">Farm</SelectItem>
            <SelectItem value="Ranch">Ranch</SelectItem>
            <SelectItem value="Recreational">Recreational</SelectItem>
            <SelectItem value="Residential">Residential</SelectItem>
          </SelectContent>
        </Select>

        {/* Any Price Dropdown */}
        <Select defaultValue="Any Price">
          <SelectTrigger className="h-8 min-w-28 text-sm rounded border-gray-300">
            <SelectValue placeholder="Any Price" />
            <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Any Price">Any Price</SelectItem>
            <SelectItem value="Under $50k">Under $50k</SelectItem>
            <SelectItem value="$50k-$100k">$50k-$100k</SelectItem>
            <SelectItem value="$100k-$250k">$100k-$250k</SelectItem>
            <SelectItem value="$250k-$500k">$250k-$500k</SelectItem>
            <SelectItem value="$500k-$1M">$500k-$1M</SelectItem>
          </SelectContent>
        </Select>

        {/* Any Acres Dropdown */}
        <Select defaultValue="Any Acres">
          <SelectTrigger className="h-8 min-w-28 text-sm rounded border-gray-300">
            <SelectValue placeholder="Any Acres" />
            <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Any Acres">Any Acres</SelectItem>
            <SelectItem value="Under 1">Under 1</SelectItem>
            <SelectItem value="1-5">1-5</SelectItem>
            <SelectItem value="5-10">5-10</SelectItem>
            <SelectItem value="10-20">10-20</SelectItem>
            <SelectItem value="20-50">20-50</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort dropdown */}
        <div className="flex items-center border border-gray-300 rounded h-8 px-2">
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6" />
          </svg>
        </div>

        {/* Filters Button */}
        <Button 
          variant="outline" 
          className="h-8 text-sm rounded border-gray-300 flex items-center"
        >
          <span>Filters</span>
          <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Property count */}
        <div className="text-xs text-gray-700">
          Land for Sale in Texas: 1 - 14 of {propertyCount} listings
        </div>

        {/* Save Search Button */}
        <Button
          onClick={handleSaveSearch}
          className="text-xs h-8 rounded px-3 bg-gray-200 text-gray-800 font-medium"
        >
          Save Search
        </Button>

        {/* Show Map Toggle */}
        {showMapToggle && (
          <div className="flex items-center">
            <span className="text-xs font-medium mr-2">Show Map</span>
            <Switch 
              checked={showMap} 
              onCheckedChange={setShowMap} 
              className="data-[state=checked]:bg-blue-500" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySearchBar;