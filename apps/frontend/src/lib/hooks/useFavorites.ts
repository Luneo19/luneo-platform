import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Favorite {
  id: string;
  user_id: string;
  resource_type: 'template' | 'clipart';
  resource_id: string;
  created_at: string;
}

export function useFavorites(userId: string, resourceType?: string) {
  const { data, isLoading, error } = useQuery<{ favorites: Favorite[] }>({
    queryKey: ['favorites', userId, resourceType],
    queryFn: async () => {
      const params = new URLSearchParams({ userId });
      if (resourceType) params.append('resourceType', resourceType);
      
      const response = await fetch(`/api/favorites?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch favorites');
      return response.json();
    },
    enabled: !!userId,
  });

  return {
    favorites: data?.favorites || [],
    isLoading,
    error,
  };
}

export function useAddToFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favorite: {
      user_id: string;
      resource_type: 'template' | 'clipart';
      resource_id: string;
    }) => {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(favorite),
      });
      if (!response.ok) throw new Error('Failed to add to favorites');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
    },
  });
}

export function useRemoveFromFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      resourceType: 'template' | 'clipart';
      resourceId: string;
    }) => {
      const searchParams = new URLSearchParams({
        userId: params.userId,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
      });
      
      const response = await fetch(`/api/favorites?${searchParams.toString()}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove from favorites');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
    },
  });
}

export function useToggleFavorite() {
  const addMutation = useAddToFavorites();
  const removeMutation = useRemoveFromFavorites();

  return {
    toggle: async (params: {
      userId: string;
      resourceType: 'template' | 'clipart';
      resourceId: string;
      isFavorited: boolean;
    }) => {
      if (params.isFavorited) {
        return removeMutation.mutateAsync({
          userId: params.userId,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
        });
      } else {
        return addMutation.mutateAsync({
          user_id: params.userId,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
        });
      }
    },
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
