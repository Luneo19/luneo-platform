import { JsonValue } from '@/common/types/utility-types';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { WebhookPayload } from '../interfaces/ecommerce.interface';

@Injectable()
export class WebhookHandlerService {
  private readonly logger = new Logger(WebhookHandlerService.name);

  constructor(
    @InjectQueue('ecommerce-webhooks') private readonly webhookQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly shopifyConnector: ShopifyConnector,
    private readonly woocommerceConnector: WooCommerceConnector,
  ) {}

  /**
   * Traite un webhook Shopify
   */
  async handleShopifyWebhook(
    topic: string,
    shop: string,
    payload: any,
    hmacHeader: string,
  ): Promise<void> {
    try {
      // Récupérer l'intégration
      const integration = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          platform: 'shopify',
          shopDomain: shop,
          status: 'active',
        },
      });

      if (!integration) {
        this.logger.warn(`No active Shopify integration found for shop: ${shop}`);
        return;
      }

      // Valider le webhook
      const webhookSecret = (integration.config as any).webhookSecret || '';
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
      await this.webhookQueue.add('process-shopify-webhook', {
        integrationId: integration.id,
        topic,
        shop,
        payload,
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
    payload: any,
    signature: string,
  ): Promise<void> {
    try {
      // Trouver l'intégration
      const integration = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          platform: 'woocommerce',
          status: 'active',
        },
      });

      if (!integration) {
        this.logger.warn(`No active WooCommerce integration found`);
        return;
      }

      // Log du webhook
      await this.logWebhook({
        id: `woocommerce_${Date.now()}`,
        topic,
        payload,
        created_at: new Date().toISOString(),
      });

      // Traiter de manière asynchrone
      await this.webhookQueue.add('process-woocommerce-webhook', {
        integrationId: integration.id,
        topic,
        payload,
        signature,
      });

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
          event: webhook.topic || 'unknown',
          payload: webhook.payload,
          statusCode: 200,
          response: 'received',
          createdAt: new Date(webhook.created_at),
        },
      });
    } catch (error) {
      this.logger.error(`Error logging webhook:`, error);
    }
  }

  /**
   * Récupère l'historique des webhooks
   */
  async getWebhookHistory(
    integrationId: string,
    limit: number = 50,
  ): Promise<any[]> {
    try {
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`);
      }

      const webhooks = await this.prisma.webhookLog.findMany({
        where: {
          webhook: {
            brandId: integration.brandId,
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return webhooks;
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

      const webhookRecord = await this.prisma.webhook.findUnique({
        where: { id: webhook.webhookId },
      });

      if (!webhookRecord) {
        throw new Error('Webhook not found');
      }

      // Trouver l'intégration via brandId
      const integration = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          brandId: webhookRecord.brandId,
          status: 'active',
        },
      });

      if (!integration) {
        throw new Error('No active integration found for webhook');
      }

      // Réessayer selon la plateforme
      if (integration.platform === 'shopify') {
        await this.shopifyConnector.handleWebhook(
          webhook.event,
          integration.shopDomain || '',
          webhook.payload as Record<string, JsonValue>,
        );
      } else if (integration.platform === 'woocommerce') {
        await this.woocommerceConnector.handleWebhook(
          webhook.event,
          webhook.payload,
          '', // Signature déjà validée
        );
      }

      // Mettre à jour le statut
      await this.prisma.webhookLog.update({
        where: { id: webhookId },
        data: { response: 'retried' },
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
  async getWebhookStats(integrationId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      // Trouver l'intégration pour obtenir brandId
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: integrationId },
        select: { brandId: true },
      });

      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`);
      }

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
          webhook: {
            brandId: integration.brandId,
          },
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
      });

      const stats = {
        period,
        totalWebhooks: webhooks.length,
        webhooksByTopic: webhooks.reduce((acc, webhook) => {
          const topic = webhook.event || 'unknown';
          acc[topic] = (acc[topic] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        webhooksByStatus: webhooks.reduce((acc, webhook) => {
          const status = webhook.statusCode && webhook.statusCode < 300 ? 'success' : 'error';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        successRate: webhooks.length > 0
          ? (webhooks.filter(w => w.statusCode && w.statusCode < 300).length / webhooks.length) * 100
          : 0,
      };

      return stats;
    } catch (error) {
      this.logger.error(`Error getting webhook stats:`, error);
      throw error;
    }
  }
}


