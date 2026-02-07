import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * POST /api/webhooks/woocommerce
 * Reçoit les webhooks WooCommerce et met à jour les commandes/statuts
 * Forward to backend
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.text();
    const headers = request.headers;

    // Forward to backend with all headers
    const backendResponse = await fetch(`${API_URL}/api/v1/webhooks/woocommerce`, {
      method: 'POST',
      headers: {
        'Content-Type': headers.get('content-type') || 'application/json',
        'x-wc-webhook-signature': headers.get('x-wc-webhook-signature') || '',
        'x-wc-webhook-topic': headers.get('x-wc-webhook-topic') || '',
        'x-wc-webhook-store-url': headers.get('x-wc-webhook-store-url') || '',
        'x-wc-webhook-resource': headers.get('x-wc-webhook-resource') || '',
      },
      body,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Failed to process WooCommerce webhook', {
        status: backendResponse.status,
        error: errorText,
        topic: headers.get('x-wc-webhook-topic'),
      });
      throw { status: backendResponse.status, message: 'Erreur lors du traitement du webhook WooCommerce', code: 'WEBHOOK_ERROR' };
    }

    const result = await backendResponse.json();
    logger.info('WooCommerce webhook processed successfully', {
      topic: result.topic,
      resourceId: result.resourceId,
    });

    return result;
  }, '/api/webhooks/woocommerce', 'POST');
}
