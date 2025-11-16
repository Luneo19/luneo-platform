import { Job, Worker, type WorkerOptions, type KeepJobs } from 'bullmq';
import OpenAI from 'openai';
import sharp from 'sharp';
import type { Logger } from 'winston';
import { createWorkerLogger, serializeError } from '../utils/logger';
import { saveToStorage } from '../utils/storage';
import { PromptCache, computePromptKey } from '../utils/promptCache';
import { traceJob, withActiveSpan } from '../observability/span-helpers';
import {
  sanitizePrompt,
  hashPrompt,
  type PromptRedaction,
  maskPromptForLogs,
} from '@luneo/ai-safety';

export interface GenerateImageJobData {
  prompt: string;
  style: string;
  dimensions: string;
  quality: 'standard' | 'hd';
  userId: string;
  designId: string;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  metadata?: {
    dimensions: string;
    fileSize: number;
    format: string;
    generationTime: number;
    promptGuard?: {
      hash: string;
      redactions: PromptRedaction[];
      truncated: boolean;
    };
  };
  error?: string;
}

const QUEUE_NAME = 'image-generation';
const DEFAULT_REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};
const CLEANUP_ON_COMPLETE: KeepJobs = { count: 100 };
const CLEANUP_ON_FAIL: KeepJobs = { count: 50 };

type WorkerConnection = WorkerOptions['connection'];

interface PromptGuardContext {
  sanitizedPrompt: string;
  promptHash: string;
  redactions: PromptRedaction[];
  truncated: boolean;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ImageGenerationWorker {
  private worker: Worker<GenerateImageJobData, GenerateImageResult>;
  private readonly logger: Logger;
  private readonly connection: WorkerConnection;
  private readonly promptCache?: PromptCache;
  private readonly pendingGenerations = new Map<string, Promise<GenerateImageResult>>();

  constructor(connection: WorkerConnection = DEFAULT_REDIS_CONNECTION) {
    this.logger = createWorkerLogger('image-generation');
    this.connection = connection;
    this.promptCache =
      process.env.PROMPT_CACHE_TTL_SECONDS === '0'
        ? undefined
        : new PromptCache(connection as any);
    this.worker = new Worker<GenerateImageJobData, GenerateImageResult>(
      QUEUE_NAME,
      this.processJob.bind(this),
      {
        connection: this.connection,
        concurrency: 3,
        removeOnComplete: CLEANUP_ON_COMPLETE,
        removeOnFail: CLEANUP_ON_FAIL,
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.info('Image generation job completed', {
        jobId: job.id,
        queue: job.queueName,
      });
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error('Image generation job failed', {
        jobId: job?.id,
        queue: job?.queueName,
        error: serializeError(err),
      });
    });

    this.worker.on('error', (err) => {
      this.logger.error('Image generation worker error', {
        error: serializeError(err),
      });
    });
  }

  private async processJob(job: Job<GenerateImageJobData>): Promise<GenerateImageResult> {
    return traceJob('worker.image-generation.process', job, async (span) => {
      const startTime = Date.now();
      const { prompt, style, dimensions, quality, userId, designId } = job.data;
      const sanitized = sanitizePrompt(prompt, { maxLength: 1500 });

      if (sanitized.blocked) {
        throw new Error('Prompt rejected: sensitive information detected');
      }

      const safePrompt = sanitized.prompt;
      job.data.prompt = safePrompt;

      const guard: PromptGuardContext = {
        sanitizedPrompt: safePrompt,
        promptHash: hashPrompt(prompt),
        redactions: sanitized.redactions,
        truncated: sanitized.truncated,
      };

      span.setAttribute('ai.prompt.hash', guard.promptHash);
      span.setAttribute('ai.prompt.redactions', sanitized.redactions.length);

      const cacheKey = computePromptKey({ prompt: safePrompt, style, dimensions, quality });

      span.setAttribute('ai.prompt.length', prompt.length);
      span.setAttribute('ai.image.dimensions', dimensions);
      span.setAttribute('ai.image.quality', quality);

      const inFlight = this.pendingGenerations.get(cacheKey);
      if (inFlight) {
        span.setAttribute('ai.generation.shared', true);
        this.logger.info('Joining in-flight generation', { jobId: job.id, cacheKey });
        return inFlight;
      }
      span.setAttribute('ai.generation.shared', false);

      const cached = await this.promptCache?.get(cacheKey);
      if (cached) {
        span.setAttribute('ai.generation.cache_hit', true);

        return withActiveSpan(
          'worker.image-generation.cache-hit',
          { 'cache.key': cacheKey },
          async () => {
            this.logger.info('Serving image generation from cache', {
              designId,
              jobId: job.id,
              cacheKey,
            });

            const imageBuffer = Buffer.from(cached.imageBase64, 'base64');
            const thumbnailBuffer = Buffer.from(cached.thumbnailBase64, 'base64');

            const [savedImage, savedThumbnail] = await Promise.all([
              this.saveImage(imageBuffer, designId, userId),
              this.saveThumbnail(thumbnailBuffer, designId, userId),
            ]);

            return {
              success: true,
              imageUrl: savedImage.url,
              thumbnailUrl: savedThumbnail.url,
              metadata: {
                ...(cached.metadata ?? {
                  dimensions,
                  fileSize: imageBuffer.length,
                  format: 'PNG',
                }),
                generationTime: 0,
              },
            };
          },
        );
      }

      span.setAttribute('ai.generation.cache_hit', false);

      const generationPromise = withActiveSpan(
        'worker.image-generation.execute',
        {
          'cache.key': cacheKey,
        },
        async () => this.executeGeneration(job, startTime, cacheKey, guard),
      );

      this.pendingGenerations.set(cacheKey, generationPromise);

      try {
        const result = await generationPromise;
        span.setAttribute('ai.generation.duration_ms', Date.now() - startTime);
        return result;
      } finally {
        this.pendingGenerations.delete(cacheKey);
      }
    });
  }

  private async executeGeneration(
    job: Job<GenerateImageJobData>,
    startTime: number,
    cacheKey: string,
    guard: PromptGuardContext,
  ): Promise<GenerateImageResult> {
    const { style, dimensions, quality, userId, designId } = job.data;
    const prompt = guard.sanitizedPrompt;

    try {
      this.logger.info('Starting image generation', {
        designId,
        jobId: job.id,
        userId,
        style,
        dimensions,
        quality,
      });
      
      // Enhance prompt with style
      const enhancedPrompt = this.enhancePrompt(prompt, style);
      const finalPrompt = sanitizePrompt(enhancedPrompt, { maxLength: 1600 });

      if (finalPrompt.blocked) {
        throw new Error('Prompt rejected after enhancement due to sensitive fragments');
      }

      if (finalPrompt.redactions.length) {
        guard.redactions = [...guard.redactions, ...finalPrompt.redactions];
      }
      guard.truncated = guard.truncated || finalPrompt.truncated;

      this.logger.debug('Dispatching OpenAI request', {
        designId,
        promptHash: guard.promptHash,
        promptPreview: maskPromptForLogs(finalPrompt.prompt),
      });

      const response = await withActiveSpan(
        'worker.image-generation.openai-request',
        {
          'ai.prompt.length': finalPrompt.prompt.length,
          'ai.image.dimensions': dimensions,
          'ai.image.quality': quality,
        },
        async () =>
          openai.images.generate({
            model: quality === 'hd' ? 'dall-e-3' : 'dall-e-2',
            prompt: finalPrompt.prompt,
            size: this.mapDimensions(dimensions),
            quality: quality === 'hd' ? 'hd' : 'standard',
            n: 1,
            response_format: 'url',
          }),
      );

      const data = response.data;
      if (!data?.length) {
        throw new Error('No image data returned from OpenAI');
      }

      const [generatedImage] = data;
      if (!generatedImage?.url) {
        throw new Error('No image URL returned from OpenAI');
      }

      // Download and process image
      const imageUrl = generatedImage.url;
      const processedImage = await withActiveSpan(
        'worker.image-generation.process-image',
        { 'ai.image.dimensions': dimensions },
        async () => this.processImage(imageUrl, dimensions),
      );
      
      // Save to storage
      const savedImage = await withActiveSpan(
        'worker.image-generation.save-image',
        { 'luneo.design.id': designId },
        async () => this.saveImage(processedImage, designId, userId),
      );
      
      // Generate thumbnail
      const thumbnail = await withActiveSpan(
        'worker.image-generation.thumbnail',
        {},
        async () => this.generateThumbnail(processedImage),
      );
      const savedThumbnail = await withActiveSpan(
        'worker.image-generation.save-thumbnail',
        { 'luneo.design.id': designId },
        async () => this.saveThumbnail(thumbnail, designId, userId),
      );

      const generationTime = Date.now() - startTime;

      this.logger.info('Image generation completed', {
        designId,
        jobId: job.id,
        generationTime,
      });

      if (this.promptCache) {
        await withActiveSpan('worker.image-generation.cache-store', { 'cache.key': cacheKey }, async () =>
          this.promptCache!.set(cacheKey, {
            imageBase64: processedImage.toString('base64'),
            thumbnailBase64: thumbnail.toString('base64'),
            metadata: {
              dimensions,
              fileSize: processedImage.length,
              format: 'PNG',
              generationTime,
              promptGuard: {
                hash: guard.promptHash,
                redactions: guard.redactions,
                truncated: guard.truncated,
              },
            },
            createdAt: new Date().toISOString(),
          }),
        );
      }

      return {
        success: true,
        imageUrl: savedImage.url,
        thumbnailUrl: savedThumbnail.url,
        metadata: {
          dimensions,
          fileSize: processedImage.length,
          format: 'PNG',
          generationTime,
          promptGuard: {
            hash: guard.promptHash,
            redactions: guard.redactions,
            truncated: guard.truncated,
          },
        },
      };

    } catch (error) {
      this.logger.error('Image generation failed', {
        designId,
        jobId: job.id,
        error: serializeError(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private enhancePrompt(prompt: string, style: string): string {
    const styleEnhancements: Record<string, string> = {
      moderne: 'modern, clean, minimalist design with contemporary aesthetics',
      vintage: 'vintage, retro style with classic design elements and aged textures',
      minimaliste: 'minimalist, simple, clean design with lots of white space',
      colore: 'vibrant, colorful design with bold colors and dynamic elements',
      professionnel: 'professional, corporate design suitable for business use',
      futuriste: 'futuristic, sci-fi design with technological elements',
      organique: 'organic, natural design with flowing shapes and earth tones',
      geometrique: 'geometric, structured design with precise shapes and patterns',
    };

    const styleEnhancement = styleEnhancements[style] || '';
    return `${prompt}. Style: ${styleEnhancement}. High quality, professional design.`;
  }

  private mapDimensions(dimensions: string): '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' {
    const dimensionMap: Record<string, '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'> = {
      '1024x1024': '1024x1024',
      '512x512': '512x512',
      '256x256': '256x256',
      '1792x1024': '1792x1024',
      '1024x1792': '1024x1792',
    };

    return dimensionMap[dimensions] || '1024x1024';
  }

  private async processImage(imageUrl: string, dimensions: string): Promise<Buffer> {
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Process with Sharp
    const [width, height] = dimensions.split('x').map(Number);
    
    return await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .png({ quality: 95 })
      .toBuffer();
  }

  private async generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    return await sharp(imageBuffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  private async saveImage(imageBuffer: Buffer, designId: string, userId: string): Promise<{ url: string }> {
    const saved = await saveToStorage(
      imageBuffer,
      `images/${userId}/${designId}-${Date.now()}.png`,
      { contentType: 'image/png' }
    );

    return { url: saved.url };
  }

  private async saveThumbnail(thumbnailBuffer: Buffer, designId: string, userId: string): Promise<{ url: string }> {
    const saved = await saveToStorage(
      thumbnailBuffer,
      `images/${userId}/${designId}-thumb-${Date.now()}.jpg`,
      { contentType: 'image/jpeg' }
    );

    return { url: saved.url };
  }

  public async start(): Promise<void> {
    this.logger.info('Image generation worker started');
  }

  public async stop(): Promise<void> {
    await this.worker.close();
    this.logger.info('Image generation worker stopped');
    await this.promptCache?.dispose();
  }
}

// Export for use in main worker file
export default ImageGenerationWorker;