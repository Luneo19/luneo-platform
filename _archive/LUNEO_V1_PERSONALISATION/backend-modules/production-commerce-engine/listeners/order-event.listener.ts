import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PCEOrchestratorService } from '../core/pce-orchestrator.service';
import { PipelineOrchestratorService } from '../core/pipeline-orchestrator.service';
import { PCEConfigService } from '../core/pce-config.service';

@Injectable()
export class OrderEventListener {
  private readonly logger = new Logger(OrderEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pceOrchestrator: PCEOrchestratorService,
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
    private readonly pceConfig: PCEConfigService,
  ) {}

  @OnEvent('order.paid')
  async handleOrderPaid(event: { orderId: string; brandId: string }) {
    if (!this.pceConfig.autoProcessOnPayment) return;
    this.logger.log(`Order paid, starting pipeline: ${event.orderId}`);

    try {
      await this.pceOrchestrator.processOrder({
        orderId: event.orderId,
        brandId: event.brandId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to start pipeline for order ${event.orderId}: ${message}`);
    }
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(event: { orderId: string; reason?: string }) {
    this.logger.log(`Order cancelled: ${event.orderId}`);

    try {
      const pipeline = await this.prisma.pipeline.findUnique({
        where: { orderId: event.orderId },
      });

      if (pipeline) {
        await this.pipelineOrchestrator.cancelPipeline(pipeline.id, event.reason);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to cancel pipeline for order ${event.orderId}: ${message}`);
    }
  }
}
