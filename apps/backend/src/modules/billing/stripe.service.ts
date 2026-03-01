import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InvoiceStatus, Plan, OrgStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { normalizePlanTier, getPlanConfig } from '@/libs/plans';
import { StripeClientService } from './services/stripe-client.service';
import { IdempotencyService } from '@/libs/idempotency/idempotency.service';
import { EmailService } from '@/modules/email/email.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export type PlanSlug = 'pro' | 'business' | 'enterprise';

const PLAN_MAP: Record<string, Plan> = {
  pro: Plan.PRO,
  starter: Plan.PRO, // backward compat
  professional: Plan.PRO, // backward compat
  business: Plan.BUSINESS,
  enterprise: Plan.ENTERPRISE,
};

const STATUS_MAP: Record<string, OrgStatus> = {
  active: OrgStatus.ACTIVE,
  trialing: OrgStatus.TRIAL,
  past_due: OrgStatus.SUSPENDED,
  canceled: OrgStatus.CANCELED,
  unpaid: OrgStatus.SUSPENDED,
  incomplete: OrgStatus.SUSPENDED,
  incomplete_expired: OrgStatus.CANCELED,
  paused: OrgStatus.SUSPENDED,
};

const GRACE_REASON_PAYMENT_FAILED = 'GRACE_READ_ONLY_PAYMENT_FAILED';
const GRACE_REASON_EXPIRED = 'PAYMENT_FAILED_GRACE_EXPIRED';
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;
const SUSPENDED_REASON_PAST_DUE = 'STRIPE_SUBSCRIPTION_PAST_DUE';

function resolveLimits(planName: string | null | undefined) {
  const tier = normalizePlanTier(planName);
  const config = getPlanConfig(tier);
  return {
    agentsLimit: config.limits.agentsLimit === -1 ? 999 : config.limits.agentsLimit,
    conversationsLimit: config.limits.conversationsPerMonth === -1 ? 999_999 : config.limits.conversationsPerMonth,
  };
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeClient: StripeClientService,
    private readonly prisma: PrismaService,
    private readonly idempotencyService: IdempotencyService,
    private readonly emailService: EmailService,
  ) {}

  private async getBillingNotificationContext(organizationId: string): Promise<{
    email: string | null;
    locale: string;
    orgName: string;
    plan: string;
  }> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        plan: true,
        billingEmail: true,
        defaultLanguage: true,
        members: {
          where: { isActive: true },
          orderBy: { joinedAt: 'asc' },
          select: {
            role: true,
            user: {
              select: {
                email: true,
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!org) {
      return { email: null, locale: 'fr', orgName: 'Luneo', plan: 'FREE' };
    }

    const adminMember = org.members.find((member) => member.role === 'OWNER' || member.role === 'ADMIN');
    const fallbackMember = org.members.find((member) => member.user?.email);
    const email = org.billingEmail || adminMember?.user?.email || fallbackMember?.user?.email || null;

    return {
      email,
      locale: org.defaultLanguage || 'fr',
      orgName: org.name,
      plan: org.plan,
    };
  }

  async createCustomer(orgId: string, email: string, name: string): Promise<string> {
    const stripe = await this.stripeClient.getStripe();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { organizationId: orgId },
    });
    return customer.id;
  }

  async createCheckoutSession(
    orgId: string,
    plan: PlanSlug,
    billingInterval: 'monthly' | 'yearly',
    returnUrl: string,
    customerEmail?: string,
  ): Promise<string> {
    const stripe = await this.stripeClient.getStripe();
    const priceId = this.getPriceId(plan, billingInterval);
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: { organizationId: orgId, plan },
      subscription_data: { metadata: { organizationId: orgId, plan } },
    };
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    return session.url!;
  }

  async createPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
    const stripe = await this.stripeClient.getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  async handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    if (!webhookSecret) {
      this.logger.error('Stripe webhook secret not configured');
      throw new BadRequestException('Webhook secret not configured');
    }
    const stripe = await this.stripeClient.getStripe();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    const idempotencyKey = `stripe:webhook:${event.id}`;

    const claimed = await this.idempotencyService.claimForProcessing(idempotencyKey, 300);
    if (!claimed) {
      this.logger.warn(`Duplicate Stripe webhook ignored: ${event.type} (${event.id})`);
      return;
    }

    try {
      this.logger.log(`Stripe webhook received: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed': {
          await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        }

        case 'invoice.paid': {
          await this.onInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        }

        case 'invoice.payment_failed': {
          await this.onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        }

        case 'invoice.payment_action_required': {
          await this.onInvoicePaymentActionRequired(event.data.object as Stripe.Invoice);
          break;
        }

        case 'customer.subscription.updated': {
          await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        }

        case 'customer.subscription.trial_will_end': {
          await this.onTrialWillEnd(event.data.object as Stripe.Subscription);
          break;
        }

        case 'checkout.session.async_payment_failed': {
          await this.onAsyncCheckoutPaymentFailed(event.data.object as Stripe.Checkout.Session);
          break;
        }

        default:
          this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
      }

      await this.idempotencyService.completeProcessing(
        idempotencyKey,
        { type: event.type, id: event.id },
        60 * 60 * 24 * 30, // 30 days for webhook replay protection
      );
    } catch (error) {
      await this.idempotencyService.releaseClaim(idempotencyKey);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Webhook event handlers
  // ---------------------------------------------------------------------------

  private mapStripeInvoiceStatusToPrisma(status?: Stripe.Invoice.Status | null): InvoiceStatus {
    switch (status) {
      case 'draft':
        return InvoiceStatus.DRAFT;
      case 'void':
        return InvoiceStatus.VOID;
      case 'uncollectible':
        return InvoiceStatus.UNCOLLECTIBLE;
      case 'paid':
        return InvoiceStatus.PAID;
      case 'open':
      default:
        return InvoiceStatus.OPEN;
    }
  }

  private async persistInvoice(invoice: Stripe.Invoice, organizationId: string): Promise<void> {
    const periodStartUnix = invoice.lines?.data?.[0]?.period?.start ?? invoice.created ?? Math.floor(Date.now() / 1000);
    const periodEndUnix = invoice.lines?.data?.[0]?.period?.end ?? invoice.created ?? Math.floor(Date.now() / 1000);
    const paymentIntentId =
      typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent?.id ?? null;
    const items = (invoice.lines?.data ?? []).map((line) => ({
      id: line.id,
      description: line.description,
      amount: (line.amount ?? 0) / 100,
      quantity: line.quantity ?? 1,
      currency: line.currency ?? invoice.currency ?? 'usd',
      periodStart: line.period?.start ? new Date(line.period.start * 1000).toISOString() : null,
      periodEnd: line.period?.end ? new Date(line.period.end * 1000).toISOString() : null,
    }));

    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        stripePaymentIntent: paymentIntentId,
        subtotal: (invoice.subtotal ?? 0) / 100,
        tax: (invoice.tax ?? 0) / 100,
        discount: (invoice.total_discount_amounts?.reduce((sum, value) => sum + (value.amount ?? 0), 0) ?? 0) / 100,
        total: (invoice.total ?? invoice.amount_due ?? 0) / 100,
        currency: String(invoice.currency ?? 'usd').toLowerCase(),
        status: this.mapStripeInvoiceStatusToPrisma(invoice.status),
        paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
        periodStart: new Date(periodStartUnix * 1000),
        periodEnd: new Date(periodEndUnix * 1000),
        items,
        pdfUrl: invoice.invoice_pdf || null,
        hostedUrl: invoice.hosted_invoice_url || null,
        paymentMethod: typeof invoice.default_payment_method === 'string' ? invoice.default_payment_method : null,
        lastPaymentError:
          invoice.status === 'uncollectible'
            ? 'Invoice marked uncollectible'
            : null,
      },
      create: {
        organizationId,
        stripeInvoiceId: invoice.id,
        stripePaymentIntent: paymentIntentId,
        subtotal: (invoice.subtotal ?? 0) / 100,
        tax: (invoice.tax ?? 0) / 100,
        discount: (invoice.total_discount_amounts?.reduce((sum, value) => sum + (value.amount ?? 0), 0) ?? 0) / 100,
        total: (invoice.total ?? invoice.amount_due ?? 0) / 100,
        currency: String(invoice.currency ?? 'usd').toLowerCase(),
        status: this.mapStripeInvoiceStatusToPrisma(invoice.status),
        paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
        periodStart: new Date(periodStartUnix * 1000),
        periodEnd: new Date(periodEndUnix * 1000),
        items,
        pdfUrl: invoice.invoice_pdf || null,
        hostedUrl: invoice.hosted_invoice_url || null,
        paymentMethod: typeof invoice.default_payment_method === 'string' ? invoice.default_payment_method : null,
        lastPaymentError: null,
      },
    });
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    const checkoutKind = session.metadata?.kind;
    const planName = session.metadata?.plan ?? session.metadata?.planId;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!organizationId) {
      this.logger.warn('checkout.session.completed: missing organizationId in metadata');
      return;
    }

    // One-time credit pack purchase: increase available conversation quota.
    if (checkoutKind === 'credits_pack') {
      const credits = Math.max(0, Number(session.metadata?.credits || 0));
      if (!credits) {
        this.logger.warn(`Credit pack checkout missing valid credits amount (session=${session.id})`);
        return;
      }

      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          stripeCustomerId: customerId || undefined,
          conversationsLimit: { increment: credits },
        },
      });

      this.logger.log(
        `Credits top-up applied: org=${organizationId}, credits=${credits}, session=${session.id}`,
      );
      return;
    }

    const plan = PLAN_MAP[planName?.toLowerCase() ?? ''] ?? Plan.FREE;
    const limits = resolveLimits(planName);

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: OrgStatus.ACTIVE,
        suspendedAt: null,
        suspendedReason: null,
        agentsLimit: limits.agentsLimit,
        conversationsLimit: limits.conversationsLimit,
        conversationsUsed: 0,
      },
    });

    this.logger.log(
      `Checkout completed: org=${organizationId}, plan=${plan}, customer=${customerId}`,
    );

    const notification = await this.getBillingNotificationContext(organizationId);
    if (notification.email) {
      await this.emailService.sendSubscriptionConfirmationEmail(notification.email, {
        planName: String(plan),
        billingDate: new Date().toISOString().split('T')[0],
        features: String(plan),
      });
    }
  }

  private async onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!org) {
      this.logger.warn(`invoice.paid: no org found for customer ${customerId}`);
      return;
    }

    await this.persistInvoice(invoice, org.id);

    if (org.status === OrgStatus.SUSPENDED) {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: {
          status: OrgStatus.ACTIVE,
          suspendedAt: null,
          suspendedReason: null,
        },
      });
      this.logger.log(`Reactivated org ${org.id} after successful payment`);
    }

    if (invoice.billing_reason === 'subscription_cycle') {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { conversationsUsed: 0 },
      });
      this.logger.log(`Reset usage counters for org ${org.id} (subscription renewal)`);
    }

    const notification = await this.getBillingNotificationContext(org.id);
    if (notification.email) {
      const amount = ((invoice.amount_paid ?? 0) / 100).toFixed(2);
      const currency = String(invoice.currency || 'eur').toUpperCase();
      const invoiceUrl = invoice.hosted_invoice_url || '';
      await this.emailService.sendEmail({
        to: notification.email,
        subject: `Facture payée ${invoice.number ? `#${invoice.number}` : ''}`.trim(),
        text: `Paiement confirmé (${amount} ${currency}).${invoiceUrl ? ` Téléchargez votre facture: ${invoiceUrl}` : ''}`,
        html: `<p>Paiement confirmé pour votre abonnement (${amount} ${currency}).</p>${invoiceUrl ? `<p><a href="${invoiceUrl}">Télécharger la facture</a></p>` : ''}`,
        tags: ['billing', 'invoice-paid'],
        provider: 'auto',
      });
    }
  }

  private async onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!org) {
      this.logger.warn(`invoice.payment_failed: no org found for customer ${customerId}`);
      return;
    }

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        status: OrgStatus.ACTIVE,
        suspendedAt: new Date(),
        suspendedReason: GRACE_REASON_PAYMENT_FAILED,
      },
    });
    await this.persistInvoice(invoice, org.id);
    this.logger.warn(`Set org ${org.id} in grace read-only mode due to payment failure`);

    const notification = await this.getBillingNotificationContext(org.id);
    if (notification.email) {
      const amount = ((invoice.amount_due ?? 0) / 100).toFixed(2);
      const retryDate = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + GRACE_PERIOD_MS).toISOString().split('T')[0];
      await this.emailService.sendPaymentFailedEmail(notification.email, {
        amount: `${amount} ${String(invoice.currency || 'eur').toUpperCase()}`,
        retryDate,
      });
    }
  }

  private async onInvoicePaymentActionRequired(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!org) {
      return;
    }

    await this.persistInvoice(invoice, org.id);

    const notification = await this.getBillingNotificationContext(org.id);
    if (!notification.email) {
      return;
    }

    await this.emailService.sendEmail({
      to: notification.email,
      subject: 'Action requise pour votre paiement',
      text: 'Votre paiement nécessite une action (ex: authentification 3D Secure). Veuillez vérifier votre portail de facturation.',
      html: '<p>Votre paiement nécessite une action (ex: authentification 3D Secure). Veuillez vérifier votre portail de facturation.</p>',
      tags: ['billing', 'payment-action-required'],
      provider: 'auto',
    });
  }

  private async onSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;

    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!org) {
      this.logger.warn(`subscription.updated: no org found for customer ${customerId}`);
      return;
    }

    const newStatus = STATUS_MAP[subscription.status] ?? OrgStatus.ACTIVE;

    const planItem = subscription.items?.data?.[0];
    const planFromMeta = subscription.metadata?.plan || planItem?.price?.metadata?.plan;
    const plan = PLAN_MAP[planFromMeta?.toLowerCase() ?? ''] ?? org.plan;
    const limits = resolveLimits(planFromMeta ?? org.plan);

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        status: newStatus,
        plan,
        planPeriodEnd: periodEnd,
        suspendedAt:
          newStatus === OrgStatus.ACTIVE
            ? null
            : (org.suspendedAt ?? new Date()),
        suspendedReason:
          newStatus === OrgStatus.ACTIVE
            ? null
            : (org.suspendedReason ?? SUSPENDED_REASON_PAST_DUE),
        agentsLimit: limits.agentsLimit,
        conversationsLimit: limits.conversationsLimit,
      },
    });

    this.logger.log(`Subscription updated: org=${org.id}, status=${newStatus}, plan=${plan}`);

    const notification = await this.getBillingNotificationContext(org.id);
    if (notification.email) {
      await this.emailService.sendEmail({
        to: notification.email,
        subject: `Votre abonnement a été mis à jour (${String(plan)})`,
        text: `Votre abonnement Luneo a été mis à jour.\nNouveau plan: ${String(plan)}\nStatut: ${String(newStatus)}`,
        html: `<p>Votre abonnement Luneo a été mis à jour.</p><p><strong>Plan:</strong> ${String(plan)}</p><p><strong>Statut:</strong> ${String(newStatus)}</p>`,
        tags: ['billing', 'subscription-updated'],
        provider: 'auto',
      });
    }
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;

    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!org) {
      this.logger.warn(`subscription.deleted: no org found for customer ${customerId}`);
      return;
    }

    const freeLimits = resolveLimits('free');

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        plan: Plan.FREE,
        status: OrgStatus.ACTIVE,
        stripeSubscriptionId: null,
        planPeriodEnd: null,
        suspendedAt: null,
        suspendedReason: null,
        agentsLimit: freeLimits.agentsLimit,
        conversationsLimit: freeLimits.conversationsLimit,
      },
    });

    this.logger.log(`Subscription deleted: org=${org.id} reverted to FREE`);

    const notification = await this.getBillingNotificationContext(org.id);
    if (notification.email) {
      await this.emailService.sendEmail({
        to: notification.email,
        subject: 'Votre abonnement a été annulé',
        text: 'Votre abonnement payant a été annulé et votre organisation est repassée sur le plan FREE.',
        html: '<p>Votre abonnement payant a été annulé et votre organisation est repassée sur le plan <strong>FREE</strong>.</p>',
        tags: ['billing', 'subscription-canceled'],
        provider: 'auto',
      });
    }
  }

  private async onTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!org) {
      return;
    }

    const trialEndsAt = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString().split('T')[0]
      : 'bientot';
    const notification = await this.getBillingNotificationContext(org.id);
    if (!notification.email) {
      return;
    }

    await this.emailService.sendEmail({
      to: notification.email,
      subject: 'Votre période d’essai se termine bientôt',
      text: `Votre période d'essai se termine le ${trialEndsAt}. Ajoutez un moyen de paiement pour éviter toute interruption.`,
      html: `<p>Votre période d'essai se termine le <strong>${trialEndsAt}</strong>.</p><p>Ajoutez un moyen de paiement pour éviter toute interruption.</p>`,
      tags: ['billing', 'trial-ending'],
      provider: 'auto',
    });
  }

  private async onAsyncCheckoutPaymentFailed(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) {
      return;
    }
    const notification = await this.getBillingNotificationContext(organizationId);
    if (!notification.email) {
      return;
    }

    await this.emailService.sendEmail({
      to: notification.email,
      subject: 'Échec du paiement de souscription',
      text: 'Votre paiement de souscription a échoué. Veuillez réessayer depuis votre espace facturation.',
      html: '<p>Votre paiement de souscription a échoué. Veuillez réessayer depuis votre espace facturation.</p>',
      tags: ['billing', 'checkout-failed'],
      provider: 'auto',
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async enforceGraceExpiry(): Promise<void> {
    const graceOrgs = await this.prisma.organization.findMany({
      where: {
        status: OrgStatus.ACTIVE,
        suspendedReason: {
          startsWith: GRACE_REASON_PAYMENT_FAILED,
        },
        suspendedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        suspendedAt: true,
      },
      take: 1000,
    });

    const now = Date.now();
    const expiredOrgIds = graceOrgs
      .filter((org) => org.suspendedAt && now - org.suspendedAt.getTime() >= GRACE_PERIOD_MS)
      .map((org) => org.id);

    if (expiredOrgIds.length === 0) {
      return;
    }

    await this.prisma.organization.updateMany({
      where: { id: { in: expiredOrgIds } },
      data: {
        status: OrgStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspendedReason: GRACE_REASON_EXPIRED,
      },
    });

    for (const orgId of expiredOrgIds) {
      const notification = await this.getBillingNotificationContext(orgId);
      if (!notification.email) {
        continue;
      }
      await this.emailService.sendEmail({
        to: notification.email,
        subject: 'Suspension de votre organisation pour impayé',
        text: 'La période de grâce de 3 jours est expirée. Votre organisation est suspendue jusqu’à régularisation.',
        html: '<p>La période de grâce de 3 jours est expirée. Votre organisation est suspendue jusqu’à régularisation.</p>',
        tags: ['billing', 'subscription-suspended'],
        provider: 'auto',
      });
    }

    this.logger.warn(`Grace period expired for ${expiredOrgIds.length} organizations`);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private getPriceId(plan: PlanSlug, interval: 'monthly' | 'yearly'): string {
    const planToConfigKey: Record<PlanSlug, { monthly: string; yearly: string }> = {
      pro: { monthly: 'stripe.priceProMonthly', yearly: 'stripe.priceProYearly' },
      business: { monthly: 'stripe.priceBusinessMonthly', yearly: 'stripe.priceBusinessYearly' },
      enterprise: { monthly: 'stripe.priceEnterpriseMonthly', yearly: 'stripe.priceEnterpriseYearly' },
    };
    const key =
      planToConfigKey[plan]?.[interval] ??
      `stripe.price${plan.charAt(0).toUpperCase() + plan.slice(1)}${interval === 'monthly' ? 'Monthly' : 'Yearly'}`;
    return this.configService.get<string>(key) || '';
  }
}
