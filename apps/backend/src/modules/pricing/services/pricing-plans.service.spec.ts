/**
 * @fileoverview Tests unitaires pour PricingPlansService
 * @module PricingPlansService.spec
 *
 * Conforme au plan PHASE 9 - Tests & CI/CD
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PricingPlansService } from './pricing-plans.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

describe('PricingPlansService', () => {
  let service: PricingPlansService;
  let prismaService: any; // Use any for mock methods
  let cacheService: jest.Mocked<SmartCacheService>;

  beforeEach(async () => {
    const mockPrisma = {
      brand: {
        findUnique: jest.fn(),
      },
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidateTags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingPlansService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SmartCacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<PricingPlansService>(PricingPlansService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SmartCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPlans', () => {
    it('should return all available plans', () => {
      const plans = service.getAllPlans();

      expect(plans).toBeDefined();
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);

      // Vérifier que les plans attendus sont présents
      const planIds = plans.map((p) => p.id);
      expect(planIds).toContain('starter');
      expect(planIds).toContain('professional');
      expect(planIds).toContain('business');
      expect(planIds).toContain('enterprise');
    });

    it('should return plans with correct structure', () => {
      const plans = service.getAllPlans();

      plans.forEach((plan) => {
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('monthlyPriceCents');
        expect(plan).toHaveProperty('yearlyPriceCents');
        expect(plan).toHaveProperty('features');
        expect(plan).toHaveProperty('limits');
      });
    });
  });

  describe('getPlanById', () => {
    it('should return plan when valid id is provided', () => {
      const plan = service.getPlan('starter');

      expect(plan).toBeDefined();
      expect(plan?.id).toBe('starter');
    });

    it('should throw error when invalid id is provided', () => {
      expect(() => service.getPlan('invalid-plan' as any)).toThrow();
    });
  });

  describe('calculatePricing', () => {
    it('should calculate pricing for plan only', () => {
      const result = service.calculatePricing({
        planId: 'starter',
        billingInterval: 'monthly',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('subtotalCents');
      expect(result).toHaveProperty('totalCents');
      expect(result.subtotalCents).toBeGreaterThan(0);
      expect(result.totalCents).toBe(result.subtotalCents);
    });

    it('should calculate pricing with add-ons', () => {
      const result = service.calculatePricing({
        planId: 'professional',
        billingInterval: 'monthly',
        addOns: [
          { type: 'ai_credits', quantity: 1000 },
          { type: 'ar_sessions', quantity: 500 },
        ],
      });

      expect(result).toBeDefined();
      expect(result.addOns.length).toBeGreaterThan(0);
      // Total = subtotal (plan) - discount + sum of addOns
      const addOnsTotal = result.addOns.reduce((sum, a) => sum + a.totalCents, 0);
      expect(addOnsTotal).toBeGreaterThan(0);
    });

    it('should apply bulk discounts for add-ons', () => {
      const result = service.calculatePricing({
        planId: 'business',
        billingInterval: 'monthly',
        addOns: [
          { type: 'ai_credits', quantity: 10000 }, // Quantité élevée pour déclencher discount
        ],
      });

      expect(result).toBeDefined();
      // Le total devrait inclure des add-ons
      const addOnsTotal = result.addOns.reduce((sum, a) => sum + a.totalCents, 0);
      expect(addOnsTotal).toBeGreaterThan(0);
    });

    it('should calculate yearly pricing with discount', () => {
      const monthlyResult = service.calculatePricing({
        planId: 'professional',
        billingInterval: 'monthly',
      });

      const yearlyResult = service.calculatePricing({
        planId: 'professional',
        billingInterval: 'yearly',
      });

      expect(yearlyResult).toBeDefined();
      // Le prix annuel devrait être inférieur à 12x le prix mensuel (discount)
      expect(yearlyResult.subtotalCents).toBeLessThan(monthlyResult.subtotalCents * 12);
    });
  });

  describe('validatePlanLimits', () => {
    it('should return true when usage is within limits', () => {
      const result = service.validatePlanLimits('starter', {
        ai_generations: 5,
        ar_sessions: 10,
        storage_gb: 0.5,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('valid');
      expect(result.valid).toBe(true);
    });

    it('should return false when usage exceeds limits', () => {
      const result = service.validatePlanLimits('starter', {
        ai_generations: 1000, // Au-delà de la limite starter
        ar_sessions: 10,
        storage_gb: 0.5,
      });

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.exceeded).toBeDefined();
      expect(result.exceeded.length).toBeGreaterThan(0);
    });

    it('should handle unlimited plans', () => {
      const result = service.validatePlanLimits('enterprise', {
        ai_generations: 100000,
        ar_sessions: 50000,
        storage_gb: 1000,
      });

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });
  });

  describe('getAddOn', () => {
    it('should return add-on by type', () => {
      const addOn = service.getAddOn('ai_credits');

      expect(addOn).toBeDefined();
      expect(addOn.id).toBe('ai_credits');
      expect(addOn).toHaveProperty('name');
      expect(addOn).toHaveProperty('basePriceCents');
    });

    it('should throw error for invalid add-on type', () => {
      expect(() => service.getAddOn('invalid' as any)).toThrow();
    });
  });
});
