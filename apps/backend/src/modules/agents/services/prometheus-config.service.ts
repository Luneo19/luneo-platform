/**
 * @fileoverview Configuration Prometheus pour Agents IA
 * @module PrometheusConfigService
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrometheusConfigService {
  private readonly logger = new Logger(PrometheusConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Vérifie si Prometheus est activé
   */
  isEnabled(): boolean {
    return this.configService.get<string>('PROMETHEUS_ENABLED', 'true') === 'true';
  }

  /**
   * Port pour métriques Prometheus
   */
  getMetricsPort(): number {
    return parseInt(this.configService.get<string>('METRICS_PORT', '9090'), 10);
  }

  /**
   * Path pour métriques
   */
  getMetricsPath(): string {
    return this.configService.get<string>('METRICS_PATH', '/health/metrics');
  }

  /**
   * Configuration complète
   */
  getConfig() {
    return {
      enabled: this.isEnabled(),
      port: this.getMetricsPort(),
      path: this.getMetricsPath(),
    };
  }
}
