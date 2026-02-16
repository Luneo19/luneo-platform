import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface ModelOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  lodLevels: {
    high: string;
    medium?: string;
    low?: string;
  };
  usdzUrl?: string;
  thumbnailUrl?: string;
}

@Injectable()
export class ModelOptimizationService {
  private readonly logger = new Logger(ModelOptimizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('try-on-processing') private readonly tryOnQueue: Queue,
  ) {}

  /**
   * Queue model optimization pipeline after upload.
   * Generates LOD levels, USDZ variant, and thumbnail.
   */
  async queueOptimization(mappingId: string, modelUrl: string) {
    await this.tryOnQueue.add(
      'optimize-3d-model',
      { mappingId, modelUrl },
      {
        priority: 5,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    );

    this.logger.log(`Model optimization queued for mapping ${mappingId}`);
  }

  /**
   * Queue USDZ generation from GLB model.
   */
  async queueUsdzGeneration(mappingId: string, glbUrl: string) {
    await this.tryOnQueue.add(
      'generate-usdz',
      { mappingId, glbUrl },
      {
        priority: 10,
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: { count: 100 },
      },
    );

    this.logger.log(`USDZ generation queued for mapping ${mappingId}`);
  }

  /**
   * Queue thumbnail generation from 3D model.
   */
  async queueThumbnailGeneration(mappingId: string, modelUrl: string) {
    await this.tryOnQueue.add(
      'generate-model-thumbnail',
      { mappingId, modelUrl },
      {
        priority: 15,
        attempts: 2,
        removeOnComplete: { count: 100 },
      },
    );

    this.logger.log(`Thumbnail generation queued for mapping ${mappingId}`);
  }

  /**
   * Get CDN-optimized URL for a 3D model with caching headers.
   * Applies quality-based selection for LOD.
   */
  getCDNUrl(
    modelUrl: string,
    quality: 'high' | 'medium' | 'low' = 'high',
  ): string {
    // If Cloudinary URL, apply transformations
    if (modelUrl.includes('cloudinary.com')) {
      const transformations: Record<string, string> = {
        high: 'f_auto,q_auto:best',
        medium: 'f_auto,q_auto:good',
        low: 'f_auto,q_auto:eco',
      };

      return modelUrl.replace('/upload/', `/upload/${transformations[quality]}/`);
    }

    return modelUrl;
  }

  /**
   * Get optimal model URL based on device capabilities and connection.
   */
  async getOptimalModelUrl(
    mappingId: string,
    deviceType: string,
    connectionType?: string,
  ): Promise<{ url: string; quality: string }> {
    const mapping = await this.prisma.tryOnProductMapping.findUnique({
      where: { id: mappingId },
      select: {
        model3dUrl: true,
        modelUSDZUrl: true,
        lodLevels: true,
      },
    });

    if (!mapping?.model3dUrl) {
      return { url: '', quality: 'none' };
    }

    const lodLevels = mapping.lodLevels as {
      high?: string;
      medium?: string;
      low?: string;
    } | null;

    // Select quality based on device and connection
    const isMobile = deviceType === 'mobile';
    const isSlowConnection = connectionType === '2g' || connectionType === 'slow-2g';

    if (isSlowConnection && lodLevels?.low) {
      return { url: lodLevels.low, quality: 'low' };
    }

    if (isMobile && lodLevels?.medium) {
      return { url: lodLevels.medium, quality: 'medium' };
    }

    if (lodLevels?.high) {
      return { url: lodLevels.high, quality: 'high' };
    }

    return {
      url: this.getCDNUrl(mapping.model3dUrl, isMobile ? 'medium' : 'high'),
      quality: isMobile ? 'medium' : 'high',
    };
  }

  /**
   * Schedule session cleanup cron job.
   */
  async scheduleSessionCleanup() {
    await this.tryOnQueue.add(
      'expire-sessions',
      { maxInactiveMinutes: 30 },
      {
        repeat: { every: 5 * 60 * 1000 }, // Every 5 minutes
        jobId: 'session-cleanup-cron',
        removeOnComplete: { count: 10 },
      },
    );

    this.logger.log('Session cleanup cron scheduled (every 5 minutes)');
  }

  /**
   * Schedule monthly billing sync for try-on commissions and overages.
   * Runs daily at 02:00 UTC to catch any missed billing periods.
   */
  async scheduleBillingSync() {
    await this.tryOnQueue.add(
      'billing-sync',
      {},
      {
        repeat: { pattern: '0 2 * * *' }, // Daily at 02:00 UTC
        jobId: 'tryon-billing-sync-cron',
        removeOnComplete: { count: 30 },
        removeOnFail: { count: 10 },
      },
    );

    this.logger.log('Try-on billing sync cron scheduled (daily at 02:00 UTC)');
  }
}
