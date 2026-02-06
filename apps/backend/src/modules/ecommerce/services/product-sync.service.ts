import { JsonValue } from '@/common/types/utility-types';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EcommerceIntegration, SyncLog } from '@prisma/client';
import { Queue } from 'bullmq';
import { MagentoConnector } from '../connectors/magento/magento.connector';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { ProductSyncRequest, SyncResult } from '../interfaces/ecommerce.interface';

export interface SyncStats {
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

@Injectable()
export class ProductSyncService {
  private readonly logger = new Logger(ProductSyncService.name);

  constructor(
    @InjectQueue('ecommerce-sync') private readonly syncQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly shopifyConnector: ShopifyConnector,
    private readonly woocommerceConnector: WooCommerceConnector,
    private readonly magentoConnector: MagentoConnector,
  ) {}

  /**
   * Synchronise les produits d'une intégration
   */
  async syncProducts(request: ProductSyncRequest): Promise<SyncResult> {
    const { integrationId, productIds, options } = request;

    try {
      // Récupérer l'intégration
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new NotFoundException(`Integration ${integrationId} not found`);
      }

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
          throw new BadRequestException(`Unsupported platform: ${integration.platform}`);
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
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new NotFoundException(`Integration ${integrationId} not found`);
      }

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
    const product = await this.prisma.product.findUnique({
      where: { id: luneoProductId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${luneoProductId} not found`);
    }

    // Vérifier si le produit est déjà mappé
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        luneoProductId,
      },
    });

    const productData = this.transformLuneoProductToExternal(product as any, integration.platform);

    switch (integration.platform) {
      case 'shopify':
        const shopifyProduct = await this.shopifyConnector.upsertProduct(
          integration.id,
          productData,
          mapping?.externalProductId,
        );
        
        if (!mapping) {
          await this.createProductMapping(
            integration.id,
            luneoProductId,
            shopifyProduct.id,
            product.sku || '',
          );
        }
        break;

      case 'woocommerce':
        const wooProduct = await this.woocommerceConnector.upsertProduct(
          integration.id,
          productData,
          mapping ? parseInt(mapping.externalProductId) : undefined,
        );
        
        if (!mapping) {
          await this.createProductMapping(
            integration.id,
            luneoProductId,
            wooProduct.id.toString(),
            product.sku || '',
          );
        }
        break;

      case 'magento':
        const magentoProduct = await this.magentoConnector.upsertProduct(
          integration.id,
          productData,
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

    this.logger.log(`Exported product ${luneoProductId} to ${integration.platform}`);
  }

  /**
   * Transforme un produit LUNEO en format externe
   */
  private transformLuneoProductToExternal(product: Record<string, JsonValue>, platform: string): Record<string, JsonValue> {
    const images = Array.isArray(product.images) 
      ? (product.images as JsonValue[]).filter((img): img is string => typeof img === 'string')
      : [];
    
    switch (platform) {
      case 'shopify':
        return {
          title: product.name as string,
          body_html: (product.description as string) || '',
          vendor: 'LUNEO',
          product_type: 'Customizable',
          tags: ['luneo', 'customizable'],
          variants: [{
            sku: product.sku as string,
            price: (product.price as number)?.toString() || '0',
            inventory_quantity: 1000,
          }],
          images: images.map((src: string, index: number) => ({
            src,
            position: index + 1,
          })),
        };

      case 'woocommerce':
        return {
          name: product.name as string,
          description: (product.description as string) || '',
          short_description: '',
          sku: product.sku as string,
          regular_price: (product.price as number)?.toString() || '0',
          status: product.isActive ? 'publish' : 'draft',
          type: 'simple',
          images: images.map((src: string, index: number) => ({
            src,
            position: index,
          })),
        };

      case 'magento':
        return {
          sku: product.sku,
          name: product.name,
          price: product.price,
          status: product.isActive ? 1 : 2,
          visibility: 4,
          type_id: 'simple',
          attribute_set_id: 4,
        };

      default:
        return product;
    }
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
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
    });
  }

  /**
   * Programme une synchronisation automatique
   */
  async scheduleSyncJob(integrationId: string, interval: 'hourly' | 'daily' | 'weekly'): Promise<void> {
    const cronExpression = this.getCronExpression(interval);
    const job = await this.syncQueue.add(
      'sync-products',
      { integrationId },
      {
        repeat: {
          pattern: cronExpression,
        } as any, // Type assertion pour compatibilité avec @nestjs/bull
      }
    );

    this.logger.log(`Scheduled product sync job for integration ${integrationId}: ${interval}`);
  }

  /**
   * Obtient l'expression cron selon l'intervalle
   */
  private getCronExpression(interval: string): string {
    switch (interval) {
      case 'hourly': return '0 * * * *';
      case 'daily': return '0 2 * * *'; // 2AM
      case 'weekly': return '0 2 * * 0'; // Sunday 2AM
      default: return '0 2 * * *';
    }
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  async getSyncStats(integrationId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<SyncStats> {
    const cacheKey = `sync_stats:${integrationId}:${period}`;
    
    const cached = await this.cache.getSimple<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as SyncStats;
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

      const stats = {
        period,
        totalSyncs: syncLogs.length,
        successfulSyncs: syncLogs.filter(log => log.status === 'SUCCESS').length,
        failedSyncs: syncLogs.filter(log => log.status === 'FAILED').length,
        partialSyncs: syncLogs.filter(log => log.status === 'PARTIAL').length,
        totalItemsProcessed: syncLogs.reduce((sum, log) => sum + log.itemsProcessed, 0),
        totalItemsFailed: syncLogs.reduce((sum, log) => sum + log.itemsFailed, 0),
        averageDuration: syncLogs.length > 0 
          ? syncLogs.reduce((sum, log) => sum + log.duration, 0) / syncLogs.length 
          : 0,
        lastSync: syncLogs[0] || null,
      };

      await this.cache.setSimple(cacheKey, JSON.stringify(stats), 300);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error getting sync stats:`, error);
      throw error;
    }
  }
}


