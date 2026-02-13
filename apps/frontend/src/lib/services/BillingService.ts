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

/** Raw API subscription shape (backend/Stripe) */
interface RawSubscription {
  id?: string;
  plan?: string;
  planId?: string;
  status?: string;
  brandId?: string;
  currentPeriodStart?: string | number;
  currentPeriodEnd?: string | number;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  [key: string]: unknown;
}

/** API response for invoices list */
interface InvoicesListResponse {
  invoices?: unknown[];
  data?: unknown[];
  total?: number;
  hasMore?: boolean;
}

/** Raw invoice line (API/Stripe) */
interface RawInvoiceLine {
  id?: string;
  description?: string;
  amount?: number;
  quantity?: number;
  unitPrice?: number;
  unit_price?: number;
  [key: string]: unknown;
}

/** Raw invoice (API/Stripe) */
interface RawInvoice {
  id?: string;
  number?: string;
  amount?: number;
  amount_paid?: number;
  currency?: string;
  status?: string;
  dueDate?: string;
  due_date?: number;
  paidAt?: string;
  status_transitions?: { paid_at?: number };
  pdfUrl?: string;
  invoice_pdf?: string;
  hostedInvoiceUrl?: string;
  hosted_invoice_url?: string;
  lineItems?: RawInvoiceLine[];
  lines?: { data?: RawInvoiceLine[] };
  createdAt?: string;
  created?: number;
  [key: string]: unknown;
}

/** PDF response shape */
interface InvoicePdfResponse {
  data?: { url?: string; invoice_pdf?: string };
  url?: string;
  invoice_pdf?: string;
}

/** Brand API response for billing limits */
interface BrandWithLimits {
  plan?: string;
  limits?: BillingLimits;
  [key: string]: unknown;
}

/** Payment method raw (API/Stripe) */
interface RawPaymentMethod {
  id?: string;
  type?: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  exp_month?: number;
  expiryYear?: number;
  exp_year?: number;
  isDefault?: boolean;
  card?: { last4?: string; brand?: string; exp_month?: number; exp_year?: number };
  [key: string]: unknown;
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

  private normalizeSubscription(raw: RawSubscription | Record<string, unknown> | null): Subscription | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as RawSubscription;
    const plan = String(r.plan || r.planId || 'free').toLowerCase();
    return {
      id: r.id || `local_${r.brandId || 'current'}`,
      status: (r.status || 'active') as Subscription['status'],
      plan: ['free', 'starter', 'pro', 'enterprise'].includes(plan) ? plan as Subscription['plan'] : 'free',
      currentPeriodStart: r.currentPeriodStart ? new Date(r.currentPeriodStart) : new Date(),
      currentPeriodEnd: r.currentPeriodEnd ? new Date(r.currentPeriodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: !!r.cancelAtPeriodEnd,
      stripeSubscriptionId: r.stripeSubscriptionId,
      stripeCustomerId: r.stripeCustomerId,
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
      const subscription = this.normalizeSubscription(raw as Record<string, unknown> | RawSubscription | null);
      if (subscription && useCache) {
        cacheService.set(`subscription:${brandId}`, subscription, { ttl: 300 * 1000 });
      }
      return subscription;
    } catch (error: unknown) {
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
      const subscription = this.normalizeSubscription((raw ?? { plan: request.plan }) as Record<string, unknown> | RawSubscription | null);
      if (!subscription) throw new Error('Failed to update subscription');

      cacheService.delete(`subscription:${brandId}`);
      logger.info('Subscription updated', { brandId, plan: request.plan });
      return subscription;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
      const res = await api.get<InvoicesListResponse>(
        '/api/v1/billing/invoices',
        { params: { brandId, limit: options?.limit ?? 20, offset: options?.offset, status: options?.status } }
      );
      const rawList = Array.isArray(res?.invoices) ? res.invoices : Array.isArray(res?.data) ? res.data : [];
      const invoices: Invoice[] = (rawList as RawInvoice[]).map((inv) => ({
        id: inv.id ?? '',
        number: inv.number ?? inv.id ?? '',
        amount: typeof inv.amount === 'number' ? inv.amount : (inv.amount_paid ?? 0) / 100,
        currency: (inv.currency ?? 'eur').toUpperCase(),
        status: (inv.status ?? 'open') as Invoice['status'],
        dueDate: inv.dueDate ? new Date(inv.dueDate) : inv.due_date ? new Date(inv.due_date * 1000) : undefined,
        paidAt: inv.paidAt ? new Date(inv.paidAt) : inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : undefined,
        pdfUrl: inv.pdfUrl ?? inv.invoice_pdf,
        hostedInvoiceUrl: inv.hostedInvoiceUrl ?? inv.hosted_invoice_url,
        lineItems: Array.isArray(inv.lineItems) ? inv.lineItems.map((line: RawInvoiceLine) => ({
          id: line.id ?? '',
          description: line.description ?? '',
          amount: typeof line.amount === 'number' ? line.amount : (line.amount ?? 0) / 100,
          quantity: line.quantity ?? 1,
          unitPrice: line.unitPrice ?? (line.amount ?? 0) / 100 / (line.quantity || 1),
        })) : Array.isArray(inv.lines?.data) ? inv.lines.data.map((line: RawInvoiceLine) => {
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

      const total = res?.total ?? rawList.length;
      const hasMore = res?.hasMore ?? false;

      return {
        invoices,
        total,
        hasMore,
      };
    } catch (error: unknown) {
      logger.error('Error listing invoices', { error, brandId });
      throw error;
    }
  }

  /**
   * Récupère une facture par ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const raw = await api.get<{ data?: RawInvoice } | RawInvoice>(`/api/v1/billing/invoices/${invoiceId}`);
      const inv: RawInvoice = ((raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw) ?? {}) as RawInvoice;
      const lineItems = Array.isArray(inv.lineItems)
        ? inv.lineItems.map((line: RawInvoiceLine) => ({
            id: line.id ?? '',
            description: line.description ?? '',
            amount: typeof line.amount === 'number' ? line.amount : (line.amount ?? 0) / 100,
            quantity: line.quantity ?? 1,
            unitPrice: line.unitPrice ?? 0,
          }))
        : Array.isArray(inv.lines?.data)
          ? inv.lines.data.map((line: RawInvoiceLine) => {
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
    } catch (error: unknown) {
      logger.error('Error fetching invoice', { error, invoiceId });
      throw error;
    }
  }

  /**
   * Télécharge le PDF d'une facture
   */
  async downloadInvoice(invoiceId: string): Promise<{ url: string }> {
    try {
      const response = await api.get<InvoicePdfResponse>(`/api/v1/billing/invoices/${invoiceId}/pdf`);
      const data = response?.data ?? response;
      const url = data?.url || data?.invoice_pdf;

      if (!url) {
        throw new Error('Invoice PDF not available');
      }

      return { url };
    } catch (error: unknown) {
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
      const wrapped = raw as UsageMetrics | { data?: Partial<UsageMetrics> };
      const data = wrapped && typeof wrapped === 'object' && 'data' in wrapped ? wrapped.data : (raw as Partial<UsageMetrics>);
      const metrics = (data ?? {}) as Partial<UsageMetrics>;
      return {
        customizations: metrics.customizations ?? 0,
        renders: metrics.renders ?? 0,
        apiCalls: metrics.apiCalls ?? 0,
        storageBytes: metrics.storageBytes ?? 0,
        periodStart: metrics.periodStart ? new Date(metrics.periodStart as Date) : start,
        periodEnd: metrics.periodEnd ? new Date(metrics.periodEnd as Date) : end,
      };
    } catch (error: unknown) {
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
      const brand = (await endpoints.brands.current().catch(() => null)) as BrandWithLimits | null;
      const plan = (brand?.plan ?? 'free').toLowerCase();
      const base = this.defaultLimits[plan as keyof typeof this.defaultLimits] ?? this.defaultLimits.free;
      const custom = brand?.limits;
      if (!custom) return base;
      return {
        monthlyCustomizations: custom.monthlyCustomizations ?? base.monthlyCustomizations,
        monthlyRenders: custom.monthlyRenders ?? base.monthlyRenders,
        monthlyApiCalls: custom.monthlyApiCalls ?? base.monthlyApiCalls,
        storageBytes: custom.storageBytes ?? base.storageBytes,
        costLimitCents: custom.costLimitCents ?? base.costLimitCents,
      };
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
      const list = Array.isArray(data)
        ? data
        : (data as { paymentMethods?: RawPaymentMethod[]; data?: RawPaymentMethod[] }).paymentMethods
          ?? (data as { data?: RawPaymentMethod[] }).data
          ?? [];
      return (list as RawPaymentMethod[]).map((pm) => ({
        id: String(pm.id ?? ''),
        type: (pm.type ?? 'card') as 'card' | 'bank_account',
        last4: pm.last4 ?? pm.card?.last4,
        brand: pm.brand ?? pm.card?.brand,
        expiryMonth: pm.expiryMonth ?? pm.card?.exp_month,
        expiryYear: pm.expiryYear ?? pm.card?.exp_year,
        isDefault: !!pm.isDefault,
      }));
    } catch (error: unknown) {
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
      const data = (pm as { paymentMethod?: RawPaymentMethod } | RawPaymentMethod)?.paymentMethod ?? (pm as RawPaymentMethod);
      const d = (data ?? {}) as Record<string, unknown> & { id?: string; type?: string; last4?: string; brand?: string; expiryMonth?: number; exp_month?: number; expiryYear?: number; exp_year?: number };
      return {
        id: String(d.id ?? paymentMethodId),
        type: (d.type ?? 'card') as 'card' | 'bank_account',
        last4: d.last4,
        brand: d.brand,
        expiryMonth: d.expiryMonth ?? d.exp_month,
        expiryYear: d.expiryYear ?? d.exp_year,
        isDefault: false,
      };
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Error creating refund', { error, paymentIntentId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const billingService = BillingService.getInstance();

