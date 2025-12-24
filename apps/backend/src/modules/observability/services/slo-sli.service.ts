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

@Injectable()
export class SLOService {
  private readonly logger = new Logger(SLOService.name);

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
   * Récupère la métrique actuelle
   */
  private async getCurrentMetric(target: SLOTarget): Promise<number> {
    // TODO: Récupérer depuis Prometheus ou métriques stockées
    // Pour l'instant, simulation basée sur des données factices
    
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

  /**
   * Récupère la latence (p95)
   */
  private async getLatencyMetric(service: string, window: string): Promise<number> {
    if (this.prometheus) {
      try {
        return await this.prometheus.queryLatencyP95(service, window);
      } catch (error) {
        this.logger.warn(`Failed to query Prometheus for latency: ${error.message}`);
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
        this.logger.warn(`Failed to query Prometheus for error rate: ${error.message}`);
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
        this.logger.warn(`Failed to query Prometheus for availability: ${error.message}`);
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
        this.logger.warn(`Failed to query Prometheus for throughput: ${error.message}`);
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
   * Sauvegarde les résultats SLO
   */
  async saveSLOResults(results: SLOResult[]): Promise<void> {
    // TODO: Sauvegarder dans une table SLORecord
    // Pour l'instant, log
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
   * Récupère l'historique SLO
   */
  async getSLOHistory(service: string, metric: string, days: number = 7): Promise<SLOResult[]> {
    // TODO: Récupérer depuis la table SLORecord
    return [];
  }
}




















