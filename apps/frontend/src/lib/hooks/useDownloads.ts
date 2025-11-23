import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
      const params = new URLSearchParams({ userId });
      if (resourceType) params.append('resourceType', resourceType);
      
      const response = await fetch(`/api/downloads?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch downloads');
      return response.json();
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
      const response = await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(download),
      });
      if (!response.ok) throw new Error('Failed to record download');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['downloads', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['cliparts'] });
    },
  });
}
