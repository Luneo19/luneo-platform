import { Job, Worker, type KeepJobs, type WorkerOptions } from 'bullmq';
import OpenAI from 'openai';
import sharp from 'sharp';
import type { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import Redis from 'ioredis';
import { createWorkerLogger, serializeError } from '../utils/logger';
import { saveToStorage } from '../utils/storage';
import { traceJob, withActiveSpan } from '../observability/span-helpers';
import {
  sanitizePrompt,
  hashPrompt,
  type PromptRedaction,
  maskPromptForLogs,
} from '@luneo/ai-safety';

const QUEUE_NAME = 'design-render';
const DEFAULT_REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};
const CLEANUP_ON_COMPLETE: KeepJobs = { count: 100 };
const CLEANUP_ON_FAIL: KeepJobs = { count: 50 };

// Configuration
const OPENAI_ENABLED = process.env.OPENAI_IMAGE_EDIT_ENABLED !== 'false';
const LOCAL_DIFFUSION_URL = process.env.LOCAL_DIFFUSION_URL || 'http://localhost:7860';
const DRY_RUN_MODE = process.env.DRY_RUN_MODE === 'true';
const MAX_TOKENS_PER_JOB = parseInt(process.env.MAX_TOKENS_PER_JOB || '10000', 10);
const DEFAULT_TENANT_CONCURRENCY = parseInt(process.env.DEFAULT_TENANT_CONCURRENCY || '2', 10);

// Circuit Breaker Configuration
const CIRCUIT_BREAKER_THRESHOLD = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10);
const CIRCUIT_BREAKER_TIMEOUT = parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000', 10); // 60s

type WorkerConnection = WorkerOptions['connection'];

interface RenderJobData {
  designId: string;
  prompt: string;
  maskUrl?: string;
  baseTextureUrl: string;
  renderOptions?: {
    generateNormalMap?: boolean;
    generateRoughnessMap?: boolean;
    quality?: 'standard' | 'hd';
    size?: '512x512' | '1024x1024' | '2048x2048';
  };
  tenantId: string;
  userId?: string;
}

interface RenderResult {
  success: boolean;
  compositeTextureUrl?: string;
  previewUrl?: string;
  highResUrl?: string;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  costTokens?: number;
  costCents?: number;
  metadata?: {
    provider: string;
    generationTime: number;
    dimensions: string;
    promptHash: string;
    redactions: PromptRedaction[];
  };
  error?: string;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

interface TenantConcurrencyState {
  active: number;
  limit: number;
}

/**
 * Circuit Breaker for API calls
 */
class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed',
  };

  constructor(
    private readonly threshold: number = CIRCUIT_BREAKER_THRESHOLD,
    private readonly timeout: number = CIRCUIT_BREAKER_TIMEOUT,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime;
      if (timeSinceLastFailure > this.timeout) {
        this.state.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state.state === 'half-open') {
      this.state.state = 'closed';
    }
    this.state.failures = 0;
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    if (this.state.failures >= this.threshold) {
      this.state.state = 'open';
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

/**
 * Tenant Concurrency Manager
 */
class TenantConcurrencyManager {
  private readonly tenantStates = new Map<string, TenantConcurrencyState>();
  private readonly redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async acquireSlot(tenantId: string, limit: number): Promise<() => void> {
    const key = `tenant:concurrency:${tenantId}`;
    const current = await this.redis.incr(key);
    
    // Set expiration if this is the first job
    if (current === 1) {
      await this.redis.expire(key, 3600); // 1 hour
    }

    if (current > limit) {
      await this.redis.decr(key);
      throw new Error(`Tenant concurrency limit exceeded: ${limit} active jobs`);
    }

    return async () => {
      await this.redis.decr(key);
    };
  }

  async getActiveCount(tenantId: string): Promise<number> {
    const key = `tenant:concurrency:${tenantId}`;
    const count = await this.redis.get(key);
    return parseInt(count || '0', 10);
  }
}

export class RenderJobWorker {
  private worker: Worker<RenderJobData, RenderResult>;
  private readonly logger: Logger;
  private readonly connection: WorkerConnection;
  private readonly prisma: PrismaClient;
  private readonly openai?: OpenAI;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly concurrencyManager: TenantConcurrencyManager;
  private readonly redis: Redis;

  constructor(connection: WorkerConnection = DEFAULT_REDIS_CONNECTION) {
    this.logger = createWorkerLogger('design-render');
    this.connection = connection;
    this.redis = new Redis(connection as any);
    this.prisma = new PrismaClient();
    this.circuitBreaker = new CircuitBreaker();
    this.concurrencyManager = new TenantConcurrencyManager(this.redis);

    if (OPENAI_ENABLED && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Configure Cloudinary if available
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }

    this.worker = new Worker<RenderJobData, RenderResult>(
      QUEUE_NAME,
      this.processJob.bind(this),
      {
        connection: this.connection,
        concurrency: 5, // Global concurrency, per-tenant limits enforced separately
        removeOnComplete: CLEANUP_ON_COMPLETE,
        removeOnFail: CLEANUP_ON_FAIL,
        limiter: {
          max: 100,
          duration: 60000, // 100 jobs per minute
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.info('Render job completed', {
        jobId: job.id,
        queue: job.queueName,
        designId: job.data.designId,
      });
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error('Render job failed', {
        jobId: job?.id,
        queue: job?.queueName,
        designId: job?.data?.designId,
        error: serializeError(err),
      });
    });

    this.worker.on('error', (err) => {
      this.logger.error('Render worker error', {
        error: serializeError(err),
      });
    });
  }

  public async start(): Promise<void> {
    this.logger.info('Render job worker started', {
      openaiEnabled: OPENAI_ENABLED,
      dryRunMode: DRY_RUN_MODE,
      maxTokensPerJob: MAX_TOKENS_PER_JOB,
    });
  }

  public async stop(): Promise<void> {
    await this.worker.close();
    await this.prisma.$disconnect();
    await this.redis.quit();
    this.logger.info('Render job worker stopped');
  }

  private async processJob(job: Job<RenderJobData>): Promise<RenderResult> {
    return traceJob('worker.design-render.process', job, async (span) => {
      const startTime = Date.now();
      const { designId, prompt, maskUrl, baseTextureUrl, renderOptions, tenantId, userId } =
        job.data;

      span.setAttribute('luneo.design.id', designId);
      span.setAttribute('luneo.tenant.id', tenantId);
      if (userId) {
        span.setAttribute('luneo.user.id', userId);
      }

      // Acquire tenant concurrency slot
      const releaseSlot = await this.concurrencyManager.acquireSlot(
        tenantId,
        DEFAULT_TENANT_CONCURRENCY,
      );

      try {
        // Update design status
        await this.prisma.design.update({
          where: { id: designId },
          data: { status: 'PROCESSING' },
        });

        // Sanitize prompt
        const sanitized = sanitizePrompt(prompt, { maxLength: 1500 });
        if (sanitized.blocked) {
          throw new Error('Prompt rejected: sensitive information detected');
        }

        const safePrompt = sanitized.prompt;
        const promptHash = hashPrompt(prompt);

        span.setAttribute('ai.prompt.hash', promptHash);
        span.setAttribute('ai.prompt.redactions', sanitized.redactions.length);
        span.setAttribute('ai.prompt.length', safePrompt.length);

        this.logger.info('Starting render job', {
          designId,
          jobId: job.id,
          tenantId,
          userId,
          promptHash,
          promptPreview: maskPromptForLogs(safePrompt),
        });

        // Download base texture and mask
        const [baseTexture, mask] = await Promise.all([
          this.downloadImage(baseTextureUrl),
          maskUrl ? this.downloadImage(maskUrl) : undefined,
        ]);

        // Generate composite texture
        const compositeResult = await withActiveSpan(
          'worker.design-render.generate-composite',
          {
            'ai.provider': OPENAI_ENABLED ? 'openai' : 'local-diffusion',
          },
          async () =>
            this.generateCompositeTexture(
              baseTexture,
              mask,
              safePrompt,
              renderOptions?.quality || 'standard',
            ),
        );

        // Generate preview (512x512)
        const previewBuffer = await withActiveSpan(
          'worker.design-render.generate-preview',
          { 'image.dimensions': '512x512' },
          async () => this.resizeImage(compositeResult.image, 512, 512),
        );

        // Generate high-res (2048x2048)
        const highResBuffer = await withActiveSpan(
          'worker.design-render.generate-highres',
          { 'image.dimensions': '2048x2048' },
          async () => this.resizeImage(compositeResult.image, 2048, 2048),
        );

        // Optionally generate normal and roughness maps
        let normalMapBuffer: Buffer | undefined;
        let roughnessMapBuffer: Buffer | undefined;

        if (renderOptions?.generateNormalMap) {
          normalMapBuffer = await withActiveSpan(
            'worker.design-render.generate-normal-map',
            {},
            async () => this.generateNormalMap(compositeResult.image),
          );
        }

        if (renderOptions?.generateRoughnessMap) {
          roughnessMapBuffer = await withActiveSpan(
            'worker.design-render.generate-roughness-map',
            {},
            async () => this.generateRoughnessMap(compositeResult.image),
          );
        }

        // Upload to storage
        const [compositeUrl, previewUrl, highResUrl, normalMapUrl, roughnessMapUrl] =
          await Promise.all([
            this.uploadToStorage(compositeResult.image, designId, userId, 'composite'),
            this.uploadToStorage(previewBuffer, designId, userId, 'preview'),
            this.uploadToStorage(highResBuffer, designId, userId, 'highres'),
            normalMapBuffer
              ? this.uploadToStorage(normalMapBuffer, designId, userId, 'normal-map')
              : Promise.resolve(undefined),
            roughnessMapBuffer
              ? this.uploadToStorage(roughnessMapBuffer, designId, userId, 'roughness-map')
              : Promise.resolve(undefined),
          ]);

        // Calculate costs
        const costTokens = compositeResult.tokensUsed || 0;
        const costCents = this.calculateCost(costTokens, compositeResult.provider);

        // Check token limit
        if (costTokens > MAX_TOKENS_PER_JOB) {
          throw new Error(
            `Token limit exceeded: ${costTokens} > ${MAX_TOKENS_PER_JOB}. Job cancelled.`,
          );
        }

        const generationTime = Date.now() - startTime;

        // Update design record
        const metadata = {
          provider: compositeResult.provider,
          generationTime,
          dimensions: '2048x2048',
          promptHash,
          redactions: sanitized.redactions,
          tokensUsed: costTokens,
          costCents,
        };

        // Update design record with all fields
        await this.prisma.design.update({
          where: { id: designId },
          data: {
            status: 'COMPLETED',
            previewUrl: previewUrl,
            highResUrl: highResUrl,
            compositeTextureUrl: compositeUrl,
            metadata: {
              ...metadata,
              normalMapUrl: normalMapUrl,
              roughnessMapUrl: roughnessMapUrl,
            } as any,
            costCents: costCents,
            costTokens: costTokens,
            provider: compositeResult.provider,
            completedAt: new Date(),
          },
        });

        // Emit websocket event via Redis pub/sub
        await this.emitWebsocketEvent(tenantId, {
          event: 'design.render.completed',
          designId,
          tenantId,
          userId,
          compositeTextureUrl: compositeUrl,
          previewUrl,
          highResUrl,
          normalMapUrl,
          roughnessMapUrl,
          costTokens,
          costCents,
        });

        // Optionally trigger webhook
        if (process.env.WEBHOOK_ENABLED === 'true') {
          await this.triggerWebhook(tenantId, {
            event: 'design.render.completed',
            designId,
            compositeTextureUrl: compositeUrl,
            previewUrl,
            highResUrl,
          });
        }

        span.setAttribute('job.result.success', true);
        span.setAttribute('ai.cost.tokens', costTokens);
        span.setAttribute('ai.cost.cents', costCents);
        span.setAttribute('job.duration_ms', generationTime);

        this.logger.info('Render job completed successfully', {
          designId,
          jobId: job.id,
          generationTime,
          costTokens,
          costCents,
        });

        return {
          success: true,
          compositeTextureUrl: compositeUrl,
          previewUrl,
          highResUrl,
          normalMapUrl,
          roughnessMapUrl,
          costTokens,
          costCents,
          metadata: {
            provider: compositeResult.provider,
            generationTime,
            dimensions: '2048x2048',
            promptHash,
            redactions: sanitized.redactions,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error('Render job failed', {
          designId,
          jobId: job.id,
          error: serializeError(error),
        });

        // Update design status to failed
        await this.prisma.design.update({
          where: { id: designId },
          data: {
            status: 'FAILED',
            metadata: {
              error: errorMessage,
              timestamp: new Date().toISOString(),
            } as any,
          },
        });

        // Emit failure event
        await this.emitWebsocketEvent(tenantId, {
          event: 'design.render.failed',
          designId,
          tenantId,
          userId,
          error: errorMessage,
        });

        span.setAttribute('job.result.success', false);
        span.setAttribute('job.error', errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        await releaseSlot();
      }
    });
  }

  private async generateCompositeTexture(
    baseTexture: Buffer,
    mask: Buffer | undefined,
    prompt: string,
    quality: 'standard' | 'hd',
  ): Promise<{ image: Buffer; tokensUsed: number; provider: string }> {
    if (DRY_RUN_MODE) {
      this.logger.warn('DRY RUN MODE: Skipping actual generation');
      return {
        image: baseTexture, // Return original as placeholder
        tokensUsed: 0,
        provider: 'dry-run',
      };
    }

    // Try OpenAI Image Edit first if enabled
    if (OPENAI_ENABLED && this.openai && mask) {
      try {
        return await this.circuitBreaker.execute(async () => {
          const result = await this.generateWithOpenAIEdit(baseTexture, mask, prompt, quality);
          return {
            image: result.image,
            tokensUsed: result.tokensUsed,
            provider: 'openai',
          };
        });
      } catch (error) {
        this.logger.warn('OpenAI Image Edit failed, falling back to local diffusion', {
          error: serializeError(error),
        });
        // Fall through to local diffusion
      }
    }

    // Fallback to local diffusion container
    return await this.circuitBreaker.execute(async () => {
      const result = await this.generateWithLocalDiffusion(baseTexture, mask, prompt, quality);
      return {
        image: result.image,
        tokensUsed: result.tokensUsed,
        provider: 'local-diffusion',
      };
    });
  }

  private async generateWithOpenAIEdit(
    baseTexture: Buffer,
    mask: Buffer,
    prompt: string,
    quality: 'standard' | 'hd',
  ): Promise<{ image: Buffer; tokensUsed: number }> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    // OpenAI Image Edit API accepts File objects or readable streams
    // In Node.js, we need to create File-like objects or use form-data
    // For Node.js 18+, we can use the File API if available, otherwise use form-data
    let baseImageFile: File | Buffer;
    let maskImageFile: File | Buffer;

    // Check if File API is available (Node.js 18+)
    if (typeof File !== 'undefined') {
      baseImageFile = new File([baseTexture], 'base.png', { type: 'image/png' });
      maskImageFile = new File([mask], 'mask.png', { type: 'image/png' });
    } else {
      // Fallback: use buffers directly (OpenAI SDK should handle this)
      baseImageFile = baseTexture;
      maskImageFile = mask;
    }

    const response = await this.openai.images.edit({
      image: baseImageFile as any,
      mask: maskImageFile as any,
      prompt: prompt,
      n: 1,
      size: '1024x1024', // OpenAI Image Edit supports 1024x1024
      response_format: 'url',
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    const imageBuffer = await this.downloadImage(imageUrl);

    // Estimate tokens (OpenAI Image Edit doesn't return token usage)
    // Rough estimate: base image + mask + prompt
    // OpenAI Image Edit pricing: ~$0.020 per image
    const tokensUsed = Math.ceil(
      (baseTexture.length + mask.length) / 4 + prompt.length / 4,
    );

    return {
      image: imageBuffer,
      tokensUsed,
    };
  }

  private async generateWithLocalDiffusion(
    baseTexture: Buffer,
    mask: Buffer | undefined,
    prompt: string,
    quality: 'standard' | 'hd',
  ): Promise<{ image: Buffer; tokensUsed: number }> {
    // Call local diffusion container API
    // Try FormData first (Node.js 18+), fallback to JSON
    let response: Response;
    
    if (typeof FormData !== 'undefined') {
      const formData = new FormData();
      let useFormData = true;
      
      // In Node.js 18+, FormData accepts File or Blob
      if (typeof File !== 'undefined') {
        formData.append('image', new File([baseTexture], 'base.png', { type: 'image/png' }));
        if (mask) {
          formData.append('mask', new File([mask], 'mask.png', { type: 'image/png' }));
        }
      } else if (typeof Blob !== 'undefined') {
        // Fallback: use Blob if File is not available
        formData.append('image', new Blob([baseTexture], { type: 'image/png' }), 'base.png');
        if (mask) {
          formData.append('mask', new Blob([mask], { type: 'image/png' }), 'mask.png');
        }
      } else {
        // Last resort: base64 JSON
        useFormData = false;
        response = await fetch(`${LOCAL_DIFFUSION_URL}/api/inpaint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: baseTexture.toString('base64'),
            mask_base64: mask?.toString('base64'),
            prompt,
            quality,
          }),
        });
      }
      
      if (useFormData) {
        formData.append('prompt', prompt);
        formData.append('quality', quality);
        response = await fetch(`${LOCAL_DIFFUSION_URL}/api/inpaint`, {
          method: 'POST',
          body: formData,
        });
      }
    } else {
      // Fallback: use JSON with base64 encoding
      response = await fetch(`${LOCAL_DIFFUSION_URL}/api/inpaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: baseTexture.toString('base64'),
          mask_base64: mask?.toString('base64'),
          prompt,
          quality,
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`Local diffusion API failed: ${response.statusText}`);
    }

    const result = await response.json();
    const imageUrl = result.image_url || result.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from local diffusion API');
    }

    const imageBuffer = await this.downloadImage(imageUrl);

    // Estimate tokens for local diffusion (rough estimate)
    const tokensUsed = Math.ceil(
      (baseTexture.length + (mask?.length || 0)) / 4 + prompt.length / 4,
    );

    return {
      image: imageBuffer,
      tokensUsed,
    };
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async resizeImage(image: Buffer, width: number, height: number): Promise<Buffer> {
    return await sharp(image)
      .resize(width, height, {
        fit: 'cover',
        kernel: sharp.kernel.lanczos3,
      })
      .png({ quality: 95 })
      .toBuffer();
  }

  private async generateNormalMap(image: Buffer): Promise<Buffer> {
    // Generate normal map from image using height-to-normal conversion
    // This is a simplified implementation - in production, use proper normal map generation
    const processed = await sharp(image)
      .greyscale()
      .normalise()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, 0, -1, 0, 1, 0, 1, 1], // Sobel-like filter for normal mapping
      })
      .png()
      .toBuffer();

    return processed;
  }

  private async generateRoughnessMap(image: Buffer): Promise<Buffer> {
    // Generate roughness map from image luminance
    const processed = await sharp(image)
      .greyscale()
      .normalise()
      .png()
      .toBuffer();

    return processed;
  }

  private async uploadToStorage(
    buffer: Buffer,
    designId: string,
    userId: string | undefined,
    type: string,
  ): Promise<string> {
    // Try Cloudinary first if configured
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        return new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: `designs/${designId}`,
                public_id: type,
                resource_type: 'image',
                format: 'png',
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result!.secure_url);
                }
              },
            )
            .end(buffer);
        });
      } catch (error) {
        this.logger.warn('Cloudinary upload failed, falling back to local storage', {
          error: serializeError(error),
        });
      }
    }

    // Fallback to local storage
    const saved = await saveToStorage(
      buffer,
      `renders/${userId || 'anonymous'}/${designId}-${type}-${Date.now()}.png`,
      { contentType: 'image/png' },
    );

    return saved.url;
  }

  private calculateCost(tokens: number, provider: string): number {
    // Cost in cents
    if (provider === 'openai') {
      // OpenAI Image Edit pricing (approximate): $0.020 per image
      return Math.ceil(tokens * 0.00002); // Rough estimate
    } else if (provider === 'local-diffusion') {
      // Local diffusion has minimal cost (compute only)
      return Math.ceil(tokens * 0.000001);
    }
    return 0;
  }

  private async emitWebsocketEvent(tenantId: string, payload: Record<string, unknown>): Promise<void> {
    // Emit via Redis pub/sub for backend to pick up
    const channel = `tenant:${tenantId}:events`;
    await this.redis.publish(channel, JSON.stringify(payload));
  }

  private async triggerWebhook(
    tenantId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // In a real implementation, this would call the backend webhook service
    // For now, we'll just log it
    this.logger.info('Webhook triggered', {
      tenantId,
      event: payload.event,
    });
  }
}

export default RenderJobWorker;
