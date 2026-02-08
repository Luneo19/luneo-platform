/**
 * @luneo/billing-plans
 * Billing plans and quota definitions for Luneo.
 * Canonical source for plan tiers, quotas, and helpers.
 * The frontend re-exports from this package with a fallback in apps/frontend/src/lib/billing-plans/.
 *
 * IMPORTANT: Prices (basePriceCents) must match backend plan-config.ts -- source of truth is GET /pricing/plans
 */

export type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise';
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
export type UsagePeriod = 'hour' | 'day' | 'month';
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
  creditCost?: number;
  baseCostCents?: number;
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

const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    basePriceCents: 1900, // €19/month — must match backend plan-config.ts
    quotas: [],
    features: [],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    basePriceCents: 4900, // €49/month — must match backend plan-config.ts
    quotas: [],
    features: [],
  },
  business: {
    id: 'business',
    name: 'Business',
    basePriceCents: 9900, // €99/month — must match backend plan-config.ts
    quotas: [],
    features: [],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    basePriceCents: 29900, // €299/month — must match backend plan-config.ts
    quotas: [],
    features: [],
  },
};

export const PLAN_CATALOG: PlanCatalog = {
  plans: PLAN_DEFINITIONS,
  defaultPlan: 'starter',
  availableTiers: ['starter', 'professional', 'business', 'enterprise'],
};

export { PLAN_DEFINITIONS };

export function getPlanDefinition(plan: PlanTier): PlanDefinition {
  return PLAN_DEFINITIONS[plan] ?? PLAN_DEFINITIONS.starter;
}

export function listPlans(): PlanDefinition[] {
  return Object.values(PLAN_DEFINITIONS);
}
