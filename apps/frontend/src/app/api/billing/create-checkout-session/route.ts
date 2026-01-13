import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { CreateCheckoutSessionSchema } from '@/lib/validations/billing-schemas';
import { checkRateLimit, getClientIdentifier, getApiRateLimit } from '@/lib/rate-limit';
import Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * POST /api/billing/create-checkout-session
 * Crée une session de checkout Stripe pour un abonnement
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Rate limiting (stricter for billing operations)
    const identifier = getClientIdentifier(request);
    const { success, remaining, reset } = await checkRateLimit(identifier, getApiRateLimit());
    
    if (!success) {
      throw {
        status: 429,
        message: `Trop de requêtes. Réessayez après ${reset.toLocaleTimeString()}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
        reset: reset.toISOString(),
      };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = CreateCheckoutSessionSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Données invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { planId, email, billing } = validation.data;

    // Vérifier que la clé Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('STRIPE_SECRET_KEY not configured', new Error('Missing Stripe configuration'));
      throw {
        status: 500,
        message: 'Configuration Stripe manquante',
        code: 'CONFIGURATION_ERROR',
      };
    }

    // Initialiser Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Configuration des Price IDs Stripe - Tarifs Luneo 2025
    // Starter: 29€/mois, 278.40€/an (-20%)
    // Professional: 49€/mois, 470.40€/an (-20%)
    // Business: 99€/mois, 950.40€/an (-20%)
    // Enterprise: Sur demande
    const planPrices: Record<string, { monthly: string | null; yearly: string | null }> = {
      starter: {
        monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_1SY2bqKG9MsM6fdSlgkR5hNX',
        yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_1SY2bxKG9MsM6fdSe78TX8fZ',
      },
      professional: {
        monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_1SY2cEKG9MsM6fdSTKND31Ti',
        yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_1SY2cEKG9MsM6fdSDKL1gPye',
      },
      business: {
        monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_1SY2cTKG9MsM6fdSwoQu1S5I',
        yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_1SY2cUKG9MsM6fdShCcJvXO7',
      },
      enterprise: {
        monthly: null, // Sur demande
        yearly: null,  // Sur demande
      },
    };

    // Sélectionner le bon Price ID selon le cycle
    const priceConfig = planPrices[planId as keyof typeof planPrices];
    if (!priceConfig) {
      throw {
        status: 400,
        message: `Plan ${planId} non reconnu`,
        code: 'INVALID_PLAN',
      };
    }

    const priceId = billing === 'yearly' ? priceConfig.yearly : priceConfig.monthly;

    // Plan Enterprise : sur demande uniquement
    if (planId === 'enterprise') {
      throw {
        status: 400,
        message: 'Le plan Enterprise est disponible sur demande. Veuillez nous contacter.',
        code: 'ENTERPRISE_CONTACT_REQUIRED',
        contactUrl: 'https://luneo.app/contact',
      };
    }

    // Vérifier qu'on a un Price ID valide
    if (!priceId) {
      logger.error('Price ID missing for plan', new Error('Price ID not configured'), {
        planId,
        billing,
        configuredPrices: planPrices,
      });
      throw {
        status: 400,
        message: `Plan ${planId} non configuré`,
        code: 'PLAN_NOT_CONFIGURED',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

    // Configuration des line_items
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      price: priceId,
      quantity: 1,
    };

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'subscription',
      ...(email && { customer_email: email }),
      success_url: `${baseUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        planId,
        billingCycle: billing,
      },
      subscription_data: {
        trial_period_days: 14,
      },
    };

    // Les prix annuels sont maintenant pré-configurés dans Stripe
    // Plus besoin de les créer dynamiquement

    // Créer la session
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(sessionConfig);
    } catch (stripeError: any) {
      logger.error('Error creating Stripe checkout session', stripeError, {
        planId,
        billing,
        email,
      });
      throw {
        status: 500,
        message: `Erreur lors de la création de la session de paiement: ${stripeError.message}`,
        code: 'STRIPE_ERROR',
        details: stripeError.type || 'unknown',
        stripeCode: stripeError.code || null,
      };
    }

    logger.info('Stripe checkout session created', {
      sessionId: session.id,
      planId,
      billing,
      email,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  }, '/api/billing/create-checkout-session', 'POST');
}
