import type { PlanDefinition, PlanQuotaDefinition, PlanTier } from '@/lib/billing-plans';
import type { UsageSummaryMetric } from '@/lib/hooks/useUsageSummary';

export type { PlanDefinition, PlanQuotaDefinition, PlanTier };

export type UsageSummaryData = {
  brandId: string;
  period: { start: string; end: string; status: string };
  metrics: UsageSummaryMetric[];
  estimatedCost: { base: number; usage: number; overage: number; total: number };
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    metric: string;
    threshold: number;
    timestamp: string;
  }>;
};

export interface TimelineEntry {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestampLabel: string;
  absoluteDate: string;
  suggestion?: string;
}

export interface ProjectionHighlight {
  id: string;
  metric: string;
  label: string;
  projectedPercentage: number;
  dailyRate: number;
  daysToLimit: number;
  status: 'ok' | 'warning' | 'critical';
}

export interface PlanCoverageInsight {
  id: PlanTier;
  plan: PlanDefinition;
  limitingMetricLabel: string;
  limitingMetricPercentage: number;
  status: 'optimal' | 'tense' | 'insufficient';
  deltaPriceCents: number;
  isCurrent: boolean;
}

export interface TopUpSimulation {
  metricLabel: string;
  originalPercentage: number;
  simulatedPercentage: number;
  originalDaysToLimit: number | null;
  simulatedDaysToLimit: number | null;
  regainedDays: number | null;
  estimatedCostCents: number | null;
  unit: string;
}
