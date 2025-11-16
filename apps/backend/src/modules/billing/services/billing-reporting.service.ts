import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';

export interface RevenueDashboardFilters {
  startAt?: Date;
  endAt?: Date;
  currency?: string;
}

export interface RevenueDashboard {
  period: {
    startAt: Date;
    endAt: Date;
  };
  totals: {
    grossCents: number;
    netCents: number;
    taxCents: number;
    currency: string;
  };
  mrrCents: number;
  topCustomers: Array<{
    customerEmail: string | null;
    ordersCount: number;
    totalCents: number;
  }>;
  productBreakdown: Array<{
    productId: string;
    productName: string | null;
    totalCents: number;
    ordersCount: number;
  }>;
}

@Injectable()
export class BillingReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueDashboard(filters: RevenueDashboardFilters = {}): Promise<RevenueDashboard> {
    const endAt = filters.endAt ?? new Date();
    const startAt = filters.startAt ?? this.defaultStartDate(endAt);
    const currency = filters.currency ?? 'EUR';

    const paidOrdersWhere: Prisma.OrderWhereInput = {
      status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
      currency,
      createdAt: {
        gte: startAt,
        lte: endAt,
      },
    };

    type GroupedCustomer = {
      customerEmail: string | null;
      _sum: { totalCents: number | null } | null;
      _count: { _all: number } | null;
    };
    type GroupedProduct = {
      productId: string | null;
      _sum: { totalCents: number | null } | null;
      _count: { _all: number } | null;
    };

    const totalsPromise = this.prisma.order.aggregate({
      where: paidOrdersWhere,
      _sum: {
        totalCents: true,
        taxCents: true,
      },
    });

    const topCustomersPromise = this.prisma.order.groupBy({
      where: paidOrdersWhere,
      by: ['customerEmail'],
      _sum: { totalCents: true },
      _count: { _all: true },
      orderBy: {
        _sum: { totalCents: 'desc' },
      },
      take: 5,
    }) as unknown as Prisma.PrismaPromise<GroupedCustomer[]>;

    const byProductPromise = this.prisma.order.groupBy({
      where: paidOrdersWhere,
      by: ['productId'],
      _sum: { totalCents: true },
      _count: { _all: true },
      orderBy: {
        _sum: { totalCents: 'desc' },
      },
      take: 10,
    }) as unknown as Prisma.PrismaPromise<GroupedProduct[]>;

    const [totals, topCustomers, byProduct] = await Promise.all([
      totalsPromise,
      topCustomersPromise,
      byProductPromise,
    ]);

    const durationMs = Math.max(1, endAt.getTime() - startAt.getTime());
    const months = durationMs / (1000 * 60 * 60 * 24 * 30);
    const mrr = Math.round((totals._sum.totalCents ?? 0) / Math.max(1, months));

    const productIds = byProduct
      .map((product: GroupedProduct) => product.productId)
      .filter((id): id is string => Boolean(id));

    const productDetails = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(productDetails.map((product) => [product.id, product.name]));

    return {
      period: { startAt, endAt },
      totals: {
        grossCents: totals._sum.totalCents ?? 0,
        netCents: (totals._sum.totalCents ?? 0) - (totals._sum.taxCents ?? 0),
        taxCents: totals._sum.taxCents ?? 0,
        currency,
      },
      mrrCents: mrr,
      topCustomers: topCustomers.map((customer: GroupedCustomer) => ({
        customerEmail: customer.customerEmail,
        ordersCount: customer._count?._all ?? 0,
        totalCents: customer._sum?.totalCents ?? 0,
      })),
      productBreakdown: byProduct.map((product: GroupedProduct) => ({
        productId: product.productId ?? 'unknown',
        productName: productMap.get(product.productId ?? '') ?? null,
        totalCents: product._sum?.totalCents ?? 0,
        ordersCount: product._count?._all ?? 0,
      })),
    };
  }

  private defaultStartDate(endAt: Date): Date {
    const start = new Date(endAt);
    start.setUTCMonth(start.getUTCMonth() - 1);
    return start;
  }

}

