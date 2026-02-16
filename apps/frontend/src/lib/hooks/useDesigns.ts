'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints, type GenerateDesignResponse } from '../api/client';
import type { Design, DesignSummary } from '@/lib/types';

type DesignListItem = DesignSummary;

/**
 * Hook to get all designs
 */
export function useDesigns(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery<DesignListItem[]>({
    queryKey: ['designs', params],
    queryFn: async () => {
      const res = await endpoints.designs.list(params);
      return Array.isArray(res) ? res : (res as { designs?: DesignSummary[] })?.designs ?? [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute (designs update frequently)
  });
}

/**
 * Hook to get single design
 */
export function useDesign(id: string) {
  return useQuery<Design>({
    queryKey: ['designs', id],
    queryFn: () => endpoints.designs.get(id),
    enabled: !!id,
    refetchInterval: (query) => {
      // Auto-refresh if design is still processing
      const data = query.state.data as Design | undefined;
      if (data?.status === 'PROCESSING' || data?.status === 'PENDING') {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
  });
}

/**
 * Hook to create design
 */
export function useCreateDesign() {
  const queryClient = useQueryClient();

  return useMutation<Design, Error, Partial<Design>>({
    mutationFn: (data: Partial<Design>) => endpoints.designs.create(data),
    onSuccess: (newDesign) => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      // Start polling for the new design
      queryClient.setQueryData(['designs', newDesign.id], newDesign);
    },
  });
}

/**
 * Hook to delete design
 */
export function useDeleteDesign() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => endpoints.designs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
}

/**
 * Hook to generate AI design
 */
export function useGenerateAIDesign() {
  const queryClient = useQueryClient();

  return useMutation<GenerateDesignResponse, Error, { prompt: string; productId: string; options?: Record<string, unknown> }>({
    mutationFn: (data) => endpoints.ai.generate(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      if (result.designId) {
        queryClient.setQueryData(['designs', result.designId], result);
      }
    },
  });
}

