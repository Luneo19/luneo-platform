import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface EnqueueRenderOptions {
  snapshotId?: string;
  designId?: string;
  customizationId?: string;
  type: 'preview' | 'final' | 'ar' | 'manufacturing';
  priority?: number;
  options?: Record<string, any>;
}

@Injectable()
export class RenderQueueService {
  private readonly logger = new Logger(RenderQueueService.name);

  constructor(
    @InjectQueue('render-preview') private previewQueue: Queue,
    @InjectQueue('render-final') private finalQueue: Queue,
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Enqueue un job de rendu
   */
  async enqueue(options: EnqueueRenderOptions): Promise<{ renderId: string; jobId: string }> {
    const { type, snapshotId, designId, customizationId, priority = 0, options: renderOptions } = options;

    // Sélectionner la queue appropriée
    const queue = type === 'preview' ? this.previewQueue : this.finalQueue;

    // Créer un renderId unique
    const renderId = `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer RenderResult en DB (pending)
    const renderResult = await this.prisma.renderResult.create({
      data: {
        renderId,
        type: type === 'preview' ? '2d' : type === 'ar' ? 'ar' : type === 'manufacturing' ? 'manufacturing' : '3d',
        status: 'pending',
        snapshotId,
        designId,
        customizationId,
        metadata: {
          ...renderOptions,
          enqueuedAt: new Date().toISOString(),
        },
      },
    });

    // Enqueue le job
    const job = await queue.add(
      'render',
      {
        renderId,
        snapshotId,
        designId,
        customizationId,
        type,
        options: renderOptions || {},
      },
      {
        priority,
        jobId: renderId, // Utiliser renderId comme jobId pour idempotency
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Render job enqueued: ${renderId} (jobId: ${job.id})`);

    return {
      renderId,
      jobId: job.id as string,
    };
  }

  /**
   * Enqueue un preview render (rapide, 2D)
   */
  async enqueuePreview(
    snapshotId: string,
    options?: Record<string, any>,
  ): Promise<{ renderId: string; jobId: string }> {
    return this.enqueue({
      snapshotId,
      type: 'preview',
      priority: 10, // Haute priorité pour previews
      options,
    });
  }

  /**
   * Enqueue un final render (haute qualité, 3D)
   */
  async enqueueFinal(
    snapshotId: string,
    options?: Record<string, any>,
  ): Promise<{ renderId: string; jobId: string }> {
    return this.enqueue({
      snapshotId,
      type: 'final',
      priority: 5,
      options,
    });
  }

  /**
   * Enqueue un AR render
   */
  async enqueueAR(
    snapshotId: string,
    options?: Record<string, any>,
  ): Promise<{ renderId: string; jobId: string }> {
    return this.enqueue({
      snapshotId,
      type: 'ar',
      priority: 5,
      options,
    });
  }

  /**
   * Enqueue un print-ready render (haute résolution, 300 DPI)
   */
  async enqueuePrintReady(
    designId: string,
    productId: string,
    width: number,
    height: number,
    options?: {
      dpi?: number;
      format?: 'png' | 'jpg' | 'pdf';
      quality?: number;
      backgroundColor?: string;
      bleed?: number;
    },
  ): Promise<{ renderId: string; jobId: string }> {
    const renderId = `print-ready-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use render-print-ready queue
    const { Queue } = await import('bullmq');
    const printReadyQueue = new Queue('render-print-ready', {
      connection: {
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(this.configService.get<string>('REDIS_PORT') || '6379', 10),
      },
    });

    const job = await printReadyQueue.add(
      'render',
      {
        requestId: renderId,
        designId,
        productId,
        width,
        height,
        ...options,
      },
      {
        priority: 3, // Medium priority
        jobId: renderId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Print-ready render job enqueued: ${renderId} (jobId: ${job.id})`);

    return {
      renderId,
      jobId: job.id as string,
    };
  }
}

