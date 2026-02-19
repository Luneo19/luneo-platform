import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PipelineOrchestratorService } from '../core/pipeline-orchestrator.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineStatus } from '@prisma/client';
import { PCE_EVENTS } from '../pce.constants';

describe('PipelineOrchestratorService', () => {
  let service: PipelineOrchestratorService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let eventEmitter: { emit: jest.Mock };

  const mockPipeline = {
    id: 'pipeline-1',
    orderId: 'order-1',
    brandId: 'brand-1',
    stages: [
      { id: 'VALIDATION', name: 'Validation', required: true },
      { id: 'RENDER', name: 'Render', required: true },
      { id: 'PRODUCTION', name: 'Production', required: true },
      { id: 'FULFILLMENT', name: 'Fulfillment', required: true },
    ],
    currentStage: 'VALIDATION',
    progress: 0,
    status: PipelineStatus.IN_PROGRESS,
    version: 0,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
    failedAt: null,
    cancelledAt: null,
    estimatedCompletion: null,
  };

  beforeEach(async () => {
    prisma = {
      pipeline: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      pipelineTransition: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      pipelineError: {
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(PipelineOrchestratorService);
  });

  describe('createPipeline', () => {
    it('should create a new pipeline and emit event', async () => {
      prisma.pipeline.create.mockResolvedValue(mockPipeline);

      const result = await service.createPipeline({
        orderId: 'order-1',
        brandId: 'brand-1',
        stages: mockPipeline.stages as any,
      });

      expect(result).toEqual(mockPipeline);
      expect(prisma.pipeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          brandId: 'brand-1',
          currentStage: 'VALIDATION',
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PCE_EVENTS.PIPELINE_CREATED,
        expect.objectContaining({ pipelineId: 'pipeline-1' }),
      );
    });
  });

  describe('advanceStage', () => {
    it('should advance to next stage with optimistic locking', async () => {
      prisma.pipeline.findUnique
        .mockResolvedValueOnce(mockPipeline)
        .mockResolvedValueOnce({ ...mockPipeline, currentStage: 'RENDER', progress: 50 });
      prisma.pipeline.updateMany.mockResolvedValue({ count: 1 });
      prisma.pipelineTransition.findFirst.mockResolvedValue(null);

      await service.advanceStage('pipeline-1');

      expect(prisma.pipeline.updateMany).toHaveBeenCalledWith({
        where: { id: 'pipeline-1', version: 0 },
        data: expect.objectContaining({ currentStage: 'RENDER' }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PCE_EVENTS.PIPELINE_STAGE_COMPLETED,
        expect.objectContaining({ stage: 'VALIDATION', nextStage: 'RENDER' }),
      );
    });

    it('should complete pipeline when reaching last stage', async () => {
      const lastStagePipeline = { ...mockPipeline, currentStage: 'FULFILLMENT', progress: 75 };
      prisma.pipeline.findUnique.mockResolvedValue(lastStagePipeline);
      prisma.pipeline.update.mockResolvedValue({
        ...lastStagePipeline, currentStage: 'COMPLETED', progress: 100, status: PipelineStatus.COMPLETED,
      });
      prisma.pipelineTransition.findFirst.mockResolvedValue(null);

      const result = await service.advanceStage('pipeline-1');

      expect(result?.currentStage).toBe('COMPLETED');
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.PIPELINE_COMPLETED, expect.any(Object));
    });

    it('should throw on non-existent pipeline', async () => {
      prisma.pipeline.findUnique.mockResolvedValue(null);
      await expect(service.advanceStage('x')).rejects.toThrow('Pipeline not found');
    });

    it('should throw on concurrent modification', async () => {
      prisma.pipeline.findUnique.mockResolvedValue(mockPipeline);
      prisma.pipeline.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.advanceStage('pipeline-1')).rejects.toThrow('Concurrent modification');
    });
  });

  describe('retryStage', () => {
    it('should reset status and retry', async () => {
      const failed = { ...mockPipeline, status: PipelineStatus.FAILED };
      prisma.pipeline.findUnique.mockResolvedValue(failed);
      prisma.pipeline.update.mockResolvedValue({ ...failed, status: PipelineStatus.IN_PROGRESS });

      await service.retryStage('pipeline-1');

      expect(prisma.pipelineError.updateMany).toHaveBeenCalled();
      expect(prisma.pipeline.update).toHaveBeenCalledWith({
        where: { id: 'pipeline-1' },
        data: { status: PipelineStatus.IN_PROGRESS },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PCE_EVENTS.PIPELINE_STAGE_STARTED,
        expect.objectContaining({ retry: true }),
      );
    });
  });

  describe('failPipeline', () => {
    it('should fail pipeline and record error', async () => {
      prisma.pipeline.findUnique.mockResolvedValue(mockPipeline);
      prisma.pipeline.update.mockResolvedValue({ ...mockPipeline, status: PipelineStatus.FAILED });
      prisma.pipelineTransition.findFirst.mockResolvedValue(null);

      const result = await service.failPipeline('pipeline-1', 'Test error');

      expect(result.status).toBe(PipelineStatus.FAILED);
      expect(prisma.pipelineError.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ error: 'Test error', retryable: false }),
      });
    });
  });

  describe('cancelPipeline', () => {
    it('should cancel with reason', async () => {
      prisma.pipeline.findUnique.mockResolvedValue(mockPipeline);
      prisma.pipeline.update.mockResolvedValue({ ...mockPipeline, status: PipelineStatus.CANCELLED });
      prisma.pipelineTransition.findFirst.mockResolvedValue(null);

      const result = await service.cancelPipeline('pipeline-1', 'User requested');

      expect(result.status).toBe(PipelineStatus.CANCELLED);
      expect(eventEmitter.emit).toHaveBeenCalledWith(PCE_EVENTS.PIPELINE_CANCELLED, expect.any(Object));
    });

    it('should throw if already terminal', async () => {
      prisma.pipeline.findUnique.mockResolvedValue({ ...mockPipeline, status: PipelineStatus.COMPLETED });
      await expect(service.cancelPipeline('pipeline-1')).rejects.toThrow('Cannot cancel');
    });
  });

  describe('getPipelineStatus', () => {
    it('should return detailed status with stages', async () => {
      prisma.pipeline.findFirst.mockResolvedValue({
        ...mockPipeline,
        transitions: [{ id: 't1', toStage: 'VALIDATION', createdAt: new Date(), duration: 1000 }],
        errors: [],
      });

      const result = await service.getPipelineStatus('pipeline-1', 'brand-1');

      expect(result.id).toBe('pipeline-1');
      expect(result.stages).toHaveLength(4);
      expect(result.stages[0].status).toBe('current');
      expect(result.stages[1].status).toBe('pending');
    });
  });
});
