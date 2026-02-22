/**
 * DiscountService Unit Tests
 * Tests for discount code validation and application
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { DiscountType } from '@prisma/client';

describe('DiscountService', () => {
  let service: DiscountService;
  let _prisma: PrismaService;

  const now = new Date();
  const validFrom = new Date(now.getTime() - 86400000);
  const validUntil = new Date(now.getTime() + 86400000);
  const expiredUntil = new Date(now.getTime() - 3600000);

  const mockPrisma = {
    discount: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    discountUsage: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DiscountService>(DiscountService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAndApplyDiscount', () => {
    it('should return discount details for a valid percentage code', async () => {
      const discount = {
        id: 'disc-1',
        code: 'WELCOME10',
        type: DiscountType.PERCENTAGE,
        value: 10,
        minPurchaseCents: null,
        maxDiscountCents: null,
        validFrom,
        validUntil,
        usageLimit: 100,
        usageCount: 5,
        isActive: true,
        brandId: null,
        description: '10% off',
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);
      mockPrisma.discountUsage.findFirst.mockResolvedValue(null);

      const result = await service.validateAndApplyDiscount('WELCOME10', 10000);

      expect(result).toMatchObject({
        discountId: 'disc-1',
        discountCents: 1000,
        discountPercent: 10,
        code: 'WELCOME10',
        type: 'percentage',
        description: '10% off',
      });
      expect(mockPrisma.discount.findUnique).toHaveBeenCalledWith({
        where: { code: 'WELCOME10' },
      });
    });

    it('should throw BadRequestException when code is expired or not yet valid', async () => {
      const discount = {
        id: 'disc-1',
        code: 'EXPIRED',
        type: DiscountType.PERCENTAGE,
        value: 10,
        validFrom,
        validUntil: expiredUntil,
        usageLimit: null,
        usageCount: 0,
        isActive: true,
        brandId: null,
        minPurchaseCents: null,
        maxDiscountCents: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);

      await expect(
        service.validateAndApplyDiscount('EXPIRED', 10000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateAndApplyDiscount('EXPIRED', 10000),
      ).rejects.toThrow(/expired or not yet valid/);
    });

    it('should throw BadRequestException when max uses reached', async () => {
      const discount = {
        id: 'disc-1',
        code: 'LIMIT5',
        type: DiscountType.PERCENTAGE,
        value: 10,
        validFrom,
        validUntil,
        usageLimit: 5,
        usageCount: 5,
        isActive: true,
        brandId: null,
        minPurchaseCents: null,
        maxDiscountCents: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);

      await expect(
        service.validateAndApplyDiscount('LIMIT5', 10000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateAndApplyDiscount('LIMIT5', 10000),
      ).rejects.toThrow(/usage limit/);
    });

    it('should throw BadRequestException when minimum order amount not met', async () => {
      const discount = {
        id: 'disc-1',
        code: 'MIN50',
        type: DiscountType.PERCENTAGE,
        value: 10,
        validFrom,
        validUntil,
        usageLimit: null,
        usageCount: 0,
        isActive: true,
        brandId: null,
        minPurchaseCents: 5000,
        maxDiscountCents: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);

      await expect(
        service.validateAndApplyDiscount('MIN50', 3000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateAndApplyDiscount('MIN50', 3000),
      ).rejects.toThrow(/Minimum purchase amount/);
    });

    it('should calculate percentage discount correctly', async () => {
      const discount = {
        id: 'disc-1',
        code: 'SAVE20',
        type: DiscountType.PERCENTAGE,
        value: 20,
        minPurchaseCents: null,
        maxDiscountCents: null,
        validFrom,
        validUntil,
        usageLimit: null,
        usageCount: 0,
        isActive: true,
        brandId: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);
      mockPrisma.discountUsage.findFirst.mockResolvedValue(null);

      const result = await service.validateAndApplyDiscount('SAVE20', 10000);

      expect(result.discountCents).toBe(2000);
      expect(result.type).toBe('percentage');
      expect(result.discountPercent).toBe(20);
    });

    it('should calculate fixed amount discount correctly', async () => {
      const discount = {
        id: 'disc-1',
        code: 'FIXED5',
        type: DiscountType.FIXED,
        value: 500,
        minPurchaseCents: null,
        maxDiscountCents: null,
        validFrom,
        validUntil,
        usageLimit: null,
        usageCount: 0,
        isActive: true,
        brandId: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);
      mockPrisma.discountUsage.findFirst.mockResolvedValue(null);

      const result = await service.validateAndApplyDiscount('FIXED5', 10000);

      expect(result.discountCents).toBe(500);
      expect(result.type).toBe('fixed');
      expect(result.discountPercent).toBe(0);
    });

    it('should cap fixed discount at subtotal', async () => {
      const discount = {
        id: 'disc-1',
        code: 'BIGFIX',
        type: DiscountType.FIXED,
        value: 15000,
        minPurchaseCents: null,
        maxDiscountCents: null,
        validFrom,
        validUntil,
        usageLimit: null,
        usageCount: 0,
        isActive: true,
        brandId: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);
      mockPrisma.discountUsage.findFirst.mockResolvedValue(null);

      const result = await service.validateAndApplyDiscount('BIGFIX', 10000);

      expect(result.discountCents).toBe(10000);
    });

    it('should apply maxDiscountCents cap for percentage', async () => {
      const discount = {
        id: 'disc-1',
        code: 'CAP50',
        type: DiscountType.PERCENTAGE,
        value: 50,
        minPurchaseCents: null,
        maxDiscountCents: 1500,
        validFrom,
        validUntil,
        usageLimit: null,
        usageCount: 0,
        isActive: true,
        brandId: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);
      mockPrisma.discountUsage.findFirst.mockResolvedValue(null);

      const result = await service.validateAndApplyDiscount('CAP50', 10000);

      expect(result.discountCents).toBe(1500);
    });

    it('should throw when code is empty', async () => {
      await expect(
        service.validateAndApplyDiscount('', 10000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateAndApplyDiscount('   ', 10000),
      ).rejects.toThrow('Discount code is required');
    });

    it('should throw when code is invalid', async () => {
      mockPrisma.discount.findUnique.mockResolvedValue(null);

      await expect(
        service.validateAndApplyDiscount('INVALID', 10000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateAndApplyDiscount('INVALID', 10000),
      ).rejects.toThrow(/Invalid discount code/);
    });

    it('should throw when code is not active', async () => {
      const discount = {
        id: 'disc-1',
        code: 'INACTIVE',
        type: DiscountType.PERCENTAGE,
        value: 10,
        validFrom,
        validUntil,
        usageLimit: null,
        usageCount: 0,
        isActive: false,
        brandId: null,
        minPurchaseCents: null,
        maxDiscountCents: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);

      await expect(
        service.validateAndApplyDiscount('INACTIVE', 10000),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateAndApplyDiscount('INACTIVE', 10000),
      ).rejects.toThrow(/not active/);
    });

    it('should throw when user already used the code', async () => {
      const discount = {
        id: 'disc-1',
        code: 'ONCE',
        type: DiscountType.PERCENTAGE,
        value: 10,
        validFrom,
        validUntil,
        usageLimit: null,
        usageCount: 0,
        isActive: true,
        brandId: null,
        minPurchaseCents: null,
        maxDiscountCents: null,
        description: null,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);
      mockPrisma.discountUsage.findFirst.mockResolvedValue({ id: 'usage-1' });

      await expect(
        service.validateAndApplyDiscount('ONCE', 10000, undefined, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateAndApplyDiscount('ONCE', 10000, undefined, 'user-1'),
      ).rejects.toThrow(/already used/);
    });
  });

  describe('validateDiscountCode', () => {
    it('should return true for valid code', async () => {
      const discount = {
        id: 'disc-1',
        code: 'VALID',
        isActive: true,
        validFrom,
        validUntil,
        usageLimit: 10,
        usageCount: 2,
      };
      mockPrisma.discount.findUnique.mockResolvedValue(discount);

      const result = await service.validateDiscountCode('VALID');
      expect(result).toBe(true);
    });

    it('should return false when code not found', async () => {
      mockPrisma.discount.findUnique.mockResolvedValue(null);
      expect(await service.validateDiscountCode('MISSING')).toBe(false);
    });

    it('should return false when code inactive', async () => {
      mockPrisma.discount.findUnique.mockResolvedValue({
        id: 'disc-1',
        code: 'INACTIVE',
        isActive: false,
        validFrom,
        validUntil,
        usageLimit: null,
        usageCount: 0,
      });
      expect(await service.validateDiscountCode('INACTIVE')).toBe(false);
    });

    it('should return false when usage limit reached', async () => {
      mockPrisma.discount.findUnique.mockResolvedValue({
        id: 'disc-1',
        code: 'LIMIT',
        isActive: true,
        validFrom,
        validUntil,
        usageLimit: 5,
        usageCount: 5,
      });
      expect(await service.validateDiscountCode('LIMIT')).toBe(false);
    });
  });

  describe('recordDiscountUsage', () => {
    it('should create usage and increment count via transaction', async () => {
      const txMock = {
        discount: {
          findUnique: jest.fn().mockResolvedValue({
            usageLimit: 10,
            usageCount: 2,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        discountUsage: {
          create: jest.fn().mockResolvedValue({}),
        },
      };
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        return fn(txMock);
      });

      await service.recordDiscountUsage('disc-1', 'order-1', 'user-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(txMock.discount.findUnique).toHaveBeenCalledWith({
        where: { id: 'disc-1' },
        select: { usageLimit: true, usageCount: true },
      });
      expect(txMock.discountUsage.create).toHaveBeenCalledWith({
        data: {
          discountId: 'disc-1',
          orderId: 'order-1',
          userId: 'user-1',
        },
      });
      expect(txMock.discount.update).toHaveBeenCalledWith({
        where: { id: 'disc-1' },
        data: { usageCount: { increment: 1 } },
      });
    });

    it('should rethrow BadRequestException when usage limit reached in transaction', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        const txMock = {
          discount: {
            findUnique: jest.fn().mockResolvedValue({
              usageLimit: 5,
              usageCount: 5,
            }),
            update: jest.fn(),
          },
          discountUsage: {
            create: jest.fn(),
          },
        };
        return fn(txMock);
      });

      await expect(
        service.recordDiscountUsage('disc-1', 'order-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recordDiscountUsage('disc-1', 'order-1'),
      ).rejects.toThrow(/usage limit/);
    });
  });
});
