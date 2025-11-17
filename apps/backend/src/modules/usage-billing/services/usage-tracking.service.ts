import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { UsageMeteringService } from './usage-metering.service';
import { UsageMetricType } from '../interfaces/usage.interface';

/**
 * Service de tracking d'usage
 * Intercepte les événements métier et enregistre l'usage
 */
@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly meteringService: UsageMeteringService,
  ) {}

  /**
   * Track la création d'un design
   */
  async trackDesignCreated(brandId: string, designId: string): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'designs_created', 1, {
      designId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track un rendu 2D
   */
  async trackRender2D(brandId: string, designId: string, format: string): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'renders_2d', 1, {
      designId,
      format,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track un rendu 3D
   */
  async trackRender3D(brandId: string, designId: string, format: string): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'renders_3d', 1, {
      designId,
      format,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track un export GLTF
   */
  async trackExportGLTF(brandId: string, designId: string): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'exports_gltf', 1, {
      designId,
      format: 'gltf',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track un export USDZ
   */
  async trackExportUSDZ(brandId: string, designId: string): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'exports_usdz', 1, {
      designId,
      format: 'usdz',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track une génération IA
   */
  async trackAIGeneration(
    brandId: string,
    designId: string,
    model: string,
    cost: number,
  ): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'ai_generations', 1, {
      designId,
      model,
      cost,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track le stockage (GB)
   */
  async trackStorage(brandId: string, sizeGB: number): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'storage_gb', sizeGB, {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track la bande passante (GB)
   */
  async trackBandwidth(brandId: string, sizeGB: number): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'bandwidth_gb', sizeGB, {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track un appel API
   */
  async trackAPICall(
    brandId: string,
    endpoint: string,
    method: string,
  ): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'api_calls', 1, {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track une livraison de webhook
   */
  async trackWebhookDelivery(
    brandId: string,
    webhookId: string,
    topic: string,
  ): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'webhook_deliveries', 1, {
      webhookId,
      topic,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Calculer l'usage total de stockage pour un brand
   */
  async calculateTotalStorage(brandId: string): Promise<number> {
    try {
      const designs = await this.prisma.design.findMany({
        where: { product: { brandId } },
        select: {
          previewUrl: true,
          highResUrl: true,
          // @ts-ignore - renderUrl exists in schema but Prisma client may need regeneration
          renderUrl: true,
        },
      });

      // Estimer la taille (en vrai, à calculer via S3)
      const estimatedSizeGB = designs.length * 0.01; // ~10MB par design

      // Mettre à jour le tracking
      await this.trackStorage(brandId, estimatedSizeGB);

      return estimatedSizeGB;
    } catch (error) {
      this.logger.error(
        `Failed to calculate storage: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Récupérer les stats d'usage pour un brand
   */
  async getUsageStats(brandId: string, period: 'day' | 'month' | 'year') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
      const usageRecords = await (this.prisma as any).usageMetric.findMany({
        where: {
          brandId,
          timestamp: {
            gte: startDate,
          },
        },
      });

      // Agréger par métrique
      const stats: Record<string, { count: number; total: number }> = {};
      for (const record of usageRecords) {
        if (!stats[record.metric]) {
          stats[record.metric] = { count: 0, total: 0 };
        }
        stats[record.metric].count++;
        stats[record.metric].total += record.value;
      }

      return {
        period,
        startDate,
        endDate: now,
        metrics: stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get usage stats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Récupérer l'historique d'usage
   */
  async getUsageHistory(
    brandId: string,
    metric?: UsageMetricType,
    limit: number = 100,
  ) {
    try {
      const where: any = { brandId };
      if (metric) {
        where.metric = metric;
      }

      // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
      const records = await (this.prisma as any).usageMetric.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return records;
    } catch (error) {
      this.logger.error(
        `Failed to get usage history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
