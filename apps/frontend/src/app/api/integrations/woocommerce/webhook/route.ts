/**
 * WooCommerce Webhook Handler
 * EC-003: Gestion des webhooks WooCommerce
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

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
  logger.info('WooCommerce product created', { 
    source, 
    productId: product.id,
    name: product.name 
  });
  
  // TODO: Sync product to Luneo database
  // - Create product record
  // - Import images
  // - Create variants if variable product
}

async function handleProductUpdate(source: string, product: any) {
  logger.info('WooCommerce product updated', { 
    source, 
    productId: product.id,
    name: product.name 
  });
  
  // TODO: Update product in Luneo database
  // - Update basic info
  // - Sync price changes
  // - Update stock levels
}

async function handleProductDelete(source: string, product: any) {
  logger.info('WooCommerce product deleted', { 
    source, 
    productId: product.id 
  });
  
  // TODO: Handle product deletion
  // - Mark product as deleted or archive
  // - Update related designs
}

async function handleOrderCreate(source: string, order: any) {
  logger.info('WooCommerce order created', { 
    source, 
    orderId: order.id,
    orderNumber: order.number,
    total: order.total,
    status: order.status
  });
  
  // TODO: Create order in Luneo database
  // - Check line items for customized products
  // - Extract customization metadata
  // - Trigger fulfillment workflow
  // - Send notification
}

async function handleOrderUpdate(source: string, order: any) {
  logger.info('WooCommerce order updated', { 
    source, 
    orderId: order.id,
    status: order.status 
  });
  
  // TODO: Update order in Luneo database
  // - Sync status changes
  // - Update fulfillment progress
  // - Handle refunds if applicable
}

async function handleOrderDelete(source: string, order: any) {
  logger.info('WooCommerce order deleted', { 
    source, 
    orderId: order.id 
  });
  
  // TODO: Handle order deletion
  // - Cancel any pending fulfillment
  // - Update statistics
}


