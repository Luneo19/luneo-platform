/**
 * Hook personnalisé pour gérer les factures
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import type { Invoice } from '../types';

export function useInvoices() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await endpoints.billing.invoices();
      const raw = data as { invoices?: Array<Record<string, unknown>> };
      const statusMap = ['open', 'paid', 'void', 'uncollectible'] as const;
      const mapStatus = (s: string): Invoice['status'] =>
        statusMap.includes(s as Invoice['status']) ? (s as Invoice['status']) : 'open';
      setInvoices(
        (raw.invoices || []).map((inv: Record<string, unknown>) => ({
          id: String(inv.id ?? ''),
          number: String(inv.number ?? inv.id ?? ''),
          amount: Number(inv.amount ?? 0) / 100, // Stripe amount is in cents
          currency: String(inv.currency ?? 'eur'),
          status: mapStatus(String(inv.status ?? '')),
          date: String(inv.date ?? inv.created ?? ''),
          periodStart: inv.period_start ? new Date(Number(inv.period_start) * 1000).toISOString() : undefined,
          periodEnd: inv.period_end ? new Date(Number(inv.period_end) * 1000).toISOString() : undefined,
          pdfUrl: inv.invoice_pdf as string | undefined,
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



