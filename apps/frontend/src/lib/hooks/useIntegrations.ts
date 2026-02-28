'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface Integration {
  id: string;
  platform: string;
  platform_name: string;
  store_url: string | null;
  store_name: string | null;
  status: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  products_synced: number;
  orders_synced: number;
  created_at: string;
}

function mapApiToIntegration(row: Record<string, unknown>): Integration {
  const platform = String(row.platform ?? '');
  return {
    id: String(row.id),
    platform,
    platform_name: platform.charAt(0).toUpperCase() + platform.slice(1),
    store_url: row.shopDomain ? `https://${row.shopDomain}` : null,
    store_name: (row.shopDomain as string) ?? null,
    status: String(row.status ?? 'active'),
    is_active: (row.status ?? 'active') === 'active',
    last_sync_at: row.lastSyncAt ? new Date(row.lastSyncAt as string).toISOString() : null,
    last_sync_status: null,
    products_synced: Number((row.config as Record<string, unknown>)?.productsSynced ?? 0),
    orders_synced: Number((row.config as Record<string, unknown>)?.ordersSynced ?? 0),
    created_at: new Date((row.createdAt as string) ?? Date.now()).toISOString(),
  };
}

export function useIntegrations() {
  const integrationsModuleEnabled = process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS_MODULE === 'true';
  const queryClient = useQueryClient();

  const integrationsQuery = useQuery({
    queryKey: ['integrations'],
    enabled: integrationsModuleEnabled,
    queryFn: () => api.get<Record<string, unknown>[]>('/api/v1/integrations'),
  });

  const deleteMutation = useMutation({
    mutationFn: (vars: { id: string }) => api.delete(`/api/v1/integrations/${vars.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['integrations'] }); },
  });

  const rawList = (integrationsQuery.data ?? []) as Record<string, unknown>[];
  const integrations: Integration[] = Array.isArray(rawList) ? rawList.map(mapApiToIntegration) : [];
  const loading = integrationsQuery.isLoading;
  const error = integrationsQuery.error?.message ?? null;

  const connectShopify = useCallback(async (storeDomain: string) => {
    window.location.href = `/api/integrations/shopify/connect?shop=${encodeURIComponent(storeDomain)}`;
  }, []);

  const syncShopify = useCallback(async (integrationId: string) => {
    const result = await api.post<{ success?: boolean; error?: string; data?: unknown }>('/api/v1/integrations/shopify/sync', {
      integrationId,
    });
    type SyncResponse = { success?: boolean; error?: string; data?: unknown };
    if (result && typeof result === 'object' && 'success' in result && !(result as SyncResponse).success) {
      throw new Error((result as SyncResponse).error || 'Sync failed');
    }
    queryClient.invalidateQueries({ queryKey: ['integrations'] });
    return (result as SyncResponse)?.data ?? result;
  }, [queryClient]);

  const disconnectIntegration = useCallback(
    async (integrationId: string) => {
      try {
        await deleteMutation.mutateAsync({ id: integrationId });
      } catch (err: unknown) {
        logger.error('Error disconnecting integration', { error: err, integrationId });
        throw err;
      }
    },
    [deleteMutation]
  );

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['integrations'] });
  }, [queryClient]);

  return {
    integrations,
    loading,
    error: error ?? null,
    connectShopify,
    syncShopify,
    disconnectIntegration,
    refresh,
  };
}
