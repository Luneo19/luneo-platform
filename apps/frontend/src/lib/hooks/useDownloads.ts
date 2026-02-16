'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface Download {
  id: string;
  user_id: string;
  resource_type: 'template' | 'clipart';
  resource_id: string;
  download_url?: string;
  created_at: string;
}

export function useDownloads(userId: string, resourceType?: string) {
  const { data, isLoading, error } = useQuery<{ downloads: Download[] }>({
    queryKey: ['downloads', userId, resourceType],
    queryFn: async () => {
      const params: Record<string, string> = { userId };
      if (resourceType) params.resourceType = resourceType;
      const res = await api.get<{ downloads?: Download[] }>('/api/v1/downloads', { params });
      return { downloads: res?.downloads ?? [] };
    },
    enabled: !!userId,
  });

  return {
    downloads: data?.downloads || [],
    isLoading,
    error,
  };
}

export function useRecordDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (download: {
      user_id: string;
      resource_type: 'template' | 'clipart';
      resource_id: string;
      download_url?: string;
    }) => {
      return api.post('/api/v1/downloads', {
        resourceId: download.resource_id,
        resourceType: download.resource_type,
        fileUrl: download.download_url,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['downloads', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
    },
  });
}
