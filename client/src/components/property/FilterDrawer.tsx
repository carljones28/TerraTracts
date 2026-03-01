import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FilterState } from './FiltersSidebar';
import FiltersSidebar from './FiltersSidebar';
import { Filter } from 'lucide-react';

interface FilterDrawerProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  activeFilterCount
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center text-sm gap-1 border-gray-300 hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 font-medium">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 sm:max-w-md bg-white overflow-y-auto h-full">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Filter Properties</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto">
          <FiltersSidebar
            filters={filters}
            onFiltersChange={onFiltersChange}
            onApplyFilters={onApplyFilters}
            onClearFilters={onClearFilters}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;