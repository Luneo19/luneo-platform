/**
 * @fileoverview SINGLE SOURCE OF TRUTH - Configuration des plans Luneo.
 *
 * REGLES:
 * - Ce fichier est la SEULE source de verite pour les limites, quotas et pricing.
 * - Aucun autre service ne doit definir ses propres valeurs de plan.
 * - Toute modification de plan se fait ICI et se propage automatiquement.
 * - Les valeurs -1 signifient "illimite".
 *
 * ARCHITECTURE:
 * - plans.service.ts        -> importe PLAN_CONFIGS pour FeatureLimits
 * - quotas.service.ts       -> importe PLAN_CONFIGS pour UsageQuotas
 * - billing.service.ts      -> importe PLAN_CONFIGS pour limites et pricing
 * - limits-config.service.ts -> importe PLAN_CONFIGS pour AgentLimits
 */

import {
  type AddonBonus,
  type AgentLimits,
  type FeatureLimits,
  type PlanConfig,
  type PlanInfo,
  type PlanPricing,
  PlanTier,
  type UsageQuota,
} from './plan-config.types';

// ============================================================================
// PLAN CONFIGURATIONS
// ============================================================================

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  // --------------------------------------------------------------------------
  // FREE
  // --------------------------------------------------------------------------
  [PlanTier.FREE]: {
    tier: PlanTier.FREE,
    info: {
      name: 'Free',
      description: 'Découvrez Luneo gratuitement',
      features: ['5 designs/mois', '2 produits', 'Support email'],
    },
    pricing: {
      monthlyPrice: 0,
      yearlyPrice: 0,
      basePriceCents: 0,
      commissionPercent: 10,
    },
    limits: {
      designsPerMonth: 5,
      teamMembers: 1,
      storageGB: 0.5,
      maxProducts: 2,
      apiAccess: false,
      advancedAnalytics: false,
      prioritySupport: false,
      customExport: false,
      whiteLabel: false,
      arEnabled: false,
    },
    quotas: [
      { metric: 'designs_created', limit: 5, period: 'month', overage: 'block' },
      { metric: 'renders_2d', limit: 10, period: 'month', overage: 'block' },
      { metric: 'renders_3d', limit: 0, period: 'month', overage: 'block' },
      { metric: 'ai_generations', limit: 3, period: 'month', overage: 'block' },
      { metric: 'storage_gb', limit: 0.5, period: 'month', overage: 'block' },
      { metric: 'api_calls', limit: 0, period: 'month', overage: 'block' },
      { metric: 'team_members', limit: 1, period: 'month', overage: 'block' },
      { metric: 'virtual_tryons', limit: 10, period: 'month', overage: 'block' },
      { metric: 'try_on_screenshots', limit: 20, period: 'month', overage: 'block' },
      { metric: 'ar_sessions', limit: 0, period: 'month', overage: 'block' },
      { metric: 'ar_models', limit: 0, period: 'month', overage: 'block' },
      { metric: 'ar_conversions_3d', limit: 0, period: 'month', overage: 'block' },
      { metric: 'ar_qr_codes', limit: 0, period: 'month', overage: 'block' },
    ],
    agentLimits: {
      monthlyTokens: 50_000,
      monthlyRequests: 100,
      rateLimit: { requests: 10, windowMs: 60_000 },
    },
    monthlyCredits: 3,
    marketplaceCommissionPercent: 30,
  },

  // --------------------------------------------------------------------------
  // STARTER
  // --------------------------------------------------------------------------
  [PlanTier.STARTER]: {
    tier: PlanTier.STARTER,
    info: {
      name: 'Starter',
      description: 'Parfait pour démarrer',
      features: [
        '50 designs/mois',
        '10 produits',
        '3 membres',
        'Support email',
      ],
    },
    pricing: {
      monthlyPrice: 19,
      yearlyPrice: 190,
      basePriceCents: 1_900, // 19€ * 100 centimes
      commissionPercent: 5,
    },
    limits: {
      designsPerMonth: 50,
      teamMembers: 3,
      storageGB: 5,
      maxProducts: 10,
      apiAccess: false, // Public REST API keys disabled; api_calls quota is for widget/embed usage only
      advancedAnalytics: false,
      prioritySupport: false,
      customExport: false,
      whiteLabel: false,
      arEnabled: false,
    },
    quotas: [
      { metric: 'designs_created', limit: 50, period: 'month', overage: 'charge', overageRate: 50 },
      { metric: 'renders_2d', limit: 100, period: 'month', overage: 'charge', overageRate: 20 },
      { metric: 'renders_3d', limit: 10, period: 'month', overage: 'charge', overageRate: 100 },
      { metric: 'ai_generations', limit: 20, period: 'month', overage: 'charge', overageRate: 75 },
      { metric: 'storage_gb', limit: 5, period: 'month', overage: 'charge', overageRate: 50 },
      { metric: 'api_calls', limit: 10_000, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'team_members', limit: 3, period: 'month', overage: 'block' },
      { metric: 'virtual_tryons', limit: 100, period: 'month', overage: 'charge', overageRate: 30 },
      { metric: 'try_on_screenshots', limit: 500, period: 'month', overage: 'charge', overageRate: 10 },
      { metric: 'ar_sessions', limit: 0, period: 'month', overage: 'block' },
      { metric: 'ar_models', limit: 0, period: 'month', overage: 'block' },
      { metric: 'ar_conversions_3d', limit: 0, period: 'month', overage: 'block' },
      { metric: 'ar_qr_codes', limit: 0, period: 'month', overage: 'block' },
    ],
    agentLimits: {
      monthlyTokens: 500_000,
      monthlyRequests: 1_000,
      rateLimit: { requests: 30, windowMs: 60_000 },
    },
    monthlyCredits: 10,
    marketplaceCommissionPercent: 20,
  },

  // --------------------------------------------------------------------------
  // PROFESSIONAL
  // --------------------------------------------------------------------------
  [PlanTier.PROFESSIONAL]: {
    tier: PlanTier.PROFESSIONAL,
    info: {
      name: 'Professional',
      description: 'Pour les créateurs professionnels',
      features: [
        '200 designs/mois',
        '50 produits',
        '10 membres',
        'API access',
        'AR enabled',
        'White label',
      ],
    },
    pricing: {
      monthlyPrice: 49,
      yearlyPrice: 490,
      basePriceCents: 4_900, // 49€ * 100 centimes
      commissionPercent: 3,
    },
    limits: {
      designsPerMonth: 200,
      teamMembers: 10,
      storageGB: 25,
      maxProducts: 50,
      apiAccess: true,
      advancedAnalytics: false,
      prioritySupport: true,
      customExport: false,
      whiteLabel: true,
      arEnabled: true,
    },
    quotas: [
      { metric: 'designs_created', limit: 200, period: 'month', overage: 'charge', overageRate: 40 },
      { metric: 'renders_2d', limit: 500, period: 'month', overage: 'charge', overageRate: 15 },
      { metric: 'renders_3d', limit: 50, period: 'month', overage: 'charge', overageRate: 80 },
      { metric: 'ai_generations', limit: 100, period: 'month', overage: 'charge', overageRate: 60 },
      { metric: 'storage_gb', limit: 25, period: 'month', overage: 'charge', overageRate: 40 },
      { metric: 'api_calls', limit: 50_000, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'team_members', limit: 10, period: 'month', overage: 'block' },
      { metric: 'virtual_tryons', limit: 1_000, period: 'month', overage: 'charge', overageRate: 20 },
      { metric: 'try_on_screenshots', limit: 5_000, period: 'month', overage: 'charge', overageRate: 5 },
      { metric: 'ar_sessions', limit: 1_000, period: 'month', overage: 'charge', overageRate: 5 },
      { metric: 'ar_models', limit: 20, period: 'month', overage: 'charge', overageRate: 50 },
      { metric: 'ar_conversions_3d', limit: 50, period: 'month', overage: 'charge', overageRate: 80 },
      { metric: 'ar_qr_codes', limit: 20, period: 'month', overage: 'charge', overageRate: 25 },
    ],
    agentLimits: {
      monthlyTokens: 2_000_000,
      monthlyRequests: 5_000,
      rateLimit: { requests: 60, windowMs: 60_000 },
    },
    monthlyCredits: 100,
    marketplaceCommissionPercent: 15,
  },

  // --------------------------------------------------------------------------
  // BUSINESS
  // --------------------------------------------------------------------------
  [PlanTier.BUSINESS]: {
    tier: PlanTier.BUSINESS,
    info: {
      name: 'Business',
      description: 'Pour les équipes en croissance',
      features: [
        '1000 designs/mois',
        '500 produits',
        '50 membres',
        'Analytics avancés',
        'Export personnalisé',
      ],
    },
    pricing: {
      monthlyPrice: 99,
      yearlyPrice: 990,
      basePriceCents: 9_900, // 99€ * 100 centimes
      commissionPercent: 2,
    },
    limits: {
      designsPerMonth: 1_000,
      teamMembers: 50,
      storageGB: 100,
      maxProducts: 500,
      apiAccess: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customExport: true,
      whiteLabel: true,
      arEnabled: true,
    },
    quotas: [
      { metric: 'designs_created', limit: 1_000, period: 'month', overage: 'charge', overageRate: 30 },
      { metric: 'renders_2d', limit: 2_000, period: 'month', overage: 'charge', overageRate: 10 },
      { metric: 'renders_3d', limit: 200, period: 'month', overage: 'charge', overageRate: 60 },
      { metric: 'ai_generations', limit: 500, period: 'month', overage: 'charge', overageRate: 50 },
      { metric: 'storage_gb', limit: 100, period: 'month', overage: 'charge', overageRate: 30 },
      { metric: 'api_calls', limit: 200_000, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'team_members', limit: 50, period: 'month', overage: 'block' },
      { metric: 'virtual_tryons', limit: 10_000, period: 'month', overage: 'charge', overageRate: 10 },
      { metric: 'try_on_screenshots', limit: 50_000, period: 'month', overage: 'charge', overageRate: 3 },
      { metric: 'ar_sessions', limit: 10_000, period: 'month', overage: 'charge', overageRate: 3 },
      { metric: 'ar_models', limit: 100, period: 'month', overage: 'charge', overageRate: 40 },
      { metric: 'ar_conversions_3d', limit: 200, period: 'month', overage: 'charge', overageRate: 60 },
      { metric: 'ar_qr_codes', limit: 100, period: 'month', overage: 'charge', overageRate: 15 },
    ],
    agentLimits: {
      monthlyTokens: 5_000_000,
      monthlyRequests: 10_000,
      rateLimit: { requests: 90, windowMs: 60_000 },
    },
    monthlyCredits: 500,
    marketplaceCommissionPercent: 10,
  },

  // --------------------------------------------------------------------------
  // ENTERPRISE
  // --------------------------------------------------------------------------
  [PlanTier.ENTERPRISE]: {
    tier: PlanTier.ENTERPRISE,
    info: {
      name: 'Enterprise',
      description: 'Solutions sur mesure',
      features: [
        'Illimité',
        'Support dédié',
        'SLA garanti',
        'Formation',
        'Intégration personnalisée',
      ],
    },
    pricing: {
      monthlyPrice: 299,
      yearlyPrice: 2_990,
      basePriceCents: 29_900, // 299€ * 100 centimes
      commissionPercent: 1,
    },
    limits: {
      designsPerMonth: -1,
      teamMembers: -1,
      storageGB: -1,
      maxProducts: -1,
      apiAccess: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customExport: true,
      whiteLabel: true,
      arEnabled: true,
    },
    quotas: [
      { metric: 'designs_created', limit: 99_999, period: 'month', overage: 'charge', overageRate: 20 },
      { metric: 'renders_2d', limit: 99_999, period: 'month', overage: 'charge', overageRate: 5 },
      { metric: 'renders_3d', limit: 99_999, period: 'month', overage: 'charge', overageRate: 40 },
      { metric: 'ai_generations', limit: 99_999, period: 'month', overage: 'charge', overageRate: 40 },
      { metric: 'storage_gb', limit: 500, period: 'month', overage: 'charge', overageRate: 20 },
      { metric: 'api_calls', limit: 9_999_999, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'team_members', limit: 999, period: 'month', overage: 'block' },
      { metric: 'virtual_tryons', limit: 99_999, period: 'month', overage: 'charge', overageRate: 5 },
      { metric: 'try_on_screenshots', limit: 99_999, period: 'month', overage: 'charge', overageRate: 2 },
      { metric: 'ar_sessions', limit: 99_999, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'ar_models', limit: 99_999, period: 'month', overage: 'charge', overageRate: 20 },
      { metric: 'ar_conversions_3d', limit: 99_999, period: 'month', overage: 'charge', overageRate: 40 },
      { metric: 'ar_qr_codes', limit: 99_999, period: 'month', overage: 'charge', overageRate: 5 },
    ],
    agentLimits: {
      monthlyTokens: -1,
      monthlyRequests: -1,
      rateLimit: { requests: 120, windowMs: 60_000 },
    },
    monthlyCredits: 99_999,
    marketplaceCommissionPercent: 5,
  },
};

// ============================================================================
// ADD-ON BONUSES
// ============================================================================

/**
 * Bonus ajoutes par chaque unite d'add-on aux limites du plan.
 * Les add-ons non listes ici (ex: extra_api_calls, extra_renders_3d)
 * sont geres par le usage metering et ne modifient pas les FeatureLimits.
 */
export const ADDON_BONUSES: Record<string, AddonBonus> = {
  extra_designs: { designsPerMonth: 100 },
  extra_storage: { storageGB: 10 },
  extra_team_members: { teamMembers: 5 },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalise un identifiant de plan en PlanTier valide.
 * Gere les alias courants (pro, start, ent, trial, etc.).
 */
export function normalizePlanTier(planId: string | null | undefined): PlanTier {
  if (!planId) return PlanTier.FREE;

  const normalized = planId.toLowerCase().trim();

  const ALIASES: Record<string, PlanTier> = {
    free: PlanTier.FREE,
    trial: PlanTier.FREE,
    starter: PlanTier.STARTER,
    start: PlanTier.STARTER,
    professional: PlanTier.PROFESSIONAL,
    pro: PlanTier.PROFESSIONAL,
    business: PlanTier.BUSINESS,
    biz: PlanTier.BUSINESS,
    enterprise: PlanTier.ENTERPRISE,
    ent: PlanTier.ENTERPRISE,
  };

  return ALIASES[normalized] ?? PlanTier.FREE;
}

/**
 * Recupere la config complete d'un plan.
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[tier] ?? PLAN_CONFIGS[PlanTier.FREE];
}

/**
 * Recupere les FeatureLimits d'un plan.
 */
export function getFeatureLimits(tier: PlanTier): FeatureLimits {
  return getPlanConfig(tier).limits;
}

/**
 * Recupere les AgentLimits d'un plan.
 */
export function getAgentLimits(tier: PlanTier): AgentLimits {
  return getPlanConfig(tier).agentLimits;
}

/**
 * Recupere les UsageQuotas d'un plan.
 */
export function getUsageQuotas(tier: PlanTier): UsageQuota[] {
  return getPlanConfig(tier).quotas;
}

/**
 * Recupere le PlanPricing d'un plan.
 */
export function getPlanPricing(tier: PlanTier): PlanPricing {
  return getPlanConfig(tier).pricing;
}

/**
 * Recupere le PlanInfo d'un plan.
 */
export function getPlanInfo(tier: PlanTier): PlanInfo {
  return getPlanConfig(tier).info;
}

/**
 * Recupere les credits mensuels inclus dans le plan (refill a chaque renouvellement).
 */
export function getMonthlyCredits(tier: PlanTier): number {
  return getPlanConfig(tier).monthlyCredits;
}

/**
 * Verifie si une valeur represente "illimite".
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Returns the marketplace commission rate (platform take) in percent for a given plan tier.
 * Free=30%, Starter=20%, Professional=15%, Business=10%, Enterprise=5%.
 */
export function getMarketplaceCommission(planTier: string): number {
  const config = getPlanConfig(normalizePlanTier(planTier));
  return config.marketplaceCommissionPercent ?? 30;
}
