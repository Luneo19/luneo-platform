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
      apiVersion: '2025-09-30.clover',
    });

    // Configuration des Price IDs pour mensuel ET annuel
    const planPrices: Record<string, { monthly: string | null; yearly: string | null }> = {
      starter: { monthly: null, yearly: null },
      professional: {
        monthly: process.env.STRIPE_PRICE_PRO || 'price_PRO_MONTHLY',
        yearly: 'price_PRO_MONTHLY', // Utilise le même Price ID mensuel, prix annuel sera créé dynamiquement
      },
      business: {
        monthly: 'price_BUSINESS_MONTHLY',
        yearly: 'price_BUSINESS_MONTHLY',
      },
      enterprise: {
        monthly: 'price_ENTERPRISE_MONTHLY',
        yearly: 'price_ENTERPRISE_MONTHLY',
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

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
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

    // Pour annuel, créer un prix custom avec le montant annuel correct
    if (billing === 'yearly' && priceId && planId !== 'starter' && sessionConfig.line_items) {
      try {
        // Récupérer le Product ID depuis le Price ID existant
        const priceDetails = await stripe.prices.retrieve(priceId);
        const productId =
          typeof priceDetails.product === 'string' ? priceDetails.product : priceDetails.product.id;

        // Montants annuels avec -20%
        const yearlyAmounts: Record<string, number> = {
          professional: 27840, // 278.40€ en centimes
          business: 56640, // 566.40€ en centimes
          enterprise: 95040, // 950.40€ en centimes
        };

        const yearlyAmount = yearlyAmounts[planId as keyof typeof yearlyAmounts];

        if (productId && yearlyAmount && sessionConfig.line_items[0]) {
          // Créer un prix annuel avec le bon montant
          const yearlyPrice = await stripe.prices.create({
            product: productId,
            unit_amount: yearlyAmount,
            currency: 'eur',
            recurring: {
              interval: 'year',
              interval_count: 1,
            },
            nickname: `${planId}-yearly-${Date.now()}`,
          });

          // Utiliser ce prix annuel
          sessionConfig.line_items[0].price = yearlyPrice.id;
        }
      } catch (stripeError: any) {
        logger.error('Error creating yearly price', stripeError, {
          planId,
          priceId,
        });
        // Continuer avec le prix mensuel si la création du prix annuel échoue
        logger.warn('Falling back to monthly price for yearly subscription', {
          planId,
        });
      }
    }

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
