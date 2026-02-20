import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { ImageProcessorService } from './services/image-processor.service';
import { UsageTrackingService } from '@/modules/usage-billing/services/usage-tracking.service';
import { GenerationStatus, Prisma } from '@prisma/client';

interface GenerationJobData {
  generationId: string;
  brandId: string;
  model: string;
  productId: string;
  finalPrompt: string;
  negativePrompt?: string;
  aiProvider: string;
  quality: string;
  outputFormat: string;
  outputWidth: number;
  outputHeight: number;
  baseImage: string;
  customizations: Record<string, unknown>;
  customizationZones: Array<{ id: string; positionX?: number; positionY?: number; width?: number; height?: number; renderStyle?: string }>;
}

@Processor('generation')
export class GenerationProcessor {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private aiFactory: AIProviderFactory,
    private imageProcessor: ImageProcessorService,
    private eventEmitter: EventEmitter2,
    private usageTrackingService: UsageTrackingService,
  ) {}

  @Process('generate')
  async handleGeneration(job: Job<GenerationJobData>) {
    const { generationId, ...data } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing generation ${generationId}`);

    try {
      // 1. Mettre à jour le statut
      await this.prisma.generation.update({
        where: { id: generationId },
        data: { status: GenerationStatus.PROCESSING },
      });

      // 2. Récupérer le provider IA
      const aiProvider = this.aiFactory.getProvider(data.aiProvider);

      // 3. Générer l'image avec l'IA
      await job.updateProgress(10);
      
      const aiResult = await aiProvider.generateImage({
        prompt: data.finalPrompt,
        size: `${data.outputWidth}x${data.outputHeight}` as '1024x1024' | '1792x1024' | '1024x1792',
        quality: data.quality as 'standard' | 'hd',
      });

      await job.updateProgress(50);

      // 4. Download generated overlay image
      const generatedImageUrl = aiResult.images[0].url;
      const generatedImageBuffer = await this.imageProcessor.downloadImage(generatedImageUrl);

      // 5. Load base product image when available (required for multi-layer composition)
      let baseImageBuffer: Buffer | null = null;
      if (data.baseImage) {
        try {
          baseImageBuffer = await this.imageProcessor.downloadImage(data.baseImage);
        } catch (error) {
          this.logger.warn(`Failed to download base image: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }

      // 6. Compose final image: base + overlay(s) per zone with effects (engrave, emboss, 3d_shadow)
      const hasZones = Array.isArray(data.customizationZones) && data.customizationZones.length > 0;
      const composedImage =
        baseImageBuffer && hasZones
          ? await this.imageProcessor.compose({
              baseImage: baseImageBuffer,
              generatedOverlay: generatedImageBuffer,
              customizationZones: data.customizationZones as import('./services/image-processor.service').ComposeZone[],
              customizations: data.customizations,
              outputFormat: data.outputFormat,
            })
          : baseImageBuffer ?? generatedImageBuffer;

      await job.updateProgress(70);

      // 7. Générer la miniature
      const thumbnail = await this.imageProcessor.createThumbnail(
        composedImage,
        300,
        300,
      );

      // 8. Upload vers storage
      const imageKey = `generations/${generationId}/output.${data.outputFormat}`;
      const thumbnailKey = `generations/${generationId}/thumbnail.${data.outputFormat}`;

      const [imageUrl, thumbnailUrl] = await Promise.all([
        this.imageProcessor.uploadImage(
          composedImage,
          imageKey,
          `image/${data.outputFormat}`,
        ),
        this.imageProcessor.uploadImage(
          thumbnail,
          thumbnailKey,
          'image/jpeg',
        ),
      ]);

      await job.updateProgress(85);

      // 9. Préparer les données AR si nécessaire
      let arModelUrl = null;
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId },
        select: { arEnabled: true, model3dUrl: true },
      });

      if (product?.arEnabled && product?.model3dUrl) {
        // Use generated image URL as AR texture; full 3D model generation can be added later
        arModelUrl = imageUrl;
      }

      await job.updateProgress(95);

      // 10. Mettre à jour la génération
      const processingTime = Date.now() - startTime;
      
      await this.prisma.generation.update({
        where: { id: generationId },
        data: {
          status: GenerationStatus.COMPLETED,
          outputUrl: imageUrl,
          thumbnailUrl,
          arModelUrl,
          processingTime,
          tokensUsed: aiResult.costs.tokens,
          cost: aiResult.costs.costCents ? aiResult.costs.costCents / 100 : null,
          aiResponse: aiResult.metadata as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      await job.updateProgress(100);

      // GENERATION FIX: Track usage only after successful generation. If generation fails, quota is not wasted.
      const costCents = aiResult.costs.costCents ?? 0;
      await this.usageTrackingService.trackAIGeneration(
        data.brandId,
        generationId,
        data.model,
        costCents / 100,
      );

      // 11. Émettre événement
      this.eventEmitter.emit('generation.completed', {
        generationId,
        imageUrl,
        processingTime,
      });

      return { success: true, imageUrl, processingTime };

    } catch (error: unknown) {
      this.logger.error('Generation processing failed', { generationId, error });

      await this.prisma.generation.update({
        where: { id: generationId },
        data: {
          status: GenerationStatus.FAILED,
          errorMessage: 'Generation processing failed',
          errorCode: 'GENERATION_FAILED',
          retryCount: { increment: 1 },
        },
      });

      this.eventEmitter.emit('generation.failed', {
        generationId,
        errorMessage: 'Generation processing failed',
        errorCode: 'GENERATION_FAILED',
      });

      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error('Generation processing failed', { jobId: job.id, error });

    this.eventEmitter.emit('generation.failed', {
      generationId: job.data.generationId,
      errorMessage: 'Generation processing failed',
      errorCode: 'GENERATION_FAILED',
    });
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, _result: unknown) {
    this.logger.log(`Job ${job.id} completed`);
  }
}

