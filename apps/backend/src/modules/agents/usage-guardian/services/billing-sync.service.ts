/**
 * @fileoverview Service de synchronisation avec Stripe pour quotas
 * @module BillingSyncService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Synchronisation avec Stripe
 * - ✅ Gestion des overages
 * - ✅ Notifications de dépassement
 */

import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrencyUtils } from '@/config/currency.config';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LimitsConfigService } from './limits-config.service';

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class BillingSyncService {
  private readonly logger = new Logger(BillingSyncService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly limitsConfig: LimitsConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
    } else {
      this.stripe = null;
      this.logger.warn('Stripe not configured, billing sync disabled');
    }
  }

  /**
   * Synchronise les quotas depuis Stripe (appelé par webhook)
   */
  async syncQuotasFromStripe(brandId: string): Promise<void> {
    if (!this.stripe) {
      this.logger.warn('Stripe not configured, skipping quota sync');
      return;
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        stripeCustomerId: true,
        plan: true,
      },
    });

    if (!brand?.stripeCustomerId) {
      this.logger.warn(`No Stripe customer for brand ${brandId}`);
      return;
    }

    try {
      // Récupérer l'abonnement Stripe
      const subscriptions = await this.stripe.subscriptions.list({
        customer: brand.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        this.logger.warn(`No active subscription for brand ${brandId}`);
        return;
      }

      const subscription = subscriptions.data[0];
      const planId = this.extractPlanIdFromSubscription(subscription);

      // Mettre à jour les quotas selon le plan
      await this.updateQuotasForPlan(brandId, planId);

      this.logger.log(`Quotas synced for brand ${brandId}, plan: ${planId}`);
    } catch (error) {
      this.logger.error(`Failed to sync quotas from Stripe: ${error}`);
    }
  }

  /**
   * Gère les overages (dépassements de quotas)
   */
  async handleOverage(
    brandId: string,
    overageTokens: number,
    overageCostCents: number,
  ): Promise<void> {
    this.logger.warn(
      `Overage detected for brand ${brandId}: ${overageTokens} tokens, ${overageCostCents} cents`,
    );

    if (this.stripe) {
      try {
        const brand = await this.prisma.brand.findUnique({
          where: { id: brandId },
          select: { stripeCustomerId: true },
        });
        if (brand?.stripeCustomerId) {
          await this.stripe.invoiceItems.create({
            customer: brand.stripeCustomerId,
            amount: overageCostCents,
            currency: CurrencyUtils.getStripeCurrency(),
            description: `Usage IA - Overage ${overageTokens} tokens`,
          });
          this.logger.log(`Overage invoice item created for brand ${brandId}`);
        }
      } catch (err) {
        this.logger.error(`Failed to create overage invoice: ${err}`);
      }
    }

    await this.prisma.aIUsageLog.create({
      data: {
        brandId,
        userId: 'system', // System-generated overage record
        operation: 'overage',
        model: 'overage',
        provider: 'system',
        promptTokens: 0,
        completionTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: overageTokens,
        costCents: overageCostCents,
        latencyMs: 0,
        success: true,
        metadata: {
          type: 'overage',
          overageTokens,
        },
      },
    });
  }

  /**
   * Notifie qu'un quota est dépassé
   */
  async notifyQuotaExceeded(
    brandId: string,
    quotaType: 'tokens' | 'requests',
    used: number,
    limit: number,
  ): Promise<void> {
    this.logger.warn(
      `Quota exceeded for brand ${brandId}: ${quotaType} ${used}/${limit}`,
    );

    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: {
          users: { where: { role: 'BRAND_ADMIN' }, take: 1, select: { email: true } },
        },
      });
      const adminEmail = brand?.users?.[0]?.email;
      if (adminEmail && this.configService.get<string>('SLACK_WEBHOOK_URL')) {
        await fetch(this.configService.get<string>('SLACK_WEBHOOK_URL')!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `⚠️ Quota dépassé - Brand ${brandId}`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Quota dépassé*\nType: ${quotaType}\nUtilisé: ${used}\nLimite: ${limit}\nAdmin: ${adminEmail}`,
                },
              },
            ],
          }),
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to send quota notification: ${err}`);
    }
  }

  /**
   * Récupère les détails complets de l'abonnement Stripe pour une marque
   */
  async getSubscriptionDetails(brandId: string): Promise<{
    planId: string;
    planName: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    priceAmount: number;
    priceCurrency: string;
    interval: string;
    features: string[];
  } | null> {
    if (!this.stripe) {
      return null;
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { stripeCustomerId: true, plan: true },
    });

    if (!brand?.stripeCustomerId) {
      return null;
    }

    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: brand.stripeCustomerId,
        status: 'active',
        expand: ['data.items.data.price.product'],
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return null;
      }

      const subscription = subscriptions.data[0];
      const item = subscription.items.data[0];
      const price = item?.price;
      const product = price?.product as Stripe.Product | undefined;

      const planId = this.extractPlanIdFromSubscription(subscription);
      const planName = product?.name || this.getPlanDisplayName(planId);
      const features = this.extractFeaturesFromProduct(product);

      return {
        planId,
        planName,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceAmount: price?.unit_amount || 0,
        priceCurrency: price?.currency || CurrencyUtils.getStripeCurrency(),
        interval: price?.recurring?.interval || 'month',
        features,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscription details: ${error}`);
      return null;
    }
  }

  /**
   * Récupère l'historique des factures pour une marque
   */
  async getInvoiceHistory(brandId: string, limit = 12): Promise<Array<{
    id: string;
    number: string | null;
    status: string | null;
    amountDue: number;
    amountPaid: number;
    currency: string;
    created: Date;
    periodStart: Date;
    periodEnd: Date;
    pdfUrl: string | null;
    hostedUrl: string | null;
  }>> {
    if (!this.stripe) {
      return [];
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { stripeCustomerId: true },
    });

    if (!brand?.stripeCustomerId) {
      return [];
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: brand.stripeCustomerId,
        limit,
      });

      return invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status as string | null,
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        periodStart: new Date((invoice.period_start || invoice.created) * 1000),
        periodEnd: new Date((invoice.period_end || invoice.created) * 1000),
        pdfUrl: invoice.invoice_pdf ?? null,
        hostedUrl: invoice.hosted_invoice_url ?? null,
      }));
    } catch (error) {
      this.logger.error(`Failed to get invoice history: ${error}`);
      return [];
    }
  }

  /**
   * Récupère les méthodes de paiement pour une marque
   */
  async getPaymentMethods(brandId: string): Promise<Array<{
    id: string;
    type: string;
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
    isDefault: boolean;
  }>> {
    if (!this.stripe) {
      return [];
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { stripeCustomerId: true },
    });

    if (!brand?.stripeCustomerId) {
      return [];
    }

    try {
      const [paymentMethods, customer] = await Promise.all([
        this.stripe.paymentMethods.list({
          customer: brand.stripeCustomerId,
          type: 'card',
        }),
        this.stripe.customers.retrieve(brand.stripeCustomerId),
      ]);

      // Safely access invoice_settings from customer object
      let defaultPaymentMethodId: string | null = null;
      if (typeof customer !== 'string' && 'invoice_settings' in customer && !('deleted' in customer)) {
        const invoiceSettings = (customer as Stripe.Customer & { invoice_settings?: { default_payment_method?: string } }).invoice_settings;
        defaultPaymentMethodId = invoiceSettings?.default_payment_method ?? null;
      }

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        brand: pm.card?.brand || null,
        last4: pm.card?.last4 || null,
        expMonth: pm.card?.exp_month || null,
        expYear: pm.card?.exp_year || null,
        isDefault: pm.id === defaultPaymentMethodId,
      }));
    } catch (error) {
      this.logger.error(`Failed to get payment methods: ${error}`);
      return [];
    }
  }

  /**
   * Récupère l'usage courant pour la période de facturation
   */
  async getCurrentUsageSummary(brandId: string): Promise<{
    tokensUsed: number;
    tokensLimit: number;
    tokensPercentage: number;
    requestsUsed: number;
    requestsLimit: number;
    requestsPercentage: number;
    estimatedOverageCost: number;
    periodStart: Date;
    periodEnd: Date;
  } | null> {
    try {
      const quota = await this.prisma.aIQuota.findUnique({
        where: { brandId },
      });

      if (!quota) {
        return null;
      }

      const tokensPercentage = quota.monthlyTokens > 0 
        ? Math.round((quota.usedTokens / quota.monthlyTokens) * 100) 
        : 0;
      const requestsPercentage = quota.monthlyRequests > 0 
        ? Math.round((quota.usedRequests / quota.monthlyRequests) * 100) 
        : 0;

      // Calculate overage cost (e.g., $0.002 per extra 1K tokens)
      const overageTokens = Math.max(0, quota.usedTokens - quota.monthlyTokens);
      const estimatedOverageCost = Math.ceil((overageTokens / 1000) * 0.2); // 0.2 cents per 1K tokens

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = quota.resetAt;

      return {
        tokensUsed: quota.usedTokens,
        tokensLimit: quota.monthlyTokens,
        tokensPercentage,
        requestsUsed: quota.usedRequests,
        requestsLimit: quota.monthlyRequests,
        requestsPercentage,
        estimatedOverageCost,
        periodStart,
        periodEnd,
      };
    } catch (error) {
      this.logger.error(`Failed to get usage summary: ${error}`);
      return null;
    }
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Extrait le planId depuis une subscription Stripe
   */
  private extractPlanIdFromSubscription(subscription: Stripe.Subscription): string {
    // 1. Check subscription metadata
    if (subscription.metadata?.planId) {
      return subscription.metadata.planId;
    }

    // 2. Check price metadata
    const price = subscription.items.data[0]?.price;
    if (price?.metadata?.planId) {
      return price.metadata.planId;
    }

    // 3. Check product metadata
    const product = price?.product;
    if (typeof product === 'object' && product && 'metadata' in product) {
      const productMetadata = (product as Stripe.Product).metadata;
      if (productMetadata?.planId) {
        return productMetadata.planId;
      }
    }

    // 4. Infer from price amount (fallback heuristic)
    const amount = price?.unit_amount || 0;
    if (amount === 0) return 'free';
    if (amount <= 2900) return 'starter';
    if (amount <= 7900) return 'professional';
    if (amount <= 19900) return 'business';
    return 'enterprise';
  }

  /**
   * Extrait les features depuis un produit Stripe
   */
  private extractFeaturesFromProduct(product: Stripe.Product | undefined): string[] {
    if (!product?.metadata?.features) {
      return this.getDefaultFeatures(product?.metadata?.planId || 'free');
    }

    try {
      return JSON.parse(product.metadata.features);
    } catch {
      return product.metadata.features.split(',').map(f => f.trim());
    }
  }

  /**
   * Retourne les features par défaut pour un plan
   */
  private getDefaultFeatures(planId: string): string[] {
    const featureMap: Record<string, string[]> = {
      free: ['100 générations/mois', 'Support email', 'Export PNG'],
      starter: ['500 générations/mois', 'Support prioritaire', 'Export HD', 'API access'],
      professional: ['2000 générations/mois', 'Support dédié', 'Export 4K', 'API illimité', 'White-label'],
      business: ['10000 générations/mois', 'Account manager', 'SLA 99.9%', 'SSO', 'Custom integrations'],
      enterprise: ['Illimité', 'Support 24/7', 'SLA 99.99%', 'On-premise option', 'Custom AI models'],
    };
    return featureMap[planId] || featureMap.free;
  }

  /**
   * Retourne le nom d'affichage pour un plan
   */
  private getPlanDisplayName(planId: string): string {
    const nameMap: Record<string, string> = {
      free: 'Free',
      starter: 'Starter',
      professional: 'Professional',
      business: 'Business',
      enterprise: 'Enterprise',
    };
    return nameMap[planId] || 'Free';
  }

  /**
   * Met à jour les quotas selon le plan
   */
  private async updateQuotasForPlan(brandId: string, planId: string): Promise<void> {
    const limits = this.limitsConfig.getLimits(planId);
    const now = new Date();
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await this.prisma.aIQuota.upsert({
      where: { brandId },
      create: {
        brandId,
        planId,
        monthlyTokens: limits.monthlyTokens,
        monthlyRequests: limits.monthlyRequests,
        usedTokens: 0,
        usedRequests: 0,
        resetAt,
      },
      update: {
        planId,
        monthlyTokens: limits.monthlyTokens,
        monthlyRequests: limits.monthlyRequests,
        resetAt,
      },
    });
  }
}
