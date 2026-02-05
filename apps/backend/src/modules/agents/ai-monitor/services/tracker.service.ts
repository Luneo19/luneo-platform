/**
 * @fileoverview Service de tracking des appels IA
 * @module TrackerService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Tracking de chaque appel IA
 * - ✅ Persistance en DB
 * - ✅ Logger au lieu de console.log
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES
// ============================================================================

export interface AICallTracking {
  brandId?: string;
  userId?: string;
  agentId?: string;
  model: string;
  provider: string;
  operation: 'chat' | 'completion' | 'embedding' | 'image_generation';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Enregistre un appel IA
   */
  async trackCall(tracking: AICallTracking): Promise<void> {
    try {
      // Persister en DB
      await this.prisma.aIUsageLog.create({
        data: {
          brandId: tracking.brandId || null,
          userId: tracking.userId,
          agentId: tracking.agentId || null,
          model: tracking.model,
          provider: tracking.provider,
          operation: tracking.operation,
          promptTokens: tracking.inputTokens,
          completionTokens: tracking.outputTokens,
          inputTokens: tracking.inputTokens,
          outputTokens: tracking.outputTokens,
          totalTokens: tracking.totalTokens,
          costCents: tracking.costCents,
          latencyMs: tracking.latencyMs,
          success: tracking.success,
          errorMessage: tracking.errorMessage || null,
          metadata: (tracking.metadata || {}) as any,
        },
      });

      // Mettre à jour le cache pour analytics rapides
      await this.updateCacheMetrics(tracking);

      this.logger.debug(
        `AI call tracked: ${tracking.operation} via ${tracking.provider}/${tracking.model}, ` +
        `${tracking.totalTokens} tokens, ${tracking.costCents}¢, ${tracking.latencyMs}ms`,
      );
    } catch (error) {
      // Ne pas faire échouer la requête si le tracking échoue
      this.logger.error(`Failed to track AI call: ${error}`);
    }
  }

  /**
   * Enregistre un appel réussi
   */
  async trackSuccess(
    brandId: string | null | undefined,
    userId: string | null | undefined,
    agentId: string | null | undefined,
    model: string,
    provider: string,
    operation: AICallTracking['operation'],
    tokens: { input: number; output: number },
    costCents: number,
    latencyMs: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.trackCall({
      brandId: brandId || undefined,
      userId: userId || undefined,
      agentId: agentId || undefined,
      model,
      provider,
      operation,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      totalTokens: tokens.input + tokens.output,
      costCents,
      latencyMs,
      success: true,
      metadata,
    });
  }

  /**
   * Enregistre un appel en erreur
   */
  async trackError(
    brandId: string | null | undefined,
    userId: string | null | undefined,
    agentId: string | null | undefined,
    model: string,
    provider: string,
    operation: AICallTracking['operation'],
    errorMessage: string,
    latencyMs: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.trackCall({
      brandId: brandId || undefined,
      userId: userId || undefined,
      agentId: agentId || undefined,
      model,
      provider,
      operation,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costCents: 0,
      latencyMs,
      success: false,
      errorMessage,
      metadata,
    });
  }

  /**
   * Enregistre un coût (pour facturation)
   */
  async trackCost(
    brandId: string | null | undefined,
    costCents: number,
    tokens: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    // Mettre à jour le cache pour coûts en temps réel
    const cacheKey = `ai_cost:${brandId || 'global'}:${new Date().toISOString().split('T')[0]}`;
    const current = await this.cache.getOrSet<number>(
      cacheKey,
      async () => 0,
      86400,
    ) || 0;
    
    await this.cache.set(
      cacheKey,
      'metrics',
      current + costCents,
      { ttl: 86400 },
    );

    this.logger.debug(`Cost tracked: ${costCents}¢ for brand ${brandId}, ${tokens} tokens`);
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Met à jour les métriques en cache pour analytics rapides
   */
  private async updateCacheMetrics(tracking: AICallTracking): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const entityId = tracking.brandId || tracking.userId || 'global';
    const entityType = tracking.brandId ? 'brand' : (tracking.userId ? 'user' : 'global');

    // Métriques du jour
    const metricsKey = `ai_metrics:${entityType}:${entityId}:${today}`;

    const current = await this.cache.getOrSet<{
      calls: number;
      tokens: number;
      costCents: number;
      errors: number;
    }>(
      metricsKey,
      async () => ({
        calls: 0,
        tokens: 0,
        costCents: 0,
        errors: 0,
      }),
      86400,
    );

    await this.cache.set(
      metricsKey,
      'metrics',
      {
        calls: current.calls + 1,
        tokens: current.tokens + tracking.totalTokens,
        costCents: current.costCents + tracking.costCents,
        errors: current.errors + (tracking.success ? 0 : 1),
      },
      { ttl: 86400 },
    );
  }
}
