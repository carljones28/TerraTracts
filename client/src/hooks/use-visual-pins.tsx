import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export interface VisualPin {
  id: number;
  favoriteId: number;
  imageIndex: number;
  xPosition: number;
  yPosition: number;
  pinColor: string | null;
  label: string | null;
  note: string | null;
  createdAt: Date;
}

export interface CreateVisualPinInput {
  favoriteId: number;
  imageIndex: number;
  xPosition: number;
  yPosition: number;
  pinColor?: string | null;
  label?: string | null;
  note?: string | null;
}

export interface UpdateVisualPinInput {
  xPosition?: number;
  yPosition?: number;
  pinColor?: string | null;
  label?: string | null;
  note?: string | null;
}

export function useVisualPins(favoriteId?: number) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Query to fetch pins for a specific favorite
  const {
    data: pins,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/visualpins', favoriteId || 0],
    queryFn: favoriteId ? () => 
      apiRequest('GET', `/api/visualpins/${favoriteId}`)
        .then(res => res.json())
        .catch(error => {
          console.error(`Error fetching visual pins for favorite ${favoriteId}:`, error);
          return [];
        }) : undefined,
    enabled: !!favoriteId && isAuthenticated, // Only fetch if favoriteId is provided and user is authenticated
    staleTime: 0, // Ensure fresh data on each query
  });

  // Mutation to create a new pin
  const createPinMutation = useMutation({
    mutationFn: (pinData: CreateVisualPinInput) =>
      apiRequest('POST', '/api/visualpins', pinData)
        .then(res => res.json()),
    onSuccess: () => {
      // Invalidate the pins query to trigger a refetch
      if (favoriteId) {
        queryClient.invalidateQueries({
          queryKey: ['/api/visualpins', favoriteId],
        });
      }
      toast({
        title: 'Pin created',
        description: 'Visual pin has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create pin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to update a pin
  const updatePinMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateVisualPinInput) =>
      apiRequest('PATCH', `/api/visualpins/${id}`, data)
        .then(res => res.json()),
    onSuccess: () => {
      // Invalidate the pins query to trigger a refetch
      if (favoriteId) {
        queryClient.invalidateQueries({
          queryKey: ['/api/visualpins', favoriteId],
        });
      }
      toast({
        title: 'Pin updated',
        description: 'Visual pin has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update pin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete a pin
  const deletePinMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/visualpins/${id}`)
        .then(res => res.json()),
    onSuccess: () => {
      // Invalidate the pins query to trigger a refetch
      if (favoriteId) {
        queryClient.invalidateQueries({
          queryKey: ['/api/visualpins', favoriteId],
        });
      }
      toast({
        title: 'Pin removed',
        description: 'Visual pin has been removed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove pin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Wrapper for createPin that checks authentication
  const createPin = (pinData: CreateVisualPinInput) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to create visual pins",
        variant: "destructive",
      });
      return;
    }
    createPinMutation.mutate(pinData);
  };

  // Wrapper for updatePin that checks authentication
  const updatePin = (data: { id: number } & UpdateVisualPinInput) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to update visual pins",
        variant: "destructive",
      });
      return;
    }
    updatePinMutation.mutate(data);
  };

  // Wrapper for deletePin that checks authentication
  const deletePin = (id: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete visual pins",
        variant: "destructive",
      });
      return;
    }
    deletePinMutation.mutate(id);
  };

  return {
    pins,
    isLoading,
    error,
    refetch,
    createPin,
    updatePin,
    deletePin,
    isCreating: createPinMutation.isPending,
    isUpdating: updatePinMutation.isPending,
    isDeleting: deletePinMutation.isPending,
  };
}