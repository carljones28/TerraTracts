import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Trash2, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyFilters } from './ExactSearchBar';

interface SavedSearch {
  id: string;
  name: string;
  filters: PropertyFilters;
  alertsEnabled: boolean;
  createdAt: string;
  lastRun?: string;
  resultCount?: number;
}

interface SavedSearchesProps {
  onApplySearch: (filters: PropertyFilters) => void;
  currentFilters: PropertyFilters;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  onApplySearch,
  currentFilters
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = () => {
    try {
      const saved = localStorage.getItem('savedSearches');
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearch = (name: string) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: currentFilters,
      alertsEnabled: false,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const deleteSearch = (id: string) => {
    const updated = savedSearches.filter(search => search.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const toggleAlerts = (id: string) => {
    const updated = savedSearches.map(search =>
      search.id === id ? { ...search, alertsEnabled: !search.alertsEnabled } : search
    );
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const getSearchDescription = (filters: PropertyFilters) => {
    const parts = [];
    
    if (filters.propertyTypes?.length) {
      parts.push(`${filters.propertyTypes.join(', ')} properties`);
    }
    
    if (filters.priceRange?.min || filters.priceRange?.max) {
      const min = filters.priceRange.min ? `$${filters.priceRange.min.toLocaleString()}` : '';
      const max = filters.priceRange.max ? `$${filters.priceRange.max.toLocaleString()}` : '';
      if (min && max) {
        parts.push(`$${min} - ${max}`);
      } else if (min) {
        parts.push(`above ${min}`);
      } else if (max) {
        parts.push(`under ${max}`);
      }
    }
    
    if (filters.acreageRange?.min || filters.acreageRange?.max) {
      const min = filters.acreageRange.min || '';
      const max = filters.acreageRange.max || '';
      if (min && max) {
        parts.push(`${min}-${max} acres`);
      } else if (min) {
        parts.push(`${min}+ acres`);
      } else if (max) {
        parts.push(`up to ${max} acres`);
      }
    }
    
    if (filters.features?.length) {
      parts.push(filters.features.join(', '));
    }
    
    return parts.length ? parts.join(' • ') : 'All properties';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Saved Searches</h3>
        <Button
          size="sm"
          onClick={() => {
            const name = prompt('Enter a name for this search:');
            if (name) saveSearch(name);
          }}
        >
          Save Current Search
        </Button>
      </div>

      {savedSearches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No saved searches yet</p>
          <p className="text-sm">Save your current search to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{search.name}</h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleAlerts(search.id)}
                    title={search.alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
                  >
                    {search.alertsEnabled ? (
                      <Bell className="h-4 w-4 text-blue-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteSearch(search.id)}
                    title="Delete search"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {getSearchDescription(search.filters)}
              </p>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Created {new Date(search.createdAt).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApplySearch(search.filters)}
                >
                  Apply Search
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSearches;