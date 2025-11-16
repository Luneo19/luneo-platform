import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { QueueMetricsService } from './queue-metrics.service';

type RequestLabels = {
  method: string;
  route: string;
  status_code: string;
  brand: string;
};

@Injectable()
export class HttpMetricsService {
  private readonly requestDurationHistogram: Histogram<string>;
  private readonly requestsTotalCounter: Counter<string>;
  private readonly requestErrorCounter: Counter<string>;

  constructor(private readonly queueMetricsService: QueueMetricsService) {
    const registry = this.queueMetricsService.getRegistry();

    this.requestDurationHistogram = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Durée des requêtes HTTP (en secondes)',
      labelNames: ['method', 'route', 'status_code', 'brand'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      registers: [registry],
    });

    this.requestsTotalCounter = new Counter({
      name: 'http_requests_total',
      help: 'Nombre total de requêtes HTTP',
      labelNames: ['method', 'route', 'status_code', 'brand'],
      registers: [registry],
    });

    this.requestErrorCounter = new Counter({
      name: 'http_requests_error_total',
      help: 'Nombre total de requêtes HTTP ayant retourné une erreur',
      labelNames: ['method', 'route', 'status_code', 'brand', 'error'],
      registers: [registry],
    });
  }

  recordSuccess(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
    brandId?: string,
  ): void {
    const labels = this.buildLabelSet(method, route, statusCode, brandId);
    this.requestsTotalCounter.labels(labels).inc();
    this.requestDurationHistogram.labels(labels).observe(durationMs / 1000);
  }

  recordError(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
    errorName?: string,
    brandId?: string,
  ): void {
    const labels = this.buildLabelSet(method, route, statusCode, brandId);
    this.requestsTotalCounter.labels(labels).inc();
    this.requestDurationHistogram.labels(labels).observe(durationMs / 1000);

    const errorLabelSet = {
      ...labels,
      error: this.sanitizeErrorName(errorName),
    };

    this.requestErrorCounter.labels(errorLabelSet).inc();
  }

  private buildLabelSet(
    method: string,
    route: string,
    statusCode: number,
    brandId?: string,
  ): RequestLabels {
    return {
      method: (method ?? 'UNKNOWN').toUpperCase(),
      route: this.sanitizeRoute(route),
      status_code: statusCode?.toString() ?? '0',
      brand: brandId ? this.normalizeLabelValue(brandId) : 'unknown',
    };
  }

  private sanitizeRoute(route?: string): string {
    if (!route) {
      return 'unknown';
    }

    const sanitized = route
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[0-9a-fA-F-]{8,}/g, '/:id')
      .replace(/\?.*/, '');

    return sanitized.startsWith('/') ? sanitized : `/${sanitized}`;
  }

  private sanitizeErrorName(errorName?: string): string {
    if (!errorName) {
      return 'unknown_error';
    }

    return this.normalizeLabelValue(errorName);
  }

  private normalizeLabelValue(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, '_') || 'unknown';
  }
}


