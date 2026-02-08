import { JsonValue } from '@/common/types/utility-types';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
// ENUM-01: Import des enums Prisma pour intégrité des données
import { EcommerceIntegration, OrderStatus, SyncLogStatus, SyncLogType, SyncDirection } from '@prisma/client';
import { Queue } from 'bullmq';
import { MagentoConnector } from '../connectors/magento/magento.connector';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { OrderSyncRequest, SyncResult, SyncError } from '../interfaces/ecommerce.interface';
import type { Prisma } from '@prisma/client';

export interface OrderStats {
  period: 'day' | 'week' | 'month';
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus | string, number>;
  averageOrderValue: number;
}

interface OrderWithStatusAndTotal {
  status: OrderStatus;
  totalCents: number;
}

@Injectable()
export class OrderSyncService {
  private readonly logger = new Logger(OrderSyncService.name);

  constructor(
    @InjectQueue('ecommerce-sync') private readonly syncQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly shopifyConnector: ShopifyConnector,
    private readonly woocommerceConnector: WooCommerceConnector,
    private readonly magentoConnector: MagentoConnector,
  ) {}

  /**
   * Synchronise les commandes d'une intégration
   */
  async syncOrders(request: OrderSyncRequest): Promise<SyncResult> {
    const { integrationId, orderIds, options } = request;
    const startTime = Date.now();
    const errors: Array<{ message: string; orderId?: string; error?: unknown }> = [];
    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new NotFoundException(`Integration ${integrationId} not found`);
      }

      this.logger.log(`Starting order sync for ${integration.platform} integration ${integrationId}`);

      // Récupérer les commandes selon la plateforme
      let orders: Array<Record<string, JsonValue>> = [];

      switch (integration.platform) {
        case 'shopify':
          orders = (await this.shopifyConnector.getOrders(integrationId)) as Array<Record<string, JsonValue>>;
          break;

        case 'woocommerce':
          orders = (await this.woocommerceConnector.getOrders(integrationId)) as Array<Record<string, JsonValue>>;
          break;

        case 'magento':
          orders = (await this.magentoConnector.getOrders(integrationId)) as Array<Record<string, JsonValue>>;
          break;
      }

      // PERF-01: Traiter les commandes en batch (parallèle contrôlé)
      const BATCH_SIZE = 10; // Nombre de commandes traitées en parallèle
      
      for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        
        const results = await Promise.allSettled(
          batch.map(order => this.processOrder(integration, order))
        );
        
        // Analyser les résultats du batch
        results.forEach((result, index) => {
          const order = batch[index];
          if (result.status === 'fulfilled') {
            itemsProcessed++;
          } else {
            this.logger.error(`Error processing order:`, result.reason);
            const orderRecord = order as Record<string, JsonValue>;
            errors.push({
              message: result.reason?.message || 'Unknown error',
              orderId: orderRecord?.id != null ? String(orderRecord.id) : undefined,
              error: result.reason,
            });
            itemsFailed++;
          }
        });
      }

      // Sauvegarder le log - ENUM-01: Utilise enums Prisma
      const syncLog = await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.ORDER,
          direction: SyncDirection.IMPORT,
          status: itemsFailed === 0 ? SyncLogStatus.SUCCESS : itemsFailed < itemsProcessed ? SyncLogStatus.PARTIAL : SyncLogStatus.FAILED,
          itemsProcessed,
          itemsFailed,
          errors: errors as unknown as Prisma.InputJsonValue,
          duration: Date.now() - startTime,
        },
      });

      const statusMap: Record<SyncLogStatus, SyncResult['status']> = {
        [SyncLogStatus.SUCCESS]: 'success',
        [SyncLogStatus.FAILED]: 'failed',
        [SyncLogStatus.PARTIAL]: 'partial',
      };
      return {
        integrationId,
        platform: integration.platform,
        type: 'order',
        direction: 'import',
        status: statusMap[syncLog.status],
        itemsProcessed,
        itemsFailed,
        duration: Date.now() - startTime,
        errors: errors as unknown as SyncError[],
        summary: {
          created: itemsProcessed - itemsFailed,
          updated: 0,
          deleted: 0,
          skipped: itemsFailed,
        },
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Order sync failed:`, error);
      throw error;
    }
  }

  /**
   * Traite une commande
   */
  private async processOrder(integration: EcommerceIntegration, order: Record<string, JsonValue>): Promise<void> {
    // Logique spécifique déjà implémentée dans les connecteurs
    this.logger.log(`Processing order ${order.id} from ${integration.platform}`);
  }

  /**
   * Met à jour le statut d'une commande sur la plateforme externe
   */
  async updateExternalOrderStatus(
    luneoOrderId: string,
    status: string,
  ): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: luneoOrderId },
        select: { 
          metadata: true,
          brandId: true,
        },
      });

      if (!order || !order.metadata) {
        throw new NotFoundException(`Order ${luneoOrderId} not found or has no metadata`);
      }

      // Trouver l'intégration
      const integration = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          brandId: order.brandId,
          status: 'active',
        },
      });

      if (!integration) {
        this.logger.warn(`No active integration found for order ${luneoOrderId}`);
        return;
      }

      const metadata = (order.metadata as Record<string, JsonValue> | null) || {};
      const externalStatus = this.mapLuneoStatusToExternal(status, integration.platform);

      // Mettre à jour selon la plateforme
      switch (integration.platform) {
        case 'shopify':
          const shopifyOrderId = metadata.shopifyOrderId;
          if (shopifyOrderId && typeof shopifyOrderId === 'string') {
            await this.shopifyConnector.updateOrderStatus(
              integration.id,
              shopifyOrderId,
              externalStatus,
            );
          }
          break;

        case 'woocommerce':
          const woocommerceOrderId = metadata.woocommerceOrderId;
          if (woocommerceOrderId) {
            const orderId = typeof woocommerceOrderId === 'string' 
              ? parseInt(woocommerceOrderId, 10) 
              : typeof woocommerceOrderId === 'number' 
                ? woocommerceOrderId 
                : null;
            if (orderId !== null && !isNaN(orderId)) {
              await this.woocommerceConnector.updateOrderStatus(
                integration.id,
                orderId,
                externalStatus,
              );
            }
          }
          break;

        case 'magento':
          // Magento update order status (à implémenter si nécessaire)
          this.logger.log(`Magento order status update not yet implemented`);
          break;
      }

      this.logger.log(`Updated external order status to ${externalStatus}`);
    } catch (error) {
      this.logger.error(`Error updating external order status:`, error);
      throw error;
    }
  }

  /**
   * Mappe le statut LUNEO vers le statut externe
   */
  private mapLuneoStatusToExternal(luneoStatus: string, platform: string): string {
    const shopifyMap: Record<string, string> = {
      'PROCESSING': 'processing',
      'SHIPPED': 'shipped',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded',
    };

    const woocommerceMap: Record<string, string> = {
      'PROCESSING': 'processing',
      'SHIPPED': 'completed',
      'DELIVERED': 'completed',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded',
    };

    switch (platform) {
      case 'shopify':
        return shopifyMap[luneoStatus] || 'processing';
      case 'woocommerce':
        return woocommerceMap[luneoStatus] || 'processing';
      case 'magento':
        return luneoStatus.toLowerCase();
      default:
        return luneoStatus;
    }
  }

  /**
   * Obtient les commandes récentes d'une intégration
   * PERF-03: Filtrage en DB au lieu de mémoire avec Prisma JSON path
   */
  async getRecentOrders(integrationId: string, limit: number = 50): Promise<Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    createdAt: Date;
    product: { id: string; name: string; price: number };
    design: { id: string; prompt: string; previewUrl: string | null };
  }>> {
    try {
      // PERF-03: Utilise le filtrage JSON path de Prisma directement en DB
      const orders = await this.prisma.order.findMany({
        where: {
          metadata: {
            path: ['integrationId'],
            equals: integrationId,
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          design: {
            select: {
              id: true,
              prompt: true,
              previewUrl: true,
            },
          },
        },
      });

      // Transform to expected return type
      return orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalCents: order.totalCents,
        createdAt: order.createdAt,
        product: {
          id: order.product.id,
          name: order.product.name,
          price: Number(order.product.price),
        },
        design: {
          id: order.design.id,
          prompt: order.design.prompt,
          previewUrl: order.design.previewUrl,
        },
      }));
    } catch (error) {
      this.logger.error(`Error fetching recent orders:`, error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de commandes
   */
  async getOrderStats(integrationId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<OrderStats> {
    const cacheKey = `order_stats:${integrationId}:${period}`;
    
    const cached = await this.cache.getSimple<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as OrderStats;
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

      // Query orders with metadata filter
      // Note: Prisma JSON field filtering requires proper typing
      const orders = await this.prisma.order.findMany({
        where: {
          metadata: {
            path: ['integrationId'],
            equals: integrationId,
          } as Record<string, JsonValue>,
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        select: {
          status: true,
          totalCents: true,
        },
      }) as OrderWithStatusAndTotal[];

      const stats = {
        period,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalCents, 0) / 100,
        ordersByStatus: orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageOrderValue: orders.length > 0
          ? orders.reduce((sum: number, order: OrderWithStatusAndTotal) => sum + order.totalCents, 0) / orders.length / 100
          : 0,
      };

      await this.cache.setSimple(cacheKey, JSON.stringify(stats), 300);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error getting order stats:`, error);
      throw error;
    }
  }
}


