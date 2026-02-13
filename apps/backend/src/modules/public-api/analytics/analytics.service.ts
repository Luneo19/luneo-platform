import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { GetAnalyticsDto, AnalyticsMetric, AnalyticsPeriod } from '../dto';

export interface AnalyticsData {
  metrics: Record<string, unknown>;
  timeSeries: Array<{
    date: string;
    values: Record<string, number>;
  }>;
  summary: Record<string, unknown>;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Get comprehensive analytics data for a brand
   */
  async getAnalytics(brandId: string, query: GetAnalyticsDto): Promise<AnalyticsData> {
    const cacheKey = `analytics:${brandId}:${JSON.stringify(query)}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const startDate = query.startDate ? new Date(query.startDate) : this.getDefaultStartDate();
      const endDate = query.endDate ? new Date(query.endDate) : new Date();
      const metrics = query.metrics || Object.values(AnalyticsMetric);
      const period = query.period || AnalyticsPeriod.DAY;

      const [timeSeries, summary] = await Promise.all([
        this.getTimeSeriesData(brandId, startDate, endDate, period, metrics),
        this.getSummaryData(brandId, startDate, endDate, metrics),
      ]);

      return {
        metrics: await this.getMetricsData(brandId, startDate, endDate, metrics),
        timeSeries,
        summary,
      };
    }, 300); // Cache for 5 minutes
  }

  /**
   * Get time series data for charts
   */
  private async getTimeSeriesData(
    brandId: string,
    startDate: Date,
    endDate: Date,
    period: AnalyticsPeriod,
    metrics: AnalyticsMetric[],
  ): Promise<Array<{ date: string; values: Record<string, number> }>> {
    const timeSeries: Array<{ date: string; values: Record<string, number> }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const next = this.getNextPeriod(current, period);
      const periodEnd = next > endDate ? endDate : next;

      const values: Record<string, number> = {};
      
      for (const metric of metrics) {
        values[metric] = await this.getMetricValue(brandId, metric, current, periodEnd);
      }

      timeSeries.push({
        date: current.toISOString(),
        values,
      });

      current.setTime(next.getTime());
    }

    return timeSeries;
  }

  /**
   * Get summary data for key metrics
   */
  private async getSummaryData(
    brandId: string,
    startDate: Date,
    endDate: Date,
    metrics: AnalyticsMetric[],
  ): Promise<Record<string, unknown>> {
    const summary: Record<string, unknown> = {};

    for (const metric of metrics) {
      const currentValue = await this.getMetricValue(brandId, metric, startDate, endDate);
      const previousValue = await this.getMetricValue(
        brandId,
        metric,
        this.getPreviousPeriod(startDate, endDate).start,
        this.getPreviousPeriod(startDate, endDate).end,
      );

      summary[metric] = {
        current: currentValue,
        previous: previousValue,
        change: currentValue - previousValue,
        changePercent: previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0,
      };
    }

    return summary;
  }

  /**
   * Get individual metrics data
   */
  private async getMetricsData(
    brandId: string,
    startDate: Date,
    endDate: Date,
    metrics: AnalyticsMetric[],
  ): Promise<Record<string, unknown>> {
    const metricsData: Record<string, unknown> = {};

    for (const metric of metrics) {
      switch (metric) {
        case AnalyticsMetric.DESIGNS:
          metricsData[metric] = await this.getDesignMetrics(brandId, startDate, endDate);
          break;
        case AnalyticsMetric.ORDERS:
          metricsData[metric] = await this.getOrderMetrics(brandId, startDate, endDate);
          break;
        case AnalyticsMetric.REVENUE:
          metricsData[metric] = await this.getRevenueMetrics(brandId, startDate, endDate);
          break;
        case AnalyticsMetric.USERS:
          metricsData[metric] = await this.getUserMetrics(brandId, startDate, endDate);
          break;
      }
    }

    return metricsData;
  }

  /**
   * Get metric value for a specific period
   */
  private async getMetricValue(
    brandId: string,
    metric: AnalyticsMetric,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    switch (metric) {
      case AnalyticsMetric.DESIGNS:
        return this.prisma.design.count({
          where: {
            brandId,
            createdAt: { gte: startDate, lte: endDate },
          },
        });
      case AnalyticsMetric.ORDERS:
        return this.prisma.order.count({
          where: {
            brandId,
            createdAt: { gte: startDate, lte: endDate },
          },
        });
      case AnalyticsMetric.REVENUE:
        const result = await this.prisma.order.aggregate({
          where: {
            brandId,
            createdAt: { gte: startDate, lte: endDate },
            status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          },
          _sum: { totalCents: true },
        });
        return Number(result._sum.totalCents || 0) / 100; // Convert cents to currency
      case AnalyticsMetric.USERS:
        return this.prisma.user.count({
          where: {
            brandId,
            createdAt: { gte: startDate, lte: endDate },
          },
        });
      default:
        return 0;
    }
  }

  /**
   * Get design-specific metrics
   */
  private async getDesignMetrics(brandId: string, startDate: Date, endDate: Date): Promise<{ total: number; completed: number; failed: number; processing: number; successRate: number }> {
    const [total, completed, failed, processing] = await Promise.all([
      this.prisma.design.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.design.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
      }),
      this.prisma.design.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'FAILED' },
      }),
      this.prisma.design.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'PROCESSING' },
      }),
    ]);

    return {
      total,
      completed,
      failed,
      processing,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * Get order-specific metrics
   */
  private async getOrderMetrics(brandId: string, startDate: Date, endDate: Date): Promise<{ total: number; paid: number; shipped: number; delivered: number; cancelled: number; completionRate: number }> {
    const [total, paid, shipped, delivered, cancelled] = await Promise.all([
      this.prisma.order.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.order.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'PAID' },
      }),
      this.prisma.order.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'SHIPPED' },
      }),
      this.prisma.order.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'DELIVERED' },
      }),
      this.prisma.order.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'CANCELLED' },
      }),
    ]);

    return {
      total,
      paid,
      shipped,
      delivered,
      cancelled,
      completionRate: total > 0 ? ((delivered + shipped) / total) * 100 : 0,
    };
  }

  /**
   * Get revenue-specific metrics
   */
  private async getRevenueMetrics(brandId: string, startDate: Date, endDate: Date): Promise<{ total: number; averageOrderValue: number; orderCount: number }> {
    const [totalRevenue, averageOrderValue, orderCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          brandId,
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: { totalCents: true },
      }),
      this.prisma.order.aggregate({
        where: {
          brandId,
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _avg: { totalCents: true },
      }),
      this.prisma.order.count({
        where: {
          brandId,
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      }),
    ]);

    return {
      total: Number(totalRevenue._sum.totalCents || 0) / 100,
      averageOrderValue: Number(averageOrderValue._avg.totalCents || 0) / 100,
      orderCount,
    };
  }

  /**
   * Get user-specific metrics
   */
  private async getUserMetrics(brandId: string, startDate: Date, endDate: Date): Promise<{ total: number; active: number }> {
    const [totalUsers, activeUsers] = await Promise.all([
      this.prisma.user.count({
        where: { brandId, createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.user.count({
        where: {
          brandId,
          lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      }),
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
    };
  }

  /**
   * Helper methods for date calculations
   */
  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    return date;
  }

  private getNextPeriod(date: Date, period: AnalyticsPeriod): Date {
    const next = new Date(date);
    switch (period) {
      case AnalyticsPeriod.DAY:
        next.setDate(next.getDate() + 1);
        break;
      case AnalyticsPeriod.WEEK:
        next.setDate(next.getDate() + 7);
        break;
      case AnalyticsPeriod.MONTH:
        next.setMonth(next.getMonth() + 1);
        break;
      case AnalyticsPeriod.YEAR:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  private getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      start: new Date(startDate.getTime() - duration),
      end: new Date(endDate.getTime() - duration),
    };
  }
}
