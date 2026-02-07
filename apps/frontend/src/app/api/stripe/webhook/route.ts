import Stripe from 'stripe';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Initialisation paresseuse de Stripe
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-10-29.clover' as any,
    });
  }
  return stripeInstance;
}

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
      logger.error('Backend webhook processing failed', {
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

    logger.info('Stripe webhook forwarded to backend', {
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
