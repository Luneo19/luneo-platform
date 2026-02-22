/**
 * Hook personnalisé pour gérer les intégrations AR
 */

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Integration, IntegrationCategory, SyncLog } from '../types';

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIntegrations();
    fetchSyncLogs();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const data = await api.get<{ data?: Integration[]; integrations?: Integration[] }>('/api/v1/ar-studio/integrations');
      setIntegrations(data?.data ?? data?.integrations ?? []);
    } catch (error) {
      logger.error('Failed to fetch integrations', { error });
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const data = await api.get<{ data?: SyncLog[]; logs?: SyncLog[] }>('/api/v1/ar-studio/integrations/sync-logs');
      setSyncLogs(data?.data ?? data?.logs ?? []);
    } catch (error) {
      logger.error('Failed to fetch sync logs', { error });
    }
  };

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesCategory =
        selectedCategory === 'all' || integration.category === selectedCategory;
      const matchesSearch =
        searchTerm === '' ||
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [integrations, selectedCategory, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: integrations.length,
      connected: integrations.filter((i) => i.status === 'connected').length,
      enabled: integrations.filter((i) => i.enabled).length,
      totalSyncs: integrations.reduce((sum, i) => sum + i.syncCount, 0),
      averageSuccessRate:
        integrations.length > 0
          ? integrations.reduce((sum, i) => sum + i.successRate, 0) / integrations.length
          : 0,
      totalErrors: integrations.reduce((sum, i) => sum + i.errorCount, 0),
    };
  }, [integrations]);

  const toggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      await api.patch(`/api/v1/ar-studio/integrations/${integrationId}`, { enabled });
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integrationId ? { ...i, enabled } : i))
      );
      return { success: true };
    } catch (error) {
      logger.error('Failed to toggle integration', { error, integrationId });
      return { success: false, error: 'Network error' };
    }
  };

  const testConnection = async (integrationId: string) => {
    try {
      const data = await api.post<{ health?: unknown }>(`/api/v1/ar-studio/integrations/${integrationId}/test`);
      return { success: true, health: data?.health };
    } catch (error) {
      logger.error('Failed to test connection', { error, integrationId });
      return { success: false, error: 'Network error' };
    }
  };

  return {
    integrations: filteredIntegrations,
    allIntegrations: integrations,
    syncLogs,
    stats,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    toggleIntegration,
    testConnection,
    refetch: fetchIntegrations,
  };
}



