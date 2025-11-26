type UsagePeriod = 'hour' | 'day' | 'month';
type UsageMetricType = 'designs_created' | 'renders_2d' | 'renders_3d' | 'exports_gltf' | 'exports_usdz' | 'ai_generations' | 'storage_gb' | 'bandwidth_gb' | 'api_calls' | 'webhook_deliveries' | 'custom_domains' | 'team_members';
type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise';
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

declare const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition>;
declare const PLAN_CATALOG: PlanCatalog;
declare function getPlanDefinition(plan: PlanTier): PlanDefinition;
declare function listPlans(): PlanDefinition[];

export { type OverageBehavior, PLAN_CATALOG, PLAN_DEFINITIONS, type PlanCatalog, type PlanDefinition, type PlanFeatureDefinition, type PlanQuotaDefinition, type PlanTier, type UsageMetricType, type UsagePeriod, getPlanDefinition, listPlans };
