import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface DateRange {
  days: number;
  since: Date;
}

@Injectable()
export class TryOnAnalyticsDashboardService {
  private readonly logger = new Logger(TryOnAnalyticsDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(days = 30): DateRange {
    return {
      days,
      since: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Complete ROI report for a brand.
   */
  async getROIReport(brandId: string, days = 30) {
    const { since } = this.getDateRange(days);

    const [sessions, conversions, revenue, shares] = await Promise.all([
      // Total sessions
      this.prisma.tryOnSession.count({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: since },
        },
      }),
      // Total conversions
      this.prisma.tryOnConversion.count({
        where: { brandId, createdAt: { gte: since } },
      }),
      // Revenue data
      this.prisma.tryOnConversion.aggregate({
        where: {
          brandId,
          createdAt: { gte: since },
          action: 'PURCHASE',
        },
        _sum: { revenue: true, commissionAmount: true },
        _count: { id: true },
        _avg: { revenue: true },
      }),
      // Total shares
      this.prisma.tryOnShare.aggregate({
        where: { brandId, createdAt: { gte: since } },
        _sum: { viewCount: true, clickCount: true },
        _count: { id: true },
      }),
    ]);

    const conversionRate = sessions > 0
      ? Math.round((conversions / sessions) * 10000) / 100
      : 0;

    return {
      period: { days, since: since.toISOString() },
      kpis: {
        totalSessions: sessions,
        totalConversions: conversions,
        conversionRate,
        totalRevenue: revenue._sum.revenue ?? 0,
        averageOrderValue: revenue._avg.revenue ?? 0,
        totalCommission: revenue._sum.commissionAmount ?? 0,
        purchaseCount: revenue._count.id,
        totalShares: shares._count.id,
        totalShareViews: shares._sum.viewCount ?? 0,
        totalShareClicks: shares._sum.clickCount ?? 0,
      },
    };
  }

  /**
   * Conversion funnel: sessions -> products tried -> screenshots -> add-to-cart -> purchase
   */
  async getConversionFunnel(brandId: string, days = 30) {
    const { since } = this.getDateRange(days);

    const [
      totalSessions,
      sessionsWithProducts,
      sessionsWithScreenshots,
      addToCartConversions,
      purchaseConversions,
    ] = await Promise.all([
      this.prisma.tryOnSession.count({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: since },
        },
      }),
      this.prisma.tryOnSession.count({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: since },
          productsTried: { not: null },
        },
      }),
      this.prisma.tryOnSession.count({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: since },
          screenshotsTaken: { gt: 0 },
        },
      }),
      this.prisma.tryOnConversion.count({
        where: {
          brandId,
          createdAt: { gte: since },
          action: 'ADD_TO_CART',
        },
      }),
      this.prisma.tryOnConversion.count({
        where: {
          brandId,
          createdAt: { gte: since },
          action: 'PURCHASE',
        },
      }),
    ]);

    return {
      period: { days },
      funnel: [
        { step: 'sessions', label: 'Sessions demarrees', count: totalSessions, rate: 100 },
        {
          step: 'products_tried',
          label: 'Produits essayes',
          count: sessionsWithProducts,
          rate: totalSessions > 0 ? Math.round((sessionsWithProducts / totalSessions) * 100) : 0,
        },
        {
          step: 'screenshots',
          label: 'Screenshots pris',
          count: sessionsWithScreenshots,
          rate: totalSessions > 0 ? Math.round((sessionsWithScreenshots / totalSessions) * 100) : 0,
        },
        {
          step: 'add_to_cart',
          label: 'Ajout au panier',
          count: addToCartConversions,
          rate: totalSessions > 0 ? Math.round((addToCartConversions / totalSessions) * 100) : 0,
        },
        {
          step: 'purchase',
          label: 'Achat',
          count: purchaseConversions,
          rate: totalSessions > 0 ? Math.round((purchaseConversions / totalSessions) * 100) : 0,
        },
      ],
    };
  }

  /**
   * Product performance: most tried, highest conversion rate.
   */
  async getProductPerformance(brandId: string, days = 30, limit = 20) {
    const { since } = this.getDateRange(days);

    // Get products with try-on data
    const screenshots = await this.prisma.tryOnScreenshot.groupBy({
      by: ['productId'],
      where: {
        session: {
          configuration: { project: { brandId } },
          startedAt: { gte: since },
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const productIds = screenshots.map((s) => s.productId);

    // Get conversions per product
    const conversions = await this.prisma.tryOnConversion.groupBy({
      by: ['productId'],
      where: {
        brandId,
        productId: { in: productIds },
        createdAt: { gte: since },
      },
      _count: { id: true },
      _sum: { revenue: true },
    });

    const conversionMap = new Map(conversions.map((c) => [c.productId, c]));

    // Get product details
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, images: true, price: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return screenshots.map((s) => {
      const product = productMap.get(s.productId);
      const conv = conversionMap.get(s.productId);
      const tryCount = s._count.id;
      const convCount = conv?._count?.id ?? 0;

      return {
        productId: s.productId,
        productName: product?.name || 'Unknown',
        productImage: Array.isArray(product?.images) ? (product.images as string[])[0] : null,
        triesCount: tryCount,
        conversions: convCount,
        conversionRate: tryCount > 0 ? Math.round((convCount / tryCount) * 10000) / 100 : 0,
        revenue: conv?._sum?.revenue ?? 0,
      };
    });
  }

  /**
   * Device breakdown: sessions by device type.
   */
  async getDeviceBreakdown(brandId: string, days = 30) {
    const { since } = this.getDateRange(days);

    const metrics = await this.prisma.tryOnPerformanceMetric.groupBy({
      by: ['deviceType'],
      where: {
        session: {
          configuration: { project: { brandId } },
          startedAt: { gte: since },
        },
      },
      _count: { id: true },
      _avg: { fps: true },
    });

    const total = metrics.reduce((sum, m) => sum + m._count.id, 0);

    return metrics.map((m) => ({
      deviceType: m.deviceType,
      count: m._count.id,
      percentage: total > 0 ? Math.round((m._count.id / total) * 100) : 0,
      averageFps: Math.round(m._avg.fps ?? 0),
    }));
  }

  /**
   * Daily trend: sessions and conversions per day.
   */
  async getDailyTrend(brandId: string, days = 30) {
    const { since } = this.getDateRange(days);

    const sessions = await this.prisma.tryOnSession.findMany({
      where: {
        configuration: { project: { brandId } },
        startedAt: { gte: since },
      },
      select: { startedAt: true, converted: true },
    });

    // Aggregate by day
    const dayMap = new Map<string, { sessions: number; conversions: number }>();

    for (let d = 0; d < days; d++) {
      const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dayMap.set(key, { sessions: 0, conversions: 0 });
    }

    for (const s of sessions) {
      const key = s.startedAt.toISOString().split('T')[0];
      const existing = dayMap.get(key);
      if (existing) {
        existing.sessions++;
        if (s.converted) existing.conversions++;
      }
    }

    return Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
