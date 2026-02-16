'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface Clipart {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  subcategory?: string;
  svg_url: string;
  preview_url: string;
  thumbnail_url?: string;
  svg_content?: string;
  svg_viewbox?: string;
  width?: number;
  height?: number;
  is_premium: boolean;
  is_featured: boolean;
  is_published: boolean;
  is_colorizable: boolean;
  default_color?: string;
  has_multiple_colors: boolean;
  tags: string[];
  keywords?: string[];
  style?: string;
  downloads_count: number;
  favorites_count: number;
  usage_count: number;
  price: number;
  created_at: string;
  updated_at: string;
}

interface ClipartsResponse {
  cliparts: Clipart[];
  total: number;
  limit: number;
  offset: number;
}

interface ClipartsFilters {
  category?: string;
  subcategory?: string;
  style?: string;
  search?: string;
  featured?: boolean;
  premium?: boolean;
  colorizable?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useCliparts(filters: ClipartsFilters = {}) {
  // Construire les query params
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  // GET - Liste des cliparts
  const { data, isLoading, error } = useQuery<ClipartsResponse>({
    queryKey: ['cliparts', filters],
    queryFn: async () => {
      const result = await api.get<ClipartsResponse>('/api/v1/cliparts', { params: Object.fromEntries(params) });
      return result ?? { cliparts: [], total: 0, limit: 0, offset: 0 };
    },
  });

  return {
    cliparts: data?.cliparts || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
}

export function useClipart(id: string) {
  // GET - Clipart unique
  const { data, isLoading, error } = useQuery<Clipart>({
    queryKey: ['clipart', id],
    queryFn: async () => api.get<Clipart>(`/api/v1/cliparts/${id}`),
    enabled: !!id,
  });

  return {
    clipart: data,
    isLoading,
    error,
  };
}

export function useCreateClipart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clipart: Partial<Clipart>) => api.post<Clipart>('/api/v1/cliparts', clipart),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
    },
  });
}

export function useUpdateClipart(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clipart: Partial<Clipart>) => api.patch<Clipart>(`/api/v1/cliparts/${id}`, clipart),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
      queryClient.invalidateQueries({ queryKey: ['clipart', id] });
    },
  });
}

export function useDeleteClipart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/cliparts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
    },
  });
}

