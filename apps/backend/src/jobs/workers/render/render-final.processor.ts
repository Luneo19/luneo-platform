import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Render3DService } from '@/modules/render/services/render-3d.service';
import * as Sentry from '@sentry/node';

interface RenderFinalJob {
  renderId: string;
  snapshotId?: string;
  designId?: string;
  customizationId?: string;
  type: 'final' | 'ar' | 'manufacturing';
  options?: Record<string, any>;
}

@Processor('render-final')
export class RenderFinalProcessor {
  private readonly logger = new Logger(RenderFinalProcessor.name);

  constructor(
    private prisma: PrismaService,
    private render3DService: Render3DService,
  ) {}

  @Process('render')
  async process(job: Job<RenderFinalJob>): Promise<any> {
    const { renderId, snapshotId, designId, customizationId, type, options } = job.data;
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
              ...existingRender.metadata,
              cached: true,
            },
          },
        });

        return {
          renderId,
          url: existingRender.url,
          thumbnailUrl: existingRender.thumbnailUrl,
          cached: true,
        };
      }

      // 4. Appeler le service de rendu 3D
      // TODO: Adapter selon votre implémentation Render3DService
      const renderRequest = {
        productId: snapshot.spec.productId,
        designId: designId || undefined,
        options: {
          ...options,
          quality: 'high',
          format: type === 'ar' ? 'usdz' : type === 'manufacturing' ? 'gltf' : 'gltf',
        },
      };

      // Pour l'instant, générer un placeholder
      // TODO: Appeler render3DService.render3D(renderRequest)
      const renderResult = {
        modelUrl: 'https://via.placeholder.com/800x600',
        thumbnailUrl: 'https://via.placeholder.com/200x200',
      };

      // 5. Upload vers storage
      const modelUrl = renderResult.modelUrl;
      const thumbnailUrl = renderResult.thumbnailUrl;

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
            error: error.message,
            failedAt: new Date().toISOString(),
          },
        },
      }).catch(() => {});

      throw error;
    }
  }
}

