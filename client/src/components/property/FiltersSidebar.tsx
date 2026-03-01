import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, Filter, Check, X, Info } from 'lucide-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

// Property type options - updated to match database values
const propertyTypes = [
  'farm',
  'ranch', 
  'recreational',
  'residential',
  'timberland',
  'undeveloped',
  'agricultural',
  'commercial',
  'conservation',
  'land',
  'waterfront',
  'mountain',
  'investment',
  'hunting',
  'horse',
  'livestock',
  'orchard',
  'vineyard',
  'dairy',
  'poultry',
  'equestrian',
  'ranching'
];

// Activities options
const activities = [
  'Fishing',
  'Hunting',
  'Hiking',
  'Camping',
  'ATV/Off-road',
  'Horseback Riding',
  'Bird Watching',
  'Photography',
  'Swimming',
  'Boating'
];

// Listing type options
const listingTypes = [
  'For Sale',
  'Auction',
  'Coming Soon',
  'Price Reduced'
];

// Status options
const statusOptions = [
  'Active',
  'Pending',
  'Under Contract',
  'Sold'
];

// Terrain types
const terrainTypes = [
  'flat',
  'rolling',
  'hilly',
  'mountainous',
  'coastal',
  'desert',
  'forested',
  'prairie'
];

export interface FilterState {
  propertyTypes: string[];
  hasResidence: 'yes' | 'no' | 'either';
  bedrooms: number;
  bathrooms: number;
  squareFeet: { min: number | null; max: number | null };
  activities: string[];
  listingType: string[];
  status: string[];
  priceReduction: string;
  dateListed: string;
  keywords: string;
  includesMineralRights: boolean;
  ownerFinancing: boolean;
  propertyVideo: boolean;
  virtualTour: boolean;
  terrainType: string[];
}

interface FiltersSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters
}) => {
  const [expandedTypes, setExpandedTypes] = useState(false);
  
  // Debug: Log expansion state changes
  console.log('FILTER DEBUG - expandedTypes state:', expandedTypes);
  console.log('FILTER DEBUG - propertyTypes.length:', propertyTypes.length);
  console.log('FILTER DEBUG - Should show button:', propertyTypes.length > 6);
  
  // Debug: Log current filter state
  console.log('FILTER STATE DEBUG - Current filters:', filters);
  console.log('FILTER STATE DEBUG - Property types:', filters.propertyTypes);
  console.log('FILTER STATE DEBUG - Activities:', filters.activities);
  console.log('FILTER STATE DEBUG - Terrain types:', filters.terrainType);

  const handlePropertyTypeChange = (type: string, checked: boolean) => {
    console.log('FILTER CLICK - Property type change:', { type, checked, currentTypes: filters.propertyTypes });
    
    const newPropertyTypes = checked 
      ? [...filters.propertyTypes, type]
      : filters.propertyTypes.filter(t => t !== type);
    
    console.log('FILTER CLICK - New property types:', newPropertyTypes);
    
    const updatedFilters = {
      ...filters,
      propertyTypes: newPropertyTypes
    };
    
    console.log('FILTER CLICK - Sending filter update:', updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleResidenceChange = (value: 'yes' | 'no' | 'either') => {
    console.log('FILTER CLICK - Residence change:', { value, currentResidence: filters.hasResidence });
    
    const updatedFilters = {
      ...filters,
      hasResidence: value
    };
    
    console.log('FILTER CLICK - Sending residence filter update:', updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleBedroomsChange = (change: number) => {
    const newValue = Math.max(0, filters.bedrooms + change);
    console.log('FILTER CLICK - Bedrooms change:', { change, oldValue: filters.bedrooms, newValue });
    
    const updatedFilters = {
      ...filters,
      bedrooms: newValue
    };
    
    console.log('FILTER CLICK - Sending bedrooms filter update:', updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleBathroomsChange = (change: number) => {
    const newValue = Math.max(0, filters.bathrooms + change);
    console.log('FILTER CLICK - Bathrooms change:', { change, oldValue: filters.bathrooms, newValue });
    
    const updatedFilters = {
      ...filters,
      bathrooms: newValue
    };
    
    console.log('FILTER CLICK - Sending bathrooms filter update:', updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleSquareFeetChange = (field: 'min' | 'max', value: string) => {
    const parsedValue = value ? parseInt(value, 10) : null;
    onFiltersChange({
      ...filters,
      squareFeet: {
        ...filters.squareFeet,
        [field]: parsedValue
      }
    });
  };

  const handleActivityChange = (activity: string, checked: boolean) => {
    console.log('FILTER CLICK - Activity change:', { activity, checked, currentActivities: filters.activities });
    
    const newActivities = checked 
      ? [...filters.activities, activity]
      : filters.activities.filter(a => a !== activity);
    
    console.log('FILTER CLICK - New activities:', newActivities);
    
    const updatedFilters = {
      ...filters,
      activities: newActivities
    };
    
    console.log('FILTER CLICK - Sending activity filter update:', updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatus = filters.status || [];
    if (checked) {
      onFiltersChange({
        ...filters,
        status: [...currentStatus, status]
      });
    } else {
      onFiltersChange({
        ...filters,
        status: currentStatus.filter(s => s !== status)
      });
    }
  };

  const handleListingTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({
        ...filters,
        listingType: [...filters.listingType, type]
      });
    } else {
      onFiltersChange({
        ...filters,
        listingType: filters.listingType.filter(t => t !== type)
      });
    }
  };

  const handleTerrainTypeChange = (terrain: string, checked: boolean) => {
    console.log('FILTER CLICK - Terrain type change:', { terrain, checked, currentTerrain: filters.terrainType });
    
    const newTerrainType = checked 
      ? [...(filters.terrainType || []), terrain]
      : (filters.terrainType || []).filter(t => t !== terrain);
    
    console.log('FILTER CLICK - New terrain types:', newTerrainType);
    
    const updatedFilters = {
      ...filters,
      terrainType: newTerrainType
    };
    
    console.log('FILTER CLICK - Sending terrain filter update:', updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Calculate active filter count for display
  const activeFilterCount = 
    filters.propertyTypes.length +
    filters.activities.length +
    filters.status.length +
    filters.listingType.length +
    (filters.terrainType?.length || 0) +
    (filters.bedrooms > 0 ? 1 : 0) +
    (filters.bathrooms > 0 ? 1 : 0) +
    (filters.hasResidence !== 'either' ? 1 : 0) +
    (filters.propertyVideo ? 1 : 0) +
    (filters.includesMineralRights ? 1 : 0) +
    (filters.ownerFinancing ? 1 : 0);

  // Get property type emoji
  const getPropertyTypeEmoji = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      'farm': '🌾',
      'ranch': '🤠', 
      'recreational': '🏕️',
      'residential': '🏠',
      'timberland': '🌲',
      'undeveloped': '🏞️',
      'agricultural': '🚜',
      'commercial': '🏢',
      'conservation': '🌿',
      'land': '🟫',
      'waterfront': '🌊',
      'mountain': '⛰️',
      'investment': '💰',
      'hunting': '🦌',
      'horse': '🐎',
      'livestock': '🐄',
      'orchard': '🍎',
      'vineyard': '🍇',
      'dairy': '🥛',
      'poultry': '🐓',
      'equestrian': '🏇',
      'ranching': '🐂'
    };
    return emojiMap[type] || '🏡';
  };

  // Force console log to verify component is rendering
  console.log('🚨 FiltersSidebar component is rendering NOW!');
  console.log('🚨 expandedTypes value:', expandedTypes);
  console.log('🚨 propertyTypes array:', propertyTypes);

  return (
    <div className="bg-white overflow-hidden rounded-lg border-2 border-red-500">
      {/* Header with active filter count */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-base font-semibold text-gray-900">Filters</h3>
            <p className="text-xs text-gray-500">
              {activeFilterCount === 0 ? 'No filters applied' : 
               `${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} applied`}
            </p>
          </div>
        </div>
        
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="h-8 text-xs font-medium hover:bg-red-50 hover:text-red-600 px-2"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear all
          </Button>
        )}
      </div>
      
      {/* Property Types Section - Redesigned with visual selection cards */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            Property Types
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 ml-1.5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Select one or more property types to narrow your search results
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h4>
          
          {filters.propertyTypes.length > 0 && (
            <Badge 
              variant="outline" 
              className="rounded-full bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 px-2 py-0 text-xs"
            >
              {filters.propertyTypes.length}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {propertyTypes.slice(0, expandedTypes ? propertyTypes.length : 6).map((type) => {
            const isActive = filters.propertyTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => handlePropertyTypeChange(type, !isActive)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-md text-center transition-all",
                  "border text-xs hover:shadow-sm min-h-[60px]",
                  isActive 
                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className="text-lg mb-1">{getPropertyTypeEmoji(type)}</span>
                <span className="font-medium leading-tight capitalize">{type}</span>
              </button>
            );
          })}
        </div>
        
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔥 SHOW MORE CLICKED! Current state:', expandedTypes);
            console.log('🔥 Total property types:', propertyTypes.length);
            console.log('🔥 Button should be visible because:', propertyTypes.length > 6);
            setExpandedTypes(!expandedTypes);
            console.log('🔥 New expanded state will be:', !expandedTypes);
          }}
          className="mt-3 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm flex items-center font-medium rounded-lg px-3 py-2 border border-blue-200 transition-all cursor-pointer w-full justify-center"
        >
          {expandedTypes ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less Property Types
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show All {propertyTypes.length} Property Types
            </>
          )}
        </button>
      </div>

      {/* Activities Section */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Activities</h4>
        <div className="grid grid-cols-2 gap-2">
          {activities.map((activity) => {
            const isActive = filters.activities.includes(activity);
            return (
              <button
                key={activity}
                onClick={() => handleActivityChange(activity, !isActive)}
                className={cn(
                  "text-left px-3 py-2 rounded-md text-xs border transition-all",
                  isActive
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                {activity}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Section */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((status) => {
            const isActive = filters.status && filters.status.includes(status);
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status, !isActive)}
                className={cn(
                  "text-left px-3 py-2 rounded-md text-xs border transition-all",
                  isActive
                    ? "bg-purple-50 border-purple-200 text-purple-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Terrain Type Section */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Terrain Type</h4>
        <div className="grid grid-cols-2 gap-2">
          {terrainTypes.map((terrain) => {
            const isActive = (filters.terrainType || []).includes(terrain);
            return (
              <button
                key={terrain}
                onClick={() => handleTerrainTypeChange(terrain, !isActive)}
                className={cn(
                  "text-left px-3 py-2 rounded-md text-xs border transition-all capitalize",
                  isActive
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                {terrain}
              </button>
            );
          })}
        </div>
      </div>

      {/* Residence Section */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Includes Residence</h4>
        <div className="flex space-x-2">
          {(['yes', 'no', 'either'] as const).map((option) => (
            <button
              key={option}
              onClick={() => handleResidenceChange(option)}
              className={cn(
                "px-3 py-2 rounded-md text-xs border transition-all capitalize flex-1",
                filters.hasResidence === option
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Bedrooms</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBedroomsChange(-1)}
                className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                disabled={filters.bedrooms === 0}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium min-w-[20px] text-center">
                {filters.bedrooms}
              </span>
              <button
                onClick={() => handleBedroomsChange(1)}
                className="p-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Bathrooms</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBathroomsChange(-1)}
                className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                disabled={filters.bathrooms === 0}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium min-w-[20px] text-center">
                {filters.bathrooms}
              </span>
              <button
                onClick={() => handleBathroomsChange(1)}
                className="p-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Features</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.propertyVideo}
              onChange={(e) => onFiltersChange({ ...filters, propertyVideo: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Has Video Tour</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includesMineralRights}
              onChange={(e) => onFiltersChange({ ...filters, includesMineralRights: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Includes Mineral Rights</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.ownerFinancing}
              onChange={(e) => onFiltersChange({ ...filters, ownerFinancing: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Owner Financing Available</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default FiltersSidebar;