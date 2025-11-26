import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  company: string;
  avatar?: string;
  rating: number;
}

interface Stat {
  label: string;
  value: string;
  description: string;
}

interface Integration {
  name: string;
  icon: string;
  description: string;
  link: string;
}

interface Industry {
  name: string;
  icon: string;
  description: string;
  link: string;
}

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanLimits {
  designs: number;
  products: number;
  storage: string;
  apiCalls: number;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: { monthly: number | null; yearly: number | null };
  currency: string;
  features: PlanFeature[];
  limits: PlanLimits;
  popular: boolean;
  stripePriceId: {
    monthly?: string;
    yearly?: string;
  } | null;
}

interface MarketingData {
  testimonials: Testimonial[];
  stats: Stat[];
  integrations: Integration[];
  industries: Industry[];
  pricingPlans?: Array<{
    name: string;
    price: string;
    views: string;
    products: string;
    features: string[];
    popular?: boolean;
  }>;
}

interface PlansData {
  plans: PricingPlan[];
  currency: string;
  interval: string;
  stripeEnabled: boolean;
}

/**
 * Hook pour récupérer les données marketing publiques
 */
export function useMarketingData() {
  const [data, setData] = useState<MarketingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/public/marketing');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chargement des données');
      }

      setData(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement données marketing', {
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
    testimonials: data?.testimonials || [],
    stats: data?.stats || [],
    integrations: data?.integrations || [],
    industries: data?.industries || [],
    pricingPlans: data?.pricingPlans || [],
    loading,
    error,
    refresh: loadData,
  };
}

/**
 * Hook pour récupérer les plans de pricing depuis Stripe
 */
export function usePricingPlans(options?: { currency?: string; interval?: 'monthly' | 'yearly' }) {
  const [data, setData] = useState<PlansData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = options?.currency || 'EUR';
  const interval = options?.interval || 'monthly';

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ currency, interval });
      const response = await fetch(`/api/public/plans?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors du chargement des plans');
      }

      setData(result.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement plans pricing', {
        error: err,
        currency,
        interval,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currency, interval]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return {
    plans: data?.plans || [],
    currency: data?.currency || currency,
    interval: data?.interval || interval,
    stripeEnabled: data?.stripeEnabled || false,
    loading,
    error,
    refresh: loadPlans,
  };
}

/**
 * Hook pour récupérer uniquement les témoignages
 */
export function useTestimonials() {
  const { testimonials, loading, error, refresh } = useMarketingData();
  return { testimonials, loading, error, refresh };
}

/**
 * Hook pour récupérer uniquement les statistiques
 */
export function useMarketingStats() {
  const { stats, loading, error, refresh } = useMarketingData();
  return { stats, loading, error, refresh };
}

