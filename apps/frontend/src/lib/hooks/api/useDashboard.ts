/**
 * ★★★ HOOK - DASHBOARD DATA (React Query) ★★★
 * Hook React Query pour récupérer les données du dashboard
 * Utilise le client API unifié avec cache intelligent
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api, endpoints } from '@/lib/api/client';
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

function getDateRange(period: '24h' | '7d' | '30d' | '90d') {
  const endDate = new Date();
  const startDate = new Date();
  if (period === '24h') startDate.setDate(startDate.getDate() - 1);
  else if (period === '7d') startDate.setDate(startDate.getDate() - 7);
  else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
  else startDate.setDate(startDate.getDate() - 90);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
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
      const data = await endpoints.analytics.overview() as Record<string, unknown>;
      const raw = (data?.data ?? data) as Record<string, unknown>;
      const overview = (raw?.overview ?? raw) as Record<string, unknown>;
      const periodData = (raw?.period ?? {}) as Record<string, unknown>;
      const recent = (raw?.recent ?? { designs: [], orders: [] }) as { designs: DashboardRecentDesign[]; orders: DashboardRecentOrder[] };
      const result: DashboardStatsResponse = {
        overview: {
          designs: Number(overview?.designs ?? overview?.totalDesigns ?? 0),
          orders: Number(overview?.orders ?? overview?.totalOrders ?? 0),
          products: Number(overview?.products ?? 0),
          collections: Number(overview?.collections ?? 0),
        },
        period: {
          designs: Number(periodData?.designs ?? 0),
          orders: Number(periodData?.orders ?? 0),
          revenue: Number(periodData?.revenue ?? 0),
          period: String(periodData?.period ?? period),
        },
        recent: Array.isArray(recent?.designs) && Array.isArray(recent?.orders)
          ? recent
          : { designs: [], orders: [] },
      };
      if (!result.overview && !result.period && !result.recent) {
        logger.warn('Dashboard stats: Invalid response structure', { data });
        throw new Error('Invalid dashboard stats response structure');
      }
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

/**
 * Usage (views + downloads) from analytics/dashboard APIs
 */
export interface DashboardUsageResponse {
  views: number;
  viewsChange: string;
  downloads: number;
  downloadsChange: string;
  designViews?: Record<string, number>;
  designLikes?: Record<string, number>;
}

export function useDashboardUsage(
  period: '24h' | '7d' | '30d' | '90d' = '7d',
  options?: Omit<UseQueryOptions<DashboardUsageResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DashboardUsageResponse>({
    queryKey: ['dashboard', 'usage', period],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange(period);
      let views = 0;
      let viewsChange = '+0%';
      let downloads = 0;
      let downloadsChange = '+0%';
      const designViews: Record<string, number> = {};
      const designLikes: Record<string, number> = {};

      try {
        type UsageApiResponse = { views?: number; totalViews?: number; viewsChange?: string; data?: unknown };
        const usageRes = await api.get<UsageApiResponse>('/api/v1/analytics/usage', {
          params: { startDate, endDate },
        }).catch(() => ({}));
        const usageRaw = usageRes && typeof usageRes === 'object' && 'data' in usageRes ? usageRes.data : usageRes;
        const usage = usageRaw as Record<string, unknown> | undefined;
        views = Number(usage?.views ?? usage?.totalViews ?? 0);
        viewsChange = typeof usage?.viewsChange === 'string' ? (usage.viewsChange as string) : '+0%';
      } catch {
        // keep defaults
      }

      try {
        type DownloadsApiResponse = { total?: number; pagination?: { total: number }; data?: { total?: number; pagination?: { total: number } } };
        const downloadsRes = await api.get<DownloadsApiResponse>('/api/v1/downloads', {
          params: { limit: 1, startDate, endDate },
        }).catch(() => ({}));
        const dlRaw = downloadsRes && typeof downloadsRes === 'object' && 'data' in downloadsRes ? downloadsRes.data : downloadsRes;
        const dlData = dlRaw as Record<string, unknown> | undefined;
        downloads = Number((dlData?.pagination as { total?: number } | undefined)?.total ?? dlData?.total ?? 0);
        downloadsChange = '+0%';
      } catch {
        // keep defaults
      }

      return {
        views,
        viewsChange,
        downloads,
        downloadsChange,
        designViews,
        designLikes,
      };
    },
    staleTime: 1000 * 60 * 5,
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
      const { startDate, endDate } = getDateRange(period);
      const data = await endpoints.analytics.revenue({ startDate, endDate }) as Record<string, unknown>;
      const raw = (data?.data ?? data) as Record<string, unknown>;
      const series = (raw?.series ?? raw?.revenueOverTime ?? raw?.designsOverTime ?? []) as Array<{ designs?: number; views?: number; revenue?: number }>;
      const designs = Array.isArray(raw?.designs) ? (raw.designs as number[]) : series.map((p) => p?.designs ?? 0);
      const views = Array.isArray(raw?.views) ? (raw.views as number[]) : series.map((p) => p?.views ?? 0);
      const revenue = Array.isArray(raw?.revenue) ? (raw.revenue as number[]) : series.map((p) => p?.revenue ?? 0);
      if (!Array.isArray(designs)) {
        logger.warn('Chart data: Invalid response structure', { data });
        throw new Error('Invalid chart data response structure');
      }
      return {
        designs: designs as number[],
        views: (views as number[]) ?? [],
        revenue: (revenue as number[]) ?? [],
        conversion: Number(raw?.conversion ?? 0),
        conversionChange: Number(raw?.conversionChange ?? 0),
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}
