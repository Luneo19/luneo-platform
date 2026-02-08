import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

interface Subscription {
  tier: string;
  status: string;
  period?: string;
  trial_ends_at?: string;
  stripe_details?: Record<string, unknown>;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  created: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  description: string;
}

export function useBilling() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await endpoints.billing.subscription();
      const raw = data as { data?: { subscription?: Subscription }; subscription?: Subscription };
      setSubscription(raw.data?.subscription ?? raw.subscription ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Erreur chargement abonnement', {
        error: err,
        message,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await endpoints.billing.invoices();
      const raw = data as { data?: { invoices?: Invoice[] }; invoices?: Invoice[] };
      setInvoices(raw.data?.invoices ?? raw.invoices ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Erreur chargement factures', {
        error: err,
        message,
      });
    }
  }, []);

  useEffect(() => {
    loadSubscription();
    loadInvoices();
  }, [loadSubscription, loadInvoices]);

  const refresh = useCallback(() => {
    loadSubscription();
    loadInvoices();
  }, [loadSubscription, loadInvoices]);

  const memoizedSubscription = useMemo(() => subscription, [subscription]);
  const memoizedInvoices = useMemo(() => invoices, [invoices]);

  return {
    subscription: memoizedSubscription,
    invoices: memoizedInvoices,
    loading,
    error,
    refresh,
  };
}
