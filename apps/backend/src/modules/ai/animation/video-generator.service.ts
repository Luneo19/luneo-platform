// @ts-nocheck
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface VideoGenerationRequest {
  userId: string;
  brandId: string;
  sourceImages: string[];
  prompt?: string;
  motion: string; // "360-rotation", "zoom-in", "parallax", "turntable", "custom"
  duration: number; // seconds
  fps?: number;
  resolution?: string;
  provider?: string;
}

export interface VideoGenerationResult {
  id: string;
  status: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  provider: string;
  estimatedCredits: number;
}

@Injectable()
export class VideoGeneratorService {
  private readonly logger = new Logger(VideoGeneratorService.name);
  private readonly runwayApiKey: string;
  private readonly pikaApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.runwayApiKey = this.configService.get<string>('RUNWAY_API_KEY') || '';
    this.pikaApiKey = this.configService.get<string>('PIKA_LABS_API_TOKEN') || '';
  }

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    if (!request.sourceImages.length) throw new BadRequestException('At least one source image required');

    const provider = this.selectProvider(request.provider);
    const credits = this.estimateCredits(request.duration, request.resolution || '1080p');

    const record = await this.prisma.aIVideoGeneration.create({
      data: {
        userId: request.userId,
        brandId: request.brandId,
        sourceImages: request.sourceImages,
        prompt: request.prompt,
        motion: request.motion,
        duration: request.duration,
        fps: request.fps ?? 30,
        resolution: request.resolution ?? '1080p',
        provider,
        model: provider === 'runway' ? 'gen3a_turbo' : 'pika-1.0',
        status: VideoStatus.PENDING,
        credits,
      },
    });

    // Trigger async generation (in production, queue via BullMQ)
    this.triggerGeneration(record.id, provider, request).catch((error) => {
      this.logger.error(`Video generation failed for ${record.id}`, { error: error instanceof Error ? error.message : error });
      this.prisma.aIVideoGeneration
        .update({
          where: { id: record.id },
          data: { status: VideoStatus.FAILED, errorMessage: error instanceof Error ? error.message : 'Generation failed' },
        })
        .catch(() => {});
    });

    return {
      id: record.id,
      status: 'PENDING',
      provider,
      estimatedCredits: credits,
    };
  }

  async getStatus(videoId: string, userId: string) {
    const video = await this.prisma.aIVideoGeneration.findFirst({
      where: { id: videoId, userId },
    });
    if (!video) throw new BadRequestException('Video generation not found');
    return video;
  }

  async listVideos(userId: string, brandId?: string) {
    return this.prisma.aIVideoGeneration.findMany({
      where: { userId, ...(brandId ? { brandId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private selectProvider(preferred?: string): string {
    if (preferred === 'runway' && this.runwayApiKey) return 'runway';
    if (preferred === 'pika-labs' && this.pikaApiKey) return 'pika-labs';
    if (this.runwayApiKey) return 'runway';
    if (this.pikaApiKey) return 'pika-labs';
    return 'runway'; // Default even if not configured (will fail gracefully)
  }

  private estimateCredits(duration: number, resolution: string): number {
    const baseCost = duration <= 5 ? 15 : 25;
    const resMultiplier = resolution === '4k' ? 2 : 1;
    return baseCost * resMultiplier;
  }

  private async triggerGeneration(videoId: string, provider: string, request: VideoGenerationRequest): Promise<void> {
    await this.prisma.aIVideoGeneration.update({
      where: { id: videoId },
      data: { status: VideoStatus.PROCESSING },
    });

    if (provider === 'runway' && this.runwayApiKey) {
      await this.generateWithRunway(videoId, request);
    } else {
      this.logger.warn(`Provider ${provider} API key not configured, video generation will be pending`);
    }
  }

  private async generateWithRunway(videoId: string, request: VideoGenerationRequest): Promise<void> {
    try {
      const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.runwayApiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06',
        },
        body: JSON.stringify({
          model: 'gen3a_turbo',
          promptImage: request.sourceImages[0],
          promptText: request.prompt ?? this.getMotionPrompt(request.motion),
          duration: Math.min(request.duration, 10),
          ratio: '16:9',
        }),
      });

      if (!response.ok) throw new Error(`Runway API error: ${response.status}`);
      const data = (await response.json()) as { id?: string };

      await this.prisma.aIVideoGeneration.update({
        where: { id: videoId },
        data: { providerTaskId: data.id ?? null },
      });

      const taskId = data.id;
      if (taskId) {
        await this.pollRunwayTask(videoId, taskId);
      }
    } catch (error) {
      throw error;
    }
  }

  private async pollRunwayTask(videoId: string, taskId: string): Promise<void> {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 10000));

      const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${this.runwayApiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!response.ok) continue;
      const task = (await response.json()) as { status?: string; output?: string[]; failure?: string };

      if (task.status === 'SUCCEEDED' && task.output?.length) {
        await this.prisma.aIVideoGeneration.update({
          where: { id: videoId },
          data: { status: VideoStatus.COMPLETED, resultUrl: task.output[0], completedAt: new Date() },
        });
        return;
      }
      if (task.status === 'FAILED') {
        throw new Error(`Runway task failed: ${task.failure ?? 'Unknown error'}`);
      }
    }
    throw new Error('Video generation timed out');
  }

  private getMotionPrompt(motion: string): string {
    const prompts: Record<string, string> = {
      '360-rotation': 'Smooth 360 degree rotation, professional studio lighting, seamless loop',
      'zoom-in': 'Cinematic slow zoom-in, revealing details, studio lighting',
      parallax: 'Subtle parallax motion, depth effect, professional photography',
      turntable: 'Product turntable rotation, even lighting, white background',
      custom: 'Smooth professional motion',
    };
    return prompts[motion] ?? prompts.custom;
  }
}
