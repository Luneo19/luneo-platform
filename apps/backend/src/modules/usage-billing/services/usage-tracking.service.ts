import { Injectable, Logger } from '@nestjs/common';
import { Prisma, UsageMetric as PrismaUsageMetric } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UsageMeteringService } from './usage-metering.service';
import { UsageMetricType } from '../interfaces/usage.interface';

export interface UsageMetricAggregation {
  count: number;
  total: number;
}

export type UsageStatsResult = {
  period: 'day' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: Record<UsageMetricType, UsageMetricAggregation>;
};

/**
 * Service de tracking d'usage
 * Intercepte les événements métier et enregistre l'usage
 */
@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meteringService: UsageMeteringService,
  ) {}

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  /**
   * Créer un bloc de métadonnées commun
   */
  private buildMetadata(extra: Record<string, string | number | boolean | null>): Record<string, string | number | boolean | null> {
    return {
      ...extra,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Track la création d'un design
   */
  async trackDesignCreated(brandId: string, designId: string): Promise<void> {
    await this.meteringService.recordUsage(
      brandId,
      'designs_created',
      1,
      this.buildMetadata({ designId }),
    );
  }

  /**
   * Track un rendu 2D
   */
  async trackRender2D(brandId: string, designId: string, format: string): Promise<void> {
    await this.meteringService.recordUsage(
      brandId,
      'renders_2d',
      1,
      this.buildMetadata({ designId, format }),
    );
  }

  /**
   * Track un rendu 3D
   */
  async trackRender3D(brandId: string, designId: string, format: string): Promise<void> {
    await this.meteringService.recordUsage(
      brandId,
      'renders_3d',
      1,
      this.buildMetadata({ designId, format }),
    );
  }

  /**
   * Track un export GLTF
   */
  async trackExportGLTF(brandId: string, designId: string): Promise<void> {
    await this.meteringService.recordUsage(
      brandId,
      'exports_gltf',
      1,
      this.buildMetadata({ designId, format: 'gltf' }),
    );
  }

  /**
   * Track un export USDZ
   */
  async trackExportUSDZ(brandId: string, designId: string): Promise<void> {
    await this.meteringService.recordUsage(
      brandId,
      'exports_usdz',
      1,
      this.buildMetadata({ designId, format: 'usdz' }),
    );
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
    await this.meteringService.recordUsage(
      brandId,
      'ai_generations',
      1,
      this.buildMetadata({ designId, model, cost }),
    );
  }

  /**
   * Track le stockage (GB)
   */
  async trackStorage(brandId: string, sizeGB: number): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'storage_gb', sizeGB, this.buildMetadata({}));
  }

  /**
   * Track la bande passante (GB)
   */
  async trackBandwidth(brandId: string, sizeGB: number): Promise<void> {
    await this.meteringService.recordUsage(brandId, 'bandwidth_gb', sizeGB, this.buildMetadata({}));
  }

  /**
   * Track un appel API
   */
  async trackAPICall(
    brandId: string,
    endpoint: string,
    method: string,
  ): Promise<void> {
    await this.meteringService.recordUsage(
      brandId,
      'api_calls',
      1,
      this.buildMetadata({ endpoint, method }),
    );
  }

  /**
   * Track une livraison de webhook
   */
  async trackWebhookDelivery(
    brandId: string,
    webhookId: string,
    topic: string,
  ): Promise<void> {
    await this.meteringService.recordUsage(
      brandId,
      'webhook_deliveries',
      1,
      this.buildMetadata({ webhookId, topic }),
    );
  }

  /**
   * Calculer l'usage total de stockage pour un brand
   */
  async calculateTotalStorage(brandId: string): Promise<number> {
    try {
      const designs = await this.prisma.design.findMany({
        where: { product: { brandId } },
        select: {
          imageUrl: true,
          renderUrl: true,
        },
      });

      // Estimer la taille (en vrai, à calculer via S3)
      const estimatedSizeGB = designs.length * 0.01; // ~10MB par design

      // Mettre à jour le tracking
      await this.trackStorage(brandId, estimatedSizeGB);

      return estimatedSizeGB;
    } catch (error) {
      this.logger.error(`Failed to calculate storage: ${this.formatError(error)}`);
      return 0;
    }
  }

  /**
   * Récupérer les stats d'usage pour un brand
   */
  async getUsageStats(brandId: string, period: 'day' | 'month' | 'year'): Promise<UsageStatsResult> {
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
        default:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
      }

      const usageRecords = await this.prisma.usageMetric.findMany({
        where: {
          brandId,
          timestamp: {
            gte: startDate,
          },
        },
      });

      // Agréger par métrique
      const stats: Record<UsageMetricType, UsageMetricAggregation> = {} as Record<
        UsageMetricType,
        UsageMetricAggregation
      >;
      for (const record of usageRecords) {
        const metric = record.metric as UsageMetricType;
        const metricStats = stats[metric] ?? { count: 0, total: 0 };
        metricStats.count += 1;
        metricStats.total += record.value;
        stats[metric] = metricStats;
      }

      return {
        period,
        startDate,
        endDate: now,
        metrics: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get usage stats: ${this.formatError(error)}`);
      throw error instanceof Error ? error : new Error(this.formatError(error));
    }
  }

  /**
   * Récupérer l'historique d'usage
   */
  async getUsageHistory(
    brandId: string,
    metric?: UsageMetricType,
    limit = 100,
  ): Promise<PrismaUsageMetric[]> {
    try {
      const where: Prisma.UsageMetricWhereInput = {
        brandId,
        ...(metric ? { metric } : {}),
      };

      const records = await this.prisma.usageMetric.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return records;
    } catch (error) {
      this.logger.error(`Failed to get usage history: ${this.formatError(error)}`);
      throw error instanceof Error ? error : new Error(this.formatError(error));
    }
  }
}
