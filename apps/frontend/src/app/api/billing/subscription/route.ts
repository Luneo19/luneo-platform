import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { updateSubscriptionSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/billing/subscription
 * Récupère les informations d'abonnement de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le profil avec les informations d'abonnement
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, subscription_period, stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        throw { status: 404, message: 'Profil non trouvé', code: 'PROFILE_NOT_FOUND' };
      }
      logger.dbError('fetch subscription info', profileError, {
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des informations d\'abonnement' };
    }

    // Si Stripe est configuré, récupérer les détails depuis Stripe
    let stripeSubscription = null;
    if (profile.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        stripeSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      } catch (stripeError: any) {
        logger.error('Stripe subscription fetch error', stripeError, {
          userId: user.id,
          subscriptionId: profile.stripe_subscription_id,
        });
        // Ne pas échouer si Stripe échoue, juste logger
      }
    }

    const subscription = {
      tier: profile.subscription_tier || 'free',
      status: profile.subscription_status || 'inactive',
      period: profile.subscription_period || null,
      stripe: {
        customerId: profile.stripe_customer_id ? `***${profile.stripe_customer_id.slice(-4)}` : null,
        subscriptionId: profile.stripe_subscription_id ? `***${profile.stripe_subscription_id.slice(-4)}` : null,
        currentPeriodEnd: stripeSubscription?.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
      },
    };

    logger.info('Subscription info fetched', {
      userId: user.id,
      tier: subscription.tier,
      status: subscription.status,
    });

    return {
      subscription,
    };
  }, '/api/billing/subscription', 'GET');
}

/**
 * PUT /api/billing/subscription
 * Met à jour l'abonnement (annulation, changement de plan, etc.)
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(updateSubscriptionSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      action: 'cancel' | 'resume' | 'change_plan' | 'update_payment_method';
      planId?: string;
      cancelAtPeriodEnd?: boolean;
    };
    const { action, planId } = validatedData;

    const validActions = ['cancel', 'resume', 'upgrade', 'downgrade'];
    if (!validActions.includes(action)) {
      throw {
        status: 400,
        message: `Action invalide. Actions supportées: ${validActions.join(', ')}`,
        code: 'VALIDATION_ERROR',
      };
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.dbError('fetch profile for subscription update', profileError, {
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du profil' };
    }

    // Traiter l'action avec Stripe si configuré
    if (profile.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        switch (action) {
          case 'cancel':
            await stripe.subscriptions.update(profile.stripe_subscription_id, {
              cancel_at_period_end: true,
            });
            break;

          case 'resume':
            await stripe.subscriptions.update(profile.stripe_subscription_id, {
              cancel_at_period_end: false,
            });
            break;

          case 'upgrade':
          case 'downgrade':
            if (!planId) {
              throw {
                status: 400,
                message: 'Le paramètre planId est requis pour upgrade/downgrade',
                code: 'VALIDATION_ERROR',
              };
            }
            await stripe.subscriptions.update(profile.stripe_subscription_id, {
              items: [
                {
                  id: (await stripe.subscriptions.retrieve(profile.stripe_subscription_id)).items.data[0].id,
                  price: planId,
                },
              ],
            });
            break;
        }
      } catch (stripeError: any) {
        logger.error('Stripe subscription update error', stripeError, {
          userId: user.id,
          action,
          subscriptionId: profile.stripe_subscription_id,
        });
        throw {
          status: 500,
          message: 'Erreur lors de la mise à jour de l\'abonnement Stripe',
          code: 'STRIPE_ERROR',
        };
      }
    }

    // Mettre à jour le statut dans la base de données
    let newStatus = profile.subscription_status;
    if (action === 'cancel') {
      newStatus = 'cancelling';
    } else if (action === 'resume') {
      newStatus = 'active';
    }

    await supabase
      .from('profiles')
      .update({
        subscription_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .catch((updateError) => {
        logger.dbError('update subscription status', updateError, {
          userId: user.id,
        });
      });

    logger.info('Subscription updated', {
      userId: user.id,
      action,
      newStatus,
    });

    return {
      message: `Abonnement ${action === 'cancel' ? 'annulé' : action === 'resume' ? 'repris' : 'modifié'} avec succès`,
      action,
    };
  }, '/api/billing/subscription', 'PUT');
}
