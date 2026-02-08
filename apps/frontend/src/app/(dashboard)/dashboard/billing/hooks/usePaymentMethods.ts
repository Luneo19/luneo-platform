/**
 * Hook personnalisé pour gérer les méthodes de paiement
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { api, endpoints } from '@/lib/api/client';
import type { PaymentMethod } from '../types';

export function usePaymentMethods() {
  const router = useRouter();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await endpoints.billing.paymentMethods();
      const raw = data as { paymentMethods?: PaymentMethod[] };
      setPaymentMethods(raw.paymentMethods || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des méthodes de paiement';
      logger.error('Error fetching payment methods', { error });
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const addPaymentMethod = useCallback(async (): Promise<{ success: boolean }> => {
    try {
      const data = await api.post<{ url?: string }>('/api/v1/billing/create-checkout-session', {
        setupIntent: true,
      });

      if (data?.url) {
        window.location.href = data.url;
        return { success: true };
      }

      return { success: false };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la méthode de paiement';
      logger.error('Error adding payment method', { error });
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [toast]);

  const deletePaymentMethod = useCallback(
    async (paymentMethodId: string): Promise<{ success: boolean }> => {
      try {
        await api.delete('/api/v1/billing/payment-methods', {
          params: { id: paymentMethodId },
        });

        toast({ title: 'Succès', description: 'Méthode de paiement supprimée' });
        router.refresh();
        await fetchPaymentMethods();
        return { success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de la méthode de paiement';
        logger.error('Error deleting payment method', { error });
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [toast, router, fetchPaymentMethods]
  );

  return {
    paymentMethods,
    isLoading,
    fetchPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
  };
}



