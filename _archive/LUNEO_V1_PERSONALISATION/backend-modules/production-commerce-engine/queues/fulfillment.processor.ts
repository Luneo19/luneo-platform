import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { FulfillmentStatus } from '@prisma/client';
import { PCE_QUEUES } from '../pce.constants';

interface FulfillmentPayload {
  pipelineId: string;
  action: 'CREATE' | 'SHIP';
}

@Processor(PCE_QUEUES.FULFILLMENT)
export class FulfillmentProcessor extends WorkerHost {
  private readonly logger = new Logger(FulfillmentProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<FulfillmentPayload>): Promise<void> {
    const { data } = job;
    this.logger.log(`Processing fulfillment job: ${data.action} for pipeline ${data.pipelineId}`);

    switch (data.action) {
      case 'CREATE':
        await this.createFulfillment(data.pipelineId);
        break;
      case 'SHIP':
        await this.markAsShipped(data.pipelineId);
        break;
    }
  }

  private async createFulfillment(pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
    });
    if (!pipeline) return;

    const existing = await this.prisma.fulfillment.findUnique({
      where: { pipelineId },
    });
    if (existing) return;

    await this.prisma.fulfillment.create({
      data: {
        pipelineId,
        orderId: pipeline.orderId,
        brandId: pipeline.brandId,
        status: FulfillmentStatus.PICKING,
      },
    });

    this.logger.log(`Fulfillment created for pipeline: ${pipelineId}`);
  }

  private async markAsShipped(pipelineId: string) {
    await this.prisma.fulfillment.update({
      where: { pipelineId },
      data: {
        status: FulfillmentStatus.SHIPPED,
        shippedAt: new Date(),
      },
    });

    this.logger.log(`Fulfillment shipped for pipeline: ${pipelineId}`);
  }
}
