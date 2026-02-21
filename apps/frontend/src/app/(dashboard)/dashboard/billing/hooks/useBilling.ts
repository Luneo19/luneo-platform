/**
 * Hook personnalisé pour gérer la facturation
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import type { Subscription, SubscriptionTier } from '../types';

function is429(error: unknown): boolean {
  const err = error as { response?: { status?: number } };
  return err?.response?.status === 429;
}

export function useBilling() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  /** Prevents infinite retry: once we hit 429 or give up, we don't auto-retry from this hook */
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const fetchCountRef = useRef(0);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setRateLimitMessage(null);
      const data = await endpoints.billing.subscription();
      const raw = data as { subscription?: Subscription };
      const sub = raw.subscription ?? (data as { data?: { subscription?: Subscription } }).data?.subscription;
      setSubscription(sub ?? null);
      return sub ?? null;
    } catch (error: unknown) {
      logger.error('Error fetching subscription', { error });
      if (is429(error)) {
        setRateLimitMessage(t('billing.tooManyRequests') || 'Trop de requêtes, veuillez patienter.');
        return null;
      }
      fetchCountRef.current += 1;
      if (fetchCountRef.current <= 1) {
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  const updateSubscription = useCallback(
    async (plan: SubscriptionTier, cancelAtPeriodEnd?: boolean): Promise<{ success: boolean }> => {
      try {
        setIsLoading(true);
        await endpoints.billing.changePlan({ planId: plan });
        toast({ title: t('common.success'), description: t('common.success') });
        router.refresh();
        await fetchSubscription();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error updating subscription', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [toast, router, fetchSubscription, t]
  );

  const cancelSubscription = useCallback(
    async (cancelAtPeriodEnd: boolean = true): Promise<{ success: boolean }> => {
      try {
        setIsLoading(true);
        await endpoints.billing.cancelSubscription(!cancelAtPeriodEnd);
        toast({ title: t('common.success'), description: t('common.success') });
        router.refresh();
        await fetchSubscription();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error cancelling subscription', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [toast, router, fetchSubscription, t]
  );

  const createCheckoutSession = useCallback(
    async (planId: SubscriptionTier, period: 'monthly' | 'yearly'): Promise<{ success: boolean; url?: string }> => {
      try {
        setIsLoading(true);
        // Fetch user email for checkout session
        let email: string | undefined;
        try {
          const user = await endpoints.auth.me();
          email = (user as { email?: string })?.email;
        } catch {
          // User might not be authenticated - will use email from body
        }
        const data = await endpoints.billing.subscribe(planId, email, period);
        const url = (data as { url?: string }).url;
        if (url) {
          window.location.href = url;
          return { success: true, url };
        }
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error creating checkout session', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [toast, t]
  );

  return {
    subscription,
    isLoading,
    rateLimitMessage,
    fetchSubscription,
    updateSubscription,
    cancelSubscription,
    createCheckoutSession,
  };
}



