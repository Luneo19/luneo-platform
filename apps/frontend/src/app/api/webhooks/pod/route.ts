import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * POST /api/webhooks/pod
 * Webhook pour les services Print-on-Demand (POD)
 * Forward to backend
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.text();
    const headers = request.headers;

    // Forward to backend with all headers
    const backendResponse = await fetch(`${API_URL}/api/v1/webhooks/pod`, {
      method: 'POST',
      headers: {
        'Content-Type': headers.get('content-type') || 'application/json',
        'x-pod-signature': headers.get('x-pod-signature') || '',
        'x-pod-webhook-id': headers.get('x-pod-webhook-id') || '',
        'x-pod-provider': headers.get('x-pod-provider') || 'unknown',
      },
      body,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Failed to process POD webhook', {
        status: backendResponse.status,
        error: errorText,
      });
      throw { status: backendResponse.status, message: 'Erreur lors du traitement du webhook POD', code: 'WEBHOOK_ERROR' };
    }

    const result = await backendResponse.json();
    logger.info('POD webhook processed', {
      provider: headers.get('x-pod-provider'),
      processed: result.processed,
    });

    return result;
  }, '/api/webhooks/pod', 'POST');
}
