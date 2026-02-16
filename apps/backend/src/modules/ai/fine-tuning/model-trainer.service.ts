import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class ModelTrainerService {
  private readonly logger = new Logger(ModelTrainerService.name);
  private readonly replicateApiToken: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.replicateApiToken = this.configService.get<string>('REPLICATE_API_TOKEN') || '';
  }

  async startTraining(params: {
    organizationId: string;
    brandId: string;
    name: string;
    displayName?: string;
    description?: string;
    baseModel?: string;
    technique?: string;
    trainingImages: string[];
    triggerWord?: string;
    trainingSteps?: number;
    learningRate?: number;
  }) {
    if (params.trainingImages.length < 5) {
      throw new BadRequestException('Minimum 5 training images required');
    }
    if (params.trainingImages.length > 50) {
      throw new BadRequestException('Maximum 50 training images allowed');
    }

    const model = await this.prisma.aIFineTunedModel.create({
      data: {
        organizationId: params.organizationId,
        brandId: params.brandId,
        name: params.name,
        displayName: params.displayName || params.name,
        description: params.description,
        baseModel: params.baseModel || 'sdxl-1.0',
        technique: params.technique || 'lora',
        trainingImages: params.trainingImages.length,
        triggerWord: params.triggerWord,
        trainingSteps: params.trainingSteps || 1000,
        learningRate: params.learningRate ?? 0.0001,
        status: 'PREPARING_DATASET',
        costCents: this.estimateTrainingCost(params.trainingImages.length, params.trainingSteps || 1000),
      },
    });

    // In production, this would trigger a Replicate training job
    // For now, we create the record and mark it for processing
    this.logger.log(`Fine-tuning job created: ${model.id} for org ${params.organizationId}`);

    // Simulate starting training (in production, call Replicate API)
    if (this.replicateApiToken && !this.replicateApiToken.includes('placeholder')) {
      try {
        await this.initiateReplicateTraining(model.id, params);
      } catch (error) {
        this.logger.error('Failed to initiate Replicate training', {
          error: error instanceof Error ? error.message : error,
        });
        await this.prisma.aIFineTunedModel.update({
          where: { id: model.id },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Training initiation failed',
          },
        });
      }
    } else {
      this.logger.warn('Replicate API token not configured, training will be simulated');
    }

    return model;
  }

  async getModel(modelId: string, organizationId: string) {
    const model = await this.prisma.aIFineTunedModel.findFirst({
      where: { id: modelId, organizationId },
    });
    if (!model) throw new BadRequestException('Fine-tuned model not found');
    return model;
  }

  async listModels(organizationId: string, brandId?: string) {
    return this.prisma.aIFineTunedModel.findMany({
      where: {
        organizationId,
        ...(brandId ? { brandId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteModel(modelId: string, organizationId: string) {
    const model = await this.getModel(modelId, organizationId);
    if (model.status === 'TRAINING') {
      throw new BadRequestException('Cannot delete a model that is currently training');
    }
    return this.prisma.aIFineTunedModel.update({
      where: { id: modelId },
      data: { status: 'ARCHIVED' },
    });
  }

  async getTrainingProgress(
    modelId: string,
  ): Promise<{ status: string; progress: number; estimatedTimeRemaining?: number }> {
    const model = await this.prisma.aIFineTunedModel.findUnique({ where: { id: modelId } });
    if (!model) throw new BadRequestException('Model not found');
    return {
      status: model.status,
      progress: model.progress,
      estimatedTimeRemaining:
        model.status === 'TRAINING' ? Math.max(0, (100 - model.progress) * 30) : undefined,
    };
  }

  private async initiateReplicateTraining(modelId: string, params: any): Promise<void> {
    // TODO: Implement actual Replicate API call for training
    // This would create a training run on Replicate
    this.logger.log(`Would initiate Replicate ${params.technique} training for model ${modelId}`);

    await this.prisma.aIFineTunedModel.update({
      where: { id: modelId },
      data: { status: 'VALIDATING', progress: 5 },
    });
  }

  private estimateTrainingCost(imageCount: number, steps: number): number {
    // Approximate cost: $0.50 base + $0.01 per image + $0.001 per step
    const baseCost = 50; // cents
    const imageCost = imageCount * 1; // cents per image
    const stepCost = Math.ceil(steps * 0.1); // cents per 100 steps
    return baseCost + imageCost + stepCost;
  }
}
