import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

// Optional: prom-client (install with: npm install prom-client)
let Registry: any, Counter: any, Histogram: any, Gauge: any, collectDefaultMetrics: any;
try {
  const promClient = require('prom-client');
  Registry = promClient.Registry;
  Counter = promClient.Counter;
  Histogram = promClient.Histogram;
  Gauge = promClient.Gauge;
  collectDefaultMetrics = promClient.collectDefaultMetrics;
} catch (e) {
  // prom-client not installed, will use fallback
}

/**
 * Prometheus Service
 * Expose métriques pour scraping Prometheus
 * 
 * Usage:
 * ```typescript
 * this.prometheus.httpRequestsTotal.inc({ method: 'POST', route: '/api/designs', status: '200' });
 * this.prometheus.httpRequestDuration.observe({ method: 'POST', route: '/api/designs' }, 0.5);
 * ```
 */
@Injectable()
export class PrometheusService implements OnModuleInit {
  private readonly logger = new Logger(PrometheusService.name);
  private readonly registry: any;

  // HTTP Metrics
  public readonly httpRequestsTotal: any;
  public readonly httpRequestDuration: any;
  public readonly httpRequestSize: any;
  public readonly httpResponseSize: any;

  // Business Metrics
  public readonly designsCreated: any;
  public readonly aiGenerations: any;
  public readonly aiCosts: any;
  public readonly ordersCreated: any;
  public readonly renderRequests: any;

  // System Metrics
  public readonly activeConnections: any;
  public readonly queueSize: any;
  public readonly cacheHitRate: any;

  constructor() {
    if (!Registry) {
      this.logger.warn('prom-client not installed. Metrics will not be available.');
      // Create dummy objects to prevent errors
      this.registry = null;
      this.httpRequestsTotal = { inc: () => {} };
      this.httpRequestDuration = { observe: () => {} };
      this.httpRequestSize = { observe: () => {} };
      this.httpResponseSize = { observe: () => {} };
      this.designsCreated = { inc: () => {} };
      this.aiGenerations = { inc: () => {} };
      this.aiCosts = { inc: () => {} };
      this.ordersCreated = { inc: () => {} };
      this.renderRequests = { inc: () => {} };
      this.activeConnections = { set: () => {} };
      this.queueSize = { set: () => {} };
      this.cacheHitRate = { set: () => {} };
      return;
    }
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    if (collectDefaultMetrics) {
      collectDefaultMetrics({ register: this.registry });
    }

    // Typed constructors: prom-client types are not fully compatible with strict mode (optional dependency)
    type PrometheusConfig = { name: string; help: string; labelNames?: string[]; buckets?: number[]; registers?: unknown[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TypedCounter = Counter as new (config: PrometheusConfig) => { inc: (labels?: Record<string, string>) => void };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TypedHistogram = Histogram as new (config: PrometheusConfig) => { observe: (labels: Record<string, string>, value: number) => void };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TypedGauge = Gauge as new (config: PrometheusConfig) => { set: (labels: Record<string, string>, value: number) => void };

    // HTTP Metrics
    this.httpRequestsTotal = new TypedCounter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status', 'brandId'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new TypedHistogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.httpRequestSize = new TypedHistogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000],
      registers: [this.registry],
    });

    this.httpResponseSize = new TypedHistogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000],
      registers: [this.registry],
    });

    // Business Metrics
    this.designsCreated = new TypedCounter({
      name: 'designs_created_total',
      help: 'Total number of designs created',
      labelNames: ['brandId', 'provider'],
      registers: [this.registry],
    });

    this.aiGenerations = new TypedCounter({
      name: 'ai_generations_total',
      help: 'Total number of AI generations',
      labelNames: ['brandId', 'provider', 'model', 'stage'],
      registers: [this.registry],
    });

    this.aiCosts = new TypedCounter({
      name: 'ai_costs_cents_total',
      help: 'Total AI costs in cents',
      labelNames: ['brandId', 'provider', 'model'],
      registers: [this.registry],
    });

    this.ordersCreated = new TypedCounter({
      name: 'orders_created_total',
      help: 'Total number of orders created',
      labelNames: ['brandId', 'status'],
      registers: [this.registry],
    });

    this.renderRequests = new TypedCounter({
      name: 'render_requests_total',
      help: 'Total number of render requests',
      labelNames: ['brandId', 'type', 'status'],
      registers: [this.registry],
    });

    // System Metrics
    this.activeConnections = new TypedGauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.queueSize = new TypedGauge({
      name: 'queue_size',
      help: 'Size of job queues',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.cacheHitRate = new TypedGauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate (0-1)',
      labelNames: ['type'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    if (!Registry) {
      this.logger.warn('prom-client not installed. Install with: npm install prom-client');
      return;
    }
    this.logger.log('Prometheus metrics service initialized');
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    if (!this.registry) {
      return '# prom-client not installed. Install with: prom-client\n';
    }
    return this.registry.metrics();
  }

  /**
   * Get basic request count and latency for health endpoint (from prom-client registry).
   */
  async getRequestStats(): Promise<{ requestCountTotal: number; latencyP95Ms: number | null }> {
    if (!this.registry || typeof this.registry.getMetricsAsJSON !== 'function') {
      return { requestCountTotal: 0, latencyP95Ms: null };
    }
    const metrics = this.registry.getMetricsAsJSON() as Array<{ name: string; values?: Array<{ value?: number; labels?: Record<string, string> }> }>;
    let requestCountTotal = 0;
    let latencyP95Ms: number | null = null;
    for (const m of metrics) {
      if (m.name === 'http_requests_total' && m.values?.length) {
        requestCountTotal += m.values.reduce((s, v) => s + (Number(v.value) || 0), 0);
      }
      if (m.name === 'http_request_duration_seconds_bucket' && m.values?.length) {
        const withLe = m.values.filter((v) => v.labels?.le != null).sort((a, b) => (parseFloat(a.labels!.le) || 0) - (parseFloat(b.labels!.le) || 0));
        if (withLe.length > 0) {
          const p95Bucket = withLe[Math.min(Math.ceil(withLe.length * 0.95) - 1, withLe.length - 1)];
          const le = p95Bucket?.labels?.le ? parseFloat(p95Bucket.labels.le) : 0;
          latencyP95Ms = Math.round(le * 1000);
        }
      }
    }
    return { requestCountTotal, latencyP95Ms };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  async resetMetrics(): Promise<void> {
    if (this.registry) {
      await this.registry.resetMetrics();
    }
  }
}

































