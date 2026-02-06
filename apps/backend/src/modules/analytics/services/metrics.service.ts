/**
 * @fileoverview Service de métriques temps réel
 * @module MetricsService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Gestion d'erreurs
 * - ✅ Gardes pour éviter les crashes
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES STRICTS POUR MÉTRIQUES
// ============================================================================

/**
 * Métriques temps réel avec typage strict
 */
export interface RealTimeMetrics {
  designsToday: number;
  ordersToday: number;
  conversionRate: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly CACHE_TTL = 60; // Cache 1 minute

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Récupère les métriques temps réel avec typage strict et validation robuste
   */
  async getRealTimeMetrics(brandId: string): Promise<RealTimeMetrics> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getRealTimeMetrics');
      throw new BadRequestException('Brand ID is required');
    }

    const cacheKey = `metrics:realtime:${brandId.trim()}`;

    try {
      return await this.cache.getOrSet<RealTimeMetrics>(
        cacheKey,
        async () => {
          return await this.fetchRealTimeMetrics(brandId.trim());
        },
        this.CACHE_TTL,
      ) || this.getDefaultRealTimeMetrics();
    } catch (error) {
      this.logger.error(
        `Failed to get real-time metrics: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return this.getDefaultRealTimeMetrics();
    }
  }

  /**
   * Récupère les métriques depuis la base de données
   */
  private async fetchRealTimeMetrics(brandId: string): Promise<RealTimeMetrics> {
    // ✅ Calculer la date du jour (début de journée)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const [designsToday, ordersToday] = await Promise.all([
        this.prisma.design.count({
          where: {
            brandId,
            createdAt: { gte: today },
          },
        }),
        this.prisma.order.count({
          where: {
            brandId,
            createdAt: { gte: today },
            paymentStatus: 'SUCCEEDED',
          },
        }),
      ]);

      // ✅ Calculer le taux de conversion avec garde
      const conversionRate = designsToday > 0 && typeof designsToday === 'number' && designsToday > 0
        ? Math.round(((ordersToday / designsToday) * 100) * 100) / 100 // 2 décimales
        : 0;

      return {
        designsToday: typeof designsToday === 'number' ? designsToday : 0,
        ordersToday: typeof ordersToday === 'number' ? ordersToday : 0,
        conversionRate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch real-time metrics: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return this.getDefaultRealTimeMetrics();
    }
  }

  /**
   * Métriques par défaut en cas d'erreur
   */
  private getDefaultRealTimeMetrics(): RealTimeMetrics {
    return {
      designsToday: 0,
      ordersToday: 0,
      conversionRate: 0,
    };
  }
}
