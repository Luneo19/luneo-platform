import { Test, TestingModule } from '@nestjs/testing';
import { UsageMeteringService } from './usage-metering.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { UsageMetricType } from '../interfaces/usage.interface';

/**
 * TEST-02: Tests unitaires pour UsageMeteringService
 * Couverture du metering et synchronisation Stripe
 */
describe('UsageMeteringService', () => {
  let service: UsageMeteringService;

  const mockPrisma = {
    brand: {
      findUnique: jest.fn(),
    },
    usageMetric: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    delSimple: jest.fn(),
    getSimple: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock process.env for Stripe
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageMeteringService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: getQueueToken('usage-metering'), useValue: mockQueue },
        { provide: ConfigService, useValue: { get: jest.fn((k: string) => (k === 'STRIPE_SECRET_KEY' ? 'sk_test_mock' : undefined)) } },
      ],
    }).compile();

    service = module.get<UsageMeteringService>(UsageMeteringService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ============================================================================
  // recordUsage
  // ============================================================================
  describe('recordUsage', () => {
    const mockBrandId = 'brand-123';
    const mockMetric: UsageMetricType = 'ai_generations';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        stripeSubscriptionId: null, // No Stripe subscription
      });
    });

    it('should record usage and queue it', async () => {
      const result = await service.recordUsage(mockBrandId, mockMetric, 1);

      expect(result).toBeDefined();
      expect(result.brandId).toBe(mockBrandId);
      expect(result.metric).toBe(mockMetric);
      expect(result.value).toBe(1);
      expect(result.unit).toBe('generations');
      expect(mockQueue.add).toHaveBeenCalledWith('record-usage', expect.any(Object));
      expect(mockCache.delSimple).toHaveBeenCalledWith(`usage:${mockBrandId}:current`);
    });

    it('should record usage with custom value', async () => {
      const result = await service.recordUsage(mockBrandId, mockMetric, 5);

      expect(result.value).toBe(5);
    });

    it('should record usage with metadata', async () => {
      const metadata = { source: 'api', userId: 'user-123' };
      const result = await service.recordUsage(mockBrandId, mockMetric, 1, metadata);

      expect(result.metadata).toEqual(metadata);
    });

    it('should generate unique ID for each usage record', async () => {
      const result1 = await service.recordUsage(mockBrandId, mockMetric, 1);
      const result2 = await service.recordUsage(mockBrandId, mockMetric, 1);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle different metric types', async () => {
      const metrics: UsageMetricType[] = [
        'designs_created',
        'renders_2d',
        'renders_3d',
        'storage_gb',
        'api_calls',
      ];

      for (const metric of metrics) {
        const result = await service.recordUsage(mockBrandId, metric, 1);
        expect(result.metric).toBe(metric);
      }
    });

    it('should complete when queue add fails (queue errors are non-blocking)', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));

      const result = await service.recordUsage(mockBrandId, mockMetric, 1);

      expect(result).toBeDefined();
      expect(result.brandId).toBe(mockBrandId);
      expect(result.metric).toBe(mockMetric);
    });
  });

  // ============================================================================
  // getCurrentUsage
  // ============================================================================
  describe('getCurrentUsage', () => {
    const mockBrandId = 'brand-123';

    it('should return cached usage if available', async () => {
      const cachedUsage = { ai_generations: 50, renders_2d: 100 };
      mockCache.getSimple.mockResolvedValue(JSON.stringify(cachedUsage));

      const result = await service.getCurrentUsage(mockBrandId);

      expect(result).toEqual(cachedUsage);
      expect(mockPrisma.usageMetric.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and aggregate when cache miss', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.usageMetric.findMany.mockResolvedValue([
        { metric: 'ai_generations', value: 10 },
        { metric: 'ai_generations', value: 15 },
        { metric: 'renders_2d', value: 50 },
      ]);

      const result = await service.getCurrentUsage(mockBrandId);

      expect(result.ai_generations).toBe(25);
      expect(result.renders_2d).toBe(50);
      expect(mockCache.set).toHaveBeenCalledWith(
        `usage:${mockBrandId}:current`,
        expect.any(String),
        300
      );
    });

    it('should return empty object when no usage records', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      const result = await service.getCurrentUsage(mockBrandId);

      expect(result).toEqual({});
    });

    it('should query only current month records', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      await service.getCurrentUsage(mockBrandId);

      expect(mockPrisma.usageMetric.findMany).toHaveBeenCalledWith({
        where: {
          brandId: mockBrandId,
          timestamp: {
            gte: expect.any(Date),
          },
        },
      });

      // Verify the date is start of current month
      const call = mockPrisma.usageMetric.findMany.mock.calls[0][0];
      const queryDate = call.where.timestamp.gte;
      expect(queryDate.getDate()).toBe(1);
      expect(queryDate.getHours()).toBe(0);
    });

    it('should throw error when DB query fails', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.usageMetric.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.getCurrentUsage(mockBrandId)).rejects.toThrow('DB error');
    });
  });

  // ============================================================================
  // batchRecordUsage
  // ============================================================================
  describe('batchRecordUsage', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        stripeSubscriptionId: null,
      });
    });

    it('should record multiple metrics in batch', async () => {
      const metrics = [
        { metric: 'ai_generations' as UsageMetricType, value: 5 },
        { metric: 'renders_2d' as UsageMetricType, value: 10 },
        { metric: 'storage_gb' as UsageMetricType, value: 2 },
      ];

      await service.batchRecordUsage(mockBrandId, metrics);

      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should handle empty metrics array', async () => {
      await service.batchRecordUsage(mockBrandId, []);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should complete even when queue fails (queue errors are non-blocking)', async () => {
      mockQueue.add.mockResolvedValueOnce(undefined);
      mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));

      const metrics = [
        { metric: 'ai_generations' as UsageMetricType, value: 5 },
        { metric: 'renders_2d' as UsageMetricType, value: 10 },
      ];

      await expect(
        service.batchRecordUsage(mockBrandId, metrics)
      ).resolves.toBeUndefined();
    });
  });

  // ============================================================================
  // getUnitForMetric (private but testable via recordUsage)
  // ============================================================================
  describe('getUnitForMetric', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        stripeSubscriptionId: null,
      });
    });

    it('should return correct unit for each metric type', async () => {
      const expectedUnits: Record<UsageMetricType, string> = {
        designs_created: 'designs',
        renders_2d: 'renders',
        renders_3d: 'renders',
        exports_gltf: 'exports',
        exports_usdz: 'exports',
        ai_generations: 'generations',
        storage_gb: 'GB',
        bandwidth_gb: 'GB',
        api_calls: 'calls',
        webhook_deliveries: 'webhooks',
        custom_domains: 'domains',
        team_members: 'members',
      };

      for (const [metric, expectedUnit] of Object.entries(expectedUnits)) {
        const result = await service.recordUsage(mockBrandId, metric as UsageMetricType, 1);
        expect(result.unit).toBe(expectedUnit);
      }
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================
  describe('Edge cases', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        stripeSubscriptionId: null,
      });
    });

    it('should handle very large usage values', async () => {
      const result = await service.recordUsage(mockBrandId, 'api_calls', 1000000);

      expect(result.value).toBe(1000000);
    });

    it('should handle decimal usage values', async () => {
      const result = await service.recordUsage(mockBrandId, 'storage_gb', 2.5);

      expect(result.value).toBe(2.5);
    });

    it('should handle zero usage value', async () => {
      const result = await service.recordUsage(mockBrandId, 'ai_generations', 0);

      expect(result.value).toBe(0);
    });
  });
});
