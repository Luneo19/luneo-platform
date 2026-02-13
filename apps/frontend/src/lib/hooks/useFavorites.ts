import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

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
      const result = await api.get<{ favorites: Favorite[] }>('/api/v1/library/favorites', {
        params: { userId, resourceType },
      });
      return result ?? { favorites: [] };
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
      user_id?: string;
      resource_type: 'template' | 'clipart';
      resource_id: string;
    }) =>
      api.post('/api/v1/library/favorites', {
        resourceId: favorite.resource_id,
        resourceType: favorite.resource_type,
      }),
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
    mutationFn: async (params: { favoriteId: string }) =>
      api.delete(`/api/v1/library/favorites/${params.favoriteId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
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
      userId?: string;
      resourceType: 'template' | 'clipart';
      resourceId: string;
      favoriteId?: string;
      isFavorited: boolean;
    }) => {
      if (params.isFavorited && params.favoriteId) {
        return removeMutation.mutateAsync({ favoriteId: params.favoriteId });
      } else {
        return addMutation.mutateAsync({
          resource_type: params.resourceType,
          resource_id: params.resourceId,
        });
      }
    },
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
