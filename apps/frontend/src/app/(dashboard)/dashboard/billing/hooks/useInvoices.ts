/**
 * Hook personnalisé pour gérer les factures
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Invoice } from '../types';

export function useInvoices() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/invoices');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des factures');
      }

      setInvoices(
        (data.invoices || []).map((inv: any) => ({
          id: inv.id,
          number: inv.number || inv.id,
          amount: inv.amount / 100, // Stripe amount is in cents
          currency: inv.currency || 'eur',
          status: inv.status,
          date: inv.date || inv.created,
          periodStart: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : undefined,
          periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : undefined,
          pdfUrl: inv.invoice_pdf,
        }))
      );
    } catch (error: any) {
      logger.error('Error fetching invoices', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la récupération des factures',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const downloadInvoice = useCallback(async (invoiceId: string): Promise<void> => {
    try {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (invoice?.pdfUrl) {
        window.open(invoice.pdfUrl, '_blank');
      } else {
        toast({
          title: 'Erreur',
          description: 'URL de téléchargement non disponible',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      logger.error('Error downloading invoice', { error });
      toast({
        title: 'Erreur',
        description: 'Erreur lors du téléchargement de la facture',
        variant: 'destructive',
      });
    }
  }, [invoices, toast]);

  return {
    invoices,
    isLoading,
    fetchInvoices,
    downloadInvoice,
  };
}



