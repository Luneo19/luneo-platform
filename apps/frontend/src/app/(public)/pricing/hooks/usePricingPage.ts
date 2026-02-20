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

      // Not logged in: redirect to register with plan pre-selected
      if (!user) {
        const params = new URLSearchParams({ plan: planId, interval: billingInterval });
        window.location.href = `/register?${params.toString()}`;
        return;
      }

      // Logged in: check for active paid subscription
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

      // Logged in, no active subscription: create checkout session
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/74bd0f02-b590-4981-b131-04808be8021c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'249815'},body:JSON.stringify({sessionId:'249815',location:'usePricingPage.ts:78',message:'Creating checkout session',data:{planId,email:user.email,billingInterval},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        const result = await api.post<CheckoutResponse>('/api/v1/billing/create-checkout-session', {
          planId,
          email: user.email,
          billingInterval,
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/74bd0f02-b590-4981-b131-04808be8021c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'249815'},body:JSON.stringify({sessionId:'249815',location:'usePricingPage.ts:88',message:'Checkout session result',data:{success:result?.success,hasUrl:!!result?.url,error:result?.error,message:result?.message},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        if (!result?.url) {
          const msg = result?.error || result?.message || t('pricing.card.invalidResponse');
          throw new Error(typeof msg === 'string' ? msg : t('pricing.card.invalidResponse'));
        }
        window.location.href = result.url;
      } catch (err: unknown) {
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
