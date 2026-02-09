'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePricingPlans } from '@/lib/hooks/useMarketingData';
import { api } from '@/lib/api/client';
import { PLANS } from '../data';

export function usePricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const { user } = useAuth();
  const { plans: apiPlans } = usePricingPlans({
    interval: isYearly ? 'yearly' : 'monthly',
  });

  const mergedPlans = useMemo(() => {
    if (!apiPlans || apiPlans.length === 0) return PLANS;
    return PLANS.map((staticPlan) => {
      const apiPlan = apiPlans.find((p) => p.id === staticPlan.id);
      if (apiPlan?.price) {
        const monthly = apiPlan.price.monthly ?? staticPlan.priceMonthly ?? null;
        const yearly = apiPlan.price.yearly ?? staticPlan.priceYearly ?? null;
        return {
          ...staticPlan,
          priceMonthly: monthly,
          priceYearly: yearly,
          priceYearlyMonthly: yearly != null
            ? Math.round((yearly / 12) * 100) / 100
            : staticPlan.priceYearlyMonthly ?? null,
        };
      }
      return staticPlan;
    });
  }, [apiPlans]);

  const handleCheckout = useCallback(
    async (planId: string) => {
      type Res = { success?: boolean; url?: string; sessionId?: string; error?: string; message?: string };
      const result = await api.post<Res>('/api/v1/billing/create-checkout-session', {
        planId,
        email: user?.email,
        billingInterval: isYearly ? 'yearly' : 'monthly',
      });
      if (!result?.success || !result.url) {
        throw new Error(result?.error || result?.message || 'Réponse invalide du serveur');
      }
      window.location.href = result.url;
    },
    [user, isYearly]
  );

  return { mergedPlans, isYearly, setIsYearly, handleCheckout };
}
