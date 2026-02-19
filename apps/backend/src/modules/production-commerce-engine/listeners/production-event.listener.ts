import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineOrchestratorService } from '../core/pipeline-orchestrator.service';
import { PCEOrchestratorService } from '../core/pce-orchestrator.service';
import { PIPELINE_STAGES } from '../pce.constants';

@Injectable()
export class ProductionEventListener {
  private readonly logger = new Logger(ProductionEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
    private readonly pceOrchestrator: PCEOrchestratorService,
  ) {}

  @OnEvent('production.order.completed')
  async handleProductionCompleted(event: { orderId: string }) {
    this.logger.log(`Production completed for order: ${event.orderId}`);

    const pipeline = await this.prisma.pipeline.findUnique({
      where: { orderId: event.orderId },
    });

    if (pipeline && pipeline.currentStage === PIPELINE_STAGES.PRODUCTION) {
      try {
        await this.pipelineOrchestrator.advanceStage(pipeline.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to advance after production: ${message}`);
      }
    }
  }

  @OnEvent('production.order.shipped')
  async handleProductionShipped(event: { orderId: string; trackingNumber?: string }) {
    this.logger.log(`Production shipped for order: ${event.orderId}`);

    const pipeline = await this.prisma.pipeline.findUnique({
      where: { orderId: event.orderId },
    });

    if (pipeline && pipeline.currentStage === PIPELINE_STAGES.PRODUCTION) {
      try {
        await this.pipelineOrchestrator.advanceStage(pipeline.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to advance after production shipped: ${message}`);
      }
    }
  }

  @OnEvent('production.order.failed')
  async handleProductionFailed(event: { orderId: string; error?: string }) {
    this.logger.error(`Production failed for order: ${event.orderId}`);

    const pipeline = await this.prisma.pipeline.findUnique({
      where: { orderId: event.orderId },
    });

    if (pipeline) {
      await this.pceOrchestrator.handleStageFailed(
        pipeline.id,
        PIPELINE_STAGES.PRODUCTION,
        event.error ?? 'Production failed',
        true,
      );
    }
  }
}
