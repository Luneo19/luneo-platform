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
    mode: session.mode,
    credits: session.metadata?.credits,
  });

  // Vérifier si c'est un achat de crédits IA (mode=payment vs subscription)
  if (session.mode === 'payment' && session.metadata?.credits && session.metadata?.type === 'credits_purchase') {
    await handleCreditsPurchase(session);
    return; // Ne pas traiter comme un abonnement
  }

  // Mettre à jour l'utilisateur dans Supabase (abonnements)
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
                  <a href="https://luneo.app/overview" style="background: linear-gradient(135deg, #0891b2, #3b82f6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
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
  try {
    const customerEmail = subscription.customer_details?.email || 
                         (typeof subscription.customer === 'string' 
                           ? null // Would need to fetch customer from Stripe
                           : subscription.customer?.email);

    if (customerEmail && process.env.SENDGRID_API_KEY) {
      // Send trial ending email via backend or SendGrid
      logger.info('Trial ending soon - email should be sent', {
        subscriptionId: subscription.id,
        customerEmail,
        trialEnd: subscription.trial_end,
      });
      // Email sending would be handled by backend email service
    }
  } catch (error) {
    logger.error('Failed to send trial ending email', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Handler pour achat de crédits IA
 */
async function handleCreditsPurchase(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId;
  const credits = parseInt(session.metadata?.credits || '0', 10);
  const packSize = parseInt(session.metadata?.packSize || '0', 10);
  const packId = packSize ? `pack_${packSize}` : null;

  if (!userId || !credits) {
    logger.error('Invalid credits purchase webhook', {
      sessionId: session.id,
      userId,
      credits,
    });
    return;
  }

  logger.info('Processing credits purchase', {
    userId,
    credits,
    packSize,
    sessionId: session.id,
    paymentIntent: session.payment_intent,
  });

  // Ajouter crédits via Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Vérifier si transaction déjà traitée (idempotency)
      // Note: CreditTransaction est dans Prisma DB, on vérifie via backend ou metadata
      // Pour l'instant, on vérifie dans metadata du profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', userId)
        .single();
      
      const existingTransactions = existingProfile?.metadata?.creditTransactions || [];
      const existing = existingTransactions.find((t: any) => t.stripeSessionId === session.id && t.type === 'purchase');

      if (existing) {
        logger.warn('Duplicate credits purchase webhook', {
          sessionId: session.id,
          transactionId: existing.id,
        });
        return;
      }

      // Récupérer balance actuelle depuis profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('ai_credits, ai_credits_purchased, metadata')
        .eq('id', userId)
        .single();

      if (!profile) {
        logger.error('Profile not found for credits purchase', { userId });
        return;
      }

      // Support pour colonnes directes ou dans metadata
      const balanceBefore = profile.ai_credits ?? profile.metadata?.aiCredits ?? 0;
      const purchasedBefore = profile.ai_credits_purchased ?? profile.metadata?.aiCreditsPurchased ?? 0;
      const balanceAfter = balanceBefore + credits;
      const purchasedAfter = purchasedBefore + credits;

      // Mettre à jour crédits utilisateur
      // Essayer colonnes directes d'abord, sinon utiliser metadata
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Si colonnes existent, les utiliser
      if (profile.ai_credits !== undefined) {
        updateData.ai_credits = balanceAfter;
        updateData.ai_credits_purchased = purchasedAfter;
        updateData.last_credit_purchase = new Date().toISOString();
      } else {
        // Sinon, stocker dans metadata
        updateData.metadata = {
          ...(profile.metadata || {}),
          aiCredits: balanceAfter,
          aiCreditsPurchased: purchasedAfter,
          lastCreditPurchase: new Date().toISOString(),
        };
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        logger.error('Failed to update user credits', {
          error: updateError,
          userId,
          credits,
        });
        return;
      }

      // Stocker transaction dans metadata (temporaire jusqu'à migration complète)
      // En production, les transactions seront dans la table Prisma CreditTransaction
      const transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        packId,
        amount: credits,
        balanceBefore,
        balanceAfter,
        type: 'purchase',
        source: 'stripe',
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent as string,
        metadata: {
          packSize,
          timestamp: new Date().toISOString(),
          email: session.customer_email,
        },
        createdAt: new Date().toISOString(),
      };

      // Ajouter transaction à metadata
      const currentTransactions = existingProfile?.metadata?.creditTransactions || [];
      const updatedMetadata = {
        ...(existingProfile?.metadata || {}),
        creditTransactions: [...currentTransactions, transaction],
      };

      const { error: metadataError } = await supabase
        .from('profiles')
        .update({ metadata: updatedMetadata })
        .eq('id', userId);

      if (metadataError) {
        logger.error('Failed to store credit transaction in metadata', {
          error: metadataError,
          userId,
        });
        // Ne pas throw, crédits déjà ajoutés
      }

      logger.info('Credits added successfully', {
        userId,
        credits,
        balanceAfter,
        sessionId: session.id,
      });

      // Envoyer email de confirmation
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
                subject: `✅ ${credits} crédits IA ajoutés à votre compte Luneo`,
              }],
              from: { email: 'noreply@luneo.app', name: 'Luneo' },
              content: [{
                type: 'text/html',
                value: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #0891b2;">Crédits ajoutés avec succès ! 🎉</h1>
                    <p>Votre achat de <strong>${credits} crédits IA</strong> a été confirmé.</p>
                    <div style="background: #f0f9ff; border-left: 4px solid #0891b2; padding: 16px; margin: 20px 0;">
                      <p style="margin: 0;"><strong>Nouveau solde:</strong> ${balanceAfter} crédits</p>
                    </div>
                    <p>Vous pouvez maintenant utiliser vos crédits pour générer des designs IA, créer des rendus 3D et personnaliser vos produits.</p>
                    <p style="margin-top: 30px;">
                      <a href="https://luneo.app/dashboard" style="background: linear-gradient(135deg, #0891b2, #3b82f6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                        Accéder à mon dashboard
                      </a>
                    </p>
                  </div>
                `,
              }],
            }),
          });
          logger.info('Credits purchase confirmation email sent', {
            email: session.customer_email,
          });
        } catch (emailError) {
          logger.error('Failed to send credits confirmation email', {
            error: emailError,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process credits purchase', {
        error,
        userId,
        sessionId: session.id,
      });
    }
  }
}

