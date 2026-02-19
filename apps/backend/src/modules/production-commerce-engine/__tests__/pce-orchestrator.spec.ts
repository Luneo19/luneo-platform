import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { PCEOrchestratorService } from '../core/pce-orchestrator.service';
import { PipelineOrchestratorService } from '../core/pipeline-orchestrator.service';
import { PCEConfigService } from '../core/pce-config.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PCE_QUEUES } from '../pce.constants';
import { PipelineStatus } from '@prisma/client';

describe('PCEOrchestratorService', () => {
  let service: PCEOrchestratorService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let pipelineOrchestrator: Record<string, jest.Mock>;
  let pipelineQueue: { add: jest.Mock };
  let fulfillmentQueue: { add: jest.Mock };

  const mockOrder = {
    id: 'order-1',
    brandId: 'brand-1',
    totalCents: 5000,
    items: [
      { id: 'item-1', designId: 'design-1', customization: null, product: { fulfillmentType: 'POD' } },
    ],
  };

  const mockPipeline = {
    id: 'pipeline-1',
    orderId: 'order-1',
    brandId: 'brand-1',
    currentStage: 'VALIDATION',
    progress: 0,
    status: PipelineStatus.IN_PROGRESS,
  };

  beforeEach(async () => {
    prisma = {
      order: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(0) },
      pipeline: { findUnique: jest.fn(), count: jest.fn().mockResolvedValue(0) },
      pipelineError: { count: jest.fn().mockResolvedValue(0) },
    };

    pipelineOrchestrator = {
      createPipeline: jest.fn().mockResolvedValue(mockPipeline),
      startPipeline: jest.fn(),
      advanceStage: jest.fn(),
      failPipeline: jest.fn(),
    };

    pipelineQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    fulfillmentQueue = { add: jest.fn().mockResolvedValue({ id: 'job-2' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PCEOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: PipelineOrchestratorService, useValue: pipelineOrchestrator },
        {
          provide: PCEConfigService,
          useValue: {
            isEnabled: true,
            autoProcessOnPayment: true,
            maxRetries: 3,
            retryDelayMs: 60_000,
            qualityCheckThresholdCents: 10_000,
          },
        },
        { provide: getQueueToken(PCE_QUEUES.PIPELINE), useValue: pipelineQueue },
        { provide: getQueueToken(PCE_QUEUES.FULFILLMENT), useValue: fulfillmentQueue },
      ],
    }).compile();

    service = module.get(PCEOrchestratorService);
  });

  describe('processOrder', () => {
    it('should create pipeline and start processing', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.pipeline.findUnique.mockResolvedValue(null);

      const result = await service.processOrder({ orderId: 'order-1', brandId: 'brand-1' });

      expect(result.pipelineId).toBe('pipeline-1');
      expect(result.status).toBe(PipelineStatus.IN_PROGRESS);
      expect(pipelineOrchestrator.createPipeline).toHaveBeenCalled();
      expect(pipelineOrchestrator.startPipeline).toHaveBeenCalledWith('pipeline-1');
    });

    it('should return existing pipeline if already processing', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.pipeline.findUnique.mockResolvedValue(mockPipeline);

      const result = await service.processOrder({ orderId: 'order-1', brandId: 'brand-1' });

      expect(result.pipelineId).toBe('pipeline-1');
      expect(pipelineOrchestrator.createPipeline).not.toHaveBeenCalled();
    });

    it('should throw if order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.processOrder({ orderId: 'x', brandId: 'brand-1' })).rejects.toThrow('Order not found');
    });

    it('should include RENDER stage when order has designs', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.pipeline.findUnique.mockResolvedValue(null);

      await service.processOrder({ orderId: 'order-1', brandId: 'brand-1' });

      const stages = pipelineOrchestrator.createPipeline.mock.calls[0][0].stages;
      expect(stages.some((s: { id: string }) => s.id === 'RENDER')).toBe(true);
    });

    it('should skip RENDER when skipRender option is set', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.pipeline.findUnique.mockResolvedValue(null);

      await service.processOrder({ orderId: 'order-1', brandId: 'brand-1', options: { skipRender: true } });

      const stages = pipelineOrchestrator.createPipeline.mock.calls[0][0].stages;
      expect(stages.some((s: { id: string }) => s.id === 'RENDER')).toBe(false);
    });
  });

  describe('handleStageFailed', () => {
    it('should queue retry for retryable failures', async () => {
      await service.handleStageFailed('pipeline-1', 'RENDER', 'Timeout', true);
      expect(pipelineQueue.add).toHaveBeenCalledWith('retry-stage', expect.any(Object), expect.objectContaining({ delay: 60_000 }));
    });

    it('should fail pipeline for non-retryable failures', async () => {
      await service.handleStageFailed('pipeline-1', 'RENDER', 'Fatal', false);
      expect(pipelineOrchestrator.failPipeline).toHaveBeenCalledWith('pipeline-1', 'Fatal', 'RENDER');
    });
  });

  describe('getDashboardStats', () => {
    it('should return aggregated stats', async () => {
      const result = await service.getDashboardStats('brand-1');
      expect(result).toEqual(expect.objectContaining({
        totalOrders: 0,
        processingOrders: 0,
        completedToday: 0,
        failedToday: 0,
      }));
    });
  });
});
