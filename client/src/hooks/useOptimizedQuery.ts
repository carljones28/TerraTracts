import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

// Optimized query hook with better caching and performance
export function useOptimizedQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
    select?: (data: T) => any;
  }
): UseQueryResult<T> {
  
  const memoizedQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);
  
  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutes default
    enabled: options?.enabled ?? true,
    select: options?.select,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    retry: 1, // Reduce retry attempts for faster failure handling
  });
}

// Optimized properties query with pagination
export function useOptimizedProperties(filters?: {
  type?: string;
  state?: string;
  page?: number;
  limit?: number;
}) {
  const queryKey = ['properties', 'optimized', filters];
  
  return useOptimizedQuery(
    queryKey,
    async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.state) params.append('state', filters.state);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/properties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    {
      staleTime: 3 * 60 * 1000, // 3 minutes for properties
      enabled: true,
    }
  );
}

// Fast property counts query
export function usePropertyCounts() {
  return useOptimizedQuery(
    ['properties', 'counts'],
    async () => {
      const response = await fetch('/api/properties/counts');
      if (!response.ok) throw new Error('Failed to fetch property counts');
      return response.json();
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes for counts
    }
  );
}

// Fast featured properties query
export function useFeaturedProperties() {
  return useOptimizedQuery(
    ['properties', 'featured'],
    async () => {
      const response = await fetch('/api/properties/featured');
      if (!response.ok) throw new Error('Failed to fetch featured properties');
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes for featured
    }
  );
}