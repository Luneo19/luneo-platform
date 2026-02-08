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
 * Note: BUSINESS n'est pas dans l'enum Prisma (FREE/STARTER/PROFESSIONAL/ENTERPRISE)
 * mais est utilise en interne pour la logique de pricing.
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
  designsPerMonth: number;
  teamMembers: number;
  storageGB: number;
  maxProducts: number;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customExport: boolean;
  whiteLabel: boolean;
  arEnabled: boolean;
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
  designsPerMonth?: number;
  storageGB?: number;
  teamMembers?: number;
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
}
