/**
 * Hook for AR analytics data (fetch from API)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface ARDashboardAnalytics {
  totalSessions: number;
  avgDuration: number;
  conversionRate: number;
  revenue: number;
  sessionsTrend?: { date: string; count: number }[];
  platformDistribution?: { platform: string; count: number }[];
  topModels?: { id: string; name: string; sessions: number }[];
}

export interface ARProjectAnalytics {
  sessions: number;
  avgDuration: number;
  placements: number;
  conversions: number;
  sessionsOverTime?: { date: string; count: number }[];
  platformDistribution?: { platform: string; count: number }[];
}

export interface ARSessionRecord {
  id: string;
  platform: string;
  device?: string;
  duration: number;
  interactions: number;
  conversion: boolean;
  createdAt?: string;
}

export function useARAnalytics(params?: { startDate?: string; endDate?: string }) {
  const [data, setData] = useState<ARDashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await endpoints.ar.analytics.dashboard(params) as unknown as ARDashboardAnalytics;
      setData(payload ?? null);
    } catch (err) {
      logger.error('Failed to fetch AR analytics', { error: err });
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params?.startDate, params?.endDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}

export function useARProjectAnalytics(projectId: string | null, params?: { startDate?: string; endDate?: string }) {
  const [data, setData] = useState<ARProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await endpoints.ar.projects.analytics(projectId, params) as unknown as ARProjectAnalytics;
      setData(payload ?? null);
    } catch (err) {
      logger.error('Failed to fetch AR project analytics', { error: err });
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, params?.startDate, params?.endDate]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { data, loading, error, refetch: fetchProject };
}

export function useARSessionsList(params?: {
  startDate?: string;
  endDate?: string;
  platform?: string;
  projectId?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<ARSessionRecord[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await endpoints.ar.analytics.sessions(params) as { data?: ARSessionRecord[]; meta?: { total: number; page: number; limit: number } };
      setData(Array.isArray(body?.data) ? body.data : []);
      setMeta(body?.meta ?? null);
    } catch (err) {
      logger.error('Failed to fetch AR sessions', { error: err });
      setError(err instanceof Error ? err : new Error(String(err)));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [
    params?.startDate,
    params?.endDate,
    params?.platform,
    params?.projectId,
    params?.page,
    params?.limit,
  ]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, meta, loading, error, refetch: fetch };
}
