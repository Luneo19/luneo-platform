import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * GET /api/billing/verify-session
 * Vérifie une session de checkout Stripe après paiement
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      throw {
        status: 400,
        message: 'Session ID requis',
        code: 'MISSING_SESSION_ID',
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw {
        status: 500,
        message: 'Configuration Stripe manquante',
        code: 'CONFIGURATION_ERROR',
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Récupérer la session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      throw {
        status: 404,
        message: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND',
      };
    }

    // Vérifier que le paiement est complet
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      throw {
        status: 400,
        message: 'Paiement non complété',
        code: 'PAYMENT_INCOMPLETE',
        details: { paymentStatus: session.payment_status },
      };
    }

    // Extraire les informations
    const subscription = session.subscription as Stripe.Subscription | null;
    const customer = session.customer as Stripe.Customer | null;

    // Déterminer le nom du plan
    let planName = session.metadata?.planId || 'Premium';
    if (subscription?.items?.data?.[0]?.price?.nickname) {
      planName = subscription.items.data[0].price.nickname;
    } else if (subscription?.items?.data?.[0]?.price?.product) {
      const productId = subscription.items.data[0].price.product;
      if (typeof productId === 'string') {
        const product = await stripe.products.retrieve(productId);
        planName = product.name || planName;
      }
    }

    const responseData = {
      planName,
      amount: session.amount_total || 0,
      currency: session.currency || 'eur',
      customerEmail: customer?.email || session.customer_email || '',
      subscriptionId: typeof session.subscription === 'string' 
        ? session.subscription 
        : subscription?.id || '',
      trialEnd: subscription?.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : undefined,
    };

    logger.info('Session verified successfully', {
      sessionId,
      planName: responseData.planName,
      customerEmail: responseData.customerEmail,
    });

    return responseData;
  }, '/api/billing/verify-session', 'GET');
}

