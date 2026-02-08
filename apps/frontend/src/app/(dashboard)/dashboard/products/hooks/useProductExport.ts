/**
 * Hook personnalisé pour l'export de produits
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { ProductDisplay } from '../types';

export function useProductExport() {
  const { toast } = useToast();

  const exportProducts = useCallback(
    async (
      products: ProductDisplay[],
      format: 'csv' | 'json' | 'pdf',
      filename?: string
    ) => {
      try {
        const exportData = products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.price,
          currency: p.currency,
          status: p.status,
          isActive: p.isActive,
          sku: p.sku,
          views: p.views,
          orders: p.orders,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));

        let blob: Blob;
        let mimeType: string;
        let fileExtension: string;

        switch (format) {
          case 'csv':
            const headers = Object.keys(exportData[0] || {});
            const csv = [
              headers.join(','),
              ...exportData.map((p) =>
                headers.map((h) => {
                  const value = (p as Record<string, unknown>)[h];
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

          case 'pdf':
            // PDF export would require a library like jsPDF
            toast({
              title: 'Info',
              description: 'Export PDF à implémenter',
            });
            return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `products-${new Date().toISOString()}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({ title: 'Succès', description: 'Export réussi' });
      } catch (error) {
        logger.error('Error exporting products', { error });
        toast({
          title: 'Erreur',
          description: 'Erreur lors de l\'export',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  return { exportProducts };
}



