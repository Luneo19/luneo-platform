/**
 * @fileoverview Service de métriques temps réel
 * @module MetricsService
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Récupère les métriques temps réel
   */
  async getRealTimeMetrics(brandId: string): Promise<Record<string, unknown>> {
    const cacheKey = `metrics:realtime:${brandId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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

        return {
          designsToday,
          ordersToday,
          conversionRate: designsToday > 0 ? (ordersToday / designsToday) * 100 : 0,
        };
      },
      60 // Cache 1 minute
    );
  }
}
