import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

// Types
interface SolutionFeature {
  title: string;
  description: string;
  icon: string;
}

interface SolutionUseCase {
  industry: string;
  title: string;
  description: string;
  result: string;
}

interface SolutionTestimonial {
  quote: string;
  author: string;
  company: string;
  role: string;
  avatar: string;
  result: string;
}

interface SolutionPricing {
  starter: { price: number; features: string[] };
  pro: { price: number; features: string[] };
  enterprise: { price: string; features: string[] };
}

interface SolutionData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  demoUrl?: string;
  features: SolutionFeature[];
  useCases: SolutionUseCase[];
  testimonials: SolutionTestimonial[];
  pricing: SolutionPricing;
  stats: Array<{ value: string; label: string }>;
  integrations: string[];
}

/**
 * Hook pour récupérer les données d'une solution spécifique
 */
export function useSolutionData(solutionId: string) {
  const [data, setData] = useState<SolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!solutionId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await api.get<{ success?: boolean; data?: SolutionData; error?: string }>(`/api/v1/public/solutions`, { params: { id: solutionId } });
      if (result && (result as { success?: boolean }).success === false) {
        throw new Error((result as { error?: string }).error || 'Erreur lors du chargement des données');
      }
      setData((result as { data?: SolutionData })?.data ?? (result as unknown as SolutionData));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement données solution', {
        error: err,
        solutionId,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [solutionId]);

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
 * Hook pour récupérer toutes les solutions
 */
export function useAllSolutions() {
  const [data, setData] = useState<SolutionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.get<{ success?: boolean; data?: SolutionData[]; error?: string }>('/api/v1/public/solutions');
      if (result && (result as { success?: boolean }).success === false) {
        throw new Error((result as { error?: string }).error || 'Erreur lors du chargement des solutions');
      }
      setData((result as { data?: SolutionData[] })?.data ?? []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement toutes les solutions', {
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
    solutions: data,
    loading,
    error,
    refresh: loadData,
  };
}

export type { SolutionData, SolutionFeature, SolutionUseCase, SolutionTestimonial, SolutionPricing };

