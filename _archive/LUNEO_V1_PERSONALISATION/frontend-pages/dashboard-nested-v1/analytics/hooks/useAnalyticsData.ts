/**
 * Hook personnalisé pour récupérer les données analytics
 */

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { TimeRange, AnalyticsMetric } from '../types';
import { METRIC_TYPES } from '../constants/analytics';

export function useAnalyticsData(
  timeRange: TimeRange,
  compare: boolean,
  selectedMetrics: Set<string>,
  customDateFrom?: string,
  customDateTo?: string
) {
  // Convertir Set en Array de manière stable pour éviter les re-renders
  const metricsArray = useMemo(() => Array.from(selectedMetrics), [selectedMetrics]);
  
  // Options de query avec cache et staleTime optimisés
  const analyticsQuery = trpc.analytics.getDashboard.useQuery(
    {
      timeRange,
      compare,
      metrics: metricsArray,
      dateFrom: timeRange === 'custom' ? customDateFrom : undefined,
      dateTo: timeRange === 'custom' ? customDateTo : undefined,
    },
    {
      // Cache les données pendant 30 secondes
      staleTime: 30000,
      // Garde les données en cache pendant 5 minutes
      gcTime: 300000,
      // Retry automatique en cas d'erreur
      retry: 2,
      // Refetch on window focus désactivé pour les analytics (évite trop de requêtes)
      refetchOnWindowFocus: false,
    }
  );

  const metrics = useMemo<AnalyticsMetric[]>(() => {
    const data = analyticsQuery.data;
    if (!data) return [];

    return METRIC_TYPES.map((type) => {
      let value = 0;
      let change = 0;

      switch (type.value) {
        case 'revenue':
          value = data.revenue;
          change = data.revenueChange;
          break;
        case 'orders':
          value = data.orders;
          change = data.ordersChange;
          break;
        case 'users':
          value = data.users;
          change = data.usersChange;
          break;
        case 'conversions':
          value = data.conversions;
          change = data.conversionsChange;
          break;
        case 'avgOrderValue':
          value = data.avgOrderValue;
          change = data.avgOrderValueChange;
          break;
        case 'conversionRate':
          value = data.conversionRate;
          change = data.conversionRateChange;
          break;
      }

      return {
        id: type.value,
        name: type.label,
        value,
        change,
        changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
        format: type.value === 'revenue' || type.value === 'avgOrderValue' ? 'currency' : type.value === 'conversionRate' ? 'percentage' : 'number',
        icon: type.icon,
        color: type.color,
      };
    });
  }, [analyticsQuery.data]);

  return {
    data: analyticsQuery.data,
    metrics,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
    refetch: analyticsQuery.refetch,
  };
}



