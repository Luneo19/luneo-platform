import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * POST /api/billing/portal
 * Crée une session du portail client Stripe
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw {
        status: 500,
        message: 'Configuration Stripe manquante',
        code: 'CONFIGURATION_ERROR',
      };
    }

    const body = await request.json();
    const { customerId, returnUrl } = body;

    if (!customerId) {
      throw {
        status: 400,
        message: 'Customer ID requis',
        code: 'MISSING_CUSTOMER_ID',
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

    // Créer la session du portail client
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${baseUrl}/dashboard/billing`,
    });

    logger.info('Billing portal session created', {
      customerId,
      sessionUrl: session.url?.substring(0, 50),
    });

    return {
      url: session.url,
    };
  }, '/api/billing/portal', 'POST');
}

