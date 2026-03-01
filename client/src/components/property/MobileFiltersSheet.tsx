import { useState, useMemo, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  SlidersHorizontal, 
  X, 
  Check,
  Home,
  Building2,
  Wheat,
  Trees,
  Mountain,
  Waves,
  TreePine,
  Target,
  Beef,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  DollarSign,
  Ruler,
  Sparkles,
  Tag,
  Clock,
  Compass,
  Bed,
  Bath,
  Search,
  MapPin,
  Tractor,
  Tent
} from 'lucide-react';
import { PropertyFilters } from './ExactSearchBar';

interface MobileFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  totalResults: number;
}

const propertyTypes = [
  { id: 'farm', label: 'Farm', icon: Tractor },
  { id: 'ranch', label: 'Ranch', icon: Beef },
  { id: 'recreational', label: 'Recreational', icon: Tent },
  { id: 'residential', label: 'Residential', icon: Home },
  { id: 'timberland', label: 'Timberland', icon: Trees },
  { id: 'undeveloped', label: 'Undeveloped', icon: MapPin },
  { id: 'agricultural', label: 'Agricultural', icon: Wheat },
  { id: 'commercial', label: 'Commercial', icon: Building2 },
  { id: 'conservation', label: 'Conservation', icon: Target },
  { id: 'land', label: 'Land', icon: MapPin },
  { id: 'waterfront', label: 'Waterfront', icon: Waves },
  { id: 'mountain', label: 'Mountain', icon: Mountain },
];

const statusOptions = [
  { id: 'Active', label: 'Active' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Under Contract', label: 'Under Contract' },
  { id: 'Sold', label: 'Sold' },
];

const listingTypes = [
  { id: 'For Sale', label: 'For Sale' },
  { id: 'Auction', label: 'Auction' },
  { id: 'Coming Soon', label: 'Coming Soon' },
  { id: 'Price Reduced', label: 'Price Reduced' },
];

const terrainTypes = [
  { id: 'flat', label: 'Flat' },
  { id: 'rolling', label: 'Rolling' },
  { id: 'hilly', label: 'Hilly' },
  { id: 'mountainous', label: 'Mountainous' },
  { id: 'coastal', label: 'Coastal' },
  { id: 'desert', label: 'Desert' },
  { id: 'forested', label: 'Forested' },
  { id: 'prairie', label: 'Prairie' },
];

const activities = [
  { id: 'Fishing', label: 'Fishing' },
  { id: 'Hunting', label: 'Hunting' },
  { id: 'Hiking', label: 'Hiking' },
  { id: 'Camping', label: 'Camping' },
  { id: 'ATV/Off-road', label: 'ATV/Off-road' },
  { id: 'Horseback Riding', label: 'Horseback Riding' },
  { id: 'Bird Watching', label: 'Bird Watching' },
  { id: 'Swimming', label: 'Swimming' },
  { id: 'Boating', label: 'Boating' },
];

const priceRanges = [
  { label: 'Any Price', min: null, max: null },
  { label: 'Under $50K', min: null, max: 50000 },
  { label: '$50K - $100K', min: 50000, max: 100000 },
  { label: '$100K - $250K', min: 100000, max: 250000 },
  { label: '$250K - $500K', min: 250000, max: 500000 },
  { label: '$500K - $1M', min: 500000, max: 1000000 },
  { label: '$1M - $5M', min: 1000000, max: 5000000 },
  { label: '$5M+', min: 5000000, max: null },
];

const acreageRanges = [
  { label: 'Any Size', min: null, max: null },
  { label: 'Under 5 acres', min: null, max: 5 },
  { label: '5 - 20 acres', min: 5, max: 20 },
  { label: '20 - 50 acres', min: 20, max: 50 },
  { label: '50 - 100 acres', min: 50, max: 100 },
  { label: '100 - 500 acres', min: 100, max: 500 },
  { label: '500+ acres', min: 500, max: null },
];

export function MobileFiltersSheet({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange,
  totalResults 
}: MobileFiltersSheetProps) {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);
  const [expandedSections, setExpandedSections] = useState<string[]>(['status', 'propertyType', 'price', 'acreage']);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.propertyTypes?.length > 0) count += localFilters.propertyTypes.length;
    if (localFilters.priceRange?.min !== null || localFilters.priceRange?.max !== null) count++;
    if (localFilters.acreageRange?.min !== null || localFilters.acreageRange?.max !== null) count++;
    if (localFilters.status?.length > 0) count += localFilters.status.length;
    if (localFilters.listingType?.length > 0) count += localFilters.listingType.length;
    if (localFilters.terrainType?.length > 0) count += localFilters.terrainType.length;
    if (localFilters.activities?.length > 0) count += localFilters.activities.length;
    if (localFilters.includesMineralRights) count++;
    if (localFilters.ownerFinancing) count++;
    if (localFilters.hasResidence !== 'either') count++;
    if (localFilters.virtualTour) count++;
    if (localFilters.propertyVideo) count++;
    if (localFilters.bedrooms > 0) count++;
    if (localFilters.bathrooms > 0) count++;
    if (localFilters.keywords) count++;
    return count;
  }, [localFilters]);

  const handlePropertyTypeToggle = (typeId: string) => {
    const currentTypes = localFilters.propertyTypes || [];
    const newTypes = currentTypes.includes(typeId)
      ? currentTypes.filter(t => t !== typeId)
      : [...currentTypes, typeId];
    setLocalFilters({ ...localFilters, propertyTypes: newTypes });
  };

  const handleStatusToggle = (statusId: string) => {
    const currentStatus = localFilters.status || [];
    const newStatus = currentStatus.includes(statusId)
      ? currentStatus.filter(s => s !== statusId)
      : [...currentStatus, statusId];
    setLocalFilters({ ...localFilters, status: newStatus });
  };

  const handleListingTypeToggle = (typeId: string) => {
    const currentTypes = localFilters.listingType || [];
    const newTypes = currentTypes.includes(typeId)
      ? currentTypes.filter(t => t !== typeId)
      : [...currentTypes, typeId];
    setLocalFilters({ ...localFilters, listingType: newTypes });
  };

  const handleTerrainToggle = (terrainId: string) => {
    const currentTerrain = localFilters.terrainType || [];
    const newTerrain = currentTerrain.includes(terrainId)
      ? currentTerrain.filter(t => t !== terrainId)
      : [...currentTerrain, terrainId];
    setLocalFilters({ ...localFilters, terrainType: newTerrain });
  };

  const handleActivityToggle = (activityId: string) => {
    const currentActivities = localFilters.activities || [];
    const newActivities = currentActivities.includes(activityId)
      ? currentActivities.filter(a => a !== activityId)
      : [...currentActivities, activityId];
    setLocalFilters({ ...localFilters, activities: newActivities });
  };

  const handlePriceSelect = (range: typeof priceRanges[0]) => {
    setLocalFilters({ 
      ...localFilters, 
      priceRange: { min: range.min, max: range.max } 
    });
  };

  const handleAcreageSelect = (range: typeof acreageRanges[0]) => {
    setLocalFilters({ 
      ...localFilters, 
      acreageRange: { min: range.min, max: range.max } 
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: PropertyFilters = {
      propertyTypes: [],
      hasResidence: 'either',
      bedrooms: 0,
      bathrooms: 0,
      squareFeet: { min: null, max: null },
      activities: [],
      listingType: [],
      status: [],
      priceReduction: '',
      dateListed: '',
      keywords: '',
      includesMineralRights: false,
      ownerFinancing: false,
      propertyVideo: false,
      virtualTour: false,
      terrainType: [],
      searchQuery: '',
      priceRange: { min: null, max: null },
      acreageRange: { min: null, max: null },
      propertyType: null,
      features: [],
      hasVideo: false,
    };
    setLocalFilters(resetFilters);
  };

  const isPriceSelected = (range: typeof priceRanges[0]) => {
    return localFilters.priceRange?.min === range.min && localFilters.priceRange?.max === range.max;
  };

  const isAcreageSelected = (range: typeof acreageRanges[0]) => {
    return localFilters.acreageRange?.min === range.min && localFilters.acreageRange?.max === range.max;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-3xl p-0 flex flex-col"
      >
        <SheetHeader className="sticky top-0 bg-white z-10 px-4 pt-3 pb-3 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-gray-900">Filters</SheetTitle>
                {activeFilterCount > 0 && (
                  <p className="text-xs text-purple-600 font-medium">{activeFilterCount} filters active</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  data-testid="reset-filters-button"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                data-testid="close-filters-button"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('status')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-status"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-gray-900">Property Status</span>
                {(localFilters.status?.length || 0) > 0 && (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    {localFilters.status?.length}
                  </Badge>
                )}
              </div>
              {expandedSections.includes('status') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('status') && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {statusOptions.map(status => {
                  const isSelected = localFilters.status?.includes(status.id);
                  return (
                    <button
                      key={status.id}
                      onClick={() => handleStatusToggle(status.id)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      {status.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('propertyType')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-property-type"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-semibold text-gray-900">All Types</span>
                {(localFilters.propertyTypes?.length || 0) > 0 && (
                  <Badge className="bg-purple-600 text-white text-xs">
                    {localFilters.propertyTypes?.length}
                  </Badge>
                )}
              </div>
              {expandedSections.includes('propertyType') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('propertyType') && (
              <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                {propertyTypes.map(type => {
                  const Icon = type.icon;
                  const isSelected = localFilters.propertyTypes?.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      onClick={() => handlePropertyTypeToggle(type.id)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all relative ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 shadow-sm' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                        isSelected ? 'bg-purple-500' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight ${
                        isSelected ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        {type.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-price"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-semibold text-gray-900">Price</span>
                {(localFilters.priceRange?.min !== null || localFilters.priceRange?.max !== null) && (
                  <Badge className="bg-green-600 text-white text-xs">1</Badge>
                )}
              </div>
              {expandedSections.includes('price') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('price') && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {priceRanges.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePriceSelect(range)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      isPriceSelected(range)
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-green-300'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('acreage')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-acreage"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">Acres</span>
                {(localFilters.acreageRange?.min !== null || localFilters.acreageRange?.max !== null) && (
                  <Badge className="bg-blue-600 text-white text-xs">1</Badge>
                )}
              </div>
              {expandedSections.includes('acreage') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('acreage') && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {acreageRanges.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAcreageSelect(range)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      isAcreageSelected(range)
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('listingType')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-listing-type"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-semibold text-gray-900">Listing Type</span>
                {(localFilters.listingType?.length || 0) > 0 && (
                  <Badge className="bg-orange-600 text-white text-xs">
                    {localFilters.listingType?.length}
                  </Badge>
                )}
              </div>
              {expandedSections.includes('listingType') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('listingType') && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {listingTypes.map(type => {
                  const isSelected = localFilters.listingType?.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleListingTypeToggle(type.id)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      {type.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('terrain')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-terrain"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-teal-600" />
                </div>
                <span className="font-semibold text-gray-900">Terrain</span>
                {(localFilters.terrainType?.length || 0) > 0 && (
                  <Badge className="bg-teal-600 text-white text-xs">
                    {localFilters.terrainType?.length}
                  </Badge>
                )}
              </div>
              {expandedSections.includes('terrain') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('terrain') && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {terrainTypes.map(terrain => {
                  const isSelected = localFilters.terrainType?.includes(terrain.id);
                  return (
                    <button
                      key={terrain.id}
                      onClick={() => handleTerrainToggle(terrain.id)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-teal-500 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      {terrain.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('activities')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-activities"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-rose-600" />
                </div>
                <span className="font-semibold text-gray-900">Activities</span>
                {(localFilters.activities?.length || 0) > 0 && (
                  <Badge className="bg-rose-600 text-white text-xs">
                    {localFilters.activities?.length}
                  </Badge>
                )}
              </div>
              {expandedSections.includes('activities') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('activities') && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {activities.map(activity => {
                  const isSelected = localFilters.activities?.includes(activity.id);
                  return (
                    <button
                      key={activity.id}
                      onClick={() => handleActivityToggle(activity.id)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-rose-300'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      {activity.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('residence')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-residence"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Home className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-semibold text-gray-900">Residence</span>
                {(localFilters.bedrooms > 0 || localFilters.bathrooms > 0 || localFilters.hasResidence !== 'either') && (
                  <Badge className="bg-indigo-600 text-white text-xs">
                    {(localFilters.bedrooms > 0 ? 1 : 0) + (localFilters.bathrooms > 0 ? 1 : 0) + (localFilters.hasResidence !== 'either' ? 1 : 0)}
                  </Badge>
                )}
              </div>
              {expandedSections.includes('residence') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('residence') && (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <span className="font-medium text-gray-700">Has Residence</span>
                  <div className="flex gap-2">
                    {['either', 'yes', 'no'].map(val => (
                      <button
                        key={val}
                        onClick={() => setLocalFilters({ ...localFilters, hasResidence: val as 'yes' | 'no' | 'either' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          localFilters.hasResidence === val
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {val === 'either' ? 'Any' : val === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-700">Bedrooms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLocalFilters({ ...localFilters, bedrooms: Math.max(0, localFilters.bedrooms - 1) })}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold">{localFilters.bedrooms}+</span>
                    <button
                      onClick={() => setLocalFilters({ ...localFilters, bedrooms: localFilters.bedrooms + 1 })}
                      className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-700">Bathrooms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLocalFilters({ ...localFilters, bathrooms: Math.max(0, localFilters.bathrooms - 1) })}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold">{localFilters.bathrooms}+</span>
                    <button
                      onClick={() => setLocalFilters({ ...localFilters, bathrooms: localFilters.bathrooms + 1 })}
                      className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('features')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-features"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-semibold text-gray-900">Special Features</span>
              </div>
              {expandedSections.includes('features') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('features') && (
              <div className="px-4 pb-4 space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <span className="font-medium text-gray-700">Mineral Rights</span>
                  <Switch
                    checked={localFilters.includesMineralRights}
                    onCheckedChange={(checked) => 
                      setLocalFilters({ ...localFilters, includesMineralRights: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <span className="font-medium text-gray-700">Owner Financing</span>
                  <Switch
                    checked={localFilters.ownerFinancing}
                    onCheckedChange={(checked) => 
                      setLocalFilters({ ...localFilters, ownerFinancing: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <span className="font-medium text-gray-700">Property Video</span>
                  <Switch
                    checked={localFilters.propertyVideo}
                    onCheckedChange={(checked) => 
                      setLocalFilters({ ...localFilters, propertyVideo: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <span className="font-medium text-gray-700">Virtual Tour</span>
                  <Switch
                    checked={localFilters.virtualTour}
                    onCheckedChange={(checked) => 
                      setLocalFilters({ ...localFilters, virtualTour: checked })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('keywords')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              data-testid="section-keywords"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center">
                  <Search className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-semibold text-gray-900">Keywords</span>
                {localFilters.keywords && (
                  <Badge className="bg-gray-600 text-white text-xs">1</Badge>
                )}
              </div>
              {expandedSections.includes('keywords') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes('keywords') && (
              <div className="px-4 pb-4">
                <Input
                  placeholder="Search keywords..."
                  value={localFilters.keywords || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, keywords: e.target.value })}
                  className="h-12 rounded-xl border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="sticky bottom-0 bg-white border-t border-gray-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button
            onClick={handleApply}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
            data-testid="apply-filters-button"
          >
            <Check className="w-5 h-5 mr-2" />
            Save & Show {totalResults} Properties
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface FloatingFilterButtonProps {
  activeCount: number;
  onClick: () => void;
}

export function FloatingFilterButton({ activeCount, onClick }: FloatingFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-24 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-white rounded-full shadow-lg border border-gray-200 touch-manipulation active:scale-95 transition-all hover:shadow-xl"
      data-testid="mobile-filters-button"
    >
      <SlidersHorizontal className="w-5 h-5 text-gray-700" />
      <span className="font-semibold text-gray-900">Filters</span>
      {activeCount > 0 && (
        <span className="flex items-center justify-center w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full">
          {activeCount}
        </span>
      )}
    </button>
  );
}
