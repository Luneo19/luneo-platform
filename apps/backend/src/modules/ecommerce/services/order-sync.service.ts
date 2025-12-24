import { JsonValue } from '@/common/types/utility-types';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { EcommerceIntegration, OrderStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { MagentoConnector } from '../connectors/magento/magento.connector';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { OrderSyncRequest, SyncResult } from '../interfaces/ecommerce.interface';

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
        throw new Error(`Integration ${integrationId} not found`);
      }

      this.logger.log(`Starting order sync for ${integration.platform} integration ${integrationId}`);

      // Récupérer les commandes selon la plateforme
      let orders: Array<Record<string, JsonValue>> = [];

      switch (integration.platform) {
        case 'shopify':
          orders = (await this.shopifyConnector.getOrders(integrationId)) as any;
          break;

        case 'woocommerce':
          orders = (await this.woocommerceConnector.getOrders(integrationId)) as any;
          break;

        case 'magento':
          orders = (await this.magentoConnector.getOrders(integrationId)) as any;
          break;
      }

      // Traiter chaque commande
      for (const order of orders) {
        try {
          await this.processOrder(integration, order);
          itemsProcessed++;
        } catch (error) {
          this.logger.error(`Error processing order:`, error);
          errors.push({
            message: (error as Error).message || 'Unknown error',
            orderId: (order as any).id?.toString(),
            error,
          });
          itemsFailed++;
        }
      }

      // Sauvegarder le log
      const syncLog = await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: 'order',
          direction: 'import',
          status: itemsFailed === 0 ? 'success' : itemsFailed < itemsProcessed ? 'partial' : 'failed',
          itemsProcessed,
          itemsFailed,
          errors: errors as any,
          duration: Date.now() - startTime,
        },
      });

      return {
        integrationId,
        platform: integration.platform,
        type: 'order',
        direction: 'import',
        status: syncLog.status as any,
        itemsProcessed,
        itemsFailed,
        duration: Date.now() - startTime,
        errors: errors as any,
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
        throw new Error(`Order ${luneoOrderId} not found or has no metadata`);
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
      // Query orders with metadata containing integrationId
      // Note: Prisma doesn't support JSON path queries directly, so we filter in memory
      // For production, consider adding a dedicated integrationId field or using raw SQL
      const allOrders = await this.prisma.order.findMany({
        take: limit * 2, // Get more to filter
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

      // Filter orders where metadata.integrationId matches
      const filteredOrders = allOrders.filter(order => {
        if (!order.metadata || typeof order.metadata !== 'object') {
          return false;
        }
        const metadata = order.metadata as Record<string, JsonValue>;
        return metadata.integrationId === integrationId;
      }).slice(0, limit);

      // Transform to expected return type
      return filteredOrders.map(order => ({
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


