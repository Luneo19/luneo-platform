// @ts-nocheck
/**
 * ★★★ SERVICE - AI STUDIO QUEUE ★★★
 * Service pour lancer les jobs de génération AI Studio
 * Respecte les patterns existants du projet
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { AIGenerationType } from '@prisma/client';
import { AIGenerationParams } from '../interfaces/ai-studio.interface';

@Injectable()
export class AIStudioQueueService {
  private readonly logger = new Logger(AIStudioQueueService.name);

  constructor(
    @InjectQueue('ai-generation') private readonly aiQueue: Queue,
  ) {}

  /**
   * Lance un job de génération AI Studio
   */
  async queueGeneration(
    generationId: string,
    type: AIGenerationType,
    prompt: string,
    negativePrompt: string | undefined,
    model: string,
    provider: string,
    parameters: AIGenerationParams,
    userId: string,
    brandId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Queueing AI generation ${generationId} of type ${type}`);

      await this.aiQueue.add('generate-ai-studio', {
        generationId,
        type,
        prompt,
        negativePrompt,
        model,
        provider,
        parameters,
        userId,
        brandId,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      this.logger.log(`AI generation ${generationId} queued successfully`);
    } catch (error) {
      this.logger.error(`Failed to queue AI generation ${generationId}:`, error);
      throw error;
    }
  }
}











