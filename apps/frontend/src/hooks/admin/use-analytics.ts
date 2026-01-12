/**
 * ★★★ USE ANALYTICS HOOK ★★★
 * Hook SWR pour récupérer les données analytics
 */

import useSWR from 'swr';

export interface UseAnalyticsOptions {
  period?: number; // jours
  startDate?: string;
  endDate?: string;
  metric?: string;
}

export interface AnalyticsOverview {
  revenue: {
    mrr: number;
    arr: number;
    growth: number;
    growthPercent: number;
  };
  customers: {
    total: number;
    new: number;
    churned: number;
    active: number;
  };
  churn: {
    rate: number;
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  ltv: {
    average: number;
    median: number;
    projected: number;
  };
  acquisition: {
    total: number;
    byChannel: Record<string, { count: number; cost: number; revenue: number }>;
  };
}

export interface CohortData {
  cohort: string; // YYYY-MM
  customers: number;
  retention: Record<string, number>; // month -> retention %
}

export interface FunnelData {
  stage: string;
  count: number;
  conversion: number; // %
  dropoff: number; // %
}

async function fetcher(url: string) {
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // @ts-ignore
    error.info = await response.json();
    // @ts-ignore
    error.status = response.status;
    throw error;
  }
  
  return response.json();
}

export function useAnalyticsOverview(options: UseAnalyticsOptions = {}) {
  const { period = 30 } = options;
  const queryParams = new URLSearchParams();
  queryParams.set('period', String(period));
  if (options.startDate) queryParams.set('startDate', options.startDate);
  if (options.endDate) queryParams.set('endDate', options.endDate);

  const { data, error, isLoading, mutate } = useSWR<AnalyticsOverview>(
    `/api/admin/analytics/overview?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Refresh toutes les minutes
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

export function useCohortAnalysis(options: UseAnalyticsOptions = {}) {
  const { period = 365 } = options;
  const queryParams = new URLSearchParams();
  queryParams.set('period', String(period));

  const { data, error, isLoading, mutate } = useSWR<CohortData[]>(
    `/api/admin/analytics/cohort?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    cohorts: data || [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

export function useFunnelAnalysis(options: UseAnalyticsOptions = {}) {
  const { period = 30 } = options;
  const queryParams = new URLSearchParams();
  queryParams.set('period', String(period));

  const { data, error, isLoading, mutate } = useSWR<FunnelData[]>(
    `/api/admin/analytics/funnel?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    funnel: data || [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
