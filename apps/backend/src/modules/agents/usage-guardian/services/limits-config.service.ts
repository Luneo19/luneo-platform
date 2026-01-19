/**
 * @fileoverview Configuration des limites par plan
 * @module LimitsConfigService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Configuration centralisée
 * - ✅ Validation des limites
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ============================================================================
// TYPES
// ============================================================================

export interface PlanLimits {
  monthlyTokens: number; // -1 = illimité
  monthlyRequests: number; // -1 = illimité
  rateLimit: {
    requests: number; // Requêtes par fenêtre
    windowMs: number; // Fenêtre en millisecondes
  };
}

export type PlanId = 'free' | 'starter' | 'professional' | 'enterprise';

// ============================================================================
// CONFIGURATION DES LIMITES PAR PLAN
// ============================================================================

const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    monthlyTokens: 50000,
    monthlyRequests: 100,
    rateLimit: {
      requests: 10,
      windowMs: 60000, // 1 minute
    },
  },
  starter: {
    monthlyTokens: 500000,
    monthlyRequests: 1000,
    rateLimit: {
      requests: 30,
      windowMs: 60000, // 1 minute
    },
  },
  professional: {
    monthlyTokens: 2000000,
    monthlyRequests: 5000,
    rateLimit: {
      requests: 60,
      windowMs: 60000, // 1 minute
    },
  },
  enterprise: {
    monthlyTokens: -1, // Illimité
    monthlyRequests: -1, // Illimité
    rateLimit: {
      requests: 120,
      windowMs: 60000, // 1 minute
    },
  },
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
    return value === -1;
  }

  /**
   * Normalise un planId en PlanId valide
   */
  private normalizePlanId(planId: string | null | undefined): PlanId {
    if (!planId) {
      return 'free';
    }

    const normalized = planId.toLowerCase().trim();

    if (normalized === 'pro' || normalized === 'professional') {
      return 'professional';
    }

    if (normalized === 'starter' || normalized === 'start') {
      return 'starter';
    }

    if (normalized === 'enterprise' || normalized === 'ent') {
      return 'enterprise';
    }

    if (normalized === 'free' || normalized === 'trial') {
      return 'free';
    }

    // Par défaut, free
    return 'free';
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
