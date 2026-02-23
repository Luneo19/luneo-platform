import { logger } from '../logger';

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

type PlanTier = 'free' | 'pro' | 'business' | 'enterprise';
type UsageMetricType = 'designs_created' | 'renders_2d' | 'renders_3d' | 'exports_gltf' | 'exports_usdz' | 'ai_generations' | 'storage_gb' | 'bandwidth_gb' | 'api_calls' | 'webhook_deliveries' | 'custom_domains' | 'team_members' | 'virtual_tryons' | 'try_on_screenshots';
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
let billingPlansModule: unknown;
try {
  billingPlansModule = require('@luneo/billing-plans');
} catch (error) {
  // In Vercel/build environment, the package should be available via workspace
  // If not, we'll use fallback but log a warning
  logger.warn('⚠️ @luneo/billing-plans not found via require, using fallback');
  billingPlansModule = null;
}

const mod = billingPlansModule as { PLAN_DEFINITIONS?: Record<PlanTier, PlanDefinition>; PLAN_CATALOG?: PlanCatalog; getPlanDefinition?: (plan: PlanTier) => PlanDefinition; listPlans?: () => PlanDefinition[] } | null;
if (mod?.PLAN_DEFINITIONS && mod?.PLAN_CATALOG && mod.getPlanDefinition && mod.listPlans) {
  PLAN_DEFINITIONS = mod.PLAN_DEFINITIONS;
  PLAN_CATALOG = mod.PLAN_CATALOG;
  getPlanDefinition = mod.getPlanDefinition;
  listPlans = mod.listPlans;
} else {
  // This should not happen in production - package should be available
  // But we provide a type-safe fallback to prevent build errors
  PLAN_DEFINITIONS = {
    free: {
      id: 'free',
      name: 'Free',
      basePriceCents: 0,
      quotas: [],
      features: [],
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      basePriceCents: 4_900, // €49
      quotas: [],
      features: [],
    },
    business: {
      id: 'business',
      name: 'Business',
      basePriceCents: 14_900, // €149
      quotas: [],
      features: [],
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      basePriceCents: 49_900, // €499
      quotas: [],
      features: [],
    },
  } as Record<PlanTier, PlanDefinition>;
  
  PLAN_CATALOG = {
    plans: PLAN_DEFINITIONS,
    defaultPlan: 'free',
    availableTiers: ['free', 'pro', 'business', 'enterprise'],
  };
  
  getPlanDefinition = (plan: PlanTier) => PLAN_DEFINITIONS[plan] || PLAN_DEFINITIONS['pro'];
  listPlans = () => Object.values(PLAN_DEFINITIONS);
  
  if (typeof window === 'undefined') {
    // Only warn in server-side/build context
    logger.warn('⚠️ Billing plans package not found. Using fallback definitions.');
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

