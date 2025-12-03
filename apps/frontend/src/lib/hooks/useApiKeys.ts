import { useState, useEffect } from 'react';
import type { ApiKeySummary } from '@/lib/types';
import { logger } from '@/lib/logger';

type ApiKey = ApiKeySummary;

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/api-keys');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des clés API');
      }

      setApiKeys(data.data.api_keys);
    } catch (err: any) {
      logger.error('Erreur chargement API keys', {
        error: err,
        message: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (name: string, permissions: string[] = ['read'], rate_limit: number = 1000) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, permissions, rate_limit }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la clé');
      }

      await loadApiKeys();
      
      // Retourner la clé complète (affichée UNE SEULE FOIS)
      return {
        success: true,
        api_key: data.data.api_key,
        key_info: data.data.key_info,
        message: data.message,
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
  };

  const deleteApiKey = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      await loadApiKeys();
      return { success: true, message: data.message };
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
  };

  const toggleApiKey = async (id: string, is_active: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      await loadApiKeys();
      return { success: true, message: data.message };
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
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  return {
    apiKeys,
    loading,
    error,
    createApiKey,
    deleteApiKey,
    toggleApiKey,
    refresh: loadApiKeys,
  };
}

