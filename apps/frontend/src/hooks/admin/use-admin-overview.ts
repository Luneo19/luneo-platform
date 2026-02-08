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
 * Fetcher simple pour SWR
 */
async function fetcher(url: string) {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new FetcherError('An error occurred while fetching the data.', {
      info: await response.json(),
      status: response.status,
    });
  }

  return response.json();
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
    metadata?: Record<string, any>;
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
    data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
