import { CreditsService } from '@/libs/credits/credits.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CircuitBreakerService } from '@/libs/resilience/circuit-breaker.service';
import { RetryService } from '@/libs/resilience/retry.service';
import { CurrencyUtils } from '@/config/currency.config';
import { EmailService } from '@/modules/email/email.service';
import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';

// Map des Price IDs validés au démarrage
interface ValidatedPriceIds {
  starter: { monthly: string; yearly: string };
  professional: { monthly: string; yearly: string };
  business: { monthly: string; yearly: string };
  enterprise: { monthly: string; yearly: string };
}

// Nom du service pour le circuit breaker
const STRIPE_SERVICE = 'stripe-api';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);
  private stripeInstance: Stripe | null = null;
  private stripeModule: typeof import('stripe') | null = null;
  private validatedPriceIds: ValidatedPriceIds | null = null;
  private stripeConfigValid = false;

  constructor(
    private configService: ConfigService,
    private creditsService: CreditsService,
    private prisma: PrismaService,
    private circuitBreaker: CircuitBreakerService,
    private retryService: RetryService,
    private emailService: EmailService,
  ) {
    // Configurer le circuit breaker pour Stripe
    this.circuitBreaker.configure(STRIPE_SERVICE, {
      failureThreshold: 5,      // 5 échecs avant ouverture
      recoveryTimeout: 30000,   // 30 secondes avant test
      monitoringWindow: 60000,  // 1 minute
      halfOpenMaxCalls: 3,      // 3 appels test
    });
  }

  /**
   * Valide la configuration Stripe au démarrage
   * HOTFIX-004: Validation obligatoire des Price IDs
   */
  async onModuleInit() {
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';
    
    this.logger.log('🔧 Validating Stripe configuration...');
    
    try {
      // Vérifier que STRIPE_SECRET_KEY est configuré
      const secretKey = this.configService.get<string>('stripe.secretKey');
        if (!secretKey) {
          if (nodeEnv === 'production') {
            this.logger.error('❌ STRIPE_SECRET_KEY is required in production');
            throw new InternalServerErrorException('STRIPE_SECRET_KEY is required');
          }
        this.logger.warn('⚠️ STRIPE_SECRET_KEY not configured - Stripe features disabled');
        return;
      }

      // Récupérer les Price IDs depuis la configuration
      const priceIds = {
        starter: {
          monthly: this.configService.get<string>('stripe.priceStarterMonthly'),
          yearly: this.configService.get<string>('stripe.priceStarterYearly'),
        },
        professional: {
          monthly: this.configService.get<string>('stripe.priceProMonthly'),
          yearly: this.configService.get<string>('stripe.priceProYearly'),
        },
        business: {
          monthly: this.configService.get<string>('stripe.priceBusinessMonthly'),
          yearly: this.configService.get<string>('stripe.priceBusinessYearly'),
        },
        enterprise: {
          monthly: this.configService.get<string>('stripe.priceEnterpriseMonthly'),
          yearly: this.configService.get<string>('stripe.priceEnterpriseYearly'),
        },
      };

      // Vérifier que tous les Price IDs sont configurés
      const missingIds: string[] = [];
      for (const [plan, intervals] of Object.entries(priceIds)) {
        if (!intervals.monthly) missingIds.push(`stripe.price${plan.charAt(0).toUpperCase() + plan.slice(1)}Monthly`);
        if (!intervals.yearly) missingIds.push(`stripe.price${plan.charAt(0).toUpperCase() + plan.slice(1)}Yearly`);
      }

      if (missingIds.length > 0) {
        if (nodeEnv === 'production') {
          this.logger.error(`❌ Missing Stripe Price IDs: ${missingIds.join(', ')}`);
          throw new InternalServerErrorException(`Missing Stripe Price IDs: ${missingIds.join(', ')}`);
        }
        this.logger.warn(`⚠️ Missing Stripe Price IDs (using test fallbacks): ${missingIds.join(', ')}`);
      }

      // En production, valider que les Price IDs existent dans Stripe
      if (nodeEnv === 'production') {
        try {
          const stripe = await this.getStripe();
          
          for (const [plan, intervals] of Object.entries(priceIds)) {
            for (const [interval, priceId] of Object.entries(intervals)) {
              if (priceId) {
                try {
                  const price = await stripe.prices.retrieve(priceId);
                  if (!price.active) {
                    this.logger.warn(`⚠️ Stripe Price ID ${priceId} (${plan}/${interval}) is inactive`);
                  }
                  this.logger.debug(`✓ Validated ${plan}/${interval}: ${priceId}`);
                } catch (error: any) {
                  this.logger.error(`❌ Invalid Stripe Price ID: ${priceId} (${plan}/${interval}) - ${error.message}`);
                  // Continue validation, don't throw - allows app to start in degraded mode
                  this.stripeConfigValid = false;
                }
              }
            }
          }
          
          if (this.stripeConfigValid !== false) {
            this.validatedPriceIds = priceIds as ValidatedPriceIds;
            this.logger.log('✅ All Stripe Price IDs validated successfully');
            this.stripeConfigValid = true;
          } else {
            this.logger.warn('⚠️ Stripe validation failed - billing features will be unavailable');
          }
        } catch (stripeError: any) {
          this.logger.error(`❌ Stripe API error during validation: ${stripeError.message}`);
          this.logger.warn('⚠️ App starting in degraded mode - billing features unavailable');
          this.stripeConfigValid = false;
        }
      } else {
        this.stripeConfigValid = true;
        this.logger.log('✅ Stripe configuration validated (non-production mode)');
      }
    } catch (error: any) {
      this.logger.error(`❌ Stripe configuration validation failed: ${error.message}`);
      this.logger.warn('⚠️ App starting in degraded mode - billing features unavailable');
      this.stripeConfigValid = false;
    }
  }

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
        throw new InternalServerErrorException('STRIPE_SECRET_KEY is not configured');
      }
      this.stripeInstance = new this.stripeModule.default(secretKey, {
        apiVersion: '2023-10-16',
      });
    }
    return this.stripeInstance;
  }

  /**
   * Exécute une opération Stripe avec résilience (circuit breaker + retry)
   * PHASE 2: Protection des appels API externes
   */
  private async executeWithResilience<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: {
      maxRetries?: number;
      skipCircuitBreaker?: boolean;
    },
  ): Promise<T> {
    const executeWithRetry = () =>
      this.retryService.execute(
        operation,
        {
          maxAttempts: options?.maxRetries ?? 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          exponentialBackoff: true,
          retryableErrors: RetryService.isRetryableStripeError,
        },
        operationName,
      );

    if (options?.skipCircuitBreaker) {
      return executeWithRetry();
    }

    return this.circuitBreaker.execute(
      STRIPE_SERVICE,
      executeWithRetry,
      // Fallback: log et rethrow (pas de fallback silencieux pour Stripe)
      undefined,
    );
  }

  /**
   * Retourne le statut du circuit breaker Stripe (pour monitoring)
   */
  getStripeCircuitStatus() {
    return this.circuitBreaker.getStatus(STRIPE_SERVICE);
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
    if (!this.stripeConfigValid && nodeEnv === 'production') {
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
    
    if (this.validatedPriceIds) {
      // En production: utiliser les IDs validés au démarrage
      planPriceIds = this.validatedPriceIds as unknown as Record<string, { monthly: string; yearly: string }>;
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

      // ✅ Ajouter les add-ons si fournis
      // Note: Pour les add-ons, on peut soit créer des Price IDs Stripe dédiés,
      // soit utiliser des line items avec prix personnalisés
      // Pour l'instant, on utilise des line items avec prix personnalisés
      if (options?.addOns && options.addOns.length > 0) {
        // TODO: Créer des Price IDs Stripe pour chaque add-on et les utiliser ici
        // Pour l'instant, on stocke les add-ons dans metadata et on les facturera séparément
        this.logger.log(`Add-ons requested: ${JSON.stringify(options.addOns)}`);
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
          subscriptionPlan: (planMapping[newPlanId] || 'STARTER') as any,
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

    // Définir les limites par plan
    const planLimits: Record<string, { 
      designsPerMonth: number; 
      teamMembers: number; 
      products: number; 
      storage: number;
      features: string[];
    }> = {
      starter: { 
        designsPerMonth: 50, 
        teamMembers: 3, 
        products: 10, 
        storage: 5,
        features: ['basic_analytics', 'email_support'],
      },
      professional: { 
        designsPerMonth: 200, 
        teamMembers: 10, 
        products: 50, 
        storage: 25,
        features: ['api_access', 'ar_enabled', 'white_label', 'priority_support'],
      },
      business: { 
        designsPerMonth: 1000, 
        teamMembers: 50, 
        products: 500, 
        storage: 100,
        features: ['advanced_analytics', 'custom_export', 'api_access', 'ar_enabled', 'white_label', 'priority_support'],
      },
      enterprise: { 
        designsPerMonth: -1, 
        teamMembers: -1, 
        products: -1, 
        storage: -1,
        features: ['all'],
      },
    };

    const newLimits = planLimits[newPlanId] || planLimits.starter;
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
    const currentLimits = planLimits[currentPlanName] || planLimits.starter;
    
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
  async handleStripeWebhook(event: Stripe.Event): Promise<{ processed: boolean; result?: any }> {
    this.logger.log(`Processing Stripe webhook: ${event.type}`, { eventId: event.id });

    // BIL-07: Vérifier l'idempotence via la table ProcessedWebhookEvent
    try {
      const existingEvent = await this.prisma.processedWebhookEvent.findUnique({
        where: { eventId: event.id },
      });

      if (existingEvent?.processed) {
        this.logger.debug(`Webhook event already processed: ${event.id}`);
        return { processed: true, result: existingEvent.result as any };
      }

      // Enregistrer l'événement comme en cours de traitement
      await this.prisma.processedWebhookEvent.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          eventType: event.type,
          processed: false,
          attempts: 1,
        },
        update: {
          attempts: { increment: 1 },
        },
      });
    } catch (error: any) {
      this.logger.warn(`Failed to check/create webhook event record: ${error.message}`);
      // Continue anyway - better to risk duplicate than to miss event
    }

    try {
      let result: { processed: boolean; result?: any };

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

        default:
          this.logger.debug(`Unhandled Stripe webhook event type: ${event.type}`, { eventId: event.id });
          result = { processed: false };
      }

      // Marquer l'événement comme traité
      try {
        await this.prisma.processedWebhookEvent.update({
          where: { eventId: event.id },
          data: {
            processed: true,
            result: result.result ? result.result : undefined,
            processedAt: new Date(),
          },
        });
      } catch (error: any) {
        this.logger.warn(`Failed to mark webhook event as processed: ${error.message}`);
      }

      return result;
    } catch (error: any) {
      // Enregistrer l'erreur
      try {
        await this.prisma.processedWebhookEvent.update({
          where: { eventId: event.id },
          data: {
            error: error.message,
          },
        });
      } catch (updateError: any) {
        this.logger.warn(`Failed to update webhook event error: ${updateError.message}`);
      }

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
  /**
   * Mappe le statut Stripe vers le statut de l'application
   * BIL-05: Synchronisation statuts subscription DB↔Stripe
   */
  private mapStripeStatusToAppStatus(stripeStatus: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' {
    switch (stripeStatus) {
      case 'trialing':
        return 'TRIALING';
      case 'active':
        return 'ACTIVE';
      case 'past_due':
      case 'unpaid':
        return 'PAST_DUE';
      case 'canceled':
      case 'incomplete_expired':
        return 'CANCELED';
      case 'incomplete':
      case 'paused':
        // incomplete et paused sont traités comme PAST_DUE pour bloquer l'accès
        return 'PAST_DUE';
      default:
        this.logger.warn(`Unknown Stripe subscription status: ${stripeStatus}, defaulting to ACTIVE`);
        return 'ACTIVE';
    }
  }

  /**
   * BIL-10: Get trial period days for a specific plan
   * Each plan can have a different trial period
   */
  private getTrialDaysForPlan(planId: string): number {
    // Configuration par défaut depuis l'environnement
    const defaultTrialDays = this.configService.get<number>('stripe.trialPeriodDays') || 14;
    
    // Trial configurable par plan
    const trialDaysByPlan: Record<string, number> = {
      starter: 14,           // Plan starter: 14 jours d'essai
      professional: 14,      // Plan pro: 14 jours d'essai
      business: 14,          // Plan business: 14 jours d'essai
      enterprise: 30,        // Plan enterprise: 30 jours d'essai (VIP)
    };
    
    // Permettre la surcharge via variables d'environnement
    const envKey = `STRIPE_TRIAL_DAYS_${planId.toUpperCase()}`;
    const envTrialDays = process.env[envKey];
    if (envTrialDays) {
      const parsed = parseInt(envTrialDays, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    
    return trialDaysByPlan[planId.toLowerCase()] ?? defaultTrialDays;
  }

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
      include: { users: true },
    });

    if (brand) {
      // BIL-05: Mapper et synchroniser le statut
      const appStatus = this.mapStripeStatusToAppStatus(subscription.status);
      const previousStatus = brand.subscriptionStatus;
      
      // Dates importantes de la subscription
      const currentPeriodEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : null;
      const trialEnd = subscription.trial_end 
        ? new Date(subscription.trial_end * 1000) 
        : null;

      await this.prisma.brand.update({
        where: { id: brand.id },
        data: {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: appStatus,
          plan: subscription.items.data[0]?.price?.nickname || brand.plan || 'professional',
          planExpiresAt: currentPeriodEnd,
          trialEndsAt: trialEnd,
        },
      });

      // Log le changement de statut
      if (previousStatus !== appStatus) {
        this.logger.log(`Subscription status changed for brand ${brand.id}: ${previousStatus} -> ${appStatus}`);
        
        // Notifier en cas de dégradation du statut
        if (appStatus === 'PAST_DUE' || appStatus === 'CANCELED') {
          const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
          if (owner?.email) {
            try {
              await this.emailService.sendEmail({
                to: owner.email,
                subject: appStatus === 'PAST_DUE' 
                  ? 'Action requise : Problème avec votre abonnement Luneo'
                  : 'Votre abonnement Luneo a été annulé',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">${appStatus === 'PAST_DUE' ? 'Paiement en attente' : 'Abonnement annulé'}</h1>
                    <p>Bonjour ${owner.firstName || ''},</p>
                    ${appStatus === 'PAST_DUE' 
                      ? `<p>Nous n'avons pas pu traiter votre dernier paiement. Veuillez mettre à jour vos informations de paiement pour continuer à utiliser Luneo.</p>`
                      : `<p>Votre abonnement Luneo a été annulé. Vous pouvez vous réabonner à tout moment.</p>`
                    }
                    <div style="margin: 30px 0;">
                      <a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" 
                         style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        ${appStatus === 'PAST_DUE' ? 'Mettre à jour le paiement' : 'Se réabonner'}
                      </a>
                    </div>
                    <p>L'équipe Luneo</p>
                  </div>
                `,
              });
            } catch (emailError: any) {
              this.logger.warn(`Failed to send subscription status email: ${emailError.message}`);
            }
          }
        }
      }

      return {
        processed: true,
        result: {
          type: 'subscription_updated',
          brandId: brand.id,
          subscriptionId: subscription.id,
          previousStatus,
          newStatus: appStatus,
          stripeStatus: subscription.status,
        },
      };
    }

    return { processed: false };
  }

  /**
   * Handle subscription.deleted event
   * BIL-05: Synchronisation complète lors de la suppression
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    
    this.logger.log('Processing subscription deletion', {
      subscriptionId: subscription.id,
      customerId,
    });

    const brand = await this.prisma.brand.findFirst({
      where: { stripeCustomerId: customerId },
      include: { users: true },
    });

    if (brand) {
      await this.prisma.brand.update({
        where: { id: brand.id },
        data: {
          plan: 'starter', // Revenir au plan gratuit
          subscriptionStatus: 'CANCELED',
          stripeSubscriptionId: null, // Supprimer la référence
          planExpiresAt: null,
        },
      });

      // Notifier l'utilisateur
      const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
      if (owner?.email) {
        try {
          await this.emailService.sendEmail({
            to: owner.email,
            subject: 'Votre abonnement Luneo a pris fin',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Abonnement terminé</h1>
                <p>Bonjour ${owner.firstName || ''},</p>
                <p>Votre abonnement Luneo a pris fin. Vous êtes maintenant sur le plan Starter (gratuit).</p>
                <p>Certaines fonctionnalités ne sont plus accessibles avec ce plan.</p>
                <div style="margin: 30px 0;">
                  <a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" 
                     style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Voir les offres
                  </a>
                </div>
                <p>L'équipe Luneo</p>
              </div>
            `,
          });
        } catch (emailError: any) {
          this.logger.warn(`Failed to send subscription deleted email: ${emailError.message}`);
        }
      }

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
  /**
   * Handle invoice.payment_failed event
   * BIL-06: Notification d'échec de paiement
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    
    this.logger.warn('Processing invoice payment failed', {
      invoiceId: invoice.id,
      customerId,
    });

    let emailSent = false;

    // Trouver le brand et mettre à jour le statut
    if (customerId) {
      const brand = await this.prisma.brand.findFirst({
        where: { stripeCustomerId: customerId },
        include: { users: true },
      });

      if (brand) {
        // Mettre à jour le statut de l'abonnement
        await this.prisma.brand.update({
          where: { id: brand.id },
          data: {
            subscriptionStatus: 'PAST_DUE',
          },
        });

        // BIL-06: Envoyer un email de notification d'échec de paiement
        const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
        if (owner?.email) {
          const amountDue = CurrencyUtils.formatCents(invoice.amount_due || 0, invoice.currency || CurrencyUtils.getDefaultCurrency());
          const currency = CurrencyUtils.normalize(invoice.currency || CurrencyUtils.getDefaultCurrency());
          const attemptCount = invoice.attempt_count || 1;
          const nextAttempt = invoice.next_payment_attempt 
            ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : null;

          try {
            await this.emailService.sendEmail({
              to: owner.email,
              subject: `⚠️ Échec de paiement - Action requise pour votre compte Luneo`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #dc2626;">Échec de paiement</h1>
                  <p>Bonjour ${owner.firstName || ''},</p>
                  <p>Nous n'avons pas pu traiter votre paiement de <strong>${amountDue}</strong>.</p>
                  
                  <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #dc2626;">
                      <strong>Tentative ${attemptCount}</strong> - 
                      ${nextAttempt 
                        ? `Prochaine tentative automatique le ${nextAttempt}`
                        : 'Aucune tentative automatique prévue'
                      }
                    </p>
                  </div>

                  <p><strong>Que faire ?</strong></p>
                  <ul>
                    <li>Vérifiez que votre carte est valide et dispose de fonds suffisants</li>
                    <li>Mettez à jour vos informations de paiement si nécessaire</li>
                    <li>Contactez votre banque si le problème persiste</li>
                  </ul>

                  <div style="margin: 30px 0;">
                    <a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" 
                       style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                      Mettre à jour mes informations de paiement
                    </a>
                  </div>

                  <p style="color: #666; font-size: 14px;">
                    Sans action de votre part, votre accès aux fonctionnalités premium sera suspendu.
                  </p>

                  <p>L'équipe Luneo</p>
                </div>
              `,
            });
            emailSent = true;
            this.logger.log(`Payment failure notification sent to ${owner.email}`);
          } catch (emailError: any) {
            this.logger.warn(`Failed to send payment failure email: ${emailError.message}`);
          }
        }

        this.logger.warn(`Brand ${brand.id} subscription marked as PAST_DUE due to payment failure`);
      }
    }

    return {
      processed: true,
      result: {
        type: 'invoice_payment_failed',
        invoiceId: invoice.id,
        customerId,
        emailSent,
      },
    };
  }

  /**
   * Handle customer.subscription.trial_will_end event
   * Triggered 3 days before trial ends
   */
  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    
    this.logger.log('Processing trial_will_end', {
      subscriptionId: subscription.id,
      customerId,
      trialEnd: subscription.trial_end,
    });

    const brand = await this.prisma.brand.findFirst({
      where: { stripeCustomerId: customerId },
      include: { users: true },
    });

    if (brand) {
      const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
      
      // Mettre à jour la date de fin d'essai
      await this.prisma.brand.update({
        where: { id: brand.id },
        data: {
          trialEndsAt: trialEndDate,
        },
      });

      // BIL-02: Envoyer un email de rappel de fin d'essai
      const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
      if (owner?.email) {
        const daysLeft = trialEndDate 
          ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
          : 0;
        const formattedDate = trialEndDate?.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        try {
          await this.emailService.sendEmail({
            to: owner.email,
            subject: `Votre période d'essai se termine dans ${daysLeft} jours`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Votre période d'essai touche à sa fin</h1>
                <p>Bonjour ${owner.firstName || ''},</p>
                <p>Votre période d'essai gratuite de Luneo se terminera le <strong>${formattedDate}</strong>.</p>
                <p>Pour continuer à profiter de toutes les fonctionnalités, vous pouvez passer à un abonnement payant dès maintenant.</p>
                <div style="margin: 30px 0;">
                  <a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" 
                     style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Voir les offres
                  </a>
                </div>
                <p style="color: #666;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                <p>L'équipe Luneo</p>
              </div>
            `,
          });
          this.logger.log(`Trial reminder email sent to ${owner.email}`);
        } catch (emailError: any) {
          this.logger.warn(`Failed to send trial reminder email: ${emailError.message}`);
          // Ne pas faire échouer le webhook si l'email échoue
        }
      }

      this.logger.log(`Trial will end for brand ${brand.id} on ${trialEndDate}`);

      return {
        processed: true,
        result: {
          type: 'trial_will_end',
          brandId: brand.id,
          trialEndDate,
          emailSent: !!owner?.email,
        },
      };
    }

    return { processed: false };
  }

  /**
   * Handle customer.subscription.paused event
   */
  private async handleSubscriptionPaused(subscription: Stripe.Subscription): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    
    this.logger.log('Processing subscription paused', {
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
          subscriptionStatus: 'PAST_DUE', // Using PAST_DUE as proxy for paused
        },
      });

      return {
        processed: true,
        result: {
          type: 'subscription_paused',
          brandId: brand.id,
          subscriptionId: subscription.id,
        },
      };
    }

    return { processed: false };
  }

  /**
   * Handle customer.subscription.resumed event
   */
  private async handleSubscriptionResumed(subscription: Stripe.Subscription): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    
    this.logger.log('Processing subscription resumed', {
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
          subscriptionStatus: 'ACTIVE',
        },
      });

      return {
        processed: true,
        result: {
          type: 'subscription_resumed',
          brandId: brand.id,
          subscriptionId: subscription.id,
        },
      };
    }

    return { processed: false };
  }

  /**
   * Handle invoice.upcoming event
   * Triggered a few days before invoice is created
   * BIL-04: Envoyer un email de rappel de facturation à venir
   */
  private async handleInvoiceUpcoming(invoice: Stripe.Invoice): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    
    this.logger.log('Processing invoice upcoming', {
      customerId,
      amountDue: invoice.amount_due,
      dueDate: invoice.due_date,
    });

    if (!customerId) {
      return { processed: false };
    }

    // Trouver le brand associé
    const brand = await this.prisma.brand.findFirst({
      where: { stripeCustomerId: customerId },
      include: { users: true },
    });

    if (brand) {
      const owner = brand.users?.find(u => u.role === 'BRAND_ADMIN') || brand.users?.[0];
      
      if (owner?.email) {
        const amountFormatted = CurrencyUtils.formatCents(invoice.amount_due || 0, invoice.currency || CurrencyUtils.getDefaultCurrency());
        const dueDate = invoice.due_date 
          ? new Date(invoice.due_date * 1000).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'prochainement';

        try {
          await this.emailService.sendEmail({
            to: owner.email,
            subject: `Prochaine facturation Luneo - ${amountFormatted}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Prochaine facturation</h1>
                <p>Bonjour ${owner.firstName || ''},</p>
                <p>Nous vous informons que votre prochaine facture sera émise ${dueDate}.</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">
                    ${amountFormatted}
                  </p>
                  <p style="margin: 5px 0 0 0; color: #666;">Montant estimé TTC</p>
                </div>
                <p>Le paiement sera prélevé automatiquement sur votre moyen de paiement enregistré.</p>
                <div style="margin: 30px 0;">
                  <a href="${this.configService.get('app.frontendUrl')}/dashboard/billing" 
                     style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Gérer mon abonnement
                  </a>
                </div>
                <p style="color: #666;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                <p>L'équipe Luneo</p>
              </div>
            `,
          });
          this.logger.log(`Invoice upcoming email sent to ${owner.email}`);
        } catch (emailError: any) {
          this.logger.warn(`Failed to send invoice upcoming email: ${emailError.message}`);
        }
      }
    }

    return {
      processed: true,
      result: {
        type: 'invoice_upcoming',
        customerId,
        amountDue: invoice.amount_due,
        brandId: brand?.id,
      },
    };
  }

  /**
   * Handle invoice.finalized event
   */
  private async handleInvoiceFinalized(invoice: Stripe.Invoice): Promise<{ processed: boolean; result?: any }> {
    this.logger.log('Processing invoice finalized', {
      invoiceId: invoice.id,
      customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
      total: invoice.total,
    });

    return {
      processed: true,
      result: {
        type: 'invoice_finalized',
        invoiceId: invoice.id,
        total: invoice.total,
      },
    };
  }

  /**
   * Handle charge.refunded event
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<{ processed: boolean; result?: any }> {
    this.logger.log('Processing charge refunded', {
      chargeId: charge.id,
      amount: charge.amount,
      amountRefunded: charge.amount_refunded,
    });

    const refund = charge.refunds?.data[0];
    if (!refund) {
      return { processed: true, result: { type: 'charge_refunded', chargeId: charge.id } };
    }

    // Trouver la commande associée au payment intent
    const paymentIntentId = typeof charge.payment_intent === 'string' 
      ? charge.payment_intent 
      : charge.payment_intent?.id;

    if (paymentIntentId) {
      const order = await this.prisma.order.findFirst({
        where: { stripePaymentId: paymentIntentId },
        include: { commissions: true },
      });

      if (order) {
        const isFullRefund = charge.amount_refunded === charge.amount;
        
        // Mettre à jour le statut de la commande
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: isFullRefund ? 'REFUNDED' : 'CANCELLED',
          },
        });

        // BIL-09: Annuler les commissions non payées lors du remboursement
        for (const commission of order.commissions) {
          if (commission.status !== 'PAID') {
            await this.prisma.commission.update({
              where: { id: commission.id },
              data: { status: 'CANCELLED' },
            });
          }
        }

        this.logger.log(`Order ${order.id} marked as ${isFullRefund ? 'REFUNDED' : 'CANCELLED'}`);

        return {
          processed: true,
          result: {
            type: 'charge_refunded',
            orderId: order.id,
            isFullRefund,
            amountRefunded: charge.amount_refunded,
          },
        };
      }
    }

    return {
      processed: true,
      result: {
        type: 'charge_refunded',
        chargeId: charge.id,
        amountRefunded: charge.amount_refunded,
      },
    };
  }

  /**
   * Handle customer.updated event
   */
  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<{ processed: boolean; result?: any }> {
    this.logger.log('Processing customer updated', {
      customerId: customer.id,
      email: customer.email,
    });

    const brand = await this.prisma.brand.findFirst({
      where: { stripeCustomerId: customer.id },
    });

    if (brand) {
      // Mettre à jour les informations de facturation si nécessaire
      // On pourrait stocker l'email de facturation séparément si différent
      this.logger.debug(`Customer ${customer.id} updated for brand ${brand.id}`);
    }

    return {
      processed: true,
      result: {
        type: 'customer_updated',
        customerId: customer.id,
      },
    };
  }

  /**
   * Handle payment_method.attached event
   */
  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<{ processed: boolean; result?: any }> {
    const customerId = typeof paymentMethod.customer === 'string' 
      ? paymentMethod.customer 
      : paymentMethod.customer?.id;

    this.logger.log('Processing payment method attached', {
      paymentMethodId: paymentMethod.id,
      customerId,
      type: paymentMethod.type,
    });

    return {
      processed: true,
      result: {
        type: 'payment_method_attached',
        paymentMethodId: paymentMethod.id,
        customerId,
      },
    };
  }

  /**
   * Handle payment_method.detached event
   */
  private async handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod): Promise<{ processed: boolean; result?: any }> {
    this.logger.log('Processing payment method detached', {
      paymentMethodId: paymentMethod.id,
      type: paymentMethod.type,
    });

    return {
      processed: true,
      result: {
        type: 'payment_method_detached',
        paymentMethodId: paymentMethod.id,
      },
    };
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
          subscriptionStatus: newStatus as any,
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
