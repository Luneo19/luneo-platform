/**
 * Hook personnalisé pour l'export de commandes
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Order } from '../types';

export function useOrderExport() {
  const { toast } = useToast();

  const exportOrders = useCallback(
    async (
      orders: Order[],
      format: 'csv' | 'json',
      filename?: string
    ) => {
      try {
        const exportData = orders.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          customer_name: o.customer_name || '',
          customer_email: o.customer_email,
          status: o.status,
          payment_status: o.payment_status,
          total_amount: o.total_amount,
          currency: o.currency,
          created_at: o.created_at,
          shipped_at: o.shipped_at || '',
          delivered_at: o.delivered_at || '',
          tracking_number: o.tracking_number || '',
          items_count: o.items?.length || 0,
        }));

        let blob: Blob;
        let mimeType: string;
        let fileExtension: string;

        switch (format) {
          case 'csv':
            const headers = Object.keys(exportData[0] || {});
            const csv = [
              headers.join(','),
              ...exportData.map((o) =>
                headers.map((h) => {
                  const value = (o as Record<string, unknown>)[h];
                  return typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value;
                }).join(',')
              ),
            ].join('\n');
            blob = new Blob([csv], { type: 'text/csv' });
            mimeType = 'text/csv';
            fileExtension = 'csv';
            break;

          case 'json':
            blob = new Blob([JSON.stringify(exportData, null, 2)], {
              type: 'application/json',
            });
            mimeType = 'application/json';
            fileExtension = 'json';
            break;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `orders-${new Date().toISOString()}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({ title: 'Succès', description: 'Export réussi' });
      } catch (error) {
        logger.error('Error exporting orders', { error });
        toast({
          title: 'Erreur',
          description: 'Erreur lors de l\'export',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  return { exportOrders };
}



