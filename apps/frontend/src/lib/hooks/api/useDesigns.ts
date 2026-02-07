/**
 * ★★★ HOOK - DESIGNS (React Query) ★★★
 * Hooks React Query pour gérer les designs
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import type { Design, DesignSummary } from '@/lib/types';
import { logger } from '@/lib/logger';

interface DesignsListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface DesignsListResponse {
  data: DesignSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Hook pour lister les designs
 */
export function useDesigns(
  params: DesignsListParams = {},
  options?: Omit<UseQueryOptions<DesignsListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DesignsListResponse>({
    queryKey: ['designs', 'list', params],
    queryFn: async () => {
      try {
        const response = await endpoints.designs.list(params);
        
        // Si la réponse est un array, wrapper dans un objet paginé
        if (Array.isArray(response)) {
          return {
            data: response,
            pagination: {
              page: params.page || 1,
              limit: params.limit || 20,
              total: response.length,
              pages: 1,
            },
          };
        }
        const r = response as { designs?: DesignSummary[]; pagination?: { page?: number; limit?: number; total?: number; pages?: number } };
        return {
          data: r.designs ?? [],
          pagination: {
            page: r.pagination?.page ?? params.page ?? 1,
            limit: r.pagination?.limit ?? params.limit ?? 20,
            total: r.pagination?.total ?? 0,
            pages: r.pagination?.pages ?? 1,
          },
        } as DesignsListResponse;
      } catch (error) {
        logger.error('Failed to fetch designs', { error, params });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
    ...options,
  });
}

/**
 * Hook pour récupérer un design spécifique
 */
export function useDesign(
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Design>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Design>({
    queryKey: ['designs', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Design ID is required');
      
      try {
        return await endpoints.designs.get(id);
      } catch (error) {
        logger.error('Failed to fetch design', { error, id });
        throw error;
      }
    },
    enabled: !!id, // Ne pas exécuter si id est null/undefined
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

/**
 * Hook pour créer un design
 */
export function useCreateDesign(
  options?: UseMutationOptions<Design, Error, Partial<Design>>
) {
  const queryClient = useQueryClient();

  return useMutation<Design, Error, Partial<Design>>({
    mutationFn: async (data) => {
      try {
        return await endpoints.designs.create(data);
      } catch (error) {
        logger.error('Failed to create design', { error, data });
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalider le cache des designs pour refetch
      queryClient.invalidateQueries({ queryKey: ['designs', 'list'] });
      // Ajouter le nouveau design au cache
      queryClient.setQueryData(['designs', 'detail', data.id], data);
    },
    ...options,
  });
}

/**
 * Hook pour supprimer un design
 */
export function useDeleteDesign(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      try {
        await endpoints.designs.delete(id);
      } catch (error) {
        logger.error('Failed to delete design', { error, id });
        throw error;
      }
    },
    onSuccess: (_, id) => {
      // Invalider le cache des designs
      queryClient.invalidateQueries({ queryKey: ['designs', 'list'] });
      // Retirer le design du cache
      queryClient.removeQueries({ queryKey: ['designs', 'detail', id] });
    },
    ...options,
  });
}
