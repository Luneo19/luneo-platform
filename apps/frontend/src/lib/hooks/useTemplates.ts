'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  subcategory?: string;
  preview_url: string;
  thumbnail_url?: string;
  konva_json: Record<string, unknown>;
  width: number;
  height: number;
  unit: string;
  is_premium: boolean;
  is_featured: boolean;
  is_published: boolean;
  tags?: string[];
  keywords?: string[];
  downloads_count: number;
  favorites_count: number;
  usage_count: number;
  price: number;
  original_price?: number;
  created_at: string;
  updated_at: string;
}

interface TemplatesResponse {
  templates: Template[];
  total: number;
  limit: number;
  offset: number;
}

interface TemplatesFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  featured?: boolean;
  premium?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useTemplates(filters: TemplatesFilters = {}) {
  const templatesModuleEnabled = process.env.NEXT_PUBLIC_ENABLE_TEMPLATES_MODULE === 'true';
  // GET - Liste des templates
  const { data, isLoading, error } = useQuery<TemplatesResponse>({
    queryKey: ['templates', filters],
    queryFn: async () => {
      if (!templatesModuleEnabled) {
        return { templates: [], total: 0, limit: 0, offset: 0 };
      }
      const result = await api.get<TemplatesResponse>('/api/v1/templates', { params: filters });
      return result ?? { templates: [], total: 0, limit: 0, offset: 0 };
    },
    enabled: templatesModuleEnabled,
  });

  return {
    templates: data?.templates || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
}

export function useTemplate(id: string) {
  // GET - Template unique
  const { data, isLoading, error } = useQuery<Template>({
    queryKey: ['template', id],
    queryFn: async () => api.get<Template>(`/api/v1/templates/${id}`),
    enabled: !!id,
  });

  return {
    template: data,
    isLoading,
    error,
  };
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<Template>) => api.post<Template>('/api/v1/templates', template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<Template>) => api.patch<Template>(`/api/v1/templates/${id}`, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

