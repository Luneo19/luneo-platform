/**
 * ★★★ HOOK - DASHBOARD DATA (React Query) ★★★
 * Hook React Query pour récupérer les données du dashboard
 * Utilise le client API unifié avec cache intelligent
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

// Types pour les données dashboard
interface DashboardOverview {
  designs: number;
  orders: number;
  products: number;
  collections: number;
}

interface DashboardPeriod {
  designs: number;
  orders: number;
  revenue: number;
  period: string;
}

interface DashboardRecentDesign {
  id: string;
  prompt?: string;
  preview_url?: string;
  created_at: string;
  status?: string;
}

interface DashboardRecentOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface DashboardStatsResponse {
  overview: DashboardOverview;
  period: DashboardPeriod;
  recent: {
    designs: DashboardRecentDesign[];
    orders: DashboardRecentOrder[];
  };
}

/**
 * Hook pour récupérer les stats du dashboard
 * @param period - Période (24h, 7d, 30d, 90d)
 * @param options - Options React Query
 */
export function useDashboardStats(
  period: '24h' | '7d' | '30d' | '90d' = '7d',
  options?: Omit<UseQueryOptions<DashboardStatsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DashboardStatsResponse>({
    queryKey: ['dashboard', 'stats', period],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?period=${period}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Dashboard stats failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Gérer le format ApiResponseBuilder ou réponse directe
      const data = result.success === true ? result.data : result;
      
      // Validation structure minimale
      if (!data || (!data.overview && !data.period && !data.recent)) {
        logger.warn('Dashboard stats: Invalid response structure', { data });
        throw new Error('Invalid dashboard stats response structure');
      }

      return data as DashboardStatsResponse;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

/**
 * Hook pour récupérer les données de graphiques du dashboard
 */
interface ChartDataResponse {
  designs: number[];
  views: number[];
  revenue: number[];
  conversion: number;
  conversionChange: number;
}

export function useDashboardChartData(
  period: '24h' | '7d' | '30d' | '90d' = '7d',
  options?: Omit<UseQueryOptions<ChartDataResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ChartDataResponse>({
    queryKey: ['dashboard', 'chart-data', period],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/chart-data?period=${period}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Chart data failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Gérer le format ApiResponseBuilder ou réponse directe
      const data = result.success === true ? result.data : result;

      // Validation structure minimale
      if (!data || !Array.isArray(data.designs)) {
        logger.warn('Chart data: Invalid response structure', { data });
        throw new Error('Invalid chart data response structure');
      }

      return {
        designs: data.designs || [],
        views: data.views || [],
        revenue: data.revenue || [],
        conversion: data.conversion || 0,
        conversionChange: data.conversionChange || 0,
      } as ChartDataResponse;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}
