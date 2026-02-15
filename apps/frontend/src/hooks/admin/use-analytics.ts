/**
 * ★★★ USE ANALYTICS HOOK ★★★
 * Hook SWR pour récupérer les données analytics
 *
 * Coexistence: This admin area uses SWR for simple GET + cache; the rest of the app
 * uses React Query (@tanstack/react-query). Both can coexist. Consider migrating to
 * React Query later for consistency if desired.
 */

import useSWR from 'swr';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

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

/** Error thrown by fetcher with API response details */
export class FetcherError extends Error {
  info?: unknown;
  status?: number;
  constructor(message: string, options?: { info?: unknown; status?: number }) {
    super(message);
    this.name = 'FetcherError';
    this.info = options?.info;
    this.status = options?.status;
  }
}

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
