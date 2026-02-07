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
import { api, endpoints } from '@/lib/api/client';

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

  private normalizeSubscription(raw: any): Subscription | null {
    if (!raw) return null;
    const plan = (raw.plan || raw.planId || 'free').toLowerCase();
    return {
      id: raw.id || `local_${raw.brandId || 'current'}`,
      status: (raw.status || 'active') as Subscription['status'],
      plan: ['free', 'starter', 'pro', 'enterprise'].includes(plan) ? plan as Subscription['plan'] : 'free',
      currentPeriodStart: raw.currentPeriodStart ? new Date(raw.currentPeriodStart) : new Date(),
      currentPeriodEnd: raw.currentPeriodEnd ? new Date(raw.currentPeriodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: !!raw.cancelAtPeriodEnd,
      stripeSubscriptionId: raw.stripeSubscriptionId,
      stripeCustomerId: raw.stripeCustomerId,
    };
  }

  /**
   * Récupère l'abonnement actuel (via backend API)
   */
  async getSubscription(brandId: string, useCache: boolean = true): Promise<Subscription | null> {
    try {
      if (useCache) {
        const cached = cacheService.get<Subscription>(`subscription:${brandId}`);
        if (cached) {
          logger.info('Cache hit for subscription', { brandId });
          return cached;
        }
      }

      const raw = await endpoints.billing.subscription();
      const subscription = this.normalizeSubscription(raw);
      if (subscription && useCache) {
        cacheService.set(`subscription:${brandId}`, subscription, { ttl: 300 * 1000 });
      }
      return subscription;
    } catch (error: any) {
      logger.error('Error fetching subscription', { error, brandId });
      throw error;
    }
  }

  /**
   * Met à jour l'abonnement (via backend API)
   */
  async updateSubscription(
    brandId: string,
    request: UpdateSubscriptionRequest
  ): Promise<Subscription> {
    try {
      logger.info('Updating subscription', { brandId, plan: request.plan });

      const raw = await endpoints.billing.changePlan({
        planId: request.plan,
        billingInterval: undefined,
      });
      const subscription = this.normalizeSubscription(raw ?? { plan: request.plan });
      if (!subscription) throw new Error('Failed to update subscription');

      cacheService.delete(`subscription:${brandId}`);
      logger.info('Subscription updated', { brandId, plan: request.plan });
      return subscription;
    } catch (error: any) {
      logger.error('Error updating subscription', { error, brandId, request });
      throw error;
    }
  }

  /**
   * Annule l'abonnement (via backend API)
   */
  async cancelSubscription(
    brandId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription> {
    try {
      logger.info('Cancelling subscription', { brandId, cancelAtPeriodEnd });

      await endpoints.billing.cancelSubscription(!cancelAtPeriodEnd);
      const subscription = await this.getSubscription(brandId, false);
      cacheService.delete(`subscription:${brandId}`);

      logger.info('Subscription cancelled', { brandId, cancelAtPeriodEnd });
      return subscription ?? this.normalizeSubscription({ plan: 'free', status: 'active' })!;
    } catch (error: any) {
      logger.error('Error cancelling subscription', { error, brandId });
      throw error;
    }
  }

  /**
   * Réactive un abonnement annulé (via backend API)
   */
  async reactivateSubscription(brandId: string): Promise<Subscription> {
    try {
      logger.info('Reactivating subscription', { brandId });
      await endpoints.billing.cancel(); // cancel scheduled downgrade / reactivate
      const subscription = await this.getSubscription(brandId, false);
      cacheService.delete(`subscription:${brandId}`);
      logger.info('Subscription reactivated', { brandId });
      return subscription ?? this.normalizeSubscription({ plan: 'free', status: 'active' })!;
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
      const res = await api.get<{ data?: unknown[]; invoices?: unknown[]; total?: number; hasMore?: boolean }>(
        '/api/v1/billing/invoices',
        { params: { brandId, limit: options?.limit ?? 20, offset: options?.offset, status: options?.status } }
      );
      const rawList = Array.isArray((res as any).invoices) ? (res as any).invoices : Array.isArray((res as any).data) ? (res as any).data : [];
      const invoices: Invoice[] = rawList.map((inv: any) => ({
        id: inv.id ?? '',
        number: inv.number ?? inv.id ?? '',
        amount: typeof inv.amount === 'number' ? inv.amount : (inv.amount_paid ?? 0) / 100,
        currency: (inv.currency ?? 'eur').toUpperCase(),
        status: (inv.status ?? 'open') as Invoice['status'],
        dueDate: inv.dueDate ? new Date(inv.dueDate) : inv.due_date ? new Date(inv.due_date * 1000) : undefined,
        paidAt: inv.paidAt ? new Date(inv.paidAt) : inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : undefined,
        pdfUrl: inv.pdfUrl ?? inv.invoice_pdf,
        hostedInvoiceUrl: inv.hostedInvoiceUrl ?? inv.hosted_invoice_url,
        lineItems: Array.isArray(inv.lineItems) ? inv.lineItems.map((line: any) => ({
          id: line.id ?? '',
          description: line.description ?? '',
          amount: typeof line.amount === 'number' ? line.amount : (line.amount ?? 0) / 100,
          quantity: line.quantity ?? 1,
          unitPrice: line.unitPrice ?? (line.amount ?? 0) / 100 / (line.quantity || 1),
        })) : Array.isArray(inv.lines?.data) ? inv.lines.data.map((line: any) => {
          const quantity = line.quantity ?? 1;
          const unitPrice = quantity ? (line.amount ?? 0) / 100 / quantity : 0;
          return {
            id: line.id ?? '',
            description: line.description ?? '',
            amount: (line.amount ?? 0) / 100,
            quantity,
            unitPrice,
          };
        }) : [],
        createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date((inv.created ?? 0) * 1000),
      }));

      const total = (res as any).total ?? rawList.length;
      const hasMore = (res as any).hasMore ?? false;

      return {
        invoices,
        total,
        hasMore,
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
      const raw = await api.get<any>(`/api/v1/billing/invoices/${invoiceId}`);
      const inv = raw?.data ?? raw;
      const lineItems = Array.isArray(inv.lineItems)
        ? inv.lineItems.map((line: any) => ({
            id: line.id ?? '',
            description: line.description ?? '',
            amount: typeof line.amount === 'number' ? line.amount : (line.amount ?? 0) / 100,
            quantity: line.quantity ?? 1,
            unitPrice: line.unitPrice ?? 0,
          }))
        : Array.isArray(inv.lines?.data)
          ? inv.lines.data.map((line: any) => {
              const quantity = line.quantity ?? 1;
              const unitPrice = quantity ? (line.amount ?? 0) / 100 / quantity : 0;
              return {
                id: line.id ?? '',
                description: line.description ?? '',
                amount: (line.amount ?? 0) / 100,
                quantity,
                unitPrice,
              };
            })
          : [];

      return {
        id: inv.id ?? invoiceId,
        number: inv.number ?? inv.id ?? invoiceId,
        amount: typeof inv.amount === 'number' ? inv.amount : (inv.amount_paid ?? 0) / 100,
        currency: (inv.currency ?? 'eur').toUpperCase(),
        status: (inv.status ?? 'open') as Invoice['status'],
        dueDate: inv.dueDate ? new Date(inv.dueDate) : inv.due_date ? new Date(inv.due_date * 1000) : undefined,
        paidAt: inv.paidAt ? new Date(inv.paidAt) : inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : undefined,
        pdfUrl: inv.pdfUrl ?? inv.invoice_pdf,
        hostedInvoiceUrl: inv.hostedInvoiceUrl ?? inv.hosted_invoice_url,
        lineItems,
        createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date((inv.created ?? 0) * 1000),
      };
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
      const response = await api.get(`/api/v1/billing/invoices/${invoiceId}/pdf`) as any;
      const data = response?.data;
      const url = data?.url || data?.invoice_pdf;

      if (!url) {
        throw new Error('Invoice PDF not available');
      }

      return { url };
    } catch (error: any) {
      logger.error('Error downloading invoice', { error, invoiceId });
      throw error;
    }
  }

  // ========================================
  // USAGE & LIMITS
  // ========================================

  /**
   * Récupère les métriques d'usage (via backend API)
   */
  async getUsageMetrics(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<UsageMetrics> {
    try {
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();

      const raw = await api.get<UsageMetrics | { data: UsageMetrics }>(
        '/api/v1/billing/usage',
        { params: { brandId, periodStart: start.toISOString(), periodEnd: end.toISOString() } }
      );
      const data = (raw as any)?.data ?? raw;
      return {
        customizations: data?.customizations ?? 0,
        renders: data?.renders ?? 0,
        apiCalls: data?.apiCalls ?? 0,
        storageBytes: data?.storageBytes ?? 0,
        periodStart: data?.periodStart ? new Date(data.periodStart) : start,
        periodEnd: data?.periodEnd ? new Date(data.periodEnd) : end,
      };
    } catch (error: any) {
      logger.error('Error fetching usage metrics', { error, brandId });
      throw error;
    }
  }

  private readonly defaultLimits: Record<string, BillingLimits> = {
    free: {
      monthlyCustomizations: 10,
      monthlyRenders: 5,
      monthlyApiCalls: 100,
      storageBytes: 100 * 1024 * 1024,
      costLimitCents: 0,
    },
    starter: {
      monthlyCustomizations: 100,
      monthlyRenders: 50,
      monthlyApiCalls: 1000,
      storageBytes: 10 * 1024 * 1024 * 1024,
      costLimitCents: 5000,
    },
    pro: {
      monthlyCustomizations: 1000,
      monthlyRenders: 500,
      monthlyApiCalls: 10000,
      storageBytes: 100 * 1024 * 1024 * 1024,
      costLimitCents: 50000,
    },
    enterprise: {
      monthlyCustomizations: 10000,
      monthlyRenders: 5000,
      monthlyApiCalls: 100000,
      storageBytes: 1024 * 1024 * 1024 * 1024,
      costLimitCents: 500000,
    },
  };

  /**
   * Récupère les limites de facturation (via backend API / brand)
   */
  async getBillingLimits(brandId: string): Promise<BillingLimits> {
    try {
      const brand = await endpoints.brands.current().catch(() => null) as any;
      const plan = (brand?.plan ?? 'free').toLowerCase();
      const base = this.defaultLimits[plan] ?? this.defaultLimits.free;
      const custom = brand?.limits;
      if (!custom) return base;
      return {
        monthlyCustomizations: custom.monthlyCustomizations ?? base.monthlyCustomizations,
        monthlyRenders: custom.monthlyRenders ?? base.monthlyRenders,
        monthlyApiCalls: custom.monthlyApiCalls ?? base.monthlyApiCalls,
        storageBytes: custom.storageBytes ?? base.storageBytes,
        costLimitCents: custom.costLimitCents ?? base.costLimitCents,
      };
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
   * Liste les méthodes de paiement (via backend API)
   */
  async listPaymentMethods(_brandId: string): Promise<PaymentMethod[]> {
    try {
      const data = await endpoints.billing.paymentMethods();
      const list = Array.isArray(data) ? data : (data as any)?.paymentMethods ?? (data as any)?.data ?? [];
      return (list as any[]).map((pm: any) => ({
        id: pm.id,
        type: (pm.type ?? 'card') as 'card' | 'bank_account',
        last4: pm.last4 ?? pm.card?.last4,
        brand: pm.brand ?? pm.card?.brand,
        expiryMonth: pm.expiryMonth ?? pm.card?.exp_month,
        expiryYear: pm.expiryYear ?? pm.card?.exp_year,
        isDefault: !!pm.isDefault,
      }));
    } catch (error: any) {
      logger.error('Error listing payment methods', { error, brandId: _brandId });
      throw error;
    }
  }

  /**
   * Ajoute une méthode de paiement (via backend API)
   */
  async addPaymentMethod(
    brandId: string,
    paymentMethodId: string
  ): Promise<PaymentMethod> {
    try {
      logger.info('Adding payment method', { brandId, paymentMethodId });
      const pm = await endpoints.billing.addPaymentMethod(paymentMethodId);
      const data = (pm as any)?.paymentMethod ?? pm;
      return {
        id: data?.id ?? paymentMethodId,
        type: (data?.type ?? 'card') as 'card' | 'bank_account',
        last4: data?.last4,
        brand: data?.brand,
        expiryMonth: data?.expiryMonth ?? data?.exp_month,
        expiryYear: data?.expiryYear ?? data?.exp_year,
        isDefault: false,
      };
    } catch (error: any) {
      logger.error('Error adding payment method', { error, brandId, paymentMethodId });
      throw error;
    }
  }

  /**
   * Supprime une méthode de paiement (via backend API)
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      logger.info('Removing payment method', { paymentMethodId });
      await api.delete('/api/v1/billing/payment-methods', {
        params: { paymentMethodId },
      });
      logger.info('Payment method removed', { paymentMethodId });
    } catch (error: any) {
      logger.error('Error removing payment method', { error, paymentMethodId });
      throw error;
    }
  }

  /**
   * Définit une méthode de paiement par défaut (via backend API)
   */
  async setDefaultPaymentMethod(
    _brandId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      logger.info('Setting default payment method', { brandId: _brandId, paymentMethodId });
      await api.post('/api/v1/billing/payment-methods/default', { paymentMethodId });
      logger.info('Default payment method set', { brandId: _brandId, paymentMethodId });
    } catch (error: any) {
      logger.error('Error setting default payment method', { error, brandId: _brandId, paymentMethodId });
      throw error;
    }
  }

  // ========================================
  // REFUNDS
  // ========================================

  /**
   * Crée un remboursement (via backend API)
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ id: string; status: string; amount: number }> {
    try {
      logger.info('Creating refund', { paymentIntentId, amount, reason });
      const refund = await api.post<{ id: string; status: string; amount: number }>(
        '/api/v1/billing/refunds',
        { paymentIntentId, amount, reason }
      );
      logger.info('Refund created', { refundId: refund.id, paymentIntentId });
      return {
        id: refund.id,
        status: refund.status ?? 'unknown',
        amount: refund.amount ?? 0,
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

