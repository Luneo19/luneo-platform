import { Injectable } from '@nestjs/common';
import { BusinessImpactService } from './business-impact.service';
import { RoiCalculatorService } from './roi-calculator.service';
import {
  QUARTERLY_TARGETS,
  SCORECARD_WEIGHTS,
  ScorecardMetricKey,
} from './scorecard.config';

export interface ScorecardMetric {
  key: ScorecardMetricKey;
  label: string;
  weight: number;
  value: number;
  target: number;
  score: number;
  provenance: 'estimated' | 'observed';
  source: string;
}

export interface UnifiedScorecard {
  period: {
    from: string;
    to: string;
    quarter: string;
  };
  totals: {
    weightedScore: number;
    health: 'critical' | 'at_risk' | 'on_track' | 'outperforming';
  };
  metrics: ScorecardMetric[];
}

@Injectable()
export class ScorecardService {
  constructor(
    private readonly businessImpactService: BusinessImpactService,
    private readonly roiCalculatorService: RoiCalculatorService,
  ) {}

  async getUnifiedScorecard(
    organizationId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<UnifiedScorecard> {
    const [impact, roi] = await Promise.all([
      this.businessImpactService.getBusinessImpact(organizationId, dateRange),
      this.roiCalculatorService.calculateROI(organizationId, dateRange),
    ]);

    const target = this.getQuarterTarget(dateRange.to);
    const arrGrowth = this.estimateArrGrowth(impact.estimatedRevenue);
    const nrr = this.estimateNrr(impact.resolutionRate, impact.avgSatisfaction);
    const activation = this.estimateActivationRate(
      impact.totalConversations,
      impact.leadsCaptured,
    );
    const margin = this.estimateGrossMargin(roi.aiCost, impact.estimatedRevenue);

    const metrics: ScorecardMetric[] = [
      this.buildMetric('arr', arrGrowth, target.arrGrowthPct),
      this.buildMetric('nrr', nrr, target.nrrPct),
      this.buildMetric('activation', activation, target.activationPct),
      this.buildMetric('margin', margin, target.grossMarginPct),
    ];

    const weightedScore =
      Math.round(metrics.reduce((sum, m) => sum + m.score * (m.weight / 100), 0) * 100) / 100;

    return {
      period: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        quarter: target.quarter,
      },
      totals: {
        weightedScore,
        health: this.healthFromScore(weightedScore),
      },
      metrics,
    };
  }

  private buildMetric(
    key: ScorecardMetricKey,
    value: number,
    target: number,
  ): ScorecardMetric {
    const config = SCORECARD_WEIGHTS.find((x) => x.key === key)!;
    const scoreRaw = target > 0 ? (value / target) * 100 : 0;
    const score = Math.round(Math.max(0, Math.min(140, scoreRaw)) * 100) / 100;

    return {
      key,
      label: config.label,
      weight: config.weight,
      value: Math.round(value * 100) / 100,
      target,
      score,
      provenance: key === 'activation' ? 'observed' : 'estimated',
      source:
        key === 'activation'
          ? 'analytics-events'
          : key === 'margin'
            ? 'roi-and-revenue-model'
            : 'business-proxy-model-v1',
    };
  }

  private healthFromScore(score: number): UnifiedScorecard['totals']['health'] {
    if (score < 65) return 'critical';
    if (score < 85) return 'at_risk';
    if (score <= 105) return 'on_track';
    return 'outperforming';
  }

  private getQuarterTarget(date: Date) {
    const q = Math.floor(date.getMonth() / 3);
    return QUARTERLY_TARGETS[q] ?? QUARTERLY_TARGETS[0];
  }

  private estimateArrGrowth(estimatedRevenue: number): number {
    // Proxy pragmatique V1: revenue attribué mensuel annualisé puis converti en %
    const annualized = estimatedRevenue * 12;
    if (annualized <= 0) return 0;
    if (annualized < 120_000) return 12;
    if (annualized < 500_000) return 18;
    if (annualized < 1_500_000) return 24;
    return 30;
  }

  private estimateNrr(resolutionRate: number, avgSatisfaction: number): number {
    // Approximation V1 corrélée rétention: résolution + satisfaction
    const satBoost = avgSatisfaction >= 4 ? 8 : avgSatisfaction >= 3 ? 4 : 0;
    return Math.round(Math.max(80, Math.min(130, 90 + resolutionRate * 0.2 + satBoost)));
  }

  private estimateActivationRate(totalConversations: number, leadsCaptured: number): number {
    if (totalConversations <= 0) return 0;
    return (leadsCaptured / totalConversations) * 100;
  }

  private estimateGrossMargin(aiCost: number, revenue: number): number {
    if (revenue <= 0) return 0;
    return ((revenue - aiCost) / revenue) * 100;
  }
}

