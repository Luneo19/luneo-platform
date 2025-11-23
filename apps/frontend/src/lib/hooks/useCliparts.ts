import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
      const response = await fetch(`/api/cliparts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch cliparts');
      return response.json();
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
    queryFn: async () => {
      const response = await fetch(`/api/cliparts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch clipart');
      return response.json();
    },
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
    mutationFn: async (clipart: Partial<Clipart>) => {
      const response = await fetch('/api/cliparts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clipart),
      });
      if (!response.ok) throw new Error('Failed to create clipart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
    },
  });
}

export function useUpdateClipart(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clipart: Partial<Clipart>) => {
      const response = await fetch(`/api/cliparts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clipart),
      });
      if (!response.ok) throw new Error('Failed to update clipart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
      queryClient.invalidateQueries({ queryKey: ['clipart', id] });
    },
  });
}

export function useDeleteClipart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cliparts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete clipart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
    },
  });
}

