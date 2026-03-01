'use client';

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

export interface UnifiedScorecardMetric {
  key: string;
  label: string;
  value: number;
  target: number;
  score: number;
  provenance: 'estimated' | 'observed';
  source: string;
}

export interface UnifiedScorecard {
  period: { from: string; to: string; quarter: string };
  totals: { weightedScore: number; health: 'critical' | 'at_risk' | 'on_track' | 'outperforming' };
  metrics: UnifiedScorecardMetric[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchAnalyticsMetrics(period: TimeRange): Promise<AnalyticsMetrics> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/analytics-clean/metrics?period=${period}`, {
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
    const res = await fetch(`${API_BASE}/api/v1/analytics-clean/time-series?period=${period}`, {
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
    const res = await fetch(`${API_BASE}/api/v1/analytics-clean/top-events?period=${period}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch top events');
    return res.json();
  } catch {
    return [];
  }
}

function resolveDateRange(period: TimeRange): { from?: string; to?: string } {
  const to = new Date();
  const from = new Date(to);
  if (period === '7d') from.setDate(to.getDate() - 7);
  else if (period === '30d') from.setDate(to.getDate() - 30);
  else if (period === '90d') from.setDate(to.getDate() - 90);
  else if (period === 'ytd') from.setMonth(0, 1);
  else return {};
  return { from: from.toISOString(), to: to.toISOString() };
}

async function fetchUnifiedScorecard(period: TimeRange): Promise<UnifiedScorecard | null> {
  try {
    const range = resolveDateRange(period);
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    const res = await fetch(`${API_BASE}/api/v1/agent-analytics/scorecard?${params.toString()}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch unified scorecard');
    return res.json();
  } catch {
    return null;
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

export function useUnifiedScorecard(period: TimeRange) {
  return useQuery({
    queryKey: ['analytics', 'scorecard', period],
    queryFn: () => fetchUnifiedScorecard(period),
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
