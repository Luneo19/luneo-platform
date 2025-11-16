import { Job, Worker, type KeepJobs, type WorkerOptions } from 'bullmq';
import sharp from 'sharp';
import type { Logger } from 'winston';
import { createWorkerLogger, serializeError } from '../utils/logger';
import { saveToStorage } from '../utils/storage';
import { traceJob, withActiveSpan } from '../observability/span-helpers';

const QUEUE_NAME = 'ar-preview';
const DEFAULT_REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};
const CLEANUP_ON_COMPLETE: KeepJobs = { count: 50 };
const CLEANUP_ON_FAIL: KeepJobs = { count: 25 };

type WorkerConnection = WorkerOptions['connection'];

interface ARPreviewJobData {
  baseImageUrl: string;
  overlayImageUrl?: string;
  userId: string;
  designId: string;
  width?: number;
  height?: number;
}

interface ARPreviewResult {
  success: boolean;
  imageUrl?: string;
  metadata?: {
    width: number;
    height: number;
    hasOverlay: boolean;
    fileSize: number;
  };
  error?: string;
}

export class ARPreviewWorker {
  private worker: Worker<ARPreviewJobData, ARPreviewResult>;
  private readonly logger: Logger;

  constructor(connection: WorkerConnection = DEFAULT_REDIS_CONNECTION) {
    this.logger = createWorkerLogger('ar-preview');
    this.worker = new Worker<ARPreviewJobData, ARPreviewResult>(
      QUEUE_NAME,
      this.processJob.bind(this),
      {
        connection,
        concurrency: 1,
        removeOnComplete: CLEANUP_ON_COMPLETE,
        removeOnFail: CLEANUP_ON_FAIL,
      }
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error('AR preview job failed', {
        jobId: job?.id,
        queue: job?.queueName,
        error: serializeError(err),
      });
    });
  }

  public async start(): Promise<void> {
    this.logger.info('AR preview worker started');
  }

  public async stop(): Promise<void> {
    await this.worker.close();
    this.logger.info('AR preview worker stopped');
  }

  private async processJob(job: Job<ARPreviewJobData>): Promise<ARPreviewResult> {
    return traceJob('worker.ar-preview.process', job, async () => {
      const {
        baseImageUrl,
        overlayImageUrl,
        userId,
        designId,
        width = 1280,
        height = 720,
      } = job.data;

      try {
        const baseBuffer = await withActiveSpan(
          'worker.ar-preview.download-base',
          { 'http.url': baseImageUrl },
          async () => this.download(baseImageUrl),
        );
        const baseImage = sharp(baseBuffer)
          .resize(width, height, { fit: 'cover' })
          .ensureAlpha();

        let composed = baseImage;
        let hasOverlay = false;

        if (overlayImageUrl) {
          const overlayBuffer = await withActiveSpan(
            'worker.ar-preview.download-overlay',
            { 'http.url': overlayImageUrl },
            async () => this.download(overlayImageUrl),
          );
          hasOverlay = true;

          composed = composed.composite([
            {
              input: await sharp(overlayBuffer)
                .resize(Math.round(width * 0.6))
                .png()
                .toBuffer(),
              gravity: 'center',
            },
          ]);
        }

        const previewBuffer = await withActiveSpan(
          'worker.ar-preview.render',
          { width, height, hasOverlay },
          async () =>
            composed
              .png({ quality: 90 })
              .toBuffer(),
        );

        const saved = await withActiveSpan(
          'worker.ar-preview.save',
          { 'luneo.design.id': designId },
          async () =>
            saveToStorage(
              previewBuffer,
              `ar-previews/${userId}/${designId}-${Date.now()}.png`,
              {
                contentType: 'image/png',
                metadata: {
                  hasOverlay,
                  width,
                  height,
                },
              },
            ),
        );

        return {
          success: true,
          imageUrl: saved.url,
          metadata: {
            width,
            height,
            hasOverlay,
            fileSize: saved.size,
          },
        };
      } catch (error) {
        this.logger.error('AR preview generation failed', {
          jobId: job.id,
          error: serializeError(error),
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  private async download(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}


