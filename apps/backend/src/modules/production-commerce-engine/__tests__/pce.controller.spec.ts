import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PCEController } from '@/modules/production-commerce-engine/pce.controller';
import { PCEQuotaGuard } from '@/modules/production-commerce-engine/guards/pce-quota.guard';
import { PCEOrchestratorService } from '@/modules/production-commerce-engine/core/pce-orchestrator.service';
import { PipelineOrchestratorService } from '@/modules/production-commerce-engine/core/pipeline-orchestrator.service';
import { PCEMetricsService } from '@/modules/production-commerce-engine/observability/pce-metrics.service';
import { QueueManagerService } from '@/modules/production-commerce-engine/queues/queue-manager.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineStatus } from '@prisma/client';

describe('PCEController', () => {
  let controller: PCEController;
  let pceOrchestrator: { getDashboardStats: jest.Mock; processOrder: jest.Mock; getOrderStatus: jest.Mock };
  let pipelineOrchestrator: {
    getPipelineStatus: jest.Mock;
    advanceStage: jest.Mock;
    retryStage: jest.Mock;
    cancelPipeline: jest.Mock;
  };
  let metrics: { getRecentAlerts: jest.Mock; getMetrics: jest.Mock };
  let queueManager: { getAllQueuesStatus: jest.Mock; getQueueCounts: jest.Mock; pauseQueue: jest.Mock; resumeQueue: jest.Mock; retryFailedJobs: jest.Mock };
  let prisma: { pipeline: { findMany: jest.Mock } };

  const brand = { id: 'brand-1' };
  const mockStats = {
    totalOrders: 100,
    processingOrders: 5,
    completedToday: 10,
    failedToday: 1,
    avgProcessingTimeMs: 3600000,
  };
  const mockQueueStatus = {
    'pce:pipeline': { name: 'pce:pipeline', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: false },
  };
  const mockPipelines = [
    {
      id: 'pipeline-1',
      orderId: 'order-1',
      brandId: brand.id,
      currentStage: 'FULFILLMENT',
      status: PipelineStatus.IN_PROGRESS,
      order: { orderNumber: 'ORD-001', totalCents: 5000, customerEmail: 'a@b.com' },
      updatedAt: new Date(),
    },
  ];
  const mockAlerts = [
    {
      id: 'alert-1',
      type: 'error' as const,
      message: 'Stage failed',
      pipelineId: 'pipeline-1',
      createdAt: new Date(),
    },
  ];
  const mockPipelineStatus = {
    id: 'pipeline-1',
    orderId: 'order-1',
    brandId: brand.id,
    status: PipelineStatus.IN_PROGRESS,
    currentStage: 'FULFILLMENT',
    progress: 50,
    stages: [],
    errors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockProcessResult = {
    pipelineId: 'pipeline-1',
    orderId: 'order-1',
    status: PipelineStatus.IN_PROGRESS,
    currentStage: 'VALIDATION',
    estimatedCompletion: new Date(),
  };

  beforeEach(async () => {
    pceOrchestrator = {
      getDashboardStats: jest.fn().mockResolvedValue(mockStats),
      processOrder: jest.fn().mockResolvedValue(mockProcessResult),
      getOrderStatus: jest.fn().mockResolvedValue({ status: 'IN_PROGRESS', orderId: 'order-1' }),
    };
    pipelineOrchestrator = {
      getPipelineStatus: jest.fn().mockResolvedValue(mockPipelineStatus),
      advanceStage: jest.fn().mockResolvedValue(mockPipelineStatus),
      retryStage: jest.fn().mockResolvedValue(undefined),
      cancelPipeline: jest.fn().mockResolvedValue({ ...mockPipelineStatus, status: PipelineStatus.CANCELLED }),
    };
    metrics = {
      getRecentAlerts: jest.fn().mockResolvedValue(mockAlerts),
      getMetrics: jest.fn().mockResolvedValue({ period: 'day', completed: 10, failed: 1, successRate: 90 }),
    };
    queueManager = {
      getAllQueuesStatus: jest.fn().mockResolvedValue(mockQueueStatus),
      getQueueCounts: jest.fn().mockResolvedValue(mockQueueStatus['pce:pipeline']),
      pauseQueue: jest.fn().mockResolvedValue(undefined),
      resumeQueue: jest.fn().mockResolvedValue(undefined),
      retryFailedJobs: jest.fn().mockResolvedValue(3),
    };
    prisma = {
      pipeline: { findMany: jest.fn().mockResolvedValue(mockPipelines) },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PCEController],
      providers: [
        PCEQuotaGuard,
        { provide: PCEOrchestratorService, useValue: pceOrchestrator },
        { provide: PipelineOrchestratorService, useValue: pipelineOrchestrator },
        { provide: PCEMetricsService, useValue: metrics },
        { provide: QueueManagerService, useValue: queueManager },
        { provide: PrismaService, useValue: prisma },
        Reflector,
      ],
    }).compile();

    controller = module.get(PCEController);
  });

  describe('getDashboard', () => {
    it('should return stats, queues, pipelines, alerts', async () => {
      const result = await controller.getDashboard(brand);

      expect(result).toEqual({
        stats: mockStats,
        queueStatus: mockQueueStatus,
        recentPipelines: mockPipelines,
        alerts: mockAlerts,
      });
      expect(pceOrchestrator.getDashboardStats).toHaveBeenCalledWith(brand.id);
      expect(queueManager.getAllQueuesStatus).toHaveBeenCalled();
      expect(metrics.getRecentAlerts).toHaveBeenCalledWith(brand.id);
      expect(prisma.pipeline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId: brand.id },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          skip: 0,
        }),
      );
    });
  });

  describe('processOrder', () => {
    it('should call orchestrator.processOrder with body and brand', async () => {
      const body = { orderId: 'order-1', options: { skipRender: true } };

      const result = await controller.processOrder(body, brand);

      expect(result).toEqual(mockProcessResult);
      expect(pceOrchestrator.processOrder).toHaveBeenCalledWith({
        orderId: body.orderId,
        brandId: brand.id,
        options: body.options,
      });
    });
  });

  describe('listPipelines', () => {
    it('should return pipeline list with optional status, limit, offset', async () => {
      const result = await controller.listPipelines(brand, 'IN_PROGRESS', 50, 0);

      expect(result).toEqual(mockPipelines);
      expect(prisma.pipeline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId: brand.id, currentStage: 'IN_PROGRESS' },
          take: 50,
          skip: 0,
        }),
      );
    });
  });

  describe('getPipeline', () => {
    it('should return pipeline details via pipelineOrchestrator.getPipelineStatus', async () => {
      const result = await controller.getPipeline('pipeline-1', brand);

      expect(result).toEqual(mockPipelineStatus);
      expect(pipelineOrchestrator.getPipelineStatus).toHaveBeenCalledWith('pipeline-1', brand.id);
    });
  });

  describe('advancePipeline', () => {
    it('should call pipelineOrchestrator.advanceStage with targetStage and manual', async () => {
      const body = { targetStage: 'FULFILLMENT' };

      const result = await controller.advancePipeline('pipeline-1', body);

      expect(result).toEqual(mockPipelineStatus);
      expect(pipelineOrchestrator.advanceStage).toHaveBeenCalledWith('pipeline-1', 'FULFILLMENT', 'manual');
    });
  });

  describe('retryPipeline', () => {
    it('should call pipelineOrchestrator.retryStage', async () => {
      await controller.retryPipeline('pipeline-1');

      expect(pipelineOrchestrator.retryStage).toHaveBeenCalledWith('pipeline-1');
    });
  });

  describe('cancelPipeline', () => {
    it('should call pipelineOrchestrator.cancelPipeline with reason', async () => {
      const body = { reason: 'Customer requested' };

      const result = await controller.cancelPipeline('pipeline-1', body);

      expect(result.status).toBe(PipelineStatus.CANCELLED);
      expect(pipelineOrchestrator.cancelPipeline).toHaveBeenCalledWith('pipeline-1', 'Customer requested');
    });
  });

  describe('getQueues', () => {
    it('should return queue status from queueManager', async () => {
      const result = await controller.getQueues();

      expect(result).toEqual(mockQueueStatus);
      expect(queueManager.getAllQueuesStatus).toHaveBeenCalled();
    });
  });

  describe('getQueue', () => {
    it('should return single queue counts', async () => {
      const result = await controller.getQueue('pce:pipeline');

      expect(result).toEqual(mockQueueStatus['pce:pipeline']);
      expect(queueManager.getQueueCounts).toHaveBeenCalledWith('pce:pipeline');
    });
  });

  describe('pauseQueue / resumeQueue', () => {
    it('should pause queue and return { paused: true }', async () => {
      const result = await controller.pauseQueue('pce:pipeline');

      expect(result).toEqual({ paused: true });
      expect(queueManager.pauseQueue).toHaveBeenCalledWith('pce:pipeline');
    });

    it('should resume queue and return { resumed: true }', async () => {
      const result = await controller.resumeQueue('pce:pipeline');

      expect(result).toEqual({ resumed: true });
      expect(queueManager.resumeQueue).toHaveBeenCalledWith('pce:pipeline');
    });
  });

  describe('retryFailedJobs', () => {
    it('should call queueManager.retryFailedJobs and return { retried }', async () => {
      const result = await controller.retryFailedJobs('pce:pipeline', 100);

      expect(result).toEqual({ retried: 3 });
      expect(queueManager.retryFailedJobs).toHaveBeenCalledWith('pce:pipeline', 100);
    });
  });
});
