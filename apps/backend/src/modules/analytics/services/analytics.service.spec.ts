/**
 * Tests unitaires pour AnalyticsService
 * Teste les calculs analytics, métriques, et requêtes Prisma
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Logger } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    design: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    render: {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService);

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
        designsOverTime: [],
        revenueOverTime: [],
        viewsOverTime: [],
      };

      prisma.design.count.mockResolvedValue(mockData.designs);
      prisma.render.count.mockResolvedValue(mockData.renders);
      prisma.user.count.mockResolvedValue(mockData.users);
      prisma.order.aggregate.mockResolvedValue({
        _sum: { totalCents: mockData.revenue * 100 },
      });
      prisma.order.count.mockResolvedValue(mockData.orders);
      prisma.design.findMany.mockResolvedValue(mockData.designsOverTime);
      prisma.order.findMany.mockResolvedValue(mockData.revenueOverTime);
      prisma.webVital.findMany.mockResolvedValue(mockData.viewsOverTime);

      const result = await service.getDashboard('last_30_days');

      expect(result).toBeDefined();
      expect(result.metrics.totalDesigns).toBe(mockData.designs);
      expect(result.metrics.totalRenders).toBe(mockData.renders);
      expect(result.metrics.activeUsers).toBe(mockData.users);
      expect(prisma.design.count).toHaveBeenCalled();
      expect(prisma.render.count).toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalled();
    });

    it('should calculate conversion change correctly', async () => {
      // Current period: 100 renders, 10 orders = 10% conversion
      // Previous period: 80 renders, 4 orders = 5% conversion
      // Expected change: +5%

      prisma.design.count.mockResolvedValue(0);
      prisma.render.count
        .mockResolvedValueOnce(100) // Current period
        .mockResolvedValueOnce(80); // Previous period
      prisma.user.count.mockResolvedValue(0);
      prisma.order.aggregate.mockResolvedValue({ _sum: { totalCents: 0 } });
      prisma.order.count
        .mockResolvedValueOnce(10) // Current period
        .mockResolvedValueOnce(4); // Previous period
      prisma.design.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.webVital.findMany.mockResolvedValue([]);

      const result = await service.getDashboard('last_30_days');

      expect(result.metrics.conversionChange).toBeCloseTo(5, 1);
    });

    it('should handle empty data gracefully', async () => {
      prisma.design.count.mockResolvedValue(0);
      prisma.render.count.mockResolvedValue(0);
      prisma.user.count.mockResolvedValue(0);
      prisma.order.aggregate.mockResolvedValue({ _sum: { totalCents: null } });
      prisma.order.count.mockResolvedValue(0);
      prisma.design.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.webVital.findMany.mockResolvedValue([]);

      const result = await service.getDashboard('last_7_days');

      expect(result.metrics.totalDesigns).toBe(0);
      expect(result.metrics.totalRenders).toBe(0);
      expect(result.metrics.activeUsers).toBe(0);
      expect(result.metrics.revenue).toBe(0);
    });
  });

  describe('getTotalDesigns', () => {
    it('should return count of designs in date range', async () => {
      prisma.design.count.mockResolvedValue(50);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service['getTotalDesigns'](startDate, endDate);

      expect(result).toBe(50);
      expect(prisma.design.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    });
  });

  describe('getTotalRenders', () => {
    it('should return count of renders in date range', async () => {
      prisma.render.count.mockResolvedValue(75);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service['getTotalRenders'](startDate, endDate);

      expect(result).toBe(75);
      expect(prisma.render.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    });
  });

  describe('getActiveUsers', () => {
    it('should return count of active users in date range', async () => {
      prisma.user.count.mockResolvedValue(30);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service['getActiveUsers'](startDate, endDate);

      expect(result).toBe(30);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          lastLoginAt: {
            gte: startDate,
            lte: endDate,
          },
          isActive: true,
        },
      });
    });
  });

  describe('getRevenueByDateRange', () => {
    it('should calculate revenue from orders', async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { totalCents: 50000 }, // 500.00 EUR
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service['getRevenueByDateRange'](startDate, endDate);

      expect(result).toBe(500);
      expect(prisma.order.aggregate).toHaveBeenCalled();
    });

    it('should return 0 if no revenue', async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { totalCents: null },
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service['getRevenueByDateRange'](startDate, endDate);

      expect(result).toBe(0);
    });
  });

  describe('getTopPages', () => {
    it('should return top pages with view counts', async () => {
      const mockPages = [
        { path: '/dashboard', _count: { path: 150 } },
        { path: '/products', _count: { path: 100 } },
        { path: '/orders', _count: { path: 50 } },
      ];

      prisma.analyticsEvent.groupBy.mockResolvedValue(mockPages as any);

      const result = await service.getTopPages('last_30_days');

      expect(result).toHaveLength(3);
      expect(result[0].path).toBe('/dashboard');
      expect(result[0].views).toBe(150);
      expect(prisma.analyticsEvent.groupBy).toHaveBeenCalled();
    });
  });

  describe('getTopCountries', () => {
    it('should return top countries from attribution data', async () => {
      const mockAttribution = [
        { country: 'FR', _count: { country: 200 } },
        { country: 'US', _count: { country: 150 } },
        { country: 'GB', _count: { country: 100 } },
      ];

      prisma.attribution.groupBy.mockResolvedValue(mockAttribution as any);
      prisma.user.count.mockResolvedValue(450);

      const result = await service.getTopCountries('last_30_days');

      expect(result).toHaveLength(3);
      expect(result[0].country).toBe('FR');
      expect(result[0].users).toBe(200);
      expect(result[0].percentage).toBeCloseTo(44.44, 1);
    });

    it('should use estimated distribution if no attribution data', async () => {
      prisma.attribution.groupBy.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(100);

      const result = await service.getTopCountries('last_30_days');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('country');
      expect(result[0]).toHaveProperty('users');
      expect(result[0]).toHaveProperty('percentage');
    });
  });

  describe('getRealtimeUsers', () => {
    it('should return users active in last 5 minutes', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', lastLoginAt: new Date() },
        { id: '2', email: 'user2@test.com', lastLoginAt: new Date() },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers as any);

      const result = await service.getRealtimeUsers();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(prisma.user.findMany).toHaveBeenCalled();
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
