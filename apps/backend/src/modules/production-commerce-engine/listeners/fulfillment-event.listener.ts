import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineOrchestratorService } from '../core/pipeline-orchestrator.service';
import { PIPELINE_STAGES } from '../pce.constants';

@Injectable()
export class FulfillmentEventListener {
  private readonly logger = new Logger(FulfillmentEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
  ) {}

  @OnEvent('fulfillment.shipped')
  async handleFulfillmentShipped(event: { orderId: string; trackingNumber?: string; trackingUrl?: string }) {
    this.logger.log(`Fulfillment shipped for order: ${event.orderId}`);

    const pipeline = await this.prisma.pipeline.findUnique({
      where: { orderId: event.orderId },
    });

    if (pipeline && pipeline.currentStage === PIPELINE_STAGES.SHIPPING) {
      try {
        await this.pipelineOrchestrator.advanceStage(pipeline.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to advance after shipping: ${message}`);
      }
    }
  }

  @OnEvent('fulfillment.delivered')
  async handleFulfillmentDelivered(event: { orderId: string }) {
    this.logger.log(`Fulfillment delivered for order: ${event.orderId}`);

    const pipeline = await this.prisma.pipeline.findUnique({
      where: { orderId: event.orderId },
    });

    if (pipeline) {
      try {
        await this.pipelineOrchestrator.completePipeline(pipeline.id);

        await this.prisma.order.update({
          where: { id: event.orderId },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to complete after delivery: ${message}`);
      }
    }
  }
}
