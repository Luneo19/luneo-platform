import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

// Types
interface IndustryFeature {
  title: string;
  description: string;
  icon: string;
}

interface IndustryCaseStudy {
  company: string;
  logo?: string;
  challenge: string;
  solution: string;
  results: string[];
  quote?: string;
  author?: string;
  role?: string;
}

interface IndustryData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  heroImage: string;
  icon: string;
  features: IndustryFeature[];
  caseStudies: IndustryCaseStudy[];
  stats: Array<{ value: string; label: string }>;
  recommendedSolutions: string[];
}

/**
 * Hook pour récupérer les données d'une industrie spécifique
 */
export function useIndustryData(industryId: string) {
  const [data, setData] = useState<IndustryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!industryId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/public/industries?id=${industryId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors du chargement des données');
      }

      setData(result.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement données industrie', {
        error: err,
        industryId,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [industryId]);

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
 * Hook pour récupérer toutes les industries
 */
export function useAllIndustries() {
  const [data, setData] = useState<IndustryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/public/industries');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors du chargement des industries');
      }

      setData(result.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement toutes les industries', {
        error: err,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    industries: data,
    loading,
    error,
    refresh: loadData,
  };
}

export type { IndustryData, IndustryFeature, IndustryCaseStudy };

