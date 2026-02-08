/**
 * WooCommerce Webhook Service
 * Handles WooCommerce webhook events and syncs with Luneo database
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrencyUtils } from '@/config/currency.config';
import { OrderStatus } from '@prisma/client';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { JsonValue } from '@/common/types/utility-types';

interface WooCommerceProduct {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  status: 'draft' | 'pending' | 'private' | 'publish';
  images?: Array<{ src: string; alt?: string }>;
  variations?: number[];
  type: 'simple' | 'variable' | 'grouped' | 'external';
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  manage_stock?: boolean;
  stock_quantity?: number;
}

interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  customer_id?: number;
  line_items: Array<{
    id: number;
    product_id: number;
    variation_id?: number;
    name: string;
    quantity: number;
    total: string;
    meta_data?: Array<{ key: string; value: string }>;
  }>;
  billing?: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  shipping?: {
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

@Injectable()
export class WooCommerceWebhookService {
  private readonly logger = new Logger(WooCommerceWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wooCommerceConnector: WooCommerceConnector,
  ) {}

  /**
   * Handle product.created webhook
   * Syncs WooCommerce product to Luneo database
   */
  async handleProductCreate(
    integrationId: string,
    product: WooCommerceProduct,
  ): Promise<void> {
    try {
      this.logger.log(`Syncing WooCommerce product ${product.id} to Luneo`, {
        integrationId,
        productId: product.id,
        productName: product.name,
      });

      // Check if product mapping already exists
      const existingMapping = await this.prisma.productMapping.findFirst({
        where: {
          integrationId,
          externalProductId: product.id.toString(),
        },
        include: {
          product: true,
        },
      });

      if (existingMapping) {
        this.logger.warn(`Product ${product.id} already synced, updating instead`);
        await this.handleProductUpdate(integrationId, product);
        return;
      }

      // Get integration to get brandId
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: integrationId },
        select: { brandId: true },
      });

      if (!integration) {
        throw new NotFoundException(`Integration ${integrationId} not found`);
      }

      // Create product in Luneo database
      const luneoProduct = await this.prisma.product.create({
        data: {
          brandId: integration.brandId,
          name: product.name,
          description: product.description || null,
          sku: product.sku || `WC-${product.id}`,
          price: parseFloat(product.sale_price || product.price || '0'),
          currency: CurrencyUtils.getDefaultCurrency(),
          images: product.images?.map(img => img.src) || [],
          isActive: product.status === 'publish',
          isPublic: product.status === 'publish',
        },
      });

      // Create product mapping
      await this.prisma.productMapping.create({
        data: {
          integrationId,
          luneoProductId: luneoProduct.id,
          externalProductId: product.id.toString(),
          externalSku: product.sku || `WC-${product.id}`,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          metadata: {
            source: 'woocommerce',
            originalPrice: product.regular_price,
            salePrice: product.sale_price,
            stockStatus: product.stock_status,
            stockQuantity: product.stock_quantity,
          },
        },
      });

      this.logger.log(`Successfully synced WooCommerce product ${product.id} to Luneo product ${luneoProduct.id}`);
    } catch (error) {
      this.logger.error(`Failed to sync WooCommerce product ${product.id}`, error);
      throw error;
    }
  }

  /**
   * Handle product.updated webhook
   * Updates Luneo product from WooCommerce changes
   */
  async handleProductUpdate(
    integrationId: string,
    product: WooCommerceProduct,
  ): Promise<void> {
    try {
      this.logger.log(`Updating Luneo product from WooCommerce product ${product.id}`, {
        integrationId,
        productId: product.id,
      });

      // Find existing mapping
      const mapping = await this.prisma.productMapping.findFirst({
        where: {
          integrationId,
          externalProductId: product.id.toString(),
        },
      });

      if (!mapping) {
        this.logger.warn(`Product mapping not found for WooCommerce product ${product.id}, creating instead`);
        await this.handleProductCreate(integrationId, product);
        return;
      }

      // Update product in Luneo database
      await this.prisma.product.update({
        where: { id: mapping.luneoProductId },
        data: {
          name: product.name,
          description: product.description || null,
          sku: product.sku || mapping.externalSku,
          price: parseFloat(product.sale_price || product.price || '0'),
          images: product.images?.map(img => img.src) || [],
          isActive: product.status === 'publish',
          isPublic: product.status === 'publish',
        },
      });

      // Update mapping
      await this.prisma.productMapping.update({
        where: { id: mapping.id },
        data: {
          externalSku: product.sku || mapping.externalSku,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          metadata: {
            source: 'woocommerce',
            originalPrice: product.regular_price,
            salePrice: product.sale_price,
            stockStatus: product.stock_status,
            stockQuantity: product.stock_quantity,
            lastUpdated: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Successfully updated Luneo product ${mapping.luneoProductId} from WooCommerce product ${product.id}`);
    } catch (error) {
      this.logger.error(`Failed to update Luneo product from WooCommerce product ${product.id}`, error);
      throw error;
    }
  }

  /**
   * Handle product.deleted webhook
   * Archives or marks product as inactive in Luneo
   */
  async handleProductDelete(
    integrationId: string,
    product: WooCommerceProduct,
  ): Promise<void> {
    try {
      this.logger.log(`Handling deletion of WooCommerce product ${product.id}`, {
        integrationId,
        productId: product.id,
      });

      // Find existing mapping
      const mapping = await this.prisma.productMapping.findFirst({
        where: {
          integrationId,
          externalProductId: product.id.toString(),
        },
      });

      if (!mapping) {
        this.logger.warn(`Product mapping not found for WooCommerce product ${product.id}`);
        return;
      }

      // Mark product as inactive (soft delete)
      await this.prisma.product.update({
        where: { id: mapping.luneoProductId },
        data: {
          isActive: false,
          isPublic: false,
        },
      });

      // Update mapping status
      await this.prisma.productMapping.update({
        where: { id: mapping.id },
        data: {
          syncStatus: 'deleted',
          lastSyncedAt: new Date(),
          metadata: {
            ...((mapping.metadata as Record<string, JsonValue> | null) || {}),
            deletedAt: new Date().toISOString(),
            deletedFrom: 'woocommerce',
          },
        },
      });

      this.logger.log(`Successfully archived Luneo product ${mapping.luneoProductId} from WooCommerce product ${product.id}`);
    } catch (error) {
      this.logger.error(`Failed to handle deletion of WooCommerce product ${product.id}`, error);
      throw error;
    }
  }

  /**
   * Handle order.created webhook
   * Creates order in Luneo database and extracts customization metadata
   */
  async handleOrderCreate(
    integrationId: string,
    order: WooCommerceOrder,
  ): Promise<void> {
    try {
      this.logger.log(`Creating Luneo order from WooCommerce order ${order.id}`, {
        integrationId,
        orderId: order.id,
        orderNumber: order.number,
      });

      // Get integration
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: integrationId },
        select: { brandId: true },
      });

      if (!integration) {
        throw new NotFoundException(`Integration ${integrationId} not found`);
      }

      // Process line items to find customized products
      for (const lineItem of order.line_items) {
        // Find product mapping
        const mapping = await this.prisma.productMapping.findFirst({
          where: {
            integrationId,
            externalProductId: lineItem.product_id.toString(),
          },
          include: {
            product: true,
          },
        });

        if (!mapping) {
          this.logger.warn(`Product mapping not found for WooCommerce product ${lineItem.product_id}`);
          continue;
        }

        // Extract customization metadata from line item meta_data
        const customizationMeta = lineItem.meta_data?.find(
          meta => meta.key === 'luneo_design_id' || meta.key === 'customization'
        );

        if (customizationMeta) {
          // Create order in Luneo database
          const designId = customizationMeta.value;
          
          // Verify design exists
          const design = await this.prisma.design.findUnique({
            where: { id: designId },
          });

          if (!design) {
            this.logger.warn(`Design ${designId} not found for order ${order.id}`);
            continue;
          }

          // Create order
          const luneoOrder = await this.prisma.order.create({
            data: {
              orderNumber: `WC-${order.number}`,
              status: this.mapWooCommerceOrderStatus(order.status) as OrderStatus,
              customerEmail: order.billing?.email || '',
              customerName: order.billing 
                ? `${order.billing.first_name} ${order.billing.last_name}`.trim()
                : null,
              customerPhone: order.billing?.phone || null,
              shippingAddress: order.shipping ? {
                street: order.shipping.address_1,
                street2: order.shipping.address_2,
                city: order.shipping.city,
                state: order.shipping.state,
                postalCode: order.shipping.postcode,
                country: order.shipping.country,
              } : null,
              subtotalCents: Math.round(parseFloat(order.total) * 100),
              taxCents: 0,
              shippingCents: 0,
              totalCents: Math.round(parseFloat(order.total) * 100),
              currency: CurrencyUtils.normalize(order.currency || CurrencyUtils.getDefaultCurrency()),
              brandId: integration.brandId,
              productId: mapping.luneoProductId,
              designId: designId,
              metadata: {
                source: 'woocommerce',
                wooCommerceOrderId: order.id,
                wooCommerceOrderNumber: order.number,
                lineItemId: lineItem.id,
                customerId: order.customer_id,
              },
            },
          });

          this.logger.log(`Successfully created Luneo order ${luneoOrder.id} from WooCommerce order ${order.id}`);

          // Trigger fulfillment workflow (if needed)
          // This would typically be handled by a job queue
          // await this.fulfillmentService.triggerFulfillment(luneoOrder.id);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to create Luneo order from WooCommerce order ${order.id}`, error);
      throw error;
    }
  }

  /**
   * Handle order.updated webhook
   * Syncs order status changes and handles refunds
   */
  async handleOrderUpdate(
    integrationId: string,
    order: WooCommerceOrder,
  ): Promise<void> {
    try {
      this.logger.log(`Updating Luneo order from WooCommerce order ${order.id}`, {
        integrationId,
        orderId: order.id,
        status: order.status,
      });

      // Find Luneo order by metadata
      const luneoOrders = await this.prisma.order.findMany({
        where: {
          brandId: (await this.prisma.ecommerceIntegration.findUnique({
            where: { id: integrationId },
            select: { brandId: true },
          }))?.brandId,
          metadata: {
            path: ['wooCommerceOrderId'],
            equals: order.id.toString(),
          },
        },
      });

      if (luneoOrders.length === 0) {
        this.logger.warn(`Luneo order not found for WooCommerce order ${order.id}`);
        return;
      }

      // Update all related orders
      for (const luneoOrder of luneoOrders) {
        await this.prisma.order.update({
          where: { id: luneoOrder.id },
          data: {
            status: this.mapWooCommerceOrderStatus(order.status),
            metadata: {
              ...((luneoOrder.metadata as Record<string, JsonValue> | null) || {}),
              lastSyncedAt: new Date().toISOString(),
              wooCommerceStatus: order.status,
            },
          },
        });
      }

      this.logger.log(`Successfully updated ${luneoOrders.length} Luneo order(s) from WooCommerce order ${order.id}`);
    } catch (error) {
      this.logger.error(`Failed to update Luneo order from WooCommerce order ${order.id}`, error);
      throw error;
    }
  }

  /**
   * Handle order.deleted webhook
   * Cancels pending fulfillment and updates statistics
   */
  async handleOrderDelete(
    integrationId: string,
    order: WooCommerceOrder,
  ): Promise<void> {
    try {
      this.logger.log(`Handling deletion of WooCommerce order ${order.id}`, {
        integrationId,
        orderId: order.id,
      });

      // Find Luneo orders
      const integration = await this.prisma.ecommerceIntegration.findUnique({
        where: { id: integrationId },
        select: { brandId: true },
      });

      if (!integration) {
        throw new NotFoundException(`Integration ${integrationId} not found`);
      }

      const luneoOrders = await this.prisma.order.findMany({
        where: {
          brandId: integration.brandId,
          metadata: {
            path: ['wooCommerceOrderId'],
            equals: order.id.toString(),
          },
        },
      });

      // Cancel orders that are not yet fulfilled
      for (const luneoOrder of luneoOrders) {
        if (['CREATED', 'PENDING_PAYMENT', 'PAID'].includes(luneoOrder.status)) {
          await this.prisma.order.update({
            where: { id: luneoOrder.id },
            data: {
              status: 'CANCELLED',
              metadata: {
                ...((luneoOrder.metadata as Record<string, JsonValue> | null) || {}),
                cancelledAt: new Date().toISOString(),
                cancelledFrom: 'woocommerce',
              },
            },
          });
        }
      }

      this.logger.log(`Successfully handled deletion of WooCommerce order ${order.id}`);
    } catch (error) {
      this.logger.error(`Failed to handle deletion of WooCommerce order ${order.id}`, error);
      throw error;
    }
  }

  /**
   * Map WooCommerce order status to Luneo OrderStatus
   */
  private mapWooCommerceOrderStatus(wooStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      'pending': OrderStatus.PENDING_PAYMENT,
      'processing': OrderStatus.PROCESSING,
      'on-hold': OrderStatus.PENDING_PAYMENT,
      'completed': OrderStatus.DELIVERED,
      'cancelled': OrderStatus.CANCELLED,
      'refunded': OrderStatus.REFUNDED,
      'failed': OrderStatus.CANCELLED,
    };

    return statusMap[wooStatus.toLowerCase()] || OrderStatus.CREATED;
  }
}

