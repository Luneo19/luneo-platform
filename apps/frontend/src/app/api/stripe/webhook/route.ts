import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { NextRequest } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/stripe/webhook
 * 
 * ⚠️ DEPRECATED: This webhook handler is deprecated.
 * Stripe webhooks should be configured to point to the backend API:
 * https://api.luneo.app/billing/webhook (or your backend URL)
 * 
 * This route is kept for backward compatibility but should be removed
 * once Stripe webhooks are reconfigured to use the backend endpoint.
 * 
 * The backend webhook handler provides:
 * - Proper credit purchase handling via CreditsService
 * - Subscription management
 * - Better error handling and logging
 * - Idempotency checks
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Forward Stripe webhook to backend API
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      throw {
        status: 400,
        message: 'Signature Stripe manquante',
        code: 'VALIDATION_ERROR',
      };
    }

    // Forward to backend webhook endpoint
    const response = await fetch(`${API_URL}/api/v1/billing/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors du traitement du webhook Stripe' }));
      serverLogger.error('Backend webhook processing failed', {
        status: response.status,
        error: errorData,
      });
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors du traitement du webhook Stripe',
        code: 'WEBHOOK_PROCESSING_ERROR',
      };
    }

    const result = await response.json();

    serverLogger.info('Stripe webhook forwarded to backend', {
      eventId: result.eventId,
      processed: result.processed,
    });

    return {
      success: true,
      processed: result.processed || true,
      result,
      message: 'Webhook Stripe traité avec succès',
    };
  }, '/api/stripe/webhook', 'POST');
}

// Handler functions removed - webhook processing is now handled by backend API
