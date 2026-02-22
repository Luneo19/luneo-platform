// @ts-nocheck
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { AiService } from '@/modules/ai/ai.service';
import { AIImageService } from '@/modules/ai/services/ai-image.service';
import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DesignStatus } from '@/common/compat/v1-enums';
import { Job } from 'bullmq';
import axios from 'axios';

export interface GenerateDesignJob {
  designId: string;
  prompt: string;
  options: Record<string, unknown> & {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  };
  userId: string;
  brandId: string;
}

export interface GenerateHighResJob {
  designId: string;
  prompt: string;
  options: Record<string, unknown>;
  userId: string;
}

@Injectable()
@Processor('ai-generation')
export class AiGenerationWorker {
  private readonly logger = new Logger(AiGenerationWorker.name);
  private readonly openaiApiKey: string;
  private readonly replicateApiKey: string;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private aiImageService: AIImageService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    // PRODUCTION FIX: Standardize on REPLICATE_API_TOKEN (matches configuration.ts)
    this.replicateApiKey = this.configService.get<string>('REPLICATE_API_TOKEN') || this.configService.get<string>('ai.replicate.apiToken') || '';
  }

  @Process('generate-design')
  async handleGenerateDesign(job: Job<GenerateDesignJob>) {
    const { designId, prompt, options, userId, brandId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing design generation for design ${designId}`);

    try {
      // Update design status to processing
      await this.prisma.design.update({
        where: { id: designId },
        data: { status: DesignStatus.PROCESSING },
      });

      // Estimate cost and check quota
      const estimatedCost = await this.aiService.estimateCost(prompt, options);
      const hasQuota = await this.aiService.checkUserQuota(userId, estimatedCost);
      if (!hasQuota) {
        throw new Error('Quota exceeded. Please upgrade your plan or wait for monthly reset.');
      }

      // Check budget
      await this.aiService.checkBudgetOrThrow(brandId, estimatedCost);

      // Generate image using real AI providers
      const size = options.size || '1024x1024';
      const quality = options.quality || 'standard';
      const style = options.style || 'vivid';

      let generatedUrl: string | undefined;
      let aiProvider: string | undefined;
      let revisedPrompt: string | undefined;

      // Try providers in order: Replicate -> OpenAI
      if (this.replicateApiKey) {
        try {
          const result = await this.generateWithReplicate(prompt, size);
          generatedUrl = result.url;
          aiProvider = 'replicate-sdxl';
        } catch (replicateError) {
          this.logger.warn('Replicate failed, trying OpenAI', replicateError);
        }
      }

      if (!generatedUrl && this.openaiApiKey) {
        try {
          const result = await this.generateWithOpenAI(prompt, size, quality, style);
          generatedUrl = result.url;
          aiProvider = 'openai-dalle3';
          revisedPrompt = result.revisedPrompt;
        } catch (openaiError) {
          this.logger.warn('OpenAI failed', openaiError);
        }
      }

      if (!generatedUrl || !aiProvider) {
        throw new Error(
          'No AI provider available. Configure REPLICATE_API_KEY or OPENAI_API_KEY.',
        );
      }

      // Upload to permanent storage (Cloudinary/S3)
      const previewUrl = await this.uploadToStorage(generatedUrl, designId, 'preview');

      const duration = Date.now() - startTime;
      const metadata = {
        prompt,
        revisedPrompt,
        options,
        generatedAt: new Date().toISOString(),
        aiProvider,
        costCents: estimatedCost,
        duration,
        size,
        quality,
        style,
      };

      // Update design with results
      await this.prisma.design.update({
        where: { id: designId },
        data: {
          status: DesignStatus.COMPLETED,
          previewUrl,
          metadata: metadata as unknown as import('@prisma/client').Prisma.InputJsonValue,
        },
      });

      // Record AI cost
      await this.aiService.recordAICost(brandId, aiProvider, `${aiProvider}-${size}`, estimatedCost, {
        tokens: this.estimateTokens(prompt),
        duration,
      });

      // Update user quota
      await this.aiService.updateUserQuota(userId, estimatedCost);

      this.logger.log(`Design ${designId} generated successfully in ${duration}ms`);
      
      return { success: true, designId, previewUrl, aiProvider };
    } catch (error) {
      this.logger.error(`Failed to generate design ${designId}:`, error);
      
      // Update design status to failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.prisma.design.update({
        where: { id: designId },
        data: { 
          status: DesignStatus.FAILED,
          metadata: {
            error: errorMessage,
            failedAt: new Date().toISOString(),
          },
        },
      });

      throw error;
    }
  }

  @Process('generate-high-res')
  async handleGenerateHighRes(job: Job<GenerateHighResJob>) {
    const { designId, prompt, options: _options, userId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing high-res generation for design ${designId}`);
    
    try {
      // Get current design
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
      });

      if (!design) {
        throw new Error(`Design ${designId} not found`);
      }

      // High-res costs more
      const estimatedCost = 200; // Fixed cost for high-res upscale
      const hasQuota = await this.aiService.checkUserQuota(userId, estimatedCost);
      if (!hasQuota) {
        throw new Error('High-res quota exceeded');
      }

      await this.aiService.checkBudgetOrThrow(design.brandId, estimatedCost);

      let highResUrl: string | undefined;
      let aiProvider: string | undefined;

      // Option 1: If we have original preview, upscale it
      if (design.previewUrl && this.replicateApiKey) {
        try {
          const upscaled = await this.upscaleWithReplicate(design.previewUrl, '4');
          highResUrl = await this.uploadToStorage(upscaled.url, designId, 'high-res');
          aiProvider = 'replicate-esrgan';
        } catch (upscaleError) {
          this.logger.warn('Upscale failed, regenerating at higher res', upscaleError);
        }
      }

      // Option 2: Regenerate at higher resolution
      if (!highResUrl && this.openaiApiKey) {
        const result = await this.generateWithOpenAI(
          prompt || (design.metadata as Record<string, unknown>)?.prompt as string || 'jewelry design',
          '1792x1024', // Higher res
          'hd',
          'vivid',
        );
        highResUrl = await this.uploadToStorage(result.url, designId, 'high-res');
        aiProvider = 'openai-dalle3-hd';
      }

      if (!highResUrl || !aiProvider) {
        throw new Error('No AI provider available for high-res generation');
      }

      const duration = Date.now() - startTime;
      const updatedMetadata = {
        ...(design.metadata as Record<string, unknown> || {}),
        highResGenerated: true,
        highResGeneratedAt: new Date().toISOString(),
        highResCostCents: estimatedCost,
        highResProvider: aiProvider,
        highResDuration: duration,
      };

      // Update design with high-res results
      await this.prisma.design.update({
        where: { id: designId },
        data: {
          highResUrl,
          metadata: updatedMetadata,
        },
      });

      await this.aiService.recordAICost(
        design.brandId,
        aiProvider,
        'high-res-upscale',
        estimatedCost,
        { tokens: 0, duration },
      );

      await this.aiService.updateUserQuota(userId, estimatedCost);

      this.logger.log(`High-res design ${designId} generated successfully in ${duration}ms`);
      
      return { success: true, designId, highResUrl, aiProvider };
    } catch (error) {
      this.logger.error(`Failed to generate high-res design ${designId}:`, error);
      throw error;
    }
  }

  /**
   * Generate with Replicate SDXL
   */
  private async generateWithReplicate(
    prompt: string,
    size: string,
  ): Promise<{ url: string }> {
    const [w, h] = size.split('x').map(Number);

    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL
        input: {
          prompt: `Professional jewelry product photo: ${prompt}. High quality, studio lighting, clean background.`,
          width: w,
          height: h,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 50,
          guidance_scale: 7.5,
        },
      },
      {
        headers: {
          Authorization: `Token ${this.replicateApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    // Poll for result
    let prediction = response.data;
    const maxWait = 120000;
    const start = Date.now();

    while (
      (prediction.status === 'starting' || prediction.status === 'processing') &&
      Date.now() - start < maxWait
    ) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await axios.get(prediction.urls.get, {
        headers: { Authorization: `Token ${this.replicateApiKey}` },
      });
      prediction = statusRes.data;
    }

    if (prediction.status !== 'succeeded') {
      throw new Error(prediction.error || 'Replicate generation failed');
    }

    const imageUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;

    return { url: imageUrl };
  }

  /**
   * Generate with OpenAI DALL-E 3
   */
  private async generateWithOpenAI(
    prompt: string,
    size: '1024x1024' | '1792x1024' | '1024x1792',
    quality: 'standard' | 'hd',
    style: 'vivid' | 'natural',
  ): Promise<{ url: string; revisedPrompt?: string }> {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: `Professional jewelry product photography: ${prompt}. High quality, studio lighting, elegant presentation.`,
        n: 1,
        size,
        quality,
        style,
      },
      {
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    return {
      url: response.data.data[0].url,
      revisedPrompt: response.data.data[0].revised_prompt,
    };
  }

  /**
   * Upscale with Replicate Real-ESRGAN
   */
  private async upscaleWithReplicate(
    imageUrl: string,
    scale: '2' | '4',
  ): Promise<{ url: string }> {
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'db21a45d67f2db9e6c38d20d6d4d67f3f5b0e1c5', // Real-ESRGAN
        input: {
          image: imageUrl,
          scale: parseInt(scale),
          face_enhance: true,
        },
      },
      {
        headers: {
          Authorization: `Token ${this.replicateApiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    let prediction = response.data;
    const maxWait = 120000;
    const start = Date.now();

    while (
      (prediction.status === 'starting' || prediction.status === 'processing') &&
      Date.now() - start < maxWait
    ) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await axios.get(prediction.urls.get, {
        headers: { Authorization: `Token ${this.replicateApiKey}` },
      });
      prediction = statusRes.data;
    }

    if (prediction.status !== 'succeeded') {
      throw new Error(prediction.error || 'Replicate upscale failed');
    }

    return { url: prediction.output };
  }

  /**
   * Upload generated image to permanent storage
   */
  private async uploadToStorage(
    imageUrl: string,
    designId: string,
    type: 'preview' | 'high-res',
  ): Promise<string> {
    try {
      // Download image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // Upload to storage service (Cloudinary/S3)
      const result = await this.storageService.uploadBuffer(
        buffer,
        `designs/${designId}/${type}-${Date.now()}.png`,
        { contentType: 'image/png' },
      );

      // Handle different return types from storage service
      if (typeof result === 'string') {
        return result;
      }
      if (result && typeof result === 'object' && 'url' in result) {
        return (result as { url: string }).url;
      }
      return imageUrl; // Fallback to original
    } catch (error) {
      this.logger.warn(`Failed to upload to storage, using original URL`, error);
      // Fallback to original URL if storage upload fails
      return imageUrl;
    }
  }

  /**
   * Estimate tokens for cost calculation
   */
  private estimateTokens(prompt: string): number {
    // Rough estimation: ~4 chars per token
    return Math.ceil(prompt.length / 4);
  }
}
