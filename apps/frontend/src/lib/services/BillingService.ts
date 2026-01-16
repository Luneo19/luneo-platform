/**
 * ★★★ SERVICE - FACTURATION AVANCÉE ★★★
 * Service professionnel pour la facturation
 * - Gestion abonnements Stripe
 * - Usage-based billing
 * - Gestion factures
 * - Gestion remboursements
 * - Portail client
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import { getStripe, isStripeConfigured } from '@/lib/stripe/client';
import { trpcVanilla } from '@/lib/trpc/vanilla-client';
import { db } from '@/lib/db';
import type Stripe from 'stripe';

// ========================================
// TYPES
// ========================================

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate?: Date;
  paidAt?: Date;
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
  lineItems: InvoiceLineItem[];
  createdAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
}

export interface UsageMetrics {
  customizations: number;
  renders: number;
  apiCalls: number;
  storageBytes: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface BillingLimits {
  monthlyCustomizations: number;
  monthlyRenders: number;
  monthlyApiCalls: number;
  storageBytes: number;
  costLimitCents: number;
}

export interface UpdateSubscriptionRequest {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  cancelAtPeriodEnd?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// ========================================
// SERVICE
// ========================================

export class BillingService {
  private static instance: BillingService;

  private constructor() {}

  static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  // ========================================
  // SUBSCRIPTIONS
  // ========================================

  /**
   * Récupère l'abonnement actuel
   */
  async getSubscription(brandId: string, useCache: boolean = true): Promise<Subscription | null> {
    try {
      // Check cache
      if (useCache) {
        const cached = cacheService.get<Subscription>(`subscription:${brandId}`);
        if (cached) {
          logger.info('Cache hit for subscription', { brandId });
          return cached;
        }
      }

      // Fetch brand from database
      const brand = await db.brand.findUnique({
        where: { id: brandId },
        select: { stripeSubscriptionId: true, stripeCustomerId: true, plan: true },
      });

      if (!brand?.stripeSubscriptionId) {
        // Pas d'abonnement Stripe, retourner le plan depuis la DB
        if (brand?.plan) {
          return {
            id: `local_${brandId}`,
            status: 'active',
            plan: brand.plan.toLowerCase() as any,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            cancelAtPeriodEnd: false,
          };
        }
        return null;
      }

      // Fetch from Stripe
      if (!isStripeConfigured()) {
        logger.warn('Stripe not configured, returning null subscription');
        return null;
      }

      const stripe = getStripe();
      const stripeSubscription = await stripe.subscriptions.retrieve(brand.stripeSubscriptionId);
      const stripeSubscriptionData: any =
        (stripeSubscription as any).data ?? stripeSubscription;

      const { start: currentPeriodStart, end: currentPeriodEnd } =
        this.getSubscriptionPeriod(stripeSubscriptionData);

      // Convert Stripe subscription to our Subscription type
      const subscription: Subscription = {
        id: stripeSubscriptionData.id,
        status: stripeSubscriptionData.status as any,
        plan: this.mapStripePlanToOurPlan(stripeSubscriptionData.items.data[0]?.price.id),
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscriptionData.cancel_at_period_end,
        stripeSubscriptionId: stripeSubscriptionData.id,
        stripeCustomerId: stripeSubscriptionData.customer as string,
      };

      // Cache for 5 minutes
      if (useCache) {
        cacheService.set(`subscription:${brandId}`, subscription, { ttl: 300 * 1000 });
      }

      return subscription;
    } catch (error: any) {
      logger.error('Error fetching subscription', { error, brandId });
      throw error;
    }
  }

  /**
   * Map Stripe price ID to our plan type
   */
  private getSubscriptionPeriod(
    stripeSubscription: Stripe.Subscription
  ): { start: Date; end: Date } {
    const firstItem = stripeSubscription.items?.data?.[0];
    const startSeconds =
      firstItem?.current_period_start ?? stripeSubscription.billing_cycle_anchor;
    const endSeconds =
      firstItem?.current_period_end ??
      (startSeconds ? startSeconds + 30 * 24 * 60 * 60 : Math.floor(Date.now() / 1000));

    return {
      start: new Date(startSeconds * 1000),
      end: new Date(endSeconds * 1000),
    };
  }

  /**
   * Map Stripe price ID to our plan type
   */
  private mapStripePlanToOurPlan(priceId?: string): 'free' | 'starter' | 'pro' | 'enterprise' {
    if (!priceId) return 'free';

    // Map based on environment variables or price IDs
    const starterPrices = [
      process.env.STRIPE_PRICE_STARTER_MONTHLY,
      process.env.STRIPE_PRICE_STARTER_YEARLY,
    ];
    const proPrices = [
      process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
      process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
    ];
    const businessPrices = [
      process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
      process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    ];

    if (starterPrices.includes(priceId)) return 'starter';
    if (proPrices.includes(priceId)) return 'pro';
    if (businessPrices.includes(priceId)) return 'enterprise';

    // Default fallback
    return 'free';
  }

  /**
   * Met à jour l'abonnement
   */
  async updateSubscription(
    brandId: string,
    request: UpdateSubscriptionRequest
  ): Promise<Subscription> {
    try {
      logger.info('Updating subscription', { brandId, plan: request.plan });

      // Get current subscription
      const currentSubscription = await this.getSubscription(brandId, false);
      if (!currentSubscription?.stripeSubscriptionId) {
        throw new Error('No active Stripe subscription found');
      }

      // Get brand to find customer
      const brand = await db.brand.findUnique({
        where: { id: brandId },
        select: { stripeCustomerId: true },
      });

      if (!brand?.stripeCustomerId) {
        throw new Error('No Stripe customer found for brand');
      }

      // Get price ID for new plan
      const priceId = this.getPriceIdForPlan(request.plan);
      if (!priceId) {
        throw new Error(`No price ID configured for plan: ${request.plan}`);
      }

      // Update subscription via Stripe API
      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();

      // Update subscription with new plan
      const updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: currentSubscription.stripeSubscriptionId,
              price: priceId,
            },
          ],
          proration_behavior: 'always_invoice', // Prorate immediately
          cancel_at_period_end: request.cancelAtPeriodEnd || false,
        }
      );
      const updatedSubscriptionData: any =
        (updatedSubscription as any).data ?? updatedSubscription;

      // Update database
      await db.brand.update({
        where: { id: brandId },
        data: {
          plan: request.plan,
          stripeSubscriptionId: updatedSubscriptionData.id,
          updatedAt: new Date(),
        },
      });

      // Convert to our Subscription type
      const { start: currentPeriodStart, end: currentPeriodEnd } =
        this.getSubscriptionPeriod(updatedSubscriptionData);

      const subscription: Subscription = {
        id: updatedSubscriptionData.id,
        status: updatedSubscriptionData.status as any,
        plan: request.plan,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: updatedSubscriptionData.cancel_at_period_end,
        stripeSubscriptionId: updatedSubscriptionData.id,
        stripeCustomerId: updatedSubscriptionData.customer as string,
      };

      // Invalidate cache
      cacheService.delete(`subscription:${brandId}`);
      cacheService.clear();

      logger.info('Subscription updated', { brandId, plan: request.plan });

      return subscription;
    } catch (error: any) {
      logger.error('Error updating subscription', { error, brandId, request });
      throw error;
    }
  }

  /**
   * Get Stripe price ID for a plan
   */
  private getPriceIdForPlan(plan: 'free' | 'starter' | 'pro' | 'enterprise'): string | null {
    const priceMap: Record<string, string | null> = {
      free: null,
      starter: process.env.STRIPE_PRICE_STARTER_MONTHLY || null,
      pro: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || null,
      enterprise: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || null,
    };

    return priceMap[plan] || null;
  }

  /**
   * Annule l'abonnement
   */
  async cancelSubscription(
    brandId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription> {
    try {
      logger.info('Cancelling subscription', { brandId, cancelAtPeriodEnd });

      const subscription = await this.getSubscription(brandId, false);
      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();

      // Cancel subscription
      const cancelledSubscription = cancelAtPeriodEnd
        ? await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          })
        : await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      const cancelledSubscriptionData =
        (cancelledSubscription as any).data ?? cancelledSubscription;

      // Update database if immediate cancellation
      if (!cancelAtPeriodEnd) {
        await db.brand.update({
          where: { id: brandId },
          data: {
            plan: 'free',
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          },
        });
      }

      const { start: currentPeriodStart, end: currentPeriodEnd } =
        this.getSubscriptionPeriod(cancelledSubscriptionData);

      // Convert to our Subscription type
      const result: Subscription = {
        id: cancelledSubscriptionData.id,
        status: cancelledSubscriptionData.status as any,
        plan: subscription.plan,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: cancelledSubscriptionData.cancel_at_period_end,
        stripeSubscriptionId: cancelledSubscriptionData.id,
        stripeCustomerId: cancelledSubscriptionData.customer as string,
      };

      // Invalidate cache
      cacheService.delete(`subscription:${brandId}`);
      cacheService.clear();

      logger.info('Subscription cancelled', { brandId, cancelAtPeriodEnd });

      return result;
    } catch (error: any) {
      logger.error('Error cancelling subscription', { error, brandId });
      throw error;
    }
  }

  /**
   * Réactive un abonnement annulé
   */
  async reactivateSubscription(brandId: string): Promise<Subscription> {
    try {
      logger.info('Reactivating subscription', { brandId });

      const subscription = await this.getSubscription(brandId, false);
      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();

      // Reactivate subscription
      const reactivatedSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      );
      const reactivatedSubscriptionData =
        (reactivatedSubscription as any).data ?? reactivatedSubscription;

      const { start: reactivatedStart, end: reactivatedEnd } =
        this.getSubscriptionPeriod(reactivatedSubscriptionData);

      // Convert to our Subscription type
      const result: Subscription = {
        id: reactivatedSubscriptionData.id,
        status: reactivatedSubscriptionData.status as any,
        plan: subscription.plan,
        currentPeriodStart: reactivatedStart,
        currentPeriodEnd: reactivatedEnd,
        cancelAtPeriodEnd: reactivatedSubscriptionData.cancel_at_period_end,
        stripeSubscriptionId: reactivatedSubscriptionData.id,
        stripeCustomerId: reactivatedSubscriptionData.customer as string,
      };

      // Invalidate cache
      cacheService.delete(`subscription:${brandId}`);
      cacheService.clear();

      logger.info('Subscription reactivated', { brandId });

      return result;
    } catch (error: any) {
      logger.error('Error reactivating subscription', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // INVOICES
  // ========================================

  /**
   * Liste les factures
   */
  async listInvoices(
    brandId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<{ invoices: Invoice[]; total: number; hasMore: boolean }> {
    try {
      // Get brand to find Stripe customer
      const brand = await db.brand.findUnique({
        where: { id: brandId },
        select: { stripeCustomerId: true },
      });

      if (!brand?.stripeCustomerId) {
        return {
          invoices: [],
          total: 0,
          hasMore: false,
        };
      }

      if (!isStripeConfigured()) {
        logger.warn('Stripe not configured, returning empty invoices list');
        return {
          invoices: [],
          total: 0,
          hasMore: false,
        };
      }

      const stripe = getStripe();

      // Fetch invoices from Stripe
      const stripeInvoices = await stripe.invoices.list({
        customer: brand.stripeCustomerId,
        limit: options?.limit || 20,
        starting_after: options?.offset ? `inv_${options.offset}` : undefined,
        status: options?.status as any,
      });

      // Convert Stripe invoices to our Invoice type
      const invoices: Invoice[] = stripeInvoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number || inv.id,
        amount: inv.amount_paid / 100, // Convert from cents
        currency: inv.currency.toUpperCase(),
        status: inv.status as any,
        dueDate: inv.due_date ? new Date(inv.due_date * 1000) : undefined,
        paidAt: inv.status_transitions.paid_at
          ? new Date(inv.status_transitions.paid_at * 1000)
          : undefined,
        pdfUrl: inv.invoice_pdf || undefined,
        hostedInvoiceUrl: inv.hosted_invoice_url || undefined,
        lineItems: inv.lines.data.map((line) => {
          const quantity = line.quantity || 1;
          const unitPrice = quantity ? line.amount / 100 / quantity : 0;

          return {
          id: line.id,
          description: line.description || '',
          amount: line.amount / 100,
            quantity,
            unitPrice,
          };
        }),
        createdAt: new Date(inv.created * 1000),
      }));

      return {
        invoices,
        total: stripeInvoices.data.length,
        hasMore: stripeInvoices.has_more,
      };
    } catch (error: any) {
      logger.error('Error listing invoices', { error, brandId });
      throw error;
    }
  }

  /**
   * Récupère une facture par ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();
      const stripeInvoice = await stripe.invoices.retrieve(invoiceId);

      // Convert Stripe invoice to our Invoice type
      const invoice: Invoice = {
        id: stripeInvoice.id,
        number: stripeInvoice.number || stripeInvoice.id,
        amount: stripeInvoice.amount_paid / 100,
        currency: stripeInvoice.currency.toUpperCase(),
        status: stripeInvoice.status as any,
        dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : undefined,
        paidAt: stripeInvoice.status_transitions.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
          : undefined,
        pdfUrl: stripeInvoice.invoice_pdf || undefined,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url || undefined,
        lineItems: stripeInvoice.lines.data.map((line) => {
          const quantity = line.quantity || 1;
          const unitPrice = quantity ? line.amount / 100 / quantity : 0;

          return {
            id: line.id,
            description: line.description || '',
            amount: line.amount / 100,
            quantity,
            unitPrice,
          };
        }),
        createdAt: new Date(stripeInvoice.created * 1000),
      };

      return invoice;
    } catch (error: any) {
      logger.error('Error fetching invoice', { error, invoiceId });
      throw error;
    }
  }

  /**
   * Télécharge le PDF d'une facture
   */
  async downloadInvoice(invoiceId: string): Promise<{ url: string }> {
    try {
      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();
      const invoice = await stripe.invoices.retrieve(invoiceId);

      if (!invoice.invoice_pdf) {
        throw new Error('Invoice PDF not available');
      }

      return { url: invoice.invoice_pdf };
    } catch (error: any) {
      logger.error('Error downloading invoice', { error, invoiceId });
      throw error;
    }
  }

  // ========================================
  // USAGE & LIMITS
  // ========================================

  /**
   * Récupère les métriques d'usage
   */
  async getUsageMetrics(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<UsageMetrics> {
    try {
      // Default to current month if not specified
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();

      // Fetch from database
      const metrics = await db.usageMetric.findMany({
        where: {
          brandId,
          timestamp: {
            gte: start,
            lte: end,
          },
        },
      });

      // Aggregate metrics
      const aggregated = metrics.reduce(
        (
          acc: { customizations: number; renders: number; apiCalls: number; storageBytes: number },
          metric: { data: unknown }
        ) => {
          const data = metric.data as any;
          return {
            customizations: acc.customizations + (data.customizations || 0),
            renders: acc.renders + (data.renders || 0),
            apiCalls: acc.apiCalls + (data.apiCalls || 0),
            storageBytes: acc.storageBytes + (data.storageBytes || 0),
          };
        },
        {
          customizations: 0,
          renders: 0,
          apiCalls: 0,
          storageBytes: 0,
        }
      );

      return {
        ...aggregated,
        periodStart: start,
        periodEnd: end,
      };
    } catch (error: any) {
      logger.error('Error fetching usage metrics', { error, brandId });
      throw error;
    }
  }

  /**
   * Récupère les limites de facturation
   */
  async getBillingLimits(brandId: string): Promise<BillingLimits> {
    try {
      // Fetch from brand settings
      const brand = await db.brand.findUnique({
        where: { id: brandId },
        select: { limits: true, plan: true },
      });

      // Default limits based on plan
      const defaultLimits: Record<string, BillingLimits> = {
        free: {
          monthlyCustomizations: 10,
          monthlyRenders: 5,
          monthlyApiCalls: 100,
          storageBytes: 100 * 1024 * 1024, // 100MB
          costLimitCents: 0,
        },
        starter: {
          monthlyCustomizations: 100,
          monthlyRenders: 50,
          monthlyApiCalls: 1000,
          storageBytes: 10 * 1024 * 1024 * 1024, // 10GB
          costLimitCents: 5000, // 50€
        },
        pro: {
          monthlyCustomizations: 1000,
          monthlyRenders: 500,
          monthlyApiCalls: 10000,
          storageBytes: 100 * 1024 * 1024 * 1024, // 100GB
          costLimitCents: 50000, // 500€
        },
        enterprise: {
          monthlyCustomizations: 10000,
          monthlyRenders: 5000,
          monthlyApiCalls: 100000,
          storageBytes: 1024 * 1024 * 1024 * 1024, // 1TB
          costLimitCents: 500000, // 5000€
        },
      };

      // Use brand limits if available, otherwise use plan defaults
      if (brand?.limits) {
        const customLimits = brand.limits as any;
        return {
          monthlyCustomizations: customLimits.monthlyCustomizations || defaultLimits[brand.plan || 'free'].monthlyCustomizations,
          monthlyRenders: customLimits.monthlyRenders || defaultLimits[brand.plan || 'free'].monthlyRenders,
          monthlyApiCalls: customLimits.monthlyApiCalls || defaultLimits[brand.plan || 'free'].monthlyApiCalls,
          storageBytes: customLimits.storageBytes || defaultLimits[brand.plan || 'free'].storageBytes,
          costLimitCents: customLimits.costLimitCents || defaultLimits[brand.plan || 'free'].costLimitCents,
        };
      }

      return defaultLimits[brand?.plan || 'free'];
    } catch (error: any) {
      logger.error('Error fetching billing limits', { error, brandId });
      throw error;
    }
  }

  /**
   * Vérifie si une limite est dépassée
   */
  async checkLimit(
    brandId: string,
    metric: 'customizations' | 'renders' | 'apiCalls' | 'storage'
  ): Promise<{ withinLimit: boolean; current: number; limit: number; percentage: number }> {
    try {
      const [usage, limits] = await Promise.all([
        this.getUsageMetrics(brandId),
        this.getBillingLimits(brandId),
      ]);

      let current = 0;
      let limit = 0;

      switch (metric) {
        case 'customizations':
          current = usage.customizations;
          limit = limits.monthlyCustomizations;
          break;
        case 'renders':
          current = usage.renders;
          limit = limits.monthlyRenders;
          break;
        case 'apiCalls':
          current = usage.apiCalls;
          limit = limits.monthlyApiCalls;
          break;
        case 'storage':
          current = usage.storageBytes;
          limit = limits.storageBytes;
          break;
      }

      const percentage = limit > 0 ? (current / limit) * 100 : 0;

      return {
        withinLimit: current < limit,
        current,
        limit,
        percentage: Math.min(percentage, 100),
      };
    } catch (error: any) {
      logger.error('Error checking limit', { error, brandId, metric });
      throw error;
    }
  }

  // ========================================
  // PAYMENT METHODS
  // ========================================

  /**
   * Liste les méthodes de paiement
   */
  async listPaymentMethods(brandId: string): Promise<PaymentMethod[]> {
    try {
      // Get brand to find Stripe customer
      const brand = await db.brand.findUnique({
        where: { id: brandId },
        select: { stripeCustomerId: true },
      });

      if (!brand?.stripeCustomerId) {
        return [];
      }

      if (!isStripeConfigured()) {
        logger.warn('Stripe not configured, returning empty payment methods list');
        return [];
      }

      const stripe = getStripe();

      // Fetch payment methods from Stripe
      const stripePaymentMethods = await stripe.paymentMethods.list({
        customer: brand.stripeCustomerId,
      });

      // Get customer to find default payment method
      const customer = await stripe.customers.retrieve(brand.stripeCustomerId);
      const defaultPaymentMethodId =
        'deleted' in customer && customer.deleted
          ? null
          : customer.invoice_settings?.default_payment_method;

      // Convert Stripe payment methods to our PaymentMethod type
      const paymentMethods: PaymentMethod[] = stripePaymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type as 'card' | 'bank_account',
        last4: (pm.card?.last4 ?? pm.us_bank_account?.last4) || undefined,
        brand: pm.card?.brand ?? undefined,
        expiryMonth: pm.card?.exp_month ?? undefined,
        expiryYear: pm.card?.exp_year ?? undefined,
        isDefault: pm.id === defaultPaymentMethodId,
      }));

      return paymentMethods;
    } catch (error: any) {
      logger.error('Error listing payment methods', { error, brandId });
      throw error;
    }
  }

  /**
   * Ajoute une méthode de paiement
   */
  async addPaymentMethod(
    brandId: string,
    paymentMethodId: string
  ): Promise<PaymentMethod> {
    try {
      logger.info('Adding payment method', { brandId, paymentMethodId });

      // Get brand to find Stripe customer
      const brand = await db.brand.findUnique({
        where: { id: brandId },
        select: { stripeCustomerId: true },
      });

      if (!brand?.stripeCustomerId) {
        throw new Error('No Stripe customer found for brand');
      }

      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();

      // Attach payment method to customer
      const attachedPaymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: brand.stripeCustomerId,
      });

      // Convert to our PaymentMethod type
      const paymentMethod: PaymentMethod = {
        id: attachedPaymentMethod.id,
        type: attachedPaymentMethod.type as 'card' | 'bank_account',
        last4:
          (attachedPaymentMethod.card?.last4 ?? attachedPaymentMethod.us_bank_account?.last4) ||
          undefined,
        brand: attachedPaymentMethod.card?.brand ?? undefined,
        expiryMonth: attachedPaymentMethod.card?.exp_month ?? undefined,
        expiryYear: attachedPaymentMethod.card?.exp_year ?? undefined,
        isDefault: false, // New payment method is not default by default
      };

      logger.info('Payment method added', { brandId, paymentMethodId });

      return paymentMethod;
    } catch (error: any) {
      logger.error('Error adding payment method', { error, brandId, paymentMethodId });
      throw error;
    }
  }

  /**
   * Supprime une méthode de paiement
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      logger.info('Removing payment method', { paymentMethodId });

      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();

      // Detach payment method from customer
      await stripe.paymentMethods.detach(paymentMethodId);

      logger.info('Payment method removed', { paymentMethodId });
    } catch (error: any) {
      logger.error('Error removing payment method', { error, paymentMethodId });
      throw error;
    }
  }

  /**
   * Définit une méthode de paiement par défaut
   */
  async setDefaultPaymentMethod(
    brandId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      logger.info('Setting default payment method', { brandId, paymentMethodId });

      // Get brand to find Stripe customer
      const brand = await db.brand.findUnique({
        where: { id: brandId },
        select: { stripeCustomerId: true },
      });

      if (!brand?.stripeCustomerId) {
        throw new Error('No Stripe customer found for brand');
      }

      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();

      // Update customer default payment method
      await stripe.customers.update(brand.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      logger.info('Default payment method set', { brandId, paymentMethodId });
    } catch (error: any) {
      logger.error('Error setting default payment method', { error, brandId, paymentMethodId });
      throw error;
    }
  }

  // ========================================
  // REFUNDS
  // ========================================

  /**
   * Crée un remboursement
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ id: string; status: string; amount: number }> {
    try {
      logger.info('Creating refund', { paymentIntentId, amount, reason });

      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured');
      }

      const stripe = getStripe();

      // Create refund via Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
        reason: reason as any,
      });

      logger.info('Refund created', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount / 100,
      });

      return {
        id: refund.id,
        status: String(refund.status ?? 'unknown'),
        amount: refund.amount / 100, // Convert from cents
      };
    } catch (error: any) {
      logger.error('Error creating refund', { error, paymentIntentId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const billingService = BillingService.getInstance();

