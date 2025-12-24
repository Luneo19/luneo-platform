import { PrismaService } from '@/libs/prisma/prisma.service';
import { AiService } from '@/modules/ai/ai.service';
import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { DesignStatus } from '@prisma/client';
import { Job } from 'bullmq';

export interface GenerateDesignJob {
  designId: string;
  prompt: string;
  options: any;
  userId: string;
  brandId: string;
}

export interface GenerateHighResJob {
  designId: string;
  prompt: string;
  options: any;
  userId: string;
}

@Injectable()
@Processor('ai-generation')
export class AiGenerationWorker {
  private readonly logger = new Logger(AiGenerationWorker.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  @Process('generate-design')
  async handleGenerateDesign(job: Job<GenerateDesignJob>) {
    const { designId, prompt, options, userId, brandId } = job.data;
    
    this.logger.log(`Processing design generation for design ${designId}`);
    
    try {
      // Update design status to processing
      await this.prisma.design.update({
        where: { id: designId },
        data: { status: DesignStatus.PROCESSING },
      });

      // Check user quota (simplified for now)
      const hasQuota = await this.aiService.checkUserQuota(userId, 1);
      if (!hasQuota) {
        throw new Error('Quota exceeded');
      }

      // Simulate AI generation (replace with actual AI provider call)
      await this.simulateAiGeneration(2000); // 2 seconds

      // Generate mock image URLs
      const previewUrl = `https://cdn.example.com/designs/${designId}/preview.png`;
      const modelUrl = `https://cdn.example.com/designs/${designId}/model.glb`;
      const metadata = {
        prompt,
        options,
        generatedAt: new Date().toISOString(),
        aiProvider: 'mock',
        costCents: 50, // Mock cost
      };

      // Update design with results
      await this.prisma.design.update({
        where: { id: designId },
        data: {
          status: DesignStatus.COMPLETED,
          previewUrl,
          metadata,
        },
      });

      // Record AI cost
      await this.aiService.recordAICost(brandId, 'mock', 'mock-model', 50, { tokens: 100, duration: 2000 });

      this.logger.log(`Design ${designId} generated successfully`);
      
      return { success: true, designId, previewUrl, modelUrl };
    } catch (error) {
      this.logger.error(`Failed to generate design ${designId}:`, error);
      
      // Update design status to failed
      await this.prisma.design.update({
        where: { id: designId },
        data: { 
          status: DesignStatus.FAILED,
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString(),
          },
        },
      });

      throw error;
    }
  }

  @Process('generate-high-res')
  async handleGenerateHighRes(job: Job<GenerateHighResJob>) {
    const { designId, prompt, options, userId } = job.data;
    
    this.logger.log(`Processing high-res generation for design ${designId}`);
    
    try {
      // Get current design
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
      });

      if (!design) {
        throw new Error(`Design ${designId} not found`);
      }

      // Check user quota for high-res (simplified for now)
      const hasQuota = await this.aiService.checkUserQuota(userId, 1);
      if (!hasQuota) {
        throw new Error('High-res quota exceeded');
      }

      // Simulate high-res generation
      await this.simulateAiGeneration(5000); // 5 seconds for high-res

      // Generate high-res URLs
      const highResUrl = `https://cdn.example.com/designs/${designId}/high-res.png`;
      const highResModelUrl = `https://cdn.example.com/designs/${designId}/high-res-model.glb`;
      
      const updatedMetadata = {
        ...(design.metadata as any || {}),
        highResGenerated: true,
        highResGeneratedAt: new Date().toISOString(),
        highResCostCents: 200, // Higher cost for high-res
      };

      // Update design with high-res results
      await this.prisma.design.update({
        where: { id: designId },
        data: {
          highResUrl,
          metadata: updatedMetadata,
        },
      });

      // Record high-res AI cost
      await this.aiService.recordAICost(design.brandId, 'mock', 'mock-model-highres', 200, { tokens: 200, duration: 5000 });

      this.logger.log(`High-res design ${designId} generated successfully`);
      
      return { success: true, designId, highResUrl, highResModelUrl };
    } catch (error) {
      this.logger.error(`Failed to generate high-res design ${designId}:`, error);
      throw error;
    }
  }

  private async simulateAiGeneration(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
