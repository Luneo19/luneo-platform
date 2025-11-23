import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface AnalyticsData {
  views: { value: number; change: number };
  designs: { value: number; change: number };
  conversions: { value: number; change: number };
  revenue: { value: number; change: number };
}

interface ChartData {
  date: string;
  views: number;
  designs: number;
  conversions: number;
}

interface DeviceData {
  name: string;
  percentage: number;
  count: number;
  color: string;
}

interface TopPage {
  path: string;
  views: number;
  conversions: number;
  rate: string;
}

interface CountryData {
  name: string;
  flag: string;
  users: number;
  percentage: number;
}

interface RealtimeUser {
  time: string;
  count: number;
}

interface AnalyticsResponse {
  data: {
    overview: {
      period: {
        startDate: string;
        endDate: string;
      };
      metrics: {
        designs: { count: number; label: string };
        orders: { count: number; label: string };
        revenue: { amount: number; currency: string; label: string };
        downloads: { count: number; label: string };
        activeUsers: { count: number; label: string };
      };
    };
  };
}

export function useAnalyticsData(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    views: { value: 0, change: 0 },
    designs: { value: 0, change: 0 },
    conversions: { value: 0, change: 0 },
    revenue: { value: 0, change: 0 },
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [topCountries, setTopCountries] = useState<CountryData[]>([]);
  const [realtimeUsers, setRealtimeUsers] = useState<RealtimeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculer les dates selon la période
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const response = await fetch(
        `/api/analytics/overview?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const result = await response.json() as AnalyticsResponse;

      if (!response.ok) {
        throw new Error(result.data?.toString() || 'Erreur lors du chargement des analytics');
      }

      const metrics = result.data.overview.metrics;

      // Transformer les données
      setAnalytics({
        views: {
          value: metrics.downloads.count, // Utiliser downloads comme proxy pour views
          change: 0, // À calculer avec période précédente si nécessaire
        },
        designs: {
          value: metrics.designs.count,
          change: 0,
        },
        conversions: {
          value: metrics.orders.count,
          change: 0,
        },
        revenue: {
          value: metrics.revenue.amount,
          change: 0,
        },
      });

      // Générer chart data (simplifié - à améliorer avec vraies données quotidiennes)
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const dailyDesigns = Math.round(metrics.designs.count / days);
      const dailyOrders = Math.round(metrics.orders.count / days);
      const dailyDownloads = Math.round(metrics.downloads.count / days);

      const chartDataArray: ChartData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        chartDataArray.push({
          date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          views: dailyDownloads + Math.floor(Math.random() * 50 - 25),
          designs: Math.max(0, dailyDesigns + Math.floor(Math.random() * 5 - 2)),
          conversions: Math.max(0, dailyOrders + Math.floor(Math.random() * 3 - 1)),
        });
      }
      setChartData(chartDataArray);

      // Devices (mock pour l'instant - nécessite usage_tracking)
      setDevices([
        { name: 'Desktop', percentage: 58, count: Math.round(metrics.downloads.count * 0.58), color: 'blue' },
        { name: 'Mobile', percentage: 32, count: Math.round(metrics.downloads.count * 0.32), color: 'purple' },
        { name: 'Tablet', percentage: 10, count: Math.round(metrics.downloads.count * 0.10), color: 'pink' },
      ]);

      // Top pages (mock pour l'instant)
      setTopPages([
        { path: '/customize/t-shirt', views: Math.round(metrics.downloads.count * 0.3), conversions: Math.round(metrics.orders.count * 0.3), rate: '2.91%' },
        { path: '/customize/mug', views: Math.round(metrics.downloads.count * 0.2), conversions: Math.round(metrics.orders.count * 0.2), rate: '3.06%' },
      ]);

      // Top countries (mock pour l'instant)
      setTopCountries([
        { name: 'France', flag: '🇫🇷', users: Math.round(metrics.downloads.count * 0.45), percentage: 45 },
        { name: 'États-Unis', flag: '🇺🇸', users: Math.round(metrics.downloads.count * 0.25), percentage: 25 },
      ]);

      // Realtime users (mock)
      setRealtimeUsers([
        { time: '14:00', count: Math.floor(Math.random() * 20 + 20) },
        { time: '14:10', count: Math.floor(Math.random() * 20 + 25) },
        { time: '14:20', count: Math.floor(Math.random() * 20 + 30) },
      ]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement analytics', {
        error: err,
        timeRange,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    chartData,
    devices,
    topPages,
    topCountries,
    realtimeUsers,
    loading,
    error,
    refresh: loadAnalytics,
  };
}
