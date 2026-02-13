/**
 * StripeWebhookService
 * Handles all Stripe webhook events (subscriptions, invoices, payments, refunds, Connect).
 * Extracted from BillingService for maintainability.
 */
import {
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma, SubscriptionStatus, SubscriptionPlan } from '@prisma/client';
import { CreditsService } from '@/libs/credits/credits.service';
import { CurrencyUtils } from '@/config/currency.config';
import { EmailService } from '@/modules/email/email.service';
import { normalizePlanTier, getMonthlyCredits } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';
import { StripeClientService } from './stripe-client.service';
import { ReferralService } from '@/modules/referral/referral.service';
import { ZapierService } from '@/modules/integrations/zapier/zapier.service';
import type Stripe from 'stripe';

type WebhookResult = { processed: boolean; result?: Record<string, unknown> };

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private creditsService: CreditsService,
    private emailService: EmailService,
    private stripeClient: StripeClientService,
    private referralService: ReferralService,
    @Optional() private zapierService?: ZapierService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // Public entry point
  // ──────────────────────────────────────────────────────────────

  async handleStripeWebhook(event: Stripe.Event): Promise<WebhookResult> {
    this.logger.log(`Processing Stripe webhook: ${event.type}`, { eventId: event.id });

    // BIL-07: Idempotency via ProcessedWebhookEvent table
    try {
      // Atomic idempotency check: try to create/claim the event
      const eventRecord = await this.prisma.processedWebhookEvent.upsert({
        where: { eventId: event.id },
        create: { eventId: event.id, eventType: event.type, processed: false, attempts: 1 },
        update: { attempts: { increment: 1 } },
      });
      // If already processed, skip
      if (eventRecord.processed) {
        this.logger.debug(`Webhook event already processed: ${event.id}`);
        return { processed: true, result: (eventRecord.result as Record<string, unknown>) ?? undefined };
      }
      // If another worker already claimed it (attempts > 1 and we're not the first), skip
      if (eventRecord.attempts > 1) {
        this.logger.debug(`Webhook event being processed by another worker: ${event.id}`);
        return { processed: false, result: undefined };
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to check/create webhook event record: ${msg}`);
    }

    try {
      let result: WebhookResult;

      switch (event.type) {
        case 'checkout.session.completed':
          result = await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          result = await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          result = await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.trial_will_end':
          result = await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.paused':
          result = await this.handleSubscriptionPaused(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.resumed':
          result = await this.handleSubscriptionResumed(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          result = await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          result = await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.upcoming':
          result = await this.handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.finalized':
          result = await this.handleInvoiceFinalized(event.data.object as Stripe.Invoice);
          break;
        case 'charge.refunded':
          result = await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        case 'customer.updated':
          result = await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
          break;
        case 'payment_method.attached':
          result = await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
          break;
        case 'payment_method.detached':
          result = await this.handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
          break;
        case 'account.updated':
          result = await this.handleConnectAccountUpdated(event.data.object as Stripe.Account);
          break;
        case 'invoice.created':
          result = await this.handleInvoiceCreated(event.data.object as Stripe.Invoice);
          break;
        case 'payment_intent.succeeded':
          result = await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          result = await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'customer.deleted':
          result = await this.handleCustomerDeleted(event.data.object as Stripe.Customer);
          break;
        case 'setup_intent.succeeded':
          result = await this.handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
          break;
        // PRODUCTION FIX: Dispute and SCA handlers
        case 'charge.dispute.created':
          result = await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;
        case 'charge.dispute.closed':
          result = await this.handleDisputeClosed(event.data.object as Stripe.Dispute);
          break;
        case 'invoice.payment_action_required':
          result = await this.handlePaymentActionRequired(event.data.object as Stripe.Invoice);
          break;
        default:
          this.logger.debug(`Unhandled Stripe webhook event type: ${event.type}`, { eventId: event.id });
          result = { processed: false };
      }

      // Mark as processed
      try {
        await this.prisma.processedWebhookEvent.update({
          where: { eventId: event.id },
          data: { processed: true, result: result.result ? (result.result as unknown as import('@prisma/client').Prisma.InputJsonValue) : undefined, processedAt: new Date() },
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to mark webhook event as processed: ${msg}`);
      }

      return result;
    } catch (error: unknown) {
      try {
        await this.prisma.processedWebhookEvent.update({
          where: { eventId: event.id },
          data: { error: 'Processing error' },
        });
      } catch (updateError: unknown) {
        this.logger.warn('Failed to update webhook event error', updateError instanceof Error ? updateError.message : String(updateError));
      }

      this.logger.error(`Error processing Stripe webhook ${event.type}`, error instanceof Error ? error.stack : String(error), { eventId: event.id });
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────

  mapStripeStatusToAppStatus(stripeStatus: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' {
    switch (stripeStatus) {
      case 'trialing':        return 'TRIALING';
      case 'active':          return 'ACTIVE';
      case 'past_due':
      case 'unpaid':          return 'PAST_DUE';
      case 'canceled':
      case 'incomplete_expired': return 'CANCELED';
      case 'incomplete':
      case 'paused':          return 'PAST_DUE';
      default:
        this.logger.warn(`Unknown Stripe subscription status: ${stripeStatus}, defaulting to ACTIVE`);
        return 'ACTIVE';
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Checkout
  // ──────────────────────────────────────────────────────────────

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<WebhookResult> {
    this.logger.log('Processing checkout.session.completed', { sessionId: session.id });

    // Credit purchases
    if (session.metadata?.type === 'credits_purchase' && session.metadata?.userId) {
      const userId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits || session.metadata.packSize || '0', 10);

      if (credits > 0) {
        try {
          const stripe = await this.stripeClient.getStripe();
          const expandedSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items.data.price'] });
          const priceId = expandedSession.line_items?.data[0]?.price?.id;
          const pack = priceId ? await this.prisma.creditPack.findFirst({ where: { stripePriceId: priceId } }) : null;
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          const result = await this.creditsService.addCredits(userId, credits, pack?.id, session.id, session.payment_intent as string, expiresAt);

          this.logger.log('Credits added successfully', { userId, credits, newBalance: result.newBalance, sessionId: session.id });
          return { processed: true, result: { type: 'credits_purchase', userId, credits, newBalance: result.newBalance } };
        } catch (error) {
          this.logger.error('Failed to add credits from checkout session', error, { sessionId: session.id, userId, credits });
          throw error;
        }
      }
    }

    // Subscription checkout
    if (session.mode === 'subscription' && session.customer) {
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as { id?: string } | null)?.id;

      if (session.metadata?.userId) {
        const user = await this.prisma.user.findUnique({ where: { id: session.metadata.userId }, include: { brand: true } });
        if (user?.brandId) {
          const planId = session.metadata?.planId || 'starter';
          let subscriptionStatus = 'ACTIVE';
          let trialEndsAt: Date | null = null;
          let currentPeriodEnd: Date | null = null;

          if (subscriptionId) {
            try {
              const stripe = await this.stripeClient.getStripe();
              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              subscriptionStatus = this.mapStripeStatusToAppStatus(sub.status);
              trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
              currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              this.logger.warn(`Could not retrieve subscription ${subscriptionId}: ${msg}`);
            }
          }

          await this.prisma.brand.update({
            where: { id: user.brandId },
            data: { stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId || undefined, plan: planId, subscriptionStatus: subscriptionStatus as SubscriptionStatus, trialEndsAt, planExpiresAt: currentPeriodEnd },
          });
          this.logger.log(`Brand ${user.brandId} updated with subscription ${subscriptionId}, plan: ${planId}, status: ${subscriptionStatus}`);
          this.zapierService?.triggerEvent(user.brandId, 'new_subscription', { brandId: user.brandId, stripeSubscriptionId: subscriptionId, plan: planId, status: subscriptionStatus }).catch((err) => this.logger.warn('Non-critical error triggering Zapier new_subscription', err instanceof Error ? err.message : String(err)));
        }
      }

      return { processed: true, result: { type: 'subscription_created', customerId, subscriptionId, sessionId: session.id } };
    }

    // Order payment
    if (session.mode === 'payment') {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        try {
          const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, orderNumber: true, paymentStatus: true, totalCents: true, currency: true, customerEmail: true, customerName: true, userId: true, subtotalCents: true, items: { select: { quantity: true, priceCents: true, product: { select: { name: true } } } } } });
          if (order && order.paymentStatus !== 'SUCCEEDED') {
            await this.prisma.order.update({ where: { id: orderId }, data: { status: 'PAID', paymentStatus: 'SUCCEEDED', stripePaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null } });
            this.logger.log(`Order ${order.orderNumber} marked as PAID (session ${session.id})`);

            // Send order confirmation email
            this.sendOrderConfirmationSafe(order);

            // Create referral commission AFTER payment confirmation
            this.createReferralCommissionSafe(order.id, order.userId, order.subtotalCents, order.orderNumber);

            return { processed: true, result: { type: 'order_payment', orderId, orderNumber: order.orderNumber } };
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to update order ${orderId} payment status: ${msg}`);
        }
      }

      // Fallback by stripeSessionId
      try {
        const order = await this.prisma.order.findFirst({ where: { stripeSessionId: session.id }, select: { id: true, status: true, orderNumber: true, paymentStatus: true, totalCents: true, currency: true, customerEmail: true, customerName: true, userId: true, subtotalCents: true, items: { select: { quantity: true, priceCents: true, product: { select: { name: true } } } } } });
        if (order && order.paymentStatus !== 'SUCCEEDED') {
          await this.prisma.order.update({ where: { id: order.id }, data: { status: 'PAID', paymentStatus: 'SUCCEEDED', stripePaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null } });
          this.logger.log(`Order ${order.orderNumber} marked as PAID via session lookup (session ${session.id})`);

          // Send order confirmation email
          this.sendOrderConfirmationSafe(order);

          // Create referral commission AFTER payment confirmation
          this.createReferralCommissionSafe(order.id, order.userId, order.subtotalCents, order.orderNumber);

          return { processed: true, result: { type: 'order_payment', orderId: order.id, orderNumber: order.orderNumber } };
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to find/update order by session ${session.id}: ${msg}`);
      }
    }

    return { processed: false };
  }

  // ──────────────────────────────────────────────────────────────
  // Subscription events
  // ──────────────────────────────────────────────────────────────

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<WebhookResult> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    this.logger.log('Processing subscription update', { subscriptionId: subscription.id, customerId, status: subscription.status });

    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId }, include: { users: true } });
    if (!brand) return { processed: false };

    const appStatus = this.mapStripeStatusToAppStatus(subscription.status);
    const previousStatus = brand.subscriptionStatus;
    const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

    // Identify plan item (exclude add-ons)
    const addonsConfig = this.configService.get<Record<string, Record<string, string>>>('stripe.addons') || {};
    const addonPriceIdSet = new Set<string>();
    const addonPriceIdToType: Record<string, string> = {};
    for (const [addonKey, addonConf] of Object.entries(addonsConfig)) {
      const conf = addonConf as Record<string, string>;
      if (conf?.monthly) { addonPriceIdSet.add(conf.monthly); addonPriceIdToType[conf.monthly] = addonKey; }
      if (conf?.yearly) { addonPriceIdSet.add(conf.yearly); addonPriceIdToType[conf.yearly] = addonKey; }
    }

    const planItem = subscription.items.data.find(item => !addonPriceIdSet.has(item.price.id));
    const rawPlanName = planItem?.price?.nickname || subscription.metadata?.planId || brand.plan || 'starter';
    const normalizedTier = normalizePlanTier(rawPlanName);
    const planName = normalizedTier; // Use normalized tier name for storage

    // Map PlanTier to SubscriptionPlan (Prisma enum)
    const planToSubscriptionPlan: Record<string, SubscriptionPlan> = {
      [PlanTier.FREE]: SubscriptionPlan.FREE,
      [PlanTier.STARTER]: SubscriptionPlan.STARTER,
      [PlanTier.PROFESSIONAL]: SubscriptionPlan.PROFESSIONAL,
      [PlanTier.BUSINESS]: SubscriptionPlan.BUSINESS,
      [PlanTier.ENTERPRISE]: SubscriptionPlan.ENTERPRISE,
    };
    const subscriptionPlanValue = planToSubscriptionPlan[normalizedTier] || SubscriptionPlan.FREE;

    // Sync active add-ons
    const activeAddons: Array<{ type: string; quantity: number; stripePriceId: string }> = [];
    for (const item of subscription.items.data) {
      const addonType = addonPriceIdToType[item.price.id];
      if (addonType) {
        const snakeType = addonType.replace(/([A-Z])/g, '_$1').toLowerCase();
        activeAddons.push({ type: snakeType, quantity: item.quantity || 1, stripePriceId: item.price.id });
      }
    }
    const currentLimits = (brand.limits as Record<string, unknown>) || {};

    // Wrap both updates in a transaction to prevent race conditions
    await this.prisma.$transaction([
      this.prisma.brand.update({
        where: { id: brand.id },
        data: { stripeSubscriptionId: subscription.id, subscriptionStatus: appStatus, plan: planName, subscriptionPlan: subscriptionPlanValue, planExpiresAt: currentPeriodEnd, trialEndsAt: trialEnd },
      }),
      this.prisma.brand.update({
        where: { id: brand.id },
        data: { limits: { ...currentLimits, activeAddons, addonsUpdatedAt: new Date().toISOString() } },
      }),
    ]);

    if (activeAddons.length > 0) {
      this.logger.log(`Synced ${activeAddons.length} add-ons for brand ${brand.id}: ${activeAddons.map(a => `${a.type} x${a.quantity}`).join(', ')}`);
    }

    // Notify on status degradation
    if (previousStatus !== appStatus && (appStatus === 'PAST_DUE' || appStatus === 'CANCELED')) {
      const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
      if (owner?.email) {
        try {
          await this.emailService.sendEmail({
            to: owner.email,
            subject: appStatus === 'PAST_DUE' ? 'Action requise : Problème avec votre abonnement Luneo' : 'Votre abonnement Luneo a été annulé',
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h1 style="color:#333">${appStatus === 'PAST_DUE' ? 'Paiement en attente' : 'Abonnement annulé'}</h1><p>Bonjour ${owner.firstName || ''},</p>${appStatus === 'PAST_DUE' ? '<p>Nous n\'avons pas pu traiter votre dernier paiement. Veuillez mettre à jour vos informations de paiement.</p>' : '<p>Votre abonnement Luneo a été annulé. Vous pouvez vous réabonner à tout moment.</p>'}<div style="margin:30px 0"><a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">${appStatus === 'PAST_DUE' ? 'Mettre à jour le paiement' : 'Se réabonner'}</a></div><p>L'équipe Luneo</p></div>`,
          });
        } catch (emailError: unknown) {
          const msg = emailError instanceof Error ? emailError.message : String(emailError);
          this.logger.warn(`Failed to send subscription status email: ${msg}`);
        }
      }
    }

    return { processed: true, result: { type: 'subscription_updated', brandId: brand.id, subscriptionId: subscription.id, previousStatus, newStatus: appStatus, stripeStatus: subscription.status } };
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<WebhookResult> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    this.logger.log('Processing subscription deletion', { subscriptionId: subscription.id, customerId });

    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId }, include: { users: true } });
    if (!brand) return { processed: false };

    const currentLimits = (brand.limits as Record<string, unknown>) || {};
    await this.prisma.brand.update({
      where: { id: brand.id },
      data: { plan: 'starter', subscriptionStatus: SubscriptionStatus.CANCELED, stripeSubscriptionId: null, planExpiresAt: null, limits: { ...currentLimits, activeAddons: [], addonsUpdatedAt: new Date().toISOString(), canceledAt: new Date().toISOString() } as Prisma.InputJsonValue },
    });
    this.logger.log(`Brand ${brand.id} downgraded to starter plan, add-ons cleared`);

    const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
    if (owner?.email) {
      try {
        await this.emailService.sendEmail({
          to: owner.email,
          subject: 'Votre abonnement Luneo a pris fin',
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h1 style="color:#333">Abonnement terminé</h1><p>Bonjour ${owner.firstName || ''},</p><p>Votre abonnement Luneo a pris fin. Vous êtes maintenant sur le plan Starter (gratuit).</p><div style="margin:30px 0"><a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Voir les offres</a></div><p>L'équipe Luneo</p></div>`,
        });
      } catch (emailError: unknown) {
        const msg = emailError instanceof Error ? emailError.message : String(emailError);
        this.logger.warn(`Failed to send subscription deleted email: ${msg}`);
      }
    }

    return { processed: true, result: { type: 'subscription_deleted', brandId: brand.id, subscriptionId: subscription.id } };
  }

  private async handleSubscriptionPaused(subscription: Stripe.Subscription): Promise<WebhookResult> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    this.logger.log('Processing subscription paused', { subscriptionId: subscription.id, customerId });

    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId } });
    if (!brand) return { processed: false };

    await this.prisma.brand.update({ where: { id: brand.id }, data: { subscriptionStatus: 'PAST_DUE' } });
    return { processed: true, result: { type: 'subscription_paused', brandId: brand.id, subscriptionId: subscription.id } };
  }

  private async handleSubscriptionResumed(subscription: Stripe.Subscription): Promise<WebhookResult> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    this.logger.log('Processing subscription resumed', { subscriptionId: subscription.id, customerId });

    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId } });
    if (!brand) return { processed: false };

    await this.prisma.brand.update({ where: { id: brand.id }, data: { subscriptionStatus: 'ACTIVE' } });
    return { processed: true, result: { type: 'subscription_resumed', brandId: brand.id, subscriptionId: subscription.id } };
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<WebhookResult> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    this.logger.log('Processing trial_will_end', { subscriptionId: subscription.id, customerId, trialEnd: subscription.trial_end });

    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId }, include: { users: true } });
    if (!brand) return { processed: false };

    const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    await this.prisma.brand.update({ where: { id: brand.id }, data: { trialEndsAt: trialEndDate } });

    const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
    if (owner?.email) {
      const daysLeft = trialEndDate ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      const formattedDate = trialEndDate?.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      try {
        await this.emailService.sendEmail({
          to: owner.email,
          subject: `Votre période d'essai se termine dans ${daysLeft} jours`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h1 style="color:#333">Votre période d'essai touche à sa fin</h1><p>Bonjour ${owner.firstName || ''},</p><p>Votre période d'essai gratuite se terminera le <strong>${formattedDate}</strong>.</p><div style="margin:30px 0"><a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Voir les offres</a></div><p>L'équipe Luneo</p></div>`,
        });
        this.logger.log(`Trial reminder email sent to ${owner.email}`);
      } catch (emailError: unknown) {
        const msg = emailError instanceof Error ? emailError.message : String(emailError);
        this.logger.warn(`Failed to send trial reminder email: ${msg}`);
      }
    }

    return { processed: true, result: { type: 'trial_will_end', brandId: brand.id, trialEndDate, emailSent: !!owner?.email } };
  }

  // ──────────────────────────────────────────────────────────────
  // Invoice events
  // ──────────────────────────────────────────────────────────────

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<WebhookResult> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    this.logger.log('Processing invoice payment succeeded', { invoiceId: invoice.id, customerId });

    if (customerId) {
      try {
        const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId }, select: { id: true, subscriptionStatus: true, plan: true } });
        if (brand && brand.subscriptionStatus !== 'ACTIVE') {
          await this.prisma.brand.update({
            where: { id: brand.id },
            data: {
              subscriptionStatus: 'ACTIVE',
              gracePeriodEndsAt: null,
              readOnlyMode: false,
              lastGraceReminderDay: null,
            },
          });
          this.logger.log(`Brand ${brand.id} status updated to ACTIVE after successful payment`);
        }

        if (brand && invoice.subscription) {
          const isSubscriptionPayment = typeof invoice.subscription === 'string' ? !!invoice.subscription : !!invoice.subscription?.id;
          if (isSubscriptionPayment) {
            const planTier = normalizePlanTier(brand.plan);
            const monthlyCredits = getMonthlyCredits(planTier);
            if (monthlyCredits > 0) {
              try {
                const refill = await this.creditsService.refillMonthlyCredits(brand.id, monthlyCredits);
                if (refill.success && !refill.skipped) {
                  this.logger.log(`Monthly credits refilled for brand ${brand.id}: ${monthlyCredits} credits`);
                }
              } catch (refillError: unknown) {
                const msg = refillError instanceof Error ? refillError.message : String(refillError);
                this.logger.error(`Failed to refill monthly credits for brand ${brand.id}: ${msg}`);
              }
            }
          }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to update brand status after payment success: ${msg}`);
      }
    }

    return { processed: true, result: { type: 'invoice_payment_succeeded', invoiceId: invoice.id, customerId } };
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<WebhookResult> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    this.logger.warn('Processing invoice payment failed', { invoiceId: invoice.id, customerId });

    let emailSent = false;
    if (customerId) {
      const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId }, include: { users: true } });
      if (brand) {
        await this.prisma.brand.update({
          where: { id: brand.id },
          data: {
            subscriptionStatus: 'PAST_DUE',
            gracePeriodEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            lastGraceReminderDay: 0, // day 0 reminder sent below
          },
        });
        const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
        if (owner?.email) {
          const amountDue = CurrencyUtils.formatCents(invoice.amount_due || 0, invoice.currency || CurrencyUtils.getDefaultCurrency());
          const attemptCount = invoice.attempt_count || 1;
          const nextAttempt = invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : null;

          try {
            await this.emailService.sendEmail({
              to: owner.email,
              subject: 'Échec de paiement — Action requise pour votre compte Luneo',
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h1 style="color:#dc2626">Échec de paiement</h1><p>Bonjour ${owner.firstName || ''},</p><p>Nous n'avons pas pu traiter votre paiement de <strong>${amountDue}</strong>.</p><div style="background:#fef2f2;border-left:4px solid #dc2626;padding:15px;margin:20px 0"><p style="margin:0;color:#dc2626"><strong>Tentative ${attemptCount}</strong> — ${nextAttempt ? `Prochaine tentative le ${nextAttempt}` : 'Aucune tentative automatique prévue'}</p></div><div style="margin:30px 0"><a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" style="background:#dc2626;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Mettre à jour mes informations de paiement</a></div><p>L'équipe Luneo</p></div>`,
            });
            emailSent = true;
          } catch (emailError: unknown) {
            const msg = emailError instanceof Error ? emailError.message : String(emailError);
            this.logger.warn(`Failed to send payment failure email: ${msg}`);
          }
        }
        this.logger.warn(`Brand ${brand.id} subscription marked as PAST_DUE due to payment failure`);
      }
    }

    return { processed: true, result: { type: 'invoice_payment_failed', invoiceId: invoice.id, customerId, emailSent } };
  }

  private async handleInvoiceUpcoming(invoice: Stripe.Invoice): Promise<WebhookResult> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    this.logger.log('Processing invoice upcoming', { customerId, amountDue: invoice.amount_due });

    if (!customerId) return { processed: false };
    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId }, include: { users: true } });
    if (brand) {
      const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
      if (owner?.email) {
        const amountFormatted = CurrencyUtils.formatCents(invoice.amount_due || 0, invoice.currency || CurrencyUtils.getDefaultCurrency());
        const dueDate = invoice.due_date ? new Date(invoice.due_date * 1000).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'prochainement';

        try {
          await this.emailService.sendEmail({
            to: owner.email,
            subject: `Prochaine facturation Luneo — ${amountFormatted}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h1 style="color:#333">Prochaine facturation</h1><p>Bonjour ${owner.firstName || ''},</p><p>Votre prochaine facture sera émise ${dueDate}.</p><div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0"><p style="margin:0;font-size:24px;font-weight:bold;color:#333">${amountFormatted}</p><p style="margin:5px 0 0;color:#666">Montant estimé TTC</p></div><div style="margin:30px 0"><a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Gérer mon abonnement</a></div><p>L'équipe Luneo</p></div>`,
          });
        } catch (emailError: unknown) {
          const msg = emailError instanceof Error ? emailError.message : String(emailError);
          this.logger.warn(`Failed to send invoice upcoming email: ${msg}`);
        }
      }
    }

    return { processed: true, result: { type: 'invoice_upcoming', customerId, amountDue: invoice.amount_due, brandId: brand?.id } };
  }

  private async handleInvoiceFinalized(invoice: Stripe.Invoice): Promise<WebhookResult> {
    this.logger.log('Processing invoice finalized', { invoiceId: invoice.id, total: invoice.total });
    return { processed: true, result: { type: 'invoice_finalized', invoiceId: invoice.id, total: invoice.total } };
  }

  // ──────────────────────────────────────────────────────────────
  // Charge / payment method / customer / Connect events
  // ──────────────────────────────────────────────────────────────

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<WebhookResult> {
    this.logger.log('Processing charge refunded', { chargeId: charge.id, amount: charge.amount, amountRefunded: charge.amount_refunded });

    const refund = charge.refunds?.data[0];
    if (!refund) return { processed: true, result: { type: 'charge_refunded', chargeId: charge.id } };

    const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (paymentIntentId) {
      const order = await this.prisma.order.findFirst({ where: { stripePaymentId: paymentIntentId }, include: { commissions: true } });
      if (order) {
        const isFullRefund = charge.amount_refunded === charge.amount;
        await this.prisma.order.update({ where: { id: order.id }, data: { status: isFullRefund ? 'REFUNDED' : 'CANCELLED' } });
        const unpaidCommissionIds = order.commissions.filter((c) => c.status !== 'PAID').map((c) => c.id);
        if (unpaidCommissionIds.length > 0) {
          await this.prisma.commission.updateMany({
            where: { id: { in: unpaidCommissionIds } },
            data: { status: 'CANCELLED' },
          });
        }
        this.logger.log(`Order ${order.id} marked as ${isFullRefund ? 'REFUNDED' : 'CANCELLED'}`);
        return { processed: true, result: { type: 'charge_refunded', orderId: order.id, isFullRefund, amountRefunded: charge.amount_refunded } };
      }
    }

    return { processed: true, result: { type: 'charge_refunded', chargeId: charge.id, amountRefunded: charge.amount_refunded } };
  }

  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<WebhookResult> {
    this.logger.log('Processing customer updated', { customerId: customer.id, email: customer.email });
    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customer.id } });
    if (brand) this.logger.debug(`Customer ${customer.id} updated for brand ${brand.id}`);
    return { processed: true, result: { type: 'customer_updated', customerId: customer.id } };
  }

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<WebhookResult> {
    const customerId = typeof paymentMethod.customer === 'string' ? paymentMethod.customer : paymentMethod.customer?.id;
    this.logger.log('Processing payment method attached', { paymentMethodId: paymentMethod.id, customerId });
    return { processed: true, result: { type: 'payment_method_attached', paymentMethodId: paymentMethod.id, customerId } };
  }

  private async handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod): Promise<WebhookResult> {
    this.logger.log('Processing payment method detached', { paymentMethodId: paymentMethod.id });
    return { processed: true, result: { type: 'payment_method_detached', paymentMethodId: paymentMethod.id } };
  }

  private async handleConnectAccountUpdated(account: Stripe.Account): Promise<WebhookResult> {
    const artisan = await this.prisma.artisan.findFirst({ where: { stripeAccountId: account.id } });
    if (!artisan) {
      this.logger.debug(`No artisan found for Stripe account ${account.id}`);
      return { processed: true, result: { skipped: true } };
    }

    const isVerified = account.details_submitted && account.charges_enabled && account.payouts_enabled;

    if (isVerified && artisan.kycStatus !== 'VERIFIED') {
      await this.prisma.artisan.update({
        where: { id: artisan.id },
        data: { kycStatus: 'VERIFIED', kycVerifiedAt: new Date(), status: 'active', stripeAccountStatus: 'active' },
      });
      this.logger.log(`Artisan ${artisan.id} auto-verified via Stripe Connect`, { stripeAccountId: account.id });

      try {
        const adminUsers = await this.prisma.user.findMany({ where: { role: 'PLATFORM_ADMIN' }, select: { id: true } });
        if (adminUsers.length > 0) {
          await this.prisma.notification.createMany({
            data: adminUsers.map((admin) => ({
              userId: admin.id,
              type: 'SYSTEM',
              title: 'Nouvel artisan vérifié',
              message: `L'artisan "${artisan.businessName}" a été automatiquement vérifié par Stripe Connect.`,
              data: { artisanId: artisan.id, stripeAccountId: account.id } as import('@prisma/client').Prisma.InputJsonValue,
            })),
          });
        }
      } catch (notifError) {
        this.logger.warn('Failed to create admin notification for artisan verification', { error: notifError });
      }
    } else if (!isVerified) {
      const newStatus = account.details_submitted ? 'pending_verification' : 'pending';
      if (artisan.stripeAccountStatus !== newStatus) {
        await this.prisma.artisan.update({ where: { id: artisan.id }, data: { stripeAccountStatus: newStatus } });
      }
    }

    return { processed: true, result: { artisanId: artisan.id, verified: isVerified } };
  }

  // ═══════════════════════════════════════════════════════════════════
  // INVOICE CREATED
  // ═══════════════════════════════════════════════════════════════════

  private async handleInvoiceCreated(invoice: Stripe.Invoice): Promise<WebhookResult> {
    this.logger.log('Processing invoice.created', { invoiceId: invoice.id, customerId: invoice.customer });
    
    // Store invoice metadata before payment attempts
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!customerId) {
      return { processed: true, result: { skipped: true, reason: 'no_customer' } };
    }

    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId } });
    if (!brand) {
      this.logger.debug(`No brand found for Stripe customer ${customerId}`);
      return { processed: true, result: { skipped: true, reason: 'no_brand' } };
    }

    // Create or update invoice record
    try {
      await this.prisma.invoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
          brandId: brand.id,
          stripeInvoiceId: invoice.id,
          amount: (invoice.amount_due || 0) / 100,
          currency: invoice.currency || 'eur',
          status: invoice.status || 'draft',
          periodStart: new Date((invoice.period_start || 0) * 1000),
          periodEnd: new Date((invoice.period_end || 0) * 1000),
          pdfUrl: invoice.invoice_pdf || null,
        },
        update: {
          amount: (invoice.amount_due || 0) / 100,
          status: invoice.status || 'draft',
          pdfUrl: invoice.invoice_pdf || null,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to upsert invoice record: ${msg}`);
    }

    return { processed: true, result: { type: 'invoice_created', invoiceId: invoice.id, brandId: brand.id } };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAYMENT INTENT
  // ═══════════════════════════════════════════════════════════════════

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<WebhookResult> {
    this.logger.log('Processing payment_intent.succeeded', { paymentIntentId: paymentIntent.id });

    // For one-time payments (outside subscription flow)
    const metadata = paymentIntent.metadata || {};
    if (metadata.orderId) {
      try {
        await this.prisma.order.update({
          where: { id: metadata.orderId },
          data: {
            paymentStatus: 'SUCCEEDED',
            stripePaymentId: paymentIntent.id,
            paidAt: new Date(),
          },
        });
        this.logger.log(`Order ${metadata.orderId} marked as succeeded via PaymentIntent`);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to update order for PaymentIntent: ${msg}`);
      }
    }

    return { processed: true, result: { type: 'payment_intent_succeeded', paymentIntentId: paymentIntent.id } };
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<WebhookResult> {
    this.logger.log('Processing payment_intent.payment_failed', { paymentIntentId: paymentIntent.id });

    const metadata = paymentIntent.metadata || {};
    if (metadata.orderId) {
      try {
        await this.prisma.order.update({
          where: { id: metadata.orderId },
          data: { paymentStatus: 'FAILED' },
        });
        this.logger.log(`Order ${metadata.orderId} marked as payment failed`);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to update order for failed PaymentIntent: ${msg}`);
      }
    }

    // Notify platform admins about failed payments
    const customerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id;
    if (customerId) {
      const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customerId } });
      if (brand) {
        this.logger.warn(`Payment failed for brand ${brand.name} (${brand.id})`, {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          lastError: paymentIntent.last_payment_error?.message,
        });
      }
    }

    return { processed: true, result: { type: 'payment_intent_failed', paymentIntentId: paymentIntent.id } };
  }

  // ═══════════════════════════════════════════════════════════════════
  // CUSTOMER DELETED
  // ═══════════════════════════════════════════════════════════════════

  private async handleCustomerDeleted(customer: Stripe.Customer): Promise<WebhookResult> {
    this.logger.log('Processing customer.deleted', { customerId: customer.id });

    const brand = await this.prisma.brand.findFirst({ where: { stripeCustomerId: customer.id } });
    if (!brand) {
      this.logger.debug(`No brand found for deleted Stripe customer ${customer.id}`);
      return { processed: true, result: { skipped: true, reason: 'no_brand' } };
    }

    // Clear Stripe references but don't delete the brand
    try {
      await this.prisma.brand.update({
        where: { id: brand.id },
        data: { stripeCustomerId: null },
      });

      // Deactivate any active subscription on brand
      await this.prisma.brand.update({
        where: { id: brand.id },
        data: { subscriptionStatus: 'CANCELED', stripeSubscriptionId: null },
      });

      this.logger.log(`Brand ${brand.id}: Stripe customer reference cleared and subscriptions cancelled`);

      // Notify admins
      const adminUsers = await this.prisma.user.findMany({ where: { role: 'PLATFORM_ADMIN' }, select: { id: true } });
      if (adminUsers.length > 0) {
        await this.prisma.notification.createMany({
          data: adminUsers.map((admin) => ({
            userId: admin.id,
            type: 'SYSTEM',
            title: 'Client Stripe supprimé',
            message: `Le client Stripe de la marque "${brand.name}" a été supprimé. Les abonnements ont été annulés.`,
            data: { brandId: brand.id, stripeCustomerId: customer.id } as import('@prisma/client').Prisma.InputJsonValue,
          })),
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process customer deletion: ${msg}`);
    }

    return { processed: true, result: { type: 'customer_deleted', brandId: brand.id } };
  }

  // ═══════════════════════════════════════════════════════════════════
  // SETUP INTENT SUCCEEDED
  // ═══════════════════════════════════════════════════════════════════

  private async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent): Promise<WebhookResult> {
    this.logger.log('Processing setup_intent.succeeded', { setupIntentId: setupIntent.id });

    // Setup intents are used to save payment methods for future use
    const customerId = typeof setupIntent.customer === 'string' ? setupIntent.customer : setupIntent.customer?.id;
    if (!customerId) {
      return { processed: true, result: { skipped: true, reason: 'no_customer' } };
    }

    this.logger.log(`SetupIntent succeeded for customer ${customerId}`, {
      paymentMethod: typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method?.id,
    });

    return { processed: true, result: { type: 'setup_intent_succeeded', setupIntentId: setupIntent.id, customerId } };
  }

  // ═══════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create referral commission safely AFTER payment (fire-and-forget, no throw)
   */
  private createReferralCommissionSafe(
    orderId: string,
    userId: string | null,
    subtotalCents: number,
    orderNumber: string,
  ): void {
    if (!userId || !this.referralService) return;

    const commissionPercent = this.configService.get<number>('referral.commissionPercent') || 10;
    this.referralService
      .createCommissionFromOrder(orderId, userId, subtotalCents, commissionPercent)
      .then((commission) => {
        if (commission) {
          this.logger.log(`Referral commission created for order ${orderNumber}: ${commission.amountCents / 100}€`);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to create referral commission for order ${orderNumber}: ${msg}`);
      });
  }

  /**
   * Send order confirmation email safely (fire-and-forget, no throw)
   */
  private sendOrderConfirmationSafe(order: {
    id: string;
    orderNumber: string;
    totalCents: number;
    currency: string | null;
    customerEmail: string | null;
    customerName: string | null;
    items: Array<{ quantity: number; priceCents: number; product: { name: string } | null }>;
  }): void {
    if (!order.customerEmail) {
      this.logger.warn(`No customer email for order ${order.orderNumber}, skipping confirmation email`);
      return;
    }

    const currency = order.currency || 'EUR';
    const items = order.items.map(item => ({
      name: item.product?.name || 'Product',
      quantity: item.quantity,
      price: `${(item.priceCents / 100).toFixed(2)} ${currency}`,
    }));

    this.emailService
      .sendOrderConfirmationEmail(order.customerEmail, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Client',
        items,
        total: `${(order.totalCents / 100).toFixed(2)} ${currency}`,
      })
      .then(() => this.logger.log(`Order confirmation email sent for ${order.orderNumber}`))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send order confirmation email for ${order.orderNumber}: ${msg}`);
      });
  }

  // ═══════════════════════════════════════════════════════════════════
  // DISPUTE HANDLING (charge.dispute.created / charge.dispute.closed)
  // ═══════════════════════════════════════════════════════════════════

  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<WebhookResult> {
    this.logger.warn('DISPUTE CREATED', {
      disputeId: dispute.id,
      chargeId: typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
    });

    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

    // Find the related order by Stripe payment ID or session ID
    if (chargeId) {
      const order = await this.prisma.order.findFirst({
        where: {
          OR: [
            { stripePaymentId: chargeId },
            { stripeSessionId: chargeId },
          ],
        },
        include: { user: true },
      });

      if (order) {
        // Mark order as cancelled (disputed) - store dispute details in metadata
        // OrderStatus enum doesn't have DISPUTED, so we use CANCELLED + metadata
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            metadata: {
              ...(order.metadata as Record<string, unknown> || {}),
              disputeId: dispute.id,
              disputeReason: dispute.reason,
              disputeAmount: dispute.amount,
              disputeCreatedAt: new Date().toISOString(),
              disputeStatus: 'open',
            },
          },
        });

        this.logger.warn(`Order ${order.orderNumber} marked as CANCELLED (dispute: ${dispute.reason})`);
      }
    }

    // Notify admins about the dispute (fire-and-forget)
    this.emailService.sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@luneo.app',
      subject: `[URGENT] Stripe Dispute Created - ${dispute.reason}`,
      html: `
        <h2>Dispute Alert</h2>
        <p><strong>Dispute ID:</strong> ${dispute.id}</p>
        <p><strong>Amount:</strong> ${(dispute.amount / 100).toFixed(2)} ${dispute.currency?.toUpperCase()}</p>
        <p><strong>Reason:</strong> ${dispute.reason}</p>
        <p><strong>Status:</strong> ${dispute.status}</p>
        <p>Action required in <a href="https://dashboard.stripe.com/disputes/${dispute.id}">Stripe Dashboard</a></p>
      `,
    }).catch(() => { /* fire and forget */ });

    return { processed: true };
  }

  private async handleDisputeClosed(dispute: Stripe.Dispute): Promise<WebhookResult> {
    this.logger.log('Dispute closed', {
      disputeId: dispute.id,
      status: dispute.status,
    });

    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

    if (chargeId) {
      const order = await this.prisma.order.findFirst({
        where: {
          OR: [
            { stripePaymentId: chargeId },
            { stripeSessionId: chargeId },
          ],
        },
      });

      if (order) {
        // Update order status based on dispute outcome
        // Won -> restore to DELIVERED, Lost -> REFUNDED
        const newStatus = dispute.status === 'won' ? 'DELIVERED' : 'REFUNDED';
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: newStatus,
            metadata: {
              ...(order.metadata as Record<string, unknown> || {}),
              disputeClosedAt: new Date().toISOString(),
              disputeOutcome: dispute.status,
            },
          },
        });

        this.logger.log(`Order ${order.orderNumber} dispute resolved: ${dispute.status} -> ${newStatus}`);
      }
    }

    return { processed: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCA / 3D SECURE (invoice.payment_action_required)
  // ═══════════════════════════════════════════════════════════════════

  private async handlePaymentActionRequired(invoice: Stripe.Invoice): Promise<WebhookResult> {
    this.logger.warn('Payment action required (SCA/3DS)', {
      invoiceId: invoice.id,
      customerId: typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as Stripe.Customer)?.id,
      amountDue: invoice.amount_due,
    });

    const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;

    if (customerId) {
      // stripeCustomerId is on Brand, not User — find brand then its users
      const brand = await this.prisma.brand.findFirst({
        where: { stripeCustomerId: customerId },
        include: { users: { where: { role: 'BRAND_ADMIN' }, take: 1 } },
      });
      const user = brand?.users?.[0];

      if (user?.email) {
        // Notify user that payment requires additional authentication
        const hostedInvoiceUrl = invoice.hosted_invoice_url;

        this.emailService.sendEmail({
          to: user.email,
          subject: 'Action requise : Confirmez votre paiement Luneo',
          html: `
            <h2>Confirmation de paiement requise</h2>
            <p>Bonjour ${user.firstName || user.email},</p>
            <p>Votre paiement de <strong>${((invoice.amount_due || 0) / 100).toFixed(2)} ${(invoice.currency || 'eur').toUpperCase()}</strong> nécessite une vérification supplémentaire (3D Secure).</p>
            ${hostedInvoiceUrl ? `<p><a href="${hostedInvoiceUrl}" style="padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px;">Confirmer le paiement</a></p>` : ''}
            <p>Si vous ne confirmez pas dans les 24 heures, votre abonnement pourrait être suspendu.</p>
          `,
        }).catch(() => { /* fire and forget */ });

        this.logger.log(`Payment action required notification sent to ${user.email}`);
      }
    }

    return { processed: true };
  }
}
