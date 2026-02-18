export interface UsageMetric {
  id: string;
  brandId: string;
  metric: UsageMetricType;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type UsageMetricType = 
  | 'designs_created'
  | 'renders_2d'
  | 'renders_3d'
  | 'exports_gltf'
  | 'exports_usdz'
  | 'ai_generations'
  | 'storage_gb'
  | 'bandwidth_gb'
  | 'api_calls'
  | 'webhook_deliveries'
  | 'custom_domains'
  | 'team_members'
  | 'virtual_tryons'
  | 'try_on_screenshots'
  | 'ar_sessions'
  | 'ar_models'
  | 'ar_conversions_3d'
  | 'ar_qr_codes';

export interface UsageQuota {
  metric: UsageMetricType;
  limit: number;
  period: 'hour' | 'day' | 'month';
  overage: 'block' | 'charge';
  overageRate?: number; // Prix par unité supplémentaire en cents
}

export interface PlanLimits {
  plan: 'starter' | 'professional' | 'business' | 'enterprise';
  quotas: UsageQuota[];
  features: string[];
  basePrice: number; // Prix mensuel de base en cents
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
    timestamp: string;
  }>;
}

export interface StripeUsageRecord {
  id: string;
  subscription_item: string;
  quantity: number;
  timestamp: number;
  action: 'increment' | 'set';
}


