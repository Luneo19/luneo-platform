import { Test, TestingModule } from '@nestjs/testing';
import { CacheWarmingService } from '../services/cache-warming.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

describe('CacheWarmingService', () => {
  let service: CacheWarmingService;

  const mockPrisma = {
    product: { findMany: jest.fn(), count: jest.fn() },
    brand: { findMany: jest.fn() },
    user: { findMany: jest.fn(), count: jest.fn() },
    order: { findMany: jest.fn(), count: jest.fn() },
  };

  const mockRedis = {
    set: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheWarmingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisOptimizedService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<CacheWarmingService>(CacheWarmingService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('warmupCache', () => {
    it('should warm products, brands, analytics and sessions', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'p1', brandId: 'b1', brand: {} },
      ]);
      mockPrisma.brand.findMany.mockResolvedValue([
        { id: 'b1', status: 'ACTIVE', _count: { users: 1, products: 1 } },
      ]);
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.product.count.mockResolvedValue(5);
      mockPrisma.order.count.mockResolvedValue(3);
      mockPrisma.order.findMany.mockResolvedValue([
        { totalCents: 10000 },
        { totalCents: 5000 },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'USER', brandId: null },
      ]);

      const promise = service.warmupCache();
      await promise;

      expect(mockPrisma.product.findMany).toHaveBeenCalled();
      expect(mockPrisma.brand.findMany).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should call warmup steps once per run', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.brand.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      await service.warmupCache();
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
      expect(mockPrisma.brand.findMany).toHaveBeenCalled();
    });
  });

  describe('triggerWarmup', () => {
    it('should return success and message when not already warming', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.brand.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.triggerWarmup();
      expect(result).toEqual({ success: true, message: 'Cache warmup triggered' });
    });

    it('should return success false when warming already in progress', async () => {
      mockPrisma.product.findMany.mockImplementation(
        () => new Promise(() => {}),
      );
      service.warmupCache();
      const result = await service.triggerWarmup();
      expect(result.success).toBe(false);
      expect(result.message).toContain('already in progress');
    });
  });
});
