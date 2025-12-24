import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

// Types
interface IntegrationFeature {
  title: string;
  description: string;
}

interface IntegrationPricing {
  free: boolean;
  includedIn: string[];
}

interface IntegrationData {
  id: string;
  name: string;
  slug: string;
  category: string;
  tagline: string;
  description: string;
  logo: string;
  icon: string;
  website: string;
  docsUrl: string;
  features: IntegrationFeature[];
  setupSteps: string[];
  pricing: IntegrationPricing;
  status: 'available' | 'beta' | 'coming_soon';
  popular: boolean;
}

/**
 * Hook pour récupérer les données d'une intégration spécifique
 */
export function useIntegrationData(integrationId: string) {
  const [data, setData] = useState<IntegrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!integrationId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/public/integrations?id=${integrationId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors du chargement des données');
      }

      setData(result.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement données intégration', {
        error: err,
        integrationId,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [integrationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh: loadData,
  };
}

/**
 * Hook pour récupérer toutes les intégrations
 */
export function useAllIntegrations(options?: { category?: string }) {
  const [data, setData] = useState<IntegrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const category = options?.category;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category) {
        params.set('category', category);
      }

      const url = `/api/public/integrations${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors du chargement des intégrations');
      }

      setData(result.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement toutes les intégrations', {
        error: err,
        category,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    integrations: data,
    loading,
    error,
    refresh: loadData,
  };
}

/**
 * Hook pour récupérer les intégrations populaires
 */
export function usePopularIntegrations() {
  const { integrations, loading, error, refresh } = useAllIntegrations();
  
  const popularIntegrations = integrations.filter((int) => int.popular);

  return {
    integrations: popularIntegrations,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook pour récupérer les catégories d'intégrations
 */
export function useIntegrationCategories() {
  const { integrations, loading, error } = useAllIntegrations();
  
  const categories = [...new Set(integrations.map((int) => int.category))].sort();

  return {
    categories,
    loading,
    error,
  };
}

export type { IntegrationData, IntegrationFeature, IntegrationPricing };

