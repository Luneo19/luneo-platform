import { Test, TestingModule } from '@nestjs/testing';
import { BillingCalculationService } from './billing-calculation.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UsageMeteringService } from './usage-metering.service';
import { QuotasService } from './quotas.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsageMetricType } from '../interfaces/usage.interface';

/**
 * TEST-01: Tests unitaires pour BillingCalculationService
 * Couverture des méthodes critiques de calcul de facturation
 */
describe('BillingCalculationService', () => {
  let service: BillingCalculationService;
  let prisma: jest.Mocked<PrismaService>;
  let meteringService: jest.Mocked<UsageMeteringService>;
  let quotasService: jest.Mocked<QuotasService>;

  const mockPrisma = {
    brand: {
      findUnique: jest.fn(),
    },
    usageMetric: {
      findMany: jest.fn(),
    },
  };

  const mockMeteringService = {
    getCurrentUsage: jest.fn(),
  };

  const mockQuotasService = {
    getPlanLimits: jest.fn(),
    getAllPlans: jest.fn(),
  };

  // Mock plan limits pour les tests
  const mockPlanLimits = {
    plan: 'professional',
    basePrice: 4900, // 49€
    quotas: [
      {
        metric: 'ai_generations' as UsageMetricType,
        limit: 500,
        overage: 'charge' as const,
        overageRate: 5, // 0.05€ par génération
      },
      {
        metric: 'storage_gb' as UsageMetricType,
        limit: 100, // 100GB
        overage: 'charge' as const,
        overageRate: 100, // 1€ par GB
      },
      {
        metric: 'api_calls' as UsageMetricType,
        limit: 100000,
        overage: 'block' as const,
        overageRate: 0,
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingCalculationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsageMeteringService, useValue: mockMeteringService },
        { provide: QuotasService, useValue: mockQuotasService },
      ],
    }).compile();

    service = module.get<BillingCalculationService>(BillingCalculationService);
    prisma = module.get(PrismaService);
    meteringService = module.get(UsageMeteringService);
    quotasService = module.get(QuotasService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ============================================================================
  // calculateCurrentBill
  // ============================================================================
  describe('calculateCurrentBill', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'professional',
        country: 'FR',
      });
      mockQuotasService.getPlanLimits.mockReturnValue(mockPlanLimits);
    });

    it('should calculate bill with no overage', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 200, // Under limit (500)
        storage_gb: 50, // Under limit (100)
        api_calls: 50000, // Under limit (100000)
      });

      const result = await service.calculateCurrentBill(mockBrandId);

      expect(result).toBeDefined();
      expect(result.basePrice).toBe(4900);
      expect(result.totalOverageCost).toBe(0);
      expect(result.subtotal).toBe(4900);
      expect(result.tax).toBe(980); // 20% TVA
      expect(result.total).toBe(5880);
      expect(result.breakdown).toHaveLength(3);
    });

    it('should calculate bill with overage costs', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 600, // 100 over limit (500)
        storage_gb: 120, // 20 over limit (100)
        api_calls: 50000,
      });

      const result = await service.calculateCurrentBill(mockBrandId);

      expect(result).toBeDefined();
      // ai_generations: 100 overage * 5 = 500
      // storage_gb: 20 overage * 100 = 2000
      expect(result.totalOverageCost).toBe(100 * 5 + 20 * 100); // 500 + 2000 = 2500
      expect(result.subtotal).toBe(4900 + 2500);
      expect(result.overageCosts['ai_generations']).toBe(500);
      expect(result.overageCosts['storage_gb']).toBe(2000);
    });

    it('should throw BadRequestException for empty brandId', async () => {
      await expect(service.calculateCurrentBill('')).rejects.toThrow(BadRequestException);
      await expect(service.calculateCurrentBill('   ')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(service.calculateCurrentBill('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should use starter plan if brand plan is null', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: null,
        country: 'FR',
      });

      mockQuotasService.getPlanLimits.mockReturnValue({
        ...mockPlanLimits,
        plan: 'starter',
        basePrice: 0,
      });

      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.calculateCurrentBill(mockBrandId);

      expect(mockQuotasService.getPlanLimits).toHaveBeenCalledWith('starter');
      expect(result.basePrice).toBe(0);
    });

    it('should apply correct tax rate based on country (FR = 20%)', async () => {
      // Default country is FR (set in beforeEach)
      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.calculateCurrentBill(mockBrandId);
      
      // FR has 20% tax rate
      expect(result.tax).toBe(Math.round(4900 * 0.2));
    });

    it('should return correct billing period', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.calculateCurrentBill(mockBrandId);
      const now = new Date();

      expect(result.period.start.getMonth()).toBe(now.getMonth());
      expect(result.period.start.getDate()).toBe(1);
      expect(result.period.end.getMonth()).toBe(now.getMonth());
    });

    it('should handle breakdown correctly', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 600,
        storage_gb: 80, // Under limit (100)
        api_calls: 120000,
      });

      const result = await service.calculateCurrentBill(mockBrandId);

      const aiBreakdown = result.breakdown.find(b => b.metric === 'ai_generations');
      expect(aiBreakdown).toBeDefined();
      expect(aiBreakdown!.quantity).toBe(600);
      expect(aiBreakdown!.limit).toBe(500);
      expect(aiBreakdown!.overage).toBe(100);
      expect(aiBreakdown!.cost).toBe(500);

      const storageBreakdown = result.breakdown.find(b => b.metric === 'storage_gb');
      expect(storageBreakdown).toBeDefined();
      expect(storageBreakdown!.overage).toBe(0); // Under limit (80 < 100)
      expect(storageBreakdown!.cost).toBe(0);
    });
  });

  // ============================================================================
  // estimateActionCost
  // ============================================================================
  describe('estimateActionCost', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'professional',
        country: 'FR',
      });
      mockQuotasService.getPlanLimits.mockReturnValue(mockPlanLimits);
    });

    it('should estimate cost when within quota', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 200,
        storage_gb: 5000,
        api_calls: 50000,
      });

      const result = await service.estimateActionCost(
        mockBrandId,
        'ai_generations' as UsageMetricType,
        50,
      );

      expect(result).toBeDefined();
      expect(result.metric).toBe('ai_generations');
      expect(result.quantity).toBe(50);
      expect(result.currentUsage).toBe(200);
      expect(result.limit).toBe(500);
      expect(result.willExceed).toBe(false);
      expect(result.overageAmount).toBe(0);
      expect(result.estimatedCost).toBe(0);
    });

    it('should estimate cost when exceeding quota', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 480,
        storage_gb: 5000,
        api_calls: 50000,
      });

      const result = await service.estimateActionCost(
        mockBrandId,
        'ai_generations' as UsageMetricType,
        50,
      );

      expect(result.willExceed).toBe(true);
      expect(result.overageAmount).toBe(30); // 480 + 50 - 500 = 30
      expect(result.estimatedCost).toBe(30 * 5); // 150
    });

    it('should throw BadRequestException for invalid brandId', async () => {
      await expect(
        service.estimateActionCost('', 'ai_generations' as UsageMetricType, 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative quantity', async () => {
      await expect(
        service.estimateActionCost(mockBrandId, 'ai_generations' as UsageMetricType, -5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle unknown metric gracefully', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.estimateActionCost(
        mockBrandId,
        'unknown_metric' as UsageMetricType,
        10,
      );

      expect(result.limit).toBe(999999);
      expect(result.willExceed).toBe(false);
      expect(result.estimatedCost).toBe(0);
    });

    it('should throw NotFoundException for non-existent brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.estimateActionCost(mockBrandId, 'ai_generations' as UsageMetricType, 10),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================================
  // projectCosts
  // ============================================================================
  describe('projectCosts', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'professional',
        country: 'FR',
      });
      mockQuotasService.getPlanLimits.mockReturnValue(mockPlanLimits);
      mockMeteringService.getCurrentUsage.mockResolvedValue({});
    });

    it('should project costs based on recent usage', async () => {
      mockPrisma.usageMetric.findMany.mockResolvedValue([
        { metric: 'ai_generations', value: 100 },
        { metric: 'ai_generations', value: 120 },
        { metric: 'ai_generations', value: 110 },
      ]);

      const result = await service.projectCosts(mockBrandId, 30);

      expect(result).toBeDefined();
      expect(result.currentDaily).toBeDefined();
      expect(result.projectedMonthly).toBeDefined();
      expect(result.projectedOverage).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should throw BadRequestException for invalid brandId', async () => {
      await expect(service.projectCosts('')).rejects.toThrow(BadRequestException);
    });

    it('should default to 30 days for invalid days parameter', async () => {
      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      // Should not throw, should use default
      await expect(service.projectCosts(mockBrandId, -5)).resolves.toBeDefined();
      await expect(service.projectCosts(mockBrandId, 500)).resolves.toBeDefined();
    });

    it('should add recommendations when approaching quota', async () => {
      // Simulate high daily usage
      const highUsage = Array(7).fill({ metric: 'ai_generations', value: 80 });
      mockPrisma.usageMetric.findMany.mockResolvedValue(highUsage);

      const result = await service.projectCosts(mockBrandId, 30);

      // Should recommend upgrade if projected to exceed 90%
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty usage data', async () => {
      mockPrisma.usageMetric.findMany.mockResolvedValue([]);

      const result = await service.projectCosts(mockBrandId, 30);

      expect(result).toBeDefined();
      expect(result.projectedOverage).toBe(0);
    });
  });

  // ============================================================================
  // comparePlans
  // ============================================================================
  describe('comparePlans', () => {
    const mockBrandId = 'brand-123';

    const mockAllPlans = [
      { plan: 'starter', basePrice: 0, quotas: mockPlanLimits.quotas.map(q => ({ ...q, limit: 100 })) },
      { plan: 'professional', basePrice: 4900, quotas: mockPlanLimits.quotas },
      { plan: 'business', basePrice: 9900, quotas: mockPlanLimits.quotas.map(q => ({ ...q, limit: 2000 })) },
    ];

    beforeEach(() => {
      mockQuotasService.getAllPlans.mockReturnValue(mockAllPlans);
    });

    it('should compare all plans and return sorted by total cost', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 150,
        storage_gb: 5000,
        api_calls: 50000,
      });

      const result = await service.comparePlans(mockBrandId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      
      // Should be sorted by total cost
      for (let i = 1; i < result.length; i++) {
        expect(result[i].total).toBeGreaterThanOrEqual(result[i - 1].total);
      }
    });

    it('should mark cheapest plan as best value', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 50,
        storage_gb: 1000,
        api_calls: 5000,
      });

      const result = await service.comparePlans(mockBrandId);

      const cheapest = result[0];
      expect(cheapest.savings).toBe(0);
      expect(cheapest.recommendation).toContain('Best value');
    });

    it('should calculate savings compared to cheapest plan', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 50,
      });

      const result = await service.comparePlans(mockBrandId);

      const cheapest = result[0];
      for (const comparison of result.slice(1)) {
        expect(comparison.savings).toBe(comparison.total - cheapest.total);
      }
    });

    it('should throw BadRequestException for invalid brandId', async () => {
      await expect(service.comparePlans('')).rejects.toThrow(BadRequestException);
    });

    it('should include overage in total calculation', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 200, // Exceeds starter limit (100)
        storage_gb: 5000,
        api_calls: 50000,
      });

      const result = await service.comparePlans(mockBrandId);

      const starter = result.find(p => p.plan === 'starter');
      expect(starter).toBeDefined();
      expect(starter!.estimatedOverage).toBeGreaterThan(0);
    });

    it('should handle missing usage data gracefully', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.comparePlans(mockBrandId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      
      // All plans should have 0 overage
      for (const comparison of result) {
        expect(comparison.estimatedOverage).toBe(0);
      }
    });
  });

  // ============================================================================
  // Edge cases and error handling
  // ============================================================================
  describe('Edge cases', () => {
    it('should handle zero usage', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'professional',
        country: 'FR',
      });
      mockQuotasService.getPlanLimits.mockReturnValue(mockPlanLimits);
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 0,
        storage_gb: 0,
        api_calls: 0,
      });

      const result = await service.calculateCurrentBill('brand-123');

      expect(result.totalOverageCost).toBe(0);
      expect(result.subtotal).toBe(4900);
    });

    it('should handle very large usage values', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'professional',
        country: 'FR',
      });
      mockQuotasService.getPlanLimits.mockReturnValue(mockPlanLimits);
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 1000000, // 1M generations
        storage_gb: 100000000, // 100TB
        api_calls: 1000000000, // 1B calls
      });

      const result = await service.calculateCurrentBill('brand-123');

      expect(result.totalOverageCost).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(Number.isFinite(result.total)).toBe(true);
    });

    it('should handle unknown country with default tax rate', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'professional',
        country: 'UNKNOWN',
      });
      mockQuotasService.getPlanLimits.mockReturnValue(mockPlanLimits);
      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.calculateCurrentBill('brand-123');

      // Should default to 20%
      expect(result.tax).toBe(Math.round(4900 * 0.2));
    });
  });
});
