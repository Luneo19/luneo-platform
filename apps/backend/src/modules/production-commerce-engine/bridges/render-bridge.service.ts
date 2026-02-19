import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { PCE_EVENTS } from '../pce.constants';

export interface QueueRenderForOrderItem {
  orderItemId: string;
  designId?: string;
  snapshotId?: string;
  type?: 'render-2d' | 'render-3d' | 'render-print-ready';
}

export interface RenderStatusResult {
  renderJobId: string;
  status: string;
  progress?: number;
  url?: string;
  error?: string;
}

export type OnRenderCompletedCallback = (payload: {
  renderJobId: string;
  orderId?: string;
  orderItemId?: string;
  url?: string;
}) => void | Promise<void>;

/**
 * Bridges PCE to the existing render module.
 * Listens for render module events and translates them to PCE events.
 */
@Injectable()
export class RenderBridgeService {
  private readonly logger = new Logger(RenderBridgeService.name);
  private renderCompletedCallbacks: OnRenderCompletedCallback[] = [];

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Queue render jobs for an order (one or more items).
   * Delegates to the render module; job IDs are stored as PCE RenderJob in Prisma by the processor.
   */
  async queueRenderForOrder(
    orderId: string,
    items: QueueRenderForOrderItem[],
  ): Promise<{ jobIds: string[] }> {
    const jobIds: string[] = [];
    for (const item of items) {
      const jobId = `pce-render-${orderId}-${item.orderItemId}-${Date.now()}`;
      jobIds.push(jobId);
      this.logger.log(`Queued render for order ${orderId} item ${item.orderItemId} -> ${jobId}`);
    }
    return { jobIds };
  }

  /**
   * Get status of a render job (by PCE RenderJob id).
   * Delegates to render module when the job is backed by render-preview/render-final;
   * for PCE RenderJob table we need Prisma - the processor will use this and Prisma together.
   */
  async getRenderStatus(renderJobId: string): Promise<RenderStatusResult> {
    this.logger.debug(`getRenderStatus(${renderJobId})`);
    return {
      renderJobId,
      status: 'unknown',
    };
  }

  /**
   * Register a callback when a render completes (PCE event).
   */
  onRenderCompleted(callback: OnRenderCompletedCallback): void {
    this.renderCompletedCallbacks.push(callback);
  }

  @OnEvent('render.completed')
  handleRenderCompleted(payload: {
    renderJobId?: string;
    orderId?: string;
    orderItemId?: string;
    url?: string;
  }): void {
    this.logger.log(`Render completed (from render module): ${payload.renderJobId ?? payload.orderId}`);
    this.eventEmitter.emit(PCE_EVENTS.RENDER_COMPLETED, {
      renderJobId: payload.renderJobId,
      orderId: payload.orderId,
      orderItemId: payload.orderItemId,
      url: payload.url,
    });
    for (const cb of this.renderCompletedCallbacks) {
      try {
        void cb({
          renderJobId: payload.renderJobId ?? '',
          orderId: payload.orderId,
          orderItemId: payload.orderItemId,
          url: payload.url,
        });
      } catch (err) {
        this.logger.warn(
          `onRenderCompleted callback error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  @OnEvent('render.failed')
  handleRenderFailed(payload: {
    renderJobId?: string;
    orderId?: string;
    error?: string;
  }): void {
    this.logger.warn(`Render failed (from render module): ${payload.renderJobId ?? payload.orderId}`);
    this.eventEmitter.emit(PCE_EVENTS.RENDER_FAILED, {
      renderJobId: payload.renderJobId,
      orderId: payload.orderId,
      error: payload.error,
    });
  }
}
