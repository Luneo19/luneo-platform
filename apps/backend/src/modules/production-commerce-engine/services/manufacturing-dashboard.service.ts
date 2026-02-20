/**
 * Module 9 - Manufacturing dashboard.
 * Production stats, order routing to suppliers, supplier SLA metrics.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

export interface ManufacturingDashboard {
  ordersPending: number;
  ordersInProduction: number;
  ordersCompleted: number;
  avgLeadTimeHours: number;
  totalOrders: number;
}

export interface SupplierSLAMetrics {
  supplierId: string;
  slaLevel: string;
  onTimeDeliveryRate: number;
  averageLeadTimeDays: number;
  qualityScore: number;
  totalOrders: number;
  completedOrders: number;
  recentSlaRecords: Array<{
    deadline: Date;
    completedAt: Date | null;
    onTime: boolean | null;
  }>;
}

@Injectable()
export class ManufacturingDashboardService {
  private readonly logger = new Logger(ManufacturingDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns production stats for the brand: pending, in production, completed, avg lead time.
   */
  async getDashboard(brandId: string): Promise<ManufacturingDashboard> {
    if (!brandId?.trim()) {
      throw new BadRequestException('brandId is required');
    }

    const pendingStatuses: OrderStatus[] = [
      OrderStatus.CREATED,
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
    ];
    const inProductionStatuses: OrderStatus[] = [OrderStatus.PROCESSING];
    const completedStatuses: OrderStatus[] = [
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const [pending, inProduction, completed, _leadTimeAgg] = await Promise.all([
      this.prisma.order.count({
        where: { brandId, status: { in: pendingStatuses }, deletedAt: null },
      }),
      this.prisma.order.count({
        where: { brandId, status: { in: inProductionStatuses }, deletedAt: null },
      }),
      this.prisma.order.count({
        where: { brandId, status: { in: completedStatuses }, deletedAt: null },
      }),
      this.prisma.workOrder.aggregate({
        where: {
          order: { brandId },
          completedAt: { not: null },
        },
        _avg: {},
        _count: true,
      }),
    ]);

    const completedWithDates = await this.prisma.workOrder.findMany({
      where: {
        order: { brandId },
        completedAt: { not: null },
        acceptedAt: { not: null },
      },
      select: {
        acceptedAt: true,
        completedAt: true,
      },
    });

    let avgLeadTimeHours = 0;
    if (completedWithDates.length > 0) {
      const totalHours = completedWithDates.reduce((sum, wo) => {
        const accepted = wo.acceptedAt!.getTime();
        const completed = wo.completedAt!.getTime();
        return sum + (completed - accepted) / (1000 * 60 * 60);
      }, 0);
      avgLeadTimeHours = totalHours / completedWithDates.length;
    }

    const totalOrders = pending + inProduction + completed;

    return {
      ordersPending: pending,
      ordersInProduction: inProduction,
      ordersCompleted: completed,
      avgLeadTimeHours: Math.round(avgLeadTimeHours * 100) / 100,
      totalOrders,
    };
  }

  /**
   * Routes order to the best supplier (Artisan) based on capacity, location, SLA.
   */
  async routeToSupplier(orderId: string): Promise<{ workOrderId: string; artisanId: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { workOrder: true },
    });

    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }
    if (order.workOrder) {
      return {
        workOrderId: order.workOrder.id,
        artisanId: order.workOrder.artisanId,
      };
    }

    const artisans = await this.prisma.artisan.findMany({
      where: {
        status: 'active',
        kycStatus: 'VERIFIED',
      },
      include: { _count: { select: { workOrders: true } } },
      take: 50,
    });

    const available = artisans
      .filter((a) => (a.currentLoad ?? 0) < (a.maxVolume ?? 10))
      .sort((a, b) => {
        const rateA = a.onTimeDeliveryRate ?? 0;
        const rateB = b.onTimeDeliveryRate ?? 0;
        if (rateB !== rateA) return rateB - rateA;
        const scoreA = a.qualityScore ?? 0;
        const scoreB = b.qualityScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (a.averageLeadTime ?? 99) - (b.averageLeadTime ?? 99);
      });

    if (available.length === 0) {
      throw new BadRequestException('No available supplier for routing');
    }

    const best = available[0];
    const workOrder = await this.prisma.workOrder.create({
      data: {
        orderId,
        artisanId: best.id,
        status: 'ASSIGNED',
        routingScore: best.qualityScore ?? 0,
        routingReason: 'capacity_and_sla',
        selectedAt: new Date(),
      },
    });

    await this.prisma.artisan.update({
      where: { id: best.id },
      data: { currentLoad: { increment: 1 } },
    });

    this.logger.log(`Order ${orderId} routed to artisan ${best.id}`);

    return { workOrderId: workOrder.id, artisanId: best.id };
  }

  /**
   * Returns supplier (Artisan) SLA metrics.
   */
  async getSupplierSLA(supplierId: string): Promise<SupplierSLAMetrics> {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: supplierId },
      include: {
        slaRecords: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            deadline: true,
            completedAt: true,
            onTime: true,
          },
        },
      },
    });

    if (!artisan) {
      throw new NotFoundException(`Supplier not found: ${supplierId}`);
    }

    return {
      supplierId: artisan.id,
      slaLevel: artisan.slaLevel ?? 'standard',
      onTimeDeliveryRate: artisan.onTimeDeliveryRate ?? 0,
      averageLeadTimeDays: artisan.averageLeadTime ?? 0,
      qualityScore: artisan.qualityScore ?? 0,
      totalOrders: artisan.totalOrders ?? 0,
      completedOrders: artisan.completedOrders ?? 0,
      recentSlaRecords: artisan.slaRecords.map((r) => ({
        deadline: r.deadline,
        completedAt: r.completedAt,
        onTime: r.onTime,
      })),
    };
  }
}
