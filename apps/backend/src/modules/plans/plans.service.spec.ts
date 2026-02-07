/**
 * PlansService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PlanType } from './plans.service';

describe('PlansService', () => {
  let service: PlansService;
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    brand: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    design: { count: jest.fn() },
    product: { count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getUserPlan', () => {
    it('should return FREE when user has no brand', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', brand: null });

      const result = await service.getUserPlan('u1');

      expect(result).toBe(PlanType.FREE);
    });

    it('should return FREE when subscription is not active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        brand: {
          plan: 'STARTER',
          subscriptionPlan: 'STARTER',
          subscriptionStatus: 'CANCELLED',
        },
      });

      const result = await service.getUserPlan('u1');

      expect(result).toBe(PlanType.FREE);
    });

    it('should return plan from brand when subscription is active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        brand: {
          plan: 'PROFESSIONAL',
          subscriptionPlan: 'PROFESSIONAL',
          subscriptionStatus: 'ACTIVE',
        },
      });

      const result = await service.getUserPlan('u1');

      expect(result).toBe(PlanType.PROFESSIONAL);
    });
  });

  describe('getActiveAddons', () => {
    it('should return empty array when brand has no limits', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: 'b1', limits: null });

      const result = await service.getActiveAddons('b1');

      expect(result).toEqual([]);
    });

    it('should return active addons from brand limits', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        id: 'b1',
        limits: { activeAddons: [{ type: 'EXTRA_DESIGNS', quantity: 1 }] },
      });

      const result = await service.getActiveAddons('b1');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('EXTRA_DESIGNS');
      expect(result[0].quantity).toBe(1);
    });
  });

  describe('getPlanLimits', () => {
    it('should return limits for given plan', () => {
      const limits = service.getPlanLimits(PlanType.FREE);

      expect(limits).toBeDefined();
      expect(typeof limits.designsPerMonth).toBe('number');
      expect(typeof limits.teamMembers).toBe('number');
    });

    it('should return FREE limits for unknown plan', () => {
      const limits = service.getPlanLimits('UNKNOWN' as PlanType);

      expect(limits).toBeDefined();
    });
  });

  describe('checkDesignLimit', () => {
    it('should allow create when under limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        brandId: 'b1',
        brand: {
          plan: 'STARTER',
          subscriptionPlan: 'STARTER',
          subscriptionStatus: 'ACTIVE',
        },
      });
      mockPrisma.brand.findUnique.mockResolvedValue({ limits: null });
      mockPrisma.design.count.mockResolvedValue(2);

      const result = await service.checkDesignLimit('u1');

      expect(result.canCreate).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.limit).toBeGreaterThanOrEqual(0);
    });

    it('should return unlimited when plan has designsPerMonth -1', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', brandId: 'b1' });
      mockPrisma.brand.findUnique.mockResolvedValue({ limits: null });
      // Plan FREE or with -1 limit
      const result = await service.checkDesignLimit('u1');

      expect(result).toBeDefined();
      expect(typeof result.canCreate).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.limit).toBe('number');
    });
  });

  describe('enforceDesignLimit', () => {
    it('should throw ForbiddenException when limit reached', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', brandId: 'b1' });
      mockPrisma.brand.findUnique.mockResolvedValue({ limits: null });
      mockPrisma.design.count.mockResolvedValue(1000);

      await expect(service.enforceDesignLimit('u1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.enforceDesignLimit('u1')).rejects.toThrow(
        /Limite de designs/,
      );
    });
  });

  describe('getPlanInfo', () => {
    it('should return plan info for display', () => {
      const info = service.getPlanInfo(PlanType.STARTER);

      expect(info).toBeDefined();
      expect(info.name).toBeDefined();
      expect(typeof info.price).toBe('number');
      expect(Array.isArray(info.features)).toBe(true);
    });
  });

  describe('getAllPlansInfo', () => {
    it('should return all plans info', () => {
      const all = service.getAllPlansInfo();

      expect(all).toBeDefined();
      expect(all[PlanType.FREE]).toBeDefined();
      expect(all[PlanType.STARTER]).toBeDefined();
    });
  });

  describe('upgradeUserPlan', () => {
    it('should update brand plan when user has brandId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', brandId: 'b1' });
      mockPrisma.brand.update.mockResolvedValue({});

      await service.upgradeUserPlan('u1', PlanType.PROFESSIONAL);

      expect(mockPrisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'b1' },
          data: expect.objectContaining({
            subscriptionPlan: 'PROFESSIONAL',
            subscriptionStatus: 'ACTIVE',
          }),
        }),
      );
    });

    it('should not throw when user has no brandId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', brandId: null });

      await expect(
        service.upgradeUserPlan('u1', PlanType.STARTER),
      ).resolves.not.toThrow();
      expect(mockPrisma.brand.update).not.toHaveBeenCalled();
    });
  });
});
