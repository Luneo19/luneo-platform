import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { FulfillmentStatus } from '@prisma/client';
import { PCE_EVENTS } from '../../pce.constants';

export interface ListFulfillmentsFilters {
  status?: FulfillmentStatus;
  limit?: number;
  offset?: number;
}

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createFulfillment(pipelineId: string, brandId: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
    });
    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }
    if (pipeline.brandId !== brandId) {
      throw new BadRequestException('Pipeline does not belong to brand');
    }

    const existing = await this.prisma.fulfillment.findUnique({
      where: { pipelineId },
    });
    if (existing) {
      throw new BadRequestException(
        `Fulfillment already exists for pipeline ${pipelineId}`,
      );
    }

    const fulfillment = await this.prisma.fulfillment.create({
      data: {
        pipelineId,
        orderId: pipeline.orderId,
        brandId,
        status: FulfillmentStatus.PENDING,
      },
    });

    this.eventEmitter.emit(PCE_EVENTS.FULFILLMENT_CREATED, {
      fulfillmentId: fulfillment.id,
      pipelineId,
      orderId: fulfillment.orderId,
      brandId,
    });
    this.logger.log(`Fulfillment created: ${fulfillment.id} for pipeline ${pipelineId}`);

    return fulfillment;
  }

  async getFulfillment(id: string, brandId: string) {
    const fulfillment = await this.prisma.fulfillment.findUnique({
      where: { id },
      include: {
        pipeline: {
          select: {
            id: true,
            currentStage: true,
            status: true,
            orderId: true,
          },
        },
      },
    });
    if (!fulfillment) {
      throw new NotFoundException(`Fulfillment ${id} not found`);
    }
    if (fulfillment.brandId !== brandId) {
      throw new NotFoundException(`Fulfillment ${id} not found`);
    }
    return fulfillment;
  }

  async listFulfillments(
    brandId: string,
    filters: ListFulfillmentsFilters = {},
  ) {
    const { status, limit = 20, offset = 0 } = filters;
    const where: { brandId: string; status?: FulfillmentStatus } = { brandId };
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.fulfillment.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          pipeline: {
            select: {
              id: true,
              currentStage: true,
              status: true,
              orderId: true,
            },
          },
        },
      }),
      this.prisma.fulfillment.count({ where }),
    ]);

    return { items, total };
  }

  async updateFulfillmentStatus(
    id: string,
    brandId: string,
    status: FulfillmentStatus,
  ) {
    const fulfillment = await this.getFulfillment(id, brandId);

    const updated = await this.prisma.fulfillment.update({
      where: { id },
      data: { status },
    });

    if (
      status === FulfillmentStatus.SHIPPED ||
      status === FulfillmentStatus.IN_TRANSIT ||
      status === FulfillmentStatus.OUT_FOR_DELIVERY
    ) {
      this.eventEmitter.emit(PCE_EVENTS.FULFILLMENT_SHIPPED, {
        fulfillmentId: id,
        orderId: fulfillment.orderId,
        trackingNumber: updated.trackingNumber,
        trackingUrl: updated.trackingUrl,
      });
    }
    if (status === FulfillmentStatus.DELIVERED) {
      this.eventEmitter.emit(PCE_EVENTS.FULFILLMENT_DELIVERED, {
        fulfillmentId: id,
        orderId: fulfillment.orderId,
      });
    }

    this.logger.log(`Fulfillment ${id} status updated to ${status}`);
    return updated;
  }

  async cancelFulfillment(id: string, brandId: string) {
    const fulfillment = await this.getFulfillment(id, brandId);

    const cancellable: FulfillmentStatus[] = [
      FulfillmentStatus.PENDING,
      FulfillmentStatus.PICKING,
      FulfillmentStatus.PACKING,
      FulfillmentStatus.READY_TO_SHIP,
    ];
    if (!cancellable.includes(fulfillment.status)) {
      throw new BadRequestException(
        `Fulfillment cannot be cancelled in status ${fulfillment.status}`,
      );
    }

    const updated = await this.prisma.fulfillment.update({
      where: { id },
      data: { status: FulfillmentStatus.CANCELLED },
    });
    this.logger.log(`Fulfillment ${id} cancelled`);
    return updated;
  }

  async markAsShipped(
    id: string,
    brandId: string,
    data: {
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
      weight?: number;
      packages?: unknown;
      estimatedDelivery?: string;
    },
  ) {
    const fulfillment = await this.getFulfillment(id, brandId);

    const estimatedDelivery = data.estimatedDelivery
      ? new Date(data.estimatedDelivery)
      : undefined;

    const updated = await this.prisma.fulfillment.update({
      where: { id },
      data: {
        status: FulfillmentStatus.SHIPPED,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl ?? undefined,
        shippedAt: new Date(),
        weight: data.weight,
        packages: data.packages ?? undefined,
        estimatedDelivery,
      },
    });

    this.eventEmitter.emit(PCE_EVENTS.FULFILLMENT_SHIPPED, {
      fulfillmentId: id,
      orderId: fulfillment.orderId,
      trackingNumber: updated.trackingNumber,
      trackingUrl: updated.trackingUrl,
    });
    this.logger.log(`Fulfillment ${id} marked as shipped`);
    return updated;
  }

  async markAsDelivered(id: string, brandId: string) {
    const fulfillment = await this.getFulfillment(id, brandId);

    const updated = await this.prisma.fulfillment.update({
      where: { id },
      data: {
        status: FulfillmentStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    this.eventEmitter.emit(PCE_EVENTS.FULFILLMENT_DELIVERED, {
      fulfillmentId: id,
      orderId: fulfillment.orderId,
    });
    this.logger.log(`Fulfillment ${id} marked as delivered`);
    return updated;
  }
}
