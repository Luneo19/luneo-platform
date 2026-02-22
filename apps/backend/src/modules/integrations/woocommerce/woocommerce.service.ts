// @ts-nocheck
/**
 * @fileoverview Service WooCommerce - Structure modulaire
 * @module WooCommerceService
 *
 * Conforme au plan PHASE 4 - Intégrations e-commerce - WooCommerce modulaire
 *
 * FONCTIONNALITÉS:
 * - Connexion OAuth (Consumer Key/Secret)
 * - Sync produits minimal MVP
 * - Sync commandes minimal MVP
 * - Webhooks basiques
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Structure modulaire
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { WooCommerceConnector } from '@/modules/ecommerce/connectors/woocommerce/woocommerce.connector';
import { SyncEngineService } from '@/modules/ecommerce/services/sync-engine.service';
import { WooCommerceWebhookService } from '@/modules/ecommerce/services/woocommerce-webhook.service';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Configuration de connexion WooCommerce
 */
export interface WooCommerceConnectionConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

/**
 * Options de sync WooCommerce
 */
export interface WooCommerceSyncOptions {
  syncProducts?: boolean;
  syncOrders?: boolean;
  force?: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class WooCommerceService {
  private readonly logger = new Logger(WooCommerceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly wooCommerceConnector: WooCommerceConnector,
    private readonly syncEngine: SyncEngineService,
    private readonly wooCommerceWebhookService: WooCommerceWebhookService,
    @InjectQueue('ecommerce-sync') private readonly syncQueue: Queue,
  ) {}

  /**
   * Connecte une boutique WooCommerce
   * Conforme au plan PHASE 4 - Structure modulaire
   */
  async connect(
    brandId: string,
    config: WooCommerceConnectionConfig,
  ): Promise<{ integrationId: string; status: string }> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    if (!config.siteUrl || typeof config.siteUrl !== 'string' || !config.siteUrl.startsWith('http')) {
      throw new BadRequestException('Valid site URL is required');
    }

    if (!config.consumerKey || typeof config.consumerKey !== 'string' || config.consumerKey.trim().length === 0) {
      throw new BadRequestException('Consumer Key is required');
    }

    if (!config.consumerSecret || typeof config.consumerSecret !== 'string' || config.consumerSecret.trim().length === 0) {
      throw new BadRequestException('Consumer Secret is required');
    }

    try {
      // ✅ Utiliser le connector pour créer l'intégration
      const integration = await this.wooCommerceConnector.connect(
        brandId.trim(),
        config.siteUrl.trim(),
        config.consumerKey.trim(),
        config.consumerSecret.trim(),
      );

      this.logger.log(`WooCommerce integration created: ${integration.id} for brand ${brandId}`);

      return {
        integrationId: integration.id,
        status: integration.status,
      };
    } catch (error) {
      this.logger.error(
        `Failed to connect WooCommerce: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Synchronise les produits WooCommerce
   * Conforme au plan PHASE 4 - Sync minimal MVP
   */
  async syncProducts(brandId: string, options?: WooCommerceSyncOptions): Promise<void> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    try {
      // ✅ Trouver l'intégration WooCommerce
      const integration = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          brandId: brandId.trim(),
          platform: 'woocommerce',
          status: 'active',
        },
      });

      if (!integration) {
        throw new BadRequestException(`No active WooCommerce integration found for brand ${brandId}`);
      }

      // ✅ Utiliser SyncEngine pour centraliser dans BullMQ
      await this.syncEngine.queueSyncJob({
        integrationId: integration.id,
        type: 'product',
        direction: 'import',
        force: options?.force || false,
      });

      this.logger.log(`WooCommerce product sync queued for integration ${integration.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync WooCommerce products: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Synchronise les commandes WooCommerce
   * Conforme au plan PHASE 4 - Sync minimal MVP
   */
  async syncOrders(brandId: string, options?: WooCommerceSyncOptions): Promise<void> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    try {
      // ✅ Trouver l'intégration WooCommerce
      const integration = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          brandId: brandId.trim(),
          platform: 'woocommerce',
          status: 'active',
        },
      });

      if (!integration) {
        throw new BadRequestException(`No active WooCommerce integration found for brand ${brandId}`);
      }

      // ✅ Utiliser SyncEngine pour centraliser dans BullMQ
      await this.syncEngine.queueSyncJob({
        integrationId: integration.id,
        type: 'order',
        direction: 'import',
        force: options?.force || false,
      });

      this.logger.log(`WooCommerce order sync queued for integration ${integration.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync WooCommerce orders: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }  }

  async getConnectionStatus(brandId: string): Promise<{ connected: boolean; siteUrl?: string; status: string; lastSyncAt: Date | null; syncedProductsCount: number }> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) throw new BadRequestException('Brand ID is required');
    const integration = await this.prisma.ecommerceIntegration.findFirst({ where: { brandId: brandId.trim(), platform: 'woocommerce' } });
    if (!integration) return { connected: false, status: 'disconnected', lastSyncAt: null, syncedProductsCount: 0 };
    const syncedProductsCount = await this.prisma.productMapping.count({ where: { integrationId: integration.id } });
    return { connected: integration.status === 'active', siteUrl: integration.shopDomain, status: integration.status, lastSyncAt: integration.lastSyncAt ?? null, syncedProductsCount };
  }
  async disconnect(brandId: string): Promise<void> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) throw new BadRequestException('Brand ID is required');
    const integration = await this.prisma.ecommerceIntegration.findFirst({ where: { brandId: brandId.trim(), platform: 'woocommerce' } });
    if (!integration) throw new BadRequestException('No WooCommerce integration found for brand ' + brandId);
    await this.prisma.ecommerceIntegration.delete({ where: { id: integration.id } });
    this.logger.log('WooCommerce integration removed for brand ' + brandId);
  }
  async handleWebhook(topic: string, body: Record<string, unknown>, signature?: string): Promise<void> {
    const integrations = await this.prisma.ecommerceIntegration.findMany({ where: { platform: 'woocommerce', status: 'active' } });
    if (integrations.length === 0) { this.logger.warn('No active WooCommerce integration'); return; }
    let integration = integrations[0];
    if (signature && integrations.length > 1) {
      const crypto = await import('crypto');
      for (const i of integrations) {
        const secret = ((i.config as Record<string, unknown>)?.webhookSecret || '') + '';
        if (secret) {
          const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(body), 'utf8').digest('base64');
          if (hash === signature) { integration = i; break; }
        }
      }
    }
    const payload = body;
    if (topic === 'order.created') await this.wooCommerceWebhookService.handleOrderCreate(integration.id, payload as unknown as Parameters<WooCommerceWebhookService['handleOrderCreate']>[1]);
    else if (topic === 'order.updated') await this.wooCommerceWebhookService.handleOrderUpdate(integration.id, payload as unknown as Parameters<WooCommerceWebhookService['handleOrderCreate']>[1]);
    else if (topic === 'order.deleted') await this.wooCommerceWebhookService.handleOrderDelete(integration.id, payload as unknown as Parameters<WooCommerceWebhookService['handleOrderCreate']>[1]);
    else if (topic === 'product.created') await this.wooCommerceWebhookService.handleProductCreate(integration.id, payload as unknown as Parameters<WooCommerceWebhookService['handleProductCreate']>[1]);
    else if (topic === 'product.updated') await this.wooCommerceWebhookService.handleProductUpdate(integration.id, payload as unknown as Parameters<WooCommerceWebhookService['handleProductCreate']>[1]);
    else if (topic === 'product.deleted') await this.wooCommerceWebhookService.handleProductDelete(integration.id, payload as unknown as Parameters<WooCommerceWebhookService['handleProductCreate']>[1]);
    else this.logger.warn('Unhandled webhook topic: ' + topic);
  }
  async pushProduct(brandId: string, productData: Record<string, unknown>): Promise<{ externalProductId: string; integrationId: string }> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) throw new BadRequestException('Brand ID is required');
    const integration = await this.prisma.ecommerceIntegration.findFirst({ where: { brandId: brandId.trim(), platform: 'woocommerce', status: 'active' } });
    if (!integration) throw new BadRequestException('No active WooCommerce integration for brand ' + brandId);
    const luneoProductId = productData.luneoProductId;
    const payload = Object.assign({}, productData);
    delete payload.luneoProductId;
    const wooProduct = await this.wooCommerceConnector.upsertProduct(integration.id, payload, undefined);
    if (luneoProductId) {
      const existing = await this.prisma.productMapping.findFirst({ where: { integrationId: integration.id, luneoProductId } });
      if (!existing) await this.prisma.productMapping.create({ data: { integrationId: integration.id, luneoProductId: String(luneoProductId), externalProductId: String(wooProduct.id), externalSku: (typeof wooProduct.sku === 'string' ? wooProduct.sku : '') || (typeof productData.sku === 'string' ? productData.sku : ''), syncStatus: 'synced', lastSyncedAt: new Date() } });
    }
    await this.prisma.ecommerceIntegration.update({ where: { id: integration.id }, data: { lastSyncAt: new Date() } });
    this.logger.log('Pushed product to WooCommerce: ' + wooProduct.id + ' for brand ' + brandId);
    return { externalProductId: String(wooProduct.id), integrationId: integration.id };
  }

}
