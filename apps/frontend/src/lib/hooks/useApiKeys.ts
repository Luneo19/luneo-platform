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

      const raw = await endpoints.publicApi.keys.list();
      // List: backend returns array directly
      const keys = Array.isArray(raw) ? raw : (raw as { data?: { api_keys?: ApiKey[] }; api_keys?: ApiKey[] })?.data?.api_keys ?? (raw as { api_keys?: ApiKey[] }).api_keys ?? (raw as { data?: ApiKey[] }).data ?? [];
      setApiKeys(Array.isArray(keys) ? keys : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Erreur chargement API keys', {
        error: err,
        message,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createApiKey = useCallback(async (name: string, permissions: string[] = ['read']) => {
    try {
      setLoading(true);
      setError(null);

      // Send rateLimit as object, not rate_limit as number
      const response = await endpoints.publicApi.keys.create({
        name,
        permissions: permissions || ['read'],
        rateLimit: { requestsPerMinute: 60, requestsPerDay: 1000, requestsPerMonth: 30000 },
      });
      // Backend returns { apiKey, secret }
      const raw = response as { apiKey?: string; api_key?: string; secret?: string; key_info?: unknown; message?: string };
      const newKey = raw.apiKey ?? raw.api_key ?? (raw as unknown as { api_key?: string }).api_key ?? (raw as unknown);
      const secret = raw.secret;
      await loadApiKeys();
      return {
        success: true,
        api_key: typeof newKey === 'string' ? newKey : (newKey as { apiKey?: string })?.apiKey ?? (newKey as { api_key?: string })?.api_key,
        key_info: raw.key_info,
        secret,
        message: raw?.message ?? 'Clé créée',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Erreur création API key', {
        error: err,
        name,
        permissions,
        message,
      });
      setError(message);
      return { success: false, error: message };
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Erreur suppression API key', {
        error: err,
        apiKeyId: id,
        message,
      });
      setError(message);
      return { success: false, error: message };
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Erreur toggle API key', {
        error: err,
        apiKeyId: id,
        is_active,
        message,
      });
      setError(message);
      return { success: false, error: message };
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

