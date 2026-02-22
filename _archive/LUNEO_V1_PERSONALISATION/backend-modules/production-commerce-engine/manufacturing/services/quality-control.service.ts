import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ProductionOrderStatus } from '@prisma/client';

export interface QualityReport {
  productionOrderId: string;
  status: string;
  submittedAt: Date | null;
  completedAt: Date | null;
  qualityStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  statusHistory: unknown;
}

@Injectable()
export class QualityControlService {
  private readonly logger = new Logger(QualityControlService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark a production order as submitted for quality review (e.g. move to QUALITY_CHECK).
   */
  async submitForReview(
    productionOrderId: string,
    brandId: string,
  ): Promise<{ id: string; status: string }> {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id: productionOrderId, brandId },
    });
    if (!order) {
      throw new NotFoundException(`Production order not found: ${productionOrderId}`);
    }
    if (order.status !== ProductionOrderStatus.IN_PRODUCTION) {
      throw new BadRequestException(
        `Order must be IN_PRODUCTION to submit for quality review. Current: ${order.status}`,
      );
    }
    const statusHistory = (order.statusHistory as Array<{ status: string; at: string }>) ?? [];
    statusHistory.push({
      status: ProductionOrderStatus.QUALITY_CHECK,
      at: new Date().toISOString(),
    });
    await this.prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        status: ProductionOrderStatus.QUALITY_CHECK,
        statusHistory: statusHistory as object,
      },
    });
    this.logger.log(`Production order ${productionOrderId} submitted for quality review`);
    return { id: productionOrderId, status: ProductionOrderStatus.QUALITY_CHECK };
  }

  /**
   * Approve quality and move to READY_TO_SHIP.
   */
  async approveQuality(id: string, brandId: string): Promise<{ id: string; status: string }> {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, brandId },
    });
    if (!order) {
      throw new NotFoundException(`Production order not found: ${id}`);
    }
    if (order.status !== ProductionOrderStatus.QUALITY_CHECK) {
      throw new BadRequestException(
        `Order must be in QUALITY_CHECK to approve. Current: ${order.status}`,
      );
    }
    const statusHistory = (order.statusHistory as Array<{ status: string; at: string }>) ?? [];
    statusHistory.push({
      status: ProductionOrderStatus.READY_TO_SHIP,
      at: new Date().toISOString(),
    });
    await this.prisma.productionOrder.update({
      where: { id },
      data: {
        status: ProductionOrderStatus.READY_TO_SHIP,
        statusHistory: statusHistory as object,
      },
    });
    this.logger.log(`Quality approved for production order ${id}`);
    return { id, status: ProductionOrderStatus.READY_TO_SHIP };
  }

  /**
   * Reject quality and optionally set error/reason.
   */
  async rejectQuality(
    id: string,
    brandId: string,
    reason: string,
  ): Promise<{ id: string; status: string }> {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, brandId },
    });
    if (!order) {
      throw new NotFoundException(`Production order not found: ${id}`);
    }
    if (order.status !== ProductionOrderStatus.QUALITY_CHECK) {
      throw new BadRequestException(
        `Order must be in QUALITY_CHECK to reject. Current: ${order.status}`,
      );
    }
    const statusHistory = (order.statusHistory as Array<{ status: string; at: string }>) ?? [];
    statusHistory.push({
      status: 'QUALITY_REJECTED',
      at: new Date().toISOString(),
    });
    await this.prisma.productionOrder.update({
      where: { id },
      data: {
        status: ProductionOrderStatus.IN_PRODUCTION,
        error: reason,
        statusHistory: statusHistory as object,
      },
    });
    this.logger.warn(`Quality rejected for production order ${id}: ${reason}`);
    return { id, status: ProductionOrderStatus.IN_PRODUCTION };
  }

  /**
   * Get quality report for a production order.
   */
  async getQualityReport(id: string, brandId: string): Promise<QualityReport> {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, brandId },
    });
    if (!order) {
      throw new NotFoundException(`Production order not found: ${id}`);
    }
    let qualityStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    const history = (order.statusHistory as Array<{ status: string }>) ?? [];
    if (history.some((h) => h.status === ProductionOrderStatus.READY_TO_SHIP)) {
      qualityStatus = 'approved';
    } else if (history.some((h) => h.status === 'QUALITY_REJECTED')) {
      qualityStatus = 'rejected';
    }
    return {
      productionOrderId: order.id,
      status: order.status,
      submittedAt: order.submittedAt,
      completedAt: order.completedAt,
      qualityStatus,
      rejectionReason: order.error ?? undefined,
      statusHistory: order.statusHistory,
    };
  }
}
