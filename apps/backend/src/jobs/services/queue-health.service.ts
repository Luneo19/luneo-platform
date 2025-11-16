import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from '../queue.constants';
import { ConfigService } from '@nestjs/config';

export interface QueueHealthOverview {
  name: string;
  counts: Record<string, number>;
  isHealthy: boolean;
  lastUpdated: string;
  lastFailedJobId?: string;
  lastFailedReason?: string;
  lastFailedAt?: string;
  oldestWaitingJobId?: string;
  oldestWaitingAt?: string;
}

@Injectable()
export class QueueHealthService {
  private readonly logger = new Logger(QueueHealthService.name);
  private readonly queues: Record<string, Queue>;
  private readonly waitThreshold: number;
  private readonly oldestSecondsThreshold: number;

  constructor(
    @InjectQueue(QueueNames.AI_GENERATION) private readonly aiGenerationQueue: Queue,
    @InjectQueue(QueueNames.DESIGN_GENERATION) private readonly designGenerationQueue: Queue,
    @InjectQueue(QueueNames.IMAGE_GENERATION) private readonly imageGenerationQueue: Queue,
    @InjectQueue(QueueNames.IMAGE_UPSCALE) private readonly imageUpscaleQueue: Queue,
    @InjectQueue(QueueNames.TEXTURE_BLEND) private readonly textureBlendQueue: Queue,
    @InjectQueue(QueueNames.EXPORT_GLTF) private readonly exportGltfQueue: Queue,
    @InjectQueue(QueueNames.AR_PREVIEW) private readonly arPreviewQueue: Queue,
    @InjectQueue(QueueNames.RENDER_PROCESSING) private readonly renderProcessingQueue: Queue,
    @InjectQueue(QueueNames.RENDER_2D) private readonly render2DQueue: Queue,
    @InjectQueue(QueueNames.RENDER_3D) private readonly render3DQueue: Queue,
    @InjectQueue(QueueNames.PRODUCT_ENGINE) private readonly productEngineQueue: Queue,
    @InjectQueue(QueueNames.ECOMMERCE_SYNC) private readonly ecommerceSyncQueue: Queue,
    @InjectQueue(QueueNames.ECOMMERCE_WEBHOOKS) private readonly ecommerceWebhooksQueue: Queue,
    @InjectQueue(QueueNames.USAGE_METERING) private readonly usageMeteringQueue: Queue,
    @InjectQueue(QueueNames.PRODUCTION_PROCESSING) private readonly productionQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.queues = {
      [QueueNames.AI_GENERATION]: this.aiGenerationQueue,
      [QueueNames.DESIGN_GENERATION]: this.designGenerationQueue,
      [QueueNames.IMAGE_GENERATION]: this.imageGenerationQueue,
      [QueueNames.IMAGE_UPSCALE]: this.imageUpscaleQueue,
      [QueueNames.TEXTURE_BLEND]: this.textureBlendQueue,
      [QueueNames.EXPORT_GLTF]: this.exportGltfQueue,
      [QueueNames.AR_PREVIEW]: this.arPreviewQueue,
      [QueueNames.RENDER_PROCESSING]: this.renderProcessingQueue,
      [QueueNames.RENDER_2D]: this.render2DQueue,
      [QueueNames.RENDER_3D]: this.render3DQueue,
      [QueueNames.PRODUCT_ENGINE]: this.productEngineQueue,
      [QueueNames.ECOMMERCE_SYNC]: this.ecommerceSyncQueue,
      [QueueNames.ECOMMERCE_WEBHOOKS]: this.ecommerceWebhooksQueue,
      [QueueNames.USAGE_METERING]: this.usageMeteringQueue,
      [QueueNames.PRODUCTION_PROCESSING]: this.productionQueue,
    };

    const monitoring = this.configService.get('monitoring');
    this.waitThreshold = monitoring?.queueWaitThreshold ?? 100;
    this.oldestSecondsThreshold = monitoring?.queueOldestSeconds ?? 120;
  }

  async getOverview(): Promise<QueueHealthOverview[]> {
    const now = new Date().toISOString();

    const results = await Promise.all(
      Object.entries(this.queues).map(async ([name, queue]) => {
        try {
          const [countsRaw, failedJobs, waitingJobs] = await Promise.all([
            queue.getJobCounts(),
            queue.getJobs(['failed'], 0, 0),
            queue.getJobs(['waiting', 'delayed'], 0, 0, true),
          ]);

          const counts = countsRaw as Record<string, number>;
          const lastFailed = failedJobs?.[0];
          const oldestWaiting = waitingJobs?.[0];
          const waiting = counts.waiting ?? 0;
          const delayed = counts.delayed ?? 0;

          const oldestWaitingSeconds = oldestWaiting?.timestamp
            ? Math.max(0, (Date.now() - oldestWaiting.timestamp) / 1000)
            : 0;

          const isHealthy =
            waiting + delayed <= this.waitThreshold &&
            oldestWaitingSeconds <= this.oldestSecondsThreshold;

          return {
            name,
            counts,
            isHealthy,
            lastUpdated: now,
            lastFailedJobId: lastFailed?.id?.toString(),
            lastFailedReason: lastFailed?.failedReason,
            lastFailedAt: lastFailed?.finishedOn
              ? new Date(lastFailed.finishedOn).toISOString()
              : undefined,
            oldestWaitingJobId: oldestWaiting?.id?.toString(),
            oldestWaitingAt: oldestWaiting?.timestamp
              ? new Date(oldestWaiting.timestamp).toISOString()
              : undefined,
          };
        } catch (error) {
          this.logger.error(
            `Failed to retrieve counts for queue ${name}`,
            error instanceof Error ? error.stack : undefined,
            error instanceof Error ? error : undefined,
          );
          return {
            name,
            counts: {
              active: 0,
              completed: 0,
              delayed: 0,
              failed: 0,
              paused: 0,
              waiting: 0,
              waitingChildren: 0,
            },
            isHealthy: false,
            lastUpdated: now,
          };
        }
      }),
    );

    return results;
  }
}

