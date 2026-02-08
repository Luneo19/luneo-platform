/**
 * Hook for projects list and pagination
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import type { Project, CreateProjectPayload, UpdateProjectPayload, ProjectsFilters } from '../types';

interface ProjectsListResponse {
  data: Project[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function useProjects(filters: ProjectsFilters, page: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['projects', filters, page],
    queryFn: async (): Promise<{ projects: Project[]; stats: { total: number; active: number }; meta: ProjectsListResponse['meta'] }> => {
      const res = await endpoints.projects.list({
        page,
        limit: 20,
        search: filters.search || undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
      });
      const response = res as unknown as ProjectsListResponse;
      const projects = Array.isArray(response?.data) ? response.data : [];
      const total = response?.meta?.total ?? projects.length;
      const active = projects.filter((p: Project) => p.status === 'ACTIVE').length;
      return {
        projects,
        stats: { total, active },
        meta: response?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => endpoints.projects.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectPayload }) =>
      endpoints.projects.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => endpoints.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: (id: string) => endpoints.projects.regenerateApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects: query.data?.projects ?? [],
    stats: query.data?.stats ?? { total: 0, active: 0 },
    meta: query.data?.meta,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
    regenerateApiKey: regenerateApiKeyMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
