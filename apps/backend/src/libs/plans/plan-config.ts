/**
 * @fileoverview SINGLE SOURCE OF TRUTH - Configuration des plans Luneo (V2 - Agents IA).
 *
 * REGLES:
 * - Ce fichier est la SEULE source de verite pour les limites, quotas et pricing.
 * - Aucun autre service ne doit definir ses propres valeurs de plan.
 * - Toute modification de plan se fait ICI et se propage automatiquement.
 * - Les valeurs -1 signifient "illimite".
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

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  [PlanTier.FREE]: {
    tier: PlanTier.FREE,
    info: {
      name: 'Free',
      description: 'Découvrez Luneo gratuitement',
      features: ['1 agent IA', '50 conversations/mois', '1 base de connaissances', 'Widget chat'],
    },
    pricing: {
      monthlyPrice: 0,
      yearlyPrice: 0,
      basePriceCents: 0,
      commissionPercent: 0,
    },
    limits: {
      agentsLimit: 1,
      knowledgeBasesLimit: 1,
      conversationsPerMonth: 50,
      documentsLimit: 10,
      teamMembers: 1,
      storageGB: 0.5,
      apiAccess: false,
      advancedAnalytics: false,
      prioritySupport: false,
      whiteLabel: false,
      visualBuilder: false,
      emailChannel: false,
    },
    quotas: [
      { metric: 'conversations', limit: 50, period: 'month', overage: 'block' },
      { metric: 'messages_ai', limit: 500, period: 'month', overage: 'block' },
      { metric: 'documents_indexed', limit: 10, period: 'month', overage: 'block' },
      { metric: 'storage_gb', limit: 0.5, period: 'month', overage: 'block' },
      { metric: 'api_calls', limit: 0, period: 'month', overage: 'block' },
      { metric: 'team_members', limit: 1, period: 'month', overage: 'block' },
    ],
    agentLimits: {
      monthlyTokens: 50_000,
      monthlyRequests: 100,
      rateLimit: { requests: 10, windowMs: 60_000 },
    },
    monthlyCredits: 3,
    marketplaceCommissionPercent: 0,
  },

  [PlanTier.STARTER]: {
    tier: PlanTier.STARTER,
    info: {
      name: 'Starter',
      description: 'Parfait pour démarrer avec les agents IA',
      features: [
        '3 agents IA',
        '500 conversations/mois',
        '3 bases de connaissances',
        'Visual Builder',
        '3 membres',
      ],
    },
    pricing: {
      monthlyPrice: 29,
      yearlyPrice: 290,
      basePriceCents: 2_900,
      commissionPercent: 0,
    },
    limits: {
      agentsLimit: 3,
      knowledgeBasesLimit: 3,
      conversationsPerMonth: 500,
      documentsLimit: 50,
      teamMembers: 3,
      storageGB: 5,
      apiAccess: false,
      advancedAnalytics: false,
      prioritySupport: false,
      whiteLabel: false,
      visualBuilder: true,
      emailChannel: false,
    },
    quotas: [
      { metric: 'conversations', limit: 500, period: 'month', overage: 'charge', overageRate: 10 },
      { metric: 'messages_ai', limit: 5_000, period: 'month', overage: 'charge', overageRate: 2 },
      { metric: 'documents_indexed', limit: 50, period: 'month', overage: 'charge', overageRate: 20 },
      { metric: 'storage_gb', limit: 5, period: 'month', overage: 'charge', overageRate: 50 },
      { metric: 'api_calls', limit: 10_000, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'team_members', limit: 3, period: 'month', overage: 'block' },
    ],
    agentLimits: {
      monthlyTokens: 500_000,
      monthlyRequests: 1_000,
      rateLimit: { requests: 30, windowMs: 60_000 },
    },
    monthlyCredits: 10,
    marketplaceCommissionPercent: 0,
  },

  [PlanTier.PROFESSIONAL]: {
    tier: PlanTier.PROFESSIONAL,
    info: {
      name: 'Professional',
      description: 'Pour les équipes qui scalent',
      features: [
        '10 agents IA',
        '2 000 conversations/mois',
        '10 bases de connaissances',
        'Visual Builder',
        'Canal Email',
        'API access',
        '10 membres',
      ],
    },
    pricing: {
      monthlyPrice: 79,
      yearlyPrice: 790,
      basePriceCents: 7_900,
      commissionPercent: 0,
    },
    limits: {
      agentsLimit: 10,
      knowledgeBasesLimit: 10,
      conversationsPerMonth: 2_000,
      documentsLimit: 200,
      teamMembers: 10,
      storageGB: 25,
      apiAccess: true,
      advancedAnalytics: false,
      prioritySupport: true,
      whiteLabel: false,
      visualBuilder: true,
      emailChannel: true,
    },
    quotas: [
      { metric: 'conversations', limit: 2_000, period: 'month', overage: 'charge', overageRate: 8 },
      { metric: 'messages_ai', limit: 20_000, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'documents_indexed', limit: 200, period: 'month', overage: 'charge', overageRate: 15 },
      { metric: 'storage_gb', limit: 25, period: 'month', overage: 'charge', overageRate: 40 },
      { metric: 'api_calls', limit: 50_000, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'team_members', limit: 10, period: 'month', overage: 'block' },
    ],
    agentLimits: {
      monthlyTokens: 2_000_000,
      monthlyRequests: 5_000,
      rateLimit: { requests: 60, windowMs: 60_000 },
    },
    monthlyCredits: 100,
    marketplaceCommissionPercent: 0,
  },

  [PlanTier.BUSINESS]: {
    tier: PlanTier.BUSINESS,
    info: {
      name: 'Business',
      description: 'Pour les entreprises en croissance',
      features: [
        '50 agents IA',
        '10 000 conversations/mois',
        'Bases de connaissances illimitées',
        'Analytics avancés',
        'White label',
        '50 membres',
      ],
    },
    pricing: {
      monthlyPrice: 199,
      yearlyPrice: 1_990,
      basePriceCents: 19_900,
      commissionPercent: 0,
    },
    limits: {
      agentsLimit: 50,
      knowledgeBasesLimit: -1,
      conversationsPerMonth: 10_000,
      documentsLimit: 1_000,
      teamMembers: 50,
      storageGB: 100,
      apiAccess: true,
      advancedAnalytics: true,
      prioritySupport: true,
      whiteLabel: true,
      visualBuilder: true,
      emailChannel: true,
    },
    quotas: [
      { metric: 'conversations', limit: 10_000, period: 'month', overage: 'charge', overageRate: 5 },
      { metric: 'messages_ai', limit: 100_000, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'documents_indexed', limit: 1_000, period: 'month', overage: 'charge', overageRate: 10 },
      { metric: 'storage_gb', limit: 100, period: 'month', overage: 'charge', overageRate: 30 },
      { metric: 'api_calls', limit: 200_000, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'team_members', limit: 50, period: 'month', overage: 'block' },
    ],
    agentLimits: {
      monthlyTokens: 5_000_000,
      monthlyRequests: 10_000,
      rateLimit: { requests: 90, windowMs: 60_000 },
    },
    monthlyCredits: 500,
    marketplaceCommissionPercent: 0,
  },

  [PlanTier.ENTERPRISE]: {
    tier: PlanTier.ENTERPRISE,
    info: {
      name: 'Enterprise',
      description: 'Solutions sur mesure',
      features: [
        'Agents illimités',
        'Conversations illimitées',
        'Support dédié',
        'SLA garanti',
        'Formation',
        'Intégration personnalisée',
      ],
    },
    pricing: {
      monthlyPrice: 499,
      yearlyPrice: 4_990,
      basePriceCents: 49_900,
      commissionPercent: 0,
    },
    limits: {
      agentsLimit: -1,
      knowledgeBasesLimit: -1,
      conversationsPerMonth: -1,
      documentsLimit: -1,
      teamMembers: -1,
      storageGB: -1,
      apiAccess: true,
      advancedAnalytics: true,
      prioritySupport: true,
      whiteLabel: true,
      visualBuilder: true,
      emailChannel: true,
    },
    quotas: [
      { metric: 'conversations', limit: 99_999, period: 'month', overage: 'charge', overageRate: 3 },
      { metric: 'messages_ai', limit: 99_999, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'documents_indexed', limit: 99_999, period: 'month', overage: 'charge', overageRate: 5 },
      { metric: 'storage_gb', limit: 500, period: 'month', overage: 'charge', overageRate: 20 },
      { metric: 'api_calls', limit: 9_999_999, period: 'month', overage: 'charge', overageRate: 1 },
      { metric: 'team_members', limit: 999, period: 'month', overage: 'block' },
    ],
    agentLimits: {
      monthlyTokens: -1,
      monthlyRequests: -1,
      rateLimit: { requests: 120, windowMs: 60_000 },
    },
    monthlyCredits: 99_999,
    marketplaceCommissionPercent: 0,
  },
};

export const ADDON_BONUSES: Record<string, AddonBonus> = {
  extra_agents: { agentsLimit: 5 },
  extra_conversations: { conversationsPerMonth: 1_000 },
  extra_storage: { storageGB: 10 },
  extra_team_members: { teamMembers: 5 },
};

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

export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[tier] ?? PLAN_CONFIGS[PlanTier.FREE];
}

export function getFeatureLimits(tier: PlanTier): FeatureLimits {
  return getPlanConfig(tier).limits;
}

export function getAgentLimits(tier: PlanTier): AgentLimits {
  return getPlanConfig(tier).agentLimits;
}

export function getUsageQuotas(tier: PlanTier): UsageQuota[] {
  return getPlanConfig(tier).quotas;
}

export function getPlanPricing(tier: PlanTier): PlanPricing {
  return getPlanConfig(tier).pricing;
}

export function getPlanInfo(tier: PlanTier): PlanInfo {
  return getPlanConfig(tier).info;
}

export function getMonthlyCredits(tier: PlanTier): number {
  return getPlanConfig(tier).monthlyCredits;
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function getMarketplaceCommission(planTier: string): number {
  const config = getPlanConfig(normalizePlanTier(planTier));
  return config.marketplaceCommissionPercent ?? 0;
}
