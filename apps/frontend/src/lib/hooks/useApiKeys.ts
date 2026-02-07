import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ApiKeySummary } from '@/lib/types';
import { logger } from '@/lib/logger';
import { api, endpoints } from '@/lib/api/client';

type ApiKey = ApiKeySummary;

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await endpoints.publicApi.keys.list();
      const raw = data as { data?: { api_keys?: ApiKey[] }; api_keys?: ApiKey[] };
      setApiKeys(raw?.data?.api_keys ?? raw?.api_keys ?? []);
    } catch (err: any) {
      logger.error('Erreur chargement API keys', {
        error: err,
        message: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createApiKey = useCallback(async (name: string, permissions: string[] = ['read'], rate_limit: number = 1000) => {
    try {
      setLoading(true);
      setError(null);

      const data = await endpoints.publicApi.keys.create({ name, permissions, rate_limit });
      const raw = data as { data?: { api_key?: string; key_info?: unknown }; api_key?: string; key_info?: unknown; message?: string };
      await loadApiKeys();
      return {
        success: true,
        api_key: raw?.data?.api_key ?? raw?.api_key,
        key_info: raw?.data?.key_info ?? raw?.key_info,
        message: raw?.message ?? 'Clé créée',
      };
    } catch (err: any) {
      logger.error('Erreur création API key', {
        error: err,
        name,
        permissions,
        rate_limit,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadApiKeys]);

  const deleteApiKey = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await endpoints.publicApi.keys.delete(id);
      const raw = data as { message?: string };
      await loadApiKeys();
      return { success: true, message: raw?.message ?? 'Clé supprimée' };
    } catch (err: any) {
      logger.error('Erreur suppression API key', {
        error: err,
        apiKeyId: id,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadApiKeys]);

  const toggleApiKey = useCallback(async (id: string, is_active: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.put(`/api/v1/api-keys/${id}`, { is_active });
      const raw = data as { message?: string };
      await loadApiKeys();
      return { success: true, message: raw?.message ?? 'Clé mise à jour' };
    } catch (err: any) {
      logger.error('Erreur toggle API key', {
        error: err,
        apiKeyId: id,
        is_active,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadApiKeys]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const refresh = useCallback(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const memoizedApiKeys = useMemo(() => apiKeys, [apiKeys]);

  return {
    apiKeys: memoizedApiKeys,
    loading,
    error,
    createApiKey,
    deleteApiKey,
    toggleApiKey,
    refresh,
  };
}

