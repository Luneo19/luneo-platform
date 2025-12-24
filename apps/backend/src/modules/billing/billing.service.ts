import { CreditsService } from '@/libs/credits/credits.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripeInstance: Stripe | null = null;
  private stripeModule: typeof import('stripe') | null = null;

  constructor(
    private configService: ConfigService,
    private creditsService: CreditsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Lazy load Stripe module to reduce cold start time
   * Public method to allow access from controller
   */
  async getStripe(): Promise<Stripe> {
    if (!this.stripeInstance) {
      if (!this.stripeModule) {
        this.stripeModule = await import('stripe');
      }
      const secretKey = this.configService.get<string>('stripe.secretKey');
      if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      this.stripeInstance = new this.stripeModule.default(secretKey, {
        apiVersion: '2023-10-16',
      });
    }
    return this.stripeInstance;
  }

  async createCheckoutSession(planId: string, userId: string, userEmail: string) {
    const planPrices = {
      starter: null, // Gratuit
      professional: this.configService.get<string>('stripe.pricePro'),
      business: this.configService.get<string>('stripe.priceBusiness'),
      enterprise: this.configService.get<string>('stripe.priceEnterprise')
    };

    const priceId = planPrices[planId];
    
    if (!priceId) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Tous les plans sont maintenant configurés dans Stripe

    try {
      const stripe = await this.getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer_email: userEmail,
        success_url: `${this.configService.get<string>('stripe.successUrl')}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: this.configService.get<string>('stripe.cancelUrl'),
        metadata: {
          userId,
          planId,
        },
        // Essai gratuit de 14 jours
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
    try {
      const stripe = await this.getStripe();
      // Ici vous devriez récupérer le customer_id depuis votre base de données
      // Pour l'instant, on utilise un placeholder
      const customerId = `cus_${userId}`;
      
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${this.configService.get<string>('app.frontendUrl')}/dashboard/billing`,
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

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<{ processed: boolean; result?: any }> {
    this.logger.log(`Processing Stripe webhook: ${event.type}`, { eventId: event.id });

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          return await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

        case 'invoice.payment_succeeded':
          return await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);

        case 'invoice.payment_failed':
          return await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

        default:
          this.logger.debug(`Unhandled Stripe webhook event type: ${event.type}`, { eventId: event.id });
          return { processed: false };
      }
    } catch (error) {
      this.logger.error(`Error processing Stripe webhook ${event.type}`, error, { eventId: event.id });
      throw error;
    }
  }

  /**
   * Handle checkout.session.completed event
   * This is triggered when a customer completes a payment (including credit purchases)
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<{ processed: boolean; result?: any }> {
    this.logger.log('Processing checkout.session.completed', { sessionId: session.id });

    // Check if this is a credit purchase
    if (session.metadata?.type === 'credits_purchase' && session.metadata?.userId) {
      const userId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits || session.metadata.packSize || '0', 10);

      if (credits > 0) {
        try {
          // Fetch the session with expanded line items to get price ID
          const stripe = await this.getStripe();
          const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items.data.price'],
          });

          // Find the pack by Stripe price ID
          const priceId = expandedSession.line_items?.data[0]?.price?.id;
          const pack = priceId
            ? await this.prisma.creditPack.findFirst({
                where: { stripePriceId: priceId },
              })
            : null;

          const result = await this.creditsService.addCredits(
            userId,
            credits,
            pack?.id,
            session.id,
            session.payment_intent as string,
          );

          this.logger.log('Credits added successfully', {
            userId,
            credits,
            newBalance: result.newBalance,
            sessionId: session.id,
          });

          return {
            processed: true,
            result: {
              type: 'credits_purchase',
              userId,
              credits,
              newBalance: result.newBalance,
            },
          };
        } catch (error) {
          this.logger.error('Failed to add credits from checkout session', error, {
            sessionId: session.id,
            userId,
            credits,
          });
          throw error;
        }
      }
    }

    // Handle subscription checkout
    if (session.mode === 'subscription' && session.customer) {
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
      
      // Update brand with Stripe customer ID
      if (session.metadata?.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: session.metadata.userId },
          include: { brand: true },
        });

        if (user?.brandId) {
          await this.prisma.brand.update({
            where: { id: user.brandId },
            data: {
              stripeCustomerId: customerId,
            },
          });
        }
      }

      return {
        processed: true,
        result: {
          type: 'subscription_created',
          customerId,
          sessionId: session.id,
        },
      };
    }

    return { processed: false };
  }

  /**
   * Handle subscription.created and subscription.updated events
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    
    this.logger.log('Processing subscription update', {
      subscriptionId: subscription.id,
      customerId,
      status: subscription.status,
    });

    // Find brand by Stripe customer ID
    const brand = await this.prisma.brand.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (brand) {
      await this.prisma.brand.update({
        where: { id: brand.id },
        data: {
          stripeSubscriptionId: subscription.id,
          plan: subscription.items.data[0]?.price?.nickname || 'professional',
        },
      });

      return {
        processed: true,
        result: {
          type: 'subscription_updated',
          brandId: brand.id,
          subscriptionId: subscription.id,
          status: subscription.status,
        },
      };
    }

    return { processed: false };
  }

  /**
   * Handle subscription.deleted event
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    
    this.logger.log('Processing subscription deletion', {
      subscriptionId: subscription.id,
      customerId,
    });

    const brand = await this.prisma.brand.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (brand) {
      await this.prisma.brand.update({
        where: { id: brand.id },
        data: {
          plan: 'starter', // Revert to free plan
        },
      });

      return {
        processed: true,
        result: {
          type: 'subscription_deleted',
          brandId: brand.id,
          subscriptionId: subscription.id,
        },
      };
    }

    return { processed: false };
  }

  /**
   * Handle invoice.payment_succeeded event
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<{ processed: boolean; result?: any }> {
    this.logger.log('Processing invoice payment succeeded', {
      invoiceId: invoice.id,
      customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
    });

    // Log the successful payment
    // Additional business logic can be added here (e.g., send confirmation emails)

    return {
      processed: true,
      result: {
        type: 'invoice_payment_succeeded',
        invoiceId: invoice.id,
      },
    };
  }

  /**
   * Handle invoice.payment_failed event
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<{ processed: boolean; result?: any }> {
    this.logger.warn('Processing invoice payment failed', {
      invoiceId: invoice.id,
      customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
    });

    // Log the failed payment
    // Additional business logic can be added here (e.g., send notification emails, update subscription status)

    return {
      processed: true,
      result: {
        type: 'invoice_payment_failed',
        invoiceId: invoice.id,
      },
    };
  }
}
