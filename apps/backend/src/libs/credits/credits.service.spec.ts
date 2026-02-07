/**
 * CreditsService - Tests unitaires
 *
 * Tests critiques pour le systeme de credits IA.
 * Ce service gere de l'argent (deduction, transactions) et DOIT avoir
 * une couverture exhaustive.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ENDPOINT_COSTS } from './costs';

describe('CreditsService', () => {
  let service: CreditsService;
  let prisma: jest.Mocked<PrismaService>;
  let cache: jest.Mocked<SmartCacheService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@luneo.app',
    aiCredits: 100,
    aiCreditsUsed: 50,
    aiCreditsPurchased: 150,
    lastCreditPurchase: null,
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      creditTransaction: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      creditPack: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
      $queryRawUnsafe: jest.fn(),
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

  // ==========================================================================
  // checkCredits
  // ==========================================================================

  describe('checkCredits', () => {
    it('should return sufficient=true when user has enough credits', async () => {
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ aiCredits: 100 });

      const result = await service.checkCredits('user-1', '/api/ai/generate');

      expect(result.sufficient).toBe(true);
      expect(result.balance).toBe(100);
      expect(result.required).toBe(ENDPOINT_COSTS['/api/ai/generate']);
      expect(result.missing).toBe(0);
    });

    it('should return sufficient=false when user has insufficient credits', async () => {
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ aiCredits: 2 });

      const result = await service.checkCredits('user-1', '/api/ai/generate');

      expect(result.sufficient).toBe(false);
      expect(result.balance).toBe(2);
      expect(result.required).toBe(5); // DALL-E 3 standard cost
      expect(result.missing).toBe(3);
    });

    it('should return sufficient=false when user has zero credits', async () => {
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ aiCredits: 0 });

      const result = await service.checkCredits('user-1', '/api/ai/generate');

      expect(result.sufficient).toBe(false);
      expect(result.balance).toBe(0);
    });

    it('should use custom amount when provided', async () => {
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ aiCredits: 50 });

      const result = await service.checkCredits('user-1', '/api/ai/generate', 100);

      expect(result.sufficient).toBe(false);
      expect(result.required).toBe(100);
      expect(result.missing).toBe(50);
    });

    it('should default to 1 credit for unknown endpoints', async () => {
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ aiCredits: 1 });

      const result = await service.checkCredits('user-1', '/unknown/endpoint');

      expect(result.required).toBe(1);
      expect(result.sufficient).toBe(true);
    });

    it('should return 0 balance when user not found', async () => {
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.checkCredits('nonexistent', '/api/ai/generate');

      expect(result.balance).toBe(0);
      expect(result.sufficient).toBe(false);
    });
  });

  // ==========================================================================
  // deductCredits
  // ==========================================================================

  describe('deductCredits', () => {
    it('should deduct credits and create transaction record', async () => {
      const mockTransaction = { id: 'tx-1', amount: -5 };
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRawUnsafe: jest.fn().mockResolvedValue([
            { ai_credits: 100, ai_credits_used: 50, email: 'test@luneo.app' },
          ]),
          user: {
            update: jest.fn().mockResolvedValue({ aiCredits: 95 }),
          },
          creditTransaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
        };
        return callback(tx);
      });

      const result = await service.deductCredits('user-1', '/api/ai/generate');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(95);
      expect(result.cost).toBe(5);
      expect(result.transaction).toEqual(mockTransaction);
    });

    it('should throw BadRequestException when insufficient credits', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRawUnsafe: jest.fn().mockResolvedValue([
            { ai_credits: 2, ai_credits_used: 148, email: 'test@luneo.app' },
          ]),
          user: { update: jest.fn() },
          creditTransaction: { create: jest.fn() },
        };
        return callback(tx);
      });

      await expect(
        service.deductCredits('user-1', '/api/ai/generate'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user not found', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRawUnsafe: jest.fn().mockResolvedValue([]),
          user: { update: jest.fn() },
          creditTransaction: { create: jest.fn() },
        };
        return callback(tx);
      });

      await expect(
        service.deductCredits('nonexistent', '/api/ai/generate'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should invalidate cache after deduction', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRawUnsafe: jest.fn().mockResolvedValue([
            { ai_credits: 100, ai_credits_used: 50, email: 'test@luneo.app' },
          ]),
          user: { update: jest.fn().mockResolvedValue({ aiCredits: 95 }) },
          creditTransaction: { create: jest.fn().mockResolvedValue({ id: 'tx-1' }) },
        };
        return callback(tx);
      });

      await service.deductCredits('user-1', '/api/ai/generate');

      expect(cache.delSimple).toHaveBeenCalledWith('credits:balance:user-1');
      expect(cache.invalidateTags).toHaveBeenCalledWith(['user:user-1']);
    });
  });

  // ==========================================================================
  // addCredits
  // ==========================================================================

  describe('addCredits', () => {
    it('should add credits and create transaction record', async () => {
      const mockTransaction = { id: 'tx-2', amount: 100 };
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({
              aiCredits: 50,
              aiCreditsPurchased: 50,
              email: 'test@luneo.app',
            }),
            update: jest.fn().mockResolvedValue({ aiCredits: 150 }),
          },
          creditTransaction: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
        };
        return callback(tx);
      });

      const result = await service.addCredits('user-1', 100, 'pack-1', 'sess-1');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
    });

    it('should throw BadRequestException for negative amount', async () => {
      await expect(
        service.addCredits('user-1', -10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for zero amount', async () => {
      await expect(
        service.addCredits('user-1', 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should be idempotent for duplicate Stripe sessions', async () => {
      const existingTransaction = { id: 'tx-existing', amount: 100 };
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({
                aiCredits: 150,
                aiCreditsPurchased: 150,
                email: 'test@luneo.app',
              })
              .mockResolvedValueOnce({ aiCredits: 150 }),
            update: jest.fn(),
          },
          creditTransaction: {
            findFirst: jest.fn().mockResolvedValue(existingTransaction),
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await service.addCredits('user-1', 100, 'pack-1', 'duplicate-session');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
      // Should NOT call user.update or creditTransaction.create
    });

    it('should throw when user not found', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
          creditTransaction: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        service.addCredits('nonexistent', 100),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==========================================================================
  // getBalance
  // ==========================================================================

  describe('getBalance', () => {
    it('should return balance, purchased and used counts', async () => {
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        aiCredits: 100,
        aiCreditsPurchased: 200,
        aiCreditsUsed: 100,
      });

      const result = await service.getBalance('user-1');

      expect(result.balance).toBe(100);
      expect(result.purchased).toBe(200);
      expect(result.used).toBe(100);
    });

    it('should return zeros when user not found', async () => {
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getBalance('nonexistent');

      expect(result.balance).toBe(0);
      expect(result.purchased).toBe(0);
      expect(result.used).toBe(0);
    });
  });

  // ==========================================================================
  // getTransactionHistory
  // ==========================================================================

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const mockTransactions = [
        { id: 'tx-1', amount: -5, type: 'usage', createdAt: new Date() },
        { id: 'tx-2', amount: 100, type: 'purchase', createdAt: new Date() },
      ];
      (prisma.creditTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.creditTransaction.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getTransactionHistory('user-1', 50, 0);

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should respect limit and offset parameters', async () => {
      (prisma.creditTransaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.creditTransaction.count as jest.Mock).mockResolvedValue(100);

      await service.getTransactionHistory('user-1', 10, 20);

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        }),
      );
    });
  });

  // ==========================================================================
  // getAvailablePacks
  // ==========================================================================

  describe('getAvailablePacks', () => {
    it('should return active packs ordered by featured then credits', async () => {
      const mockPacks = [
        { id: 'pack-1', name: 'Starter', credits: 100, isFeatured: true },
        { id: 'pack-2', name: 'Pro', credits: 500, isFeatured: false },
      ];
      cache.get.mockImplementation(async (_key, _tag, fetchFn) => {
        if (fetchFn) return fetchFn();
        return null;
      });
      (prisma.creditPack.findMany as jest.Mock).mockResolvedValue(mockPacks);

      const result = await service.getAvailablePacks();

      expect(result).toHaveLength(2);
      expect(prisma.creditPack.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });
  });

  // ==========================================================================
  // refundCredits
  // ==========================================================================

  describe('refundCredits', () => {
    it('should refund credits and create transaction record', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({ aiCredits: 50 }),
            update: jest.fn().mockResolvedValue({ aiCredits: 60 }),
          },
          creditTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'tx-refund', amount: 10 }),
          },
        };
        return callback(tx);
      });

      const result = await service.refundCredits('user-1', 10, 'Duplicate charge');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(60);
    });

    it('should throw BadRequestException for negative refund', async () => {
      await expect(
        service.refundCredits('user-1', -5, 'Invalid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for zero refund', async () => {
      await expect(
        service.refundCredits('user-1', 0, 'Invalid'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
