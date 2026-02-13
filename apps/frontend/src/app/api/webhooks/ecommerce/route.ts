import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/webhooks/ecommerce
 * Reçoit les webhooks des plateformes e-commerce (Shopify, WooCommerce, etc.)
 * Forward to backend
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.text();
    const headers = request.headers;

    // Forward to backend with all headers
    const backendResponse = await fetch(`${API_URL}/api/v1/webhooks/ecommerce`, {
      method: 'POST',
      headers: {
        'Content-Type': headers.get('content-type') || 'application/json',
        'user-agent': headers.get('user-agent') || '',
        'x-platform': headers.get('x-platform') || '',
        'x-shopify-hmac-sha256': headers.get('x-shopify-hmac-sha256') || '',
        'x-wc-webhook-signature': headers.get('x-wc-webhook-signature') || '',
        'x-signature': headers.get('x-signature') || '',
        'x-shopify-topic': headers.get('x-shopify-topic') || '',
        'x-wc-webhook-event': headers.get('x-wc-webhook-event') || '',
      },
      body,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      serverLogger.error('Failed to process e-commerce webhook', {
        status: backendResponse.status,
        error: errorText,
      });
      throw { status: backendResponse.status, message: 'Erreur lors du traitement du webhook', code: 'WEBHOOK_ERROR' };
    }

    const result = await backendResponse.json();
    serverLogger.info('E-commerce webhook processed', {
      eventType: result.eventType,
    });

    return result;
  }, '/api/webhooks/ecommerce', 'POST');
}
