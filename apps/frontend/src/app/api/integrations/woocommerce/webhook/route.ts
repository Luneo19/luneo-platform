/**
 * WooCommerce Webhook Handler
 * EC-003: Gestion des webhooks WooCommerce
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// WooCommerce webhook topics
const SUPPORTED_TOPICS = [
  'product.created',
  'product.updated',
  'product.deleted',
  'order.created',
  'order.updated',
  'order.deleted',
];

/**
 * Verify WooCommerce webhook signature
 */
function verifyWooCommerceWebhook(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-WC-Webhook-Signature');
    const topic = request.headers.get('X-WC-Webhook-Topic');
    const source = request.headers.get('X-WC-Webhook-Source');
    const deliveryId = request.headers.get('X-WC-Webhook-Delivery-ID');

    // Log incoming webhook
    logger.info('WooCommerce webhook received', { topic, source, deliveryId });

    // Verify webhook signature
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWooCommerceWebhook(body, signature, webhookSecret);
      if (!isValid) {
        logger.warn('Invalid WooCommerce webhook signature', { source, topic });
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
      case 'product.created':
        await handleProductCreate(source!, payload);
        break;

      case 'product.updated':
        await handleProductUpdate(source!, payload);
        break;

      case 'product.deleted':
        await handleProductDelete(source!, payload);
        break;

      case 'order.created':
        await handleOrderCreate(source!, payload);
        break;

      case 'order.updated':
        await handleOrderUpdate(source!, payload);
        break;

      case 'order.deleted':
        await handleOrderDelete(source!, payload);
        break;

      default:
        logger.warn('Unhandled WooCommerce webhook topic', { topic });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    logger.error('WooCommerce webhook error', { error });
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Webhook handlers

async function handleProductCreate(source: string, product: any) {
  try {
    logger.info('WooCommerce product created', { 
      source, 
      productId: product.id,
      name: product.name 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain: source,
        platform: 'woocommerce',
        status: 'active',
      },
    });

    if (!integration) {
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
          name: product.name,
          description: product.description || '',
          imageUrl: product.images?.[0]?.src || null,
          metadata: {
            wooProductId: product.id,
            wooSku: product.sku,
            wooPrice: product.price,
          } as any,
        },
      });
    } else {
      // Create product in Luneo database
      const luneoProduct = await db.product.create({
        data: {
          brandId: integration.brandId,
          name: product.name,
          description: product.description || '',
          sku: product.sku || product.slug,
          price: parseFloat(product.price || '0'),
          currency: 'USD',
          images: product.images?.map((img: any) => img.src) || [],
          imageUrl: product.images?.[0]?.src || null,
          isActive: product.status === 'publish',
          isPublic: true,
          metadata: {
            wooProductId: product.id,
            wooSlug: product.slug,
            wooPrice: product.price,
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
          externalSku: product.sku || '',
          syncStatus: 'synced',
          metadata: {
            wooPrice: product.price,
            lastSyncedAt: new Date().toISOString(),
          } as any,
        },
      });
    }
  } catch (error: any) {
    logger.error('Error handling WooCommerce product create', { error, source, productId: product.id });
  }
}

async function handleProductUpdate(source: string, product: any) {
  try {
    logger.info('WooCommerce product updated', { 
      source, 
      productId: product.id,
      name: product.name 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain: source,
        platform: 'woocommerce',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Find mapping
    const mapping = await db.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        externalProductId: product.id.toString(),
      },
    });

    if (mapping && !mapping.luneoProductId.startsWith('temp_')) {
      await db.product.update({
        where: { id: mapping.luneoProductId },
        data: {
          name: product.name,
          description: product.description || '',
          imageUrl: product.images?.[0]?.src || null,
          metadata: {
            wooProductId: product.id,
            wooSku: product.sku,
            wooPrice: product.price,
            stockStatus: product.stock_status,
            updatedAt: new Date().toISOString(),
          } as any,
        },
      });
    }
  } catch (error: any) {
    logger.error('Error handling WooCommerce product update', { error, source, productId: product.id });
  }
}

async function handleProductDelete(source: string, product: any) {
  try {
    logger.info('WooCommerce product deleted', { 
      source, 
      productId: product.id 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain: source,
        platform: 'woocommerce',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Find mapping
    const mapping = await db.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        externalProductId: product.id.toString(),
      },
    });

    if (mapping) {
      if (!mapping.luneoProductId.startsWith('temp_')) {
        await db.product.update({
          where: { id: mapping.luneoProductId },
          data: {
            metadata: {
              ...((await db.product.findUnique({ where: { id: mapping.luneoProductId }, select: { metadata: true } }))?.metadata as any || {}),
              deleted: true,
              deletedAt: new Date().toISOString(),
              wooDeleted: true,
            } as any,
          },
        });
      }

      await db.productMapping.update({
        where: { id: mapping.id },
        data: { syncStatus: 'deleted' },
      });
    }
  } catch (error: any) {
    logger.error('Error handling WooCommerce product delete', { error, source, productId: product.id });
  }
}

async function handleOrderCreate(source: string, order: any) {
  try {
    logger.info('WooCommerce order created', { 
      source, 
      orderId: order.id,
      orderNumber: order.number,
      total: order.total,
      status: order.status
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain: source,
        platform: 'woocommerce',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Check if order exists
    const existingOrder = await db.order.findFirst({
      where: {
        orderNumber: order.number?.toString() || `WC-${order.id}`,
        brandId: integration.brandId,
      },
    });

    if (existingOrder) {
      return;
    }

    // Check for customized products
    const customizedItems = (order.line_items || []).filter((item: any) => 
      item.meta_data?.some((meta: any) => meta.key === 'customization_id' || meta.key === 'luneo_customization')
    );

    if (customizedItems.length === 0) {
      return;
    }

    // Extract customization IDs
    const customizationIds = customizedItems
      .map((item: any) => 
        item.meta_data?.find((meta: any) => meta.key === 'customization_id' || meta.key === 'luneo_customization')?.value
      )
      .filter(Boolean);

    const firstCustomization = customizationIds[0] 
      ? await db.customization.findUnique({
          where: { id: customizationIds[0] },
          select: { productId: true, userId: true },
        })
      : null;

    // Create order
    const luneoOrder = await db.order.create({
      data: {
        orderNumber: order.number?.toString() || `WC-${order.id}`,
        status: order.status === 'completed' ? 'DELIVERED' : 'CREATED',
        customerEmail: order.billing?.email || '',
        customerName: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
        customerPhone: order.billing?.phone || '',
        shippingAddress: {
          name: `${order.shipping?.first_name || ''} ${order.shipping?.last_name || ''}`.trim(),
          street: order.shipping?.address_1 || '',
          city: order.shipping?.city || '',
          postalCode: order.shipping?.postcode || '',
          country: order.shipping?.country || '',
          phone: order.billing?.phone || '',
          state: order.shipping?.state || '',
        } as any,
        subtotalCents: Math.round((parseFloat(order.total || '0') - parseFloat(order.total_tax || '0') - parseFloat(order.shipping_total || '0')) * 100),
        taxCents: Math.round(parseFloat(order.total_tax || '0') * 100),
        shippingCents: Math.round(parseFloat(order.shipping_total || '0') * 100),
        totalCents: Math.round(parseFloat(order.total || '0') * 100),
        currency: order.currency || 'USD',
        paymentStatus: order.status === 'completed' ? 'SUCCEEDED' : 'PENDING',
        metadata: {
          wooOrderId: order.id,
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

    logger.info('WooCommerce order created in Luneo', { 
      wooOrderId: order.id,
      luneoOrderId: luneoOrder.id 
    });
  } catch (error: any) {
    logger.error('Error handling WooCommerce order create', { error, source, orderId: order.id });
  }
}

async function handleOrderUpdate(source: string, order: any) {
  try {
    logger.info('WooCommerce order updated', { 
      source, 
      orderId: order.id,
      status: order.status 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain: source,
        platform: 'woocommerce',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Find order
    const luneoOrder = await db.order.findFirst({
      where: {
        orderNumber: order.number?.toString() || `WC-${order.id}`,
        brandId: integration.brandId,
      },
    });

    if (!luneoOrder) {
      return;
    }

    // Map WooCommerce status to Luneo status
    const statusMap: Record<string, any> = {
      'pending': 'CREATED',
      'processing': 'PROCESSING',
      'on-hold': 'CREATED',
      'completed': 'DELIVERED',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'failed': 'CANCELLED',
    };

    const newStatus = statusMap[order.status] || luneoOrder.status;

    await db.order.update({
      where: { id: luneoOrder.id },
      data: {
        status: newStatus,
        paymentStatus: order.status === 'completed' ? 'SUCCEEDED' : 'PENDING',
        metadata: {
          ...(luneoOrder.metadata as any || {}),
          wooStatus: order.status,
          updatedAt: new Date().toISOString(),
        } as any,
      },
    });

    logger.info('WooCommerce order updated in Luneo', { orderId: luneoOrder.id, newStatus });
  } catch (error: any) {
    logger.error('Error handling WooCommerce order update', { error, source, orderId: order.id });
  }
}

async function handleOrderDelete(source: string, order: any) {
  try {
    logger.info('WooCommerce order deleted', { 
      source, 
      orderId: order.id 
    });
    
    // Find integration
    const integration = await db.ecommerceIntegration.findFirst({
      where: {
        shopDomain: source,
        platform: 'woocommerce',
        status: 'active',
      },
    });

    if (!integration) {
      return;
    }

    // Find order
    const luneoOrder = await db.order.findFirst({
      where: {
        orderNumber: order.number?.toString() || `WC-${order.id}`,
        brandId: integration.brandId,
      },
    });

    if (!luneoOrder) {
      return;
    }

    // Cancel order if not already delivered
    if (luneoOrder.status !== 'DELIVERED') {
      await db.order.update({
        where: { id: luneoOrder.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          metadata: {
            ...(luneoOrder.metadata as any || {}),
            wooDeleted: true,
            deletedAt: new Date().toISOString(),
          } as any,
        },
      });

      logger.info('WooCommerce order cancelled in Luneo', { orderId: luneoOrder.id });
    }
  } catch (error: any) {
    logger.error('Error handling WooCommerce order delete', { error, source, orderId: order.id });
  }
}


