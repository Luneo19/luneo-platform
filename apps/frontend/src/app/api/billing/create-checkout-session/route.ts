import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { CreateCheckoutSessionSchema } from '@/lib/validations/billing-schemas';
import Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * POST /api/billing/create-checkout-session
 * Crée une session de checkout Stripe pour un abonnement
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });

    // Configuration des Price IDs depuis les variables d'environnement
    // Prix mensuels: utilisent des Price IDs (price_xxx)
    // Prix annuels: utilisent des lookup keys (xxx-annual)
    const planPrices: Record<string, { monthly: string | null; yearly: string | null; yearlyIsLookupKey?: boolean }> = {
      starter: { monthly: null, yearly: null }, // Plan gratuit, pas de paiement
      professional: {
        monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_1RvB1uKG9MM6fdSnrGm2qIo',
        yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'professional-annual',
        yearlyIsLookupKey: !process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
      },
      business: {
        monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_1SH7SxKG9MM6fdSetmxFnVl',
        yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'business-annual',
        yearlyIsLookupKey: !process.env.STRIPE_PRICE_BUSINESS_YEARLY,
      },
      enterprise: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_1SH7TMKG9MM6fdSx4pebEXZ',
        yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'enterprise-annual',
        yearlyIsLookupKey: !process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
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
    const useLookupKey = billing === 'yearly' && priceConfig.yearlyIsLookupKey;

    // Si priceId est null pour starter, c'est normal
    if (planId === 'starter' && !priceId) {
      throw {
        status: 400,
        message: 'Le plan Starter est gratuit. Veuillez vous inscrire sans paiement.',
        code: 'STARTER_PLAN_FREE',
      };
    }

    // Pour les autres plans, vérifier qu'on a un Price ID
    if (!priceId && planId !== 'starter') {
      logger.error('Price ID missing for plan', new Error('Price ID not configured'), {
        planId,
        billing,
        configuredPrices: planPrices,
      });
      throw {
        status: 400,
        message: `Plan ${planId} non configuré`,
        code: 'PLAN_NOT_CONFIGURED',
        debug: {
          availablePlans: ['starter', 'professional', 'business', 'enterprise'],
          requestedPlan: planId,
          configuredPrices: planPrices,
        },
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app';

    // Vérifier que priceId n'est pas null avant de créer la session
    if (!priceId) {
      throw {
        status: 400,
        message: `Price ID manquant pour le plan ${planId}`,
        code: 'PRICE_ID_MISSING',
      };
    }

    // Configuration des line_items selon que c'est un Price ID ou un lookup key
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = useLookupKey
      ? {
          price: priceId, // Stripe résoudra le lookup key automatiquement
          quantity: 1,
        }
      : {
          price: priceId,
          quantity: 1,
        };

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'subscription',
      ...(email && { customer_email: email }),
      success_url: `${baseUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
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
