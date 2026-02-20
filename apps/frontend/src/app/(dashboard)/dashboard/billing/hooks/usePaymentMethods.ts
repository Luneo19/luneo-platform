/**
 * Hook personnalisé pour gérer les méthodes de paiement
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { api, endpoints } from '@/lib/api/client';
import type { PaymentMethod } from '../types';

export function usePaymentMethods() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await endpoints.billing.paymentMethods();
      const raw = data as { paymentMethods?: PaymentMethod[] };
      setPaymentMethods(raw.paymentMethods || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('billing.fetchPaymentMethodsError');
      logger.error('Error fetching payment methods', { error });
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const message = error instanceof Error ? error.message : t('billing.addPaymentMethodError');
      logger.error('Error adding payment method', { error });
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [toast, t]);

  const deletePaymentMethod = useCallback(
    async (paymentMethodId: string): Promise<{ success: boolean }> => {
      try {
        await api.delete('/api/v1/billing/payment-methods', {
          params: { id: paymentMethodId },
        });

        toast({ title: t('common.success'), description: t('billing.paymentMethodDeleted') });
        router.refresh();
        await fetchPaymentMethods();
        return { success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t('billing.deletePaymentMethodError');
        logger.error('Error deleting payment method', { error });
        toast({
          title: t('common.error'),
          description: message,
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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



