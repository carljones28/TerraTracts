import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export interface Favorite {
  id: number;
  userId: number;
  propertyId: number;
  notes: string | null;
  createdAt: Date;
}

export function useFavorites() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Query to fetch all favorites for the current user
  const {
    data: favorites,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: () => 
      apiRequest('GET', '/api/favorites')
        .then(res => res.json())
        .catch(error => {
          console.error('Error fetching favorites:', error);
          // Return empty array instead of throwing to prevent errors in UI
          return [];
        }),
    enabled: !!user && isAuthenticated, // Only fetch if user is authenticated
    // Use stale time of 0 to ensure we fetch fresh data when user logs in/out
    staleTime: 0,
  });

  // Check if a specific property is favorited
  const isFavorited = (propertyId: number): { isFavorited: boolean; favoriteId?: number } => {
    if (!favorites || !Array.isArray(favorites)) {
      return { isFavorited: false };
    }
    
    const favorite = favorites.find(fav => fav.propertyId === propertyId);
    return { 
      isFavorited: !!favorite,
      favoriteId: favorite?.id
    };
  };

  // Mutation to add a favorite
  const addFavoriteMutation = useMutation({
    mutationFn: (propertyId: number) =>
      apiRequest('POST', '/api/favorites', { propertyId })
        .then(res => res.json()),
    onSuccess: () => {
      // Invalidate the favorites query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: 'Added to favorites',
        description: 'Property has been added to your favorites',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add to favorites',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to remove a favorite
  const removeFavoriteMutation = useMutation({
    mutationFn: (favoriteId: number) =>
      apiRequest('DELETE', `/api/favorites/${favoriteId}`),
    onSuccess: () => {
      // Invalidate the favorites query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: 'Removed from favorites',
        description: 'Property has been removed from your favorites',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove from favorites',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle favorite status
  const toggleFavorite = (propertyId: number) => {
    // Check if user is authenticated before proceeding
    if (!user || !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to save properties to favorites",
        variant: "destructive",
      });
      return;
    }
    
    const { isFavorited: isCurrentlyFavorited, favoriteId } = isFavorited(propertyId);

    if (isCurrentlyFavorited && favoriteId) {
      removeFavoriteMutation.mutate(favoriteId);
    } else {
      addFavoriteMutation.mutate(propertyId);
    }
  };

  return {
    favorites,
    isLoading,
    error,
    refetch,
    isFavorited,
    toggleFavorite,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    isAdding: addFavoriteMutation.isPending,
    isRemoving: removeFavoriteMutation.isPending,
  };
}