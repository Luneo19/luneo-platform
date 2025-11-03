import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Stripe from 'stripe';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { UsageMetric, UsageMetricType, StripeUsageRecord } from '../interfaces/usage.interface';

/**
 * Service de métering d'usage avec Stripe
 * Enregistre et synchronise l'utilisation avec Stripe pour la facturation
 */
@Injectable()
export class UsageMeteringService {
  private readonly logger = new Logger(UsageMeteringService.name);
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    @InjectQueue('usage-metering') private usageQueue: Queue,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Enregistrer une métrique d'usage
   */
  async recordUsage(
    brandId: string,
    metric: UsageMetricType,
    value: number = 1,
    metadata?: Record<string, any>,
  ): Promise<UsageMetric> {
    try {
      // Créer l'enregistrement d'usage
      const usageMetric: UsageMetric = {
        id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brandId,
        metric,
        value,
        unit: this.getUnitForMetric(metric),
        timestamp: new Date(),
        metadata,
      };

      // Sauvegarder en DB (via queue pour async)
      await this.usageQueue.add('record-usage', {
        usageMetric,
      });

      // Envoyer à Stripe si applicable
      await this.reportToStripe(brandId, metric, value);

      // Invalidate cache
      await this.cache.del(`usage:${brandId}:current`);

      this.logger.log(
        `Usage recorded: ${metric} = ${value} for brand ${brandId}`,
      );

      return usageMetric;
    } catch (error) {
      this.logger.error(`Failed to record usage: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Rapporter l'usage à Stripe
   */
  private async reportToStripe(
    brandId: string,
    metric: UsageMetricType,
    quantity: number,
  ): Promise<void> {
    try {
      // Récupérer la subscription Stripe du brand
      const subscription = await this.getStripeSubscription(brandId);
      if (!subscription) {
        this.logger.warn(`No Stripe subscription found for brand ${brandId}`);
        return;
      }

      // Trouver le subscription item correspondant à cette métrique
      const subscriptionItem = this.findSubscriptionItemForMetric(
        subscription,
        metric,
      );
      if (!subscriptionItem) {
        this.logger.warn(
          `No subscription item for metric ${metric} on brand ${brandId}`,
        );
        return;
      }

      // Créer un usage record dans Stripe
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: Math.ceil(quantity), // Stripe nécessite un entier
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment', // ou 'set' selon le cas
        },
      );

      this.logger.debug(
        `Stripe usage record created: ${usageRecord.id} for ${metric}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to report to Stripe: ${error.message}`,
        error.stack,
      );
      // Ne pas throw pour ne pas bloquer l'enregistrement local
    }
  }

  /**
   * Récupérer la subscription Stripe d'un brand
   */
  private async getStripeSubscription(brandId: string): Promise<any> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { stripeSubscriptionId: true },
      });

      if (!brand?.stripeSubscriptionId) {
        return null;
      }

      const subscription = await this.stripe.subscriptions.retrieve(
        brand.stripeSubscriptionId,
        {
          expand: ['items.data.price.product'],
        },
      );

      return subscription;
    } catch (error) {
      this.logger.error(
        `Failed to get Stripe subscription: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Trouver le subscription item pour une métrique
   */
  private findSubscriptionItemForMetric(subscription: any, metric: UsageMetricType): any {
    if (!subscription?.items?.data) {
      return null;
    }

    // Mapping entre nos métriques et les products Stripe
    const metricToStripeProductMap: Record<UsageMetricType, string> = {
      designs_created: 'prod_designs',
      renders_2d: 'prod_renders_2d',
      renders_3d: 'prod_renders_3d',
      exports_gltf: 'prod_exports',
      exports_usdz: 'prod_exports',
      ai_generations: 'prod_ai',
      storage_gb: 'prod_storage',
      bandwidth_gb: 'prod_bandwidth',
      api_calls: 'prod_api',
      webhook_deliveries: 'prod_webhooks',
      custom_domains: 'prod_domains',
      team_members: 'prod_team',
    };

    const targetProductId = metricToStripeProductMap[metric];

    for (const item of subscription.items.data) {
      const productId = item.price?.product?.id || item.price?.product;
      if (productId === targetProductId) {
        return item;
      }
    }

    return null;
  }

  /**
   * Obtenir l'unité pour une métrique
   */
  private getUnitForMetric(metric: UsageMetricType): string {
    const units: Record<UsageMetricType, string> = {
      designs_created: 'designs',
      renders_2d: 'renders',
      renders_3d: 'renders',
      exports_gltf: 'exports',
      exports_usdz: 'exports',
      ai_generations: 'generations',
      storage_gb: 'GB',
      bandwidth_gb: 'GB',
      api_calls: 'calls',
      webhook_deliveries: 'webhooks',
      custom_domains: 'domains',
      team_members: 'members',
    };

    return units[metric] || 'units';
  }

  /**
   * Récupérer l'usage actuel d'un brand
   */
  async getCurrentUsage(brandId: string): Promise<Record<UsageMetricType, number>> {
    try {
      // Check cache
      const cached = await this.cache.get(`usage:${brandId}:current`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Récupérer depuis DB pour le mois en cours
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const usageRecords = await this.prisma.usageMetric.findMany({
        where: {
          brandId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Agréger par métrique
      const usage: Record<string, number> = {};
      for (const record of usageRecords) {
        usage[record.metric] = (usage[record.metric] || 0) + record.value;
      }

      // Cache pour 5 minutes
      await this.cache.set(
        `usage:${brandId}:current`,
        JSON.stringify(usage),
        300,
      );

      return usage as Record<UsageMetricType, number>;
    } catch (error) {
      this.logger.error(
        `Failed to get current usage: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Récupérer l'usage Stripe directement (source de vérité)
   */
  async getStripeUsage(
    brandId: string,
    metric: UsageMetricType,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const subscription = await this.getStripeSubscription(brandId);
      if (!subscription) {
        return 0;
      }

      const subscriptionItem = this.findSubscriptionItemForMetric(
        subscription,
        metric,
      );
      if (!subscriptionItem) {
        return 0;
      }

      // Récupérer les usage records de Stripe
      const usageRecords = await this.stripe.subscriptionItems.listUsageRecordSummaries(
        subscriptionItem.id,
        {
          limit: 100,
        },
      );

      // Sommer les quantités dans la période
      let total = 0;
      for (const record of usageRecords.data) {
        const recordDate = new Date(record.period.start * 1000);
        if (recordDate >= startDate && recordDate <= endDate) {
          total += record.total_usage;
        }
      }

      return total;
    } catch (error) {
      this.logger.error(
        `Failed to get Stripe usage: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Batch reporting pour optimisation
   */
  async batchRecordUsage(
    brandId: string,
    metrics: Array<{ metric: UsageMetricType; value: number }>,
  ): Promise<void> {
    try {
      const promises = metrics.map((m) =>
        this.recordUsage(brandId, m.metric, m.value),
      );

      await Promise.all(promises);

      this.logger.log(
        `Batch recorded ${metrics.length} usage metrics for brand ${brandId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to batch record usage: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
