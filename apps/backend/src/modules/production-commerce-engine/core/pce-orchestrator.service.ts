import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineStatus } from '@prisma/client';
import {
  PIPELINE_STAGES,
  STAGE_ESTIMATED_HOURS,
  PCE_QUEUES,
} from '../pce.constants';
import { PipelineOrchestratorService } from './pipeline-orchestrator.service';
import { PCEConfigService } from './pce-config.service';
import { InjectPCEQueue, PCEQueue } from '../queues/pce-queue.provider';
import type {
  ProcessOrderParams,
  OrderProcessingResult,
  PipelineStageDefinition,
  DashboardStats,
} from '../interfaces/pce.interfaces';

@Injectable()
export class PCEOrchestratorService {
  private readonly logger = new Logger(PCEOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
    private readonly pceConfig: PCEConfigService,
    @InjectPCEQueue(PCE_QUEUES.PIPELINE) private readonly pipelineQueue: PCEQueue,
    @InjectPCEQueue(PCE_QUEUES.FULFILLMENT) private readonly fulfillmentQueue: PCEQueue,
  ) {}

  async processOrder(params: ProcessOrderParams): Promise<OrderProcessingResult> {
    const { orderId, brandId, options } = params;
    this.logger.log(`Processing order: ${orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const existing = await this.prisma.pipeline.findUnique({
      where: { orderId },
    });

    if (existing) {
      this.logger.log(`Pipeline already exists for order ${orderId}`);
      return {
        pipelineId: existing.id,
        orderId,
        status: existing.status,
        currentStage: existing.currentStage,
      };
    }

    const stages = this.determinePipelineStages(
      {
        items: order.items.map((item) => ({
          customization: (item as Record<string, unknown>).customization,
          designId: item.designId,
          product: item.product ? { fulfillmentType: (item.product as Record<string, unknown>).fulfillmentType as string | undefined } : null,
        })),
        totalCents: order.totalCents,
      },
      options,
    );

    const pipeline = await this.pipelineOrchestrator.createPipeline({
      orderId,
      brandId,
      stages,
      metadata: {
        options,
        orderTotalCents: order.totalCents,
        itemCount: order.items.length,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    await this.pipelineOrchestrator.startPipeline(pipeline.id);

    // Queue the first stage execution
    await this.pipelineQueue.add(
      'execute-stage',
      { pipelineId: pipeline.id, stage: stages[0].id },
      { priority: options?.priority ?? 5 },
    );

    return {
      pipelineId: pipeline.id,
      orderId,
      status: PipelineStatus.IN_PROGRESS,
      currentStage: stages[0].id,
      estimatedCompletion: this.estimateCompletion(stages),
    };
  }

  async handleStageCompleted(pipelineId: string, completedStage: string, nextStage: string) {
    this.logger.log(`Stage completed: ${completedStage} -> ${nextStage}`);

    switch (nextStage) {
      case PIPELINE_STAGES.RENDER:
        await this.queueRenderStage(pipelineId);
        break;
      case PIPELINE_STAGES.PRODUCTION:
        await this.queueProductionStage(pipelineId);
        break;
      case PIPELINE_STAGES.FULFILLMENT:
        await this.queueFulfillmentStage(pipelineId);
        break;
      case PIPELINE_STAGES.SHIPPING:
        await this.queueShippingStage(pipelineId);
        break;
      case PIPELINE_STAGES.DELIVERY:
        // Delivery is passive - awaits tracking webhook updates
        break;
      default:
        await this.pipelineQueue.add(
          'execute-stage',
          { pipelineId, stage: nextStage },
          { priority: 5 },
        );
    }
  }

  async handleStageFailed(
    pipelineId: string,
    stage: string,
    error: string,
    retryable: boolean,
  ) {
    this.logger.error(`Stage failed: ${stage} - ${error}`);

    if (retryable) {
      await this.pipelineQueue.add(
        'retry-stage',
        { pipelineId, stage },
        {
          delay: this.pceConfig.retryDelayMs,
          attempts: this.pceConfig.maxRetries,
        },
      );
    } else {
      await this.pipelineOrchestrator.failPipeline(pipelineId, error, stage);
    }
  }

  async getOrderStatus(orderId: string, brandId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { orderId, brandId },
      include: {
        transitions: { orderBy: { createdAt: 'desc' }, take: 10 },
        errors: { where: { resolvedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!pipeline) {
      return { status: 'NOT_STARTED', orderId };
    }

    return {
      pipelineId: pipeline.id,
      orderId,
      status: pipeline.status,
      currentStage: pipeline.currentStage,
      progress: pipeline.progress,
      stages: pipeline.stages,
      transitions: pipeline.transitions,
      errors: pipeline.errors,
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
    };
  }

  async getDashboardStats(brandId: string): Promise<DashboardStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalOrders, processingOrders, completedToday, failedToday] =
      await Promise.all([
        this.prisma.order.count({ where: { brandId } }),
        this.prisma.pipeline.count({
          where: {
            brandId,
            status: PipelineStatus.IN_PROGRESS,
          },
        }),
        this.prisma.pipeline.count({
          where: {
            brandId,
            status: PipelineStatus.COMPLETED,
            completedAt: { gte: todayStart },
          },
        }),
        this.prisma.pipelineError.count({
          where: {
            pipeline: { brandId },
            createdAt: { gte: todayStart },
            resolvedAt: null,
          },
        }),
      ]);

    return {
      totalOrders,
      processingOrders,
      completedToday,
      failedToday,
      avgProcessingTimeMs: 0,
    };
  }

  // ------------------------------------------------------------------
  // Stage determination
  // ------------------------------------------------------------------

  private determinePipelineStages(
    order: { items: Array<{ customization?: unknown; designId?: string | null; product?: { fulfillmentType?: string } | null }>; totalCents: number },
    options?: ProcessOrderParams['options'],
  ): PipelineStageDefinition[] {
    const stages: PipelineStageDefinition[] = [];

    stages.push({ id: PIPELINE_STAGES.VALIDATION, name: 'Validation', required: true });

    const hasCustomizations = order.items.some(
      (item) => item.customization || item.designId,
    );
    if (hasCustomizations && !options?.skipRender) {
      stages.push({ id: PIPELINE_STAGES.RENDER, name: 'Rendu', required: true });
    }

    const hasPODItems = order.items.some(
      (item) => item.product?.fulfillmentType === 'POD',
    );
    if (hasPODItems && !options?.skipProduction) {
      stages.push({ id: PIPELINE_STAGES.PRODUCTION, name: 'Production', required: true });
    }

    const qualityThreshold = this.pceConfig.qualityCheckThresholdCents;
    if (order.totalCents > qualityThreshold || options?.rushOrder) {
      stages.push({ id: PIPELINE_STAGES.QUALITY_CHECK, name: 'Contrôle qualité', required: false });
    }

    stages.push({ id: PIPELINE_STAGES.FULFILLMENT, name: 'Préparation', required: true });
    stages.push({ id: PIPELINE_STAGES.SHIPPING, name: 'Expédition', required: true });
    stages.push({ id: PIPELINE_STAGES.DELIVERY, name: 'Livraison', required: true });

    return stages;
  }

  private estimateCompletion(stages: PipelineStageDefinition[]): Date {
    const totalHours = stages.reduce(
      (sum, stage) => sum + (STAGE_ESTIMATED_HOURS[stage.id] ?? 1),
      0,
    );
    return new Date(Date.now() + totalHours * 3_600_000);
  }

  // ------------------------------------------------------------------
  // Queue helpers
  // ------------------------------------------------------------------

  private async queueRenderStage(pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: { order: { include: { items: true } } },
    });
    if (!pipeline) return;

    for (const item of pipeline.order.items) {
      if (item.designId) {
        await this.pipelineQueue.add(
          'render-item',
          {
            pipelineId,
            orderId: pipeline.orderId,
            orderItemId: item.id,
            designId: item.designId,
          },
          { priority: (pipeline.metadata as Record<string, unknown>)?.rushOrder ? 1 : 5 },
        );
      }
    }
  }

  private async queueProductionStage(pipelineId: string) {
    await this.pipelineQueue.add(
      'create-production',
      { pipelineId, action: 'CREATE' },
      { priority: 5 },
    );
  }

  private async queueFulfillmentStage(pipelineId: string) {
    await this.fulfillmentQueue.add(
      'create-fulfillment',
      { pipelineId, action: 'CREATE' },
      { priority: 5 },
    );
  }

  private async queueShippingStage(pipelineId: string) {
    await this.fulfillmentQueue.add(
      'ship-fulfillment',
      { pipelineId, action: 'SHIP' },
      { priority: 5 },
    );
  }
}
