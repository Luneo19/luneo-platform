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
    }
  }
}
