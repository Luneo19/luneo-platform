import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface ChartData {
  designs: number[];
  views: number[];
  revenue: number[];
  conversion: number;
  conversionChange: number;
}

export function useChartData(period: '24h' | '7d' | '30d' | '90d' = '7d') {
  const [chartData, setChartData] = useState<ChartData>({
    designs: [],
    views: [],
    revenue: [],
    conversion: 0,
    conversionChange: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.get<ChartData & { data?: ChartData }>('/api/v1/dashboard/chart-data', { params: { period } });
      const data = (result as { data?: ChartData })?.data ?? result;
      if (data && (data.designs?.length || data.views?.length || data.revenue?.length)) {
        setChartData({
          designs: data.designs ?? [],
          views: data.views ?? [],
          revenue: data.revenue ?? [],
          conversion: data.conversion ?? 0,
          conversionChange: data.conversionChange ?? 0,
        });
      } else {
        // Fallback avec données vides
        setChartData({
          designs: [],
          views: [],
          revenue: [],
          conversion: 0,
          conversionChange: 0,
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement chart data', {
        error: err,
        period,
        message: errorMessage,
      });
      setError(errorMessage);
      // Fallback avec données vides en cas d'erreur
      setChartData({
        designs: [],
        views: [],
        revenue: [],
        conversion: 0,
        conversionChange: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  return {
    chartData,
    loading,
    error,
    refresh: loadChartData,
  };
}
