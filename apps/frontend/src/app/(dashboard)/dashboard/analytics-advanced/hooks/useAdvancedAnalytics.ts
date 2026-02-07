/**
 * Hook personnalisé pour gérer les analytics avancées
 */

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import type { TimeRange, FunnelStep, CohortData, Segment, GeographicData, BehavioralEvent } from '../types';

export function useAdvancedAnalytics(timeRange: TimeRange) {
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [behavioralEvents, setBehavioralEvents] = useState<BehavioralEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use existing analytics router if available
  const analyticsQuery = trpc.analytics.getDashboard.useQuery({
    timeRange,
  });

  useEffect(() => {
    fetchAdvancedData();
  }, [timeRange]);

  const fetchAdvancedData = async () => {
    setIsLoading(true);
    try {
      const params = { timeRange };
      const [funnel, cohort, segs, geo, events] = await Promise.all([
        api.get<{ data?: FunnelStep[]; steps?: FunnelStep[] }>('/api/v1/analytics/funnel', { params }).then((d) => d?.data ?? d?.steps ?? []),
        api.get<{ data?: CohortData[]; cohorts?: CohortData[] }>('/api/v1/analytics/cohorts', { params }).then((d) => d?.data ?? d?.cohorts ?? []),
        api.get<{ data?: Segment[]; segments?: Segment[] }>('/api/v1/analytics/segments').then((d) => d?.data ?? d?.segments ?? []),
        api.get<{ data?: GeographicData[]; countries?: GeographicData[] }>('/api/v1/analytics/geographic', { params }).then((d) => d?.data ?? d?.countries ?? []),
        api.get<{ data?: BehavioralEvent[]; events?: BehavioralEvent[] }>('/api/v1/analytics/events', { params }).then((d) => d?.data ?? d?.events ?? []),
      ]);
      setFunnelData(funnel);
      setCohortData(cohort);
      setSegments(segs);
      setGeographicData(geo);
      setBehavioralEvents(events);
    } catch (error) {
      logger.error('Failed to fetch advanced analytics', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalFunnelSteps: funnelData.length,
      totalCohorts: cohortData.length,
      totalSegments: segments.length,
      totalCountries: geographicData.length,
      totalEvents: behavioralEvents.length,
    };
  }, [funnelData, cohortData, segments, geographicData, behavioralEvents]);

  return {
    funnelData,
    cohortData,
    segments,
    geographicData,
    behavioralEvents,
    stats,
    isLoading,
    refetch: fetchAdvancedData,
  };
}



