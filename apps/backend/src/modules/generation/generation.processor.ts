import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { ImageProcessorService } from './services/image-processor.service';
import { GenerationStatus } from '@prisma/client';

interface GenerationJobData {
  generationId: string;
  productId: string;
  finalPrompt: string;
  negativePrompt?: string;
  aiProvider: string;
  quality: string;
  outputFormat: string;
  outputWidth: number;
  outputHeight: number;
  baseImage: string;
  customizations: Record<string, any>;
  customizationZones: any[];
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
      await job.progress(10);
      
      const aiResult = await aiProvider.generateImage({
        prompt: data.finalPrompt,
        size: `${data.outputWidth}x${data.outputHeight}` as any,
        quality: data.quality as any,
      });

      await job.progress(50);

      // 4. Télécharger l'image générée
      const generatedImageUrl = aiResult.images[0].url;
      const imageResponse = await fetch(generatedImageUrl);
      const generatedImageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // 5. Télécharger l'image de base du produit si disponible
      let baseImageBuffer: Buffer | null = null;
      if (data.baseImage) {
        try {
          const baseResponse = await fetch(data.baseImage);
          baseImageBuffer = Buffer.from(await baseResponse.arrayBuffer());
        } catch (error) {
          this.logger.warn(`Failed to download base image: ${error.message}`);
        }
      }

      // 6. Composer l'image finale
      const composedImage = baseImageBuffer
        ? await this.imageProcessor.compose({
            baseImage: baseImageBuffer,
            generatedOverlay: generatedImageBuffer,
            customizationZones: data.customizationZones,
            customizations: data.customizations,
            outputFormat: data.outputFormat,
          })
        : generatedImageBuffer;

      await job.progress(70);

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

      await job.progress(85);

      // 9. Préparer les données AR si nécessaire
      let arModelUrl = null;
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId },
        select: { arEnabled: true, model3dUrl: true },
      });

      if (product?.arEnabled && product?.model3dUrl) {
        // Pour l'instant, on utilise le modèle 3D existant
        // TODO: Générer un modèle AR avec la texture personnalisée
        arModelUrl = product.model3dUrl;
      }

      await job.progress(95);

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
          aiResponse: aiResult.metadata as any,
          completedAt: new Date(),
        },
      });

      await job.progress(100);

      // 11. Émettre événement
      this.eventEmitter.emit('generation.completed', {
        generationId,
        imageUrl,
        processingTime,
      });

      return { success: true, imageUrl, processingTime };

    } catch (error: any) {
      this.logger.error(`Generation ${generationId} failed: ${error.message}`);
      
      await this.prisma.generation.update({
        where: { id: generationId },
        data: {
          status: GenerationStatus.FAILED,
          errorMessage: error.message,
          errorCode: error.code || 'UNKNOWN_ERROR',
          retryCount: { increment: 1 },
        },
      });

      this.eventEmitter.emit('generation.failed', {
        generationId,
        error: error.message,
      });

      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);

    this.eventEmitter.emit('generation.failed', {
      generationId: job.data.generationId,
      error: error.message,
    });
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed`);
  }
}

