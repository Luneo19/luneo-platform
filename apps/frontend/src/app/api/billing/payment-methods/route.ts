import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { managePaymentMethodSchema } from '@/lib/validation/zod-schemas';
import Stripe from 'stripe';

// Initialiser Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

/**
 * GET /api/billing/payment-methods
 * Récupère les méthodes de paiement de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le customer Stripe ID depuis le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.dbError('fetch profile for payment methods', profileError, { userId: user.id });
    }

    if (!profile?.stripe_customer_id) {
      return { paymentMethods: [] };
    }

    // Récupérer les méthodes de paiement depuis Stripe
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: 'card',
      });

      const sanitizedMethods = paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            }
          : null,
        created: pm.created,
      }));

      return { paymentMethods: sanitizedMethods };
    } catch (stripeError: any) {
      logger.error('Stripe payment methods fetch error', stripeError, {
        userId: user.id,
        customerId: profile.stripe_customer_id,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération des méthodes de paiement',
        code: 'STRIPE_ERROR',
      };
    }
  }, '/api/billing/payment-methods', 'GET');
}

/**
 * POST /api/billing/payment-methods
 * Ajoute une nouvelle méthode de paiement
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = managePaymentMethodSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { paymentMethodId, action } = validation.data;
    const setAsDefault = action === 'set_default';

    // Récupérer ou créer le customer Stripe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.dbError('fetch profile for payment method', profileError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du profil' };
    }

    let customerId = profile?.stripe_customer_id;

    // Créer un customer Stripe si nécessaire
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            user_id: user.id,
          },
        });

        customerId = customer.id;

        // Sauvegarder le customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      } catch (stripeError: any) {
        logger.error('Stripe customer creation error', stripeError, { userId: user.id });
        throw {
          status: 500,
          message: 'Erreur lors de la création du client Stripe',
          code: 'STRIPE_ERROR',
        };
      }
    }

    // Attacher la méthode de paiement au customer
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Définir comme méthode par défaut si demandé
      if (setAsDefault) {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      logger.info('Payment method added', {
        userId: user.id,
        paymentMethodId,
        customerId,
        setAsDefault,
      });

      return {
        paymentMethod: {
          id: paymentMethodId,
          attached: true,
          setAsDefault,
        },
        message: 'Méthode de paiement ajoutée avec succès',
      };
    } catch (stripeError: any) {
      logger.error('Stripe payment method attach error', stripeError, {
        userId: user.id,
        paymentMethodId,
        customerId,
      });
      throw {
        status: 500,
        message: `Erreur lors de l'ajout de la méthode de paiement: ${stripeError.message}`,
        code: 'STRIPE_ERROR',
      };
    }
  }, '/api/billing/payment-methods', 'POST');
}

/**
 * DELETE /api/billing/payment-methods?id=xxx
 * Supprime une méthode de paiement
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Détacher la méthode de paiement
    try {
      await stripe.paymentMethods.detach(paymentMethodId);

      logger.info('Payment method removed', {
        userId: user.id,
        paymentMethodId,
      });

      return { message: 'Méthode de paiement supprimée avec succès' };
    } catch (stripeError: any) {
      logger.error('Stripe payment method detach error', stripeError, {
        userId: user.id,
        paymentMethodId,
      });
      throw {
        status: 500,
        message: `Erreur lors de la suppression de la méthode de paiement: ${stripeError.message}`,
        code: 'STRIPE_ERROR',
      };
    }
  }, '/api/billing/payment-methods', 'DELETE');
}
