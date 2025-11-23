import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface Subscription {
  tier: string;
  status: string;
  period?: string;
  trial_ends_at?: string;
  stripe_details?: any;
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

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/billing/subscription');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement de l\'abonnement');
      }

      setSubscription(data.data.subscription);
    } catch (err: any) {
      logger.error('Erreur chargement abonnement', {
        error: err,
        message: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des factures');
      }

      setInvoices(data.data.invoices);
    } catch (err: any) {
      logger.error('Erreur chargement factures', {
        error: err,
        message: err.message,
      });
    }
  };

  useEffect(() => {
    loadSubscription();
    loadInvoices();
  }, []);

  return {
    subscription,
    invoices,
    loading,
    error,
    refresh: () => {
      loadSubscription();
      loadInvoices();
    },
  };
}
