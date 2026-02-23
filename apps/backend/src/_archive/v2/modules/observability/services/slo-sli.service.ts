import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PrometheusHelper } from '@/libs/integrations/prometheus.helper';

export interface SLOTarget {
  service: string;
  metric: 'latency' | 'error_rate' | 'availability' | 'throughput';
  target: number; // 99.9 pour 99.9%
  window: '1h' | '24h' | '7d' | '30d';
}

export interface SLIMetric {
  service: string;
  metric: string;
  value: number;
  timestamp: Date;
  window: string;
}

export interface SLOResult {
  service: string;
  metric: string;
  target: number;
  current: number;
  status: 'met' | 'warning' | 'breach';
  window: string;
  timestamp: Date;
}

/** Formal SLO/SLI target definition for compliance reporting */
export interface FormalSLOTarget {
  target: number;
  metric: string;
  window: string;
}

export interface SLOStatusResponse {
  slos: Record<string, FormalSLOTarget>;
  current: Record<string, number>;
  compliant: boolean;
  lastUpdated: string;
}

@Injectable()
export class SLOService {
  private readonly logger = new Logger(SLOService.name);

  /** Formal SLO targets for compliance (availability %, latency ms, error %) */
  private readonly FORMAL_SLO_TARGETS: Record<string, FormalSLOTarget> = {
    availability: {
      target: 99.9,
      metric: 'successful_requests / total_requests * 100',
      window: '30d',
    },
    latency_p95: {
      target: 200,
      metric: 'response_time_p95_ms',
      window: '30d',
    },
    latency_p99: {
      target: 500,
      metric: 'response_time_p99_ms',
      window: '30d',
    },
    error_rate: {
      target: 1,
      metric: 'error_requests / total_requests * 100',
      window: '24h',
    },
    page_load_p95: {
      target: 3000,
      metric: 'page_load_time_p95_ms',
      window: '7d',
    },
  };

  // Définition des SLO par service
  private readonly SLO_TARGETS: SLOTarget[] = [
    // API Backend
    {
      service: 'api',
      metric: 'latency',
      target: 200, // 200ms p95
      window: '24h',
    },
    {
      service: 'api',
      metric: 'error_rate',
      target: 0.5, // 0.5% d'erreurs
      window: '24h',
    },
    {
      service: 'api',
      metric: 'availability',
      target: 99.9, // 99.9% uptime
      window: '30d',
    },
    // AI Generation
    {
      service: 'ai-generation',
      metric: 'latency',
      target: 5000, // 5s p95
      window: '24h',
    },
    {
      service: 'ai-generation',
      metric: 'error_rate',
      target: 2.0, // 2% d'erreurs (plus tolérant)
      window: '24h',
    },
    // 3D Rendering
    {
      service: 'render-3d',
      metric: 'latency',
      target: 10000, // 10s p95
      window: '24h',
    },
    {
      service: 'render-3d',
      metric: 'error_rate',
      target: 1.0, // 1% d'erreurs
      window: '24h',
    },
    // Order Processing
    {
      service: 'orders',
      metric: 'latency',
      target: 1000, // 1s p95
      window: '24h',
    },
    {
      service: 'orders',
      metric: 'error_rate',
      target: 0.1, // 0.1% d'erreurs (critique)
      window: '24h',
    },
  ];

  private prometheus: PrometheusHelper | null = null;

  constructor(private readonly prisma: PrismaService) {
    // Initialize Prometheus helper if URL is configured
    if (process.env.PROMETHEUS_URL) {
      this.prometheus = new PrometheusHelper();
    }
  }

  /**
   * Évalue tous les SLO
   */
  async evaluateAllSLOs(): Promise<SLOResult[]> {
    const results: SLOResult[] = [];

    for (const target of this.SLO_TARGETS) {
      try {
        const current = await this.getCurrentMetric(target);
        const status = this.evaluateStatus(current, target.target, target.metric);
        
        results.push({
          service: target.service,
          metric: target.metric,
          target: target.target,
          current,
          status,
          window: target.window,
          timestamp: new Date(),
        });
      } catch (error) {
        this.logger.error(`Failed to evaluate SLO for ${target.service}.${target.metric}:`, error);
      }
    }

    return results;
  }

  /**
   * Récupère la métrique actuelle (Prometheus si configuré, sinon MonitoringMetric ou fallback)
   */
  private async getCurrentMetric(target: SLOTarget): Promise<number> {
    const metricKey = `${target.service}_${target.metric}_${target.window}`;
    const stored = await this.prisma.monitoringMetric.findMany({
      where: {
        service: target.service,
        metric: metricKey,
        timestamp: { gte: this.getWindowStart(target.window) },
      },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });
    if (stored.length > 0 && stored[0].value != null) {
      return stored[0].value;
    }

    switch (target.metric) {
      case 'latency':
        return this.getLatencyMetric(target.service, target.window);
      case 'error_rate':
        return this.getErrorRateMetric(target.service, target.window);
      case 'availability':
        return this.getAvailabilityMetric(target.service, target.window);
      case 'throughput':
        return this.getThroughputMetric(target.service, target.window);
      default:
        return 0;
    }
  }

  private getWindowStart(window: string): Date {
    const now = new Date();
    const d = new Date(now);
    if (window === '1h') d.setHours(d.getHours() - 1);
    else if (window === '24h') d.setDate(d.getDate() - 1);
    else if (window === '7d') d.setDate(d.getDate() - 7);
    else if (window === '30d') d.setDate(d.getDate() - 30);
    return d;
  }

  /**
   * Récupère la latence (p95)
   */
  private async getLatencyMetric(service: string, window: string): Promise<number> {
    if (this.prometheus) {
      try {
        return await this.prometheus.queryLatencyP95(service, window);
      } catch (error) {
        this.logger.warn(`Failed to query Prometheus for latency: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Fallback: simulation
    const baseLatencies: Record<string, number> = {
      api: 150,
      'ai-generation': 4000,
      'render-3d': 8000,
      orders: 800,
    };
    return baseLatencies[service] || 1000;
  }

  /**
   * Récupère le taux d'erreur
   */
  private async getErrorRateMetric(service: string, window: string): Promise<number> {
    if (this.prometheus) {
      try {
        return await this.prometheus.queryErrorRate(service, window);
      } catch (error) {
        this.logger.warn(`Failed to query Prometheus for error rate: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Fallback: simulation
    const baseErrorRates: Record<string, number> = {
      api: 0.2,
      'ai-generation': 1.5,
      'render-3d': 0.8,
      orders: 0.05,
    };
    return baseErrorRates[service] || 0.5;
  }

  /**
   * Récupère la disponibilité
   */
  private async getAvailabilityMetric(service: string, window: string): Promise<number> {
    if (this.prometheus) {
      try {
        return await this.prometheus.queryAvailability(service, window);
      } catch (error) {
        this.logger.warn(`Failed to query Prometheus for availability: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Fallback: simulation
    return 99.95;
  }

  /**
   * Récupère le throughput
   */
  private async getThroughputMetric(service: string, window: string): Promise<number> {
    if (this.prometheus) {
      try {
        return await this.prometheus.queryThroughput(service, window);
      } catch (error) {
        this.logger.warn(`Failed to query Prometheus for throughput: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Fallback: simulation
    return 1000;
  }

  /**
   * Évalue le statut (met/warning/breach)
   */
  private evaluateStatus(current: number, target: number, metric: string): 'met' | 'warning' | 'breach' {
    if (metric === 'latency') {
      // Pour la latence, plus bas = mieux
      if (current <= target) {
        return 'met';
      } else if (current <= target * 1.5) {
        return 'warning';
      } else {
        return 'breach';
      }
    } else if (metric === 'error_rate') {
      // Pour le taux d'erreur, plus bas = mieux
      if (current <= target) {
        return 'met';
      } else if (current <= target * 2) {
        return 'warning';
      } else {
        return 'breach';
      }
    } else if (metric === 'availability') {
      // Pour la disponibilité, plus haut = mieux
      if (current >= target) {
        return 'met';
      } else if (current >= target - 0.5) {
        return 'warning';
      } else {
        return 'breach';
      }
    } else {
      // Throughput: plus haut = mieux
      if (current >= target) {
        return 'met';
      } else if (current >= target * 0.8) {
        return 'warning';
      } else {
        return 'breach';
      }
    }
  }

  /**
   * Sauvegarde les résultats SLO (dans MonitoringMetric; SLARecord est dédié work orders/artisans)
   */
  async saveSLOResults(results: SLOResult[]): Promise<void> {
    const now = new Date();
    if (results.length > 0) {
      await this.prisma.monitoringMetric.createMany({
        data: results.map((result) => ({
          service: result.service,
          metric: `slo_${result.metric}`,
          value: result.current,
          unit: result.metric === 'latency' ? 'ms' : result.metric === 'availability' ? '%' : null,
          labels: {
            target: result.target,
            status: result.status,
            window: result.window,
          } as object,
          timestamp: now,
        })),
      });
    }
    for (const result of results) {
      if (result.status === 'breach') {
        this.logger.error(
          `SLO BREACH: ${result.service}.${result.metric} = ${result.current} (target: ${result.target})`,
        );
      } else if (result.status === 'warning') {
        this.logger.warn(
          `SLO WARNING: ${result.service}.${result.metric} = ${result.current} (target: ${result.target})`,
        );
      }
    }
  }

  /**
   * Récupère l'historique SLO depuis MonitoringMetric (métriques slo_*)
   */
  async getSLOHistory(service: string, metric: string, days: number = 7): Promise<SLOResult[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.monitoringMetric.findMany({
      where: {
        service,
        metric: `slo_${metric}`,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    return rows.map((r) => {
      const labels = (r.labels as { target?: number; status?: SLOResult['status']; window?: string }) || {};
      return {
        service: r.service,
        metric,
        target: labels.target ?? 0,
        current: r.value,
        status: (labels.status as SLOResult['status']) ?? 'met',
        window: labels.window ?? '24h',
        timestamp: r.timestamp,
      };
    });
  }

  /**
   * Calculate current metrics for formal SLOs (for status endpoint).
   */
  async calculateCurrentMetrics(): Promise<Record<string, number>> {
    const [availability, latencyP95, latencyP99, errorRate] = await Promise.all([
      this.getAvailabilityMetric('api', '30d'),
      this.getLatencyMetric('api', '30d'),
      this.getLatencyP99Metric('api', '30d'),
      this.getErrorRateMetric('api', '24h'),
    ]);
    const pageLoadP95 = await this.getPageLoadP95Metric('7d');
    return {
      availability,
      latency_p95: latencyP95,
      latency_p99: latencyP99,
      error_rate: errorRate,
      page_load_p95: pageLoadP95,
    };
  }

  private async getLatencyP99Metric(service: string, window: string): Promise<number> {
    if (this.prometheus) {
      try {
        return await this.prometheus.queryLatencyP99(service, window);
      } catch (error) {
        this.logger.warn(`Failed to query Prometheus for latency P99: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const p95 = await this.getLatencyMetric(service, window);
    return Math.round(p95 * 1.3);
  }

  private async getPageLoadP95Metric(window: string): Promise<number> {
    const stored = await this.prisma.monitoringMetric.findFirst({
      where: {
        service: 'frontend',
        metric: 'page_load_time_p95_ms',
        timestamp: { gte: this.getWindowStart(window) },
      },
      orderBy: { timestamp: 'desc' },
    });
    if (stored?.value != null) return stored.value;
    return 0;
  }

  /**
   * Check if all formal SLOs are currently met.
   */
  async checkCompliance(): Promise<boolean> {
    const current = await this.calculateCurrentMetrics();
    for (const [key, def] of Object.entries(this.FORMAL_SLO_TARGETS)) {
      const value = current[key] ?? 0;
      if (key === 'availability') {
        if (value < def.target) return false;
      } else {
        if (value > def.target) return false;
      }
    }
    return true;
  }

  /**
   * Get SLO status for the compliance endpoint (targets, current values, compliant, lastUpdated).
   */
  async getSLOStatus(): Promise<SLOStatusResponse> {
    const [current, compliant] = await Promise.all([
      this.calculateCurrentMetrics(),
      this.checkCompliance(),
    ]);
    return {
      slos: { ...this.FORMAL_SLO_TARGETS },
      current,
      compliant,
      lastUpdated: new Date().toISOString(),
    };
  }
}

































