import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface SavedSearch {
  id: number;
  userId: number;
  name: string;
  criteria: any;
  notifyEmail: boolean;
  notifyFrequency: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SavedSearchFormData {
  name: string;
  criteria: any;
  notifyEmail?: boolean;
  notifyFrequency?: string;
}

export function useSavedSearches() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    data: savedSearches,
    isLoading,
    error,
    refetch
  } = useQuery<SavedSearch[]>({
    queryKey: ['/api/searches'],
    enabled: !!user,
    retry: 1,
    staleTime: 60000, // 1 minute
  });
  
  // Handle errors outside the query options to fix type issue
  if (error) {
    toast({
      title: "Error loading saved searches",
      description: (error as Error).message,
      variant: "destructive",
    });
  }
  
  // Create saved search mutation
  const createSavedSearchMutation = useMutation({
    mutationFn: async (searchData: SavedSearchFormData) => {
      const response = await apiRequest('POST', '/api/searches', searchData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/searches'] });
      toast({
        title: "Search saved",
        description: "Your search criteria has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save search",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update saved search mutation
  const updateSavedSearchMutation = useMutation({
    mutationFn: async ({ id, searchData }: { id: number, searchData: Partial<SavedSearchFormData> }) => {
      const response = await apiRequest('PUT', `/api/searches/${id}`, searchData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/searches'] });
      toast({
        title: "Search updated",
        description: "Your saved search has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update search",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete saved search mutation
  const deleteSavedSearchMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/searches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/searches'] });
      toast({
        title: "Search deleted",
        description: "Your saved search has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete search",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  return {
    savedSearches: savedSearches || [],
    isLoading,
    error,
    refetch,
    createSavedSearch: createSavedSearchMutation.mutate,
    isCreating: createSavedSearchMutation.isPending,
    updateSavedSearch: updateSavedSearchMutation.mutate,
    isUpdating: updateSavedSearchMutation.isPending,
    deleteSavedSearch: deleteSavedSearchMutation.mutate,
    isDeleting: deleteSavedSearchMutation.isPending
  };
}