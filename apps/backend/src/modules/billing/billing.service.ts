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

  /**
   * Crée une session Stripe checkout avec support des add-ons
   * Conforme au plan PHASE 6 - Stripe checkout avec add-ons
   */
  async createCheckoutSession(
    planId: string,
    userId: string,
    userEmail: string,
    options?: {
      billingInterval?: 'monthly' | 'yearly';
      addOns?: Array<{ type: string; quantity: number }>;
    },
  ) {
    // ✅ Validation
    if (!planId || typeof planId !== 'string' || planId.trim().length === 0) {
      throw new Error('Plan ID is required');
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
      throw new Error('Valid user email is required');
    }

    const billingInterval = options?.billingInterval || 'monthly';

    // ✅ Obtenir les Price IDs Stripe depuis la config (avec fallback vers les IDs de test)
    const planPriceIds: Record<string, { monthly: string | null; yearly: string | null }> = {
      starter: {
        monthly: this.configService.get<string>('stripe.priceStarterMonthly') || 'price_1SxN49KG9MsM6fdSQBimFF2p',
        yearly: this.configService.get<string>('stripe.priceStarterYearly') || 'price_1SxN4GKG9MsM6fdSvd3MdQsg',
      },
      professional: {
        monthly: this.configService.get<string>('stripe.priceProMonthly') || 'price_1SqKzdKG9MsM6fdSAZZrmTXO',
        yearly: this.configService.get<string>('stripe.priceProYearly') || 'price_1SqKzdKG9MsM6fdSiLDDW6Ui',
      },
      business: {
        monthly: this.configService.get<string>('stripe.priceBusinessMonthly') || 'price_1SqKzeKG9MsM6fdS4Er2R29w',
        yearly: this.configService.get<string>('stripe.priceBusinessYearly') || 'price_1SqKzeKG9MsM6fdSxaatQloI',
      },
      enterprise: {
        monthly: this.configService.get<string>('stripe.priceEnterpriseMonthly') || 'price_1SxN4OKG9MsM6fdSxskfUHbG',
        yearly: this.configService.get<string>('stripe.priceEnterpriseYearly') || 'price_1SxN4PKG9MsM6fdShT8bgtxM',
      },
    };

    const priceId = billingInterval === 'yearly'
      ? planPriceIds[planId]?.yearly
      : planPriceIds[planId]?.monthly;

    if (!priceId) {
      throw new Error(`Plan ${planId} not found or not available for ${billingInterval} billing`);
    }

    try {
      const stripe = await this.getStripe();

      // ✅ Construire les line items (plan + add-ons)
      const lineItems: Array<{ price: string; quantity: number }> = [
        {
          price: priceId,
          quantity: 1,
        },
      ];

      // ✅ Ajouter les add-ons si fournis
      // Note: Pour les add-ons, on peut soit créer des Price IDs Stripe dédiés,
      // soit utiliser des line items avec prix personnalisés
      // Pour l'instant, on utilise des line items avec prix personnalisés
      if (options?.addOns && options.addOns.length > 0) {
        // TODO: Créer des Price IDs Stripe pour chaque add-on et les utiliser ici
        // Pour l'instant, on stocke les add-ons dans metadata et on les facturera séparément
        this.logger.log(`Add-ons requested: ${JSON.stringify(options.addOns)}`);
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'subscription',
        customer_email: userEmail,
        success_url: `${this.configService.get<string>('stripe.successUrl')}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: this.configService.get<string>('stripe.cancelUrl'),
        metadata: {
          userId,
          planId,
          billingInterval,
          addOns: options?.addOns ? JSON.stringify(options.addOns) : undefined,
        },
        // Essai gratuit de 14 jours
        subscription_data: {
          trial_period_days: 14,
        },
      });

      return {
        success: true,
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error('Erreur création session Stripe:', error);
      throw new Error('Erreur lors de la création de la session de paiement');
    }
  }

  async getPaymentMethods(userId: string) {
    try {
      // Récupérer le brand de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { brand: true },
      });

      if (!user?.brand?.stripeCustomerId) {
        return { paymentMethods: [] };
      }

      // Récupérer les méthodes de paiement depuis Stripe
      const stripe = await this.getStripe();
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.brand.stripeCustomerId,
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
    } catch (error) {
      this.logger.error('Error getting payment methods', error, { userId });
      throw new Error('Erreur lors de la récupération des méthodes de paiement');
    }
  }

  async addPaymentMethod(userId: string, paymentMethodId: string, setAsDefault: boolean = false) {
    try {
      // Récupérer le brand de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { brand: true },
      });

      if (!user?.brand) {
        throw new Error('Brand not found for user');
      }

      let customerId = user.brand.stripeCustomerId;

      // Créer un customer Stripe si nécessaire
      if (!customerId) {
        const stripe = await this.getStripe();
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: user.id,
            brandId: user.brand.id,
          },
        });

        customerId = customer.id;

        // Sauvegarder le customer ID
        await this.prisma.brand.update({
          where: { id: user.brand.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // Attacher la méthode de paiement au customer
      const stripe = await this.getStripe();
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

      return {
        paymentMethod: {
          id: paymentMethodId,
          attached: true,
          setAsDefault,
        },
        message: 'Méthode de paiement ajoutée avec succès',
      };
    } catch (error) {
      this.logger.error('Error adding payment method', error, { userId, paymentMethodId });
      throw new Error(`Erreur lors de l'ajout de la méthode de paiement: ${error.message}`);
    }
  }

  async removePaymentMethod(userId: string, paymentMethodId: string) {
    try {
      // Détacher la méthode de paiement
      const stripe = await this.getStripe();
      await stripe.paymentMethods.detach(paymentMethodId);

      return { message: 'Méthode de paiement supprimée avec succès' };
    } catch (error) {
      this.logger.error('Error removing payment method', error, { userId, paymentMethodId });
      throw new Error(`Erreur lors de la suppression de la méthode de paiement: ${error.message}`);
    }
  }

  async getInvoices(userId: string, page: number = 1, limit: number = 20) {
    try {
      // Récupérer le brand de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { brand: true },
      });

      if (!user?.brand?.stripeCustomerId) {
        return {
          invoices: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      // Récupérer les factures depuis Stripe
      const stripe = await this.getStripe();
      const invoices = await stripe.invoices.list({
        customer: user.brand.stripeCustomerId,
        limit,
      });

      const formattedInvoices = invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        dueDate: invoice.due_date,
        paidAt: invoice.status_transitions.paid_at,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        lineItems: invoice.lines.data.map((line) => ({
          description: line.description,
          amount: line.amount,
          quantity: line.quantity,
        })),
      }));

      return {
        invoices: formattedInvoices,
        pagination: {
          page,
          limit,
          total: invoices.data.length,
          totalPages: Math.ceil(invoices.data.length / limit),
          hasNext: invoices.has_more,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error getting invoices', error, { userId });
      throw new Error('Erreur lors de la récupération des factures');
    }
  }

  /**
   * ✅ Get subscription information for user
   * Returns SubscriptionInfo with plan, limits, and usage
   */
  async getSubscription(userId: string) {
    try {
      // Récupérer le brand de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { brand: true },
      });

      if (!user?.brandId || !user.brand) {
        // Pas de brand = plan gratuit par défaut
        return {
          plan: 'starter' as const,
          status: 'active' as const,
          limits: {
            designsPerMonth: 50,
            teamMembers: 3,
            storageGB: 5,
            apiAccess: false,
            advancedAnalytics: false,
            prioritySupport: false,
            customExport: false,
            whiteLabel: false,
          },
          currentUsage: {
            designs: 0,
            renders2D: 0,
            renders3D: 0,
            storageGB: 0,
            apiCalls: 0,
            teamMembers: 1,
          },
        };
      }

      const brand = user.brand;
      
      // Déterminer le plan depuis brand.plan ou subscriptionPlan
      const planFromDb = brand.plan?.toLowerCase() || brand.subscriptionPlan?.toLowerCase() || 'starter';
      
      // Mapper SubscriptionPlan enum vers PlanTier
      const planMap: Record<string, 'starter' | 'professional' | 'business' | 'enterprise'> = {
        'free': 'starter',
        'starter': 'starter',
        'professional': 'professional',
        'business': 'business',
        'enterprise': 'enterprise',
      };
      
      const plan: 'starter' | 'professional' | 'business' | 'enterprise' = 
        planMap[planFromDb] || 'starter';

      // Déterminer le statut depuis subscriptionStatus ou Stripe
      let status: 'active' | 'trialing' | 'past_due' | 'canceled' = 'active';
      
      if (brand.subscriptionStatus) {
        const statusMap: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled'> = {
          'ACTIVE': 'active',
          'TRIALING': 'trialing',
          'PAST_DUE': 'past_due',
          'CANCELED': 'canceled',
        };
        status = statusMap[brand.subscriptionStatus] || 'active';
      }

      // Récupérer les détails depuis Stripe si subscription ID existe
      let stripeSubscription: Stripe.Subscription | null = null;
      if (brand.stripeSubscriptionId) {
        try {
          const stripe = await this.getStripe();
          stripeSubscription = await stripe.subscriptions.retrieve(brand.stripeSubscriptionId);
          
          // Utiliser le statut Stripe si disponible
          if (stripeSubscription.status === 'active') {
            status = 'active';
          } else if (stripeSubscription.status === 'trialing') {
            status = 'trialing';
          } else if (stripeSubscription.status === 'past_due') {
            status = 'past_due';
          } else if (stripeSubscription.status === 'canceled' || stripeSubscription.status === 'unpaid') {
            status = 'canceled';
          }
        } catch (stripeError) {
          this.logger.warn('Failed to retrieve Stripe subscription', {
            subscriptionId: brand.stripeSubscriptionId,
            userId,
            error: stripeError instanceof Error ? stripeError.message : String(stripeError),
          });
        }
      }

      // ✅ Définir les limites selon le plan (utiliser PlansService ou définir ici)
      const planLimitsMap: Record<string, {
        designsPerMonth: number | -1;
        teamMembers: number | -1;
        storageGB: number | -1;
        apiAccess: boolean;
        advancedAnalytics: boolean;
        prioritySupport: boolean;
        customExport: boolean;
        whiteLabel: boolean;
      }> = {
        starter: {
          designsPerMonth: 50,
          teamMembers: 3,
          storageGB: 5,
          apiAccess: false,
          advancedAnalytics: false,
          prioritySupport: false,
          customExport: false,
          whiteLabel: false,
        },
        professional: {
          designsPerMonth: 200,
          teamMembers: 10,
          storageGB: 25,
          apiAccess: true,
          advancedAnalytics: false,
          prioritySupport: true,
          customExport: false,
          whiteLabel: true,
        },
        business: {
          designsPerMonth: 1000,
          teamMembers: 50,
          storageGB: 100,
          apiAccess: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customExport: true,
          whiteLabel: true,
        },
        enterprise: {
          designsPerMonth: -1, // Illimité
          teamMembers: -1,
          storageGB: -1,
          apiAccess: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customExport: true,
          whiteLabel: true,
        },
      };

      const limits = planLimitsMap[plan] || planLimitsMap.starter;

      // ✅ Calculer l'usage actuel (simplifié - peut être amélioré avec UsageMeteringService)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [designsCount, teamMembersCount] = await Promise.all([
        this.prisma.design.count({
          where: {
            brandId: brand.id,
            createdAt: { gte: startOfMonth },
          },
        }),
        this.prisma.user.count({
          where: {
            brandId: brand.id,
          },
        }),
      ]);

      // TODO: Récupérer l'usage réel depuis UsageMeteringService
      const currentUsage = {
        designs: designsCount,
        renders2D: brand.monthlyGenerations || 0, // Approximation
        renders3D: 0, // TODO: Calculer depuis usage_tracking
        storageGB: 0, // TODO: Calculer depuis storage
        apiCalls: 0, // TODO: Calculer depuis usage_tracking
        teamMembers: teamMembersCount,
      };

      return {
        plan,
        status,
        limits,
        currentUsage,
        expiresAt: brand.planExpiresAt?.toISOString() || 
                   (stripeSubscription?.current_period_end 
                     ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
                     : undefined),
        stripeSubscriptionId: brand.stripeSubscriptionId || undefined,
      };
    } catch (error) {
      this.logger.error('Error getting subscription', error, { userId });
      throw new Error('Erreur lors de la récupération de l\'abonnement');
    }
  }

  async createCustomerPortalSession(userId: string) {
    try {
      const stripe = await this.getStripe();
      
      // Récupérer le customer_id depuis la base de données
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { brand: true },
      });

      if (!user?.brand?.stripeCustomerId) {
        throw new Error('Stripe customer ID not found');
      }
      
      const session = await stripe.billingPortal.sessions.create({
        customer: user.brand.stripeCustomerId,
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
