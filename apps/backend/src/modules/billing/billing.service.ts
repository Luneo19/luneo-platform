import { PLAN_CONFIGS, normalizePlanTier, PlanTier } from '@/libs/plans';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrencyUtils } from '@/config/currency.config';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import type Stripe from 'stripe';
import { StripeClientService } from './services/stripe-client.service';
import { StripeWebhookService } from './services/stripe-webhook.service';

/**
 * BillingService — Façade for all billing operations.
 *
 * Delegates Stripe SDK / resilience to StripeClientService,
 * and webhook processing to StripeWebhookService.
 * Keeps checkout, payment-method, subscription, and invoice logic.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private stripeClient: StripeClientService,
    private webhookService: StripeWebhookService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // Delegated accessors (backward-compatible public surface)
  // ──────────────────────────────────────────────────────────────

  /** Lazy-loaded Stripe SDK instance (delegated to StripeClientService) */
  async getStripe(): Promise<Stripe> {
    return this.stripeClient.getStripe();
  }

  /** Circuit-breaker status for monitoring */
  getStripeCircuitStatus() {
    return this.stripeClient.getCircuitStatus();
  }

  /** Execute Stripe operation with resilience (circuit breaker + retry) */
  private async executeWithResilience<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: { maxRetries?: number; skipCircuitBreaker?: boolean },
  ): Promise<T> {
    return this.stripeClient.executeWithResilience(operation, operationName, options);
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
    // ✅ Vérifier que Stripe est configuré
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';
    if (!this.stripeClient.stripeConfigValid && nodeEnv === 'production') {
      throw new ServiceUnavailableException('Stripe is not properly configured. Please contact support.');
    }

    // ✅ Validation des paramètres
    if (!planId || typeof planId !== 'string' || planId.trim().length === 0) {
      throw new BadRequestException('Plan ID is required');
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
      throw new BadRequestException('Valid user email is required');
    }

    const billingInterval = options?.billingInterval || 'monthly';

    // ✅ Utiliser les Price IDs validés en production, sinon fallback pour dev/test
    let planPriceIds: Record<string, { monthly: string | null; yearly: string | null }>;
    
    if (this.stripeClient.validatedPriceIds) {
      // En production: utiliser les IDs validés au démarrage
      planPriceIds = this.stripeClient.validatedPriceIds as unknown as Record<string, { monthly: string; yearly: string }>;
    } else {
      // En dev/test: utiliser les IDs de configuration avec fallbacks de test
      // NOTE: Les fallbacks sont uniquement pour le développement local
      planPriceIds = {
      starter: {
          monthly: this.configService.get<string>('stripe.priceStarterMonthly') || 'price_test_starter_monthly',
          yearly: this.configService.get<string>('stripe.priceStarterYearly') || 'price_test_starter_yearly',
      },
      professional: {
          monthly: this.configService.get<string>('stripe.priceProMonthly') || 'price_test_pro_monthly',
          yearly: this.configService.get<string>('stripe.priceProYearly') || 'price_test_pro_yearly',
      },
      business: {
          monthly: this.configService.get<string>('stripe.priceBusinessMonthly') || 'price_test_business_monthly',
          yearly: this.configService.get<string>('stripe.priceBusinessYearly') || 'price_test_business_yearly',
      },
      enterprise: {
          monthly: this.configService.get<string>('stripe.priceEnterpriseMonthly') || 'price_test_enterprise_monthly',
          yearly: this.configService.get<string>('stripe.priceEnterpriseYearly') || 'price_test_enterprise_yearly',
      },
    };
    }

    const priceId = billingInterval === 'yearly'
      ? planPriceIds[planId]?.yearly
      : planPriceIds[planId]?.monthly;

    if (!priceId) {
      throw new NotFoundException(`Plan ${planId} not found or not available for ${billingInterval} billing`);
    }

      // ✅ Construire les line items (plan + add-ons)
      const lineItems: Array<{ price: string; quantity: number }> = [
        {
          price: priceId,
          quantity: 1,
        },
      ];

      // ✅ Ajouter les add-ons si fournis (utilise les Price IDs Stripe dédiés)
      if (options?.addOns && options.addOns.length > 0) {
        const addonsConfig = this.configService.get<Record<string, any>>('stripe.addons') || {};
        const addonTypeMap: Record<string, string> = {
          'extra_designs': 'extraDesigns',
          'extra_storage': 'extraStorage',
          'extra_team_members': 'extraTeamMembers',
          'extra_api_calls': 'extraApiCalls',
          'extra_renders_3d': 'extraRenders3d',
        };

        for (const addon of options.addOns) {
          const configKey = addonTypeMap[addon.type];
          if (!configKey || !addonsConfig[configKey]) {
            this.logger.warn(`Unknown add-on type: ${addon.type}, skipping`);
            continue;
          }

          const addonPriceId = addonsConfig[configKey][billingInterval === 'yearly' ? 'yearly' : 'monthly'];
          if (addonPriceId) {
            lineItems.push({
              price: addonPriceId,
              quantity: addon.quantity || 1,
            });
            this.logger.log(`Add-on added to checkout: ${addon.type} x${addon.quantity} (${addonPriceId})`);
          } else {
            this.logger.warn(`No price ID found for add-on: ${addon.type} (${billingInterval})`);
          }
        }
      }

    try {
      // ✅ PHASE 2: Appel Stripe avec résilience (circuit breaker + retry)
      const session = await this.executeWithResilience(
        async () => {
          const stripe = await this.getStripe();
          return stripe.checkout.sessions.create({
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
            // BIL-10: Essai gratuit configurable par plan
        subscription_data: {
              trial_period_days: this.getTrialDaysForPlan(planId),
        },
      });
        },
        'stripe.checkout.sessions.create',
      );

      return {
        success: true,
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error('Erreur création session Stripe:', error);
      throw new InternalServerErrorException('Erreur lors de la création de la session de paiement');
    }
  }

  async getPaymentMethods(userId: string) {
      // Récupérer le brand de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { brand: true },
      });

      if (!user?.brand?.stripeCustomerId) {
        return { paymentMethods: [] };
      }

    try {
      // ✅ PHASE 2: Appel Stripe avec résilience
      const paymentMethods = await this.executeWithResilience(
        async () => {
      const stripe = await this.getStripe();
          return stripe.paymentMethods.list({
            customer: user.brand!.stripeCustomerId!,
        type: 'card',
      });
        },
        'stripe.paymentMethods.list',
      );

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
      throw new InternalServerErrorException('Erreur lors de la récupération des méthodes de paiement');
    }
  }

  async addPaymentMethod(userId: string, paymentMethodId: string, setAsDefault: boolean = false) {
      // Récupérer le brand de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { brand: true },
      });

      if (!user?.brand) {
      throw new NotFoundException('Brand not found for user');
      }

      let customerId = user.brand.stripeCustomerId;

    try {
      // Créer un customer Stripe si nécessaire
      if (!customerId) {
        // ✅ PHASE 2: Appel Stripe avec résilience
        const customer = await this.executeWithResilience(
          async () => {
        const stripe = await this.getStripe();
            return stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: user.id,
                brandId: user.brand!.id,
          },
        });
          },
          'stripe.customers.create',
        );

        customerId = customer.id;

        // Sauvegarder le customer ID
        await this.prisma.brand.update({
          where: { id: user.brand.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // ✅ PHASE 2: Attacher la méthode de paiement avec résilience
      await this.executeWithResilience(
        async () => {
      const stripe = await this.getStripe();
          return stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId!,
      });
        },
        'stripe.paymentMethods.attach',
      );

      // ✅ PHASE 2: Définir comme méthode par défaut si demandé
      if (setAsDefault) {
        await this.executeWithResilience(
          async () => {
            const stripe = await this.getStripe();
            return stripe.customers.update(customerId!, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
          },
          'stripe.customers.update',
        );
      }

      return {
        paymentMethod: {
          id: paymentMethodId,
          attached: true,
          setAsDefault,
        },
        message: 'Méthode de paiement ajoutée avec succès',
      };
    } catch (error: any) {
      this.logger.error('Error adding payment method', error, { userId, paymentMethodId });
      throw new InternalServerErrorException(`Erreur lors de l'ajout de la méthode de paiement: ${error.message}`);
    }
  }

  async removePaymentMethod(userId: string, paymentMethodId: string) {
    try {
      // ✅ PHASE 2: Détacher la méthode de paiement avec résilience
      await this.executeWithResilience(
        async () => {
      const stripe = await this.getStripe();
          return stripe.paymentMethods.detach(paymentMethodId);
        },
        'stripe.paymentMethods.detach',
      );

      return { message: 'Méthode de paiement supprimée avec succès' };
    } catch (error: any) {
      this.logger.error('Error removing payment method', error, { userId, paymentMethodId });
      throw new InternalServerErrorException(`Erreur lors de la suppression de la méthode de paiement: ${error.message}`);
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

      // Récupérer les factures depuis Stripe avec résilience
      const invoices = await this.executeWithResilience(
        async () => {
          const stripe = await this.getStripe();
          return stripe.invoices.list({
            customer: user.brand.stripeCustomerId,
            limit,
          });
        },
        'stripe.invoices.list',
      );

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
      throw new InternalServerErrorException('Erreur lors de la récupération des factures');
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

      // ✅ Limites selon le plan - Source: @/libs/plans (SINGLE SOURCE OF TRUTH)
      const planTier = normalizePlanTier(plan);
      const planConfig = PLAN_CONFIGS[planTier];
      const limits = planConfig.limits;

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

      // Usage reel depuis les tables de tracking
      const [renders3DCount, storageBytesResult, apiCallsResult] = await Promise.all([
        // Renders 3D: count from UsageRecord for current month
        this.prisma.usageRecord.aggregate({
          where: { brandId: brand.id, type: 'renders_3d', recordedAt: { gte: startOfMonth } },
          _sum: { count: true },
        }),
        // Storage: sum of asset file sizes for the brand
        this.prisma.assetFile.aggregate({
          where: { brandId: brand.id },
          _sum: { sizeBytes: true },
        }),
        // API calls: count from UsageRecord for current month
        this.prisma.usageRecord.aggregate({
          where: { brandId: brand.id, type: 'api_calls', recordedAt: { gte: startOfMonth } },
          _sum: { count: true },
        }),
      ]);

      const currentUsage = {
        designs: designsCount,
        renders2D: brand.monthlyGenerations || 0,
        renders3D: renders3DCount._sum.count || 0,
        storageGB: Math.round(((storageBytesResult._sum.sizeBytes || 0) / (1024 * 1024 * 1024)) * 100) / 100,
        apiCalls: apiCallsResult._sum.count || 0,
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
      throw new InternalServerErrorException('Erreur lors de la récupération de l\'abonnement');
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
        throw new NotFoundException('Stripe customer ID not found');
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
      throw new InternalServerErrorException('Erreur lors de la création de la session du portail client');
    }
  }

  /**
   * Change user's subscription plan with proration handling
   * 
   * BIL-UPGRADE: Gestion des upgrades avec prorata
   * - Upgrades: Appliquer immédiatement avec prorata
   * - Downgrades: Appliquer à la fin de la période courante
   * 
   * @param userId - ID de l'utilisateur
   * @param newPlanId - ID du nouveau plan (starter, professional, business, enterprise)
   * @param options - Options de changement de plan
   */
  async changePlan(
    userId: string,
    newPlanId: string,
    options: {
      billingInterval?: 'monthly' | 'yearly';
      immediateChange?: boolean; // Force immediate change even for downgrades
    } = {}
  ): Promise<{
    success: boolean;
    type: 'upgrade' | 'downgrade' | 'same';
    effectiveDate: Date;
    prorationAmount?: number;
    prorationAmountFormatted?: string;
    message: string;
    subscriptionId?: string;
    previousPlan?: string;
    newPlan?: string;
  }> {
    const { billingInterval = 'monthly', immediateChange = false } = options;
    
    this.logger.log('Processing plan change', { userId, newPlanId, billingInterval, immediateChange });
    
    const stripe = await this.getStripe();
    
    // 1. Récupérer l'utilisateur et son abonnement actuel
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { brand: true },
    });

    if (!user?.brand) {
      throw new NotFoundException('User brand not found');
    }

    const { brand } = user;
    
    if (!brand.stripeCustomerId || !brand.stripeSubscriptionId) {
      throw new BadRequestException('User does not have an active subscription. Please subscribe first.');
    }

    // 2. Récupérer l'abonnement Stripe actuel
    const currentSubscription = await stripe.subscriptions.retrieve(brand.stripeSubscriptionId);
    
    if (currentSubscription.status === 'canceled' || currentSubscription.status === 'incomplete_expired') {
      throw new BadRequestException('Cannot change plan for canceled subscription. Please create a new subscription.');
    }

    // 3. Déterminer le plan actuel et le nouveau plan
    const currentPriceId = currentSubscription.items.data[0]?.price.id;
    const currentPlanInfo = await this.getPlanFromPriceId(currentPriceId);
    
    // 4. Obtenir le nouveau Price ID depuis la configuration
    const newPriceId = this.getPriceIdForPlan(newPlanId, billingInterval);
    
    if (!newPriceId) {
      throw new BadRequestException(`Invalid plan ID or plan not configured: ${newPlanId}`);
    }

    // 5. Si le Price ID est le même, rien à faire
    if (currentPriceId === newPriceId) {
      return {
        success: true,
        type: 'same',
        effectiveDate: new Date(),
        message: 'You are already on this plan',
        subscriptionId: currentSubscription.id,
        previousPlan: currentPlanInfo.planName,
        newPlan: newPlanId,
      };
    }

    // 6. Récupérer les prix pour déterminer si c'est un upgrade ou downgrade
    const [currentPrice, newPrice] = await Promise.all([
      stripe.prices.retrieve(currentPriceId),
      stripe.prices.retrieve(newPriceId),
    ]);

    const currentAmount = currentPrice.unit_amount || 0;
    const newAmount = newPrice.unit_amount || 0;
    
    // Normaliser les montants si les intervalles sont différents
    const normalizedCurrentAmount = this.normalizeToMonthly(currentAmount, currentPrice.recurring?.interval);
    const normalizedNewAmount = this.normalizeToMonthly(newAmount, newPrice.recurring?.interval);
    
    const isUpgrade = normalizedNewAmount > normalizedCurrentAmount;
    const isDowngrade = normalizedNewAmount < normalizedCurrentAmount;

    // 7. Configurer les options de proration
    let prorationBehavior: 'create_prorations' | 'none' | 'always_invoice';
    let effectiveDate: Date;

    if (isUpgrade) {
      // Upgrade: Appliquer immédiatement avec prorata
      prorationBehavior = 'create_prorations';
      effectiveDate = new Date();
      this.logger.log(`Upgrade detected: ${currentPlanInfo.planName} -> ${newPlanId}, applying immediately with proration`);
    } else if (isDowngrade && !immediateChange) {
      // Downgrade: Appliquer à la fin de la période (sauf si forcé)
      prorationBehavior = 'none';
      effectiveDate = new Date(currentSubscription.current_period_end * 1000);
      this.logger.log(`Downgrade detected: ${currentPlanInfo.planName} -> ${newPlanId}, scheduled for ${effectiveDate.toISOString()}`);
    } else {
      // Downgrade immédiat forcé ou prix égal
      prorationBehavior = immediateChange ? 'create_prorations' : 'none';
      effectiveDate = immediateChange ? new Date() : new Date(currentSubscription.current_period_end * 1000);
    }

    // 8. Calculer le montant de prorata avant d'appliquer
    let prorationAmount = 0;
    let prorationAmountFormatted: string | undefined;
    
    if (prorationBehavior === 'create_prorations') {
      try {
        const preview = await stripe.invoices.retrieveUpcoming({
          customer: brand.stripeCustomerId,
          subscription: currentSubscription.id,
          subscription_items: [
            {
              id: currentSubscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          subscription_proration_behavior: 'create_prorations',
          subscription_proration_date: Math.floor(Date.now() / 1000),
        });
        
        // Le montant de prorata est la différence sur la facture preview
        const lines = preview.lines.data;
        prorationAmount = lines
          .filter(line => line.proration)
          .reduce((sum, line) => sum + (line.amount || 0), 0);
        
        prorationAmountFormatted = CurrencyUtils.formatCents(
          Math.abs(prorationAmount),
          preview.currency || CurrencyUtils.getDefaultCurrency()
        );
        
        this.logger.log(`Proration preview: ${prorationAmount} cents (${prorationAmountFormatted})`);
      } catch (previewError: any) {
        this.logger.warn(`Failed to preview proration: ${previewError.message}`);
        // Continue anyway, Stripe will handle the proration
      }
    }

    // 9. Mettre à jour l'abonnement Stripe
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: prorationBehavior,
        metadata: {
          ...currentSubscription.metadata,
          previousPlan: currentPlanInfo.planName,
          changeType: isUpgrade ? 'upgrade' : 'downgrade',
          changeDate: new Date().toISOString(),
        },
      };

      // Pour les downgrades non immédiats, programmer le changement à la fin de la période
      if (isDowngrade && !immediateChange) {
        // Utiliser la date de fin de période comme date de début du nouveau plan
        // Note: Stripe gérera automatiquement le changement à la fin de la période
        updateParams.proration_behavior = 'none';
        updateParams.billing_cycle_anchor = 'unchanged';
      }

      const updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.id,
        updateParams
      );

      // 10. Mettre à jour la base de données locale
      const planMapping: Record<string, string> = {
        'starter': 'STARTER',
        'professional': 'PROFESSIONAL',
        'business': 'BUSINESS',
        'enterprise': 'ENTERPRISE',
      };

      await this.prisma.brand.update({
        where: { id: brand.id },
        data: {
          plan: newPlanId,
          subscriptionPlan: (planMapping[newPlanId] || 'STARTER') as SubscriptionPlan,
          // Ne pas changer le status si c'est un downgrade programmé
          ...(isUpgrade ? { subscriptionStatus: 'ACTIVE' } : {}),
        },
      });

      // 11. Log the successful change
      this.logger.log('Plan change completed', {
        userId,
        previousPlan: currentPlanInfo.planName,
        newPlan: newPlanId,
        type: isUpgrade ? 'upgrade' : 'downgrade',
        effectiveDate: effectiveDate.toISOString(),
        prorationAmount,
        subscriptionId: updatedSubscription.id,
      });

      return {
        success: true,
        type: isUpgrade ? 'upgrade' : 'downgrade',
        effectiveDate,
        prorationAmount: Math.abs(prorationAmount),
        prorationAmountFormatted,
        message: isUpgrade
          ? `Successfully upgraded to ${newPlanId}. ${prorationAmountFormatted ? `You will be charged ${prorationAmountFormatted} for the prorated difference.` : ''}`
          : immediateChange
            ? `Successfully downgraded to ${newPlanId} immediately.`
            : `Your plan will be changed to ${newPlanId} on ${effectiveDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        subscriptionId: updatedSubscription.id,
        previousPlan: currentPlanInfo.planName,
        newPlan: newPlanId,
      };
    } catch (stripeError: any) {
      this.logger.error('Failed to change plan', {
        userId,
        newPlanId,
        error: stripeError.message,
      });
      throw new InternalServerErrorException(
        `Failed to change plan: ${stripeError.message}`
      );
    }
  }

  /**
   * Get plan information from Stripe Price ID
   */
  private async getPlanFromPriceId(priceId: string): Promise<{ planName: string; interval: string }> {
    // Mapper les Price IDs vers les noms de plans
    const priceIdMappings: Record<string, { planName: string; interval: string }> = {};
    
    // Construire le mapping depuis la configuration
    const plans = ['Starter', 'Professional', 'Business', 'Enterprise'];
    const intervals = ['Monthly', 'Yearly'];
    
    for (const plan of plans) {
      for (const interval of intervals) {
        const configKey = `stripe.price${plan}${interval}`;
        const configuredPriceId = this.configService.get<string>(configKey);
        if (configuredPriceId) {
          priceIdMappings[configuredPriceId] = {
            planName: plan.toLowerCase(),
            interval: interval.toLowerCase(),
          };
        }
      }
    }

    return priceIdMappings[priceId] || { planName: 'unknown', interval: 'monthly' };
  }

  /**
   * Get Stripe Price ID for a plan
   */
  private getPriceIdForPlan(planId: string, interval: 'monthly' | 'yearly'): string | null {
    const planCapitalized = planId.charAt(0).toUpperCase() + planId.slice(1).toLowerCase();
    const intervalCapitalized = interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase();
    
    const configKey = `stripe.price${planCapitalized}${intervalCapitalized}`;
    return this.configService.get<string>(configKey) || null;
  }

  /**
   * Normalize price to monthly equivalent for comparison
   */
  private normalizeToMonthly(amount: number, interval?: string | null): number {
    if (interval === 'year') {
      return Math.round(amount / 12);
    }
    return amount;
  }

  /**
   * Preview plan change without applying it
   * Useful for showing the user what they'll be charged
   */
  async previewPlanChange(
    userId: string,
    newPlanId: string,
    billingInterval: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{
    currentPlan: string;
    newPlan: string;
    type: 'upgrade' | 'downgrade' | 'same';
    currentPrice: number;
    newPrice: number;
    prorationAmount: number;
    prorationAmountFormatted: string;
    effectiveDate: Date;
    nextBillingDate: Date;
    currency: string;
  }> {
    const stripe = await this.getStripe();
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { brand: true },
    });

    if (!user?.brand?.stripeCustomerId || !user?.brand?.stripeSubscriptionId) {
      throw new BadRequestException('User does not have an active subscription');
    }

    const currentSubscription = await stripe.subscriptions.retrieve(user.brand.stripeSubscriptionId);
    const currentPriceId = currentSubscription.items.data[0]?.price.id;
    const currentPlanInfo = await this.getPlanFromPriceId(currentPriceId);
    
    const newPriceId = this.getPriceIdForPlan(newPlanId, billingInterval);
    
    if (!newPriceId) {
      throw new BadRequestException(`Invalid plan: ${newPlanId}`);
    }

    const [currentPrice, newPrice] = await Promise.all([
      stripe.prices.retrieve(currentPriceId),
      stripe.prices.retrieve(newPriceId),
    ]);

    const currentAmount = currentPrice.unit_amount || 0;
    const newAmount = newPrice.unit_amount || 0;
    const normalizedCurrent = this.normalizeToMonthly(currentAmount, currentPrice.recurring?.interval);
    const normalizedNew = this.normalizeToMonthly(newAmount, newPrice.recurring?.interval);
    
    const isUpgrade = normalizedNew > normalizedCurrent;
    const isDowngrade = normalizedNew < normalizedCurrent;
    const type = isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'same';

    // Preview proration
    let prorationAmount = 0;
    
    if (currentPriceId !== newPriceId) {
      try {
        const preview = await stripe.invoices.retrieveUpcoming({
          customer: user.brand.stripeCustomerId,
          subscription: currentSubscription.id,
          subscription_items: [
            {
              id: currentSubscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          subscription_proration_behavior: isUpgrade ? 'create_prorations' : 'none',
          subscription_proration_date: Math.floor(Date.now() / 1000),
        });
        
        prorationAmount = preview.lines.data
          .filter(line => line.proration)
          .reduce((sum, line) => sum + (line.amount || 0), 0);
      } catch (error: any) {
        this.logger.warn(`Preview failed: ${error.message}`);
      }
    }

    const currency = (currentPrice.currency || 'eur').toUpperCase();
    
    return {
      currentPlan: currentPlanInfo.planName,
      newPlan: newPlanId,
      type,
      currentPrice: currentAmount,
      newPrice: newAmount,
      prorationAmount: Math.abs(prorationAmount),
      prorationAmountFormatted: CurrencyUtils.formatCents(Math.abs(prorationAmount), currency),
      effectiveDate: isUpgrade ? new Date() : new Date(currentSubscription.current_period_end * 1000),
      nextBillingDate: new Date(currentSubscription.current_period_end * 1000),
      currency,
    };
  }

  /**
   * Check the impact of a downgrade on user data
   * Useful for warning users about what they'll lose
   * 
   * BIL-DOWNGRADE: Analyse d'impact avant downgrade
   */
  async checkDowngradeImpact(
    userId: string,
    newPlanId: string
  ): Promise<{
    hasImpact: boolean;
    impactedResources: Array<{
      resource: string;
      current: number;
      newLimit: number;
      excess: number;
      action: 'archived' | 'readonly' | 'deleted_warning';
      description: string;
    }>;
    lostFeatures: string[];
    recommendations: string[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { brand: true },
    });

    if (!user?.brand) {
      throw new NotFoundException('User brand not found');
    }

    // Limites par plan - Source: @/libs/plans (SINGLE SOURCE OF TRUTH)
    const getDowngradeLimits = (planId: string) => {
      const tier = normalizePlanTier(planId);
      const config = PLAN_CONFIGS[tier];
      const featureKeys: string[] = [];
      if (config.limits.apiAccess) featureKeys.push('api_access');
      if (config.limits.arEnabled) featureKeys.push('ar_enabled');
      if (config.limits.whiteLabel) featureKeys.push('white_label');
      if (config.limits.advancedAnalytics) featureKeys.push('advanced_analytics');
      if (config.limits.customExport) featureKeys.push('custom_export');
      if (config.limits.prioritySupport) featureKeys.push('priority_support');
      if (tier === PlanTier.ENTERPRISE) return { ...config.limits, products: config.limits.maxProducts, storage: config.limits.storageGB, features: ['all'] };
      return {
        designsPerMonth: config.limits.designsPerMonth,
        teamMembers: config.limits.teamMembers,
        products: config.limits.maxProducts,
        storage: config.limits.storageGB,
        features: featureKeys.length > 0 ? featureKeys : ['basic_analytics', 'email_support'],
      };
    };

    const newLimits = getDowngradeLimits(newPlanId);
    const impactedResources: Array<{
      resource: string;
      current: number;
      newLimit: number;
      excess: number;
      action: 'archived' | 'readonly' | 'deleted_warning';
      description: string;
    }> = [];

    // Vérifier les produits
    const productCount = await this.prisma.product.count({
      where: { brandId: user.brand.id, deletedAt: null },
    });
    
    if (newLimits.products !== -1 && productCount > newLimits.products) {
      impactedResources.push({
        resource: 'products',
        current: productCount,
        newLimit: newLimits.products,
        excess: productCount - newLimits.products,
        action: 'readonly',
        description: `${productCount - newLimits.products} produits passeront en lecture seule. Vous ne pourrez pas en créer de nouveaux.`,
      });
    }

    // Vérifier les membres d'équipe
    const teamCount = await this.prisma.user.count({
      where: { brandId: user.brand.id },
    });
    
    if (newLimits.teamMembers !== -1 && teamCount > newLimits.teamMembers) {
      impactedResources.push({
        resource: 'team_members',
        current: teamCount,
        newLimit: newLimits.teamMembers,
        excess: teamCount - newLimits.teamMembers,
        action: 'readonly',
        description: `${teamCount - newLimits.teamMembers} membre(s) d'équipe devront être retirés ou passés en lecture seule.`,
      });
    }

    // Vérifier les designs du mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const designsThisMonth = await this.prisma.design.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
    });
    
    if (newLimits.designsPerMonth !== -1 && designsThisMonth > newLimits.designsPerMonth) {
      impactedResources.push({
        resource: 'designs_monthly',
        current: designsThisMonth,
        newLimit: newLimits.designsPerMonth,
        excess: designsThisMonth - newLimits.designsPerMonth,
        action: 'readonly',
        description: `Vous avez déjà ${designsThisMonth} designs ce mois. Avec le nouveau plan, vous ne pourrez plus créer de designs jusqu'au mois prochain.`,
      });
    }

    // Déterminer les fonctionnalités perdues
    const currentPlanName = (user.brand.plan || user.brand.subscriptionPlan || 'starter').toLowerCase();
    const currentLimits = getDowngradeLimits(currentPlanName);
    
    const lostFeatures = currentLimits.features.filter(
      f => f !== 'all' && !newLimits.features.includes(f) && !newLimits.features.includes('all')
    );

    const featureDescriptions: Record<string, string> = {
      api_access: 'Accès API',
      ar_enabled: 'Réalité augmentée',
      white_label: 'White label (marque blanche)',
      advanced_analytics: 'Analytics avancés',
      custom_export: 'Export personnalisé',
      priority_support: 'Support prioritaire',
    };

    const lostFeatureDescriptions = lostFeatures.map(f => featureDescriptions[f] || f);

    // Générer des recommandations
    const recommendations: string[] = [];
    
    if (impactedResources.length > 0) {
      recommendations.push('Archivez ou supprimez les ressources excédentaires avant le downgrade pour éviter toute perte de données.');
    }
    
    if (lostFeatures.includes('api_access')) {
      recommendations.push('Vérifiez que vous n\'avez pas d\'intégrations API actives qui seraient désactivées.');
    }
    
    if (lostFeatures.includes('white_label')) {
      recommendations.push('Votre branding personnalisé sera désactivé et remplacé par le branding Luneo.');
    }

    if (impactedResources.some(r => r.resource === 'team_members')) {
      recommendations.push('Informez les membres de votre équipe qui pourraient perdre leur accès.');
    }

    return {
      hasImpact: impactedResources.length > 0 || lostFeatures.length > 0,
      impactedResources,
      lostFeatures: lostFeatureDescriptions,
      recommendations,
    };
  }

  /**
   * Cancel a scheduled downgrade (keep current plan)
   * 
   * BIL-DOWNGRADE: Annuler un downgrade programmé
   */
  async cancelScheduledDowngrade(userId: string): Promise<{
    success: boolean;
    message: string;
    currentPlan?: string;
  }> {
    const stripe = await this.getStripe();
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { brand: true },
    });

    if (!user?.brand?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(user.brand.stripeSubscriptionId);
      
      // Vérifier s'il y a un changement de prix programmé via schedule
      if (subscription.schedule) {
        // Annuler le schedule et garder l'abonnement actuel
        await stripe.subscriptionSchedules.cancel(subscription.schedule as string);
        
        this.logger.log('Cancelled scheduled downgrade', { userId, subscriptionId: subscription.id });
        
        return {
          success: true,
          message: 'Le downgrade programmé a été annulé. Vous conservez votre plan actuel.',
          currentPlan: user.brand.plan || 'unknown',
        };
      }

      // Vérifier s'il y a cancel_at_period_end configuré (ancienne méthode)
      if (subscription.cancel_at_period_end) {
        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: false,
        });

        this.logger.log('Removed cancel_at_period_end flag', { userId, subscriptionId: subscription.id });
        
        return {
          success: true,
          message: 'L\'annulation programmée a été annulée. Votre abonnement continuera.',
          currentPlan: user.brand.plan || 'unknown',
        };
      }

      // Vérifier si le metadata contient une info de downgrade
      if (subscription.metadata?.pendingDowngradeTo) {
        // Nettoyer le metadata
        await stripe.subscriptions.update(subscription.id, {
          metadata: {
            ...subscription.metadata,
            pendingDowngradeTo: null,
            pendingDowngradeDate: null,
          },
        });

        return {
          success: true,
          message: 'Le downgrade programmé a été annulé.',
          currentPlan: user.brand.plan || 'unknown',
        };
      }

      return {
        success: false,
        message: 'Aucun downgrade programmé trouvé pour cet abonnement.',
        currentPlan: user.brand.plan || 'unknown',
      };
    } catch (error: any) {
      this.logger.error('Failed to cancel scheduled downgrade', { userId, error: error.message });
      throw new InternalServerErrorException(`Failed to cancel downgrade: ${error.message}`);
    }
  }

  /**
   * Cancel subscription (immediate or at period end)
   * 
   * BIL-CANCEL: Annulation d'abonnement
   * @param userId - ID de l'utilisateur
   * @param immediate - Si true, annulation immédiate. Si false (défaut), annulation à la fin de la période
   */
  async cancelSubscription(userId: string, immediate: boolean = false): Promise<{
    success: boolean;
    message: string;
    cancelAt?: Date;
  }> {
    const stripe = await this.getStripe();
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { brand: true },
    });

    if (!user?.brand?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    try {
      let subscription: Stripe.Subscription;
      
      if (immediate) {
        // Annulation immédiate - l'accès est coupé tout de suite
        subscription = await stripe.subscriptions.cancel(user.brand.stripeSubscriptionId);
        
        await this.prisma.brand.update({
          where: { id: user.brand.id },
          data: {
            subscriptionStatus: 'CANCELED',
            plan: 'free',
          },
        });

        this.logger.log(`Subscription cancelled immediately for user ${userId}`);
        
        return {
          success: true,
          message: 'Votre abonnement a été annulé immédiatement. Vous avez été basculé sur le plan gratuit.',
        };
      } else {
        // Annulation à la fin de la période de facturation
        subscription = await stripe.subscriptions.update(user.brand.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        const cancelAt = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : undefined;

        this.logger.log(`Subscription set to cancel at period end for user ${userId}`, { cancelAt });
        
        return {
          success: true,
          message: `Votre abonnement sera annulé à la fin de la période de facturation${cancelAt ? ` (${cancelAt.toLocaleDateString('fr-FR')})` : ''}. Vous conservez l'accès jusque-là.`,
          cancelAt,
        };
      }
    } catch (error: any) {
      this.logger.error(`Failed to cancel subscription for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Get any scheduled plan changes
   * 
   * BIL-DOWNGRADE: Voir les changements programmés
   */
  async getScheduledPlanChanges(userId: string): Promise<{
    hasScheduledChanges: boolean;
    scheduledChanges?: {
      type: 'downgrade' | 'cancel';
      newPlan?: string;
      effectiveDate: Date;
      reason?: string;
    };
    currentPlan: string;
    currentStatus: string;
  }> {
    const stripe = await this.getStripe();
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { brand: true },
    });

    if (!user?.brand) {
      throw new NotFoundException('User brand not found');
    }

    const currentPlan = (user.brand.plan || user.brand.subscriptionPlan || 'starter').toLowerCase();
    const currentStatus = user.brand.subscriptionStatus || 'unknown';

    if (!user.brand.stripeSubscriptionId) {
      return {
        hasScheduledChanges: false,
        currentPlan,
        currentStatus,
      };
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(user.brand.stripeSubscriptionId);

      // Vérifier cancel_at_period_end
      if (subscription.cancel_at_period_end) {
        return {
          hasScheduledChanges: true,
          scheduledChanges: {
            type: 'cancel',
            effectiveDate: new Date(subscription.current_period_end * 1000),
            reason: 'Subscription scheduled for cancellation',
          },
          currentPlan,
          currentStatus,
        };
      }

      // Vérifier subscription schedule
      if (subscription.schedule) {
        const schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule as string);
        
        // Trouver les phases futures
        const futurePhases = schedule.phases?.filter(
          phase => phase.start_date && phase.start_date > Math.floor(Date.now() / 1000)
        );

        if (futurePhases && futurePhases.length > 0) {
          const nextPhase = futurePhases[0];
          const nextPriceId = nextPhase.items?.[0]?.price as string;
          const nextPlanInfo = await this.getPlanFromPriceId(nextPriceId);

          return {
            hasScheduledChanges: true,
            scheduledChanges: {
              type: 'downgrade',
              newPlan: nextPlanInfo.planName,
              effectiveDate: new Date((nextPhase.start_date || 0) * 1000),
            },
            currentPlan,
            currentStatus,
          };
        }
      }

      // Vérifier metadata pour les downgrades legacy
      if (subscription.metadata?.pendingDowngradeTo) {
        return {
          hasScheduledChanges: true,
          scheduledChanges: {
            type: 'downgrade',
            newPlan: subscription.metadata.pendingDowngradeTo,
            effectiveDate: subscription.metadata.pendingDowngradeDate 
              ? new Date(subscription.metadata.pendingDowngradeDate)
              : new Date(subscription.current_period_end * 1000),
          },
          currentPlan,
          currentStatus,
        };
      }

      return {
        hasScheduledChanges: false,
        currentPlan,
        currentStatus,
      };
    } catch (error: any) {
      this.logger.warn('Failed to check scheduled changes', { userId, error: error.message });
      return {
        hasScheduledChanges: false,
        currentPlan,
        currentStatus,
      };
    }
  }

  /**
   * Handle Stripe webhook events with idempotency protection
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<{ processed: boolean; result?: Record<string, unknown> }> {
    return this.webhookService.handleStripeWebhook(event);
  }

  // NOTE: All webhook handling methods have been extracted to StripeWebhookService.
  // See: apps/backend/src/modules/billing/services/stripe-webhook.service.ts

  /**
   * BIL-10: Get trial period days for a specific plan
   * Each plan can have a different trial period
   */
  private getTrialDaysForPlan(planId: string): number {
    const defaultTrialDays = this.configService.get<number>('stripe.trialPeriodDays') || 14;
    const trialDaysByPlan: Record<string, number> = {
      starter: 14,
      professional: 14,
      business: 14,
      enterprise: 30,
    };
    const envKey = `STRIPE_TRIAL_DAYS_${planId.toUpperCase()}`;
    const envTrialDays = process.env[envKey];
    if (envTrialDays) {
      const parsed = parseInt(envTrialDays, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return trialDaysByPlan[planId.toLowerCase()] ?? defaultTrialDays;
  }

  /**
   * Synchronise le statut d'abonnement avec Stripe
   * Utile pour corriger les incohérences
   */
  async syncSubscriptionStatus(brandId: string): Promise<{ synced: boolean; status?: string }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand?.stripeSubscriptionId) {
      return { synced: false };
    }

    try {
      const stripe = await this.getStripe();
      const subscription = await stripe.subscriptions.retrieve(brand.stripeSubscriptionId);

      // Map Stripe status to our status
      const statusMap: Record<string, string> = {
        active: 'ACTIVE',
        trialing: 'TRIALING',
        past_due: 'PAST_DUE',
        canceled: 'CANCELED',
        unpaid: 'PAST_DUE',
        incomplete: 'PAST_DUE',
        incomplete_expired: 'CANCELED',
        paused: 'PAST_DUE',
      };

      const newStatus = statusMap[subscription.status] || 'ACTIVE';

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          subscriptionStatus: newStatus as SubscriptionStatus,
        },
      });

      this.logger.log(`Synced subscription status for brand ${brandId}: ${newStatus}`);

      return { synced: true, status: newStatus };
    } catch (error) {
      this.logger.error(`Failed to sync subscription status for brand ${brandId}`, error);
      return { synced: false };
    }
  }
}
