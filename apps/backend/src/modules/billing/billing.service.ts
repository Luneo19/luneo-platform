import { PLAN_CONFIGS, normalizePlanTier, PlanTier, getPlanConfig } from '@/libs/plans';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrencyUtils, detectCurrency } from '@/config/currency.config';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plan, OrgStatus } from '@prisma/client';
import type Stripe from 'stripe';
import { StripeClientService } from './services/stripe-client.service';
import { AuditLogsService, AuditEventType } from '@/modules/security/services/audit-logs.service';
import { DistributedLockService } from '@/libs/redis/distributed-lock.service';

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
    private readonly auditLogsService: AuditLogsService,
    private readonly distributedLock: DistributedLockService,
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

  /**
   * Verify a Stripe checkout session after successful payment.
   * Returns session details for the frontend success page.
   */
  async verifyCheckoutSession(
    userId: string,
    sessionId: string,
  ): Promise<{
    success: boolean;
    data: {
      planName: string;
      amount: number;
      currency: string;
      customerEmail: string;
      subscriptionId: string;
      trialEnd?: string;
    };
  }> {
    try {
      const session = await this.executeWithResilience(
        async () => {
          const stripe = await this.getStripe();
          return stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription'],
          });
        },
        'stripe.checkout.sessions.retrieve',
      );

      const metadataUserId = session.metadata?.userId as string | undefined;
      if (metadataUserId !== userId) {
        this.logger.warn('Verify session: userId mismatch', {
          sessionId,
          metadataUserId,
          requestUserId: userId,
        });
        throw new BadRequestException('This checkout session does not belong to you');
      }

      const subscription = session.subscription as Stripe.Subscription | null | undefined;
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : subscription?.id ?? '';

      const firstItem = subscription?.items?.data?.[0];
      const priceId = firstItem?.price?.id;
      const planInfo = priceId ? await this.getPlanFromPriceId(priceId) : { planName: 'unknown', interval: 'monthly' };
      const planName = planInfo.planName.charAt(0).toUpperCase() + planInfo.planName.slice(1);

      const amount = session.amount_total ?? firstItem?.price?.unit_amount ?? 0;
      const currency = (session.currency ?? firstItem?.price?.currency ?? 'eur').toLowerCase();
      const customerEmail = (session.customer_email ?? session.customer_details?.email ?? '').toString();
      const trialEnd = subscription?.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : undefined;

      return {
        success: true,
        data: {
          planName,
          amount: amount ?? 0,
          currency,
          customerEmail,
          subscriptionId,
          ...(trialEnd && { trialEnd }),
        },
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        'verifyCheckoutSession failed',
        error instanceof Error ? error.stack : String(error),
        { userId, sessionId },
      );
      throw new InternalServerErrorException(
        'Unable to verify checkout session. Please try again or contact support.',
      );
    }
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
      country?: string;
      locale?: string;
    },
  ) {
    // Distributed lock to prevent double checkout for the same user
    const checkoutLockKey = `checkout:${userId}`;
    const lockAcquired = await this.distributedLock.acquire(checkoutLockKey, 30);
    if (!lockAcquired) {
      throw new BadRequestException('Une session de paiement est déjà en cours de création. Veuillez patienter.');
    }

    try {
      return await this._createCheckoutSessionWithLock(planId, userId, userEmail, options);
    } finally {
      await this.distributedLock.release(checkoutLockKey);
    }
  }

  private async _createCheckoutSessionWithLock(
    planId: string,
    userId: string,
    userEmail: string,
    options?: {
      billingInterval?: 'monthly' | 'yearly';
      addOns?: Array<{ type: string; quantity: number }>;
      country?: string;
      locale?: string;
    },
  ) {
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';
    if (!this.stripeClient.stripeConfigValid && nodeEnv === 'production') {
      throw new ServiceUnavailableException('Stripe is not properly configured. Please contact support.');
    }

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

    // ✅ Prevent double subscription: reject checkout if user already has an active subscription
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        memberships: {
          where: { isActive: true },
          select: {
            organization: {
              select: {
                id: true,
                stripeCustomerId: true,
                stripeSubscriptionId: true,
                status: true,
                plan: true,
              },
            },
          },
          take: 1,
        },
      },
    });
    const existingOrg = existingUser?.memberships?.[0]?.organization;

    if (existingOrg?.stripeSubscriptionId && existingOrg.status === 'ACTIVE') {
      throw new BadRequestException(
        'Vous avez déjà un abonnement actif. Veuillez annuler votre abonnement actuel ou changer de plan depuis votre dashboard.',
      );
    }

    if (planId === 'free') {
      throw new BadRequestException('Le plan gratuit ne nécessite pas de paiement. Inscrivez-vous directement.');
    }

    // Restrict self-service checkout to allowed plans only (Enterprise requires contact sales)
    const SELF_SERVICE_PLANS = ['pro', 'business'];
    if (!SELF_SERVICE_PLANS.includes(planId.toLowerCase())) {
      throw new BadRequestException(
        `Le plan "${planId}" n'est pas disponible en self-service. Veuillez contacter notre équipe commerciale.`,
      );
    }

    // ✅ Multi-currency: detect from country (organization or header) / locale (Accept-Language)
    let country = options?.country;
    if (!country && userId && !userId.startsWith('guest_')) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          memberships: {
            where: { isActive: true },
            select: { organization: { select: { country: true } } },
            take: 1,
          },
        },
      });
      country = user?.memberships?.[0]?.organization?.country ?? undefined;
    }
    const currency = detectCurrency(country, options?.locale);

    // ✅ Utiliser les Price IDs validés en production, sinon fallback pour dev/test
    let planPriceIds: Record<string, { monthly: string | null; yearly: string | null }>;
    
    if (this.stripeClient.validatedPriceIds) {
      // En production: utiliser les IDs validés au démarrage
      planPriceIds = this.stripeClient.validatedPriceIds as unknown as Record<string, { monthly: string; yearly: string }>;
    } else {
      const isProduction = process.env.NODE_ENV === 'production';

      // Helper: get price from config, throw in production if missing
      const getPriceId = (configKey: string, fallback: string): string => {
        const value = this.configService.get<string>(configKey);
        if (!value && isProduction) {
          throw new InternalServerErrorException(
            `Stripe price ID not configured: ${configKey}. Cannot use test fallbacks in production.`,
          );
        }
        return value || fallback;
      };

      // BILLING FIX: No more test fallbacks in production
      planPriceIds = {
        pro: {
          monthly: getPriceId('stripe.priceProMonthly', 'price_test_pro_monthly'),
          yearly: getPriceId('stripe.priceProYearly', 'price_test_pro_yearly'),
        },
        business: {
          monthly: getPriceId('stripe.priceBusinessMonthly', 'price_test_business_monthly'),
          yearly: getPriceId('stripe.priceBusinessYearly', 'price_test_business_yearly'),
        },
        enterprise: {
          monthly: getPriceId('stripe.priceEnterpriseMonthly', 'price_test_enterprise_monthly'),
          yearly: getPriceId('stripe.priceEnterpriseYearly', 'price_test_enterprise_yearly'),
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
        // SECURITY FIX: Limit number of add-ons per checkout to prevent abuse
        const MAX_ADDONS_PER_CHECKOUT = 10;
        if (options.addOns.length > MAX_ADDONS_PER_CHECKOUT) {
          throw new BadRequestException(`Maximum ${MAX_ADDONS_PER_CHECKOUT} add-ons per checkout session`);
        }

        const addonsConfig = this.configService.get<Record<string, Record<string, string>>>('stripe.addons') || {};
        const addonTypeMap: Record<string, string> = {
          'extra_designs': 'extraDesigns',
          'extra_storage': 'extraStorage',
          'extra_team_members': 'extraTeamMembers',
          'extra_api_calls': 'extraApiCalls',
          'extra_renders_3d': 'extraRenders3d',
        };

        for (const addon of options.addOns) {
          // SECURITY FIX: Validate addon quantity (must be positive integer, max 100)
          const quantity = Math.floor(Number(addon.quantity));
          if (!Number.isFinite(quantity) || quantity < 1) {
            throw new BadRequestException(`Invalid quantity for add-on ${addon.type}: must be at least 1`);
          }
          if (quantity > 100) {
            throw new BadRequestException(`Invalid quantity for add-on ${addon.type}: maximum is 100`);
          }

          const configKey = addonTypeMap[addon.type];
          if (!configKey || !addonsConfig[configKey]) {
            this.logger.warn(`Unknown add-on type: ${addon.type}, skipping`);
            continue;
          }

          const addonPriceId = addonsConfig[configKey][billingInterval === 'yearly' ? 'yearly' : 'monthly'];
          if (addonPriceId) {
            lineItems.push({
              price: addonPriceId,
              quantity,
            });
            this.logger.log(`Add-on added to checkout: ${addon.type} x${quantity} (${addonPriceId})`);
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
          const existingCustomerId = existingOrg?.stripeCustomerId;
          return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'subscription',
        ...(existingCustomerId
          ? { customer: existingCustomerId }
          : { customer_email: userEmail }),
        allow_promotion_codes: true,
        // BILLING FIX: Use configService only - no hardcoded URLs (MED-006)
        success_url: `${this.configService.get('app.frontendUrl')}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('app.frontendUrl')}/dashboard/billing/cancel`,
        locale: (options?.locale ? this.mapLocaleToStripe(options.locale) : undefined) as Stripe.Checkout.SessionCreateParams.Locale | undefined,
        metadata: {
          userId,
          planId,
          billingInterval,
          addOns: options?.addOns ? JSON.stringify(options.addOns) : '',
          currency,
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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
      });
      const org = user?.memberships?.[0]?.organization;

      if (!org?.stripeCustomerId) {
        return { paymentMethods: [] };
      }

    try {
      // ✅ PHASE 2: Appel Stripe avec résilience
      const paymentMethods = await this.executeWithResilience(
        async () => {
      const stripe = await this.getStripe();
          return stripe.paymentMethods.list({
            customer: org!.stripeCustomerId!,
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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
      });
      const org = user?.memberships?.[0]?.organization;

      if (!org) {
      throw new NotFoundException('Organization not found for user');
      }

      let customerId = org.stripeCustomerId;

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
                organizationId: org!.id,
          },
        });
          },
          'stripe.customers.create',
        );

        customerId = customer.id;

        await this.prisma.organization.update({
          where: { id: org!.id },
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Error adding payment method', error, { userId, paymentMethodId });
      throw new InternalServerErrorException(`Erreur lors de l'ajout de la méthode de paiement: ${message}`);
    }
  }

  async removePaymentMethod(userId: string, paymentMethodId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
      });
      const org = user?.memberships?.[0]?.organization;

      if (!org?.stripeCustomerId) {
        throw new NotFoundException('Aucun compte de facturation trouvé');
      }

      const stripe = await this.getStripe();

      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod.customer !== org.stripeCustomerId) {
        this.logger.warn('IDOR attempt: user tried to detach payment method belonging to another customer', {
          userId,
          paymentMethodId,
          requestedCustomer: paymentMethod.customer,
          actualCustomer: org.stripeCustomerId,
        });
        throw new NotFoundException('Méthode de paiement non trouvée');
      }

      await this.executeWithResilience(
        async () => stripe.paymentMethods.detach(paymentMethodId),
        'stripe.paymentMethods.detach',
      );

      return { message: 'Méthode de paiement supprimée avec succès' };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Error removing payment method', error, { userId, paymentMethodId });
      throw new InternalServerErrorException(`Erreur lors de la suppression de la méthode de paiement: ${message}`);
    }
  }

  async getInvoices(userId: string, page: number = 1, limit: number = 20) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
      });
      const org = user?.memberships?.[0]?.organization;

      if (!org?.stripeCustomerId) {
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

      const stripeCustomerId = org!.stripeCustomerId!;
      const invoices = await this.executeWithResilience(
        async () => {
          const stripe = await this.getStripe();
          return stripe.invoices.list({
            customer: stripeCustomerId,
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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
      });
      const org = user?.memberships?.[0]?.organization;

      if (!org) {
        // Pas d'organization = plan FREE par défaut (SINGLE SOURCE OF TRUTH: plan-config.ts)
        const freePlanConfig = PLAN_CONFIGS[PlanTier.FREE];
        return {
          plan: 'free' as const,
          planName: freePlanConfig.info.name,
          status: 'active' as const,
          limits: {
            ...freePlanConfig.limits,
            renders2DPerMonth: freePlanConfig.quotas.find(q => q.metric === 'renders_2d')?.limit ?? 10,
            renders3DPerMonth: freePlanConfig.quotas.find(q => q.metric === 'renders_3d')?.limit ?? 0,
            aiGenerationsPerMonth: freePlanConfig.quotas.find(q => q.metric === 'ai_generations')?.limit ?? 3,
            apiCallsPerMonth: freePlanConfig.quotas.find(q => q.metric === 'api_calls')?.limit ?? 0,
            aiTokensPerMonth: freePlanConfig.agentLimits.monthlyTokens,
          },
          currentUsage: {
            designs: 0,
            renders2D: 0,
            renders3D: 0,
            aiGenerations: 0,
            storageGB: 0,
            apiCalls: 0,
            teamMembers: 1,
            aiTokens: 0,
          },
          // FIX: Also expose as 'usage' for frontend usage page compatibility
          usage: {
            designs: 0,
            renders2D: 0,
            renders3D: 0,
            aiGenerations: 0,
            storageGB: 0,
            apiCalls: 0,
            teamMembers: 1,
            aiTokens: 0,
          },
          commissionPercent: freePlanConfig.pricing.commissionPercent,
        };
      }

      // Déterminer le plan depuis organization.plan (SINGLE SOURCE OF TRUTH: plan-config)
      const plan = normalizePlanTier(org.plan || 'FREE');

      // Déterminer le statut depuis organization.status ou Stripe
      let status: 'active' | 'trialing' | 'past_due' | 'canceled' = 'active';
      
      if (org.status) {
        const statusMap: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled'> = {
          'ACTIVE': 'active',
          'TRIAL': 'trialing',
          'SUSPENDED': 'past_due',
          'CANCELED': 'canceled',
        };
        status = statusMap[org.status] || 'active';
      }

      // Récupérer les détails depuis Stripe si subscription ID existe
      let stripeSubscription: Stripe.Subscription | null = null;
      if (org.stripeSubscriptionId) {
        try {
          const stripe = await this.getStripe();
          stripeSubscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId!);
          
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
            subscriptionId: org.stripeSubscriptionId,
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
      
      const teamMembersCount = await this.prisma.organizationMember.count({
        where: { organizationId: org.id, isActive: true },
      });

      // Usage reel depuis les tables de tracking
      const usageResults = await Promise.all([
        this.prisma.usageRecord.aggregate({
          where: { organizationId: org.id, type: 'AGENT_MESSAGE' as any, periodStart: { gte: startOfMonth } },
          _sum: { quantity: true },
        }),
        this.prisma.usageRecord.aggregate({
          where: { organizationId: org.id, type: 'API_CALL' as any, periodStart: { gte: startOfMonth } },
          _sum: { quantity: true },
        }),
      ]);

      const [messagesResult, apiCallsResult] = usageResults;

      const currentUsage = {
        designs: 0,
        renders2D: 0,
        renders3D: 0,
        aiGenerations: messagesResult._sum.quantity || 0,
        storageGB: 0,
        apiCalls: apiCallsResult._sum.quantity || 0,
        teamMembers: teamMembersCount,
        aiTokens: 0,
      };

      // Commission rate from plan-config
      const commissionPercent = planConfig.pricing.commissionPercent;

      return {
        plan,
        planName: planConfig.info.name,
        status,
        limits: {
          ...limits,
          renders2DPerMonth: planConfig.quotas.find(q => q.metric === 'renders_2d')?.limit ?? 10,
          renders3DPerMonth: planConfig.quotas.find(q => q.metric === 'renders_3d')?.limit ?? 0,
          aiGenerationsPerMonth: planConfig.quotas.find(q => q.metric === 'ai_generations')?.limit ?? 3,
          apiCallsPerMonth: planConfig.quotas.find(q => q.metric === 'api_calls')?.limit ?? 0,
          aiTokensPerMonth: planConfig.agentLimits.monthlyTokens,
        },
        currentUsage,
        // CRITICAL FIX: Also expose as 'usage' for frontend usage page compatibility
        usage: currentUsage,
        commissionPercent,
        currentPeriodStart: stripeSubscription?.current_period_start
          ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
          : undefined,
        currentPeriodEnd: org.planPeriodEnd?.toISOString() || 
                   (stripeSubscription?.current_period_end 
                     ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
                     : undefined),
        expiresAt: org.planPeriodEnd?.toISOString() || 
                   (stripeSubscription?.current_period_end 
                     ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
                     : undefined),
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end ?? false,
        stripeSubscriptionId: org.stripeSubscriptionId || undefined,
      };
    } catch (error) {
      this.logger.error('Error getting subscription', error, { userId });
      throw new InternalServerErrorException('Erreur lors de la récupération de l\'abonnement');
    }
  }

  async createCustomerPortalSession(userId: string) {
    try {
      const stripe = await this.getStripe();
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
      });
      const org = user?.memberships?.[0]?.organization;

      if (!org?.stripeCustomerId) {
        throw new NotFoundException('Stripe customer ID not found');
      }
      
      const session = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
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
   * @param newPlanId - ID du nouveau plan (pro, business, enterprise)
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
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
    const org = user?.memberships?.[0]?.organization;

    if (!org) {
      throw new NotFoundException('User organization not found');
    }

    if (!org.stripeCustomerId || !org.stripeSubscriptionId) {
      throw new BadRequestException('User does not have an active subscription. Please subscribe first.');
    }

    // 2. Récupérer l'abonnement Stripe actuel
    const currentSubscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId!);
    
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
          customer: org.stripeCustomerId!,
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
      } catch (previewError: unknown) {
        const msg = previewError instanceof Error ? previewError.message : String(previewError);
        this.logger.warn(`Failed to preview proration: ${msg}`);
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

      let updatedSubscription: Stripe.Subscription;

      // BILLING FIX: For non-immediate downgrades, use subscription_schedule
      // to schedule the price change at the end of the current billing period.
      // Previously, subscriptions.update was called immediately even for downgrades.
      if (isDowngrade && !immediateChange) {
        // Cancel any existing schedule before creating a new one (handles multiple successive downgrades)
        if (currentSubscription.schedule) {
          const existingScheduleId = typeof currentSubscription.schedule === 'string'
            ? currentSubscription.schedule
            : currentSubscription.schedule.id;
          try {
            await stripe.subscriptionSchedules.release(existingScheduleId);
            this.logger.log(`Released existing schedule ${existingScheduleId} before creating new downgrade schedule`);
          } catch (releaseError: unknown) {
            const releaseMsg = releaseError instanceof Error ? releaseError.message : String(releaseError);
            this.logger.warn(`Could not release existing schedule ${existingScheduleId}: ${releaseMsg}`);
          }
        }

        const schedule = await stripe.subscriptionSchedules.create({
          from_subscription: currentSubscription.id,
        });

        // Collect existing add-on items (all items except the main plan)
        const addonItems = currentSubscription.items.data
          .slice(1)
          .filter(item => item.price?.id)
          .map(item => ({ price: item.price.id, quantity: item.quantity || 1 }));

        // Update the schedule to change the price at the end of the current period
        await stripe.subscriptionSchedules.update(schedule.id, {
          end_behavior: 'release',
          phases: [
            {
              // Current phase: keep existing plan + add-ons until current period ends
              items: [{ price: currentPriceId, quantity: 1 }, ...addonItems],
              start_date: schedule.phases[0]?.start_date || Math.floor(Date.now() / 1000),
              end_date: currentSubscription.current_period_end,
            },
            {
              // Next phase: switch to new (downgraded) plan, keep add-ons
              items: [{ price: newPriceId, quantity: 1 }, ...addonItems],
              start_date: currentSubscription.current_period_end,
              proration_behavior: 'none',
              metadata: {
                ...currentSubscription.metadata,
                previousPlan: currentPlanInfo.planName,
                changeType: 'downgrade',
                changeDate: new Date().toISOString(),
              },
            },
          ],
        });

        this.logger.log(`Downgrade scheduled via subscription_schedule ${schedule.id} for period end`);
        // Retrieve updated subscription for return value
        updatedSubscription = await stripe.subscriptions.retrieve(currentSubscription.id);
      } else {
        // Upgrade or immediate downgrade: apply immediately
        const result = await stripe.subscriptions.update(
          currentSubscription.id,
          updateParams
        );
        updatedSubscription = result;
      }

      // 10. Mettre à jour la base de données locale avec protection transactionnelle
      const planMapping: Record<string, Plan> = {
        'pro': 'PRO',
        'business': 'BUSINESS',
        'enterprise': 'ENTERPRISE',
      };

      try {
        if (isUpgrade || immediateChange) {
          await this.prisma.$transaction(async (tx) => {
            await tx.organization.update({
              where: { id: org.id },
              data: {
                plan: planMapping[newPlanId] || 'PRO',
                ...(isUpgrade ? { status: 'ACTIVE' as OrgStatus } : {}),
              },
            });
          });
        } else {
          this.logger.log(`Scheduled downgrade for org ${org.id}: plan will change to ${newPlanId} at period end. DB plan unchanged.`);
        }
      } catch (dbError) {
        this.logger.error('CRITICAL: Stripe subscription updated but database sync failed', {
          userId,
          organizationId: org.id,
          stripeSubscriptionId: updatedSubscription.id,
          newPlan: newPlanId,
          error: dbError instanceof Error ? dbError.message : 'Unknown',
        });
        throw new InternalServerErrorException(
          'Plan change partially applied. Our team has been notified and will resolve this shortly.'
        );
      }

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

      // 12. Audit log the plan change
      try {
        await this.auditLogsService.logSuccess(AuditEventType.BILLING_UPDATED, 'plan_change', {
          userId,
          brandId: org.id,
          resourceType: 'subscription',
          resourceId: org.stripeSubscriptionId || undefined,
          metadata: {
            previousPlan: currentPlanInfo.planName,
            newPlan: newPlanId,
            type: isUpgrade ? 'upgrade' : 'downgrade',
            prorationAmount: prorationAmount || 0,
          },
        });
      } catch (auditError) {
        // Don't fail the operation if audit logging fails
        this.logger.warn('Failed to log audit event for plan change', { error: auditError });
      }

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
    } catch (stripeError: unknown) {
      const message = stripeError instanceof Error ? stripeError.message : String(stripeError);
      this.logger.error('Failed to change plan', {
        userId,
        newPlanId,
        error: message,
      });
      throw new InternalServerErrorException(
        `Failed to change plan: ${message}`
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
    const plans: Array<{ configName: string; planName: string }> = [
      { configName: 'Pro', planName: 'pro' },
      { configName: 'Business', planName: 'business' },
      { configName: 'Enterprise', planName: 'enterprise' },
    ];
    const intervals = ['Monthly', 'Yearly'];
    
    for (const plan of plans) {
      for (const interval of intervals) {
        const configKey = `stripe.price${plan.configName}${interval}`;
        const configuredPriceId = this.configService.get<string>(configKey);
        if (configuredPriceId) {
          priceIdMappings[configuredPriceId] = {
            planName: plan.planName,
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
    const PLAN_CONFIG_MAP: Record<string, string> = {
      pro: 'Pro',
      starter: 'Pro', // backward compat
      professional: 'Pro', // backward compat
      business: 'Business',
      enterprise: 'Enterprise',
    };
    const configPlanName = PLAN_CONFIG_MAP[planId.toLowerCase()] ||
      (planId.charAt(0).toUpperCase() + planId.slice(1).toLowerCase());
    const intervalCapitalized = interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase();
    
    const configKey = `stripe.price${configPlanName}${intervalCapitalized}`;
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
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
    const previewOrg = user?.memberships?.[0]?.organization;

    if (!previewOrg?.stripeCustomerId || !previewOrg?.stripeSubscriptionId) {
      throw new BadRequestException('User does not have an active subscription');
    }

    const currentSubscription = await stripe.subscriptions.retrieve(previewOrg.stripeSubscriptionId);
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
          customer: previewOrg.stripeCustomerId!,
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
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Preview failed: ${msg}`);
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
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
    const impactOrg = user?.memberships?.[0]?.organization;

    if (!impactOrg) {
      throw new NotFoundException('User organization not found');
    }

    // Limites par plan - Source: @/libs/plans (SINGLE SOURCE OF TRUTH)
    const getDowngradeLimits = (planId: string) => {
      const tier = normalizePlanTier(planId);
      const config = PLAN_CONFIGS[tier];
      const featureKeys: string[] = [];
      if (config.limits.apiAccess) featureKeys.push('api_access');
      if (config.limits.emailChannel) featureKeys.push('email_channel');
      if (config.limits.whiteLabel) featureKeys.push('white_label');
      if (config.limits.advancedAnalytics) featureKeys.push('advanced_analytics');
      if (config.limits.visualBuilder) featureKeys.push('visual_builder');
      if (config.limits.prioritySupport) featureKeys.push('priority_support');
      if (tier === PlanTier.ENTERPRISE) return { ...config.limits, products: config.limits.agentsLimit, storage: config.limits.storageGB, features: ['all'] };
      return {
        conversationsPerMonth: config.limits.conversationsPerMonth,
        teamMembers: config.limits.teamMembers,
        products: config.limits.agentsLimit,
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

    // Vérifier les agents (V2 equivalent of products)
    const agentCount = await this.prisma.agent.count({
      where: { organizationId: impactOrg.id, deletedAt: null },
    });
    
    if (newLimits.products !== -1 && agentCount > newLimits.products) {
      impactedResources.push({
        resource: 'agents',
        current: agentCount,
        newLimit: newLimits.products,
        excess: agentCount - newLimits.products,
        action: 'readonly',
        description: `${agentCount - newLimits.products} agents passeront en lecture seule. Vous ne pourrez pas en créer de nouveaux.`,
      });
    }

    // Vérifier les membres d'équipe
    const teamCount = await this.prisma.organizationMember.count({
      where: { organizationId: impactOrg.id, isActive: true },
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
    
    const conversationsThisMonth = await this.prisma.conversation.count({
      where: {
        organizationId: impactOrg.id,
        createdAt: { gte: startOfMonth },
      },
    });
    
    if (newLimits.conversationsPerMonth !== -1 && conversationsThisMonth > newLimits.conversationsPerMonth) {
      impactedResources.push({
        resource: 'conversations_monthly',
        current: conversationsThisMonth,
        newLimit: newLimits.conversationsPerMonth,
        excess: conversationsThisMonth - newLimits.conversationsPerMonth,
        action: 'readonly',
        description: `Vous avez déjà ${conversationsThisMonth} conversations ce mois. Avec le nouveau plan, vous ne pourrez plus en créer jusqu'au mois prochain.`,
      });
    }

    // Déterminer les fonctionnalités perdues
    const currentPlanName = normalizePlanTier(impactOrg.plan || 'FREE');
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
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
    const cancelOrg = user?.memberships?.[0]?.organization;

    if (!cancelOrg?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(cancelOrg.stripeSubscriptionId!);
      
      if (subscription.schedule) {
        await stripe.subscriptionSchedules.cancel(subscription.schedule as string);
        
        this.logger.log('Cancelled scheduled downgrade', { userId, subscriptionId: subscription.id });
        
        return {
          success: true,
          message: 'Le downgrade programmé a été annulé. Vous conservez votre plan actuel.',
          currentPlan: cancelOrg.plan || 'unknown',
        };
      }

      if (subscription.cancel_at_period_end) {
        const _updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: false,
        });

        this.logger.log('Removed cancel_at_period_end flag', { userId, subscriptionId: subscription.id });
        
        return {
          success: true,
          message: 'L\'annulation programmée a été annulée. Votre abonnement continuera.',
          currentPlan: cancelOrg.plan || 'unknown',
        };
      }

      if (subscription.metadata?.pendingDowngradeTo) {
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
          currentPlan: cancelOrg.plan || 'unknown',
        };
      }

      return {
        success: false,
        message: 'Aucun downgrade programmé trouvé pour cet abonnement.',
        currentPlan: cancelOrg.plan || 'unknown',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to cancel scheduled downgrade', { userId, error: message });
      throw new InternalServerErrorException(`Failed to cancel downgrade: ${message}`);
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
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
    const subOrg = user?.memberships?.[0]?.organization;

    if (!subOrg?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    try {
      let subscription: Stripe.Subscription;
      
      if (immediate) {
        subscription = await stripe.subscriptions.cancel(subOrg.stripeSubscriptionId!);
        
        await this.prisma.organization.update({
          where: { id: subOrg.id },
          data: {
            status: 'CANCELED' as OrgStatus,
            plan: 'FREE' as Plan,
            stripeSubscriptionId: null,
            planPeriodEnd: null,
          },
        });

        this.logger.log(`Subscription cancelled immediately for user ${userId}`);
        
        return {
          success: true,
          message: 'Votre abonnement a été annulé immédiatement. Vous avez été basculé sur le plan gratuit.',
        };
      } else {
        subscription = await stripe.subscriptions.update(subOrg.stripeSubscriptionId!, {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to cancel subscription for user ${userId}: ${message}`);
      throw new InternalServerErrorException(`Failed to cancel subscription: ${message}`);
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
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
    const schedOrg = user?.memberships?.[0]?.organization;

    if (!schedOrg) {
      throw new NotFoundException('User organization not found');
    }

    const currentPlan = normalizePlanTier(schedOrg.plan || 'FREE');
    const currentStatus = schedOrg.status || 'unknown';

    if (!schedOrg.stripeSubscriptionId) {
      return {
        hasScheduledChanges: false,
        currentPlan,
        currentStatus,
      };
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(schedOrg.stripeSubscriptionId!);

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn('Failed to check scheduled changes', { userId, error: message });
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
  /**
   * BIL-10: Get trial period days for a specific plan
   * Each plan can have a different trial period
   */
  /**
   * Map Accept-Language or locale string to a Stripe Checkout session locale.
   * Stripe supports: en, fr, de, es, it, etc. (see Stripe docs). Returns undefined to use Stripe default.
   */
  private mapLocaleToStripe(locale: string): string | undefined {
    const tag = locale.split(/[,;]/)[0]?.trim().slice(0, 5).replace('_', '-') ?? '';
    const code = tag.slice(0, 2).toLowerCase();
    const allowed = ['en', 'fr', 'de', 'es', 'it', 'nl', 'pt', 'ja', 'zh', 'ar', 'he', 'pl', 'ru', 'tr', 'sv', 'fi', 'da', 'no'];
    if (allowed.includes(code)) return code;
    if (tag.toLowerCase().startsWith('en-gb')) return 'en-GB';
    if (tag.toLowerCase().startsWith('zh-tw')) return 'zh-TW';
    if (tag.toLowerCase().startsWith('zh-hk')) return 'zh-HK';
    if (tag.toLowerCase().startsWith('fr-ca')) return 'fr-CA';
    if (tag.toLowerCase().startsWith('pt-br')) return 'pt-BR';
    return undefined;
  }

  private getTrialDaysForPlan(planId: string): number {
    const defaultTrialDays = this.configService.get<number>('stripe.trialPeriodDays') || 14;
    const trialDaysByPlan: Record<string, number> = {
      pro: 14,
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
   * Refund a subscription payment (admin only).
   * Finds the latest paid invoice for the subscription and issues a Stripe refund.
   * @param subscriptionId - Stripe subscription ID
   * @param reason - Optional refund reason for audit trail
   * @returns Refund details
   */
  async refundSubscription(subscriptionId: string, reason?: string): Promise<{
    success: boolean;
    refundId?: string;
    amountRefunded?: number;
    currency?: string;
    status?: string;
    message: string;
  }> {
    const stripe = await this.getStripe();

    try {
      // Retrieve the subscription to verify it exists
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      if (!subscription) {
        return { success: false, message: 'Subscription not found in Stripe' };
      }

      // Get the latest paid invoice for this subscription
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        status: 'paid',
        limit: 1,
      });

      if (!invoices.data.length) {
        return { success: false, message: 'No paid invoice found for this subscription' };
      }

      const latestInvoice = invoices.data[0];
      const paymentIntentId = typeof latestInvoice.payment_intent === 'string'
        ? latestInvoice.payment_intent
        : latestInvoice.payment_intent?.id;

      if (!paymentIntentId) {
        return { success: false, message: 'No payment intent found on the latest invoice' };
      }

      // Issue the refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          admin_refund: 'true',
          refund_reason: reason || 'Admin-initiated refund',
          subscription_id: subscriptionId,
        },
      });

      this.logger.log(`Subscription refund issued: ${refund.id} for subscription ${subscriptionId}, amount: ${refund.amount}`);

      // Log to audit trail
      try {
        const refundOrg = await this.prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (refundOrg) {
          await this.auditLogsService.logSuccess(
            AuditEventType.BILLING_UPDATED,
            'subscription.refunded',
            {
              resourceType: 'subscription',
              resourceId: subscriptionId,
              brandId: refundOrg.id,
              metadata: {
                refundId: refund.id,
                amount: refund.amount,
                currency: refund.currency,
                reason: reason || 'Admin-initiated refund',
              },
            },
          );
        }
      } catch (auditErr) {
        this.logger.warn(`Failed to log refund audit: ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
      }

      return {
        success: true,
        refundId: refund.id,
        amountRefunded: refund.amount,
        currency: refund.currency,
        status: refund.status ?? undefined,
        message: `Refund of ${(refund.amount / 100).toFixed(2)} ${refund.currency?.toUpperCase()} issued successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to refund subscription ${subscriptionId}`, error instanceof Error ? error.stack : String(error));
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during refund',
      };
    }
  }

  /**
   * Synchronise le statut d'abonnement avec Stripe
   * Utile pour corriger les incohérences
   */
  async syncSubscriptionStatus(organizationId: string): Promise<{ synced: boolean; status?: string }> {
    const syncOrg = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!syncOrg?.stripeSubscriptionId) {
      return { synced: false };
    }

    try {
      const stripe = await this.getStripe();
      const subscription = await stripe.subscriptions.retrieve(syncOrg.stripeSubscriptionId!);

      const statusMap: Record<string, OrgStatus> = {
        active: 'ACTIVE',
        trialing: 'TRIAL',
        past_due: 'SUSPENDED',
        canceled: 'CANCELED',
        unpaid: 'SUSPENDED',
        incomplete: 'SUSPENDED',
        incomplete_expired: 'CANCELED',
        paused: 'SUSPENDED',
      };

      const newStatus = statusMap[subscription.status] || 'ACTIVE';

      const planItem = subscription.items?.data?.find(
        (item) => !item.price?.metadata?.addon,
      );
      const planName = planItem?.price?.metadata?.plan || syncOrg.plan || 'FREE';
      const planToEnum: Record<string, Plan> = {
        free: 'FREE', starter: 'PRO', professional: 'PRO',
        pro: 'PRO', business: 'BUSINESS', enterprise: 'ENTERPRISE',
      };
      const planPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;

      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          status: newStatus,
          plan: planToEnum[planName.toLowerCase()] || 'FREE',
          planPeriodEnd,
        },
      });

      this.logger.log(`Synced subscription for org ${organizationId}: status=${newStatus}, plan=${planName}`);

      return { synced: true, status: newStatus };
    } catch (error) {
      this.logger.error(`Failed to sync subscription status for org ${organizationId}`, error);
      return { synced: false };
    }
  }
}
