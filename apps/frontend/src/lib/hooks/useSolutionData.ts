'use client';

import { useState, useCallback } from 'react';

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
 * Hook pour récupérer les données d'une solution spécifique.
 * Les pages solutions utilisent des données locales (constantes) comme fallback.
 * Ce hook retourne null pour `data` car les solutions sont des pages marketing statiques.
 * Les composants qui l'utilisent basculent automatiquement sur leurs données locales.
 */
export function useSolutionData(_solutionId: string) {
  const [data] = useState<SolutionData | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const refresh = useCallback(() => {
    // No-op: solution pages use local static data
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook pour récupérer toutes les solutions.
 * Les solutions sont des pages marketing statiques — pas de données dynamiques requises.
 */
export function useAllSolutions() {
  const [data] = useState<SolutionData[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const refresh = useCallback(() => {
    // No-op: solutions are static marketing pages
  }, []);

  return {
    solutions: data,
    loading,
    error,
    refresh,
  };
}

export type { SolutionData, SolutionFeature, SolutionUseCase, SolutionTestimonial, SolutionPricing };

