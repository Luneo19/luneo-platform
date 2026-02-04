/**
 * Analytics Hooks for Dashboard
 */
import { useQuery, useMutation } from '@tanstack/react-query';

export type TimeRange = '7d' | '30d' | '90d' | 'ytd' | 'all';

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface TopEvent {
  name: string;
  count: number;
  trend: number;
}

export interface AnalyticsMetrics {
  totalViews: number;
  totalUsers: number;
  totalRevenue: number;
  totalEvents: number;
  pageViews: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  trends: {
    views: number;
    users: number;
    revenue: number;
    conversion: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchAnalyticsMetrics(period: TimeRange): Promise<AnalyticsMetrics> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/metrics?period=${period}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  } catch {
    // Return fallback data if API fails
    return {
      totalViews: 0,
      totalUsers: 0,
      totalRevenue: 0,
      totalEvents: 0,
      pageViews: 0,
      conversions: 0,
      conversionRate: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      trends: { views: 0, users: 0, revenue: 0, conversion: 0 },
    };
  }
}

async function fetchAnalyticsTimeSeries(period: TimeRange): Promise<TimeSeriesData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/timeseries?period=${period}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch time series');
    return res.json();
  } catch {
    return [];
  }
}

async function fetchTopEvents(period: TimeRange): Promise<TopEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/top-events?period=${period}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch top events');
    return res.json();
  } catch {
    return [];
  }
}

export function useAnalyticsMetrics(period: TimeRange) {
  return useQuery({
    queryKey: ['analytics', 'metrics', period],
    queryFn: () => fetchAnalyticsMetrics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAnalyticsTimeSeries(period: TimeRange) {
  return useQuery({
    queryKey: ['analytics', 'timeseries', period],
    queryFn: () => fetchAnalyticsTimeSeries(period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsTopEvents(period: TimeRange) {
  return useQuery({
    queryKey: ['analytics', 'top-events', period],
    queryFn: () => fetchTopEvents(period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExportAnalytics() {
  return useMutation({
    mutationFn: async ({ period, format }: { period: TimeRange; format: string }) => {
      const res = await fetch(`${API_BASE}/api/analytics/export?period=${period}&format=${format}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    },
  });
}
