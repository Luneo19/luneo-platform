/**
 * @fileoverview Types centralises pour la configuration des plans Luneo.
 *
 * SINGLE SOURCE OF TRUTH pour toutes les definitions de types
 * liees aux plans d'abonnement. Aucun autre fichier ne doit
 * redefinir ces interfaces.
 */

// ============================================================================
// PLAN TIERS
// ============================================================================

/**
 * Tiers de plans disponibles.
 * Synchronise avec l'enum SubscriptionPlan dans Prisma.
 * Tous les tiers (FREE/STARTER/PROFESSIONAL/BUSINESS/ENTERPRISE)
 * sont presents dans l'enum Prisma SubscriptionPlan.
 */
export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

// ============================================================================
// FEATURE LIMITS (ce qu'un plan permet)
// ============================================================================

/**
 * Limites fonctionnelles par plan.
 * Valeurs numeriques: -1 = illimite.
 */
export interface FeatureLimits {
  agentsLimit: number;
  knowledgeBasesLimit: number;
  conversationsPerMonth: number;
  documentsLimit: number;
  teamMembers: number;
  storageGB: number;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  visualBuilder: boolean;
  emailChannel: boolean;
}

// ============================================================================
// USAGE QUOTAS (metriques avec overage)
// ============================================================================

export type OveragePolicy = 'charge' | 'block';

export interface UsageQuota {
  metric: string;
  limit: number;
  period: 'month' | 'day';
  overage: OveragePolicy;
  /** Cout en centimes par unite depassee */
  overageRate?: number;
}

// ============================================================================
// AGENT / AI LIMITS
// ============================================================================

export interface AgentLimits {
  /** Tokens mensuels. -1 = illimite */
  monthlyTokens: number;
  /** Requetes mensuelles. -1 = illimite */
  monthlyRequests: number;
  rateLimit: {
    /** Requetes par fenetre */
    requests: number;
    /** Fenetre en millisecondes */
    windowMs: number;
  };
}

// ============================================================================
// PRICING
// ============================================================================

export interface PlanPricing {
  /** Prix mensuel en euros (entier) */
  monthlyPrice: number;
  /** Prix annuel en euros (entier) */
  yearlyPrice: number;
  /** Prix mensuel de base en centimes (pour usage-billing) */
  basePriceCents: number;
  /** Commission Luneo en pourcentage */
  commissionPercent: number;
}

// ============================================================================
// PLAN INFO (affichage UI)
// ============================================================================

export interface PlanInfo {
  name: string;
  description: string;
  features: string[];
}

// ============================================================================
// ADD-ONS
// ============================================================================

export interface AddonBonus {
  agentsLimit?: number;
  storageGB?: number;
  teamMembers?: number;
  conversationsPerMonth?: number;
}

export interface ActiveAddon {
  type: string;
  quantity: number;
  stripePriceId?: string;
}

// ============================================================================
// PLAN CONFIG COMPLET
// ============================================================================

/**
 * Configuration complete d'un plan.
 * Chaque plan est entierement decrit par cette interface.
 */
export interface PlanConfig {
  tier: PlanTier;
  info: PlanInfo;
  pricing: PlanPricing;
  limits: FeatureLimits;
  quotas: UsageQuota[];
  agentLimits: AgentLimits;
  /** Monthly AI credits included in the plan (refilled on subscription renewal). -1 = unlimited. */
  monthlyCredits: number;
  /** Marketplace commission rate (platform take) in percent. Used when seller sells on marketplace. */
  marketplaceCommissionPercent?: number;
}
