/**
 * CostDashboardService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CostDashboardService } from '../services/cost-dashboard.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('CostDashboardService', () => {
  let service: CostDashboardService;
  let _prisma: PrismaService;

  const mockPrisma = {
    aICost: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostDashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CostDashboardService>(CostDashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCostDashboard', () => {
    it('should return dashboard with byFeature, byProvider, byTenant, trends', async () => {
      const costs = [
        {
          id: 'c1',
          brandId: 'brand-1',
          provider: 'openai',
          model: 'gpt-4',
          costCents: 100,
          tokens: 1000,
          createdAt: new Date(),
          brand: { id: 'brand-1', name: 'Brand One' },
        },
      ];
      mockPrisma.aICost.findMany
        .mockResolvedValueOnce(costs)
        .mockResolvedValueOnce(costs)
        .mockResolvedValueOnce([]);

      const result = await service.getCostDashboard('month');

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalCostCents');
      expect(result).toHaveProperty('byFeature');
      expect(result).toHaveProperty('byProvider');
      expect(result).toHaveProperty('byTenant');
      expect(result).toHaveProperty('trends');
      expect(Array.isArray(result.byTenant)).toBe(true);
      expect(Array.isArray(result.trends)).toBe(true);
    });

    it('should aggregate costs by feature from model name', async () => {
      const costs = [
        {
          id: 'c1',
          brandId: 'b1',
          provider: 'openai',
          model: 'gpt-4',
          costCents: 50,
          tokens: 500,
          createdAt: new Date(),
          brand: { id: 'b1', name: 'B' },
        },
        {
          id: 'c2',
          brandId: 'b1',
          provider: 'openai',
          model: 'dall-e-3',
          costCents: 80,
          tokens: 0,
          createdAt: new Date(),
          brand: { id: 'b1', name: 'B' },
        },
      ];
      mockPrisma.aICost.findMany
        .mockResolvedValueOnce(costs)
        .mockResolvedValueOnce(costs)
        .mockResolvedValueOnce(costs);

      const result = await service.getCostDashboard('week');

      expect(result.byFeature['text-generation']).toBeDefined();
      expect(result.byFeature['image-generation']).toBeDefined();
    });
  });

  describe('getTenantCost', () => {
    it('should return tenant cost for brand', async () => {
      const costs = [
        {
          id: 'c1',
          brandId: 'brand-1',
          provider: 'openai',
          model: 'gpt-4',
          costCents: 200,
          tokens: 2000,
          createdAt: new Date(),
          brand: { id: 'brand-1', name: 'Test Brand' },
        },
      ];
      mockPrisma.aICost.findMany.mockResolvedValue(costs);

      const result = await service.getTenantCost('brand-1', 'month');

      expect(result.brandId).toBe('brand-1');
      expect(result.brandName).toBe('Test Brand');
      expect(result.totalCostCents).toBe(200);
      expect(Array.isArray(result.breakdown)).toBe(true);
    });

    it('should return Unknown brandName when no costs', async () => {
      mockPrisma.aICost.findMany.mockResolvedValue([]);

      const result = await service.getTenantCost('brand-unknown', 'day');

      expect(result.brandId).toBe('brand-unknown');
      expect(result.brandName).toBe('Unknown');
      expect(result.totalCostCents).toBe(0);
    });
  });
});
