/**
 * Tests unitaires pour RevenueSharingService
 * TEST-NEW-01: Couverture des fonctionnalités critiques
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RevenueSharingService } from './revenue-sharing.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RevenueSharingService', () => {
  let service: RevenueSharingService;
  let prismaService: Record<string, unknown>;

  const mockTemplate = {
    id: 'template-123',
    creatorId: 'creator-123',
    priceCents: 1000,
    isFree: false,
    revenueSharePercent: 70,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueSharingService,
        {
          provide: PrismaService,
          useValue: {
            marketplaceTemplate: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            templatePurchase: {
              create: jest.fn(),
              update: jest.fn(),
              aggregate: jest.fn(),
            },
            creatorPayout: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RevenueSharingService>(RevenueSharingService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('purchaseTemplate', () => {
    it('should throw BadRequestException when templateId is empty', async () => {
      await expect(
        service.purchaseTemplate({ templateId: '', buyerId: 'user-1', priceCents: 100 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when buyerId is empty', async () => {
      await expect(
        service.purchaseTemplate({ templateId: 'tpl-1', buyerId: '', priceCents: 100 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when price is invalid', async () => {
      await expect(
        service.purchaseTemplate({ templateId: 'tpl-1', buyerId: 'user-1', priceCents: 0 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when template not found', async () => {
      prismaService.marketplaceTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.purchaseTemplate({ templateId: 'non-existent', buyerId: 'user-1', priceCents: 100 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should create free template purchase with zero revenue', async () => {
      prismaService.marketplaceTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        isFree: true,
        priceCents: 0,
      } as unknown);
      prismaService.templatePurchase.create.mockResolvedValue({ id: 'purchase-1' });

      const result = await service.purchaseTemplate({
        templateId: 'template-123',
        buyerId: 'buyer-1',
        priceCents: 100,
      });

      expect(result.priceCents).toBe(0);
      expect(result.platformFeeCents).toBe(0);
      expect(result.creatorRevenueCents).toBe(0);
    });

    it('should calculate revenue sharing correctly (30% platform, 70% creator)', async () => {
      prismaService.marketplaceTemplate.findUnique.mockResolvedValue(mockTemplate);
      prismaService.templatePurchase.create.mockResolvedValue({ id: 'purchase-1' });

      const result = await service.purchaseTemplate({
        templateId: 'template-123',
        buyerId: 'buyer-1',
        priceCents: 1000,
      });

      expect(result.priceCents).toBe(1000);
      expect(result.platformFeeCents).toBe(300); // 30%
      expect(result.creatorRevenueCents).toBe(700); // 70%
    });
  });

  describe('confirmPurchase', () => {
    it('should throw BadRequestException when purchaseId is empty', async () => {
      await expect(
        service.confirmPurchase('', 'pi_123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should update purchase status to succeeded', async () => {
      await service.confirmPurchase('purchase-123', 'pi_stripe_123');

      expect(prismaService.templatePurchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase-123' },
        data: {
          stripePaymentIntentId: 'pi_stripe_123',
          paymentStatus: 'succeeded',
        },
      });
    });
  });

  describe('createPayout', () => {
    const validPayoutData = {
      creatorId: 'creator-123',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
    };

    it('should throw BadRequestException when creatorId is empty', async () => {
      await expect(
        service.createPayout({ ...validPayoutData, creatorId: '' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when period dates are invalid', async () => {
      await expect(
        service.createPayout({
          ...validPayoutData,
          periodStart: new Date('2026-02-01'),
          periodEnd: new Date('2026-01-01'),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no revenue for period', async () => {
      prismaService.templatePurchase.aggregate.mockResolvedValue({
        _sum: { priceCents: 0, platformFeeCents: 0, creatorRevenueCents: 0 },
      } as unknown);

      await expect(service.createPayout(validPayoutData)).rejects.toThrow(BadRequestException);
    });

    it('should create payout with calculated amounts', async () => {
      prismaService.templatePurchase.aggregate.mockResolvedValue({
        _sum: { priceCents: 10000, platformFeeCents: 3000, creatorRevenueCents: 7000 },
      } as unknown);
      prismaService.creatorPayout.create.mockResolvedValue({
        id: 'payout-1',
        netAmountCents: 7000,
      } as unknown);

      const result = await service.createPayout(validPayoutData);

      expect(result.netAmountCents).toBe(7000);
      expect(prismaService.creatorPayout.create).toHaveBeenCalled();
    });
  });
});
