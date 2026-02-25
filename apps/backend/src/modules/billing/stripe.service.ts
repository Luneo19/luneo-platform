import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Plan, OrgStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { normalizePlanTier, getPlanConfig } from '@/libs/plans';
import { StripeClientService } from './services/stripe-client.service';
import { IdempotencyService } from '@/libs/idempotency/idempotency.service';

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
  ) {}

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

        case 'customer.subscription.updated': {
          await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
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

  private async onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    const planName = session.metadata?.plan ?? session.metadata?.planId;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!organizationId) {
      this.logger.warn('checkout.session.completed: missing organizationId in metadata');
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
        agentsLimit: limits.agentsLimit,
        conversationsLimit: limits.conversationsLimit,
        conversationsUsed: 0,
      },
    });

    this.logger.log(
      `Checkout completed: org=${organizationId}, plan=${plan}, customer=${customerId}`,
    );
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

    if (org.status === OrgStatus.SUSPENDED) {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { status: OrgStatus.ACTIVE },
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
      data: { status: OrgStatus.SUSPENDED },
    });
    this.logger.warn(`Suspended org ${org.id} due to payment failure`);
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
        agentsLimit: limits.agentsLimit,
        conversationsLimit: limits.conversationsLimit,
      },
    });

    this.logger.log(`Subscription updated: org=${org.id}, status=${newStatus}, plan=${plan}`);
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
        agentsLimit: freeLimits.agentsLimit,
        conversationsLimit: freeLimits.conversationsLimit,
      },
    });

    this.logger.log(`Subscription deleted: org=${org.id} reverted to FREE`);
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
