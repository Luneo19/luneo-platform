/**
 * Shopify Webhook Handler
 * Forward les webhooks Shopify vers le backend NestJS
 * Backend: POST /ecommerce/shopify/webhook
 */

import { NextRequest } from 'next/server';
import { forwardWebhookToBackend } from '@/lib/backend-webhook-forward';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return forwardWebhookToBackend(
    '/ecommerce/shopify/webhook',
    request,
    [
      'x-shopify-topic',
      'x-shopify-shop-domain',
      'x-shopify-hmac-sha256',
    ]
  );
}

/**
 * @deprecated Old implementation - now forwards to backend
 * This code is kept for reference but is no longer used
 */
/*
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Shopify webhook topics we handle
const SUPPORTED_TOPICS = [
  'products/create',
  'products/update',
  'products/delete',
  'orders/create',
  'orders/updated',
  'orders/fulfilled',
  'inventory_levels/update',
  'app/uninstalled',
];

/**
 * Verify Shopify webhook signature
 */
function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}

export async function POST_OLD(request: NextRequest) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const topic = request.headers.get('X-Shopify-Topic');
    const shopDomain = request.headers.get('X-Shopify-Shop-Domain');

    // Log incoming webhook
    logger.info('Shopify webhook received', { topic, shopDomain });

    // Verify webhook signature
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (webhookSecret && hmac) {
      const isValid = verifyShopifyWebhook(body, hmac, webhookSecret);
      if (!isValid) {
        logger.warn('Invalid Shopify webhook signature', { shopDomain, topic });
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const payload = JSON.parse(body);

    // Handle different webhook topics
    switch (topic) {
      case 'products/create':
        await handleProductCreate(shopDomain!, payload);
        break;

      case 'products/update':
        await handleProductUpdate(shopDomain!, payload);
        break;

      case 'products/delete':
        await handleProductDelete(shopDomain!, payload);
        break;

      case 'orders/create':
        await handleOrderCreate(shopDomain!, payload);
        break;

      case 'orders/updated':
        await handleOrderUpdate(shopDomain!, payload);
        break;

      case 'orders/fulfilled':
        await handleOrderFulfilled(shopDomain!, payload);
        break;

      case 'inventory_levels/update':
        await handleInventoryUpdate(shopDomain!, payload);
        break;

      case 'app/uninstalled':
        await handleAppUninstalled(shopDomain!, payload);
        break;

      default:
        logger.warn('Unhandled Shopify webhook topic', { topic });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    logger.error('Shopify webhook error', { error });
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Webhook handlers

async function handleProductCreate(shopDomain: string, product: any) {
  try {
    logger.info('Shopify product created', { 
      shopDomain, 
      productId: product.id,
      title: product.title 
    });
    
    // Find integration by shop domain
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
        status: 'active',
      },
    });

    if (!integration) {
      logger.warn('Shopify integration not found for webhook', { shopDomain });
      return;
    }

    // Check if product mapping exists
    const existingMapping = await db.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        externalProductId: product.id.toString(),
      },
    });

    if (existingMapping) {
      // Update existing product
      await db.product.update({
        where: { id: existingMapping.luneoProductId },
        data: {
          name: product.title,
          description: product.body_html || '',
          imageUrl: product.images?.[0]?.src || null,
          metadata: {
            shopifyProductId: product.id,
            shopifyHandle: product.handle,
            variants: product.variants,
          } as any,
        },
      });
      logger.info('Shopify product updated in Luneo', { productId: existingMapping.luneoProductId });
    } else {
      // Create product in Luneo database
      const luneoProduct = await db.product.create({
        data: {
          brandId: integration.brandId,
          name: product.title,
          description: product.body_html || '',
          sku: product.variants?.[0]?.sku || product.handle,
          price: parseFloat(product.variants?.[0]?.price || '0'),
          currency: 'EUR',
          images: product.images?.map((img: any) => img.src) || [],
          imageUrl: product.images?.[0]?.src || null,
          isActive: product.status === 'active',
          isPublic: product.published_at ? true : false,
          metadata: {
            shopifyProductId: product.id,
            shopifyHandle: product.handle,
            shopifyVariants: product.variants,
            importedAt: new Date().toISOString(),
          } as any,
        },
      });

      // Create product mapping
      await db.productMapping.create({
        data: {
          integrationId: integration.id,
          luneoProductId: luneoProduct.id,
          externalProductId: product.id.toString(),
          externalSku: product.variants?.[0]?.sku || '',
          syncStatus: 'synced',
          metadata: {
            shopifyVariants: product.variants,
            lastSyncedAt: new Date().toISOString(),
          } as any,
        },
      });
      logger.info('Shopify product mapping created', { shopifyProductId: product.id });
    }
  } catch (error: any) {
    logger.error('Error handling Shopify product create', { error, shopDomain, productId: product.id });
  }
}

async function handleProductUpdate(shopDomain: string, product: any) {
  try {
    logger.info('Shopify product updated', { 
      shopDomain, 
      productId: product.id,
      title: product.title 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Find product mapping
    const mapping = await db.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        externalProductId: product.id.toString(),
      },
    });

    if (mapping && !mapping.luneoProductId.startsWith('temp_')) {
      // Update product in Luneo
      await db.product.update({
        where: { id: mapping.luneoProductId },
        data: {
          name: product.title,
          description: product.body_html || '',
          imageUrl: product.images?.[0]?.src || null,
          metadata: {
            shopifyProductId: product.id,
            shopifyHandle: product.handle,
            variants: product.variants,
            updatedAt: new Date().toISOString(),
          } as any,
        },
      });
      logger.info('Shopify product synced to Luneo', { productId: mapping.luneoProductId });
    }
  } catch (error: any) {
    logger.error('Error handling Shopify product update', { error, shopDomain, productId: product.id });
  }
}

async function handleProductDelete(shopDomain: string, product: any) {
  try {
    logger.info('Shopify product deleted', { 
      shopDomain, 
      productId: product.id 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Find and update product mapping
    const mapping = await db.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        externalProductId: product.id.toString(),
      },
    });

    if (mapping) {
      // Mark product as deleted in metadata or archive it
      if (!mapping.luneoProductId.startsWith('temp_')) {
        await db.product.update({
          where: { id: mapping.luneoProductId },
          data: {
            metadata: {
              ...((await db.product.findUnique({ where: { id: mapping.luneoProductId }, select: { metadata: true } }))?.metadata as any || {}),
              deleted: true,
              deletedAt: new Date().toISOString(),
              shopifyDeleted: true,
            } as any,
          },
        });
      }

      // Update mapping
      await db.productMapping.update({
        where: { id: mapping.id },
        data: {
          syncStatus: 'deleted',
        },
      });

      logger.info('Shopify product marked as deleted in Luneo', { productId: mapping.luneoProductId });
    }
  } catch (error: any) {
    logger.error('Error handling Shopify product delete', { error, shopDomain, productId: product.id });
  }
}

async function handleOrderCreate(shopDomain: string, order: any) {
  try {
    logger.info('Shopify order created', { 
      shopDomain, 
      orderId: order.id,
      orderNumber: order.name,
      total: order.total_price 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Check if order already exists
    const existingOrder = await db.order.findFirst({
      where: {
        orderNumber: order.name,
        brandId: integration.brandId,
      },
    });

    if (existingOrder) {
      logger.info('Shopify order already exists in Luneo', { orderId: existingOrder.id });
      return;
    }

    // Check for customized products in line items
    const customizedItems = (order.line_items || []).filter((item: any) => 
      item.properties?.some((prop: any) => prop.name === 'customization_id' || prop.name === 'luneo_customization')
    );

    if (customizedItems.length === 0) {
      logger.info('Shopify order has no customized products, skipping', { orderId: order.id });
      return;
    }

    // Extract customization IDs
    const customizationIds = customizedItems
      .map((item: any) => 
        item.properties?.find((prop: any) => prop.name === 'customization_id' || prop.name === 'luneo_customization')?.value
      )
      .filter(Boolean);

    // Get first customization to find product
    const firstCustomization = customizationIds[0] 
      ? await db.customization.findUnique({
          where: { id: customizationIds[0] },
          select: { productId: true, userId: true },
        })
      : null;

    // Create order in Luneo
    const luneoOrder = await db.order.create({
      data: {
        orderNumber: order.name,
        status: 'CREATED',
        customerEmail: order.email || '',
        customerName: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim() || order.customer?.first_name || '',
        customerPhone: order.shipping_address?.phone || '',
        shippingAddress: order.shipping_address as any,
        subtotalCents: Math.round((order.subtotal_price || 0) * 100),
        taxCents: Math.round((order.total_tax || 0) * 100),
        shippingCents: Math.round((order.total_shipping_price_set?.shop_money?.amount || 0) * 100),
        totalCents: Math.round((order.total_price || 0) * 100),
        currency: order.currency || 'USD',
        paymentStatus: order.financial_status === 'paid' ? 'SUCCEEDED' : 'PENDING',
        metadata: {
          shopifyOrderId: order.id,
          shopifyOrderName: order.name,
          lineItems: customizedItems,
          customizationIds,
        } as any,
        userId: firstCustomization?.userId || '',
        brandId: integration.brandId,
        productId: firstCustomization?.productId || '',
        designId: customizationIds[0] || '',
      },
    });

    // Log webhook
    await db.webhookLog.create({
      data: {
        integrationId: integration.id,
        eventType: 'ORDER_CREATED',
        payload: order as any,
        success: true,
        responseData: { luneoOrderId: luneoOrder.id } as any,
      },
    });

    logger.info('Shopify order created in Luneo', { 
      shopifyOrderId: order.id,
      luneoOrderId: luneoOrder.id 
    });
  } catch (error: any) {
    logger.error('Error handling Shopify order create', { error, shopDomain, orderId: order.id });
  }
}

async function handleOrderUpdate(shopDomain: string, order: any) {
  try {
    logger.info('Shopify order updated', { 
      shopDomain, 
      orderId: order.id,
      status: order.financial_status 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Find order by order number
    const luneoOrder = await db.order.findFirst({
      where: {
        orderNumber: order.name,
        brandId: integration.brandId,
      },
    });

    if (!luneoOrder) {
      logger.warn('Shopify order not found in Luneo', { orderNumber: order.name });
      return;
    }

    // Map Shopify status to Luneo status
    const statusMap: Record<string, any> = {
      'pending': 'CREATED',
      'authorized': 'CREATED',
      'paid': 'PAID',
      'partially_paid': 'PAID',
      'refunded': 'REFUNDED',
      'voided': 'CANCELLED',
    };

    const newStatus = statusMap[order.financial_status] || luneoOrder.status;

    // Update order
    await db.order.update({
      where: { id: luneoOrder.id },
      data: {
        status: newStatus,
        paymentStatus: order.financial_status === 'paid' ? 'SUCCEEDED' : 'PENDING',
        metadata: {
          ...(luneoOrder.metadata as any || {}),
          shopifyFinancialStatus: order.financial_status,
          shopifyFulfillmentStatus: order.fulfillment_status,
          updatedAt: new Date().toISOString(),
        } as any,
      },
    });

    logger.info('Shopify order updated in Luneo', { orderId: luneoOrder.id, newStatus });
  } catch (error: any) {
    logger.error('Error handling Shopify order update', { error, shopDomain, orderId: order.id });
  }
}

async function handleOrderFulfilled(shopDomain: string, order: any) {
  try {
    logger.info('Shopify order fulfilled', { 
      shopDomain, 
      orderId: order.id 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Find order
    const luneoOrder = await db.order.findFirst({
      where: {
        orderNumber: order.name,
        brandId: integration.brandId,
      },
    });

    if (!luneoOrder) {
      return;
    }

    // Update order as shipped
    await db.order.update({
      where: { id: luneoOrder.id },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
        trackingNumber: order.fulfillments?.[0]?.tracking_number || null,
        shippingProvider: order.fulfillments?.[0]?.tracking_company || null,
        metadata: {
          ...(luneoOrder.metadata as any || {}),
          shopifyFulfillments: order.fulfillments,
          fulfilledAt: new Date().toISOString(),
        } as any,
      },
    });

    // Send notification
    const { notificationService } = await import('@/lib/services/NotificationService');
    await notificationService.createNotification({
      userId: luneoOrder.userId,
      type: 'order',
      title: 'Commande expédiée',
      message: `Votre commande ${luneoOrder.orderNumber} a été expédiée.`,
      actionUrl: `/dashboard/orders/${luneoOrder.id}`,
    });

    logger.info('Shopify order fulfilled in Luneo', { orderId: luneoOrder.id });
  } catch (error: any) {
    logger.error('Error handling Shopify order fulfilled', { error, shopDomain, orderId: order.id });
  }
}

async function handleInventoryUpdate(shopDomain: string, inventory: any) {
  try {
    logger.info('Shopify inventory updated', { 
      shopDomain, 
      itemId: inventory.inventory_item_id,
      available: inventory.available 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Update product metadata with inventory info
    // This would require finding the product by variant SKU
    // For now, log the update
    logger.info('Shopify inventory update received', {
      integrationId: integration.id,
      inventoryItemId: inventory.inventory_item_id,
      available: inventory.available,
    });
  } catch (error: any) {
    logger.error('Error handling Shopify inventory update', { error, shopDomain });
  }
}

async function handleAppUninstalled(shopDomain: string, _payload: any) {
  try {
    logger.warn('Shopify app uninstalled', { shopDomain });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
      },
    });

    if (!integration) {
      return;
    }

    // Mark integration as inactive
    await db.ecommerceIntegration.update({
      where: { id: integration.id },
      data: {
        status: 'inactive',
        config: {
          ...(integration.config as any || {}),
          uninstalledAt: new Date().toISOString(),
        } as any,
      },
    });

    // Notify brand admin
    const brand = await db.brand.findUnique({
      where: { id: integration.brandId },
      select: { userId: true },
    });

    if (brand?.userId) {
      const { notificationService } = await import('@/lib/services/NotificationService');
      await notificationService.createNotification({
        userId: brand.userId,
        type: 'system',
        title: 'Intégration Shopify désactivée',
        message: `L'intégration Shopify pour ${shopDomain} a été désinstallée.`,
        actionUrl: `/dashboard/integrations`,
      });
    }

    logger.info('Shopify integration deactivated', { integrationId: integration.id });
  } catch (error: any) {
    logger.error('Error handling Shopify app uninstalled', { error, shopDomain });
  }
}


