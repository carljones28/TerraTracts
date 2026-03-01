import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { PropertyCardOptimized } from './PropertyCardOptimized';

interface Property {
  id: number;
  title: string;
  price: number;
  acreage: number;
  location: string;
  images: string[];
  views: number;
  isWaterfront?: boolean;
  isMountainView?: boolean;
}

interface VirtualizedPropertyListProps {
  properties: Property[];
  onPropertyView?: (id: number) => void;
  onPropertyFavorite?: (id: number) => void;
  height?: number;
  itemHeight?: number;
}

// Memoized row component for virtual list
const PropertyRow = memo(function PropertyRow({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: { 
    properties: Property[]; 
    onView?: (id: number) => void; 
    onFavorite?: (id: number) => void; 
  } 
}) {
  const property = data.properties[index];
  
  if (!property) return null;

  return (
    <div style={style} className="px-2 py-2">
      <PropertyCardOptimized
        property={property}
        onView={data.onView}
        onFavorite={data.onFavorite}
      />
    </div>
  );
});

// Virtualized property list for better performance with large datasets
export const VirtualizedPropertyList = memo(function VirtualizedPropertyList({
  properties,
  onPropertyView,
  onPropertyFavorite,
  height = 600,
  itemHeight = 300
}: VirtualizedPropertyListProps) {
  
  const itemData = useMemo(() => ({
    properties,
    onView: onPropertyView,
    onFavorite: onPropertyFavorite
  }), [properties, onPropertyView, onPropertyFavorite]);

  if (!properties.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No properties found</div>
          <div className="text-sm">Try adjusting your filters</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <List
        height={height}
        itemCount={properties.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={3} // Pre-render 3 items above and below viewport
      >
        {PropertyRow}
      </List>
    </div>
  );
});

VirtualizedPropertyList.displayName = 'VirtualizedPropertyList';