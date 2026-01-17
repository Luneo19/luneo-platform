import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { CreateCheckoutSessionSchema } from '@/lib/validations/billing-schemas';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * POST /api/billing/create-checkout-session
 * Crée une session de checkout Stripe pour un abonnement
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Rate limiting désactivé temporairement pour les pages publiques
    // (Upstash Redis a atteint sa limite)
    // TODO: Réactiver avec un service de rate limiting alternatif
    /*
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
    */

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

    const { planId, email, billing, addOns } = validation.data;

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
    
    // Fonction helper pour nettoyer les Price IDs (enlever espaces, retours à la ligne, etc.)
    const cleanPriceIdValue = (priceId: string | undefined | null): string | null => {
      if (!priceId) return null;
      const cleaned = priceId.trim().replace(/\s+/g, '').replace(/\n/g, '');
      return cleaned || null;
    };
    
    const planPrices: Record<string, { monthly: string | null; yearly: string | null }> = {
      starter: {
        monthly: cleanPriceIdValue(process.env.STRIPE_PRICE_STARTER_MONTHLY) || 'price_1SY2bqKG9MsM6fdSlgkR5hNX',
        yearly: cleanPriceIdValue(process.env.STRIPE_PRICE_STARTER_YEARLY) || 'price_1SY2bxKG9MsM6fdSe78TX8fZ',
      },
      professional: {
        monthly: cleanPriceIdValue(process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY) || 'price_1SqLIkKG9MsM6fdSt59Vg3F1',
        yearly: cleanPriceIdValue(process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY) || 'price_1SqLIlKG9MsM6fdSDh9Xya8V',
      },
      business: {
        monthly: cleanPriceIdValue(process.env.STRIPE_PRICE_BUSINESS_MONTHLY) || 'price_1SqLImKG9MsM6fdS9rmCQyIE',
        yearly: cleanPriceIdValue(process.env.STRIPE_PRICE_BUSINESS_YEARLY) || 'price_1SqLImKG9MsM6fdSO6ihDDpO',
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
    
    // Nettoyer le Price ID (au cas où)
    const cleanedPriceId = priceId.trim().replace(/\s+/g, '').replace(/\n/g, '');
    
    if (!cleanedPriceId || !cleanedPriceId.startsWith('price_')) {
      logger.error('Invalid Price ID', { planId, billing, priceId, cleanedPriceId });
      throw {
        status: 500,
        message: `Price ID invalide pour le plan ${planId}`,
        code: 'INVALID_PRICE_ID',
      };
    }

    // Récupérer l'URL de base depuis l'environnement ou utiliser l'URL de la requête
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // Si pas configuré ou invalide, utiliser l'origine de la requête
    if (!baseUrl || !baseUrl.startsWith('http')) {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      
      if (origin && origin.startsWith('http')) {
        try {
          const url = new URL(origin);
          baseUrl = `${url.protocol}//${url.host}`;
        } catch {
          baseUrl = 'https://luneo.app';
        }
      } else if (referer) {
        try {
          const url = new URL(referer);
          baseUrl = `${url.protocol}//${url.host}`;
        } catch {
          baseUrl = 'https://luneo.app';
        }
      } else {
        baseUrl = 'https://luneo.app';
      }
    }
    
    // Nettoyer l'URL (enlever trailing slash)
    baseUrl = baseUrl.replace(/\/$/, '');
    
    // S'assurer que l'URL est valide et absolue
    try {
      const testUrl = new URL(baseUrl);
      baseUrl = `${testUrl.protocol}//${testUrl.host}`;
    } catch (error) {
      logger.error('Invalid baseUrl, using default', { baseUrl, error });
      baseUrl = 'https://luneo.app';
    }
    
    // Vérifier que les URLs de redirection sont valides
    const successUrl = `${baseUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing`;
    
    try {
      new URL(successUrl.replace('{CHECKOUT_SESSION_ID}', 'test'));
      new URL(cancelUrl);
    } catch (error) {
      logger.error('Invalid redirect URLs', { successUrl, cancelUrl, error });
      throw {
        status: 500,
        message: 'Configuration des URLs de redirection invalide',
        code: 'INVALID_REDIRECT_URLS',
      };
    }

    // Configuration des line_items (plan de base + add-ons)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: cleanedPriceId,
        quantity: 1,
      },
    ];

    // Ajouter les add-ons si fournis
    if (addOns && Array.isArray(addOns) && addOns.length > 0) {
      // Configuration des Price IDs des add-ons
      // Fonction helper pour nettoyer les Price IDs
      const cleanAddOnPriceId = (priceId: string | undefined | null): string => {
        if (!priceId) return '';
        return priceId.trim().replace(/\s+/g, '').replace(/\n/g, '');
      };
      
      const addOnPriceIds: Record<string, { monthly: string; yearly: string }> = {
        'extra-designs': {
          monthly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_DESIGNS_MONTHLY),
          yearly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_DESIGNS_YEARLY),
        },
        'extra-storage': {
          monthly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_STORAGE_MONTHLY),
          yearly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_STORAGE_YEARLY),
        },
        'extra-team-members': {
          monthly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_TEAM_MEMBERS_MONTHLY),
          yearly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_TEAM_MEMBERS_YEARLY),
        },
        'extra-api-calls': {
          monthly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_API_CALLS_MONTHLY),
          yearly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_API_CALLS_YEARLY),
        },
        'extra-renders-3d': {
          monthly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_RENDERS_3D_MONTHLY),
          yearly: cleanAddOnPriceId(process.env.STRIPE_ADDON_EXTRA_RENDERS_3D_YEARLY),
        },
      };

      for (const addOn of addOns) {
        const addOnConfig = addOnPriceIds[addOn.type];
        if (!addOnConfig) {
          logger.warn('Add-on non reconnu', { addOnType: addOn.type });
          continue;
        }

        const addOnPriceId = billing === 'yearly' ? addOnConfig.yearly : addOnConfig.monthly;
        if (!addOnPriceId) {
          logger.warn('Price ID manquant pour add-on', { 
            addOnType: addOn.type, 
            billing 
          });
          continue;
        }

        lineItems.push({
          price: addOnPriceId,
          quantity: addOn.quantity || 1,
        });
      }
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      ...(email && { customer_email: email }),
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planId,
        billingCycle: billing,
        ...(addOns && { addOns: JSON.stringify(addOns) }),
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
