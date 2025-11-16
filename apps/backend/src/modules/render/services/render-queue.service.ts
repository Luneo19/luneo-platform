import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { RenderRequest, RenderMetrics, RenderResult } from '../interfaces/render.interface';
import { Prisma } from '@prisma/client';
import { JobNames } from '@/jobs/job.constants';
import { QueueNames } from '@/jobs/queue.constants';
import { RenderJobQueueService } from './render-job-queue.service';
import { RenderJobData, RenderQueuePayload } from '../interfaces/render-job.interface';

const PRIORITY_MAP: Record<'low' | 'normal' | 'high' | 'urgent', number> = {
  urgent: 1,
  high: 3,
  normal: 5,
  low: 10,
};

interface RenderContext {
  brandId: string;
  userId?: string;
}

export interface RenderEnqueueResponse {
  renderId: string;
  jobId: string;
  queue: string;
  state: string;
  priority: RenderRequest['priority'];
  enqueuedAt: Date;
}

export interface RenderStatusResponse {
  renderId: string;
  status: RenderResult['status'];
  url?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  queueState?: string;
  queuedAt?: Date;
  finishedAt?: Date;
  error?: string;
}

export interface RenderProgressResponse {
  renderId: string;
  stage: string;
  percentage: number;
  message: string;
  timestamp: Date;
}

@Injectable()
export class RenderQueueService {
  private readonly logger = new Logger(RenderQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly renderJobQueueService: RenderJobQueueService,
    @InjectQueue(QueueNames.RENDER_PROCESSING)
    private readonly renderQueue: Queue<RenderQueuePayload, any, string>,
  ) {}

  async enqueueRender(request: RenderRequest, context: RenderContext): Promise<RenderEnqueueResponse> {
    const renderId = request.id ?? this.generateRenderId(request.type);
    const priority = request.priority ?? 'normal';

    const jobName =
      request.type === '3d'
        ? JobNames.RENDER.RENDER_3D
        : JobNames.RENDER.RENDER_2D;

    const jobPayload: RenderJobData = {
      renderId,
      type: request.type,
      productId: request.productId,
      designId: request.designId,
      options: request.options,
      priority,
      callback: request.callback,
      userId: context.userId,
      brandId: context.brandId,
    };

    const job = await this.renderJobQueueService.enqueueRenderJob(jobName, jobPayload, {
      jobId: renderId,
      priority: PRIORITY_MAP[priority],
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5_000,
      },
      removeOnComplete: 200,
      removeOnFail: 100,
    });

    await Promise.all([
      this.prisma.renderResult.upsert({
        where: { renderId },
        update: {
          type: request.type,
          status: 'processing',
          metadata: this.toJson({
            ...request.options,
            priority,
            enqueuedAt: new Date().toISOString(),
          }),
          url: null,
          thumbnailUrl: null,
        },
        create: {
          renderId,
          type: request.type,
          status: 'processing',
          metadata: this.toJson({
            ...request.options,
            priority,
            enqueuedAt: new Date().toISOString(),
          }),
        },
      }),
      this.prisma.renderProgress.upsert({
        where: { renderId },
        update: {
          stage: 'queued',
          percentage: 0,
          message: 'Rendu en attente de traitement',
          timestamp: new Date(),
        },
        create: {
          renderId,
          stage: 'queued',
          percentage: 0,
          message: 'Rendu en attente de traitement',
          timestamp: new Date(),
        },
      }),
    ]);

    return {
      renderId,
      jobId: (job.id ?? renderId).toString(),
      queue: job.queueName,
      state: await job.getState(),
      priority,
      enqueuedAt: new Date(job.timestamp ?? Date.now()),
    };
  }

  async getRenderStatus(renderId: string): Promise<RenderStatusResponse | null> {
    const [result, job, errorEntry] = await Promise.all([
      this.prisma.renderResult.findUnique({ where: { renderId } }),
      this.renderQueue.getJob(renderId),
      this.prisma.renderError.findFirst({ where: { renderId }, orderBy: { occurredAt: 'desc' } }),
    ]);

    if (!result) {
      return null;
    }

    const jobState = job ? await job.getState() : result.status === 'success'
      ? 'completed'
      : result.status === 'failed'
        ? 'failed'
        : 'unknown';

    return {
      renderId,
      status: result.status as RenderResult['status'],
      url: result.url ?? undefined,
      thumbnailUrl: result.thumbnailUrl ?? undefined,
      metadata: result.metadata as Record<string, unknown> | undefined,
      queueState: jobState,
      queuedAt: job?.timestamp ? new Date(job.timestamp) : undefined,
      finishedAt: job?.finishedOn ? new Date(job.finishedOn) : undefined,
      error: errorEntry?.error,
    };
  }

  async getRenderProgress(renderId: string): Promise<RenderProgressResponse | null> {
    const progress = await this.prisma.renderProgress.findUnique({ where: { renderId } });
    if (!progress) {
      return null;
    }

    return {
      renderId,
      stage: progress.stage,
      percentage: progress.percentage,
      message: progress.message,
      timestamp: progress.timestamp,
    };
  }

  async getMetrics(): Promise<RenderMetrics> {
    const cacheKey = 'render_metrics:overview';
    const cached = await this.cache.getSimple(cacheKey);
    if (cached) {
      return cached as RenderMetrics;
    }

    const [countsRaw, recent, results24h] = await Promise.all([
      this.renderQueue.getJobCounts(),
      this.prisma.renderResult.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          metadata: true,
        },
      }),
      this.prisma.renderResult.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: {
          status: true,
          metadata: true,
        },
      }),
    ]);

    const counts = countsRaw as Record<string, number>;
    const totalRenders = results24h.length;
    const successfulRenders = results24h.filter((r) => r.status === 'success').length;
    const failedRenders = results24h.filter((r) => r.status === 'failed').length;

    const durations = recent
      .map((r) => (r.metadata as Record<string, unknown> | null | undefined)?.renderTime)
      .filter((value): value is number => typeof value === 'number');

    const averageRenderTime = durations.length
      ? Math.round(durations.reduce((acc, value) => acc + value, 0) / durations.length)
      : 0;

    const pausedJobs = this.getPausedCount(counts);
    const queueLength = (counts.waiting ?? 0) + (counts.delayed ?? 0) + pausedJobs;
    const activeWorkers = counts.active ?? 0;

    const metrics: RenderMetrics = {
      totalRenders,
      successfulRenders,
      failedRenders,
      successRate: totalRenders > 0 ? (successfulRenders / totalRenders) * 100 : 0,
      averageRenderTime,
      queueLength,
      activeWorkers,
      memoryUsage: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      gpuUsage: undefined,
      lastUpdated: new Date(),
    };

    await this.cache.setSimple(cacheKey, metrics, 60);

    return metrics;
  }

  private toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private getPausedCount(counts: Record<string, number>): number {
    const paused = counts.paused;
    return typeof paused === 'number' ? paused : 0;
  }

  private generateRenderId(type: RenderRequest['type']): string {
    return `${type}-render-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }
}
