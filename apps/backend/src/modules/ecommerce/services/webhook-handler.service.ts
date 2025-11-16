import { Injectable, Logger } from '@nestjs/common';
import { Prisma, EcommerceIntegration as PrismaEcommerceIntegration, WebhookLog as PrismaWebhookLog } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { EcommerceWebhookJobPayload } from '../interfaces/ecommerce.interface';
import { EcommerceWebhookQueueService } from './ecommerce-webhook-queue.service';
import {
  WebhookPayload,
  EcommerceIntegration,
  EcommerceConfig,
  ShopifyWebhookPayload,
  WooCommerceWebhookPayload,
  WebhookStats,
} from '../interfaces/ecommerce.interface';

@Injectable()
export class WebhookHandlerService {
  private readonly logger = new Logger(WebhookHandlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopifyConnector: ShopifyConnector,
    private readonly woocommerceConnector: WooCommerceConnector,
    private readonly webhookQueueService: EcommerceWebhookQueueService,
  ) {}

  /**
   * Traite un webhook Shopify
   */
  async handleShopifyWebhook(
    topic: string,
    shop: string,
    payload: ShopifyWebhookPayload,
    hmacHeader: string,
  ): Promise<void> {
    try {
      const integration = await this.getIntegrationByShop(shop);
      if (!integration) {
        this.logger.warn(`No active Shopify integration found for shop: ${shop}`);
        return;
      }

      const webhookSecret = this.extractWebhookSecret(integration.config);
      const isValid = this.shopifyConnector.validateWebhook(
        JSON.stringify(payload),
        hmacHeader,
        webhookSecret,
      );

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Log du webhook
      await this.logWebhook({
        id: `shopify_${Date.now()}`,
        topic,
        shop_domain: shop,
        payload,
        created_at: new Date().toISOString(),
      });

      // Traiter de manière asynchrone
      await this.enqueueWebhook({
        integrationId: integration.id,
        topic,
        payload,
        shopDomain: shop,
      });

      this.logger.log(`Shopify webhook queued: ${topic} for shop ${shop}`);
    } catch (error) {
      this.logger.error(`Error handling Shopify webhook:`, error);
      throw error;
    }
  }

  /**
   * Traite un webhook WooCommerce
   */
  async handleWooCommerceWebhook(
    topic: string,
    payload: WooCommerceWebhookPayload,
    signature: string,
  ): Promise<void> {
    try {
      const record = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          platform: 'woocommerce',
          status: 'active',
        },
      });

      if (!record) {
        this.logger.warn(`No active WooCommerce integration found`);
        return;
      }

      const integration = this.mapIntegration(record);

      // Log du webhook
      await this.logWebhook({
        id: `woocommerce_${Date.now()}`,
        topic,
        shop_domain: integration.shopDomain,
        payload,
        created_at: new Date().toISOString(),
      });

      // Traiter de manière asynchrone
      await this.enqueueWebhook(
        {
          integrationId: integration.id,
          topic,
          payload,
          shopDomain: integration.shopDomain,
          signature,
        },
        'woocommerce',
      );

      this.logger.log(`WooCommerce webhook queued: ${topic}`);
    } catch (error) {
      this.logger.error(`Error handling WooCommerce webhook:`, error);
      throw error;
    }
  }

  /**
   * Log un webhook
   */
  private async logWebhook(webhook: WebhookPayload): Promise<void> {
    try {
      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          topic: webhook.topic,
          shopDomain: webhook.shop_domain ?? '',
          payload: this.toJson(webhook.payload),
          status: 'received',
          createdAt: new Date(webhook.created_at),
        },
      });
    } catch (error) {
      this.logger.error(`Error logging webhook:`, error);
    }
  }

  private toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private async enqueueWebhook(
    payload: EcommerceWebhookJobPayload,
    platform: 'shopify' | 'woocommerce' = 'shopify',
  ): Promise<void> {
    if (platform === 'shopify') {
      await this.webhookQueueService.enqueueShopifyWebhook(payload);
      return;
    }

    await this.webhookQueueService.enqueueWooCommerceWebhook(payload);
  }

  /**
   * Récupère l'historique des webhooks
   */
  async getWebhookHistory(
    integrationId: string,
    limit: number = 50,
  ): Promise<WebhookPayload[]> {
    try {
      const integration = await this.getIntegration(integrationId);

      const webhooks = await this.prisma.webhookLog.findMany({
        where: {
          shopDomain: integration.shopDomain,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return webhooks.map((webhook) => this.mapWebhookRecord(webhook));
    } catch (error) {
      this.logger.error(`Error fetching webhook history:`, error);
      throw error;
    }
  }

  /**
   * Réessaye un webhook échoué
   */
  async retryWebhook(webhookId: string): Promise<void> {
    try {
      const webhook = await this.prisma.webhookLog.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        throw new Error(`Webhook ${webhookId} not found`);
      }

      const integration = await this.getIntegrationByShop(webhook.shopDomain);
      if (!integration) {
        throw new Error('No active integration found for webhook');
      }

      const webhookPayload = this.ensureRecord(webhook.payload) ?? {};

      // Réessayer selon la plateforme
      if (integration.platform === 'shopify') {
        await this.shopifyConnector.handleWebhook(
          webhook.topic,
          webhook.shopDomain,
          webhookPayload,
        );
      } else if (integration.platform === 'woocommerce') {
        await this.woocommerceConnector.handleWebhook(
          webhook.topic,
          webhookPayload,
          '', // Signature déjà validée
        );
      }

      // Mettre à jour le statut
      await this.prisma.webhookLog.update({
        where: { id: webhookId },
        data: { status: 'retried' },
      });

      this.logger.log(`Webhook ${webhookId} retried successfully`);
    } catch (error) {
      this.logger.error(`Error retrying webhook ${webhookId}:`, error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques des webhooks
   */
  async getWebhookStats(
    integrationId: string,
    period: 'day' | 'week' | 'month' = 'week',
  ): Promise<WebhookStats> {
    try {
      const integration = await this.getIntegration(integrationId);

      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const webhooks = await this.prisma.webhookLog.findMany({
        where: {
          shopDomain: integration.shopDomain,
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
      });

      return {
        period,
        totalWebhooks: webhooks.length,
        webhooksByTopic: webhooks.reduce<Record<string, number>>((acc, webhook) => {
          acc[webhook.topic] = (acc[webhook.topic] || 0) + 1;
          return acc;
        }, {}),
        webhooksByStatus: webhooks.reduce<Record<string, number>>((acc, webhook) => {
          acc[webhook.status] = (acc[webhook.status] || 0) + 1;
          return acc;
        }, {}),
        successRate:
          webhooks.length > 0
            ? (webhooks.filter((w) => w.status === 'processed').length / webhooks.length) * 100
            : 0,
      };
    } catch (error) {
      this.logger.error(`Error getting webhook stats:`, error);
      throw error;
    }
  }

  private async getIntegration(integrationId: string): Promise<EcommerceIntegration> {
    const record = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!record) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    return this.mapIntegration(record);
  }

  private async getIntegrationByShop(shopDomain: string): Promise<EcommerceIntegration | null> {
    const record = await this.prisma.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        status: 'active',
      },
    });

    return record ? this.mapIntegration(record) : null;
  }

  private mapIntegration(record: PrismaEcommerceIntegration): EcommerceIntegration {
    return {
      id: record.id,
      brandId: record.brandId,
      platform: record.platform as EcommerceIntegration['platform'],
      shopDomain: record.shopDomain,
      accessToken: record.accessToken ?? undefined,
      refreshToken: record.refreshToken ?? undefined,
      config: this.parseConfig(record.config),
      status: record.status as EcommerceIntegration['status'],
      lastSyncAt: record.lastSyncAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private parseConfig(config: Prisma.JsonValue | null): EcommerceConfig {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return {};
    }

    const record = config as Record<string, unknown>;

    return {
      apiKey: typeof record.apiKey === 'string' ? record.apiKey : undefined,
      apiSecret: typeof record.apiSecret === 'string' ? record.apiSecret : undefined,
      webhookSecret: typeof record.webhookSecret === 'string' ? record.webhookSecret : undefined,
      scopes: this.ensureStringArray(record.scopes),
      features: this.ensureStringArray(record.features),
      customFields: this.ensureRecord(record.customFields),
    };
  }

  private ensureStringArray(value: unknown): string[] | undefined {
    if (!value || !Array.isArray(value)) {
      return undefined;
    }

    const items = value.filter((entry): entry is string => typeof entry === 'string');
    return items.length > 0 ? items : undefined;
  }

  private ensureRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }

  private extractWebhookSecret(config: EcommerceConfig): string {
    return config.webhookSecret ?? '';
  }

  private mapWebhookRecord(record: PrismaWebhookLog): WebhookPayload {
    return {
      id: record.webhookId,
      topic: record.topic,
      shop_domain: record.shopDomain,
      payload: this.ensureRecord(record.payload) ?? {},
      created_at: record.createdAt.toISOString(),
    };
  }
}


