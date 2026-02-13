import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreditsController } from '../credits.controller';
import { CreditsService } from '@/libs/credits/credits.service';
import { BillingService } from '@/modules/billing/billing.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { UserRole } from '@prisma/client';

describe('CreditsController', () => {
  let controller: CreditsController;

  const mockCreditsService = {
    getBalance: jest.fn(),
    addCredits: jest.fn(),
    getAvailablePacks: jest.fn(),
    getTransactionHistory: jest.fn(),
    checkCredits: jest.fn(),
  };

  const mockBillingService = {};
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'stripe.secretKey') return 'sk_test_xxx';
      if (key === 'app.frontendUrl') return 'http://localhost:3000';
      return undefined;
    }),
  };

  const mockPrisma = {
    creditPack: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const currentUser: CurrentUser = {
    id: 'user-1',
    email: 'user@test.com',
    role: UserRole.CONSUMER,
    brandId: null,
  };

  const mockRequest = (user: CurrentUser = currentUser) =>
    ({ user } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditsController],
      providers: [
        { provide: CreditsService, useValue: mockCreditsService },
        { provide: BillingService, useValue: mockBillingService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<CreditsController>(CreditsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return balance for current user', async () => {
      mockCreditsService.getBalance.mockResolvedValue({ balance: 100 });
      const result = await controller.getBalance(mockRequest());
      expect(result).toEqual({ balance: 100 });
      expect(mockCreditsService.getBalance).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getPacks', () => {
    it('should return available credit packs', async () => {
      const packs = [{ id: 'p1', credits: 100, priceCents: 999 }];
      mockCreditsService.getAvailablePacks.mockResolvedValue(packs);
      const result = await controller.getPacks();
      expect(result).toEqual(packs);
      expect(mockCreditsService.getAvailablePacks).toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('should return transaction history for user', async () => {
      const tx = [{ id: 't1', amount: 100 }];
      mockCreditsService.getTransactionHistory.mockResolvedValue(tx);
      const result = await controller.getTransactions(
        mockRequest(),
        { limit: 50, offset: 0 } as any,
      );
      expect(result).toEqual(tx);
      expect(mockCreditsService.getTransactionHistory).toHaveBeenCalledWith(
        'user-1',
        50,
        0,
      );
    });
  });

  describe('checkCredits', () => {
    it('should return check result for endpoint', async () => {
      mockCreditsService.checkCredits.mockResolvedValue({
        sufficient: true,
        balance: 50,
        required: 1,
      });
      const result = await controller.checkCredits(mockRequest(), {
        endpoint: 'design.generate',
        amount: 1,
      } as any);
      expect(result.sufficient).toBe(true);
      expect(mockCreditsService.checkCredits).toHaveBeenCalledWith(
        'user-1',
        'design.generate',
        1,
      );
    });
  });

  describe('getAdminPacks', () => {
    it('should return all packs for admin', async () => {
      const packs = [{ id: 'p1', credits: 100 }];
      mockPrisma.creditPack.findMany.mockResolvedValue(packs);
      const result = await controller.getAdminPacks();
      expect(result).toEqual(packs);
      expect(mockPrisma.creditPack.findMany).toHaveBeenCalledWith({
        orderBy: [{ credits: 'asc' }],
      });
    });
  });
});
