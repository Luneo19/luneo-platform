/**
 * ML Prediction Service - Heuristic-based predictions
 *
 * Current: Statistical heuristics with improved coefficients (confidence 0.55–0.70)
 * Future: Connect to dedicated ML API via ML_API_URL env variable when user base > 1000
 *
 * Predictions are cached in AnalyticsPrediction table for 24h
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function num(features: Record<string, unknown>, key: string, def = 0): number {
  const v = features[key];
  return typeof v === 'number' ? v : def;
}

function bool(features: Record<string, unknown>, key: string): boolean {
  return !!features[key];
}

function str(features: Record<string, unknown>, key: string): string {
  const v = features[key];
  return typeof v === 'string' ? v : '';
}

export interface MLPredictionRequest {
  type: 'churn' | 'ltv' | 'conversion' | 'engagement' | 'revenue' | 'demand';
  brandId?: string;
  userId?: string;
  features?: Record<string, unknown>;
}

export interface MLPredictionResult {
  type: string;
  value: number;
  confidence: number;
  period: string;
  factors: Array<{ name: string; impact: number }>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MLPredictionService {
  private readonly logger = new Logger(MLPredictionService.name);
  private readonly mlApiUrl: string | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.mlApiUrl = this.configService.get<string>('ML_API_URL') || null;
  }

  /** Build MLPredictionResult from a cached AnalyticsPrediction row. */
  private fromCached(row: { type: string; value: number; confidence: number; period: string; metadata: unknown }): MLPredictionResult {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      type: row.type,
      value: row.value,
      confidence: row.confidence,
      period: row.period,
      factors: Array.isArray(meta.factors) ? (meta.factors as Array<{ name: string; impact: number }>) : [],
      metadata: meta,
    };
  }

  /**
   * Prédire le risque de churn pour un utilisateur.
   * Heuristic: users with no activity in last 30 days vs total → churn probability.
   */
  async predictChurn(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting churn for user: ${request.userId}`);

    if (!request.userId) {
      throw new BadRequestException('userId is required for churn prediction');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
      select: { brandId: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const brandId = user.brandId;
    if (brandId) {
      const cached = await this.prisma.analyticsPrediction.findFirst({
        where: {
          brandId,
          type: 'churn',
          createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
          metadata: { path: ['userId'], equals: request.userId },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (cached) return this.fromCached(cached);
    }

    const features = await this.getChurnFeatures(request.userId);
    const churnRisk = this.calculateChurnRiskHeuristic(features);
    const result: MLPredictionResult = {
      type: 'churn',
      value: churnRisk.risk,
      confidence: churnRisk.confidence,
      period: '30d',
      factors: churnRisk.factors,
      metadata: { method: 'heuristic', userId: request.userId },
    };

    if (brandId) {
      await this.prisma.analyticsPrediction.create({
        data: {
          brandId,
          type: 'churn',
          value: churnRisk.risk,
          confidence: churnRisk.confidence,
          period: '30d',
          metadata: { factors: churnRisk.factors, userId: request.userId, ...result.metadata },
        },
      });
    }
    return result;
  }

  /**
   * Prédire la Lifetime Value (LTV) d'un utilisateur.
   * Heuristic: historical orders + plan multiplier.
   */
  async predictLTV(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting LTV for user: ${request.userId}`);

    if (!request.userId) {
      throw new BadRequestException('userId is required for LTV prediction');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
      select: { brandId: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const brandId = user.brandId;
    if (brandId) {
      const cached = await this.prisma.analyticsPrediction.findFirst({
        where: {
          brandId,
          type: 'ltv',
          createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
          metadata: { path: ['userId'], equals: request.userId },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (cached) return this.fromCached(cached);
    }

    const features = await this.getLTVFeatures(request.userId);
    const ltv = this.calculateLTVHeuristic(features);
    const result: MLPredictionResult = {
      type: 'ltv',
      value: ltv.value,
      confidence: ltv.confidence,
      period: '12m',
      factors: ltv.factors,
      metadata: { method: 'heuristic', userId: request.userId },
    };

    if (brandId) {
      await this.prisma.analyticsPrediction.create({
        data: {
          brandId,
          type: 'ltv',
          value: ltv.value,
          confidence: ltv.confidence,
          period: '12m',
          metadata: { factors: ltv.factors, userId: request.userId, ...result.metadata },
        },
      });
    }
    return result;
  }

  /**
   * Prédire la probabilité de conversion.
   * Heuristic: conversion count / total sessions from analytics (subscription + orders).
   */
  async predictConversion(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting conversion for user: ${request.userId}`);

    if (!request.userId) {
      throw new BadRequestException('userId is required for conversion prediction');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
      select: { brandId: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const brandId = user.brandId;
    if (brandId) {
      const cached = await this.prisma.analyticsPrediction.findFirst({
        where: {
          brandId,
          type: 'conversion',
          createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
          metadata: { path: ['userId'], equals: request.userId },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (cached) return this.fromCached(cached);
    }

    const features = await this.getConversionFeatures(request.userId);
    const conversion = this.calculateConversionHeuristic(features);
    const result: MLPredictionResult = {
      type: 'conversion',
      value: conversion.probability,
      confidence: conversion.confidence,
      period: '7d',
      factors: conversion.factors,
      metadata: { method: 'heuristic', userId: request.userId },
    };

    if (brandId) {
      await this.prisma.analyticsPrediction.create({
        data: {
          brandId,
          type: 'conversion',
          value: conversion.probability,
          confidence: conversion.confidence,
          period: '7d',
          metadata: { factors: conversion.factors, userId: request.userId, ...result.metadata },
        },
      });
    }
    return result;
  }

  /**
   * Prédire le revenu futur.
   * Heuristic: average daily revenue from last 30 days of orders × 30 = forecast.
   */
  async predictRevenue(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting revenue for brand: ${request.brandId}`);

    if (!request.brandId) {
      throw new BadRequestException('brandId is required for revenue prediction');
    }

    const cached = await this.prisma.analyticsPrediction.findFirst({
      where: {
        brandId: request.brandId,
        type: 'revenue',
        createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) return this.fromCached(cached);

    const features = await this.getRevenueFeatures(request.brandId);
    const revenue = this.calculateRevenueHeuristic(features);
    const result: MLPredictionResult = {
      type: 'revenue',
      value: revenue.value,
      confidence: revenue.confidence,
      period: '30d',
      factors: revenue.factors,
      metadata: { method: 'heuristic' },
    };

    await this.prisma.analyticsPrediction.create({
      data: {
        brandId: request.brandId,
        type: 'revenue',
        value: revenue.value,
        confidence: revenue.confidence,
        period: '30d',
        metadata: { factors: revenue.factors, ...result.metadata },
      },
    });
    return result;
  }

  /**
   * Prédire la demande (designs/orders).
   * Heuristic: count of designs/orders per day trend → extrapolate.
   */
  async predictDemand(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting demand for brand: ${request.brandId}`);

    if (!request.brandId) {
      throw new BadRequestException('brandId is required for demand prediction');
    }

    const cached = await this.prisma.analyticsPrediction.findFirst({
      where: {
        brandId: request.brandId,
        type: 'demand',
        createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) return this.fromCached(cached);

    const result = await this.calculateDemandHeuristic(request.brandId);

    await this.prisma.analyticsPrediction.create({
      data: {
        brandId: request.brandId,
        type: 'demand',
        value: result.value,
        confidence: result.confidence,
        period: result.period,
        metadata: { factors: result.factors, method: 'heuristic' },
      },
    });
    return result;
  }

  /**
   * Call external ML API when ML_API_URL is set. Returns null on miss or error (caller uses heuristic).
   * ML_API_URL: Configure for dedicated ML model in production (when user base > 1000)
   */
  private async callMLModel(
    modelType: string,
    features: Record<string, unknown>,
  ): Promise<unknown> {
    if (!this.mlApiUrl) {
      return null;
    }

    try {
      const response = await fetch(`${this.mlApiUrl}/predict/${modelType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      if (!response.ok) {
        this.logger.warn(`ML API returned ${response.status} for ${modelType}`);
        return null;
      }
      return response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`ML API call failed for ${modelType}: ${message}`);
      return null;
    }
  }

  // ========================================
  // FEATURE EXTRACTION (pour modèles ML)
  // ========================================

  private async getChurnFeatures(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brand: {
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
        orders: {
          take: 24,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, totalCents: true, paymentStatus: true },
        },
        _count: { select: { tickets: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const lastLogin = user.lastLoginAt || user.createdAt;
    const daysSinceLastLogin = Math.floor(
      (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
    );

    const now = Date.now();
    const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
    const recentOrders = user.orders.filter((o) => now - o.createdAt.getTime() < sixMonthsMs / 2);
    const olderOrders = user.orders.filter(
      (o) => o.createdAt.getTime() >= now - sixMonthsMs && now - o.createdAt.getTime() >= sixMonthsMs / 2,
    );
    const recentRate = recentOrders.length / 3;
    const olderRate = olderOrders.length / 3;
    const orderTrendDeclining = olderRate > 0 ? Math.max(0, (olderRate - recentRate) / olderRate) : 0;

    const paymentFailureCount = user.orders.filter(
      (o) => o.paymentStatus === 'FAILED' || o.paymentStatus === 'CANCELLED',
    ).length;

    return {
      daysSinceLastLogin,
      totalOrders: user.orders.length,
      totalRevenue: user.orders.reduce((sum, o) => sum + (o.totalCents || 0), 0) / 100,
      currentPlan: user.brand?.subscriptionPlan || 'FREE',
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      supportTicketCount: user._count.tickets,
      orderTrendDeclining,
      hasPaymentFailure: paymentFailureCount > 0,
    };
  }

  private async getLTVFeatures(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brand: {
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
        orders: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      totalOrders: user.orders.length,
      avgOrderValue: user.orders.length > 0
        ? user.orders.reduce((sum, o) => sum + (o.totalCents || 0), 0) / user.orders.length / 100
        : 0,
      currentPlan: user.brand?.subscriptionPlan || 'FREE',
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  private async getConversionFeatures(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        brandId: true,
        createdAt: true,
        brand: {
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
        orders: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const eventWhere: { userId: string; timestamp: { gte: Date }; eventType: { in: string[] }; brandId?: string } = {
      userId,
      timestamp: { gte: since },
      eventType: { in: ['page_view', 'cart_add', 'cart_abandon', 'conversion'] },
    };
    if (user.brandId) eventWhere.brandId = user.brandId;
    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: eventWhere,
      _count: { eventType: true },
    });
    const eventCounts: Record<string, number> = {};
    for (const e of events) {
      eventCounts[e.eventType] = e._count.eventType;
    }
    const pageViews = eventCounts['page_view'] ?? 0;
    const cartAdds = eventCounts['cart_add'] ?? 0;
    const conversions = eventCounts['conversion'] ?? 0;
    const pageViewsToCartRatio = pageViews > 0 ? cartAdds / pageViews : 0;
    const cartAbandonmentRate = cartAdds > 0 ? 1 - conversions / cartAdds : 0;

    return {
      hasSubscription: user.brand?.subscriptionStatus === 'ACTIVE' || false,
      totalOrders: user.orders.length,
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      pageViewsToCartRatio,
      cartAbandonmentRate,
      pageViews,
      cartAdds,
      conversions,
    };
  }

  private async getRevenueFeatures(brandId: string): Promise<Record<string, unknown>> {
    const orders = await this.prisma.order.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: 120,
    });

    const dailyRevenue = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (order.totalCents || 0) / 100;
      return acc;
    }, {} as Record<string, number>);
    const cutoff3m = new Date();
    cutoff3m.setDate(cutoff3m.getDate() - 90);
    const cutoff3mStr = cutoff3m.toISOString().split('T')[0];
    const last3MonthsEntries = Object.entries(dailyRevenue)
      .filter(([d]) => d >= cutoff3mStr)
      .sort(([a], [b]) => a.localeCompare(b));
    const last3MonthsValues = last3MonthsEntries.map(([, v]) => v);
    const avgDaily3m = last3MonthsValues.length > 0
      ? last3MonthsValues.reduce((a, b) => a + b, 0) / last3MonthsValues.length
      : 0;
    const trend = this.calculateTrend(last3MonthsValues.length ? last3MonthsValues : [0]);
    const currentMonth = new Date().getMonth() + 1;
    const seasonalFactor = currentMonth >= 10 && currentMonth <= 12 ? 1.15 : 1.0;

    const allValues = Object.values(dailyRevenue);
    return {
      historicalRevenue: allValues,
      avgDailyRevenue: allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0,
      avgDailyLast3Months: avgDaily3m,
      trend,
      seasonalFactor,
      dataPointsCount: last3MonthsValues.length,
    };
  }

  private async getDemandFeatures(brandId: string): Promise<{ designsPerDay: number[]; ordersPerDay: number[]; trend: number }> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [designs, orders] = await Promise.all([
      this.prisma.design.findMany({
        where: { brandId, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { brandId, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const dailyDesigns: Record<string, number> = {};
    const dailyOrders: Record<string, number> = {};
    for (const d of designs) {
      const date = d.createdAt.toISOString().split('T')[0];
      dailyDesigns[date] = (dailyDesigns[date] || 0) + 1;
    }
    for (const o of orders) {
      const date = o.createdAt.toISOString().split('T')[0];
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    }

    const designsPerDay = Object.values(dailyDesigns);
    const ordersPerDay = Object.values(dailyOrders);
    const combined = designsPerDay.length ? designsPerDay : ordersPerDay;
    const trend = this.calculateTrend(combined.length ? combined : [0]);

    return {
      designsPerDay,
      ordersPerDay,
      trend,
    };
  }

  // ========================================
  // HEURISTIC CALCULATIONS (fallback)
  // ========================================

  private calculateChurnRiskHeuristic(features: Record<string, unknown>): {
    risk: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  } {
    const days = num(features, 'daysSinceLastLogin');
    const lastLoginDecay = Math.exp(-days / 30);
    const lastLoginRisk = (1 - lastLoginDecay) * 100;
    const orderTrend = Math.min(1, num(features, 'orderTrendDeclining')) * 100;
    const ticketCount = num(features, 'supportTicketCount');
    const ticketRisk = Math.min(100, ticketCount * 25);
    const paymentFailure = bool(features, 'hasPaymentFailure') ? 100 : 0;

    const risk =
      lastLoginRisk * 0.4 + orderTrend * 0.3 + ticketRisk * 0.15 + paymentFailure * 0.15;
    const factors: Array<{ name: string; impact: number }> = [];
    if (lastLoginRisk > 10) factors.push({ name: 'Inactivity (login decay)', impact: lastLoginRisk * 0.4 });
    if (orderTrend > 5) factors.push({ name: 'Declining order frequency', impact: orderTrend * 0.3 });
    if (ticketRisk > 0) factors.push({ name: 'Support tickets', impact: ticketRisk * 0.15 });
    if (paymentFailure > 0) factors.push({ name: 'Payment failure(s)', impact: 15 });

    const dataPoints = num(features, 'totalOrders') + ticketCount + (num(features, 'accountAge') > 30 ? 1 : 0);
    const confidence = dataPoints >= 3 ? 0.65 : 0.55;

    return {
      risk: Math.min(Math.round(risk), 100),
      confidence,
      factors: factors.length ? factors : [{ name: 'Insufficient data', impact: 0 }],
    };
  }

  private calculateLTVHeuristic(features: Record<string, unknown>): {
    value: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  } {
    const avgOrderValue = num(features, 'avgOrderValue');
    const totalOrders = num(features, 'totalOrders');
    const accountAgeDays = num(features, 'accountAge');
    const accountAgeYears = accountAgeDays / 365;

    const ordersPerMonth = accountAgeDays > 0 && totalOrders > 0
      ? totalOrders / (accountAgeDays / 30)
      : 1 / 12;
    const predictedOrders12m = ordersPerMonth * 12;
    const accountAgeMultiplier = Math.min(1, Math.max(0.2, accountAgeYears));
    const planMultiplier = str(features, 'currentPlan') === 'PROFESSIONAL' || str(features, 'currentPlan') === 'ENTERPRISE' ? 1.5 : 1.0;

    const value = avgOrderValue * predictedOrders12m * planMultiplier * accountAgeMultiplier;
    const historyLength = totalOrders + (accountAgeDays > 90 ? 1 : 0);
    const confidence = Math.min(0.7, 0.6 + historyLength * 0.02);

    return {
      value: Math.round(value * 100) / 100,
      confidence,
      factors: [
        { name: 'Average order value', impact: avgOrderValue },
        { name: 'Predicted orders (12m)', impact: Math.round(predictedOrders12m * 10) / 10 },
        { name: 'Account age multiplier', impact: accountAgeMultiplier },
        { name: 'Plan', impact: planMultiplier },
      ],
    };
  }

  private calculateConversionHeuristic(features: Record<string, unknown>): {
    probability: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  } {
    let probability = 0;
    const factors: Array<{ name: string; impact: number }> = [];

    const totalOrders = num(features, 'totalOrders');
    const accountAge = num(features, 'accountAge');

    if (bool(features, 'hasSubscription')) {
      probability = 100;
      factors.push({ name: 'Has subscription', impact: 50 });
    } else if (totalOrders > 0) {
      probability = 65 + Math.min(20, totalOrders * 2);
      factors.push({ name: 'Total orders', impact: totalOrders * 10 });
    } else if (accountAge > 7) {
      probability = 35;
      factors.push({ name: 'Account age', impact: 15 });
    } else {
      probability = 20;
    }

    const ratio = num(features, 'pageViewsToCartRatio');
    const abandonment = num(features, 'cartAbandonmentRate');
    if (ratio > 0) {
      probability = Math.min(100, probability + ratio * 15);
      factors.push({ name: 'Page-to-cart ratio', impact: ratio * 15 });
    }
    if (abandonment < 0.8) {
      probability = Math.min(100, probability + (1 - abandonment) * 10);
      factors.push({ name: 'Cart completion', impact: (1 - abandonment) * 10 });
    }
    if (factors.length === 0) factors.push({ name: 'Base score', impact: probability });

    const dataPoints = num(features, 'pageViews') + totalOrders + (accountAge > 0 ? 1 : 0);
    const confidence = Math.min(0.7, 0.6 + dataPoints * 0.02);

    return {
      probability: Math.min(100, Math.round(probability)),
      confidence,
      factors,
    };
  }

  private calculateRevenueHeuristic(features: Record<string, unknown>): {
    value: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  } {
    const avgDaily3m = num(features, 'avgDailyLast3Months', num(features, 'avgDailyRevenue'));
    const trend = num(features, 'trend');
    const seasonal = num(features, 'seasonalFactor', 1.0);
    const predictedRevenue = avgDaily3m * 30 * (1 + trend / 100) * seasonal;
    const dataPoints = num(features, 'dataPointsCount');
    const confidence = Math.min(0.65, 0.55 + dataPoints * 0.002);

    return {
      value: Math.round(predictedRevenue * 100) / 100,
      confidence,
      factors: [
        { name: 'Avg daily revenue (3m)', impact: avgDaily3m },
        { name: 'Growth trend %', impact: trend },
        { name: 'Seasonal (Q4)', impact: seasonal > 1 ? (seasonal - 1) * 100 : 0 },
      ],
    };
  }

  private async calculateDemandHeuristic(brandId: string): Promise<MLPredictionResult> {
    const { designsPerDay, ordersPerDay, trend } = await this.getDemandFeatures(brandId);
    const avgDesignsPerDay = designsPerDay.length ? designsPerDay.reduce((a, b) => a + b, 0) / designsPerDay.length : 0;
    const avgOrdersPerDay = ordersPerDay.length ? ordersPerDay.reduce((a, b) => a + b, 0) / ordersPerDay.length : 0;
    const dailyVolume = avgDesignsPerDay + avgOrdersPerDay;
    const currentMonth = new Date().getMonth() + 1;
    const seasonalFactor = currentMonth >= 10 && currentMonth <= 12 ? 1.15 : 1.0;
    const extrapolated = Math.max(0, dailyVolume * 30 * (1 + trend / 100) * seasonalFactor);
    const dataPoints = designsPerDay.length + ordersPerDay.length;
    const confidence = Math.min(0.65, dailyVolume > 0 ? 0.55 + dataPoints * 0.01 : 0.35);

    return {
      type: 'demand',
      value: Math.round(extrapolated),
      confidence,
      period: '30d',
      factors: [
        { name: 'Designs per day (avg)', impact: avgDesignsPerDay },
        { name: 'Orders per day (avg)', impact: avgOrdersPerDay },
        { name: 'Trend %', impact: trend },
        { name: 'Seasonal (Q4)', impact: seasonalFactor > 1 ? 15 : 0 },
      ],
      metadata: { method: 'heuristic' },
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (firstAvg === 0) return 0;
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }
}
