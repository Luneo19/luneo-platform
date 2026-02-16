'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePricingPlans } from '@/lib/hooks/useMarketingData';
import { api, endpoints } from '@/lib/api/client';
import { useI18n } from '@/i18n/useI18n';
import { getTranslatedPlans, getTranslatedFeatures, getTranslatedFaqs } from '../data';
import type { Plan, Feature } from '../data';

type CheckoutResponse = { success?: boolean; url?: string; sessionId?: string; error?: string; message?: string };

export function usePricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const { user } = useAuth();
  const { t } = useI18n();
  const { plans: apiPlans } = usePricingPlans({
    interval: isYearly ? 'yearly' : 'monthly',
  });

  // Translated plans from i18n
  const translatedPlans = useMemo(() => getTranslatedPlans(t), [t]);

  // Translated features and FAQs
  const translatedFeatures: Feature[] = useMemo(() => getTranslatedFeatures(t), [t]);
  const translatedFaqs = useMemo(() => getTranslatedFaqs(t), [t]);

  const mergedPlans: Plan[] = useMemo(() => {
    const basePlans = translatedPlans;
    if (!apiPlans || apiPlans.length === 0) return basePlans;
    return basePlans.map((staticPlan) => {
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
  }, [apiPlans, translatedPlans]);

  const handleCheckout = useCallback(
    async (planId: string) => {
      const billingInterval = isYearly ? 'yearly' : 'monthly';
      const email = user?.email ?? undefined;

      // If user is logged in, check for active subscription and redirect to billing instead
      if (user) {
        try {
          type SubscriptionPayload = { plan?: string; status?: string };
          type SubscriptionResponse = { subscription?: SubscriptionPayload; data?: SubscriptionPayload } & Partial<SubscriptionPayload>;
          const raw = await endpoints.billing.subscription() as SubscriptionResponse | undefined;
          const sub: SubscriptionPayload | undefined = raw?.subscription ?? raw?.data ?? (raw ? { plan: raw.plan, status: raw.status } : undefined);
          const plan = sub?.plan;
          const status = sub?.status;
          if (plan && status === 'active' && plan !== 'free') {
            window.location.href = '/dashboard/billing';
            return;
          }
        } catch {
          // Not subscribed or API error: proceed to checkout
        }
      }

      try {
        const result = await api.post<CheckoutResponse>('/api/v1/billing/create-checkout-session', {
          planId,
          email,
          billingInterval,
        });
        if (!result?.url) {
          const msg = result?.error || result?.message || t('pricing.card.invalidResponse');
          throw new Error(typeof msg === 'string' ? msg : t('pricing.card.invalidResponse'));
        }
        window.location.href = result.url;
      } catch (err: unknown) {
        // Extract the actual backend error message from Axios response if available
        const axiosData = (err as { response?: { data?: { message?: string } } })?.response?.data;
        const backendMessage = axiosData?.message;
        const message = backendMessage || (err instanceof Error ? err.message : String(err));
        if (message.includes('email') || message.includes('Email')) {
          throw new Error(t('pricing.card.emailRequired') || 'Une adresse email valide est requise.');
        }
        if (message.includes('Plan') && message.includes('not found')) {
          throw new Error(t('pricing.card.planNotFound') || 'Ce plan n\'est pas disponible.');
        }
        if (message.includes('rate limit') || message.includes('max requests')) {
          throw new Error(t('pricing.card.rateLimitDesc') || 'Trop de requêtes. Réessayez dans quelques instants.');
        }
        if (message.includes('Stripe') || message.includes('Configuration')) {
          throw new Error(t('pricing.card.configErrorDesc') || 'Le paiement est temporairement indisponible.');
        }
        throw new Error(message || t('errors.generic'));
      }
    },
    [user, isYearly, t]
  );

  return {
    mergedPlans,
    isYearly,
    setIsYearly,
    handleCheckout,
    translatedFeatures,
    translatedFaqs,
    t,
  };
}
