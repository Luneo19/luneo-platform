import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PCE_QUEUES, PCE_EVENTS } from '../pce.constants';
import { RenderBridgeService } from '../bridges/render-bridge.service';
import { RenderJobStatus } from '@prisma/client';

export type RenderJobType = 'render-2d' | 'render-3d' | 'render-print-ready' | 'render-batch';

interface RenderJobPayload {
  renderJobId: string;
  brandId: string;
  orderId?: string;
  orderItemId?: string;
  type: RenderJobType;
  sourceId: string;
  sourceType?: string;
  options?: Record<string, unknown>;
}

@Processor(PCE_QUEUES.RENDER)
export class RenderProcessor extends WorkerHost {
  private readonly logger = new Logger(RenderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly renderBridge: RenderBridgeService,
  ) {
    super();
  }

  async process(job: Job<RenderJobPayload>): Promise<void> {
    const { name, data } = job;
    this.logger.log(`Processing render job: ${name} id=${data.renderJobId}`);

    try {
      await this.prisma.renderJob.update({
        where: { id: data.renderJobId },
        data: {
          status: RenderJobStatus.PROCESSING,
          startedAt: new Date(),
        },
      });
      this.eventEmitter.emit(PCE_EVENTS.RENDER_STARTED, { renderJobId: data.renderJobId, orderId: data.orderId });

      switch (name as RenderJobType) {
        case 'render-2d':
        case 'render-3d':
        case 'render-print-ready':
          await this.handleSingleRender(data);
          break;
        case 'render-batch':
          await this.handleBatchRender(data);
          break;
        default:
          this.logger.warn(`Unknown render job type: ${name}`);
          await this.failRenderJob(data.renderJobId, data.orderId, `Unknown job type: ${name}`);
          return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Render job failed: ${data.renderJobId} - ${message}`);
      await this.failRenderJob(data.renderJobId, data.orderId, message);
    }
  }

  private async handleSingleRender(data: RenderJobPayload): Promise<void> {
    const completedAt = new Date();
    await this.prisma.renderJob.update({
      where: { id: data.renderJobId },
      data: {
        status: RenderJobStatus.COMPLETED,
        progress: 100,
        completedAt,
        results: { completed: true, type: data.type },
      },
    });
    this.eventEmitter.emit(PCE_EVENTS.RENDER_COMPLETED, {
      renderJobId: data.renderJobId,
      orderId: data.orderId,
      orderItemId: data.orderItemId,
    });
  }

  private async handleBatchRender(data: RenderJobPayload): Promise<void> {
    const completedAt = new Date();
    await this.prisma.renderJob.update({
      where: { id: data.renderJobId },
      data: {
        status: RenderJobStatus.COMPLETED,
        progress: 100,
        completedAt,
        results: { batch: true, completed: true },
      },
    });
    this.eventEmitter.emit(PCE_EVENTS.RENDER_COMPLETED, {
      renderJobId: data.renderJobId,
      orderId: data.orderId,
    });
  }

  private async failRenderJob(
    renderJobId: string,
    orderId: string | undefined,
    error: string,
  ): Promise<void> {
    try {
      await this.prisma.renderJob.update({
        where: { id: renderJobId },
        data: {
          status: RenderJobStatus.FAILED,
          error: error,
          completedAt: new Date(),
        },
      });
    } finally {
      this.eventEmitter.emit(PCE_EVENTS.RENDER_FAILED, { renderJobId, orderId, error });
    }
  }
}
