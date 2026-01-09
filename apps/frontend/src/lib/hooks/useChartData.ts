import { useState, useEffect, useCallback } from 'react';
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

      const response = await fetch(`/api/dashboard/chart-data?period=${period}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Gérer le format ApiResponseBuilder
      const data = result.success === true ? result.data : result;
      
      if (data && (data.designs || data.views || data.revenue)) {
        setChartData(data);
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
