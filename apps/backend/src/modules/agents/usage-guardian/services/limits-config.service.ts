/**
 * @fileoverview Configuration des limites par plan pour les agents AI.
 * @module LimitsConfigService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Configuration centralisée via @/libs/plans (SINGLE SOURCE OF TRUTH)
 * - ✅ Validation des limites
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PLAN_CONFIGS,
  normalizePlanTier,
  isUnlimited as checkUnlimited,
  type AgentLimits,
  PlanTier,
} from '@/libs/plans';

// Re-export AgentLimits as PlanLimits for backward compatibility
export type PlanLimits = AgentLimits;
export type PlanId = 'free' | 'starter' | 'professional' | 'enterprise';

/**
 * Agent limits derived from the centralized plan config.
 * Source: @/libs/plans/plan-config.ts (SINGLE SOURCE OF TRUTH)
 */
const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: PLAN_CONFIGS[PlanTier.FREE].agentLimits,
  starter: PLAN_CONFIGS[PlanTier.STARTER].agentLimits,
  professional: PLAN_CONFIGS[PlanTier.PROFESSIONAL].agentLimits,
  enterprise: PLAN_CONFIGS[PlanTier.ENTERPRISE].agentLimits,
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class LimitsConfigService {
  private readonly logger = new Logger(LimitsConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Récupère les limites pour un plan donné
   */
  getLimits(planId: string | null | undefined): PlanLimits {
    // Normaliser le planId
    const normalizedPlanId = this.normalizePlanId(planId);

    const limits = PLAN_LIMITS[normalizedPlanId];

    if (!limits) {
      this.logger.warn(`Unknown plan ${planId}, using free plan limits`);
      return PLAN_LIMITS.free;
    }

    return limits;
  }

  /**
   * Vérifie si une limite est illimitée
   */
  isUnlimited(value: number): boolean {
    return checkUnlimited(value);
  }

  /**
   * Normalise un planId en PlanId valide.
   * Delegue a normalizePlanTier (source unique) et mappe vers PlanId.
   */
  private normalizePlanId(planId: string | null | undefined): PlanId {
    const tier = normalizePlanTier(planId);
    // Map PlanTier -> PlanId (PlanId n'a pas 'business', on fallback sur 'professional')
    const tierToPlanId: Record<string, PlanId> = {
      [PlanTier.FREE]: 'free',
      [PlanTier.STARTER]: 'starter',
      [PlanTier.PROFESSIONAL]: 'professional',
      [PlanTier.BUSINESS]: 'professional',
      [PlanTier.ENTERPRISE]: 'enterprise',
    };
    return tierToPlanId[tier] ?? 'free';
  }

  /**
   * Calcule le pourcentage d'utilisation
   */
  calculateUsagePercent(used: number, limit: number): number {
    if (this.isUnlimited(limit)) {
      return 0; // Pas de pourcentage si illimité
    }

    if (limit === 0) {
      return 100; // Si limite = 0, on considère 100% utilisé
    }

    return Math.min(100, Math.round((used / limit) * 100));
  }

  /**
   * Vérifie si un quota est dépassé
   */
  isQuotaExceeded(used: number, limit: number): boolean {
    if (this.isUnlimited(limit)) {
      return false; // Jamais dépassé si illimité
    }

    return used >= limit;
  }

  /**
   * Vérifie si un quota est proche de la limite (80%)
   */
  isQuotaNearLimit(used: number, limit: number, threshold: number = 0.8): boolean {
    if (this.isUnlimited(limit)) {
      return false;
    }

    return used >= limit * threshold;
  }
}
