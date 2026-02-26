/**
 * ★★★ USE ADMIN OVERVIEW HOOK ★★★
 * Hook SWR pour récupérer les données du dashboard admin overview
 * Auto-refresh et gestion d'erreurs
 *
 * Coexistence: This admin area uses SWR for simple GET + cache; the rest of the app
 * uses React Query (@tanstack/react-query). Both can coexist. Consider migrating to
 * React Query later for consistency if desired.
 */

import useSWR from 'swr';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

/** Error thrown by fetcher with API response details */
class FetcherError extends Error {
  info?: unknown;
  status?: number;
  constructor(message: string, options?: { info?: unknown; status?: number }) {
    super(message);
    this.name = 'FetcherError';
    this.info = options?.info;
    this.status = options?.status;
  }
}

/**
 * Fetcher with 10s timeout to prevent hanging
 */
async function fetcher(url: string) {
  const response = await fetchWithTimeout(url, {
    credentials: 'include',
    timeout: 10000,
  });

  if (!response.ok) {
    const info = await response.json().catch(() => ({}));
    throw new FetcherError('An error occurred while fetching the data.', {
      info,
      status: response.status,
    });
  }

  const data = await response.json();
  return data ?? null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asTrend(value: unknown): 'up' | 'down' | 'neutral' {
  return value === 'up' || value === 'down' || value === 'neutral' ? value : 'neutral';
}

function normalizeOverview(data: unknown): AdminOverviewData {
  const raw = (data ?? {}) as Record<string, unknown>;
  const rawKpis = (raw.kpis ?? {}) as Record<string, unknown>;
  const mrr = (rawKpis.mrr ?? {}) as Record<string, unknown>;
  const customers = (rawKpis.customers ?? {}) as Record<string, unknown>;
  const churnRate = (rawKpis.churnRate ?? {}) as Record<string, unknown>;
  const ltv = (rawKpis.ltv ?? {}) as Record<string, unknown>;

  const revenueChart = Array.isArray(raw.revenueChart) ? raw.revenueChart : [];
  const recentActivity = Array.isArray(raw.recentActivity) ? raw.recentActivity : [];
  const recentCustomers = Array.isArray(raw.recentCustomers) ? raw.recentCustomers : [];
  const planDistribution = Array.isArray(raw.planDistribution) ? raw.planDistribution : [];
  const acquisitionChannels = Array.isArray(raw.acquisitionChannels) ? raw.acquisitionChannels : [];

  return {
    kpis: {
      mrr: {
        value: asNumber(mrr.value),
        change: asNumber(mrr.change),
        changePercent: asNumber(mrr.changePercent),
        trend: asTrend(mrr.trend),
      },
      customers: {
        value: asNumber(customers.value),
        new: asNumber(customers.new),
        trend: asTrend(customers.trend),
      },
      churnRate: {
        value: asNumber(churnRate.value),
        change: asNumber(churnRate.change),
        trend: asTrend(churnRate.trend),
      },
      ltv: {
        value: asNumber(ltv.value),
        projected: asNumber(ltv.projected),
        trend: asTrend(ltv.trend),
      },
    },
    revenue: {
      mrr: asNumber((raw.revenue as Record<string, unknown> | undefined)?.mrr),
      arr: asNumber((raw.revenue as Record<string, unknown> | undefined)?.arr),
      mrrGrowth: asNumber((raw.revenue as Record<string, unknown> | undefined)?.mrrGrowth),
      mrrGrowthPercent: asNumber((raw.revenue as Record<string, unknown> | undefined)?.mrrGrowthPercent),
      totalRevenue: asNumber((raw.revenue as Record<string, unknown> | undefined)?.totalRevenue),
      avgRevenuePerUser: asNumber((raw.revenue as Record<string, unknown> | undefined)?.avgRevenuePerUser),
    },
    churn: {
      rate: asNumber((raw.churn as Record<string, unknown> | undefined)?.rate),
      count: asNumber((raw.churn as Record<string, unknown> | undefined)?.count),
      revenueChurn: asNumber((raw.churn as Record<string, unknown> | undefined)?.revenueChurn),
      netRevenueRetention: asNumber((raw.churn as Record<string, unknown> | undefined)?.netRevenueRetention),
    },
    ltv: {
      average: asNumber((raw.ltv as Record<string, unknown> | undefined)?.average),
      median: asNumber((raw.ltv as Record<string, unknown> | undefined)?.median),
      byPlan: ((raw.ltv as Record<string, unknown> | undefined)?.byPlan as Record<string, number>) ?? {},
      projected: asNumber((raw.ltv as Record<string, unknown> | undefined)?.projected),
    },
    acquisition: {
      cac: asNumber((raw.acquisition as Record<string, unknown> | undefined)?.cac),
      paybackPeriod: asNumber((raw.acquisition as Record<string, unknown> | undefined)?.paybackPeriod),
      ltvCacRatio: asNumber((raw.acquisition as Record<string, unknown> | undefined)?.ltvCacRatio),
      byChannel: ((raw.acquisition as Record<string, unknown> | undefined)?.byChannel as Record<string, { count: number; cac: number }>) ?? {},
    },
    recentActivity: recentActivity as AdminOverviewData['recentActivity'],
    recentCustomers: recentCustomers as AdminOverviewData['recentCustomers'],
    revenueChart: revenueChart as AdminOverviewData['revenueChart'],
    planDistribution: planDistribution as AdminOverviewData['planDistribution'],
    acquisitionChannels: acquisitionChannels as AdminOverviewData['acquisitionChannels'],
  };
}

export interface UseAdminOverviewOptions {
  period?: number; // jours (défaut: 30)
}

export interface AdminOverviewData {
  kpis: {
    mrr: {
      value: number;
      change: number;
      changePercent: number;
      trend: 'up' | 'down' | 'neutral';
    };
    customers: {
      value: number;
      new: number;
      trend: 'up' | 'down' | 'neutral';
    };
    churnRate: {
      value: number;
      change: number;
      trend: 'up' | 'down' | 'neutral';
    };
    ltv: {
      value: number;
      projected: number;
      trend: 'up' | 'down' | 'neutral';
    };
  };
  revenue: {
    mrr: number;
    arr: number;
    mrrGrowth: number;
    mrrGrowthPercent: number;
    totalRevenue: number;
    avgRevenuePerUser: number;
  };
  churn: {
    rate: number;
    count: number;
    revenueChurn: number;
    netRevenueRetention: number;
  };
  ltv: {
    average: number;
    median: number;
    byPlan: Record<string, number>;
    projected: number;
  };
  acquisition: {
    cac: number;
    paybackPeriod: number;
    ltvCacRatio: number;
    byChannel: Record<string, { count: number; cac: number }>;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    customerName?: string;
    customerEmail?: string;
    timestamp: Date | string;
    metadata?: Record<string, unknown>;
  }>;
  recentCustomers: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    plan: string | null;
    mrr: number;
    ltv: number;
    status: 'active' | 'trial' | 'churned' | 'at-risk';
    customerSince: Date | string;
  }>;
  revenueChart: Array<{
    date: string;
    mrr: number;
    revenue: number;
    newCustomers: number;
  }>;
  planDistribution: Array<{
    name: string;
    count: number;
    mrr: number;
  }>;
  acquisitionChannels: Array<{
    channel: string;
    count: number;
    cac: number;
  }>;
}

export function useAdminOverview(options: UseAdminOverviewOptions = {}) {
  const { period = 30 } = options;

  const { data, error, isLoading, mutate } = useSWR<AdminOverviewData>(
    `/api/admin/analytics/overview?period=${period}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh toutes les minutes
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data: normalizeOverview(data),
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
