/**
 * Hook personnalisé pour gérer les analytics avancées
 */

import { useState, useEffect, useMemo } from 'react';
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
      // Fetch funnel data
      const funnelResponse = await fetch(`/api/analytics/funnel?timeRange=${timeRange}`);
      if (funnelResponse.ok) {
        const funnel = await funnelResponse.json();
        setFunnelData(funnel.data || funnel.steps || []);
      }

      // Fetch cohort data
      const cohortResponse = await fetch(`/api/analytics/cohorts?timeRange=${timeRange}`);
      if (cohortResponse.ok) {
        const cohort = await cohortResponse.json();
        setCohortData(cohort.data || cohort.cohorts || []);
      }

      // Fetch segments
      const segmentsResponse = await fetch('/api/analytics/segments');
      if (segmentsResponse.ok) {
        const segs = await segmentsResponse.json();
        setSegments(segs.data || segs.segments || []);
      }

      // Fetch geographic data
      const geoResponse = await fetch(`/api/analytics/geographic?timeRange=${timeRange}`);
      if (geoResponse.ok) {
        const geo = await geoResponse.json();
        setGeographicData(geo.data || geo.countries || []);
      }

      // Fetch behavioral events
      const eventsResponse = await fetch(`/api/analytics/events?timeRange=${timeRange}`);
      if (eventsResponse.ok) {
        const events = await eventsResponse.json();
        setBehavioralEvents(events.data || events.events || []);
      }
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


