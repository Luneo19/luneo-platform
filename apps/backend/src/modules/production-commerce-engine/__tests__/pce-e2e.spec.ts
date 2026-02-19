/**
 * E2E-style tests for the PCE full pipeline flow.
 * Uses real orchestration logic with mocked Prisma, queues, and external services.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getQueueToken } from '@nestjs/bullmq';
import { PCEOrchestratorService } from '@/modules/production-commerce-engine/core/pce-orchestrator.service';
import { PipelineOrchestratorService } from '@/modules/production-commerce-engine/core/pipeline-orchestrator.service';
import { PCEConfigService } from '@/modules/production-commerce-engine/core/pce-config.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PCE_QUEUES } from '@/modules/production-commerce-engine/pce.constants';
import { PipelineStatus } from '@prisma/client';
import { PIPELINE_STAGES } from '@/modules/production-commerce-engine/pce.constants';

describe('PCE Pipeline E2E', () => {
  let pceOrchestrator: PCEOrchestratorService;
  let pipelineOrchestrator: PipelineOrchestratorService;
  let pipelineStore: Map<string, Record<string, unknown>>;
  let pipelineTransitionStore: Record<string, unknown[]>;
  let pipelineErrorStore: Record<string, unknown[]>;
  let orderStore: Map<string, Record<string, unknown>>;
  let pipelineQueueAdd: jest.Mock;
  let fulfillmentQueueAdd: jest.Mock;
  let eventEmitter: { emit: jest.Mock };

  const brandId = 'brand-e2e';
  const orderId = 'order-e2e';

  function createMockPrisma() {
    pipelineStore = new Map();
    pipelineTransitionStore = {};
    pipelineErrorStore = {};
    orderStore = new Map();
    orderStore.set(orderId, {
      id: orderId,
      brandId,
      status: 'PAID',
      totalCents: 5000,
      items: [
        {
          id: 'item-1',
          designId: null,
          customization: null,
          product: { fulfillmentType: 'POD' },
        },
      ],
    });

    return {
      order: {
        findUnique: jest.fn().mockImplementation((args: { where: { id: string } }) => {
          const o = orderStore.get(args.where.id) as Record<string, unknown> | undefined;
          if (!o) return Promise.resolve(null);
          const items = Array.isArray(o.items)
            ? (o.items as unknown[]).map((i: unknown) => Object.assign({}, i as Record<string, unknown>, { product: (i as { product?: unknown }).product ?? null }))
            : [];
          return Promise.resolve({ ...o, items });
        }),
        update: jest.fn().mockImplementation((args: { where: { id: string }; data: Record<string, unknown> }) => {
          const existing = orderStore.get(args.where.id);
          if (!existing) return Promise.resolve(null);
          const updated = { ...existing, ...args.data };
          orderStore.set(args.where.id, updated);
          return Promise.resolve(updated);
        }),
        count: jest.fn().mockResolvedValue(0),
      },
      pipeline: {
        create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
          const id = `pipeline-${Date.now()}`;
          const pipeline = {
            id,
            orderId: args.data.orderId,
            brandId: args.data.brandId,
            stages: args.data.stages,
            currentStage: args.data.currentStage,
            progress: args.data.progress ?? 0,
            status: args.data.status ?? PipelineStatus.CREATED,
            version: 0,
            metadata: args.data.metadata ?? {},
            createdAt: new Date(),
            updatedAt: new Date(),
            startedAt: null,
            completedAt: null,
            failedAt: null,
            cancelledAt: null,
            estimatedCompletion: null,
          };
          pipelineStore.set(id, pipeline);
          return Promise.resolve(pipeline);
        }),
        findUnique: jest.fn().mockImplementation((args: { where: { id?: string; orderId?: string }; include?: unknown }) => {
          let pipeline: Record<string, unknown> | undefined;
          if (args.where.id) {
            pipeline = pipelineStore.get(args.where.id) as Record<string, unknown> | undefined;
          } else if (args.where.orderId) {
            pipeline = Array.from(pipelineStore.values()).find((p) => (p as Record<string, unknown>).orderId === args.where.orderId) as Record<string, unknown> | undefined;
          }
          if (!pipeline) return Promise.resolve(null);
          const copy = { ...pipeline };
          if (args.include && typeof args.include === 'object') {
            const inc = args.include as Record<string, unknown>;
            if (inc.transitions) copy.transitions = pipelineTransitionStore[copy.id as string] ?? [];
            if (inc.errors) copy.errors = pipelineErrorStore[copy.id as string] ?? [];
          }
          return Promise.resolve(copy);
        }),
        findFirst: jest.fn().mockImplementation((args: { where: { id?: string; orderId?: string; brandId?: string }; include?: unknown }) => {
          let pipeline: Record<string, unknown> | undefined;
          if (args.where.id) {
            pipeline = pipelineStore.get(args.where.id) as Record<string, unknown> | undefined;
          } else if (args.where.orderId) {
            pipeline = Array.from(pipelineStore.values()).find((p) => (p as Record<string, unknown>).orderId === args.where.orderId) as Record<string, unknown> | undefined;
          }
          if (pipeline && args.where.brandId && (pipeline as Record<string, unknown>).brandId !== args.where.brandId) {
            return Promise.resolve(null);
          }
          if (!pipeline) return Promise.resolve(null);
          const copy = { ...pipeline };
          if (args.include && typeof args.include === 'object') {
            const inc = args.include as Record<string, unknown>;
            if (inc.transitions) copy.transitions = pipelineTransitionStore[copy.id as string] ?? [];
            if (inc.errors) copy.errors = pipelineErrorStore[copy.id as string] ?? [];
          }
          return Promise.resolve(copy);
        }),
        findMany: jest.fn().mockImplementation(() => Promise.resolve(Array.from(pipelineStore.values()))),
        update: jest.fn().mockImplementation((args: { where: { id: string }; data: Record<string, unknown> }) => {
          const existing = pipelineStore.get(args.where.id) as Record<string, unknown> | undefined;
          if (!existing) return Promise.resolve(null);
          const updated = { ...existing, ...args.data };
          if (args.data.version && typeof (args.data.version as { increment: number }).increment === 'number') {
            (updated as Record<string, unknown>).version = ((existing.version as number) ?? 0) + 1;
          }
          pipelineStore.set(args.where.id, updated);
          return Promise.resolve(updated);
        }),
        updateMany: jest.fn().mockImplementation((args: { where: { id: string; version?: number }; data: Record<string, unknown> }) => {
          const existing = pipelineStore.get(args.where.id) as Record<string, unknown> | undefined;
          if (!existing || (args.where.version !== undefined && existing.version !== args.where.version)) {
            return Promise.resolve({ count: 0 });
          }
          const updated = { ...existing, ...args.data };
          if (args.data.version && typeof (args.data.version as { increment: number }).increment === 'number') {
            (updated as Record<string, unknown>).version = ((existing.version as number) ?? 0) + 1;
          }
          pipelineStore.set(args.where.id, updated);
          return Promise.resolve({ count: 1 });
        }),
        count: jest.fn().mockImplementation((args: { where: Record<string, unknown> }) => {
          const list = Array.from(pipelineStore.values()) as Record<string, unknown>[];
          const filtered = list.filter((p) => {
            if (args.where.brandId && p.brandId !== args.where.brandId) return false;
            if (args.where.status && p.status !== args.where.status) return false;
            return true;
          });
          return Promise.resolve(filtered.length);
        }),
      },
      pipelineTransition: {
        create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
          const id = (args.data.pipelineId as string) ?? 'unknown';
          if (!pipelineTransitionStore[id]) pipelineTransitionStore[id] = [];
          const rec = {
            id: `pt-${Date.now()}`,
            ...args.data,
            createdAt: new Date(),
          };
          pipelineTransitionStore[id].push(rec);
          return Promise.resolve(rec);
        }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      pipelineError: {
        create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
          const id = (args.data.pipelineId as string) ?? 'unknown';
          if (!pipelineErrorStore[id]) pipelineErrorStore[id] = [];
          const rec = { id: `pe-${Date.now()}`, ...args.data, createdAt: new Date(), resolvedAt: null };
          pipelineErrorStore[id].push(rec);
          return Promise.resolve(rec);
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
    };
  }

  beforeEach(async () => {
    const prisma = createMockPrisma();
    eventEmitter = { emit: jest.fn() };
    pipelineQueueAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
    fulfillmentQueueAdd = jest.fn().mockResolvedValue({ id: 'job-2' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PCEOrchestratorService,
        PipelineOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
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
        { provide: getQueueToken(PCE_QUEUES.PIPELINE), useValue: { add: pipelineQueueAdd } },
        { provide: getQueueToken(PCE_QUEUES.FULFILLMENT), useValue: { add: fulfillmentQueueAdd } },
      ],
    }).compile();

    pceOrchestrator = module.get(PCEOrchestratorService);
    pipelineOrchestrator = module.get(PipelineOrchestratorService);
  });

  describe('Full pipeline flow', () => {
    it('should process an order and create pipeline through VALIDATION -> FULFILLMENT -> SHIPPING -> DELIVERY -> COMPLETED', async () => {
      const result = await pceOrchestrator.processOrder({ orderId, brandId });

      expect(result.pipelineId).toBeDefined();
      expect(result.orderId).toBe(orderId);
      expect(result.status).toBe(PipelineStatus.IN_PROGRESS);
      expect(result.currentStage).toBe(PIPELINE_STAGES.VALIDATION);

      const pipelineId = result.pipelineId as string;
      let status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.currentStage).toBe(PIPELINE_STAGES.VALIDATION);

      await pipelineOrchestrator.advanceStage(pipelineId, PIPELINE_STAGES.PRODUCTION, 'test');
      status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.currentStage).toBe(PIPELINE_STAGES.PRODUCTION);

      await pipelineOrchestrator.advanceStage(pipelineId, PIPELINE_STAGES.FULFILLMENT, 'test');
      status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.currentStage).toBe(PIPELINE_STAGES.FULFILLMENT);

      await pipelineOrchestrator.advanceStage(pipelineId, PIPELINE_STAGES.SHIPPING, 'test');
      status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.currentStage).toBe(PIPELINE_STAGES.SHIPPING);

      await pipelineOrchestrator.advanceStage(pipelineId, PIPELINE_STAGES.DELIVERY, 'test');
      status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.currentStage).toBe(PIPELINE_STAGES.DELIVERY);

      // Advancing past last stage triggers completePipeline
      await pipelineOrchestrator.advanceStage(pipelineId, undefined, 'test');
      status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.status).toBe(PipelineStatus.COMPLETED);
      expect(status.currentStage).toBe(PipelineStatus.COMPLETED);
      expect(status.progress).toBe(100);
    });

    it('should reflect stage transitions in getOrderStatus', async () => {
      const result = await pceOrchestrator.processOrder({ orderId, brandId });
      const pipelineId = result.pipelineId as string;

      let orderStatus = await pceOrchestrator.getOrderStatus(orderId, brandId);
      expect(orderStatus.status).toBe(PipelineStatus.IN_PROGRESS);
      expect(orderStatus.currentStage).toBe(PIPELINE_STAGES.VALIDATION);

      await pipelineOrchestrator.advanceStage(pipelineId, PIPELINE_STAGES.FULFILLMENT, 'test');
      orderStatus = await pceOrchestrator.getOrderStatus(orderId, brandId);
      expect(orderStatus.currentStage).toBe(PIPELINE_STAGES.FULFILLMENT);
    });
  });

  describe('Error handling and retry', () => {
    it('should allow retryStage after failure', async () => {
      const result = await pceOrchestrator.processOrder({ orderId, brandId });
      const pipelineId = result.pipelineId as string;

      await pipelineOrchestrator.advanceStage(pipelineId, PIPELINE_STAGES.FULFILLMENT, 'test');
      await pipelineOrchestrator.failPipeline(pipelineId, 'Temporary error', PIPELINE_STAGES.FULFILLMENT);

      let status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.status).toBe(PipelineStatus.FAILED);

      await pipelineOrchestrator.retryStage(pipelineId);
      status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.status).toBe(PipelineStatus.IN_PROGRESS);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.stringContaining('stage.started'),
        expect.objectContaining({ pipelineId, retry: true }),
      );
    });
  });

  describe('Cancellation', () => {
    it('should cancel pipeline and set terminal state', async () => {
      const result = await pceOrchestrator.processOrder({ orderId, brandId });
      const pipelineId = result.pipelineId as string;

      await pipelineOrchestrator.advanceStage(pipelineId, PIPELINE_STAGES.FULFILLMENT, 'test');

      const cancelled = await pipelineOrchestrator.cancelPipeline(pipelineId, 'User requested');
      expect(cancelled.status).toBe(PipelineStatus.CANCELLED);

      const status = await pipelineOrchestrator.getPipelineStatus(pipelineId, brandId);
      expect(status.status).toBe(PipelineStatus.CANCELLED);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.stringContaining('pipeline.cancelled'),
        expect.objectContaining({ pipelineId, orderId: 'order-e2e', brandId: 'brand-e2e' }),
      );
    });

    it('should throw when cancelling already completed pipeline', async () => {
      const result = await pceOrchestrator.processOrder({ orderId, brandId });
      const pipelineId = result.pipelineId as string;

      const pipeline = pipelineStore.get(pipelineId) as Record<string, unknown>;
      pipeline.status = PipelineStatus.COMPLETED;
      pipeline.currentStage = PipelineStatus.COMPLETED;
      pipelineStore.set(pipelineId, pipeline);

      await expect(pipelineOrchestrator.cancelPipeline(pipelineId)).rejects.toThrow('Cannot cancel pipeline');
    });
  });
});
