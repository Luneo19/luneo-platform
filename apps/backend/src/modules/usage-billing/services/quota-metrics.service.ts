import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';
import type { PlanDefinition, UsageMetricType } from '@luneo/billing-plans';

import { QueueMetricsService } from '@/modules/observability/queue-metrics.service';
import type { UsageSummary } from '../interfaces/usage.interface';

export type QuotaCheckSource = 'internal_api' | 'public_api' | 'worker' | 'system';

export interface QuotaCheckMeasurement {
  brandId: string;
  planId: PlanDefinition['id'];
  metric: UsageMetricType;
  amount: number;
  allowed: boolean;
  overage: number;
  remaining: number;
  durationMs: number;
  source?: QuotaCheckSource;
}

export interface QuotaAlertMeasurement {
  brandId: string;
  planId: PlanDefinition['id'];
  metric: UsageMetricType;
  severity: 'info' | 'warning' | 'critical';
  overage: number;
  remaining: number;
  limit: number;
  overagePolicy: 'block' | 'charge';
}

@Injectable()
export class QuotaMetricsService {
  private readonly logger = new Logger(QuotaMetricsService.name);
  private readonly usagePercentageGauge: Gauge<string>;
  private readonly quotaRemainingGauge: Gauge<string>;
  private readonly quotaOverageGauge: Gauge<string>;
  private readonly quotaSummaryTimestampGauge: Gauge<string>;
  private readonly quotaCheckDurationHistogram: Histogram<string>;
  private readonly quotaCheckCounter: Counter<string>;
  private readonly quotaAlertCounter: Counter<string>;

  constructor(private readonly queueMetricsService: QueueMetricsService) {
    const registry = this.queueMetricsService.getRegistry();

    this.usagePercentageGauge = new Gauge({
      name: 'luneo_quota_usage_percentage',
      help: 'Pourcentage d’utilisation des quotas par brand/plan/métrique',
      labelNames: ['brand', 'plan', 'metric'],
      registers: [registry],
    });

    this.quotaRemainingGauge = new Gauge({
      name: 'luneo_quota_remaining_units',
      help: 'Quota restant (en unités) par brand/plan/métrique',
      labelNames: ['brand', 'plan', 'metric'],
      registers: [registry],
    });

    this.quotaOverageGauge = new Gauge({
      name: 'luneo_quota_overage_units',
      help: 'Nombre d’unités facturables au-delà du quota',
      labelNames: ['brand', 'plan', 'metric'],
      registers: [registry],
    });

    this.quotaSummaryTimestampGauge = new Gauge({
      name: 'luneo_quota_summary_timestamp',
      help: 'Timestamp (unix) du dernier calcul de résumé par brand/plan',
      labelNames: ['brand', 'plan'],
      registers: [registry],
    });

    this.quotaCheckDurationHistogram = new Histogram({
      name: 'luneo_quota_check_duration_seconds',
      help: 'Latence des vérifications de quotas par source/résultat',
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
      labelNames: ['brand', 'plan', 'metric', 'source', 'outcome'],
      registers: [registry],
    });

    this.quotaCheckCounter = new Counter({
      name: 'luneo_quota_checks_total',
      help: 'Nombre total de vérifications de quotas par source/résultat',
      labelNames: ['brand', 'plan', 'metric', 'source', 'outcome'],
      registers: [registry],
    });

    this.quotaAlertCounter = new Counter({
      name: 'luneo_quota_alerts_total',
      help: 'Nombre d’alertes quota émises par sévérité/policy',
      labelNames: ['brand', 'plan', 'metric', 'severity', 'overage_policy'],
      registers: [registry],
    });
  }

  recordSummary(brandId: string, plan: PlanDefinition, summary: UsageSummary): void {
    try {
      summary.metrics.forEach((metric) => {
        const labels = this.buildLabels(brandId, plan.id, metric.type);
        const remaining = Math.max(metric.limit - metric.current, 0);

        this.usagePercentageGauge.labels(labels).set(metric.percentage);
        this.quotaRemainingGauge.labels(labels).set(remaining);
        this.quotaOverageGauge.labels(labels).set(metric.overage);
      });

      this.quotaSummaryTimestampGauge.labels(brandId, plan.id).set(Date.now() / 1000);
    } catch (error) {
      this.logger.error(`Failed to record quota metrics for brand ${brandId}`, error instanceof Error ? error.stack : undefined);
    }
  }

  resetBrand(brandId: string, plan: PlanDefinition): void {
    plan.quotas.forEach((quota) => {
      const labels = this.buildLabels(brandId, plan.id, quota.metric);
      this.usagePercentageGauge.remove(labels);
      this.quotaRemainingGauge.remove(labels);
      this.quotaOverageGauge.remove(labels);
    });
    this.quotaSummaryTimestampGauge.remove(brandId, plan.id);
  }

  recordQuotaCheck(payload: QuotaCheckMeasurement): void {
    try {
      const source = payload.source ?? 'internal_api';
      const outcome = payload.allowed ? 'allowed' : 'blocked';
      const labels = {
        brand: payload.brandId,
        plan: payload.planId,
        metric: payload.metric,
        source,
        outcome,
      };

      this.quotaCheckCounter.labels(labels).inc(Math.max(1, payload.amount));
      this.quotaCheckDurationHistogram.labels(labels).observe(Math.max(payload.durationMs / 1000, 0));
    } catch (error) {
      this.logger.error('Failed to record quota check metric', error instanceof Error ? error.stack : undefined);
    }
  }

  recordAlert(payload: QuotaAlertMeasurement): void {
    try {
      this.quotaAlertCounter
        .labels(payload.brandId, payload.planId, payload.metric, payload.severity, payload.overagePolicy)
        .inc();
    } catch (error) {
      this.logger.error('Failed to record quota alert metric', error instanceof Error ? error.stack : undefined);
    }
  }

  private buildLabels(
    brandId: string,
    plan: PlanDefinition['id'],
    metric: UsageMetricType,
  ): Record<string, string> {
    return {
      brand: brandId,
      plan,
      metric,
    };
  }
}

