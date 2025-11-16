import type { PlanDefinition, PlanTier, UsageMetricType } from '@luneo/billing-plans';
import type { UsageSummary } from '../interfaces/usage.interface';

export const QUOTA_ALERT_EVENT = 'usage.quota.alert';
export const QUOTA_SUMMARY_EVENT = 'usage.quota.summary';

export type QuotaAlertSeverity = 'info' | 'warning' | 'critical';

export interface QuotaAlertEventPayload {
  brandId: string;
  planId: PlanTier;
  metric: UsageMetricType;
  percentage: number;
  remaining: number;
  limit: number;
  overage: number;
  severity: QuotaAlertSeverity;
  timestamp: string;
}

export interface QuotaSummaryEventPayload {
  brandId: string;
  plan: PlanDefinition;
  summary: UsageSummary;
}

