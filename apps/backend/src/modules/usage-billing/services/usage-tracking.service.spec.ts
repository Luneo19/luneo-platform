import { Test, TestingModule } from '@nestjs/testing';
import { UsageTrackingService } from './usage-tracking.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { UsageMeteringService } from './usage-metering.service';

describe('UsageTrackingService', () => {
  let service: UsageTrackingService;
  let _prisma: jest.Mocked<PrismaService>;
  let _meteringService: jest.Mocked<UsageMeteringService>;

  const mockPrisma = {
    design: {
      findMany: jest.fn(),
    },
    usageMetric: {
      findMany: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const mockMeteringService = {
    recordUsage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageTrackingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCacheService },
        { provide: UsageMeteringService, useValue: mockMeteringService },
      ],
    }).compile();

    service = module.get<UsageTrackingService>(UsageTrackingService);
    prisma = module.get(PrismaService);
    meteringService = module.get(UsageMeteringService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('trackDesignCreated', () => {
    it('should record design creation usage', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackDesignCreated('brand-123', 'design-456');

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'designs_created',
        1,
        expect.objectContaining({
          designId: 'design-456',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackRender2D', () => {
    it('should record 2D render usage', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackRender2D('brand-123', 'design-456', 'png');

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'renders_2d',
        1,
        expect.objectContaining({
          designId: 'design-456',
          format: 'png',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackRender3D', () => {
    it('should record 3D render usage', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackRender3D('brand-123', 'design-456', 'gltf');

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'renders_3d',
        1,
        expect.objectContaining({
          designId: 'design-456',
          format: 'gltf',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackExportGLTF', () => {
    it('should record GLTF export usage', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackExportGLTF('brand-123', 'design-456');

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'exports_gltf',
        1,
        expect.objectContaining({
          designId: 'design-456',
          format: 'gltf',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackExportUSDZ', () => {
    it('should record USDZ export usage', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackExportUSDZ('brand-123', 'design-456');

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'exports_usdz',
        1,
        expect.objectContaining({
          designId: 'design-456',
          format: 'usdz',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackAIGeneration', () => {
    it('should record AI generation usage', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackAIGeneration('brand-123', 'design-456', 'dall-e-3', 12);

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'ai_generations',
        1,
        expect.objectContaining({
          designId: 'design-456',
          model: 'dall-e-3',
          cost: 12,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackStorage', () => {
    it('should record storage usage in GB', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackStorage('brand-123', 2.5);

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'storage_gb',
        2.5,
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackBandwidth', () => {
    it('should record bandwidth usage in GB', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackBandwidth('brand-123', 1.5);

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'bandwidth_gb',
        1.5,
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackAPICall', () => {
    it('should record API call usage', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackAPICall('brand-123', '/api/products', 'GET');

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'api_calls',
        1,
        expect.objectContaining({
          endpoint: '/api/products',
          method: 'GET',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('trackWebhookDelivery', () => {
    it('should record webhook delivery usage', async () => {
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      await service.trackWebhookDelivery('brand-123', 'webhook-789', 'order.created');

      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'webhook_deliveries',
        1,
        expect.objectContaining({
          webhookId: 'webhook-789',
          topic: 'order.created',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('calculateTotalStorage', () => {
    it('should calculate total storage for a brand', async () => {
      mockPrisma.design.findMany.mockResolvedValue([
        { previewUrl: 'url1', highResUrl: 'url2', renderUrl: 'url3' },
        { previewUrl: 'url4', highResUrl: null, renderUrl: 'url5' },
      ]);
      mockMeteringService.recordUsage.mockResolvedValue(undefined);

      const result = await service.calculateTotalStorage('brand-123');

      expect(result).toBeGreaterThan(0);
      expect(mockMeteringService.recordUsage).toHaveBeenCalledWith(
        'brand-123',
        'storage_gb',
        expect.any(Number),
        expect.any(Object),
      );
    });

    it('should return 0 on error', async () => {
      mockPrisma.design.findMany.mockRejectedValue(new Error('DB error'));

      const result = await service.calculateTotalStorage('brand-123');

      expect(result).toBe(0);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage stats for day period', async () => {
      (mockPrisma as unknown).usageMetric = {
        findMany: jest.fn().mockResolvedValue([
          { metric: 'designs_created', value: 5 },
          { metric: 'designs_created', value: 3 },
          { metric: 'renders_2d', value: 10 },
        ]),
      };

      const result = await service.getUsageStats('brand-123', 'day');

      expect(result).toBeDefined();
      expect(result.period).toBe('day');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.metrics).toBeDefined();
    });

    it('should return usage stats for month period', async () => {
      (mockPrisma as unknown).usageMetric = {
        findMany: jest.fn().mockResolvedValue([]),
      };

      const result = await service.getUsageStats('brand-123', 'month');

      expect(result.period).toBe('month');
    });

    it('should return usage stats for year period', async () => {
      (mockPrisma as unknown).usageMetric = {
        findMany: jest.fn().mockResolvedValue([]),
      };

      const result = await service.getUsageStats('brand-123', 'year');

      expect(result.period).toBe('year');
    });
  });

  describe('getUsageHistory', () => {
    it('should return usage history', async () => {
      const mockRecords = [
        {
          id: 'metric-1',
          brandId: 'brand-123',
          metric: 'designs_created',
          value: 1,
          timestamp: new Date(),
        },
        {
          id: 'metric-2',
          brandId: 'brand-123',
          metric: 'renders_2d',
          value: 1,
          timestamp: new Date(),
        },
      ];

      mockPrisma.usageMetric.findMany.mockResolvedValue(mockRecords);

      const result = await service.getUsageHistory('brand-123');

      expect(result).toHaveLength(2);
      expect(mockPrisma.usageMetric.findMany).toHaveBeenCalledWith({
        where: { brandId: 'brand-123' },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
    });

    it('should filter by metric type', async () => {
      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      await service.getUsageHistory('brand-123', 'designs_created', 50);

      expect(mockPrisma.usageMetric.findMany).toHaveBeenCalledWith({
        where: { brandId: 'brand-123', metric: 'designs_created' },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    });

    it('should throw error on failure', async () => {
      mockPrisma.usageMetric.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getUsageHistory('brand-123'),
      ).rejects.toThrow('DB error');
    });
  });
});
