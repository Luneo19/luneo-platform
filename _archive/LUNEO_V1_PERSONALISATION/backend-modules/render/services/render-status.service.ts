import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cacheable } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class RenderStatusService {
  constructor(
    @InjectQueue('render-preview') private previewQueue: Queue,
    @InjectQueue('render-final') private finalQueue: Queue,
    private prisma: PrismaService,
  ) {}

  /**
   * Récupérer le statut d'un render
   */
  @Cacheable({
    type: 'render',
    ttl: 30, // Cache court (30s) car statut change fréquemment
    keyGenerator: (args) => `render:status:${args[0]}`,
  })
  async getStatus(renderId: string): Promise<{
    renderId: string;
    status: string;
    progress?: number;
    url?: string;
    thumbnailUrl?: string;
    error?: string;
    metadata?: Record<string, unknown>;
  }> {
    // Récupérer depuis DB
    const renderResult = await this.prisma.renderResult.findUnique({
      where: { renderId },
    });

    if (!renderResult) {
      throw new NotFoundException(`Render not found: ${renderId}`);
    }

    // Si en cours, vérifier le job dans la queue
    if (renderResult.status === 'pending' || renderResult.status === 'processing') {
      // Chercher dans les deux queues
      const previewJob = await this.previewQueue.getJob(renderId);
      const finalJob = await this.finalQueue.getJob(renderId);
      const job = previewJob || finalJob;

      if (job) {
        const state = await job.getState();
        const progress = job.progress as number;

        return {
          renderId,
          status: state === 'completed' ? 'success' : state === 'failed' ? 'failed' : 'processing',
          progress: typeof progress === 'number' ? progress : undefined,
          url: renderResult.url || undefined,
          thumbnailUrl: renderResult.thumbnailUrl || undefined,
          error: state === 'failed' ? job.failedReason : undefined,
          metadata: renderResult.metadata as Record<string, unknown> | undefined,
        };
      }
    }

    return {
      renderId,
      status: renderResult.status,
      url: renderResult.url || undefined,
      thumbnailUrl: renderResult.thumbnailUrl || undefined,
      metadata: renderResult.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * Récupérer le preview d'un render (cacheable)
   */
  @Cacheable({
    type: 'render',
    ttl: 3600, // Cache long pour previews (1h)
    keyGenerator: (args) => `render:preview:${args[0]}`,
  })
  async getPreview(renderId: string): Promise<{
    renderId: string;
    url: string;
    thumbnailUrl?: string;
  }> {
    const renderResult = await this.prisma.renderResult.findUnique({
      where: { renderId },
      select: {
        renderId: true,
        url: true,
        thumbnailUrl: true,
        status: true,
      },
    });

    if (!renderResult) {
      throw new NotFoundException(`Render not found: ${renderId}`);
    }

    if (renderResult.status !== 'success' || !renderResult.url) {
      throw new NotFoundException(`Render not ready: ${renderId}`);
    }

    return {
      renderId: renderResult.renderId,
      url: renderResult.url,
      thumbnailUrl: renderResult.thumbnailUrl || undefined,
    };
  }
}

