import { logger } from '@/lib/logger';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';

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

      const result = await api.get<{ success?: boolean; data?: MarketingData; stats?: unknown; testimonials?: Testimonial[]; integrations?: Integration[]; industries?: Industry[] }>('/api/v1/public/marketing');

      if (result && (result as { success?: boolean }).success === false) {
        setData({ testimonials: [], stats: [], integrations: [], industries: [] });
        return;
      }

      const apiData = (result as { data?: MarketingData })?.data ?? result;
      
      // S'assurer que stats est toujours un array
      let statsArray = [];
      if (Array.isArray(apiData.stats)) {
        statsArray = apiData.stats;
      } else if (apiData.stats && typeof apiData.stats === 'object') {
        const st = apiData.stats as Record<string, unknown>;
        // Convertir l'objet stats en array si nécessaire
        statsArray = [
          { value: String(st.users ?? st.totalBrands ?? 10000), label: 'Créateurs actifs', description: 'Créateurs actifs' },
          { value: String(st.designs ?? st.totalProducts ?? 500000000), label: 'Designs générés', description: 'Designs générés' },
          { value: '3.2s', label: 'Temps moyen génération', description: 'Temps moyen génération' },
          { value: '150+', label: 'Pays', description: 'Pays' },
        ];
      }

      setData({
        testimonials: apiData.testimonials || [],
        stats: statsArray,
        integrations: apiData.integrations || [],
        industries: apiData.industries || [],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement données marketing', {
        error: err,
        message: errorMessage,
      });
      setError(errorMessage);
      // En cas d'erreur, utiliser des données par défaut
      setData({
        testimonials: [],
        stats: [
          { value: '10,000+', label: 'Créateurs actifs', description: 'Créateurs actifs' },
          { value: '500M+', label: 'Designs générés', description: 'Designs générés' },
          { value: '3.2s', label: 'Temps moyen génération', description: 'Temps moyen génération' },
          { value: '150+', label: 'Pays', description: 'Pays' },
        ],
        integrations: [],
        industries: [],
      });
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

      // Use relative URL to hit the Next.js API route at /api/public/plans
      // (NOT the backend via api client, which would 404)
      const params = new URLSearchParams({ currency, interval });
      const response = await fetch(`/api/public/plans?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.status}`);
      }
      const result = await response.json();

      if (result && result.success === false) {
        setData({ plans: [], currency, interval, stripeEnabled: false });
        return;
      }

      const apiData = result?.data ?? result;
      
      // Normaliser les plans
      const plans = Array.isArray(apiData.plans) ? apiData.plans : [];

      setData({
        plans,
        currency: apiData.currency || currency,
        interval: apiData.interval || interval,
        stripeEnabled: apiData.stripeEnabled || false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement plans pricing', {
        error: err,
        currency,
        interval,
        message: errorMessage,
      });
      setError(errorMessage);
      // En cas d'erreur, utiliser des données par défaut
      setData({
        plans: [],
        currency,
        interval,
        stripeEnabled: false,
      });
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

