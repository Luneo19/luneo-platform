import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

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
    const supabase = await createClient();

    // Récupérer le body et la signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      throw {
        status: 400,
        message: 'Signature Stripe manquante',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET not configured');
      }

      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      logger.warn('Invalid Stripe webhook signature', {
        error: err.message,
      });
      throw {
        status: 400,
        message: 'Signature Stripe invalide',
        code: 'INVALID_SIGNATURE',
      };
    }

    logger.info('Stripe webhook received', {
      eventType: event.type,
      eventId: event.id,
    });

    // Traiter l'événement selon son type
    let processed = false;
    let result: any = null;

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          result = await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          processed = true;
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          result = await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          processed = true;
          break;

        case 'customer.subscription.deleted':
          result = await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          processed = true;
          break;

        case 'invoice.payment_succeeded':
          result = await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          processed = true;
          break;

        case 'invoice.payment_failed':
          result = await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          processed = true;
          break;

        default:
          logger.debug('Unhandled Stripe webhook event type', {
            eventType: event.type,
            eventId: event.id,
          });
          result = { message: 'Event type non géré' };
      }
    } catch (processError: any) {
      logger.error('Stripe webhook processing error', processError, {
        eventType: event.type,
        eventId: event.id,
      });
      throw {
        status: 500,
        message: 'Erreur lors du traitement du webhook Stripe',
        code: 'WEBHOOK_PROCESSING_ERROR',
      };
    }

    // Enregistrer le webhook dans les logs
    const { error: insertError } = await supabase
      .from('webhook_logs')
      .insert({
        source: 'stripe',
        webhook_id: event.id,
        payload: event,
        signature: signature,
        received_at: new Date().toISOString(),
        processed: processed,
        processed_at: processed ? new Date().toISOString() : null,
        result: result || null,
      });

    if (insertError) {
      logger.warn('Failed to log Stripe webhook', {
        eventId: event.id,
        error: insertError,
      });
    }

    logger.info('Stripe webhook processed', {
      eventType: event.type,
      eventId: event.id,
      processed,
    });

    return {
      success: true,
      processed,
      result,
      message: processed ? 'Webhook Stripe traité avec succès' : 'Webhook reçu mais non traité',
    };
  }, '/api/stripe/webhook', 'POST');
}

/**
 * Gère l'événement checkout.session.completed
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<any> {
  const supabase = await createClient();

  if (!session.customer || typeof session.customer !== 'string') {
    return { message: 'Customer ID manquant' };
  }

  // Mettre à jour le profil utilisateur avec l'abonnement
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: session.customer,
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', session.customer);

  if (updateError) {
    logger.dbError('update profile after checkout', updateError, {
      customerId: session.customer,
    });
  }

  return {
    message: 'Checkout session complétée',
    customerId: session.customer,
  };
}

/**
 * Gère les événements customer.subscription.created et customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<any> {
  const supabase = await createClient();

  if (!subscription.customer || typeof subscription.customer !== 'string') {
    return { message: 'Customer ID manquant' };
  }

  // Mettre à jour le profil utilisateur avec l'abonnement
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
      subscription_tier: subscription.items.data[0]?.price?.nickname || 'pro',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', subscription.customer);

  if (updateError) {
    logger.dbError('update profile after subscription update', updateError, {
      customerId: subscription.customer,
      subscriptionId: subscription.id,
    });
  }

  return {
    message: 'Abonnement mis à jour',
    subscriptionId: subscription.id,
    status: subscription.status,
  };
}

/**
 * Gère l'événement customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<any> {
  const supabase = await createClient();

  if (!subscription.customer || typeof subscription.customer !== 'string') {
    return { message: 'Customer ID manquant' };
  }

  // Mettre à jour le profil utilisateur
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', subscription.customer);

  if (updateError) {
    logger.dbError('update profile after subscription deletion', updateError, {
      customerId: subscription.customer,
      subscriptionId: subscription.id,
    });
  }

  return {
    message: 'Abonnement annulé',
    subscriptionId: subscription.id,
  };
}

/**
 * Gère l'événement invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<any> {
  const supabase = await createClient();

  if (!invoice.customer || typeof invoice.customer !== 'string') {
    return { message: 'Customer ID manquant' };
  }

  // Enregistrer le paiement réussi
  const { error: insertError } = await supabase
    .from('audit_logs')
    .insert({
      user_id: null, // Sera mis à jour si on trouve l'utilisateur
      action: 'payment_succeeded',
      resource_type: 'invoice',
      resource_id: invoice.id,
      description: `Paiement réussi pour la facture ${invoice.number}`,
      status: 'success',
      metadata: {
        amount: invoice.amount_paid,
        currency: invoice.currency,
        customer_id: invoice.customer,
      },
    });

  if (insertError) {
    logger.warn('Failed to log payment success', {
      invoiceId: invoice.id,
      error: insertError,
    });
  }

  return {
    message: 'Paiement réussi',
    invoiceId: invoice.id,
  };
}

/**
 * Gère l'événement invoice.payment_failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<any> {
  const supabase = await createClient();

  if (!invoice.customer || typeof invoice.customer !== 'string') {
    return { message: 'Customer ID manquant' };
  }

  // Enregistrer l'échec de paiement
  const { error: insertError } = await supabase
    .from('audit_logs')
    .insert({
      user_id: null,
      action: 'payment_failed',
      resource_type: 'invoice',
      resource_id: invoice.id,
      description: `Échec de paiement pour la facture ${invoice.number}`,
      status: 'failed',
      metadata: {
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer_id: invoice.customer,
      },
    });

  if (insertError) {
    logger.warn('Failed to log payment failure', {
      invoiceId: invoice.id,
      error: insertError,
    });
  }

  return {
    message: 'Échec de paiement enregistré',
    invoiceId: invoice.id,
  };
}
