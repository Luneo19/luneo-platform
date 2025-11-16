import type {
  PlanDefinition,
  PlanQuotaDefinition,
  PlanTier,
  UsageMetricType,
} from '@luneo/billing-plans';

export type UsageMetadataValue = string | number | boolean | null;
export type UsageMetadata = Record<string, UsageMetadataValue>;

export interface UsageMetric {
  id: string;
  brandId: string;
  metric: UsageMetricType;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: UsageMetadata;
}

export type { UsageMetricType };

export interface UsageQuota extends PlanQuotaDefinition {}

export interface PlanLimits extends PlanDefinition {
  plan: PlanTier;
}

export interface UsageRecord {
  id: string;
  brandId: string;
  period: Date; // Début de la période (ex: 2025-10-01)
  metrics: Record<UsageMetricType, number>;
  costs: {
    base: number;
    usage: number;
    overage: number;
    total: number;
  };
  stripeInvoiceId?: string;
  status: 'pending' | 'invoiced' | 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingPeriod {
  start: Date;
  end: Date;
  status: 'active' | 'ended' | 'invoiced';
}

export interface UsageSummary {
  brandId: string;
  period: BillingPeriod;
  metrics: Array<{
    type: UsageMetricType;
    current: number;
    limit: number;
    percentage: number;
    overage: number;
  }>;
  estimatedCost: {
    base: number;
    usage: number;
    overage: number;
    total: number;
  };
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    metric: UsageMetricType;
    threshold: number;
    timestamp: Date;
  }>;
}

export interface StripeUsageRecord {
  id: string;
  subscription_item: string;
  quantity: number;
  timestamp: number;
  action: 'increment' | 'set';
}


