import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as sharp from 'sharp';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { CUSTOMIZER_QUEUES } from '../visual-customizer.constants';

interface ThumbnailJobData {
  sourceUrl: string;
  targetSize: {
    width: number;
    height: number;
  };
  entityType: 'customizer' | 'preset' | 'design';
  entityId: string;
}

@Processor(CUSTOMIZER_QUEUES.THUMBNAIL)
export class ThumbnailWorker {
  private readonly logger = new Logger(ThumbnailWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @Process()
  async process(job: Job<ThumbnailJobData>) {
    const { sourceUrl, targetSize, entityType, entityId } = job.data;
    this.logger.log(`Processing thumbnail job ${job.id} for ${entityType} ${entityId}`);

    try {
      // Fetch source image
      const imageResponse = await fetch(sourceUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch source image: ${imageResponse.statusText}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Resize image with sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(targetSize.width, targetSize.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload to storage
      const fileName = `thumbnails/${entityType}/${entityId}.jpg`;
      const thumbnailUrl = await this.storageService.uploadBuffer(thumbnailBuffer, fileName, {
        contentType: 'image/jpeg',
      });

      // Update entity with thumbnail URL
      await this.updateEntityThumbnail(entityType, entityId, thumbnailUrl);

      this.logger.log(`Thumbnail job ${job.id} completed successfully`);
      return { success: true, thumbnailUrl };
    } catch (error) {
      this.logger.error(`Thumbnail job ${job.id} failed: ${error}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Thumbnail job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Thumbnail job ${job.id} failed: ${error.message}`, error.stack);
  }

  private async updateEntityThumbnail(
    entityType: ThumbnailJobData['entityType'],
    entityId: string,
    thumbnailUrl: string,
  ): Promise<void> {
    try {
      switch (entityType) {
        case 'customizer':
          await this.prisma.visualCustomizer.update({
            where: { id: entityId },
            data: { thumbnailUrl },
          });
          break;
        case 'preset':
          await this.prisma.visualCustomizerPreset.update({
            where: { id: entityId },
            data: { thumbnailUrl },
          });
          break;
        case 'design':
          await this.prisma.customizerSavedDesign.update({
            where: { id: entityId },
            data: { thumbnailUrl },
          });
          break;
        default:
          this.logger.warn(`Unknown entity type: ${entityType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update ${entityType} thumbnail: ${error}`);
      throw error;
    }
  }
}
