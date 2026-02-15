import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConversionAction, Prisma } from '@prisma/client';
import { TryOnEventsService } from './try-on-events.service';

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
   */
  async trackConversion(input: TrackConversionInput) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId: input.sessionId },
      select: {
        id: true,
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

    const brandId = session.configuration.project.brandId;

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
  ) {
    const conversion = await this.prisma.tryOnConversion.findUnique({
      where: { id: conversionId },
      select: { id: true, brandId: true, sessionId: true, productId: true },
    });

    if (!conversion) {
      throw new NotFoundException(`Conversion ${conversionId} not found`);
    }

    const rate = commissionRate ?? 0.05; // Default 5% commission
    const commissionAmount =
      Math.round(input.revenue * rate * 100) / 100;

    const updated = await this.prisma.tryOnConversion.update({
      where: { id: conversionId },
      data: {
        revenue: input.revenue,
        currency: input.currency,
        commissionRate: rate,
        commissionAmount,
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

    // Fire-and-forget: emit webhook with revenue data
    this.eventsService
      .emitConversion(conversion.brandId, {
        sessionId: conversion.sessionId,
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
    const days = options?.days ?? 30;
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
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.tryOnConversion.count({ where }),
    ]);

    return { conversions, total };
  }

  /**
   * Get conversion/ROI report for a brand.
   */
  async getConversionReport(brandId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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
      period: { days, since: since.toISOString() },
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
        purchaseCount: revenueData._count.id,
      },
      commission: {
        total: revenueData._sum.commissionAmount ?? 0,
      },
    };
  }
}
