/**
 * @fileoverview Service helper pour intégrer Usage Guardian et AI Monitor
 * @module AgentUsageGuardService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Vérification avant chaque appel IA
 * - ✅ Tracking après chaque appel
 * - ✅ Gestion d'erreurs complète
 * - ✅ Logger au lieu de console.log
 */

import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { QuotaManagerService, QuotaCheckResult } from '../usage-guardian/services/quota-manager.service';
import { RateLimiterService, RateLimitCheckResult } from '../usage-guardian/services/rate-limiter.service';
import { CostCalculatorService } from '../usage-guardian/services/cost-calculator.service';
import { TrackerService } from '../ai-monitor/services/tracker.service';
import { LoggerService } from '../ai-monitor/services/logger.service';
import { AlertsService } from '../ai-monitor/services/alerts.service';

// ============================================================================
// TYPES
// ============================================================================

export interface UsageGuardCheckResult {
  allowed: boolean;
  quota: QuotaCheckResult['quota'];
  rateLimit: RateLimitCheckResult;
  estimatedCostCents?: number;
  reason?: string;
}

export interface UsageGuardUpdate {
  tokens: { input: number; output: number };
  costCents: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AgentUsageGuardService {
  private readonly logger = new Logger(AgentUsageGuardService.name);

  constructor(
    private readonly quotaManager: QuotaManagerService,
    private readonly rateLimiter: RateLimiterService,
    private readonly costCalculator: CostCalculatorService,
    private readonly tracker: TrackerService,
    private readonly aiLogger: LoggerService,
    private readonly alerts: AlertsService,
  ) {}

  /**
   * Expose le costCalculator pour utilisation dans les agents
   */
  getCostCalculator(): CostCalculatorService {
    return this.costCalculator;
  }

  /**
   * Vérifie les quotas et rate limits avant un appel IA
   */
  async checkUsageBeforeCall(
    brandId: string | null | undefined,
    userId: string | null | undefined,
    planId: string | null | undefined,
    estimatedTokens?: number,
    provider?: string,
    model?: string,
  ): Promise<UsageGuardCheckResult> {
    const startTime = Date.now();

    try {
      // 1. Vérifier les quotas
      const quotaCheck = await this.quotaManager.checkQuota(
        brandId,
        userId,
        planId,
        estimatedTokens,
      );

      if (!quotaCheck.allowed) {
        this.aiLogger.logWarn('Quota check failed', {
          brandId,
          userId,
          reason: quotaCheck.reason,
        });

        // Vérifier les alertes
        await this.alerts.checkQuotaAlerts(brandId, userId, planId);

        throw new BadRequestException(
          quotaCheck.reason || 'Quota exceeded',
        );
      }

      // 2. Vérifier le rate limit
      const rateLimitCheck = await this.rateLimiter.checkRateLimit(
        brandId,
        userId,
        planId,
      );

      if (!rateLimitCheck.allowed) {
        this.aiLogger.logWarn('Rate limit check failed', {
          brandId,
          userId,
          reason: rateLimitCheck.reason,
        });

        throw new HttpException(
          rateLimitCheck.reason || 'Rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // 3. Estimer le coût si provider/model fournis
      let estimatedCostCents: number | undefined;
      if (provider && model && estimatedTokens) {
        const estimate = this.costCalculator.estimateCost(
          provider,
          model,
          estimatedTokens,
          Math.floor(estimatedTokens * 0.3), // Estimation: 30% output tokens
        );
        estimatedCostCents = estimate.estimatedCostCents;
      }

      const duration = Date.now() - startTime;
      this.aiLogger.logDebug('Usage guard check completed', {
        brandId,
        userId,
        durationMs: duration,
        allowed: true,
      });

      return {
        allowed: true,
        quota: quotaCheck.quota,
        rateLimit: rateLimitCheck,
        estimatedCostCents,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof BadRequestException || (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS)) {
        throw error; // Re-throw les erreurs de quota/rate limit
      }

      this.aiLogger.logError('Usage guard check failed', error, {
        brandId,
        userId,
        durationMs: duration,
      });

      throw new BadRequestException('Usage check failed');
    }
  }

  /**
   * Met à jour les quotas et track l'usage après un appel IA
   */
  async updateUsageAfterCall(
    brandId: string | null | undefined,
    userId: string | null | undefined,
    agentId: string | null | undefined,
    update: UsageGuardUpdate,
    provider: string,
    model: string,
    operation: 'chat' | 'completion' | 'embedding' | 'image_generation' = 'chat',
  ): Promise<void> {
    try {
      const totalTokens = update.tokens.input + update.tokens.output;

      // 1. Mettre à jour les quotas
      await this.quotaManager.updateQuota(brandId, userId, {
        tokens: totalTokens,
        requests: 1,
      });

      // 2. Tracker l'appel
      if (update.success) {
        await this.tracker.trackSuccess(
          brandId,
          userId,
          agentId,
          model,
          provider,
          operation,
          update.tokens,
          update.costCents,
          update.latencyMs,
        );
      } else {
        await this.tracker.trackError(
          brandId,
          userId,
          agentId,
          model,
          provider,
          operation,
          update.errorMessage || 'Unknown error',
          update.latencyMs,
        );
      }

      // 3. Tracker le coût
      await this.tracker.trackCost(brandId, update.costCents, totalTokens);

      // 4. Vérifier les alertes (en background, ne pas bloquer)
      this.checkAlertsAsync(brandId, userId).catch((error) => {
        this.logger.warn(`Failed to check alerts: ${error}`);
      });

      this.aiLogger.logDebug('Usage updated after AI call', {
        brandId,
        userId,
        agentId,
        tokens: totalTokens,
        costCents: update.costCents,
        success: update.success,
      });
    } catch (error) {
      // Ne pas faire échouer la requête si le tracking échoue
      this.aiLogger.logError('Failed to update usage after call', error, {
        brandId,
        userId,
        agentId,
      });
    }
  }

  /**
   * Récupère le statut des quotas
   */
  async getUsageStatus(
    brandId: string | null | undefined,
    userId: string | null | undefined,
    planId: string | null | undefined,
  ): Promise<{
    quota: QuotaCheckResult['quota'];
    rateLimit: { remaining: number; resetAt: Date };
  }> {
    const quota = await this.quotaManager.getQuotaStatus(brandId, userId, planId);
    const remaining = await this.rateLimiter.getRemainingRequests(brandId, userId, planId);

    // Calculer resetAt (prochaine fenêtre)
    const now = new Date();
    const resetAt = new Date(now.getTime() + 60000); // 1 minute (fenêtre par défaut)

    return {
      quota,
      rateLimit: {
        remaining,
        resetAt,
      },
    };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Vérifie les alertes de manière asynchrone (ne bloque pas)
   */
  private async checkAlertsAsync(
    brandId: string | null | undefined,
    userId: string | null | undefined,
  ): Promise<void> {
    try {
      // Vérifier les alertes de quotas (seulement si brandId)
      if (brandId) {
        await this.alerts.checkQuotaAlerts(brandId, userId, undefined);
        await this.alerts.checkErrorAlerts(brandId);
        await this.alerts.checkCostAlerts(brandId);
      }
    } catch (error) {
      this.logger.warn(`Alert check failed: ${error}`);
    }
  }
}
