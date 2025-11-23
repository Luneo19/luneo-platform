import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/client';

export type { AnalyticsOverview } from '@luneo/types';

/**
 * Hook to get analytics overview
 */
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => endpoints.analytics.overview(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to get design analytics
 */
export function useDesignAnalytics(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', 'designs', params],
    queryFn: () => endpoints.analytics.designs(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get order analytics
 */
export function useOrderAnalytics(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', 'orders', params],
    queryFn: () => endpoints.analytics.orders(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get revenue analytics
 */
export function useRevenueAnalytics(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', 'revenue', params],
    queryFn: () => endpoints.analytics.revenue(params),
    staleTime: 2 * 60 * 1000,
  });
}



