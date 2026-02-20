/**
 * CreditsService refill & expiration Unit Tests
 * Tests refillMonthlyCredits, addCredits (add-on expiresAt), expireCredits
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CreditsService } from '../credits.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

describe('CreditsService (refill & expiration)', () => {
  let service: CreditsService;
  let prisma: jest.Mocked<PrismaService>;
  let _cache: jest.Mocked<SmartCacheService>;

  const mockBrandWithUsers = {
    id: 'brand-1',
    users: [
      { id: 'user-1', role: 'BRAND_ADMIN', createdAt: new Date() },
      { id: 'user-2', role: 'BRAND_USER', createdAt: new Date() },
    ],
  };

  beforeEach(async () => {
    const mockTx = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      creditTransaction: { create: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
      $queryRaw: jest.fn(),
    };
    const mockPrisma = {
      brand: { findUnique: jest.fn() },
      user: { findUnique: jest.fn(), update: jest.fn() },
      creditTransaction: { findMany: jest.fn(), updateMany: jest.fn() },
      $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
      $queryRaw: jest.fn(),
    };
    const mockCache = {
      get: jest.fn(),
      delSimple: jest.fn().mockResolvedValue(undefined),
      invalidateTags: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<CreditsService>(CreditsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    cache = module.get(SmartCacheService) as jest.Mocked<SmartCacheService>;
  });

  describe('refillMonthlyCredits', () => {
    it('should add correct amount of credits to primary user', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrandWithUsers);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({ aiCredits: 50, email: 'admin@test.com' }),
            update: jest.fn().mockResolvedValue({ aiCredits: 150 }),
          },
          creditTransaction: {
            create: jest.fn().mockResolvedValue({
              id: 'tx-1',
              type: 'monthly_refill',
              amount: 100,
              userId: 'user-1',
            }),
          },
        };
        return cb(tx);
      });

      const result = await service.refillMonthlyCredits('brand-1', 100);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
      expect(result.skipped).toBeUndefined();
    });

    it('should create a transaction with type monthly_refill and no expiresAt', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrandWithUsers);
      let createData: Record<string, unknown>;
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({ aiCredits: 10, email: 'a@b.com' }),
            update: jest.fn().mockResolvedValue({ aiCredits: 110 }),
          },
          creditTransaction: {
            create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
              createData = args.data;
              return Promise.resolve({ id: 'tx-1', ...args.data });
            }),
          },
        };
        return cb(tx);
      });

      await service.refillMonthlyCredits('brand-1', 100);

      expect(createData).toBeDefined();
      expect(createData.type).toBe('monthly_refill');
      expect(createData.amount).toBe(100);
      expect(createData.expiresAt).toBeUndefined();
    });

    it('should skip when planCredits <= 0', async () => {
      const result = await service.refillMonthlyCredits('brand-1', 0);
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(prisma.brand.findUnique).not.toHaveBeenCalled();
    });

    it('should skip when brand has no users', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue({ id: 'brand-1', users: [] });
      const result = await service.refillMonthlyCredits('brand-1', 50);
      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
    });
  });

  describe('addCredits (add-on purchase with expiresAt)', () => {
    it('should create transaction with expiresAt = +12 months for add-on purchase', async () => {
      const twelveMonthsFromNow = new Date();
      twelveMonthsFromNow.setFullYear(twelveMonthsFromNow.getFullYear() + 1);
      let createData: Record<string, unknown>;
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({ aiCredits: 20, aiCreditsPurchased: 0, email: 'u@t.com' }),
            update: jest.fn().mockResolvedValue({ aiCredits: 120 }),
          },
          creditTransaction: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
              createData = args.data;
              return Promise.resolve({ id: 'tx-1', ...args.data });
            }),
          },
        };
        return cb(tx);
      });

      await service.addCredits('user-1', 100, 'pack-1', 'sess_1', 'pi_1', twelveMonthsFromNow);

      expect(createData.type).toBe('purchase');
      expect(createData.expiresAt).toEqual(twelveMonthsFromNow);
    });

    it('should create transaction without expiresAt when not provided', async () => {
      let createData: Record<string, unknown>;
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({ aiCredits: 0, aiCreditsPurchased: 0, email: 'u@t.com' }),
            update: jest.fn().mockResolvedValue({ aiCredits: 50 }),
          },
          creditTransaction: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
              createData = args.data;
              return Promise.resolve({ id: 'tx-1', ...args.data });
            }),
          },
        };
        return cb(tx);
      });

      await service.addCredits('user-1', 50);

      expect(createData.type).toBe('purchase');
      expect(createData.expiresAt).toBeUndefined();
    });
  });

  describe('expireCredits', () => {
    it('should mark expired transactions and adjust balance', async () => {
      const _now = new Date();
      (prisma.creditTransaction.findMany as jest.Mock).mockResolvedValue([
        { id: 'tx-1', userId: 'user-1', amount: 30 },
        { id: 'tx-2', userId: 'user-1', amount: 20 },
      ]);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([{ ai_credits: 100 }]),
          user: { update: jest.fn().mockResolvedValue({}) },
          creditTransaction: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
        };
        return cb(tx);
      });

      const result = await service.expireCredits();

      expect(result.expiredCount).toBe(2);
      expect(result.usersAffected).toBe(1);
      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { not: null, lt: expect.any(Date) },
          expiredAt: null,
          amount: { gt: 0 },
        },
        select: { id: true, userId: true, amount: true },
      });
    });

    it('should return zero when no expired transactions', async () => {
      (prisma.creditTransaction.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.expireCredits();

      expect(result.expiredCount).toBe(0);
      expect(result.usersAffected).toBe(0);
    });
  });
});
