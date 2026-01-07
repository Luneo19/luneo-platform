/**
 * Hook personnalisé pour gérer les méthodes de paiement
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { PaymentMethod } from '../types';

export function usePaymentMethods() {
  const router = useRouter();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/payment-methods');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des méthodes de paiement');
      }

      setPaymentMethods(data.paymentMethods || []);
    } catch (error: any) {
      logger.error('Error fetching payment methods', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la récupération des méthodes de paiement',
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
      // Rediriger vers Stripe pour ajouter une méthode de paiement
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupIntent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'ajout de la méthode de paiement');
      }

      if (data.url) {
        window.location.href = data.url;
        return { success: true };
      }

      return { success: false };
    } catch (error: any) {
      logger.error('Error adding payment method', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'ajout de la méthode de paiement',
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [toast]);

  const deletePaymentMethod = useCallback(
    async (paymentMethodId: string): Promise<{ success: boolean }> => {
      try {
        const response = await fetch(`/api/billing/payment-methods?payment_method_id=${paymentMethodId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la suppression de la méthode de paiement');
        }

        toast({ title: 'Succès', description: 'Méthode de paiement supprimée' });
        router.refresh();
        await fetchPaymentMethods();
        return { success: true };
      } catch (error: any) {
        logger.error('Error deleting payment method', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la suppression de la méthode de paiement',
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


