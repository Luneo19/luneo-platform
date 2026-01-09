/**
 * Hook personnalisé pour l'export des analytics
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { AnalyticsData, AnalyticsMetric } from '../types';

export function useAnalyticsExport() {
  const { toast } = useToast();

  const exportAnalytics = useCallback(
    async (
      data: AnalyticsData,
      metrics: AnalyticsMetric[],
      format: 'csv' | 'json',
      filename?: string
    ) => {
      try {
        let blob: Blob;
        let fileExtension: string;

        switch (format) {
          case 'csv':
            const headers = ['Métrique', 'Valeur', 'Évolution (%)'];
            const csv = [
              headers.join(','),
              ...metrics.map((m) => `${m.name},${m.value},${m.change.toFixed(2)}%`),
            ].join('\n');
            blob = new Blob([csv], { type: 'text/csv' });
            fileExtension = 'csv';
            break;

          case 'json':
            blob = new Blob([JSON.stringify({ data, metrics }, null, 2)], {
              type: 'application/json',
            });
            fileExtension = 'json';
            break;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `analytics-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({ title: 'Succès', description: 'Export réussi' });
      } catch (error) {
        logger.error('Error exporting analytics', { error });
        toast({
          title: 'Erreur',
          description: 'Erreur lors de l\'export',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  return { exportAnalytics };
}



