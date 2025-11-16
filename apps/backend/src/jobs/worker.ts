import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, QueueEvents } from 'bullmq';
import { Prisma, DesignStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AiService } from '@/modules/ai/ai.service';
import { getErrorMessage, getErrorStack } from '@/common/utils/error.utils';
import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';
import type { ConnectionOptions as TlsConnectionOptions } from 'tls';
import { QueueNames } from './queue.constants';
import { JobNames } from './job.constants';
import {
  GenerateDesignJob,
  GenerateHighResJob,
  GenerateImageJobPayload,
  GenerateImageResult,
  UpscaleJobPayload,
  UpscaleResult,
} from './interfaces/ai-jobs.interface';

@Injectable()
@Processor(QueueNames.AI_GENERATION)
export class AiGenerationWorker extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(AiGenerationWorker.name);
  private readonly imageQueueEvents: QueueEvents;
  private readonly upscaleQueueEvents: QueueEvents;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    @InjectQueue(QueueNames.IMAGE_GENERATION) private readonly imageQueue: Queue,
    @InjectQueue(QueueNames.IMAGE_UPSCALE) private readonly imageUpscaleQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    super();
    this.imageQueueEvents = this.createQueueEvents(QueueNames.IMAGE_GENERATION);
    this.upscaleQueueEvents = this.createQueueEvents(QueueNames.IMAGE_UPSCALE);
  }

  async process(job: Job<GenerateDesignJob | GenerateHighResJob>): Promise<unknown> {
    if (job.name === JobNames.AI_GENERATION.GENERATE_HIGH_RES) {
      return this.processGenerateHighRes(job as Job<GenerateHighResJob>);
    }

    return this.processGenerateDesign(job as Job<GenerateDesignJob>);
  }

  private async processGenerateDesign(job: Job<GenerateDesignJob>) {
    const { designId, prompt, options, userId, brandId } = job.data;
    const normalizedOptions = this.cloneOptions(options);
    
    this.logger.log(`Processing design generation for design ${designId}`);
    
    try {
      await this.prisma.design.update({
        where: { id: designId },
        data: { status: DesignStatus.PROCESSING },
      });

      const estimatedCost = await this.aiService.estimateCost(prompt, normalizedOptions);
      const hasQuota = await this.aiService.checkUserQuota(userId, estimatedCost);

      if (!hasQuota) {
        throw new Error('Quota exceeded');
      }

      const generationJob = await this.imageQueue.add(
        JobNames.IMAGE_GENERATION.GENERATE,
        this.buildImageGenerationPayload(designId, prompt, normalizedOptions, userId),
        {
          jobId: designId,
          attempts: 2,
          removeOnComplete: 200,
          removeOnFail: 50,
        },
      );

      const result = (await generationJob.waitUntilFinished(
        this.imageQueueEvents,
        10 * 60 * 1000,
      )) as GenerateImageResult;

      if (!result?.success || !result.imageUrl) {
        throw new Error(result?.error ?? 'Image generation failed');
      }

      const metadata = {
        prompt,
        options: normalizedOptions,
        generation: result.metadata,
        assets: {
          previewUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl ?? null,
        },
        completedAt: new Date().toISOString(),
      };

      await this.prisma.design.update({
        where: { id: designId },
        data: {
          status: DesignStatus.COMPLETED,
          previewUrl: result.imageUrl,
          metadata: this.toJsonValue(metadata),
        },
      });

      await Promise.all([
        this.aiService.recordAICost(brandId, 'openai', this.resolveModel(normalizedOptions), estimatedCost, {
          tokens: this.resolveTokenEstimate(normalizedOptions),
          duration: result.metadata?.generationTime ?? 0,
        }),
        this.aiService.updateUserQuota(userId, estimatedCost),
      ]);

      this.logger.log(`Design ${designId} generated successfully via worker`);
      
      return {
        success: true,
        designId,
        previewUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        metadata: result.metadata,
      };
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      this.logger.error(`Failed to generate design ${designId}: ${message}`, getErrorStack(error));
      
      // Update design status to failed
      await this.prisma.design.update({
        where: { id: designId },
        data: { 
          status: DesignStatus.FAILED,
          metadata: this.toJsonValue({
            ...normalizedOptions,
            error: message,
            failedAt: new Date().toISOString(),
          }),
        },
      });

      throw error;
    }
  }

  private async processGenerateHighRes(job: Job<GenerateHighResJob>) {
    const { designId, prompt, options, userId } = job.data;
    const normalizedOptions = this.cloneOptions(options);
    const estimationOptions = { ...normalizedOptions, highRes: true } as Record<string, unknown>;
    
    this.logger.log(`Processing high-res generation for design ${designId}`);
    
    try {
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
      });

      if (!design) {
        throw new Error(`Design ${designId} not found`);
      }

      if (!design.previewUrl) {
        throw new Error(`Design ${designId} has no preview to upscale`);
      }

      const estimatedCost = await this.aiService.estimateCost(prompt, estimationOptions);
      const hasQuota = await this.aiService.checkUserQuota(userId, estimatedCost);
      if (!hasQuota) {
        throw new Error('High-res quota exceeded');
      }

      const upscaleJob = await this.imageUpscaleQueue.add(
        JobNames.IMAGE_UPSCALE.UPSCALE,
        this.buildUpscalePayload(designId, design.previewUrl, userId, normalizedOptions),
        {
          jobId: `${designId}:highres`,
          attempts: 2,
          removeOnComplete: 200,
          removeOnFail: 50,
        },
      );

      const result = (await upscaleJob.waitUntilFinished(
        this.upscaleQueueEvents,
        10 * 60 * 1000,
      )) as UpscaleResult;

      if (!result?.success || !result.imageUrl) {
        throw new Error(result?.error ?? 'High-res generation failed');
      }

      const updatedMetadata = {
        ...(design.metadata as Record<string, unknown> | null ?? {}),
        highResGenerated: true,
        highResGeneratedAt: new Date().toISOString(),
        highResMetadata: result.metadata,
      };

      await this.prisma.design.update({
        where: { id: designId },
        data: {
          highResUrl: result.imageUrl,
          metadata: this.toJsonValue(updatedMetadata),
        },
      });

      await Promise.all([
        this.aiService.recordAICost(
          design.brandId,
          'openai',
          this.resolveModel(normalizedOptions),
          estimatedCost,
          {
            tokens: this.resolveTokenEstimate(normalizedOptions),
            duration: result.metadata?.fileSize ?? 0,
          },
        ),
        this.aiService.updateUserQuota(userId, estimatedCost),
      ]);

      this.logger.log(`High-res design ${designId} generated successfully via worker`);
      
      return { success: true, designId, highResUrl: result.imageUrl };
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      this.logger.error(`Failed to generate high-res design ${designId}: ${message}`, getErrorStack(error));
      throw error instanceof Error ? error : new Error(message);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([
      this.imageQueueEvents.close(),
      this.upscaleQueueEvents.close(),
    ]);
  }

  private buildImageGenerationPayload(
    designId: string,
    prompt: string,
    options: Record<string, unknown>,
    userId: string,
  ): GenerateImageJobPayload {
    return {
      prompt,
      style: this.resolveStyle(options),
      dimensions: this.resolveDimensions(options),
      quality: this.resolveQuality(options),
      userId,
      designId,
    };
  }

  private buildUpscalePayload(
    designId: string,
    imageUrl: string,
    userId: string,
    options: Record<string, unknown>,
  ): UpscaleJobPayload {
    return {
      imageUrl,
      designId,
      userId,
      scale: this.getNumberOption(options, 'scale', 2, 1, 4),
      format: this.resolveFormat(options),
    };
  }

  private resolveStyle(options?: Record<string, unknown>): string {
    const style = this.getStringOption(options, 'style');
    return typeof style === 'string' && style.trim().length > 0 ? style.trim() : 'professionnel';
  }

  private resolveDimensions(options?: Record<string, unknown>): string {
    const width = this.getNumberOption(options, 'width', 1024, 1);
    const height = this.getNumberOption(options, 'height', 1024, 1);
    const safeWidth = Number.isFinite(width) && width > 0 ? width : 1024;
    const safeHeight = Number.isFinite(height) && height > 0 ? height : 1024;
    return `${safeWidth}x${safeHeight}`;
  }

  private resolveQuality(options?: Record<string, unknown>): 'standard' | 'hd' {
    return this.getStringOption(options, 'quality') === 'hd' ? 'hd' : 'standard';
  }

  private resolveFormat(options?: Record<string, unknown>): UpscaleJobPayload['format'] {
    const format = this.getStringOption(options, 'format');
    if (format === 'jpg' || format === 'jpeg' || format === 'png' || format === 'webp') {
      return format;
    }
    return 'png';
  }

  private resolveModel(options?: Record<string, unknown>): string {
    const model = this.getStringOption(options, 'model');
    if (model.length > 0) {
      return model;
    }
    return this.resolveQuality(options) === 'hd' ? 'dall-e-3' : 'dall-e-2';
  }

  private resolveTokenEstimate(options?: Record<string, unknown>): number {
    const value = this.getNumberOption(options, 'tokenEstimate', 0);
    return value >= 0 ? value : 0;
  }

  private cloneOptions(options?: Record<string, unknown>): Record<string, unknown> {
    if (!options) {
      return {};
    }
    return JSON.parse(JSON.stringify(options)) as Record<string, unknown>;
  }

  private getStringOption(options: Record<string, unknown> | undefined, key: string): string {
    if (!options || !(key in options)) {
      return '';
    }
    const value = options[key];
    return typeof value === 'string' ? value : '';
  }

  private getNumberOption(
    options: Record<string, unknown> | undefined,
    key: string,
    fallback: number,
    min?: number,
    max?: number,
  ): number {
    if (!options || !(key in options)) {
      return fallback;
    }

    const candidate = options[key];
    const numeric = typeof candidate === 'number' ? candidate : Number(candidate);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    let clamped = numeric;
    if (typeof min === 'number') {
      clamped = Math.max(min, clamped);
    }
    if (typeof max === 'number') {
      clamped = Math.min(max, clamped);
    }

    return clamped;
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private createQueueEvents(queueName: string): QueueEvents {
    const events = new QueueEvents(queueName, {
      connection: this.getRedisConnectionOptions(),
      prefix: 'luneo',
    });

    events.on('error', (error) => {
      this.logger.error(`QueueEvents error for ${queueName}`, getErrorStack(error));
    });

    return events;
  }

  private getRedisConnectionOptions(): RedisOptions {
    const redisUrl = this.configService.get<string>('redis.url') ?? 'redis://localhost:6379';
    const parsed = new URL(redisUrl);

    const options: RedisOptions = {
      host: parsed.hostname,
      port: Number(parsed.port || '6379'),
    };

    if (parsed.password) {
      options.password = parsed.password;
    }

    if (parsed.username) {
      options.username = parsed.username;
    }

    if (parsed.protocol === 'rediss:') {
      options.tls = {} as TlsConnectionOptions;
    }

    return options;
  }
}
