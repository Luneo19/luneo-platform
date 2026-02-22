/**
 * Hook personnalisé pour l'export des analytics
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import type { AnalyticsData, AnalyticsMetric } from '../types';

export function useAnalyticsExport() {
  const { toast } = useToast();
  const { t } = useI18n();

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

        toast({ title: t('common.success'), description: t('common.export') });
      } catch (error) {
        logger.error('Error exporting analytics', { error });
        toast({
          title: t('common.error'),
          description: t('common.somethingWentWrong'),
          variant: 'destructive',
        });
      }
    },
    [toast, t]
  );

  return { exportAnalytics };
}



