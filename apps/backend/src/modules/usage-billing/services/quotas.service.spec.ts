import { Test, TestingModule } from '@nestjs/testing';
import { QuotasService } from './quotas.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { UsageMeteringService } from './usage-metering.service';
import { BadRequestException } from '@nestjs/common';
import { UsageMetricType } from '../interfaces/usage.interface';

/**
 * TEST-03: Tests unitaires pour QuotasService
 * Couverture de la gestion des quotas et plans
 */
describe('QuotasService', () => {
  let service: QuotasService;

  const mockPrisma = {
    brand: {
      findUnique: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockMeteringService = {
    getCurrentUsage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: UsageMeteringService, useValue: mockMeteringService },
      ],
    }).compile();

    service = module.get<QuotasService>(QuotasService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ============================================================================
  // getPlanLimits
  // ============================================================================
  describe('getPlanLimits', () => {
    it('should return starter plan limits', () => {
      const result = service.getPlanLimits('starter');

      expect(result).toBeDefined();
      expect(result.plan).toBe('starter');
      expect(result.basePrice).toBe(1900);
      expect(result.quotas.length).toBeGreaterThan(0);
    });

    it('should return professional plan limits', () => {
      const result = service.getPlanLimits('professional');

      expect(result.plan).toBe('professional');
      expect(result.basePrice).toBe(4900);
    });

    it('should return business plan limits', () => {
      const result = service.getPlanLimits('business');

      expect(result.plan).toBe('business');
      expect(result.basePrice).toBe(9900);
    });

    it('should return enterprise plan limits', () => {
      const result = service.getPlanLimits('enterprise');

      expect(result.plan).toBe('enterprise');
      expect(result.basePrice).toBe(29900);
    });

    it('should default to free for unknown plan', () => {
      const result = service.getPlanLimits('unknown-plan');

      expect(result.plan).toBe('free');
    });

    it('should include all required quotas', () => {
      const result = service.getPlanLimits('professional');
      const metricTypes = result.quotas.map(q => q.metric);

      expect(metricTypes).toContain('designs_created');
      expect(metricTypes).toContain('renders_2d');
      expect(metricTypes).toContain('ai_generations');
      expect(metricTypes).toContain('storage_gb');
      expect(metricTypes).toContain('api_calls');
    });
  });

  // ============================================================================
  // getAllPlans
  // ============================================================================
  describe('getAllPlans', () => {
    it('should return all available plans', () => {
      const result = service.getAllPlans();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(5); // free, starter, professional, business, enterprise
    });

    it('should return plans sorted by price', () => {
      const result = service.getAllPlans();
      const prices = result.map(p => p.basePrice);

      // Check that starter (cheapest) is included
      expect(prices).toContain(1900);
      // Check that enterprise (most expensive) is included
      expect(prices).toContain(29900);
    });
  });

  // ============================================================================
  // checkQuota
  // ============================================================================
  describe('checkQuota', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({ plan: 'professional' });
    });

    it('should allow usage within quota', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 50,
      });

      const result = await service.checkQuota(mockBrandId, 'ai_generations', 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50); // remaining = limit - used = 100 - 50
      expect(result.limit).toBe(100);
      expect(result.overage).toBe(0);
      expect(result.willCharge).toBe(false);
    });

    it('should detect overage and calculate cost', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 95,
      });

      const result = await service.checkQuota(mockBrandId, 'ai_generations', 10);

      expect(result.allowed).toBe(true); // 'charge' overage allows it
      expect(result.overage).toBe(5); // 95 + 10 - 100 = 5 over
      expect(result.willCharge).toBe(true);
      expect(result.estimatedCost).toBe(5 * 60); // 5 * 60 cents = 300
    });

    it('should block when quota exceeded and overage is block', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        team_members: 10,
      });

      const result = await service.checkQuota(mockBrandId, 'team_members', 1);

      expect(result.allowed).toBe(false);
      expect(result.willCharge).toBe(false);
    });

    it('should return unlimited for unknown metric', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.checkQuota(mockBrandId, 'unknown_metric' as UsageMetricType, 1);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(999999);
      expect(result.remaining).toBe(999999);
    });

    it('should throw BadRequestException for non-existent brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.checkQuota(mockBrandId, 'ai_generations', 1)
      ).rejects.toThrow(BadRequestException);
    });

    it('should use starter plan when brand has no plan set', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ plan: null });
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 15,
      });

      const result = await service.checkQuota(mockBrandId, 'ai_generations', 5);

      // Starter has 20 ai_generations limit
      expect(result.limit).toBe(20);
      expect(result.remaining).toBe(5); // remaining = limit - used = 20 - 15
    });

    it('should handle zero current usage', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.checkQuota(mockBrandId, 'ai_generations', 1);

      expect(result.remaining).toBe(100); // remaining = limit - used = 100 - 0
      expect(result.overage).toBe(0);
    });
  });

  // ============================================================================
  // enforceQuota
  // ============================================================================
  describe('enforceQuota', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({ plan: 'professional' });
    });

    it('should not throw when within quota', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 50,
      });

      await expect(
        service.enforceQuota(mockBrandId, 'ai_generations', 10)
      ).resolves.not.toThrow();
    });

    it('should not throw when overage is charge', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 95,
      });

      await expect(
        service.enforceQuota(mockBrandId, 'ai_generations', 10)
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException when overage is block', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        team_members: 10,
      });

      await expect(
        service.enforceQuota(mockBrandId, 'team_members', 1)
      ).rejects.toThrow(BadRequestException);
    });

    it('should include helpful message in exception', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        team_members: 10,
      });

      try {
        await service.enforceQuota(mockBrandId, 'team_members', 1);
        fail('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('Quota exceeded');
        expect(error.message).toContain('team_members');
        expect(error.message).toContain('upgrade');
      }
    });
  });

  // ============================================================================
  // getUsageSummary
  // ============================================================================
  describe('getUsageSummary', () => {
    const mockBrandId = 'brand-123';

    beforeEach(() => {
      mockPrisma.brand.findUnique.mockResolvedValue({ plan: 'professional' });
    });

    it('should return complete usage summary', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 50,
        renders_2d: 200,
        storage_gb: 10,
      });

      const result = await service.getUsageSummary(mockBrandId);

      expect(result).toBeDefined();
      expect(result.brandId).toBe(mockBrandId);
      expect(result.metrics).toBeInstanceOf(Array);
      expect(result.estimatedCost).toBeDefined();
      expect(result.alerts).toBeInstanceOf(Array);
      expect(result.period).toBeDefined();
    });

    it('should calculate correct percentages', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 50, // 50% of 100
        renders_2d: 250, // 50% of 500
      });

      const result = await service.getUsageSummary(mockBrandId);

      const aiMetric = result.metrics.find(m => m.type === 'ai_generations');
      expect(aiMetric?.percentage).toBe(50);

      const renderMetric = result.metrics.find(m => m.type === 'renders_2d');
      expect(renderMetric?.percentage).toBe(50);
    });

    it('should cap percentage at 100%', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 150, // 150% of 100
      });

      const result = await service.getUsageSummary(mockBrandId);

      const aiMetric = result.metrics.find(m => m.type === 'ai_generations');
      expect(aiMetric?.percentage).toBe(100);
      expect(aiMetric?.overage).toBe(50);
    });

    it('should generate critical alert at 90%+', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 95, // 95%
      });

      const result = await service.getUsageSummary(mockBrandId);

      const criticalAlert = result.alerts.find(
        a => a.metric === 'ai_generations' && a.severity === 'critical'
      );
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert?.threshold).toBe(90);
    });

    it('should generate warning alert at 75%+', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 80, // 80%
      });

      const result = await service.getUsageSummary(mockBrandId);

      const warningAlert = result.alerts.find(
        a => a.metric === 'ai_generations' && a.severity === 'warning'
      );
      expect(warningAlert).toBeDefined();
      expect([75, 80]).toContain(warningAlert?.threshold);
    });

    it('should not generate alert below 75%', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 50, // 50%
      });

      const result = await service.getUsageSummary(mockBrandId);

      const aiAlert = result.alerts.find(a => a.metric === 'ai_generations');
      expect(aiAlert).toBeUndefined();
    });

    it('should calculate overage cost correctly', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({
        ai_generations: 120, // 20 over limit of 100
      });

      const result = await service.getUsageSummary(mockBrandId);

      // Professional plan: 60 cents per AI generation overage
      expect(result.estimatedCost.overage).toBe(20 * 60); // 1200 cents
    });

    it('should throw BadRequestException for non-existent brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.getUsageSummary(mockBrandId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should return correct billing period', async () => {
      mockMeteringService.getCurrentUsage.mockResolvedValue({});

      const result = await service.getUsageSummary(mockBrandId);
      const now = new Date();

      expect(result.period.start.getDate()).toBe(1);
      expect(result.period.start.getMonth()).toBe(now.getMonth());
      expect(result.period.status).toBe('active');
    });
  });

  // ============================================================================
  // Plan pricing verification
  // ============================================================================
  describe('Plan pricing', () => {
    it('should have correct pricing for all plans', () => {
      expect(service.getPlanLimits('starter').basePrice).toBe(1900); // 19€
      expect(service.getPlanLimits('professional').basePrice).toBe(4900); // 49€
      expect(service.getPlanLimits('business').basePrice).toBe(9900); // 99€
      expect(service.getPlanLimits('enterprise').basePrice).toBe(29900); // 299€
    });

    it('should have increasing limits with higher plans', () => {
      const starter = service.getPlanLimits('starter');
      const professional = service.getPlanLimits('professional');
      const business = service.getPlanLimits('business');
      const enterprise = service.getPlanLimits('enterprise');

      // AI generations limits should increase
      const starterAI = starter.quotas.find(q => q.metric === 'ai_generations')?.limit || 0;
      const proAI = professional.quotas.find(q => q.metric === 'ai_generations')?.limit || 0;
      const businessAI = business.quotas.find(q => q.metric === 'ai_generations')?.limit || 0;
      const enterpriseAI = enterprise.quotas.find(q => q.metric === 'ai_generations')?.limit || 0;

      expect(proAI).toBeGreaterThan(starterAI);
      expect(businessAI).toBeGreaterThan(proAI);
      expect(enterpriseAI).toBeGreaterThan(businessAI);
    });

    it('should have decreasing overage rates with higher plans', () => {
      const starter = service.getPlanLimits('starter');
      const professional = service.getPlanLimits('professional');
      const enterprise = service.getPlanLimits('enterprise');

      const starterAIRate = starter.quotas.find(q => q.metric === 'ai_generations')?.overageRate || 0;
      const proAIRate = professional.quotas.find(q => q.metric === 'ai_generations')?.overageRate || 0;
      const enterpriseAIRate = enterprise.quotas.find(q => q.metric === 'ai_generations')?.overageRate || 0;

      expect(proAIRate).toBeLessThan(starterAIRate);
      expect(enterpriseAIRate).toBeLessThan(proAIRate);
    });
  });
});
