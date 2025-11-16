import { Injectable, Logger } from '@nestjs/common';
import { Prisma, EcommerceIntegration as PrismaEcommerceIntegration } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { MagentoConnector } from '../connectors/magento/magento.connector';
import {
  SyncResult,
  OrderSyncRequest,
  SyncError,
  ShopifyOrder,
  WooCommerceOrder,
  MagentoOrder,
} from '../interfaces/ecommerce.interface';

@Injectable()
export class OrderSyncService {
  private readonly logger = new Logger(OrderSyncService.name);

  constructor(
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
    const errors: SyncError[] = [];
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
      let orders: PlatformOrder[] = [];

      switch (integration.platform) {
        case 'shopify':
          orders = await this.shopifyConnector.getOrders(integrationId);
          break;

        case 'woocommerce':
          orders = await this.woocommerceConnector.getOrders(integrationId);
          break;

        case 'magento':
          orders = await this.magentoConnector.getOrders(integrationId);
          break;
      }

      // Traiter chaque commande
      for (const order of orders) {
        const orderId = this.getOrderIdentifier(order);
        if (orderIds && orderIds.length > 0 && !orderIds.includes(orderId)) {
          continue;
        }

        try {
          await this.processOrder(integration, order);
          itemsProcessed++;
        } catch (error) {
          this.logger.error(`Error processing order:`, error);
          errors.push({
            itemId: orderId,
            code: 'PROCESS_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          itemsFailed++;
        }
      }

      // Sauvegarder le log
      const syncStatus: SyncResult['status'] =
        itemsFailed === 0 ? 'success' : itemsProcessed === 0 ? 'failed' : 'partial';

      const syncLog = await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: 'order',
          direction: 'import',
          status: syncStatus,
          itemsProcessed,
          itemsFailed,
          errors: this.toJson(errors),
          duration: Date.now() - startTime,
        },
      });

      return {
        integrationId,
        platform: integration.platform,
        type: 'order',
        direction: 'import',
        status: syncStatus,
        itemsProcessed,
        itemsFailed,
        duration: Date.now() - startTime,
        errors,
        summary: {
          created: itemsProcessed - itemsFailed,
          updated: 0,
          deleted: 0,
          skipped: itemsFailed,
        },
        createdAt: syncLog.createdAt,
      };
    } catch (error) {
      this.logger.error(`Order sync failed:`, error);
      throw error;
    }
  }

  /**
   * Traite une commande
   */
  private async processOrder(
    integration: PrismaEcommerceIntegration,
    order: PlatformOrder,
  ): Promise<void> {
    // Logique métier à implémenter : pour l'instant, simple journalisation
    this.logger.log(`Processing order ${this.getOrderIdentifier(order)} from ${integration.platform}`);
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

      const metadata = this.parseOrderMetadata(order.metadata);
      const externalStatus = this.mapLuneoStatusToExternal(status, integration.platform);

      // Mettre à jour selon la plateforme
      switch (integration.platform) {
        case 'shopify':
          if (metadata.shopifyOrderId !== undefined && metadata.shopifyOrderId !== null) {
            await this.shopifyConnector.updateOrderStatus(
              integration.id,
              String(metadata.shopifyOrderId),
              externalStatus,
            );
          }
          break;

        case 'woocommerce':
          if (metadata.woocommerceOrderId !== undefined && metadata.woocommerceOrderId !== null) {
            const orderIdNumber = Number(metadata.woocommerceOrderId);
            if (!Number.isFinite(orderIdNumber)) {
              this.logger.warn(`Invalid WooCommerce order id in metadata for ${luneoOrderId}`);
              break;
            }
            await this.woocommerceConnector.updateOrderStatus(
              integration.id,
              orderIdNumber,
              externalStatus,
            );
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
  async getRecentOrders(integrationId: string, limit: number = 50): Promise<RecentOrder[]> {
    try {
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
          product: true,
          design: true,
        },
      });

      return orders as RecentOrder[];
    } catch (error) {
      this.logger.error(`Error fetching recent orders:`, error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de commandes
   */
  async getOrderStats(
    integrationId: string,
    period: 'day' | 'week' | 'month' = 'week',
  ): Promise<OrderStats> {
    const cacheKey = `order_stats:${integrationId}:${period}`;
    
    const cached = await this.cache.getSimple(cacheKey);
    if (cached) {
      return cached as OrderStats;
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

      const orders = await this.prisma.order.findMany({
        where: {
          metadata: {
            path: ['integrationId'],
            equals: integrationId,
          },
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        select: {
          status: true,
          totalCents: true,
        },
      });

      const stats: OrderStats = {
        period,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalCents, 0) / 100,
        ordersByStatus: orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageOrderValue: orders.length > 0
          ? orders.reduce((sum, order) => sum + order.totalCents, 0) / orders.length / 100
          : 0,
      };

      await this.cache.setSimple(cacheKey, stats, 300);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error getting order stats:`, error);
      throw error;
    }
  }

  private parseOrderMetadata(metadata: Prisma.JsonValue | null): OrderIntegrationMetadata {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }

    const record = metadata as Record<string, unknown>;

    return {
      integrationId: typeof record.integrationId === 'string' ? record.integrationId : undefined,
      shopifyOrderId: record.shopifyOrderId,
      woocommerceOrderId: record.woocommerceOrderId,
      lineItemId: record.lineItemId,
      customProperties: record.customProperties,
      customMeta: record.customMeta,
    };
  }

  private getOrderIdentifier(order: PlatformOrder): string {
    if (isShopifyOrder(order)) {
      return order.id.toString();
    }

    if (isWooCommerceOrder(order)) {
      return order.id.toString();
    }

    return order.entity_id.toString();
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }
}

type PlatformOrder = ShopifyOrder | WooCommerceOrder | MagentoOrder;

interface OrderIntegrationMetadata {
  integrationId?: string;
  shopifyOrderId?: unknown;
  woocommerceOrderId?: unknown;
  lineItemId?: unknown;
  customProperties?: unknown;
  customMeta?: unknown;
}

interface OrderStats {
  period: 'day' | 'week' | 'month';
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  averageOrderValue: number;
}

type RecentOrder = Prisma.OrderGetPayload<{ include: { product: true; design: true } }>;

function isShopifyOrder(order: PlatformOrder): order is ShopifyOrder {
  return 'order_number' in order;
}

function isWooCommerceOrder(order: PlatformOrder): order is WooCommerceOrder {
  return 'line_items' in order && 'billing' in order && 'shipping' in order;
}

