import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Property {
  id: number;
  title: string;
  price: string | number;
  acreage: string | number;
  location: string;
  propertyType: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

interface PropertyComparisonProps {
  properties: Property[];
  onRemoveProperty: (propertyId: number) => void;
  onClose: () => void;
}

export const PropertyComparison: React.FC<PropertyComparisonProps> = ({
  properties,
  onRemoveProperty,
  onClose
}) => {
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/[^0-9.]/g, '')) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Property Comparison</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${properties.length}, 1fr)` }}>
            {properties.map((property) => (
              <div key={property.id} className="border rounded-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={property.images[0] || '/api/placeholder/300/200'}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100"
                    onClick={() => onRemoveProperty(property.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm leading-tight">{property.title}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-semibold">{formatPrice(property.price)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Acreage:</span>
                      <span className="font-semibold">{property.acreage} acres</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold capitalize">{property.propertyType}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-semibold text-xs">{property.location}</span>
                    </div>
                    
                    {property.bedrooms && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bedrooms:</span>
                        <span className="font-semibold">{property.bedrooms}</span>
                      </div>
                    )}
                    
                    {property.bathrooms && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bathrooms:</span>
                        <span className="font-semibold">{property.bathrooms}</span>
                      </div>
                    )}
                    
                    {property.sqft && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sq Ft:</span>
                        <span className="font-semibold">{property.sqft.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {properties.length < 4 && (
            <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <Plus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Add more properties to compare (up to 4)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyComparison;