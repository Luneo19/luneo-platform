/**
 * Billing Plans - Local Re-export
 * Professional wrapper to ensure package resolution
 * Re-exports from @luneo/billing-plans with fallback
 */

// Try to import from package, fallback to direct import if needed
let PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition>;
let PLAN_CATALOG: PlanCatalog;
let getPlanDefinition: (plan: PlanTier) => PlanDefinition;
let listPlans: () => PlanDefinition[];

type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise';
type UsageMetricType = 'designs_created' | 'renders_2d' | 'renders_3d' | 'exports_gltf' | 'exports_usdz' | 'ai_generations' | 'storage_gb' | 'bandwidth_gb' | 'api_calls' | 'webhook_deliveries' | 'custom_domains' | 'team_members';
type UsagePeriod = 'hour' | 'day' | 'month';
type OverageBehavior = 'block' | 'charge';

interface PlanQuotaDefinition {
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

interface PlanFeatureDefinition {
  id: string;
  label: string;
  enabled: boolean;
  description?: string;
}

interface PlanDefinition {
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

interface PlanCatalog {
  plans: Record<PlanTier, PlanDefinition>;
  defaultPlan: PlanTier;
  availableTiers: PlanTier[];
}

// For synchronous access, we'll use a synchronous require in a try-catch
// This approach works better with Next.js build-time requirements
// This is a workaround for Next.js build-time requirements
let billingPlansModule: any;
try {
  // @ts-ignore - Dynamic require for workspace package
  billingPlansModule = require('@luneo/billing-plans');
} catch (error) {
  // In Vercel/build environment, the package should be available via workspace
  // If not, we'll use fallback but log a warning
  console.warn('⚠️ @luneo/billing-plans not found via require, using fallback');
  billingPlansModule = null;
}

if (billingPlansModule && billingPlansModule.PLAN_DEFINITIONS && billingPlansModule.PLAN_CATALOG) {
  PLAN_DEFINITIONS = billingPlansModule.PLAN_DEFINITIONS as Record<PlanTier, PlanDefinition>;
  PLAN_CATALOG = billingPlansModule.PLAN_CATALOG as PlanCatalog;
  getPlanDefinition = billingPlansModule.getPlanDefinition as (plan: PlanTier) => PlanDefinition;
  listPlans = billingPlansModule.listPlans as () => PlanDefinition[];
} else {
  // This should not happen in production - package should be available
  // But we provide a type-safe fallback to prevent build errors
  const emptyPlan: PlanDefinition = {
    id: 'starter',
    name: 'Starter',
    basePriceCents: 0,
    quotas: [],
    features: [],
  };
  
  PLAN_DEFINITIONS = {
    starter: emptyPlan,
    professional: emptyPlan,
    business: emptyPlan,
    enterprise: emptyPlan,
  } as Record<PlanTier, PlanDefinition>;
  
  PLAN_CATALOG = {
    plans: PLAN_DEFINITIONS,
    defaultPlan: 'starter',
    availableTiers: ['starter', 'professional', 'business', 'enterprise'],
  };
  
  getPlanDefinition = (plan: PlanTier) => PLAN_DEFINITIONS[plan] || PLAN_DEFINITIONS.starter;
  listPlans = () => Object.values(PLAN_DEFINITIONS);
  
  if (typeof window === 'undefined') {
    // Only warn in server-side/build context
    console.warn('⚠️ Billing plans package not found. Using fallback definitions.');
  }
}

export {
  PLAN_DEFINITIONS,
  PLAN_CATALOG,
  getPlanDefinition,
  listPlans,
};

export type {
  PlanTier,
  PlanDefinition,
  PlanFeatureDefinition,
  PlanQuotaDefinition,
  PlanCatalog,
  UsageMetricType,
  UsagePeriod,
  OverageBehavior,
};

