import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductionOrderStatus } from '@prisma/client';
import { PCE_QUEUES, PCE_EVENTS } from '../pce.constants';
import { ManufacturingOrchestratorService } from '../manufacturing/services/manufacturing-orchestrator.service';

type ProductionJobType = 'create-production' | 'check-status' | 'cancel-production';

interface CreateProductionPayload {
  orderId: string;
  brandId: string;
  providerId?: string;
  items: unknown;
  shippingAddress: unknown;
}

interface CheckStatusPayload {
  productionOrderId: string;
}

interface CancelProductionPayload {
  productionOrderId: string;
}

type ProductionJobPayload = CreateProductionPayload | CheckStatusPayload | CancelProductionPayload;

@Processor(PCE_QUEUES.PRODUCTION)
export class ProductionProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly manufacturingOrchestrator: ManufacturingOrchestratorService,
  ) {
    super();
  }

  async process(job: Job<ProductionJobPayload>): Promise<void> {
    const { name, data } = job;
    this.logger.log(`Processing production job: ${name}`);

    try {
      switch (name as ProductionJobType) {
        case 'create-production':
          await this.handleCreateProduction(data as CreateProductionPayload);
          break;
        case 'check-status':
          await this.handleCheckStatus(data as CheckStatusPayload);
          break;
        case 'cancel-production':
          await this.handleCancelProduction(data as CancelProductionPayload);
          break;
        default:
          this.logger.warn(`Unknown production job type: ${name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Production job failed: ${name} - ${message}`);
      if ('orderId' in data) {
        await this.prisma.productionOrder.updateMany({
          where: { orderId: (data as CreateProductionPayload).orderId },
          data: { status: ProductionOrderStatus.FAILED, error: message },
        });
        this.eventEmitter.emit(PCE_EVENTS.PRODUCTION_FAILED, {
          orderId: (data as CreateProductionPayload).orderId,
          error: message,
        });
      }
    }
  }

  private async handleCreateProduction(payload: CreateProductionPayload): Promise<void> {
    const record = await this.manufacturingOrchestrator.createProductionOrder({
      brandId: payload.brandId,
      orderId: payload.orderId,
      providerId: payload.providerId,
      items: (Array.isArray(payload.items) ? payload.items : []) as import('../manufacturing/interfaces/manufacturing.interface').PODOrderItem[],
      shippingAddress: (payload.shippingAddress ?? {}) as import('../manufacturing/interfaces/manufacturing.interface').PODShippingAddress,
    });
    this.eventEmitter.emit(PCE_EVENTS.PRODUCTION_SUBMITTED, {
      productionOrderId: record.id,
      orderId: payload.orderId,
    });
    this.eventEmitter.emit(PCE_EVENTS.PRODUCTION_ACCEPTED, {
      productionOrderId: record.id,
      externalOrderId: record.externalOrderId ?? undefined,
    });
  }

  private async handleCheckStatus(payload: CheckStatusPayload): Promise<void> {
    const status = await this.manufacturingOrchestrator.getProductionOrderStatus(payload.productionOrderId);
    await this.prisma.productionOrder.update({
      where: { id: payload.productionOrderId },
      data: {
        trackingNumber: status.trackingNumber ?? undefined,
        trackingUrl: status.trackingUrl ?? undefined,
      },
    });
  }

  private async handleCancelProduction(payload: CancelProductionPayload): Promise<void> {
    await this.manufacturingOrchestrator.cancelProductionOrder(payload.productionOrderId);
  }
}
