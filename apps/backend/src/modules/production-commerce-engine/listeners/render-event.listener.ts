import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineOrchestratorService } from '../core/pipeline-orchestrator.service';
import { PCEOrchestratorService } from '../core/pce-orchestrator.service';
import { PIPELINE_STAGES } from '../pce.constants';

@Injectable()
export class RenderEventListener {
  private readonly logger = new Logger(RenderEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
    private readonly pceOrchestrator: PCEOrchestratorService,
  ) {}

  @OnEvent('render.completed')
  async handleRenderCompleted(event: { renderJobId?: string; orderId?: string }) {
    this.logger.log(`Render completed: ${event.renderJobId ?? event.orderId}`);

    const orderId = event.orderId;
    if (!orderId) return;

    const pipeline = await this.prisma.pipeline.findUnique({
      where: { orderId },
    });

    if (pipeline && pipeline.currentStage === PIPELINE_STAGES.RENDER) {
      try {
        await this.pipelineOrchestrator.advanceStage(pipeline.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to advance after render: ${message}`);
      }
    }
  }

  @OnEvent('render.failed')
  async handleRenderFailed(event: { renderJobId?: string; orderId?: string; error?: string }) {
    this.logger.error(`Render failed: ${event.renderJobId ?? event.orderId}`);

    const orderId = event.orderId;
    if (!orderId) return;

    const pipeline = await this.prisma.pipeline.findUnique({
      where: { orderId },
    });

    if (pipeline) {
      await this.pceOrchestrator.handleStageFailed(
        pipeline.id,
        PIPELINE_STAGES.RENDER,
        event.error ?? 'Render failed',
        true,
      );
    }
  }
}
