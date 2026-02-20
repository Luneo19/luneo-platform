/**
 * CommissionService Unit Tests
 * Tests for commission calculation and brand-based rates
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService } from './commission.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('CommissionService', () => {
  let service: CommissionService;
  let _prisma: PrismaService;

  const mockPrisma = {
    brand: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCommission', () => {
    it('should calculate correct commission amount and net amount', () => {
      const { commissionAmount, netAmount } = service.calculateCommission(
        1000,
        0.1,
      );
      expect(commissionAmount).toBe(100);
      expect(netAmount).toBe(900);
    });

    it('should round commission amount', () => {
      const { commissionAmount, netAmount } = service.calculateCommission(
        333,
        0.1,
      );
      expect(commissionAmount).toBe(33);
      expect(netAmount).toBe(300);
    });

    it('should cap rate at max 10%', () => {
      const { commissionAmount } = service.calculateCommission(1000, 0.5);
      expect(commissionAmount).toBe(100);
    });
  });

  describe('calculateCommissionCents', () => {
    it('should calculate commission in cents for given percent', () => {
      const commission = service.calculateCommissionCents(10000, 10);
      expect(commission).toBe(1000);
    });

    it('should apply minimum commission when order is large enough', () => {
      // MIN_COMMISSION_CENTS = 100 (1€). Applied when amountCents >= 200 (2€)
      const commission = service.calculateCommissionCents(500, 5);
      expect(commission).toBeGreaterThanOrEqual(100);
    });

    it('should not apply minimum on small orders', () => {
      const commission = service.calculateCommissionCents(150, 10);
      expect(commission).toBe(15);
    });

    it('should cap percent at max 10%', () => {
      const commission = service.calculateCommissionCents(10000, 50);
      expect(commission).toBe(1000);
    });
  });

  describe('getCommissionRate', () => {
    it('should return rate for brand with active subscription', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'starter',
        subscriptionPlan: 'PROFESSIONAL',
        subscriptionStatus: 'ACTIVE',
      });

      const rate = await service.getCommissionRate('brand-1');
      expect(rate).toBe(0.03);
      expect(mockPrisma.brand.findUnique).toHaveBeenCalledWith({
        where: { id: 'brand-1' },
        select: {
          plan: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
        },
      });
    });

    it('should return default STARTER rate when brand not found', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      const rate = await service.getCommissionRate('missing');
      expect(rate).toBe(0.05);
    });

    it('should return FREE rate when subscription not active', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'starter',
        subscriptionPlan: 'PROFESSIONAL',
        subscriptionStatus: 'CANCELLED',
      });

      const rate = await service.getCommissionRate('brand-1');
      expect(rate).toBe(0.1);
    });
  });

  describe('getCommissionPercent', () => {
    it('should return percent for brand with active subscription', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'starter',
        subscriptionPlan: 'BUSINESS',
        subscriptionStatus: 'ACTIVE',
      });

      const percent = await service.getCommissionPercent('brand-1');
      expect(percent).toBe(2);
    });

    it('should return default STARTER percent when brand not found', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      const percent = await service.getCommissionPercent('missing');
      expect(percent).toBe(5);
    });

    it('should return ENTERPRISE percent when plan is ENTERPRISE', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'enterprise',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
      });

      const percent = await service.getCommissionPercent('brand-1');
      expect(percent).toBe(1);
    });
  });

  describe('getCommissionRates', () => {
    it('should return all plan commission rates', () => {
      const rates = service.getCommissionRates();
      expect(rates).toMatchObject({
        FREE: 10,
        STARTER: 5,
        PROFESSIONAL: 3,
        BUSINESS: 2,
        ENTERPRISE: 1,
      });
    });
  });

  describe('calculateNetAmount', () => {
    it('should calculate commission and net amount for brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'starter',
        subscriptionPlan: 'PROFESSIONAL',
        subscriptionStatus: 'ACTIVE',
      });

      const result = await service.calculateNetAmount('brand-1', 10000);

      expect(result).toMatchObject({
        grossAmountCents: 10000,
        commissionPercent: 3,
        commissionCents: 300,
        netAmountCents: 9700,
      });
    });

    it('should use brand rate when brand exists', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        plan: 'enterprise',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
      });

      const result = await service.calculateNetAmount('brand-1', 10000);

      expect(result.commissionPercent).toBe(1);
      expect(result.commissionCents).toBe(100);
      expect(result.netAmountCents).toBe(9900);
    });
  });
});
