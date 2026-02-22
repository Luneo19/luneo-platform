/**
 * Hook personnalisé pour gérer les factures
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { endpoints } from '@/lib/api/client';
import type { Invoice } from '../types';

function is429(error: unknown): boolean {
  const err = error as { response?: { status?: number } };
  return err?.response?.status === 429;
}

export function useInvoices() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const initialFetchDone = useRef(false);
  const errorToastShown = useRef(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setRateLimitMessage(null);
      const data = await endpoints.billing.invoices();
      const raw = data as { invoices?: Array<Record<string, unknown>> };
      const list = Array.isArray(raw?.invoices) ? raw.invoices : [];
      const statusMap = ['open', 'paid', 'void', 'uncollectible'] as const;
      const mapStatus = (s: string): Invoice['status'] =>
        statusMap.includes(s as Invoice['status']) ? (s as Invoice['status']) : 'open';
      setInvoices(
        list.map((inv: Record<string, unknown>) => ({
          id: String(inv.id ?? ''),
          number: String(inv.number ?? inv.id ?? ''),
          amount: Number(inv.amount ?? 0) / 100, // Stripe amount is in cents
          currency: String(inv.currency ?? 'eur'),
          status: mapStatus(String(inv.status ?? '')),
          date: String(inv.date ?? inv.created ?? ''),
          periodStart: inv.period_start ? new Date(Number(inv.period_start) * 1000).toISOString() : undefined,
          periodEnd: inv.period_end ? new Date(Number(inv.period_end) * 1000).toISOString() : undefined,
          pdfUrl: (inv.invoicePdf ?? inv.invoice_pdf ?? inv.pdf_url) as string | undefined,
        }))
      );
    } catch (error: unknown) {
      logger.error('Error fetching invoices', { error });
      if (is429(error)) {
        setRateLimitMessage(t('billing.tooManyRequests') || 'Trop de requêtes, veuillez patienter.');
        return;
      }
      if (!errorToastShown.current) {
        errorToastShown.current = true;
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchInvoices();
  }, [fetchInvoices]);

  const downloadInvoice = useCallback(async (invoiceId: string): Promise<void> => {
    try {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (invoice?.pdfUrl) {
        window.open(invoice.pdfUrl, '_blank');
      } else {
        toast({
          title: t('common.error'),
          description: t('common.somethingWentWrong'),
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      logger.error('Error downloading invoice', { error });
      toast({
        title: t('common.error'),
        description: t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    }
  }, [invoices, toast, t]);

  return {
    invoices,
    isLoading,
    rateLimitMessage,
    fetchInvoices,
    downloadInvoice,
  };
}



