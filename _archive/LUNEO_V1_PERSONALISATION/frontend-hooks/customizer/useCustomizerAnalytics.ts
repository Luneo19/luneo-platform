/**
 * useCustomizerAnalytics
 * Analytics data hook (admin)
 * Provides overview, session data, tool usage, and conversion funnel
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface AnalyticsOverview {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalDesigns: number;
  totalExports: number;
  averageSessionDuration: number;
  conversionRate: number;
}

interface SessionData {
  date: string;
  sessions: number;
  completed: number;
  exported: number;
}

interface ToolUsage {
  tool: string;
  count: number;
  percentage: number;
}

interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
}

interface UseCustomizerAnalyticsReturn {
  overview: AnalyticsOverview | null;
  sessionData: SessionData[];
  toolUsage: ToolUsage[];
  conversionFunnel: ConversionFunnel[];
  isLoading: boolean;
  error: Error | null;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  refetch: () => void;
}

/**
 * Customizer analytics hook (admin)
 */
export function useCustomizerAnalytics(customizerId?: string): UseCustomizerAnalyticsReturn {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, unknown> = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      if (customizerId) {
        params.customizerId = customizerId;
      }

      const result = await api.get<{
        overview: AnalyticsOverview;
        sessionData: SessionData[];
        toolUsage: ToolUsage[];
        conversionFunnel: ConversionFunnel[];
      }>('/api/v1/visual-customizer/analytics', { params });

      setOverview(result.overview || null);
      setSessionData(result.sessionData || []);
      setToolUsage(result.toolUsage || []);
      setConversionFunnel(result.conversionFunnel || []);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch analytics');
      setError(errorObj);
      logger.error('useCustomizerAnalytics: fetchAnalytics failed', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, [customizerId, dateRange]);

  // Fetch on mount and when dateRange changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSetDateRange = useCallback(
    (range: DateRange) => {
      setDateRange(range);
      fetchAnalytics();
    },
    [fetchAnalytics]
  );

  return {
    overview,
    sessionData,
    toolUsage,
    conversionFunnel,
    isLoading,
    error,
    dateRange,
    setDateRange: handleSetDateRange,
    refetch: fetchAnalytics,
  };
}
