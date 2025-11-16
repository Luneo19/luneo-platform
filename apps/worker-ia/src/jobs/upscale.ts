import { Job, Worker, type KeepJobs, type WorkerOptions } from 'bullmq';
import sharp from 'sharp';
import type { Logger } from 'winston';
import { createWorkerLogger, serializeError } from '../utils/logger';
import { saveToStorage } from '../utils/storage';
import { traceJob, withActiveSpan } from '../observability/span-helpers';

const QUEUE_NAME = 'image-upscale';
const DEFAULT_REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};
const CLEANUP_ON_COMPLETE: KeepJobs = { count: 50 };
const CLEANUP_ON_FAIL: KeepJobs = { count: 25 };

type WorkerConnection = WorkerOptions['connection'];

interface UpscaleJobData {
  imageUrl: string;
  designId: string;
  userId: string;
  scale?: number;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp';
}

interface UpscaleResult {
  success: boolean;
  imageUrl?: string;
  metadata?: {
    width: number;
    height: number;
    scale: number;
    format: string;
    fileSize: number;
  };
  error?: string;
}

export class UpscaleWorker {
  private worker: Worker<UpscaleJobData, UpscaleResult>;
  private readonly logger: Logger;

  constructor(connection: WorkerConnection = DEFAULT_REDIS_CONNECTION) {
    this.logger = createWorkerLogger('image-upscale');
    this.worker = new Worker<UpscaleJobData, UpscaleResult>(
      QUEUE_NAME,
      this.processJob.bind(this),
      {
        connection,
        concurrency: 2,
        removeOnComplete: CLEANUP_ON_COMPLETE,
        removeOnFail: CLEANUP_ON_FAIL,
      }
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error('Upscale job failed', {
        jobId: job?.id,
        queue: job?.queueName,
        error: serializeError(err),
      });
    });
  }

  public async start(): Promise<void> {
    this.logger.info('Upscale worker started');
  }

  public async stop(): Promise<void> {
    await this.worker.close();
    this.logger.info('Upscale worker stopped');
  }

  private async processJob(job: Job<UpscaleJobData>): Promise<UpscaleResult> {
    return traceJob('worker.image-upscale.process', job, async (span) => {
      const { imageUrl, designId, userId } = job.data;
      const scale = Math.max(1, Math.min(job.data.scale ?? 2, 4));
      const format = job.data.format ?? 'png';

      span.setAttribute('image.scale', scale);
      span.setAttribute('image.format', format);

      try {
        this.logger.info('Upscaling image', {
          jobId: job.id,
          designId,
          userId,
          scale,
        });

        const sourceBuffer = await withActiveSpan(
          'worker.image-upscale.download',
          { 'http.url': imageUrl },
          async () => this.download(imageUrl),
        );
        const metadata = await sharp(sourceBuffer).metadata();

        const width = metadata.width ?? 1024;
        const height = metadata.height ?? 1024;
        const targetWidth = Math.round(width * scale);
        const targetHeight = Math.round(height * scale);

        const upscaled = await withActiveSpan(
          'worker.image-upscale.resize',
          {
            'image.width': targetWidth,
            'image.height': targetHeight,
            'image.scale': scale,
          },
          async () =>
            sharp(sourceBuffer)
              .resize(targetWidth, targetHeight, {
                kernel: sharp.kernel.lanczos3,
              })
              .toFormat(format, { quality: 92 })
              .toBuffer(),
        );

        const saved = await withActiveSpan(
          'worker.image-upscale.save',
          { 'luneo.design.id': designId },
          async () =>
            saveToStorage(
              upscaled,
              `upscale/${userId}/${designId}-${Date.now()}.${format}`,
              {
                contentType: format === 'png' ? 'image/png' : 'image/jpeg',
                metadata: { scale },
              },
            ),
        );

        return {
          success: true,
          imageUrl: saved.url,
          metadata: {
            width: targetWidth,
            height: targetHeight,
            scale,
            format,
            fileSize: saved.size,
          },
        };
      } catch (error) {
        this.logger.error('Upscale job error', {
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


