export type UsagePeriod = 'hour' | 'day' | 'month';

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
  | 'team_members';

export type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise';

export type OverageBehavior = 'block' | 'charge';

export interface PlanQuotaDefinition {
  metric: UsageMetricType;
  label: string;
  description: string;
  limit: number;
  period: UsagePeriod;
  overage: OverageBehavior;
  overageRate?: number;
  unit: string;
  notificationThresholds?: number[];
}

export interface PlanFeatureDefinition {
  id: string;
  label: string;
  enabled: boolean;
  description?: string;
}

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  basePriceCents: number;
  headline?: string;
  quotas: PlanQuotaDefinition[];
  features: PlanFeatureDefinition[];
  addons?: Array<{
    id: string;
    label: string;
    description?: string;
    priceCents?: number;
    meteredMetric?: UsageMetricType;
  }>;
  limits?: {
    teamMembers?: number;
    storageGb?: number;
    designsPerMonth?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface PlanCatalog {
  plans: Record<PlanTier, PlanDefinition>;
  defaultPlan: PlanTier;
  availableTiers: PlanTier[];
}

