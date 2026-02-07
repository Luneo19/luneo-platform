import { useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
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

// Map tRPC integration (IntegrationService shape) to hook's Integration
function mapTrpcToIntegration(row: {
  id: string;
  platform: string;
  shopDomain?: string;
  status?: string;
  lastSyncAt?: Date | null;
  config?: Record<string, unknown>;
  createdAt: Date;
}): Integration {
  return {
    id: row.id,
    platform: row.platform,
    platform_name: row.platform.charAt(0).toUpperCase() + row.platform.slice(1),
    store_url: row.shopDomain ? `https://${row.shopDomain}` : null,
    store_name: row.shopDomain ?? null,
    status: row.status ?? 'active',
    is_active: (row.status ?? 'active') === 'active',
    last_sync_at: row.lastSyncAt ? new Date(row.lastSyncAt).toISOString() : null,
    last_sync_status: null,
    products_synced: (row.config as any)?.productsSynced ?? 0,
    orders_synced: (row.config as any)?.ordersSynced ?? 0,
    created_at: new Date(row.createdAt).toISOString(),
  };
}

export function useIntegrations() {
  const integrationsQuery = trpc.integration.list.useQuery();
  const deleteMutation = trpc.integration.delete.useMutation({
    onSuccess: () => {
      integrationsQuery.refetch();
    },
  });

  const rawList = (integrationsQuery.data ?? []) as unknown as Array<{
    id: string;
    platform: string;
    shopDomain?: string;
    status?: string;
    lastSyncAt?: Date | null;
    config?: Record<string, unknown>;
    createdAt: Date;
  }>;
  const integrations: Integration[] = rawList.map(mapTrpcToIntegration);
  const loading = integrationsQuery.isLoading;
  const error = integrationsQuery.error?.message ?? null;

  const fetchIntegrations = useCallback(() => {
    integrationsQuery.refetch();
  }, [integrationsQuery]);

  const connectShopify = useCallback(async (storeDomain: string) => {
    window.location.href = `/api/integrations/shopify/connect?shop=${encodeURIComponent(storeDomain)}`;
  }, []);

  const syncShopify = useCallback(async (integrationId: string) => {
    const result = await api.post<{ success?: boolean; error?: string; data?: unknown }>('/api/v1/integrations/shopify/sync', {
      integrationId,
    });
    if (result && typeof result === 'object' && 'success' in result && !result.success) {
      throw new Error((result as { error?: string }).error || 'Sync failed');
    }
    integrationsQuery.refetch();
    return (result as { data?: unknown })?.data ?? result;
  }, [integrationsQuery]);

  const disconnectIntegration = useCallback(
    async (integrationId: string) => {
      try {
        await deleteMutation.mutateAsync({ id: integrationId });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to disconnect';
        logger.error('Error disconnecting integration', { error: err, integrationId });
        throw err;
      }
    },
    [deleteMutation]
  );

  const refresh = useCallback(() => {
    integrationsQuery.refetch();
  }, [integrationsQuery]);

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
