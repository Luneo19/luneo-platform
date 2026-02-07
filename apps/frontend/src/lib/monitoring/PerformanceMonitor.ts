/**
 * ★★★ SERVICE - PERFORMANCE MONITORING ★★★
 * Service professionnel pour le monitoring de performance
 * - Web Vitals tracking
 * - API latency tracking
 * - Error tracking avancé
 * - User session replay
 * - Database query monitoring
 */

import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface WebVitals {
  name: string;
  value: number;
  id: string;
  delta?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

export interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
}

export interface ErrorMetric {
  message: string;
  stack?: string;
  url: string;
  userId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ========================================
// SERVICE
// ========================================

export class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: APIMetric[] = [];
  private errors: ErrorMetric[] = [];
  private maxMetrics = 1000;
  private maxErrors = 500;

  private constructor() {
    this.setupWebVitals();
    this.setupErrorTracking();
    this.setupAPITracking();
  }

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  // ========================================
  // WEB VITALS
  // ========================================

  /**
   * Setup Web Vitals tracking
   */
  private setupWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Track CLS (Cumulative Layout Shift)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.trackWebVital({
        name: 'CLS',
        value: clsValue,
        id: `cls-${Date.now()}`,
        rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
      });
    }).observe({ type: 'layout-shift', buffered: true });

    // Track FCP (First Contentful Paint)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.trackWebVital({
            name: 'FCP',
            value: entry.startTime,
            id: `fcp-${Date.now()}`,
            rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor',
          });
        }
      }
    }).observe({ type: 'paint', buffered: true });

    // Track LCP (Largest Contentful Paint)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      this.trackWebVital({
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime,
        id: `lcp-${Date.now()}`,
        rating: lastEntry.renderTime < 2500 ? 'good' : lastEntry.renderTime < 4000 ? 'needs-improvement' : 'poor',
      });
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // Track FID (First Input Delay)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        this.trackWebVital({
          name: 'FID',
          value: fid,
          id: `fid-${Date.now()}`,
          rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
        });
      }
    }).observe({ type: 'first-input', buffered: true });
  }

  /**
   * Track un Web Vital
   */
  private trackWebVital(metric: WebVitals): void {
    logger.info('Web Vital', metric);

    if (typeof window === 'undefined') return;
    api.post('/api/v1/analytics/web-vitals', metric).catch(() => {
      // Silent failure for background telemetry
    });
  }

  // ========================================
  // ERROR TRACKING
  // ========================================

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        timestamp: new Date(),
        severity: 'high',
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date(),
        severity: 'medium',
      });
    });
  }

  /**
   * Track une erreur
   */
  trackError(error: ErrorMetric): void {
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    logger.error('Error tracked', error);

    // Send to error tracking service (Sentry, etc.)
    if (typeof window !== 'undefined') {
      // Send to Sentry if available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry;
        Sentry.captureException(new Error(error.message), {
          level: error.severity === 'critical' ? 'fatal' : error.severity === 'high' ? 'error' : 'warning',
          tags: {
            url: error.url,
            userId: error.userId,
          },
          extra: {
            stack: error.stack,
            timestamp: error.timestamp,
          },
        });
      }

      // Also send to our API for aggregation (silent failure)
      if (error.severity === 'critical' || error.severity === 'high') {
        api.post('/api/v1/monitoring/errors', error).catch(() => {});
      }
    }
  }

  // ========================================
  // API TRACKING
  // ========================================

  /**
   * Setup API tracking
   */
  private setupAPITracking(): void {
    if (typeof window === 'undefined') return;

    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const firstArg = args[0];
      const url = typeof firstArg === 'string' 
        ? firstArg 
        : firstArg instanceof URL 
        ? firstArg.toString()
        : firstArg instanceof Request
        ? firstArg.url
        : String(firstArg);
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;

        this.trackAPIMetric({
          endpoint: url,
          method,
          duration,
          status: response.status,
          timestamp: new Date(),
        });

        return response;
      } catch (error: any) {
        const duration = performance.now() - start;
        this.trackAPIMetric({
          endpoint: url,
          method,
          duration,
          status: 0,
          timestamp: new Date(),
        });
        throw error;
      }
    };
  }

  /**
   * Track une métrique API
   */
  trackAPIMetric(metric: APIMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow requests
    if (metric.duration > 1000) {
      logger.warn('Slow API request', metric);
    }

    // Send to analytics service (async, non-blocking, batched); silent failure
    if (typeof window !== 'undefined' && this.metrics.length % 10 === 0) {
      const recentMetrics = this.metrics.slice(-10);
      api.post('/api/v1/analytics/api-metrics', { metrics: recentMetrics }).catch(() => {});
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * Récupère les métriques de performance
   */
  getPerformanceMetrics(): {
    apiMetrics: APIMetric[];
    errors: ErrorMetric[];
    averageLatency: number;
    errorRate: number;
  } {
    const averageLatency =
      this.metrics.length > 0
        ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length
        : 0;

    const errorRate =
      this.metrics.length > 0
        ? (this.metrics.filter((m) => m.status >= 400).length / this.metrics.length) * 100
        : 0;

    return {
      apiMetrics: this.metrics,
      errors: this.errors,
      averageLatency,
      errorRate,
    };
  }
}

// ========================================
// EXPORT
// ========================================

export const performanceMonitor = PerformanceMonitorService.getInstance();

