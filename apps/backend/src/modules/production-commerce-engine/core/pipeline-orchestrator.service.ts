import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineStatus } from '@prisma/client';
import {
  PCE_EVENTS,
  TERMINAL_STAGES,
} from '../pce.constants';
import type {
  PipelineStageDefinition,
  PipelineDetailedStatus,
  PipelineStageStatus,
  StageTransitionEvent,
} from '../interfaces/pce.interfaces';

interface CreatePipelineParams {
  orderId: string;
  brandId: string;
  stages: PipelineStageDefinition[];
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PipelineOrchestratorService {
  private readonly logger = new Logger(PipelineOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPipeline(params: CreatePipelineParams) {
    const { orderId, brandId, stages, metadata } = params;
    this.logger.log(`Creating pipeline for order: ${orderId}`);

    const pipeline = await this.prisma.pipeline.create({
      data: {
        orderId,
        brandId,
        stages: JSON.parse(JSON.stringify(stages)),
        currentStage: stages[0].id,
        progress: 0,
        status: PipelineStatus.CREATED,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_CREATED, {
      pipelineId: pipeline.id,
      orderId,
      brandId,
    });

    return pipeline;
  }

  async startPipeline(pipelineId: string) {
    this.logger.log(`Starting pipeline: ${pipelineId}`);

    const pipeline = await this.findPipelineOrThrow(pipelineId);

    await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: {
        status: PipelineStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    await this.recordTransition(pipelineId, 'CREATED', pipeline.currentStage, 'system');

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_STARTED, {
      pipelineId,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
    });

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_STAGE_STARTED, {
      pipelineId,
      stage: pipeline.currentStage,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
    } satisfies StageTransitionEvent);
  }

  async advanceStage(pipelineId: string, targetStage?: string, triggeredBy = 'system') {
    this.logger.log(`Advancing pipeline: ${pipelineId}`);

    const pipeline = await this.findPipelineOrThrow(pipelineId);

    if (TERMINAL_STAGES.includes(pipeline.currentStage)) {
      throw new Error(`Pipeline ${pipelineId} is already in terminal state: ${pipeline.currentStage}`);
    }

    const stages = pipeline.stages as unknown as PipelineStageDefinition[];
    const currentIndex = stages.findIndex((s) => s.id === pipeline.currentStage);

    if (currentIndex === -1) {
      throw new Error(`Current stage not found in pipeline: ${pipeline.currentStage}`);
    }

    let nextStage: string;
    let nextIndex: number;

    if (targetStage) {
      nextIndex = stages.findIndex((s) => s.id === targetStage);
      if (nextIndex === -1) {
        throw new Error(`Target stage not found: ${targetStage}`);
      }
      nextStage = targetStage;
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= stages.length) {
        return this.completePipeline(pipelineId);
      }
      nextStage = stages[nextIndex].id;
    }

    const progress = Math.round(((nextIndex + 1) / stages.length) * 100);

    // Optimistic locking via version field
    const updated = await this.prisma.pipeline.updateMany({
      where: { id: pipelineId, version: pipeline.version },
      data: {
        currentStage: nextStage,
        progress,
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      throw new Error(`Concurrent modification on pipeline ${pipelineId}`);
    }

    await this.recordTransition(pipelineId, pipeline.currentStage, nextStage, triggeredBy);

    const event: StageTransitionEvent = {
      pipelineId,
      stage: pipeline.currentStage,
      nextStage,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
      triggeredBy,
    };

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_STAGE_COMPLETED, event);
    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_STAGE_STARTED, {
      ...event,
      stage: nextStage,
    });

    return this.prisma.pipeline.findUnique({ where: { id: pipelineId } });
  }

  async retryStage(pipelineId: string) {
    this.logger.log(`Retrying stage for pipeline: ${pipelineId}`);

    const pipeline = await this.findPipelineOrThrow(pipelineId);

    await this.prisma.pipelineError.updateMany({
      where: {
        pipelineId,
        stage: pipeline.currentStage,
        resolvedAt: null,
      },
      data: { retryCount: { increment: 1 } },
    });

    // Reset status if failed
    if (pipeline.status === PipelineStatus.FAILED) {
      await this.prisma.pipeline.update({
        where: { id: pipelineId },
        data: { status: PipelineStatus.IN_PROGRESS },
      });
    }

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_STAGE_STARTED, {
      pipelineId,
      stage: pipeline.currentStage,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
      retry: true,
    } satisfies StageTransitionEvent);
  }

  async rollbackStage(pipelineId: string, targetStage?: string) {
    this.logger.log(`Rolling back pipeline: ${pipelineId}`);

    const pipeline = await this.findPipelineOrThrow(pipelineId);
    const stages = pipeline.stages as unknown as PipelineStageDefinition[];
    const currentIndex = stages.findIndex((s) => s.id === pipeline.currentStage);

    let rollbackIndex: number;
    let rollbackStage: string;

    if (targetStage) {
      rollbackIndex = stages.findIndex((s) => s.id === targetStage);
      if (rollbackIndex === -1 || rollbackIndex >= currentIndex) {
        throw new Error(`Invalid rollback target: ${targetStage}`);
      }
      rollbackStage = targetStage;
    } else {
      rollbackIndex = currentIndex - 1;
      if (rollbackIndex < 0) {
        throw new Error('Cannot rollback from first stage');
      }
      rollbackStage = stages[rollbackIndex].id;
    }

    const progress = Math.round(((rollbackIndex + 1) / stages.length) * 100);

    const updated = await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: { currentStage: rollbackStage, progress },
    });

    await this.recordTransition(pipelineId, pipeline.currentStage, rollbackStage, 'rollback');

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_ROLLBACK, {
      pipelineId,
      stage: pipeline.currentStage,
      nextStage: rollbackStage,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
    });

    return updated;
  }

  async completePipeline(pipelineId: string) {
    this.logger.log(`Completing pipeline: ${pipelineId}`);

    const pipeline = await this.findPipelineOrThrow(pipelineId);

    const updated = await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: {
        currentStage: PipelineStatus.COMPLETED,
        progress: 100,
        status: PipelineStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.recordTransition(pipelineId, pipeline.currentStage, 'COMPLETED', 'system');

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_COMPLETED, {
      pipelineId,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
    });

    return updated;
  }

  async failPipeline(pipelineId: string, error: string, stage?: string) {
    this.logger.error(`Failing pipeline: ${pipelineId} - ${error}`);

    const pipeline = await this.findPipelineOrThrow(pipelineId);

    await this.prisma.pipelineError.create({
      data: {
        pipelineId,
        stage: stage ?? pipeline.currentStage,
        error,
        retryable: false,
      },
    });

    const updated = await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: {
        status: PipelineStatus.FAILED,
        failedAt: new Date(),
      },
    });

    await this.recordTransition(pipelineId, pipeline.currentStage, 'FAILED', 'system');

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_FAILED, {
      pipelineId,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
      error,
      stage: pipeline.currentStage,
    });

    return updated;
  }

  async cancelPipeline(pipelineId: string, reason?: string) {
    this.logger.log(`Cancelling pipeline: ${pipelineId}`);

    const pipeline = await this.findPipelineOrThrow(pipelineId);

    if (TERMINAL_STAGES.includes(pipeline.status)) {
      throw new Error(`Cannot cancel pipeline in state: ${pipeline.status}`);
    }

    const updated = await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: {
        status: PipelineStatus.CANCELLED,
        cancelledAt: new Date(),
        metadata: {
          ...(pipeline.metadata as Record<string, unknown> | null) ?? {},
          cancellationReason: reason,
        },
      },
    });

    await this.recordTransition(pipelineId, pipeline.currentStage, 'CANCELLED', 'manual');

    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_CANCELLED, {
      pipelineId,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
    });

    return updated;
  }

  async getPipelineStatus(pipelineId: string, brandId: string): Promise<PipelineDetailedStatus> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, brandId },
      include: {
        transitions: { orderBy: { createdAt: 'desc' }, take: 20 },
        errors: { where: { resolvedAt: null }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    const stages = pipeline.stages as unknown as PipelineStageDefinition[];
    const currentIndex = stages.findIndex((s) => s.id === pipeline.currentStage);

    const stageStatus: PipelineStageStatus[] = stages.map((stage, index) => {
      let status: PipelineStageStatus['status'] = 'pending';
      if (index < currentIndex) {
        status = 'completed';
      } else if (index === currentIndex) {
        status = pipeline.status === PipelineStatus.FAILED ? 'failed' : 'current';
      }

      const transition = pipeline.transitions.find((t) => t.toStage === stage.id);

      return {
        ...stage,
        status,
        startedAt: transition?.createdAt,
        duration: transition?.duration,
      };
    });

    return {
      id: pipeline.id,
      orderId: pipeline.orderId,
      brandId: pipeline.brandId,
      status: pipeline.status,
      currentStage: pipeline.currentStage,
      progress: pipeline.progress,
      stages: stageStatus,
      errors: pipeline.errors.map((e) => ({
        id: e.id,
        stage: e.stage,
        error: e.error,
        details: e.details as Record<string, unknown> | undefined,
        retryable: e.retryable,
        retryCount: e.retryCount,
        resolvedAt: e.resolvedAt ?? undefined,
        createdAt: e.createdAt,
      })),
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
      estimatedCompletion: pipeline.estimatedCompletion ?? undefined,
    };
  }

  private async findPipelineOrThrow(pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
    });
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }
    return pipeline;
  }

  private async recordTransition(
    pipelineId: string,
    fromStage: string,
    toStage: string,
    triggeredBy: string,
  ) {
    const lastTransition = await this.prisma.pipelineTransition.findFirst({
      where: { pipelineId },
      orderBy: { createdAt: 'desc' },
    });

    const duration = lastTransition
      ? Date.now() - lastTransition.createdAt.getTime()
      : 0;

    await this.prisma.pipelineTransition.create({
      data: { pipelineId, fromStage, toStage, duration, triggeredBy },
    });
  }
}
