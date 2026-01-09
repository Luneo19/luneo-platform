/**
 * Hook personnalisé pour gérer la facturation
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Subscription, SubscriptionTier } from '../types';

export function useBilling() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/subscription');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération de l\'abonnement');
      }

      setSubscription(data.subscription);
      return data.subscription;
    } catch (error: any) {
      logger.error('Error fetching subscription', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la récupération de l\'abonnement',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateSubscription = useCallback(
    async (plan: SubscriptionTier, cancelAtPeriodEnd?: boolean): Promise<{ success: boolean }> => {
      try {
        setIsLoading(true);

        const response = await fetch('/api/billing/subscription', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            cancelAtPeriodEnd,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la mise à jour de l\'abonnement');
        }

        toast({ title: 'Succès', description: 'Abonnement mis à jour avec succès' });
        router.refresh();
        await fetchSubscription();
        return { success: true };
      } catch (error: any) {
        logger.error('Error updating subscription', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la mise à jour de l\'abonnement',
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [toast, router, fetchSubscription]
  );

  const cancelSubscription = useCallback(
    async (cancelAtPeriodEnd: boolean = true): Promise<{ success: boolean }> => {
      try {
        setIsLoading(true);

        const response = await fetch('/api/billing/subscription', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cancelAtPeriodEnd,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de l\'annulation de l\'abonnement');
        }

        toast({ title: 'Succès', description: 'Abonnement annulé avec succès' });
        router.refresh();
        await fetchSubscription();
        return { success: true };
      } catch (error: any) {
        logger.error('Error cancelling subscription', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de l\'annulation de l\'abonnement',
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [toast, router, fetchSubscription]
  );

  const createCheckoutSession = useCallback(
    async (planId: SubscriptionTier, period: 'monthly' | 'yearly'): Promise<{ success: boolean; url?: string }> => {
      try {
        setIsLoading(true);

        const response = await fetch('/api/billing/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            period,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la création de la session de paiement');
        }

        if (data.url) {
          window.location.href = data.url;
          return { success: true, url: data.url };
        }

        return { success: true };
      } catch (error: any) {
        logger.error('Error creating checkout session', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la création de la session de paiement',
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    subscription,
    isLoading,
    fetchSubscription,
    updateSubscription,
    cancelSubscription,
    createCheckoutSession,
  };
}



