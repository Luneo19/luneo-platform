/**
 * @fileoverview TryOnBillingSyncService - Facturation Stripe des commissions try-on et overages.
 *
 * ARCHITECTURE:
 * - Appelé par un cron job BullMQ (try-on-processing queue, job 'billing-sync')
 * - Agrège les commissions try-on par brand sur la période de facturation
 * - Crée des Stripe invoice items pour les commissions et overages
 * - Les invoice items sont automatiquement inclus dans la prochaine facture Stripe
 *
 * SOURCE DE VÉRITÉ: plan-config.ts pour les taux et quotas
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { normalizePlanTier, getPlanConfig } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';
import Stripe from 'stripe';

interface BrandBillingSummary {
  brandId: string;
  stripeCustomerId: string;
  planTier: PlanTier;
  periodStart: Date;
  periodEnd: Date;
  commissionTotal: number;
  tryOnSessionsUsed: number;
  tryOnSessionsLimit: number;
  tryOnSessionsOverage: number;
  overageRateCents: number;
  overageCostCents: number;
}

@Injectable()
export class TryOnBillingSyncService {
  private readonly logger = new Logger(TryOnBillingSyncService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    } else {
      this.stripe = null;
      this.logger.warn('Stripe not configured, try-on billing sync disabled');
    }
  }

  /**
   * Run the monthly billing sync for all brands with try-on activity.
   * Called by the cron job processor.
   */
  async syncAllBrands(): Promise<{ processed: number; invoiced: number; errors: number }> {
    const stats = { processed: 0, invoiced: 0, errors: 0 };

    if (!this.stripe) {
      this.logger.warn('Stripe not configured, skipping billing sync');
      return stats;
    }

    try {
      // Find all brands with try-on conversions or sessions in the last 35 days
      const activeBrands = await this.prisma.brand.findMany({
        where: {
          stripeCustomerId: { not: null },
          subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
          OR: [
            { tryOnConversions: { some: { commissionAmount: { gt: 0 } } } },
          ],
        },
        select: {
          id: true,
          stripeCustomerId: true,
          subscriptionPlan: true,
          plan: true,
          planExpiresAt: true,
        },
      });

      this.logger.log(`Found ${activeBrands.length} brands with try-on activity`);

      // Process in batches of 10 with limited concurrency to avoid overwhelming Stripe API
      const BATCH_SIZE = 10;
      for (let i = 0; i < activeBrands.length; i += BATCH_SIZE) {
        const batch = activeBrands.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((brand) => this.syncBrand(brand)),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            stats.processed++;
          } else {
            stats.errors++;
            this.logger.error(`Failed to sync brand in batch: ${result.reason?.message || result.reason}`);
          }
        }
      }

      stats.invoiced = stats.processed - stats.errors;
      this.logger.log(`Billing sync complete: ${JSON.stringify(stats)}`);
    } catch (error) {
      this.logger.error(`Billing sync failed: ${(error as Error).message}`);
    }

    return stats;
  }

  /**
   * Sync a single brand's try-on billing.
   */
  private async syncBrand(brand: {
    id: string;
    stripeCustomerId: string | null;
    subscriptionPlan: string;
    plan: string;
    planExpiresAt: Date | null;
  }): Promise<void> {
    if (!this.stripe || !brand.stripeCustomerId) return;

    const planTier = normalizePlanTier(brand.subscriptionPlan || brand.plan);
    const periodStart = this.derivePeriodStart(brand.planExpiresAt);
    const periodEnd = new Date(); // Now

    // 1. Aggregate commissions for this billing period
    const commissionData = await this.prisma.tryOnConversion.aggregate({
      where: {
        brandId: brand.id,
        createdAt: { gte: periodStart, lte: periodEnd },
        commissionAmount: { gt: 0 },
      },
      _sum: { commissionAmount: true },
      _count: { id: true },
    });

    const commissionTotal = commissionData._sum.commissionAmount ?? 0;

    // 2. Calculate try-on session overage
    const sessionCount = await this.prisma.usageMetric.aggregate({
      where: {
        brandId: brand.id,
        metric: 'virtual_tryons',
        timestamp: { gte: periodStart, lte: periodEnd },
      },
      _sum: { value: true },
    });

    const config = getPlanConfig(planTier);
    const tryOnQuota = config.quotas.find(q => q.metric === 'virtual_tryons');
    const sessionsUsed = sessionCount._sum.value ?? 0;
    const sessionsLimit = tryOnQuota?.limit ?? 10;
    const sessionsOverage = Math.max(0, sessionsUsed - sessionsLimit);
    const overageRateCents = tryOnQuota?.overageRate ?? 0;
    const overageCostCents = sessionsOverage * overageRateCents;

    // 3. Check if there's anything to invoice
    const commissionCents = Math.round(commissionTotal * 100);
    if (commissionCents <= 0 && overageCostCents <= 0) {
      this.logger.debug(`No billable try-on activity for brand ${brand.id}`);
      return;
    }

    // 4. Check for idempotency (avoid double billing)
    const existingInvoiceItem = await this.checkExistingInvoiceItems(
      brand.stripeCustomerId,
      periodStart,
    );

    if (existingInvoiceItem) {
      this.logger.debug(`Invoice items already exist for brand ${brand.id} period starting ${periodStart.toISOString()}`);
      return;
    }

    // 5. Create Stripe invoice items
    if (commissionCents > 0) {
      await this.stripe.invoiceItems.create({
        customer: brand.stripeCustomerId,
        amount: commissionCents,
        currency: 'eur',
        description: `Virtual Try-On commissions (${commissionData._count.id} conversions, ${config.pricing.commissionPercent}% rate)`,
        metadata: {
          type: 'tryon_commission',
          brandId: brand.id,
          periodStart: periodStart.toISOString(),
          conversions: String(commissionData._count.id),
          commissionRate: String(config.pricing.commissionPercent),
        },
      });
      this.logger.log(`Commission invoice item created: ${commissionCents} cents for brand ${brand.id}`);
    }

    if (overageCostCents > 0 && tryOnQuota?.overage === 'charge') {
      await this.stripe.invoiceItems.create({
        customer: brand.stripeCustomerId,
        amount: overageCostCents,
        currency: 'eur',
        description: `Virtual Try-On overage (${sessionsOverage} sessions au-delà du quota de ${sessionsLimit})`,
        metadata: {
          type: 'tryon_overage',
          brandId: brand.id,
          periodStart: periodStart.toISOString(),
          sessionsUsed: String(sessionsUsed),
          sessionsLimit: String(sessionsLimit),
          sessionsOverage: String(sessionsOverage),
          overageRate: String(overageRateCents),
        },
      });
      this.logger.log(`Overage invoice item created: ${overageCostCents} cents for brand ${brand.id}`);
    }
  }

  /**
   * Check if invoice items for this period already exist (idempotency).
   */
  private async checkExistingInvoiceItems(
    stripeCustomerId: string,
    periodStart: Date,
  ): Promise<boolean> {
    if (!this.stripe) return false;

    try {
      const items = await this.stripe.invoiceItems.list({
        customer: stripeCustomerId,
        pending: true,
        limit: 100,
      });

      return items.data.some(
        item =>
          (item.metadata?.type === 'tryon_commission' || item.metadata?.type === 'tryon_overage') &&
          item.metadata?.periodStart === periodStart.toISOString(),
      );
    } catch {
      return false;
    }
  }

  /**
   * Derive billing period start from planExpiresAt (same logic as UsageMeteringService).
   */
  private derivePeriodStart(planExpiresAt: Date | null): Date {
    if (planExpiresAt) {
      const now = new Date();
      const anchorDay = Math.min(new Date(planExpiresAt).getUTCDate(), 28);
      const thisMonthAnchor = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), anchorDay, 0, 0, 0, 0,
      ));

      if (thisMonthAnchor <= now) {
        return thisMonthAnchor;
      }
      return new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth() - 1, anchorDay, 0, 0, 0, 0,
      ));
    }

    // Fallback: calendar month
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get a billing summary for a specific brand (for admin dashboard display).
   */
  async getBrandBillingSummary(brandId: string): Promise<BrandBillingSummary | null> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        stripeCustomerId: true,
        subscriptionPlan: true,
        plan: true,
        planExpiresAt: true,
      },
    });

    if (!brand?.stripeCustomerId) return null;

    const planTier = normalizePlanTier(brand.subscriptionPlan || brand.plan);
    const periodStart = this.derivePeriodStart(brand.planExpiresAt);
    const periodEnd = new Date();

    const [commissionData, sessionData] = await Promise.all([
      this.prisma.tryOnConversion.aggregate({
        where: {
          brandId,
          createdAt: { gte: periodStart, lte: periodEnd },
          commissionAmount: { gt: 0 },
        },
        _sum: { commissionAmount: true },
      }),
      this.prisma.usageMetric.aggregate({
        where: {
          brandId,
          metric: 'virtual_tryons',
          timestamp: { gte: periodStart, lte: periodEnd },
        },
        _sum: { value: true },
      }),
    ]);

    const config = getPlanConfig(planTier);
    const tryOnQuota = config.quotas.find(q => q.metric === 'virtual_tryons');
    const sessionsUsed = sessionData._sum.value ?? 0;
    const sessionsLimit = tryOnQuota?.limit ?? 10;
    const sessionsOverage = Math.max(0, sessionsUsed - sessionsLimit);
    const overageRateCents = tryOnQuota?.overageRate ?? 0;

    return {
      brandId,
      stripeCustomerId: brand.stripeCustomerId,
      planTier,
      periodStart,
      periodEnd,
      commissionTotal: commissionData._sum.commissionAmount ?? 0,
      tryOnSessionsUsed: sessionsUsed,
      tryOnSessionsLimit: sessionsLimit,
      tryOnSessionsOverage: sessionsOverage,
      overageRateCents,
      overageCostCents: sessionsOverage * overageRateCents,
    };
  }
}
