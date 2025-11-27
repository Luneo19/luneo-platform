import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export const runtime = 'nodejs';

// Disable body parsing, need raw body for signature verification
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/stripe
 * Gère les événements Stripe (abonnements, paiements, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.warn('Webhook received without signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('Stripe configuration missing for webhooks');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Vérifier la signature du webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Webhook signature verification failed', { error: errorMessage });
      return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    // Traiter l'événement
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(subscription);
        break;
      }

      default:
        logger.info('Unhandled Stripe event', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Webhook handler error', { error: errorMessage });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// Handler functions

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logger.info('Checkout completed', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    email: session.customer_email,
    planId: session.metadata?.planId,
  });

  // Mettre à jour l'utilisateur dans Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Trouver l'utilisateur par email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', session.customer_email)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            subscription_status: 'active',
            subscription_plan: session.metadata?.planId || 'premium',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        logger.info('User profile updated with subscription', { userId: profile.id });
      }
    } catch (dbError) {
      logger.error('Database update failed', { error: dbError });
    }
  }

  // Envoyer email de bienvenue via SendGrid
  if (process.env.SENDGRID_API_KEY && session.customer_email) {
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: session.customer_email }],
            subject: '🎉 Bienvenue chez Luneo !',
          }],
          from: { email: 'noreply@luneo.app', name: 'Luneo' },
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #0891b2;">Bienvenue chez Luneo ! 🎉</h1>
                <p>Merci pour votre confiance ! Votre abonnement <strong>${session.metadata?.planId || 'Premium'}</strong> est maintenant actif.</p>
                <p>Vous bénéficiez de <strong>14 jours d'essai gratuit</strong> pour découvrir toutes nos fonctionnalités.</p>
                <p style="margin-top: 30px;">
                  <a href="https://luneo.app/dashboard/overview" style="background: linear-gradient(135deg, #0891b2, #3b82f6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Accéder à mon dashboard
                  </a>
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Des questions ? Répondez à cet email, nous sommes là pour vous aider !
                </p>
              </div>
            `,
          }],
        }),
      });
      logger.info('Welcome email sent', { email: session.customer_email });
    } catch (emailError) {
      logger.error('Welcome email failed', { error: emailError });
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logger.info('Subscription created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    trialEnd: subscription.trial_end,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // Mettre à jour le statut dans Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase
        .from('profiles')
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', subscription.customer as string);
    } catch (dbError) {
      logger.error('Database update failed', { error: dbError });
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('Subscription cancelled', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  });

  // Mettre à jour le statut dans Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
          subscription_plan: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', subscription.customer as string);
    } catch (dbError) {
      logger.error('Database update failed', { error: dbError });
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  logger.info('Invoice paid', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amountPaid: invoice.amount_paid,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('Invoice payment failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    attemptCount: invoice.attempt_count,
  });

  // Envoyer email d'alerte
  if (process.env.SENDGRID_API_KEY && invoice.customer_email) {
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: invoice.customer_email }],
            subject: '⚠️ Problème avec votre paiement Luneo',
          }],
          from: { email: 'noreply@luneo.app', name: 'Luneo' },
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #dc2626;">Problème de paiement</h1>
                <p>Nous n'avons pas pu traiter votre dernier paiement.</p>
                <p>Pour éviter toute interruption de service, veuillez mettre à jour vos informations de paiement.</p>
                <p style="margin-top: 30px;">
                  <a href="https://luneo.app/dashboard/billing" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Mettre à jour mon moyen de paiement
                  </a>
                </p>
              </div>
            `,
          }],
        }),
      });
    } catch (emailError) {
      logger.error('Payment failed email error', { error: emailError });
    }
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  logger.info('Trial ending soon', {
    subscriptionId: subscription.id,
    trialEnd: subscription.trial_end,
  });

  // Envoyer email de rappel fin d'essai
  // TODO: Récupérer l'email du customer
}

