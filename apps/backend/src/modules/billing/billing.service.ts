import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { PlansService, PlanType, PlanUpgradeOptions } from '../plans/plans.service';
import { OrdersService } from '../orders/orders.service';
import { BillingTaxService } from './services/billing-tax.service';
import { BillingInvoiceService } from './services/billing-invoice.service';
import { BillingReportingService, RevenueDashboard, RevenueDashboardFilters } from './services/billing-reporting.service';
import { TaxComputationResult } from './services/billing-tax.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly plansService: PlansService,
    private readonly ordersService: OrdersService,
    private readonly taxService: BillingTaxService,
    private readonly invoiceService: BillingInvoiceService,
    private readonly reportingService: BillingReportingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async computeOrderTotals(params: {
    subtotalCents: number;
    countryCode: string;
    regionCode?: string | null;
    currency?: string;
  }): Promise<TaxComputationResult> {
    const tax = this.taxService.computeTax({
      subtotalCents: params.subtotalCents,
      countryCode: params.countryCode,
      regionCode: params.regionCode,
    });

    if (params.currency && params.currency !== tax.currency) {
      this.logger.warn(`Devise calculée (${tax.currency}) différente de la devise demandée (${params.currency}).`);
    }

    return tax;
  }

  async generateInvoice(orderId: string): Promise<{ filename: string; contentType: string; base64: string }> {
    const pdf = await this.invoiceService.generateInvoicePdf(orderId);
    const filename = `invoice-${orderId}.pdf`;
    return {
      filename,
      contentType: 'application/pdf',
      base64: pdf.toString('base64'),
    };
  }

  async getRevenueDashboard(filters: RevenueDashboardFilters = {}): Promise<RevenueDashboard> {
    return this.reportingService.getRevenueDashboard(filters);
  }

  async createCheckoutSession(planId: string, userId: string, userEmail: string) {
    const normalizedPlan = this.normalizePlan(planId);
    const priceId = this.getPriceIdForPlan(normalizedPlan);

    if (!priceId) {
      throw new Error(`Aucun price Stripe configuré pour le plan ${normalizedPlan}`);
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          stripeCustomerId: true,
          brandId: true,
        },
      });

      const customerId = user?.stripeCustomerId;
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer: customerId ?? undefined,
        customer_email: customerId ? undefined : user?.email ?? userEmail,
        success_url: `${this.configService.get('STRIPE_SUCCESS_URL')}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('STRIPE_CANCEL_URL')}`,
        metadata: {
          userId: user?.id ?? userId,
          planId: normalizedPlan,
          brandId: user?.brandId ?? '',
        },
        subscription_data: {
          trial_period_days: 14,
        },
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error) {
      this.logger.error('Erreur création session Stripe:', error);
      throw new Error('Erreur lors de la création de la session de paiement');
    }
  }

  async createCustomerPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId },
      });

      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${this.configService.get('FRONTEND_URL')}/dashboard/billing`,
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error) {
      this.logger.error('Erreur création session portal:', error);
      throw new Error('Erreur lors de la création de la session du portail client');
    }
  }

  async handleWebhook(payload: Buffer, signature?: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    if (!signature) {
      throw new BadRequestException('Stripe signature header manquant');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Verification Stripe webhook échouée', error);
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    // Idempotency check: prevent duplicate processing
    const existingEvent = await this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent?.processed) {
      this.logger.log(`Webhook event ${event.id} already processed, skipping`);
      return;
    }

    // Create or update webhook event record
    await this.prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: {
        stripeEventId: event.id,
        eventType: event.type,
        payload: event as unknown as Record<string, unknown>,
        processed: false,
      },
      update: {
        retryCount: { increment: 1 },
      },
    });

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'checkout.session.expired': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.metadata?.topupId) {
            this.eventEmitter.emit('billing.topup.failed', {
              session,
              reason: 'expired',
            });
            break;
          }
          await this.ordersService.handleStripeCheckoutExpired(session);
          break;
        }
        case 'checkout.session.async_payment_failed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.metadata?.topupId) {
            this.eventEmitter.emit('billing.topup.failed', {
              session,
              reason: 'payment_failed',
            });
            break;
          }
          await this.ordersService.handleStripePaymentFailed(session);
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          this.logger.debug(`Stripe webhook ${event.type} non géré`);
      }

      // Mark event as processed on success
      await this.prisma.stripeWebhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Erreur traitement webhook Stripe (${event.type})`, error as Error);
      
      // Record error but don't mark as processed
      await this.prisma.stripeWebhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.metadata?.topupId) {
      this.eventEmitter.emit('billing.topup.completed', session);
      return;
    }

    const orderId = session.metadata?.orderId;
    if (orderId) {
      await this.ordersService.handleStripeCheckoutCompleted(session);
      return;
    }

    const metadataPlan = session.metadata?.planId;
    const customerId = this.extractCustomerId(session.customer);
    const subscriptionId = this.extractSubscriptionId(session.subscription);
    const userIdFromMetadata = session.metadata?.userId;

    let subscription: Stripe.Subscription | null = null;
    if (subscriptionId) {
      try {
        subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      } catch (error) {
        this.logger.warn(`Impossible de récupérer la subscription ${subscriptionId}: ${error}`);
      }
    }

    const priceId = subscription?.items?.data?.[0]?.price?.id ?? null;
    const plan = this.resolvePlan(metadataPlan, priceId);
    const currentPeriodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;
    const status = subscription?.status ?? session.payment_status ?? session.status ?? 'completed';

    if (userIdFromMetadata && userIdFromMetadata !== 'anonymous') {
      await this.applyPlanToUser(userIdFromMetadata, plan, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status,
        currentPeriodEnd,
      });
      return;
    }

    if (customerId) {
      const user = await this.findUserByStripeCustomer(customerId);
      if (user) {
        await this.applyPlanToUser(user.id, plan, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status,
          currentPeriodEnd,
        });
      } else {
        this.logger.warn(`Aucun utilisateur associé au customer ${customerId}`);
      }
    } else {
      this.logger.warn('Checkout session sans userId ni customerId');
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = this.extractCustomerId(subscription.customer);
    if (!customerId) {
      this.logger.warn('Subscription update sans customer id');
      return;
    }

    const user = await this.findUserByStripeCustomer(customerId);
    if (!user) {
      this.logger.warn(`Aucun utilisateur pour subscription ${subscription.id}`);
      return;
    }

    const metadataPlan = subscription.metadata?.planId;
    const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
    const plan = this.resolvePlan(metadataPlan, priceId);
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    await this.applyPlanToUser(user.id, plan, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd,
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = this.extractCustomerId(subscription.customer);
    if (!customerId) {
      this.logger.warn('Subscription delete sans customer id');
      return;
    }

    const user = await this.findUserByStripeCustomer(customerId);
    if (!user) {
      this.logger.warn(`Aucun utilisateur pour subscription supprimée ${subscription.id}`);
      return;
    }

    await this.plansService.downgradeUserPlan(user.id, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
      status: subscription.status,
      currentPeriodEnd: null,
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId = this.extractCustomerId(invoice.customer);
    if (!customerId) return;

    const user = await this.findUserByStripeCustomer(customerId);
    if (!user) return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        stripeStatus: 'invoice_paid',
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = this.extractCustomerId(invoice.customer);
    if (!customerId) return;

    const user = await this.findUserByStripeCustomer(customerId);
    if (!user) return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        stripeStatus: 'invoice_payment_failed',
      },
    });
  }

  private async applyPlanToUser(userId: string, plan: PlanType, options: PlanUpgradeOptions) {
    await this.plansService.upgradeUserPlan(userId, plan, options);
  }

  private async findUserByStripeCustomer(customerId: string | null): Promise<{
    id: string;
  } | null> {
    if (!customerId) {
      return null;
    }

    return this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
  }

  private normalizePlan(planId: string | null | undefined): PlanType {
    if (!planId) {
      return PlanType.STARTER;
    }

    const normalized = planId.toLowerCase() as PlanType;
    return Object.values(PlanType).includes(normalized) ? normalized : PlanType.STARTER;
  }

  private getPriceIdForPlan(plan: PlanType): string | undefined {
    const priceMap: Record<PlanType, string | undefined> = {
      [PlanType.STARTER]: undefined,
      [PlanType.PROFESSIONAL]: this.configService.get<string>('STRIPE_PRICE_PRO'),
      [PlanType.BUSINESS]: this.configService.get<string>('STRIPE_PRICE_BUSINESS'),
      [PlanType.ENTERPRISE]: this.configService.get<string>('STRIPE_PRICE_ENTERPRISE'),
    };

    return priceMap[plan];
  }

  private resolvePlan(metadataPlan?: string | null, priceId?: string | null): PlanType {
    if (metadataPlan) {
      return this.normalizePlan(metadataPlan);
    }

    if (priceId) {
      const map: Array<[PlanType, string | undefined]> = [
        [PlanType.PROFESSIONAL, this.getPriceIdForPlan(PlanType.PROFESSIONAL)],
        [PlanType.BUSINESS, this.getPriceIdForPlan(PlanType.BUSINESS)],
        [PlanType.ENTERPRISE, this.getPriceIdForPlan(PlanType.ENTERPRISE)],
      ];

      for (const [plan, configuredPriceId] of map) {
        if (configuredPriceId && configuredPriceId === priceId) {
          return plan;
        }
      }
    }

    return PlanType.STARTER;
  }

  private extractCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
    if (!customer) return null;
    if (typeof customer === 'string') return customer;
    return 'id' in customer ? customer.id : null;
  }

  private extractSubscriptionId(subscription: string | Stripe.Subscription | null): string | null {
    if (!subscription) return null;
    if (typeof subscription === 'string') return subscription;
    return subscription.id;
  }
}
