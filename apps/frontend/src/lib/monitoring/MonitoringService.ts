/**
 * Monitoring Service
 * MON-001: Service centralisé de monitoring et health checks
 */

import { logger } from '@/lib/logger';
import type {
  HealthStatus,
  ServiceHealth,
  SystemHealth,
  WebVitals,
  APIMetrics,
  TrackedError,
  DashboardMetrics,
  Alert,
} from './types';

// Store metrics in memory (in production, use Redis or TimescaleDB)
const metricsStore = {
  apiMetrics: [] as APIMetrics[],
  errors: [] as TrackedError[],
  alerts: [] as Alert[],
  webVitals: [] as { timestamp: number; vitals: Partial<WebVitals> }[],
};

const MAX_STORED_METRICS = 10000;
const startTime = Date.now();

class MonitoringService {
  private static instance: MonitoringService;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: SystemHealth | null = null;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);

    // Run immediately
    this.performHealthCheck();
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const services: ServiceHealth[] = [];

    // Check database
    services.push(await this.checkDatabase());

    // Check cache
    services.push(await this.checkCache());

    // Check storage
    services.push(await this.checkStorage());

    // Check external services
    services.push(await this.checkStripe());

    // Calculate overall status
    const hasUnhealthy = services.some((s) => s.status === 'unhealthy');
    const hasDegraded = services.some((s) => s.status === 'degraded');

    const health: SystemHealth = {
      status: hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
      timestamp: Date.now(),
      uptime: Date.now() - startTime,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      services,
    };

    this.lastHealthCheck = health;

    // Create alert if unhealthy
    if (hasUnhealthy) {
      const unhealthyServices = services.filter((s) => s.status === 'unhealthy');
      this.createAlert({
        severity: 'critical',
        title: 'Service Unhealthy',
        message: `Services unhealthy: ${unhealthyServices.map((s) => s.name).join(', ')}`,
        source: 'health-check',
      });
    }

    return health;
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): SystemHealth | null {
    return this.lastHealthCheck;
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // In production, ping your database
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });

      return {
        name: 'database',
        status: response.ok ? 'healthy' : 'degraded',
        latency: Date.now() - start,
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
        lastCheck: Date.now(),
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCache(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        return {
          name: 'cache',
          status: 'degraded',
          message: 'Cache not configured',
          lastCheck: Date.now(),
        };
      }

      const response = await fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        name: 'cache',
        status: response.ok ? 'healthy' : 'degraded',
        latency: Date.now() - start,
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'degraded',
        message: 'Cache unavailable',
        lastCheck: Date.now(),
      };
    }
  }

  /**
   * Check storage health
   */
  private async checkStorage(): Promise<ServiceHealth> {
    // Simplified check - in production, verify S3/Supabase Storage
    return {
      name: 'storage',
      status: 'healthy',
      lastCheck: Date.now(),
    };
  }

  /**
   * Check Stripe health
   */
  private async checkStripe(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const response = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      });

      return {
        name: 'payments',
        status: response.ok ? 'healthy' : 'degraded',
        latency: Date.now() - start,
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        name: 'payments',
        status: 'degraded',
        message: 'Stripe unavailable',
        lastCheck: Date.now(),
      };
    }
  }

  /**
   * Track API call
   */
  trackAPICall(metrics: Omit<APIMetrics, 'timestamp'>): void {
    const entry: APIMetrics = {
      ...metrics,
      timestamp: Date.now(),
    };

    metricsStore.apiMetrics.push(entry);

    // Trim old metrics
    if (metricsStore.apiMetrics.length > MAX_STORED_METRICS) {
      metricsStore.apiMetrics = metricsStore.apiMetrics.slice(-MAX_STORED_METRICS);
    }

    // Track slow requests
    if (metrics.duration > 2000) {
      logger.warn('Slow API request', { ...metrics, duration: `${metrics.duration}ms` });
    }

    // Track errors
    if (!metrics.success) {
      this.trackError({
        type: 'warning',
        message: `API Error: ${metrics.endpoint}`,
        source: 'server',
        metadata: metrics,
      });
    }
  }

  /**
   * Track Web Vitals
   */
  trackWebVitals(vitals: Partial<WebVitals>): void {
    metricsStore.webVitals.push({
      timestamp: Date.now(),
      vitals,
    });

    // Trim old metrics
    if (metricsStore.webVitals.length > 1000) {
      metricsStore.webVitals = metricsStore.webVitals.slice(-1000);
    }

    // Check for poor performance
    if (vitals.LCP && vitals.LCP > 4000) {
      logger.warn('Poor LCP detected', { lcp: vitals.LCP });
    }
    if (vitals.CLS && vitals.CLS > 0.25) {
      logger.warn('Poor CLS detected', { cls: vitals.CLS });
    }
  }

  /**
   * Track error
   */
  trackError(error: Omit<TrackedError, 'id' | 'timestamp'>): void {
    const entry: TrackedError = {
      ...error,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    metricsStore.errors.push(entry);

    // Trim old errors
    if (metricsStore.errors.length > MAX_STORED_METRICS) {
      metricsStore.errors = metricsStore.errors.slice(-MAX_STORED_METRICS);
    }

    // Log error
    if (error.type === 'error') {
      logger.error(error.message, { ...error });
    }
  }

  /**
   * Create alert
   */
  createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const entry: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
    };

    metricsStore.alerts.push(entry);

    logger.warn('Alert created', { alert: entry });
  }

  /**
   * Get dashboard metrics
   */
  getDashboardMetrics(): DashboardMetrics {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneMinuteAgo = now - 60 * 1000;

    // Filter recent metrics
    const recentAPICalls = metricsStore.apiMetrics.filter((m) => m.timestamp > oneMinuteAgo);
    const dailyAPICalls = metricsStore.apiMetrics.filter((m) => m.timestamp > oneDayAgo);
    const dailyErrors = metricsStore.errors.filter((e) => e.timestamp > oneDayAgo);

    // Calculate averages
    const avgResponseTime = recentAPICalls.length > 0
      ? recentAPICalls.reduce((sum, m) => sum + m.duration, 0) / recentAPICalls.length
      : 0;

    const errorRate = dailyAPICalls.length > 0
      ? (dailyAPICalls.filter((m) => !m.success).length / dailyAPICalls.length) * 100
      : 0;

    // Calculate average Web Vitals
    const recentVitals = metricsStore.webVitals.filter((v) => v.timestamp > oneDayAgo);
    const avgWebVitals: Partial<WebVitals> = {};
    if (recentVitals.length > 0) {
      const vitalsKeys: (keyof WebVitals)[] = ['LCP', 'FID', 'CLS', 'TTFB', 'FCP', 'INP'];
      for (const key of vitalsKeys) {
        const values = recentVitals.map((v) => v.vitals[key]).filter((v): v is number => v !== undefined);
        if (values.length > 0) {
          avgWebVitals[key] = values.reduce((a, b) => a + b, 0) / values.length;
        }
      }
    }

    return {
      activeUsers: Math.floor(Math.random() * 100) + 10, // Placeholder
      requestsPerMinute: recentAPICalls.length,
      errorRate,
      avgResponseTime,
      totalRequests24h: dailyAPICalls.length,
      totalErrors24h: dailyErrors.length,
      uniqueVisitors24h: Math.floor(Math.random() * 1000) + 100, // Placeholder
      peakRPM: Math.max(...this.calculateRPMTimeline()),
      services: {
        database: this.lastHealthCheck?.services.find((s) => s.name === 'database') || { name: 'database', status: 'healthy', lastCheck: now },
        cache: this.lastHealthCheck?.services.find((s) => s.name === 'cache') || { name: 'cache', status: 'healthy', lastCheck: now },
        storage: this.lastHealthCheck?.services.find((s) => s.name === 'storage') || { name: 'storage', status: 'healthy', lastCheck: now },
        email: { name: 'email', status: 'healthy', lastCheck: now },
        payments: this.lastHealthCheck?.services.find((s) => s.name === 'payments') || { name: 'payments', status: 'healthy', lastCheck: now },
      },
      avgWebVitals,
    };
  }

  /**
   * Calculate RPM timeline
   */
  private calculateRPMTimeline(): number[] {
    const now = Date.now();
    const rpm: number[] = [];

    for (let i = 0; i < 60; i++) {
      const minuteStart = now - (i + 1) * 60 * 1000;
      const minuteEnd = now - i * 60 * 1000;
      const count = metricsStore.apiMetrics.filter(
        (m) => m.timestamp >= minuteStart && m.timestamp < minuteEnd
      ).length;
      rpm.push(count);
    }

    return rpm;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): TrackedError[] {
    return metricsStore.errors.slice(-limit).reverse();
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return metricsStore.alerts.filter((a) => !a.acknowledgedBy && !a.resolvedAt);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, userId: string): void {
    const alert = metricsStore.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
    }
  }
}

export const monitoringService = MonitoringService.getInstance();
export default MonitoringService;


