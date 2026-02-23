/**
 * @luneo/billing-plans
 * Billing plans and quota definitions for Luneo.
 * Canonical source for plan tiers, quotas, and helpers.
 * The frontend re-exports from this package with a fallback in apps/frontend/src/lib/billing-plans/.
 *
 * IMPORTANT: Prices (basePriceCents) must match backend plan-config.ts -- source of truth is GET /pricing/plans
 * ALL values in this file MUST be kept in sync with apps/backend/src/libs/plans/plan-config.ts
 */

export type PlanTier = 'free' | 'pro' | 'business' | 'enterprise';
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
  | 'try_on_screenshots';
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
  yearlyPriceCents: number;
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
  limits: {
    teamMembers: number;
    storageGb: number;
    designsPerMonth: number;
    maxProducts: number;
    apiAccess: boolean;
    arEnabled: boolean;
    whiteLabel: boolean;
    advancedAnalytics: boolean;
    customExport: boolean;
    prioritySupport: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface PlanCatalog {
  plans: Record<PlanTier, PlanDefinition>;
  defaultPlan: PlanTier;
  availableTiers: PlanTier[];
}

/**
 * Plan definitions synchronized with backend plan-config.ts (SINGLE SOURCE OF TRUTH)
 */
const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    basePriceCents: 0,
    yearlyPriceCents: 0,
    headline: 'Découvrez Luneo gratuitement',
    limits: {
      teamMembers: 1,
      storageGb: 0.5,
      designsPerMonth: 5,
      maxProducts: 2,
      apiAccess: false,
      arEnabled: false,
      whiteLabel: false,
      advancedAnalytics: false,
      customExport: false,
      prioritySupport: false,
    },
    quotas: [
      { metric: 'designs_created', label: 'Designs', description: 'Designs créés par mois', limit: 5, period: 'month', overage: 'block', unit: 'designs' },
      { metric: 'renders_2d', label: 'Rendus 2D', description: 'Rendus 2D par mois', limit: 10, period: 'month', overage: 'block', unit: 'rendus' },
      { metric: 'renders_3d', label: 'Rendus 3D', description: 'Rendus 3D par mois', limit: 0, period: 'month', overage: 'block', unit: 'rendus' },
      { metric: 'ai_generations', label: 'Générations IA', description: 'Générations IA par mois', limit: 3, period: 'month', overage: 'block', unit: 'générations' },
      { metric: 'storage_gb', label: 'Stockage', description: 'Espace de stockage', limit: 0.5, period: 'month', overage: 'block', unit: 'GB' },
      { metric: 'api_calls', label: 'Appels API', description: 'Appels API par mois', limit: 0, period: 'month', overage: 'block', unit: 'appels' },
      { metric: 'virtual_tryons', label: 'Virtual Try-On', description: 'Sessions Virtual Try-On par mois', limit: 10, period: 'month', overage: 'block', unit: 'sessions' },
      { metric: 'try_on_screenshots', label: 'Screenshots Try-On', description: 'Screenshots Try-On par mois', limit: 20, period: 'month', overage: 'block', unit: 'screenshots' },
      { metric: 'team_members', label: 'Membres', description: "Membres de l'équipe", limit: 1, period: 'month', overage: 'block', unit: 'membres' },
    ],
    features: [
      { id: 'customizer_2d', label: 'Customizer 2D', enabled: true },
      { id: 'configurator_3d', label: 'Configurateur 3D', enabled: false },
      { id: 'virtual_try_on', label: 'Virtual Try-On', enabled: true, description: 'Basique (10/mois)' },
      { id: 'ar_export', label: 'AR/VR Export', enabled: false },
      { id: 'api_access', label: 'Accès API', enabled: false },
      { id: 'white_label', label: 'White Label', enabled: false },
      { id: 'advanced_analytics', label: 'Analytics avancés', enabled: false },
      { id: 'custom_export', label: 'Export personnalisé', enabled: false },
      { id: 'priority_support', label: 'Support prioritaire', enabled: false },
      { id: 'sso_saml', label: 'SSO/SAML', enabled: false },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    basePriceCents: 4900, // €49/month
    yearlyPriceCents: 46800, // €468/year (39/mo)
    headline: 'Pour les équipes qui scalent',
    limits: {
      teamMembers: 5,
      storageGb: 10,
      designsPerMonth: 200,
      maxProducts: 50,
      apiAccess: true,
      arEnabled: true,
      whiteLabel: false,
      advancedAnalytics: false,
      customExport: false,
      prioritySupport: true,
    },
    quotas: [
      { metric: 'designs_created', label: 'Designs', description: 'Designs créés par mois', limit: 200, period: 'month', overage: 'charge', overageRate: 40, unit: 'designs' },
      { metric: 'renders_2d', label: 'Rendus 2D', description: 'Rendus 2D par mois', limit: 500, period: 'month', overage: 'charge', overageRate: 15, unit: 'rendus' },
      { metric: 'renders_3d', label: 'Rendus 3D', description: 'Rendus 3D par mois', limit: 50, period: 'month', overage: 'charge', overageRate: 80, unit: 'rendus' },
      { metric: 'ai_generations', label: 'Générations IA', description: 'Générations IA par mois', limit: 100, period: 'month', overage: 'charge', overageRate: 60, unit: 'générations' },
      { metric: 'storage_gb', label: 'Stockage', description: 'Espace de stockage', limit: 10, period: 'month', overage: 'charge', overageRate: 40, unit: 'GB' },
      { metric: 'api_calls', label: 'Appels API', description: 'Appels API par mois', limit: 50000, period: 'month', overage: 'charge', overageRate: 1, unit: 'appels' },
      { metric: 'virtual_tryons', label: 'Virtual Try-On', description: 'Sessions Virtual Try-On par mois', limit: 1000, period: 'month', overage: 'charge', overageRate: 20, unit: 'sessions' },
      { metric: 'try_on_screenshots', label: 'Screenshots Try-On', description: 'Screenshots Try-On par mois', limit: 5000, period: 'month', overage: 'charge', overageRate: 5, unit: 'screenshots' },
      { metric: 'team_members', label: 'Membres', description: "Membres de l'équipe", limit: 5, period: 'month', overage: 'block', unit: 'membres' },
    ],
    features: [
      { id: 'customizer_2d', label: 'Customizer 2D', enabled: true },
      { id: 'configurator_3d', label: 'Configurateur 3D', enabled: true },
      { id: 'virtual_try_on', label: 'Virtual Try-On', enabled: true, description: '1 000/mois' },
      { id: 'ar_export', label: 'AR/VR Export', enabled: true },
      { id: 'api_access', label: 'Accès API', enabled: true },
      { id: 'white_label', label: 'White Label', enabled: false },
      { id: 'advanced_analytics', label: 'Analytics avancés', enabled: false },
      { id: 'custom_export', label: 'Export personnalisé', enabled: false },
      { id: 'priority_support', label: 'Support prioritaire', enabled: true },
      { id: 'sso_saml', label: 'SSO/SAML', enabled: false },
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    basePriceCents: 14900, // €149/month
    yearlyPriceCents: 142800, // €1428/year (119/mo)
    headline: 'Pour les équipes en croissance',
    limits: {
      teamMembers: 25,
      storageGb: 100,
      designsPerMonth: 1000,
      maxProducts: 500,
      apiAccess: true,
      arEnabled: true,
      whiteLabel: true,
      advancedAnalytics: true,
      customExport: true,
      prioritySupport: true,
    },
    quotas: [
      { metric: 'designs_created', label: 'Designs', description: 'Designs créés par mois', limit: 1000, period: 'month', overage: 'charge', overageRate: 30, unit: 'designs' },
      { metric: 'renders_2d', label: 'Rendus 2D', description: 'Rendus 2D par mois', limit: 2000, period: 'month', overage: 'charge', overageRate: 10, unit: 'rendus' },
      { metric: 'renders_3d', label: 'Rendus 3D', description: 'Rendus 3D par mois', limit: 200, period: 'month', overage: 'charge', overageRate: 60, unit: 'rendus' },
      { metric: 'ai_generations', label: 'Générations IA', description: 'Générations IA par mois', limit: 500, period: 'month', overage: 'charge', overageRate: 50, unit: 'générations' },
      { metric: 'storage_gb', label: 'Stockage', description: 'Espace de stockage', limit: 100, period: 'month', overage: 'charge', overageRate: 30, unit: 'GB' },
      { metric: 'api_calls', label: 'Appels API', description: 'Appels API par mois', limit: 200000, period: 'month', overage: 'charge', overageRate: 1, unit: 'appels' },
      { metric: 'virtual_tryons', label: 'Virtual Try-On', description: 'Sessions Virtual Try-On par mois', limit: 10000, period: 'month', overage: 'charge', overageRate: 10, unit: 'sessions' },
      { metric: 'try_on_screenshots', label: 'Screenshots Try-On', description: 'Screenshots Try-On par mois', limit: 50000, period: 'month', overage: 'charge', overageRate: 3, unit: 'screenshots' },
      { metric: 'team_members', label: 'Membres', description: "Membres de l'équipe", limit: 50, period: 'month', overage: 'block', unit: 'membres' },
    ],
    features: [
      { id: 'customizer_2d', label: 'Customizer 2D', enabled: true },
      { id: 'configurator_3d', label: 'Configurateur 3D', enabled: true },
      { id: 'virtual_try_on', label: 'Virtual Try-On', enabled: true, description: '10 000/mois' },
      { id: 'ar_export', label: 'AR/VR Export', enabled: true },
      { id: 'api_access', label: 'Accès API', enabled: true },
      { id: 'white_label', label: 'White Label', enabled: true },
      { id: 'advanced_analytics', label: 'Analytics avancés', enabled: true },
      { id: 'custom_export', label: 'Export personnalisé', enabled: true },
      { id: 'priority_support', label: 'Support prioritaire', enabled: true },
      { id: 'sso_saml', label: 'SSO/SAML', enabled: false },
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    basePriceCents: 49900, // €499/month
    yearlyPriceCents: 499000, // €4990/year
    headline: 'Solutions sur mesure',
    limits: {
      teamMembers: -1, // unlimited
      storageGb: -1,
      designsPerMonth: -1,
      maxProducts: -1,
      apiAccess: true,
      arEnabled: true,
      whiteLabel: true,
      advancedAnalytics: true,
      customExport: true,
      prioritySupport: true,
    },
    quotas: [
      { metric: 'designs_created', label: 'Designs', description: 'Designs créés par mois', limit: 99999, period: 'month', overage: 'charge', overageRate: 20, unit: 'designs' },
      { metric: 'renders_2d', label: 'Rendus 2D', description: 'Rendus 2D par mois', limit: 99999, period: 'month', overage: 'charge', overageRate: 5, unit: 'rendus' },
      { metric: 'renders_3d', label: 'Rendus 3D', description: 'Rendus 3D par mois', limit: 99999, period: 'month', overage: 'charge', overageRate: 40, unit: 'rendus' },
      { metric: 'ai_generations', label: 'Générations IA', description: 'Générations IA par mois', limit: 99999, period: 'month', overage: 'charge', overageRate: 40, unit: 'générations' },
      { metric: 'storage_gb', label: 'Stockage', description: 'Espace de stockage', limit: 500, period: 'month', overage: 'charge', overageRate: 20, unit: 'GB' },
      { metric: 'api_calls', label: 'Appels API', description: 'Appels API par mois', limit: 9999999, period: 'month', overage: 'charge', overageRate: 1, unit: 'appels' },
      { metric: 'virtual_tryons', label: 'Virtual Try-On', description: 'Sessions Virtual Try-On par mois', limit: 99999, period: 'month', overage: 'charge', overageRate: 5, unit: 'sessions' },
      { metric: 'try_on_screenshots', label: 'Screenshots Try-On', description: 'Screenshots Try-On par mois', limit: 99999, period: 'month', overage: 'charge', overageRate: 2, unit: 'screenshots' },
      { metric: 'team_members', label: 'Membres', description: "Membres de l'équipe", limit: 999, period: 'month', overage: 'block', unit: 'membres' },
    ],
    features: [
      { id: 'customizer_2d', label: 'Customizer 2D', enabled: true },
      { id: 'configurator_3d', label: 'Configurateur 3D', enabled: true },
      { id: 'virtual_try_on', label: 'Virtual Try-On', enabled: true, description: 'Illimité' },
      { id: 'ar_export', label: 'AR/VR Export', enabled: true },
      { id: 'api_access', label: 'Accès API', enabled: true },
      { id: 'white_label', label: 'White Label', enabled: true },
      { id: 'advanced_analytics', label: 'Analytics avancés', enabled: true },
      { id: 'custom_export', label: 'Export personnalisé', enabled: true },
      { id: 'priority_support', label: 'Support prioritaire', enabled: true },
      { id: 'sso_saml', label: 'SSO/SAML', enabled: true },
    ],
  },
};

export const PLAN_CATALOG: PlanCatalog = {
  plans: PLAN_DEFINITIONS,
  defaultPlan: 'free',
  availableTiers: ['free', 'pro', 'business', 'enterprise'],
};

export { PLAN_DEFINITIONS };

export function getPlanDefinition(plan: PlanTier): PlanDefinition {
  return PLAN_DEFINITIONS[plan] ?? PLAN_DEFINITIONS['free'];
}

export function listPlans(): PlanDefinition[] {
  return Object.values(PLAN_DEFINITIONS);
}

/**
 * Check if a limit value represents "unlimited"
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Format a limit value for display
 */
export function formatLimit(value: number): string {
  if (value === -1) return 'Illimité';
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toString();
}
