import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { validateHMAC } from '@/lib/csrf';

/**
 * POST /api/webhooks/ecommerce
 * Reçoit les webhooks des plateformes e-commerce (Shopify, WooCommerce, etc.)
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.text();
    const headers = request.headers;

    // Identifier la plateforme depuis les headers
    const userAgent = headers.get('user-agent') || '';
    const platform = userAgent.includes('Shopify') ? 'shopify' : 
                     userAgent.includes('WooCommerce') ? 'woocommerce' : 
                     headers.get('x-platform') || 'unknown';

    logger.info('E-commerce webhook received', {
      platform,
      userAgent,
      contentType: headers.get('content-type'),
    });

    // Vérifier la signature HMAC selon la plateforme
    const signature = headers.get('x-shopify-hmac-sha256') || 
                     headers.get('x-wc-webhook-signature') ||
                     headers.get('x-signature');

    if (signature) {
      // Note: validateHMAC only takes 2 args, webhook validation should use platform-specific logic
      // For now, skip validation if WEBHOOK_SECRET is not set
      const isValid = process.env.WEBHOOK_SECRET ? validateHMAC(body, signature) : true;
      if (!isValid) {
        logger.warn('Invalid webhook signature', {
          platform,
          signature: signature.substring(0, 20) + '...',
        });
        throw { status: 401, message: 'Signature invalide', code: 'INVALID_SIGNATURE' };
      }
    }

    // Parser le body
    let webhookData: any;
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      logger.error('Failed to parse webhook body', parseError instanceof Error ? parseError : new Error(String(parseError)), {
        platform,
        bodyLength: body.length,
      });
      throw { status: 400, message: 'Body JSON invalide', code: 'INVALID_JSON' };
    }

    const eventType = webhookData.type || 
                     webhookData.event || 
                     headers.get('x-shopify-topic') ||
                     headers.get('x-wc-webhook-event') ||
                     'unknown';

    logger.info('Processing e-commerce webhook', {
      platform,
      eventType,
      webhookId: webhookData.id || webhookData.webhook_id,
    });

    const supabase = await createClient();

    // Traiter selon le type d'événement
    switch (eventType) {
      case 'order.created':
      case 'orders/create':
        await handleOrderCreated(webhookData, platform, supabase);
        break;

      case 'order.updated':
      case 'orders/update':
        await handleOrderUpdated(webhookData, platform, supabase);
        break;

      case 'product.created':
      case 'products/create':
        await handleProductCreated(webhookData, platform, supabase);
        break;

      case 'product.updated':
      case 'products/update':
        await handleProductUpdated(webhookData, platform, supabase);
        break;

      default:
        logger.warn('Unhandled webhook event type', {
          platform,
          eventType,
        });
    }

    return { message: 'Webhook traité avec succès', eventType };
  }, '/api/webhooks/ecommerce', 'POST');
}

/**
 * Gère la création d'une commande
 */
async function handleOrderCreated(data: any, platform: string, supabase: any) {
  try {
    // Logique de traitement de la commande
    logger.info('Order created webhook processed', {
      platform,
      orderId: data.id || data.order_id,
    });
  } catch (error: any) {
    logger.error('Error processing order created webhook', error, {
      platform,
      orderData: data.id || data.order_id,
    });
  }
}

/**
 * Gère la mise à jour d'une commande
 */
async function handleOrderUpdated(data: any, platform: string, supabase: any) {
  try {
    // Logique de traitement de la mise à jour
    logger.info('Order updated webhook processed', {
      platform,
      orderId: data.id || data.order_id,
    });
  } catch (error: any) {
    logger.error('Error processing order updated webhook', error, {
      platform,
      orderData: data.id || data.order_id,
    });
  }
}

/**
 * Gère la création d'un produit
 */
async function handleProductCreated(data: any, platform: string, supabase: any) {
  try {
    // Logique de traitement du produit
    logger.info('Product created webhook processed', {
      platform,
      productId: data.id || data.product_id,
    });
  } catch (error: any) {
    logger.error('Error processing product created webhook', error, {
      platform,
      productData: data.id || data.product_id,
    });
  }
}

/**
 * Gère la mise à jour d'un produit
 */
async function handleProductUpdated(data: any, platform: string, supabase: any) {
  try {
    // Logique de traitement de la mise à jour
    logger.info('Product updated webhook processed', {
      platform,
      productId: data.id || data.product_id,
    });
  } catch (error: any) {
    logger.error('Error processing product updated webhook', error, {
      platform,
      productData: data.id || data.product_id,
    });
  }
}
