import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

export interface KpiResult {
  value: number;
  trend?: number;
  meta?: Record<string, unknown>;
}

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateKpi(brandId: string, kpiSlug: string): Promise<KpiResult> {
    switch (kpiSlug) {
      case 'ar-sessions-today':
        return this.arSessionsToday(brandId);
      case 'conversion-rate':
        return this.conversionRate(brandId);
      case 'designs-generated':
        return this.designsGenerated(brandId);
      case 'orders-pending':
        return this.ordersPending(brandId);
      case 'monthly-revenue':
        return this.monthlyRevenue(brandId);
      case 'avg-production-time':
        return this.avgProductionTime(brandId);
      default:
        this.logger.debug(`Unknown KPI slug: ${kpiSlug}`);
        return { value: 0 };
    }
  }

  private async arSessionsToday(brandId: string): Promise<KpiResult> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const count = await this.prisma.analyticsEvent.count({
      where: {
        brandId,
        timestamp: { gte: start, lt: end },
        eventType: { contains: 'ar', mode: 'insensitive' },
      },
    });
    return { value: count };
  }

  private async conversionRate(brandId: string): Promise<KpiResult> {
    const [ordersCount, designViews] = await Promise.all([
      this.prisma.order.count({
        where: {
          brandId,
          status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          brandId,
          eventType: { in: ['design_view', 'design_viewed', 'page_view'] },
        },
      }),
    ]);
    const value = designViews > 0 ? Math.round((ordersCount / designViews) * 10000) / 100 : 0;
    return { value };
  }

  private async designsGenerated(brandId: string): Promise<KpiResult> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const count = await this.prisma.design.count({
      where: {
        brandId,
        createdAt: { gte: start },
      },
    });
    return { value: count };
  }

  private async ordersPending(brandId: string): Promise<KpiResult> {
    const count = await this.prisma.order.count({
      where: {
        brandId,
        status: OrderStatus.PROCESSING,
      },
    });
    return { value: count };
  }

  private async monthlyRevenue(brandId: string): Promise<KpiResult> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const result = await this.prisma.order.aggregate({
      where: {
        brandId,
        status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        paidAt: { gte: start },
      },
      _sum: { totalCents: true },
    });
    const totalCents = result._sum.totalCents ?? 0;
    return { value: totalCents / 100 };
  }

  private async avgProductionTime(brandId: string): Promise<KpiResult> {
    const orders = await this.prisma.order.findMany({
      where: {
        brandId,
        status: { in: [OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        shippedAt: { not: null },
        paidAt: { not: null },
      },
      select: {
        paidAt: true,
        shippedAt: true,
      },
    });
    if (orders.length === 0) {
      return { value: 0 };
    }
    let totalHours = 0;
    for (const o of orders) {
      const paid = o.paidAt!.getTime();
      const shipped = (o.shippedAt as Date).getTime();
      totalHours += (shipped - paid) / (1000 * 60 * 60);
    }
    const avgHours = Math.round((totalHours / orders.length) * 10) / 10;
    return { value: avgHours };
  }
}
