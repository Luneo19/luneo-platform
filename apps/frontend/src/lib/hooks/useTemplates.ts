import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  subcategory?: string;
  preview_url: string;
  thumbnail_url?: string;
  konva_json: any;
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
  // Construire les query params
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  // GET - Liste des templates
  const { data, isLoading, error } = useQuery<TemplatesResponse>({
    queryKey: ['templates', filters],
    queryFn: async () => {
      const response = await fetch(`/api/templates?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
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
    queryFn: async () => {
      const response = await fetch(`/api/templates/${id}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      return response.json();
    },
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
    mutationFn: async (template: Partial<Template>) => {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<Template>) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

