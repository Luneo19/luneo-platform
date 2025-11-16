import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  Product as PrismaProduct,
  EcommerceIntegration as PrismaEcommerceIntegration,
  SyncLog,
} from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { MagentoConnector } from '../connectors/magento/magento.connector';
import { EcommerceSyncQueueService } from './ecommerce-sync-queue.service';
import {
  SyncResult,
  SyncOptions,
  ProductSyncRequest,
  EcommerceIntegration,
  EcommerceConfig,
  ShopifyProduct,
  WooCommerceProduct,
  MagentoProduct,
} from '../interfaces/ecommerce.interface';

@Injectable()
export class ProductSyncService {
  private readonly logger = new Logger(ProductSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly shopifyConnector: ShopifyConnector,
    private readonly woocommerceConnector: WooCommerceConnector,
    private readonly magentoConnector: MagentoConnector,
    private readonly syncQueueService: EcommerceSyncQueueService,
  ) {}

  /**
   * Synchronise les produits d'une intégration
   */
  async syncProducts(request: ProductSyncRequest): Promise<SyncResult> {
    const { integrationId, options } = request;

    try {
      // Récupérer l'intégration
      const integration = await this.getIntegration(integrationId);

      this.logger.log(`Starting product sync for ${integration.platform} integration ${integrationId}`);

      // Synchroniser selon la plateforme
      let result: SyncResult;

      switch (integration.platform) {
        case 'shopify':
          result = await this.shopifyConnector.syncProducts(integrationId, options);
          break;

        case 'woocommerce':
          result = await this.woocommerceConnector.syncProducts(integrationId, options);
          break;

        case 'magento':
          result = await this.magentoConnector.syncProducts(integrationId, options);
          break;

        default:
          throw new Error(`Unsupported platform: ${integration.platform}`);
      }

      // Mettre à jour la dernière sync
      await this.prisma.ecommerceIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date() },
      });

      this.logger.log(`Product sync completed: ${result.itemsProcessed} products processed`);

      return result;
    } catch (error) {
      this.logger.error(`Product sync failed for integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Synchronise un produit spécifique
   */
  async syncProduct(
    integrationId: string,
    luneoProductId: string,
    direction: 'import' | 'export' = 'export',
  ): Promise<void> {
    try {
      const integration = await this.getIntegration(integrationId);

      if (direction === 'export') {
        // Exporter le produit LUNEO vers la plateforme e-commerce
        await this.exportProduct(integration, luneoProductId);
      } else {
        // Importer depuis la plateforme (nécessite l'ID externe)
        this.logger.warn('Import of single product requires external product ID');
      }
    } catch (error) {
      this.logger.error(`Product sync failed:`, error);
      throw error;
    }
  }

  /**
   * Exporte un produit LUNEO vers la plateforme e-commerce
   */
  private async exportProduct(integration: EcommerceIntegration, luneoProductId: string): Promise<void> {
    const product = await this.getProduct(luneoProductId);
    const sku = product.sku ?? product.id;

    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        luneoProductId,
      },
    });

    switch (integration.platform) {
      case 'shopify': {
        const productInput = this.transformLuneoProductToExternal(product, 'shopify');
        const shopifyProduct = await this.shopifyConnector.upsertProduct(
          integration.id,
          productInput,
          mapping?.externalProductId,
        );

        if (!mapping) {
          await this.createProductMapping(
            integration.id,
            luneoProductId,
            shopifyProduct.id,
            sku,
          );
        }
        break;
      }

      case 'woocommerce': {
        const productInput = this.transformLuneoProductToExternal(product, 'woocommerce');
        const wooProduct = await this.woocommerceConnector.upsertProduct(
          integration.id,
          productInput,
          mapping ? Number.parseInt(mapping.externalProductId, 10) : undefined,
        );

        if (!mapping) {
          await this.createProductMapping(
            integration.id,
            luneoProductId,
            wooProduct.id.toString(),
            sku,
          );
        }
        break;
      }

      case 'magento': {
        const productInput = this.transformLuneoProductToExternal(product, 'magento');
        const magentoProduct = await this.magentoConnector.upsertProduct(
          integration.id,
          productInput,
          mapping?.externalSku,
        );

        if (!mapping) {
          await this.createProductMapping(
            integration.id,
            luneoProductId,
            magentoProduct.id.toString(),
            magentoProduct.sku,
          );
        }
        break;
      }
    }

    this.logger.log(`Exported product ${luneoProductId} to ${integration.platform}`);
  }

  /**
   * Transforme un produit LUNEO en format externe
   */
  private transformLuneoProductToExternal(
    product: PrismaProduct,
    platform: 'shopify',
  ): Partial<ShopifyProduct>;
  private transformLuneoProductToExternal(
    product: PrismaProduct,
    platform: 'woocommerce',
  ): Partial<WooCommerceProduct>;
  private transformLuneoProductToExternal(
    product: PrismaProduct,
    platform: 'magento',
  ): Partial<MagentoProduct>;
  private transformLuneoProductToExternal(
    product: PrismaProduct,
    platform: EcommerceIntegration['platform'],
  ):
    | Partial<ShopifyProduct>
    | Partial<WooCommerceProduct>
    | Partial<MagentoProduct> {
    const sku = product.sku ?? product.id;
    const priceValue = typeof product.price === 'number' ? product.price : 0;

    switch (platform) {
      case 'shopify':
        return {
          title: product.name,
          body_html: product.description ?? '',
          vendor: 'LUNEO',
          product_type: 'Customizable',
          tags: ['luneo', 'customizable'],
          variants: [
            {
              title: product.name,
              price: priceValue.toString(),
              sku,
              position: 1,
              inventory_quantity: 1000,
            },
          ],
          images: (product.images ?? []).map((src, index) => ({
            src,
            position: index + 1,
          })),
          status: product.isActive ? 'active' : 'draft',
        };

      case 'woocommerce':
        return {
          name: product.name,
          type: 'simple',
          status: product.isActive ? 'publish' : 'draft',
          description: product.description ?? '',
          short_description: '',
          sku,
          price: priceValue.toString(),
          regular_price: priceValue.toString(),
          sale_price: priceValue.toString(),
          images: (product.images ?? []).map((src, index) => ({
            src,
            name: product.name,
            alt: product.name,
            position: index,
          })),
        };

      case 'magento':
        return {
          sku,
          name: product.name,
          price: priceValue,
          status: product.isActive ? 1 : 2,
          visibility: 4,
          type_id: 'simple',
          attribute_set_id: 4,
          media_gallery_entries: (product.images ?? []).map((src, index) => ({
            id: index + 1,
            media_type: 'image',
            label: product.name,
            position: index,
            disabled: false,
            types: ['image'],
            file: src,
          })),
        };
    }

    return {};
  }

  /**
   * Crée un mapping de produit
   */
  private async createProductMapping(
    integrationId: string,
    luneoProductId: string,
    externalProductId: string,
    sku: string,
  ): Promise<void> {
    await this.prisma.productMapping.create({
      data: {
        integrationId,
        luneoProductId,
        externalProductId,
        externalSku: sku,
        syncStatus: 'synced' as const,
        lastSyncedAt: new Date(),
      },
    });
  }

  /**
   * Programme une synchronisation automatique
   */
  async scheduleSyncJob(integrationId: string, interval: 'hourly' | 'daily' | 'weekly'): Promise<void> {
    await this.syncQueueService.scheduleProductsSync(
      integrationId,
      this.getCronExpression(interval),
    );

    this.logger.log(`Scheduled product sync job for integration ${integrationId}: ${interval}`);
  }

  /**
   * Obtient l'expression cron selon l'intervalle
   */
  private getCronExpression(interval: 'hourly' | 'daily' | 'weekly'): string {
    switch (interval) {
      case 'hourly':
        return '0 * * * *';
      case 'daily':
        return '0 2 * * *';
      case 'weekly':
        return '0 2 * * 0';
    }
    return '0 2 * * *';
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  async getSyncStats(integrationId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<SyncStats> {
    const cacheKey = `sync_stats:${integrationId}:${period}`;
    
    const cached = await this.cache.getSimple(cacheKey);
    if (cached) {
      return cached as SyncStats;
    }

    try {
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

      const syncLogs = await this.prisma.syncLog.findMany({
        where: {
          integrationId,
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalDuration = syncLogs.reduce((sum, log) => sum + log.duration, 0);

      const stats: SyncStats = {
        period,
        totalSyncs: syncLogs.length,
        successfulSyncs: syncLogs.filter((log) => log.status === 'success').length,
        failedSyncs: syncLogs.filter((log) => log.status === 'failed').length,
        partialSyncs: syncLogs.filter((log) => log.status === 'partial').length,
        totalItemsProcessed: syncLogs.reduce((sum, log) => sum + log.itemsProcessed, 0),
        totalItemsFailed: syncLogs.reduce((sum, log) => sum + log.itemsFailed, 0),
        averageDuration: syncLogs.length > 0 ? totalDuration / syncLogs.length : 0,
        lastSync: syncLogs[0] ?? null,
      };

      await this.cache.setSimple(cacheKey, stats, 300);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error getting sync stats:`, error);
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

  private async getProduct(productId: string): Promise<PrismaProduct> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return product;
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
}

interface SyncStats {
  period: 'day' | 'week' | 'month';
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  partialSyncs: number;
  totalItemsProcessed: number;
  totalItemsFailed: number;
  averageDuration: number;
  lastSync: SyncLog | null;
}


