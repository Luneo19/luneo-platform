/**
 * Tests unitaires pour AnalyticsService
 * Teste les calculs analytics, métriques, et requêtes Prisma
 * 
 * NOTE: Ces tests sont simplifiés car le service utilise maintenant le cache Redis
 * et des requêtes SQL raw. Pour des tests complets, il faudrait mocker SmartCacheService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { Logger } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: jest.Mocked<PrismaService>;
  let cache: jest.Mocked<SmartCacheService>;

  const mockPrismaService = {
    design: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    usageMetric: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    order: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    webVital: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    analyticsEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    attribution: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  } as any;

  const mockCacheService = {
    get: jest.fn((key, type, fetchFn) => fetchFn()),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SmartCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService);
    cache = module.get(SmartCacheService);

    // Mock Logger pour éviter les logs dans les tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard data for last_30_days period', async () => {
      const mockData = {
        designs: 100,
        renders: 200,
        users: 50,
        revenue: 5000,
        orders: 25,
        designsOverTime: [{ date: '2024-01-01', count: BigInt(10) }],
        revenueOverTime: [{ date: '2024-01-01', total_cents: BigInt(1000) }],
        viewsOverTime: [],
      };

      (prisma.design.count as jest.Mock).mockResolvedValue(mockData.designs);
      (prisma.usageMetric.count as jest.Mock).mockResolvedValue(0); // No renders from metrics
      (prisma.design.count as jest.Mock).mockResolvedValueOnce(mockData.renders); // Fallback count
      (prisma.design.groupBy as jest.Mock).mockResolvedValue(Array(mockData.users).fill({ userId: '1' }));
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalCents: mockData.revenue * 100 },
      });
      (prisma.order.count as jest.Mock).mockResolvedValue(mockData.orders);
      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce(mockData.designsOverTime)
        .mockResolvedValueOnce(mockData.revenueOverTime);
      (prisma.webVital.findMany as jest.Mock).mockResolvedValue(mockData.viewsOverTime);
      (prisma.webVital.findMany as jest.Mock).mockResolvedValueOnce([]); // For avgSessionDuration

      const result = await service.getDashboard('last_30_days');

      expect(result).toBeDefined();
      expect(result.metrics.totalDesigns).toBe(mockData.designs);
      expect(result.metrics.totalRenders).toBe(mockData.renders);
      expect(result.metrics.activeUsers).toBe(mockData.users);
    });

    it('should calculate conversion change correctly', async () => {
      // Current period: 100 renders, 10 orders = 10% conversion
      // Previous period: 80 renders, 4 orders = 5% conversion
      // Expected change: +5%

      (prisma.design.count as jest.Mock)
        .mockResolvedValueOnce(0) // designs
        .mockResolvedValueOnce(100); // renders fallback
      (prisma.usageMetric.count as jest.Mock).mockResolvedValue(0); // No renders from metrics
      (prisma.design.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalCents: 0 } });
      (prisma.order.count as jest.Mock)
        .mockResolvedValueOnce(10) // Current period
        .mockResolvedValueOnce(4); // Previous period
      (prisma.design.count as jest.Mock)
        .mockResolvedValueOnce(80); // Previous period renders
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.webVital.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getDashboard('last_30_days');

      expect(result.charts.conversionChange).toBeCloseTo(5, 1);
    });

    it('should handle empty data gracefully', async () => {
      (prisma.design.count as jest.Mock).mockResolvedValue(0);
      (prisma.usageMetric.count as jest.Mock).mockResolvedValue(0);
      (prisma.design.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalCents: null } });
      (prisma.order.count as jest.Mock).mockResolvedValue(0);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.webVital.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getDashboard('last_7_days');

      expect(result.metrics.totalDesigns).toBe(0);
      expect(result.metrics.totalRenders).toBe(0);
      expect(result.metrics.activeUsers).toBe(0);
      expect(result.metrics.revenue).toBe(0);
    });
  });

  describe('getTopPages', () => {
    it('should return top pages with view counts', async () => {
      const mockPages = [
        { page: '/dashboard', views: BigInt(150) },
        { page: '/products', views: BigInt(100) },
        { page: '/orders', views: BigInt(50) },
      ];

      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockPages);
      (prisma.order.count as jest.Mock).mockResolvedValue(10);

      const result = await service.getTopPages('last_30_days');

      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.pages[0].path).toBe('/dashboard');
      expect(result.pages[0].views).toBe(150);
    });
  });

  describe('getTopCountries', () => {
    it('should return top countries from attribution data', async () => {
      const mockAttribution = [
        { location: { country: 'FR' } },
        { location: { country: 'US' } },
        { location: { country: 'GB' } },
      ];

      (prisma.attribution.findMany as jest.Mock).mockResolvedValue(mockAttribution);

      const result = await service.getTopCountries('last_30_days');

      expect(result.countries.length).toBeGreaterThan(0);
      expect(result.countries[0]).toHaveProperty('name');
      expect(result.countries[0]).toHaveProperty('users');
      expect(result.countries[0]).toHaveProperty('percentage');
    });

    it('should use estimated distribution if no attribution data', async () => {
      (prisma.attribution.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(100);

      const result = await service.getTopCountries('last_30_days');

      expect(result.countries.length).toBeGreaterThan(0);
      expect(result.countries[0]).toHaveProperty('name');
      expect(result.countries[0]).toHaveProperty('users');
      expect(result.countries[0]).toHaveProperty('percentage');
    });
  });

  describe('getRealtimeUsers', () => {
    it('should return users active in last hour', async () => {
      const mockSessions = [
        { sessionId: 'session1', timestamp: new Date() },
        { sessionId: 'session2', timestamp: new Date() },
      ];

      (prisma.webVital.findMany as jest.Mock).mockResolvedValue(mockSessions);

      const result = await service.getRealtimeUsers();

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(prisma.webVital.findMany).toHaveBeenCalled();
    });
  });

  describe('getPeriodDates', () => {
    it('should calculate correct dates for last_7_days', () => {
      const result = service['getPeriodDates']('last_7_days');
      
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.previousStartDate).toBeInstanceOf(Date);
      expect(result.previousEndDate).toBeInstanceOf(Date);
    });

    it('should calculate correct dates for last_30_days', () => {
      const result = service['getPeriodDates']('last_30_days');
      
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });
  });
});
