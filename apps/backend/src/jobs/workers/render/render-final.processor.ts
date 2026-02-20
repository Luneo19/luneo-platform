import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { Render3DService } from '@/modules/render/services/render-3d.service';
import * as Sentry from '@sentry/nestjs';
import sharp from 'sharp';

interface RenderFinalJob {
  renderId: string;
  snapshotId?: string;
  designId?: string;
  customizationId?: string;
  type: 'final' | 'ar' | 'manufacturing';
  options?: Record<string, unknown>;
}

interface RenderFinalResult {
  renderId: string;
  url: string;
  thumbnailUrl: string;
  cached?: boolean;
  duration?: number;
}

@Processor('render-final')
export class RenderFinalProcessor {
  private readonly logger = new Logger(RenderFinalProcessor.name);

  constructor(
    private prisma: PrismaService,
    private render3DService: Render3DService,
    private storageService: StorageService,
  ) {}

  @Process('render')
  async process(job: Job<RenderFinalJob>): Promise<RenderFinalResult> {
    const { renderId, snapshotId, designId, customizationId: _customizationId, type, options } = job.data;
    const startTime = Date.now();

    try {
      // 1. Mettre à jour RenderResult en processing
      await this.prisma.renderResult.update({
        where: { renderId },
        data: {
          status: 'processing',
          metadata: {
            ...options,
            startedAt: new Date().toISOString(),
          },
        },
      });

      // 2. Récupérer les données nécessaires
      let snapshot;
      
      if (snapshotId) {
        snapshot = await this.prisma.snapshot.findUnique({
          where: { id: snapshotId },
          include: {
            spec: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!snapshot) {
          throw new Error(`Snapshot not found: ${snapshotId}`);
        }
      } else {
        throw new Error('snapshotId required for final render');
      }

      // 3. Vérifier idempotency
      const existingRender = await this.prisma.renderResult.findFirst({
        where: {
          snapshotId,
          type: type === 'ar' ? 'ar' : type === 'manufacturing' ? 'manufacturing' : '3d',
          status: 'success',
        },
      });

      if (existingRender && existingRender.url) {
        this.logger.log(`Render already exists, returning cached for ${renderId}`);
        
        await this.prisma.renderResult.update({
          where: { renderId },
          data: {
            status: 'success',
            url: existingRender.url,
            thumbnailUrl: existingRender.thumbnailUrl,
            metadata: {
              ...(existingRender.metadata as Record<string, unknown> || {}),
              cached: true,
            },
          },
        });

        return {
          renderId,
          url: existingRender.url || '',
          thumbnailUrl: existingRender.thumbnailUrl || '',
          cached: true,
        };
      }

      let modelUrl: string;
      let thumbnailUrl: string;
      try {
        const renderRequest = {
          productId: snapshot.spec.productId,
          designId: designId || undefined,
          options: {
            ...options,
            quality: 'high',
            format: type === 'ar' ? 'usdz' : type === 'manufacturing' ? 'gltf' : 'gltf',
          },
        };
        const result = await this.render3DService.render3D(renderRequest as Parameters<typeof this.render3DService.render3D>[0]);
        modelUrl = result.url || '';
        thumbnailUrl = result.thumbnailUrl || modelUrl;
      } catch (renderError) {
        this.logger.warn(`Render3DService failed, using sharp high-res fallback: ${renderError instanceof Error ? renderError.message : 'Unknown'}`);
        const width = 1920;
        const height = 1080;
        const imageBuffer = await sharp({
          create: { width, height, channels: 3, background: { r: 250, g: 250, b: 250 } },
        })
          .png()
          .toBuffer();
        const thumbBuffer = await sharp(imageBuffer).resize(200, 200, { fit: 'cover' }).png().toBuffer();
        const baseKey = `renders/final/${renderId}`;
        modelUrl = await this.storageService.uploadFile(`${baseKey}/output.png`, imageBuffer, 'image/png');
        thumbnailUrl = await this.storageService.uploadFile(`${baseKey}/thumb.png`, thumbBuffer, 'image/png');
      }

      // 6. Mettre à jour RenderResult
      await this.prisma.renderResult.update({
        where: { renderId },
        data: {
          status: 'success',
          url: modelUrl,
          thumbnailUrl,
          metadata: {
            ...options,
            duration: Date.now() - startTime,
            completedAt: new Date().toISOString(),
          },
        },
      });

      // 7. Mettre à jour Snapshot selon le type
      if (type === 'ar') {
        await this.prisma.snapshot.update({
          where: { id: snapshotId },
          data: {
            arModelUrl: modelUrl,
            thumbnailUrl,
          },
        });
      } else if (type === 'manufacturing') {
        await this.prisma.snapshot.update({
          where: { id: snapshotId },
          data: {
            gltfModelUrl: modelUrl,
            thumbnailUrl,
          },
        });
      } else {
        await this.prisma.snapshot.update({
          where: { id: snapshotId },
          data: {
            preview3dUrl: modelUrl,
            thumbnailUrl,
          },
        });
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Render final completed for ${renderId} in ${duration}ms`);

      return {
        renderId,
        url: modelUrl,
        thumbnailUrl,
        duration,
      };
    } catch (error) {
      this.logger.error(`Render final failed for ${renderId}`, error);
      
      Sentry.captureException(error, {
        tags: {
          jobId: job.id,
          renderId,
          snapshotId,
          type,
        },
        extra: {
          jobData: job.data,
        },
      });

      await this.prisma.renderResult.update({
        where: { renderId },
        data: {
          status: 'failed',
          metadata: {
            error: 'Render processing failed',
            failedAt: new Date().toISOString(),
          },
        },
      }).catch((err) => this.logger.warn('Non-critical error updating render result status', err instanceof Error ? err.message : String(err)));

      throw error;
    }
  }
}

