import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TryOnScreenshotService } from '../services/try-on-screenshot.service';
import { PerformanceService } from '../services/performance.service';
import { TryOnBillingSyncService } from '../services/try-on-billing-sync.service';

export interface ProcessScreenshotBatchPayload {
  sessionId: string;
  screenshots: Array<{
    imageBase64: string;
    productId: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface AggregateSessionMetricsPayload {
  sessionId: string;
  metrics: Array<{
    fps: number;
    detectionLatencyMs: number;
    renderLatencyMs: number;
    gpuInfo?: string;
    deviceType: string;
    browserInfo?: string;
  }>;
}

export interface ExpireSessionsPayload {
  maxInactiveMinutes: number;
}

/**
 * TryOnProcessor - BullMQ worker for async try-on operations.
 *
 * Jobs:
 * - process-screenshot-batch: Async thumbnail generation + Cloudinary upload
 * - aggregate-session-metrics: Aggregate performance metrics on session end
 * - expire-sessions: Cron-triggered cleanup of stale sessions
 */
@Processor('try-on-processing')
export class TryOnProcessor extends WorkerHost {
  private readonly logger = new Logger(TryOnProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly screenshotService: TryOnScreenshotService,
    private readonly performanceService: PerformanceService,
    @Optional() private readonly billingSyncService?: TryOnBillingSyncService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    this.logger.log(`Processing job ${job.name} (${job.id})`);

    switch (job.name) {
      case 'process-screenshot-batch':
        return this.processScreenshotBatch(
          job as Job<ProcessScreenshotBatchPayload>,
        );
      case 'aggregate-session-metrics':
        return this.aggregateSessionMetrics(
          job as Job<AggregateSessionMetricsPayload>,
        );
      case 'expire-sessions':
        return this.expireSessions(job as Job<ExpireSessionsPayload>);
      case 'billing-sync':
        return this.runBillingSync();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return null;
    }
  }

  /**
   * Process a batch of screenshots asynchronously.
   * Offloads thumbnail generation and Cloudinary upload from the controller.
   */
  private async processScreenshotBatch(
    job: Job<ProcessScreenshotBatchPayload>,
  ) {
    const { sessionId, screenshots } = job.data;
    this.logger.log(
      `Processing ${screenshots.length} screenshots for session ${sessionId}`,
    );

    try {
      const result = await this.screenshotService.createBatch(
        sessionId,
        screenshots,
      );

      this.logger.log(
        `Screenshot batch complete: ${result.created} created, ${result.failed} failed`,
      );

      return result;
    } catch (error) {
      this.logger.error('Screenshot batch processing failed', {
        sessionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Aggregate performance metrics for a session.
   * Calculates averages and stores on the session record.
   */
  private async aggregateSessionMetrics(
    job: Job<AggregateSessionMetricsPayload>,
  ) {
    const { sessionId, metrics } = job.data;
    this.logger.log(
      `Aggregating ${metrics.length} metrics for session ${sessionId}`,
    );

    try {
      const result = await this.performanceService.recordSessionSummary(
        sessionId,
        metrics,
      );

      this.logger.log(`Metrics aggregation complete for session ${sessionId}`);
      return result;
    } catch (error) {
      this.logger.error('Metrics aggregation failed', {
        sessionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Run the monthly billing sync for try-on commissions and overages.
   */
  private async runBillingSync() {
    if (!this.billingSyncService) {
      this.logger.warn('TryOnBillingSyncService not available, skipping billing sync');
      return { skipped: true };
    }

    this.logger.log('Running try-on billing sync');
    const result = await this.billingSyncService.syncAllBrands();
    this.logger.log(`Billing sync complete: ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * Expire stale sessions that have been inactive beyond the threshold.
   * Intended to be called via a scheduled/cron job.
   */
  private async expireSessions(job: Job<ExpireSessionsPayload>) {
    const { maxInactiveMinutes } = job.data;
    const cutoff = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);

    this.logger.log(
      `Expiring sessions inactive since ${cutoff.toISOString()}`,
    );

    try {
      const result = await this.prisma.tryOnSession.updateMany({
        where: {
          status: 'ACTIVE',
          updatedAt: { lt: cutoff },
          endedAt: null,
        },
        data: {
          status: 'EXPIRED',
          endedAt: new Date(),
        },
      });

      this.logger.log(`Expired ${result.count} stale sessions`);
      return { expiredCount: result.count };
    } catch (error) {
      this.logger.error('Session expiry failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
