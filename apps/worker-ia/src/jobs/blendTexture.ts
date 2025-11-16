import { Job, Worker, type KeepJobs, type WorkerOptions } from 'bullmq';
import sharp from 'sharp';
import type { Logger } from 'winston';
import { createWorkerLogger, serializeError } from '../utils/logger';
import { saveToStorage } from '../utils/storage';
import { traceJob, withActiveSpan } from '../observability/span-helpers';

const QUEUE_NAME = 'texture-blend';
const DEFAULT_REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};
const CLEANUP_ON_COMPLETE: KeepJobs = { count: 50 };
const CLEANUP_ON_FAIL: KeepJobs = { count: 25 };

type WorkerConnection = WorkerOptions['connection'];

interface BlendJobData {
  baseImageUrl: string;
  overlayImageUrl: string;
  userId: string;
  designId: string;
  opacity?: number;
  blendMode?: sharp.OverlayOptions['blend'];
  format?: 'png' | 'jpg' | 'jpeg' | 'webp';
}

interface BlendResult {
  success: boolean;
  imageUrl?: string;
  metadata?: {
    format: string;
    fileSize: number;
    opacity: number;
    blendMode: string;
  };
  error?: string;
}

export class BlendTextureWorker {
  private worker: Worker<BlendJobData, BlendResult>;
  private readonly logger: Logger;

  constructor(connection: WorkerConnection = DEFAULT_REDIS_CONNECTION) {
    this.logger = createWorkerLogger('texture-blend');
    this.worker = new Worker<BlendJobData, BlendResult>(
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
      this.logger.error('Blend job failed', {
        jobId: job?.id,
        queue: job?.queueName,
        error: serializeError(err),
      });
    });
  }

  public async start(): Promise<void> {
    this.logger.info('Blend texture worker started');
  }

  public async stop(): Promise<void> {
    await this.worker.close();
    this.logger.info('Blend texture worker stopped');
  }

  private async processJob(job: Job<BlendJobData>): Promise<BlendResult> {
    return traceJob('worker.texture-blend.process', job, async () => {
      const {
        baseImageUrl,
        overlayImageUrl,
        userId,
        designId,
        opacity = 0.65,
        blendMode = 'over',
        format = 'png',
      } = job.data;

      try {
        const [baseBuffer, overlayBuffer] = await Promise.all([
          withActiveSpan(
            'worker.texture-blend.download-base',
            { 'http.url': baseImageUrl },
            async () => this.download(baseImageUrl),
          ),
          withActiveSpan(
            'worker.texture-blend.download-overlay',
            { 'http.url': overlayImageUrl ?? '' },
            async () => this.download(overlayImageUrl),
          ),
        ]);

        const baseImage = sharp(baseBuffer).ensureAlpha();
        const overlayResized = await sharp(overlayBuffer)
          .ensureAlpha()
          .resize({ width: (await baseImage.metadata()).width });

        const overlayWithOpacity = await withActiveSpan(
          'worker.texture-blend.opacity',
          { opacity },
          async () =>
            sharp(await overlayResized.toBuffer())
              .linear([1, 1, 1, opacity], [0, 0, 0, 0])
              .toBuffer(),
        );

        const composed = await withActiveSpan(
          'worker.texture-blend.compose',
          { opacity, blendMode, format },
          async () =>
            baseImage
              .composite([
                {
                  input: overlayWithOpacity,
                  blend: blendMode,
                },
              ])
              .toFormat(format, { quality: 92 })
              .toBuffer(),
        );

        const saved = await withActiveSpan(
          'worker.texture-blend.save',
          { 'luneo.design.id': designId },
          async () =>
            saveToStorage(
              composed,
              `textures/${userId}/${designId}-blend-${Date.now()}.${format}`,
              {
                contentType: format === 'png' ? 'image/png' : 'image/jpeg',
                metadata: {
                  opacity,
                  blendMode,
                },
              },
            ),
        );

        return {
          success: true,
          imageUrl: saved.url,
          metadata: {
            format,
            fileSize: saved.size,
            opacity,
            blendMode,
          },
        };
      } catch (error) {
        this.logger.error('Texture blend failed', {
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

  private async download(url?: string): Promise<Buffer> {
    if (!url) {
      throw new Error('Overlay URL is required');
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}


