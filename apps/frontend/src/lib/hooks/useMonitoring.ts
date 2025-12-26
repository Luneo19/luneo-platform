import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

/**
 * Monitoring Hook - Enterprise Grade
 * Handles all monitoring data fetching and state management
 * Inspired by: Vercel Analytics, Datadog Dashboard, Linear Monitoring
 */

export interface MonitoringMetrics {
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  avgResponseTime: number;
  totalRequests24h: number;
  totalErrors24h: number;
  uniqueVisitors24h: number;
  peakRPM: number;
  services: Array<{
    name: string;
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
    latency?: number;
    lastCheck: Date;
    message?: string;
  }>;
  avgWebVitals: {
    LCP: number;
    FID: number;
    CLS: number;
    TTFB: number;
    FCP: number;
  };
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SUPPRESSED';
  title: string;
  message: string;
  service?: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
}

export interface ServiceHealth {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  latency?: number;
  lastCheck: Date;
  lastSuccess?: Date;
  failureCount: number;
  message?: string;
}

export function useMonitoring() {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/monitoring/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch monitoring data');
      }

      const dashboardData = data.data || data;

      setMetrics({
        activeUsers: dashboardData.metrics?.activeUsers || 0,
        requestsPerMinute: dashboardData.metrics?.requestsPerMinute || 0,
        errorRate: dashboardData.metrics?.errorRate || 0,
        avgResponseTime: dashboardData.metrics?.avgResponseTime || 0,
        totalRequests24h: dashboardData.metrics?.totalRequests24h || 0,
        totalErrors24h: dashboardData.metrics?.totalErrors24h || 0,
        uniqueVisitors24h: dashboardData.metrics?.uniqueVisitors24h || 0,
        peakRPM: dashboardData.metrics?.peakRPM || 0,
        services: dashboardData.metrics?.services || [],
        avgWebVitals: dashboardData.metrics?.avgWebVitals || {
          LCP: 1850,
          FID: 45,
          CLS: 0.05,
          TTFB: 320,
          FCP: 1200,
        },
      });

      setAlerts(
        (dashboardData.alerts || []).map((alert: any) => ({
          id: alert.id,
          severity: alert.severity,
          status: alert.status,
          title: alert.title,
          message: alert.message,
          service: alert.service,
          metric: alert.metric,
          threshold: alert.threshold,
          currentValue: alert.currentValue,
          timestamp: new Date(alert.createdAt || alert.timestamp),
        }))
      );

      setServices(
        (dashboardData.services || []).map((service: any) => ({
          service: service.name || service.service,
          status: service.status,
          latency: service.latency,
          lastCheck: new Date(service.lastCheck),
          lastSuccess: service.lastSuccess ? new Date(service.lastSuccess) : undefined,
          failureCount: service.failureCount || 0,
          message: service.message,
        }))
      );

      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error fetching monitoring data', { error: err });
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to acknowledge alert');
        }

        await fetchDashboard();
        toast({
          title: 'Alerte acquittée',
          description: 'L\'alerte a été marquée comme acquittée',
        });
      } catch (err) {
        logger.error('Error acknowledging alert', { error: err });
        toast({
          title: 'Erreur',
          description: 'Impossible d\'acquitter l\'alerte',
          variant: 'destructive',
        });
      }
    },
    [fetchDashboard, toast]
  );

  const resolveAlert = useCallback(
    async (alertId: string, reason?: string) => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to resolve alert');
        }

        await fetchDashboard();
        toast({
          title: 'Alerte résolue',
          description: 'L\'alerte a été marquée comme résolue',
        });
      } catch (err) {
        logger.error('Error resolving alert', { error: err });
        toast({
          title: 'Erreur',
          description: 'Impossible de résoudre l\'alerte',
          variant: 'destructive',
        });
      }
    },
    [fetchDashboard, toast]
  );

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const criticalAlerts = useMemo(
    () => alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE'),
    [alerts]
  );

  const warningAlerts = useMemo(
    () => alerts.filter((a) => a.severity === 'WARNING' && a.status === 'ACTIVE'),
    [alerts]
  );

  const overallHealth = useMemo(() => {
    if (services.length === 0) return 'UNKNOWN';
    const unhealthy = services.filter((s) => s.status === 'UNHEALTHY').length;
    const degraded = services.filter((s) => s.status === 'DEGRADED').length;

    if (unhealthy > 0 || criticalAlerts.length > 0) return 'UNHEALTHY';
    if (degraded > 0 || warningAlerts.length > 0) return 'DEGRADED';
    return 'HEALTHY';
  }, [services, criticalAlerts, warningAlerts]);

  return {
    metrics,
    alerts,
    services,
    loading,
    error,
    lastRefresh,
    criticalAlerts,
    warningAlerts,
    overallHealth,
    refresh: fetchDashboard,
    acknowledgeAlert,
    resolveAlert,
  };
}

