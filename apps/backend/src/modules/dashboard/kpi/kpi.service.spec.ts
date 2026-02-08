/**
 * KpiService - Unit tests
 * Tests for calculateKpi (ar-sessions-today, orders-pending, monthly-revenue, unknown slug)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { KpiService } from './kpi.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('KpiService', () => {
  let service: KpiService;
  let prisma: jest.Mocked<PrismaService>;

  const brandId = 'brand-1';

  beforeEach(async () => {
    const mockPrisma = {
      analyticsEvent: { count: jest.fn() },
      order: {
        count: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      design: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateKpi', () => {
    it('should calculate ar-sessions-today', async () => {
      (prisma.analyticsEvent.count as jest.Mock).mockResolvedValue(12);

      const result = await service.calculateKpi(brandId, 'ar-sessions-today');

      expect(result).toEqual({ value: 12 });
      expect(prisma.analyticsEvent.count).toHaveBeenCalledWith({
        where: {
          brandId,
          timestamp: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
          eventType: { contains: 'ar', mode: 'insensitive' },
        },
      });
      const call = (prisma.analyticsEvent.count as jest.Mock).mock.calls[0][0];
      const start = call.where.timestamp.gte;
      const end = call.where.timestamp.lt;
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(end.getDate()).toBe(start.getDate() + 1);
    });

    it('should calculate orders-pending', async () => {
      (prisma.order.count as jest.Mock).mockResolvedValue(5);

      const result = await service.calculateKpi(brandId, 'orders-pending');

      expect(result).toEqual({ value: 5 });
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          brandId,
          status: 'PROCESSING',
        },
      });
    });

    it('should calculate monthly-revenue', async () => {
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalCents: 150000 },
      });

      const result = await service.calculateKpi(brandId, 'monthly-revenue');

      expect(result).toEqual({ value: 1500 });
      expect(prisma.order.aggregate).toHaveBeenCalledWith({
        where: {
          brandId,
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          paidAt: { gte: expect.any(Date) },
        },
        _sum: { totalCents: true },
      });
    });

    it('should return 0 for unknown KPI slug', async () => {
      const result = await service.calculateKpi(brandId, 'unknown-kpi');

      expect(result).toEqual({ value: 0 });
      expect(prisma.analyticsEvent.count).not.toHaveBeenCalled();
      expect(prisma.order.count).not.toHaveBeenCalled();
      expect(prisma.order.aggregate).not.toHaveBeenCalled();
    });

    it('should return 0 for monthly-revenue when no orders', async () => {
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalCents: null } });

      const result = await service.calculateKpi(brandId, 'monthly-revenue');

      expect(result).toEqual({ value: 0 });
    });
  });
});
