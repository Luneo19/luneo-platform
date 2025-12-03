/**
 * Shopify Webhook Handler
 * EC-003: Gestion des webhooks Shopify
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

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

export async function POST(request: NextRequest) {
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
  logger.info('Shopify product created', { 
    shopDomain, 
    productId: product.id,
    title: product.title 
  });
  
  // TODO: Sync product to Luneo database
  // - Create or update product in our database
  // - Import images
  // - Create variants
}

async function handleProductUpdate(shopDomain: string, product: any) {
  logger.info('Shopify product updated', { 
    shopDomain, 
    productId: product.id,
    title: product.title 
  });
  
  // TODO: Update product in Luneo database
}

async function handleProductDelete(shopDomain: string, product: any) {
  logger.info('Shopify product deleted', { 
    shopDomain, 
    productId: product.id 
  });
  
  // TODO: Mark product as deleted in Luneo database
}

async function handleOrderCreate(shopDomain: string, order: any) {
  logger.info('Shopify order created', { 
    shopDomain, 
    orderId: order.id,
    orderNumber: order.name,
    total: order.total_price 
  });
  
  // TODO: Create order in Luneo database
  // - Check for customized products
  // - Start fulfillment workflow if needed
  // - Send notification to user
}

async function handleOrderUpdate(shopDomain: string, order: any) {
  logger.info('Shopify order updated', { 
    shopDomain, 
    orderId: order.id,
    status: order.financial_status 
  });
  
  // TODO: Update order status in Luneo database
}

async function handleOrderFulfilled(shopDomain: string, order: any) {
  logger.info('Shopify order fulfilled', { 
    shopDomain, 
    orderId: order.id 
  });
  
  // TODO: Update order as fulfilled
  // - Send customer notification
  // - Update analytics
}

async function handleInventoryUpdate(shopDomain: string, inventory: any) {
  logger.info('Shopify inventory updated', { 
    shopDomain, 
    itemId: inventory.inventory_item_id,
    available: inventory.available 
  });
  
  // TODO: Sync inventory levels
}

async function handleAppUninstalled(shopDomain: string, _payload: any) {
  logger.warn('Shopify app uninstalled', { shopDomain });
  
  // TODO: Clean up integration
  // - Mark integration as disconnected
  // - Remove webhooks
  // - Notify user
}


