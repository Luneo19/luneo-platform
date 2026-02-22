import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConversionAction, Prisma } from '@prisma/client';
import { TryOnEventsService } from './try-on-events.service';
import { PLAN_CONFIGS, normalizePlanTier, getPlanConfig } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';

export interface TrackConversionInput {
  sessionId: string;
  productId: string;
  action: ConversionAction;
  source: string;
  attributionData?: Record<string, unknown>;
}

export interface AttributeRevenueInput {
  revenue: number;
  currency: string;
  externalOrderId?: string;
}

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: TryOnEventsService,
  ) {}

  /**
   * Track a conversion event from a try-on session.
   * Idempotent: duplicate session+product+action combinations return the existing conversion.
   */
  async trackConversion(input: TrackConversionInput) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId: input.sessionId },
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        configuration: {
          select: {
            project: { select: { brandId: true } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${input.sessionId} not found`);
    }

    // ANTI-FRAUD: Reject conversions from sessions that are too recent (< 3 seconds).
    // A real user needs at least a few seconds to view a try-on result before converting.
    const MIN_SESSION_DURATION_MS = 3_000;
    if (session.startedAt) {
      const sessionAge = Date.now() - new Date(session.startedAt).getTime();
      if (sessionAge < MIN_SESSION_DURATION_MS) {
        this.logger.warn(
          `Suspicious conversion: session ${input.sessionId} is only ${sessionAge}ms old (min: ${MIN_SESSION_DURATION_MS}ms)`,
        );
        throw new BadRequestException(
          'Session trop récente pour enregistrer une conversion. Veuillez réessayer.',
        );
      }
    }

    const brandId = session.configuration.project.brandId;

    // TENANT ISOLATION: Verify product belongs to the same brand as the session
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      select: { brandId: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${input.productId} not found`);
    }

    if (product.brandId !== brandId) {
      this.logger.warn(
        `Cross-tenant conversion attempt: product ${input.productId} (brand ${product.brandId}) does not belong to session brand ${brandId}`,
      );
      throw new BadRequestException('Product does not belong to the same brand as this session');
    }

    // IDEMPOTENCY: Check for existing conversion with same session+product+action
    const existing = await this.prisma.tryOnConversion.findFirst({
      where: {
        sessionId: session.id,
        productId: input.productId,
        action: input.action,
      },
      select: {
        id: true,
        action: true,
        productId: true,
        source: true,
        createdAt: true,
      },
    });

    if (existing) {
      this.logger.debug(
        `Duplicate conversion ignored: ${input.action} for session ${input.sessionId} product ${input.productId}`,
      );
      return existing;
    }

    const conversion = await this.prisma.tryOnConversion.create({
      data: {
        sessionId: session.id,
        productId: input.productId,
        brandId,
        action: input.action,
        source: input.source,
        attributionData: input.attributionData as Prisma.InputJsonValue ?? Prisma.DbNull,
      },
      select: {
        id: true,
        action: true,
        productId: true,
        source: true,
        createdAt: true,
      },
    });

    // Also mark the session as converted
    await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: {
        converted: true,
        conversionAction: input.action,
      },
    });

    // Fire-and-forget: emit webhook
    this.eventsService
      .emitConversion(brandId, {
        sessionId: input.sessionId,
        productId: input.productId,
        action: input.action,
      })
      .catch(() => {});

    this.logger.log(
      `Conversion tracked: ${input.action} for session ${input.sessionId}`,
    );

    return conversion;
  }

  /**
   * Attribute revenue to an existing conversion (e.g., when purchase confirmed).
   */
  async attributeRevenue(
    conversionId: string,
    input: AttributeRevenueInput,
    commissionRate?: number,
    callerBrandId?: string,
  ) {
    const conversion = await this.prisma.tryOnConversion.findUnique({
      where: { id: conversionId },
      select: {
        id: true,
        brandId: true,
        sessionId: true,
        productId: true,
        session: { select: { sessionId: true } },
      },
    });

    if (!conversion) {
      throw new NotFoundException(`Conversion ${conversionId} not found`);
    }

    // SECURITY: Verify that the caller owns this conversion
    if (callerBrandId && conversion.brandId !== callerBrandId) {
      this.logger.warn(`IDOR attempt: brand ${callerBrandId} tried to attribute revenue on conversion ${conversionId} owned by ${conversion.brandId}`);
      throw new ForbiddenException('You do not have access to this conversion');
    }

    // Determine commission rate based on brand's subscription plan
    const rate = commissionRate ?? await this.getCommissionRateForBrand(conversion.brandId);
    const rawCommission = Math.round(input.revenue * rate * 100) / 100;

    // Apply monthly commission cap
    const effective = await this.getEffectiveCommission(conversion.brandId, rawCommission);

    const updated = await this.prisma.tryOnConversion.update({
      where: { id: conversionId },
      data: {
        revenue: input.revenue,
        currency: input.currency,
        commissionRate: rate,
        commissionAmount: effective.amount,
        externalOrderId: input.externalOrderId,
        action: 'PURCHASE',
      },
      select: {
        id: true,
        action: true,
        revenue: true,
        currency: true,
        commissionRate: true,
        commissionAmount: true,
        externalOrderId: true,
      },
    });

    // Fire-and-forget: emit webhook with revenue data (use external sessionId)
    const externalSessionId = conversion.session?.sessionId || conversion.sessionId;
    this.eventsService
      .emitConversion(conversion.brandId, {
        sessionId: externalSessionId,
        productId: conversion.productId,
        action: 'PURCHASE',
        revenue: input.revenue,
        currency: input.currency,
      })
      .catch(() => {});

    this.logger.log(
      `Revenue attributed: ${input.revenue} ${input.currency} to conversion ${conversionId}`,
    );

    return updated;
  }

  /**
   * Get conversions for a brand with optional filters.
   */
  async getConversions(
    brandId: string,
    options?: {
      days?: number;
      action?: ConversionAction;
      limit?: number;
      offset?: number;
    },
  ) {
    const days = Math.min(Math.max(1, options?.days ?? 30), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: Prisma.TryOnConversionWhereInput = {
      brandId,
      createdAt: { gte: since },
      ...(options?.action && { action: options.action }),
    };

    const [conversions, total] = await Promise.all([
      this.prisma.tryOnConversion.findMany({
        where,
        select: {
          id: true,
          action: true,
          source: true,
          revenue: true,
          currency: true,
          commissionAmount: true,
          externalOrderId: true,
          createdAt: true,
          product: { select: { id: true, name: true } },
          session: { select: { sessionId: true, visitorId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(1, options?.limit ?? 50), 200),
        skip: Math.max(0, options?.offset ?? 0),
      }),
      this.prisma.tryOnConversion.count({ where }),
    ]);

    return { conversions, total };
  }

  /**
   * Get conversion/ROI report for a brand.
   */
  async getConversionReport(brandId: string, days = 30) {
    const safeDays = Math.min(Math.max(1, days), 365);
    const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const [totalSessions, conversions, revenueData] = await Promise.all([
      this.prisma.tryOnSession.count({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: since },
        },
      }),
      this.prisma.tryOnConversion.groupBy({
        by: ['action'],
        where: { brandId, createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.tryOnConversion.aggregate({
        where: {
          brandId,
          createdAt: { gte: since },
          revenue: { not: null },
        },
        _sum: { revenue: true, commissionAmount: true },
        _count: { id: true },
        _avg: { revenue: true },
      }),
    ]);

    const totalConversions = conversions.reduce(
      (sum, c) => sum + c._count.id,
      0,
    );

    const conversionsByAction = conversions.reduce(
      (acc, c) => ({ ...acc, [c.action]: c._count.id }),
      {} as Record<string, number>,
    );

    return {
      period: { days: safeDays, since: since.toISOString() },
      sessions: totalSessions,
      conversions: {
        total: totalConversions,
        rate: totalSessions > 0
          ? Math.round((totalConversions / totalSessions) * 10000) / 100
          : 0,
        byAction: conversionsByAction,
      },
      revenue: {
        total: revenueData._sum.revenue ?? 0,
        average: revenueData._avg.revenue ?? 0,
        netRevenue: Math.round(((revenueData._sum.revenue ?? 0) - (revenueData._sum.commissionAmount ?? 0)) * 100) / 100,
        purchaseCount: revenueData._count.id,
      },
      commission: {
        total: revenueData._sum.commissionAmount ?? 0,
        effectiveRate: (revenueData._sum.revenue ?? 0) > 0
          ? Math.round(((revenueData._sum.commissionAmount ?? 0) / (revenueData._sum.revenue ?? 1)) * 10000) / 100
          : 0,
      },
    };
  }

  // ========================================
  // COMMISSION RATE LOGIC
  // ========================================
  // SOURCE OF TRUTH: apps/backend/src/libs/plans/plan-config.ts
  // Rates: FREE=10%, STARTER=5%, PRO=3%, BUSINESS=2%, ENTERPRISE=1%
  // These match CommissionService (billing module) exactly.
  // ========================================

  /**
   * Determine the commission rate for a brand based on their subscription plan.
   * Reads Brand.subscriptionPlan directly (NOT a separate Subscription model).
   * Rates come from plan-config.ts (single source of truth).
   */
  private async getCommissionRateForBrand(brandId: string): Promise<number> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          plan: true,
        },
      });

      if (!brand) {
        this.logger.warn(`Brand ${brandId} not found for commission rate, using FREE rate`);
        return PLAN_CONFIGS[PlanTier.FREE].pricing.commissionPercent / 100;
      }

      // If subscription is not active, apply FREE rate
      const isActive = !brand.subscriptionStatus ||
        brand.subscriptionStatus === 'ACTIVE' ||
        brand.subscriptionStatus === 'TRIALING';

      if (!isActive) {
        return PLAN_CONFIGS[PlanTier.FREE].pricing.commissionPercent / 100;
      }

      // Resolve plan tier from Brand fields (subscriptionPlan has priority, then plan)
      const planId = brand.subscriptionPlan || brand.plan || 'free';
      const tier = normalizePlanTier(planId);
      const config = getPlanConfig(tier);

      this.logger.debug(
        `Commission rate for brand ${brandId}: ${config.pricing.commissionPercent}% (plan: ${tier})`,
      );

      return config.pricing.commissionPercent / 100;
    } catch (error) {
      this.logger.warn('Failed to determine commission rate, using FREE rate', {
        brandId,
        error: (error as Error).message,
      });
      return PLAN_CONFIGS[PlanTier.FREE].pricing.commissionPercent / 100;
    }
  }

  /**
   * Check if commission cap is exceeded for the current billing period.
   * Uses brand's billing cycle (planExpiresAt) instead of calendar month.
   * Returns the effective commission amount (may be reduced to respect cap).
   */
  async getEffectiveCommission(brandId: string, proposedAmount: number): Promise<{
    amount: number;
    capped: boolean;
    monthlyTotal: number;
    monthlyLimit: number;
  }> {
    // Derive billing period start from planExpiresAt (aligned with subscription cycle)
    const periodStart = await this.getBillingPeriodStart(brandId);

    const [monthlyCommission, cap] = await Promise.all([
      this.prisma.tryOnConversion.aggregate({
        where: {
          brandId,
          createdAt: { gte: periodStart },
          commissionAmount: { not: null },
        },
        _sum: { commissionAmount: true },
      }),
      this.getCommissionCapForBrand(brandId),
    ]);

    const currentTotal = monthlyCommission._sum.commissionAmount ?? 0;
    const remaining = Math.max(0, cap - currentTotal);
    const effectiveAmount = Math.min(proposedAmount, remaining);

    return {
      amount: Math.round(effectiveAmount * 100) / 100,
      capped: effectiveAmount < proposedAmount,
      monthlyTotal: currentTotal + effectiveAmount,
      monthlyLimit: cap,
    };
  }

  /**
   * Get the monthly commission cap for a brand.
   * Caps scale with plan tier (source: plan-config.ts pricing.monthlyPrice * multiplier).
   * Enterprise: no cap. Others: monthlyPrice * 100 EUR (e.g., Starter 19EUR -> 1900 EUR cap).
   */
  private async getCommissionCapForBrand(brandId: string): Promise<number> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { subscriptionPlan: true, plan: true },
      });

      const planId = brand?.subscriptionPlan || brand?.plan || 'free';
      const tier = normalizePlanTier(planId);

      // Commission cap = 10x the monthly subscription price (in EUR)
      // FREE (0 EUR) -> cap 100 EUR (minimum floor)
      // STARTER (19 EUR) -> cap 1900 EUR
      // PROFESSIONAL (49 EUR) -> cap 4900 EUR
      // BUSINESS (99 EUR) -> cap 9900 EUR
      // ENTERPRISE (299 EUR) -> no cap
      if (tier === PlanTier.ENTERPRISE) {
        return Infinity;
      }

      const config = getPlanConfig(tier);
      const baseCap = config.pricing.monthlyPrice * 100; // 100× monthly price (EUR) = cap in EUR (e.g. 19€ → 1900 EUR cap)
      return Math.max(baseCap, 100); // Minimum 100 EUR cap
    } catch {
      return 100; // Safe default
    }
  }

  /**
   * Derive billing period start from brand's planExpiresAt.
   * Aligns with Stripe billing cycle to avoid calendar-month mismatch.
   */
  private async getBillingPeriodStart(brandId: string): Promise<Date> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { planExpiresAt: true },
      });

      if (brand?.planExpiresAt) {
        const now = new Date();
        const anchorDay = Math.min(new Date(brand.planExpiresAt).getUTCDate(), 28);
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
    } catch { /* fallback below */ }

    // Fallback: calendar month
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }
}
