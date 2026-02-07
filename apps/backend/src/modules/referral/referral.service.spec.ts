/**
 * ReferralService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('ReferralService', () => {
  let service: ReferralService;
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    referral: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    referralApplication: { upsert: jest.fn() },
    commission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    withdrawal: { create: jest.fn() },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'app.frontendUrl': 'https://app.test.com',
        SENDGRID_API_KEY: '',
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getStats', () => {
    it('should throw BadRequestException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getStats('nonexistent')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getStats('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });

    it('should return stats with referral code and link', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        createdAt: new Date(),
      });
      mockPrisma.referral.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.referral.create.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'user-1',
        referralCode: 'REF-USER1000',
        status: 'PENDING',
      });

      const result = await service.getStats('user-1');

      expect(result.totalReferrals).toBeDefined();
      expect(result.activeReferrals).toBeDefined();
      expect(result.totalEarnings).toBeDefined();
      expect(result.pendingEarnings).toBeDefined();
      expect(result.referralCode).toBeDefined();
      expect(result.referralLink).toContain('signup?ref=');
      expect(result.recentReferrals).toBeDefined();
    });
  });

  describe('join', () => {
    it('should return success and persist application', async () => {
      mockPrisma.referralApplication.upsert.mockResolvedValue({});

      const result = await service.join('affiliate@test.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Demande envoyée avec succès');
      expect(mockPrisma.referralApplication.upsert).toHaveBeenCalledWith({
        where: { email: 'affiliate@test.com' },
        update: { status: 'pending', appliedAt: expect.any(Date) },
        create: expect.objectContaining({
          email: 'affiliate@test.com',
          status: 'pending',
        }),
      });
    });
  });

  describe('withdraw', () => {
    it('should throw BadRequestException when minimum not reached', async () => {
      mockPrisma.commission.findMany.mockResolvedValue([]);

      await expect(service.withdraw('user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.withdraw('user-1')).rejects.toThrow(
        'Montant minimum de retrait non atteint',
      );
      expect(mockPrisma.withdrawal.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has no IBAN', async () => {
      mockPrisma.commission.findMany.mockResolvedValue([
        { id: 'c1', amountCents: 10000, status: 'PENDING' },
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'u@test.com',
        userProfile: { iban: null, bic: null, bankName: null },
      });

      await expect(service.withdraw('user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.withdraw('user-1')).rejects.toThrow(
        'Veuillez configurer vos informations bancaires',
      );
    });

    it('should create withdrawal when eligible', async () => {
      mockPrisma.commission.findMany.mockResolvedValue([
        { id: 'c1', amountCents: 10000, status: 'PENDING' },
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'u@test.com',
        userProfile: { iban: 'FR761234567890', bic: null, bankName: null },
      });
      mockPrisma.withdrawal.create.mockResolvedValue({
        id: 'wd-1',
        userId: 'user-1',
        amountCents: 10000,
        status: 'PENDING',
      });
      mockPrisma.commission.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.withdraw('user-1');

      expect(result.withdrawalId).toBe('wd-1');
      expect(result.amount).toBe(100);
      expect(result.status).toBe('pending');
      expect(result.message).toContain('Demande de retrait');
      expect(mockPrisma.withdrawal.create).toHaveBeenCalled();
    });
  });

  describe('recordReferral', () => {
    it('should return null for invalid referral code', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await service.recordReferral('new-user-id', 'INVALID-CODE');

      expect(result).toBeNull();
    });

    it('should return null when user refers themselves', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'user-1',
        referredUserId: null,
        status: 'PENDING',
      });

      const result = await service.recordReferral('user-1', 'REF-USER1',);

      expect(result).toBeNull();
    });

    it('should update referral and return when valid', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
        referredUserId: null,
        status: 'PENDING',
      });
      mockPrisma.referral.update.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
      });

      const result = await service.recordReferral('referred-user-id', 'REF-REFERRER1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('ref-1');
      expect(result!.referrerId).toBe('referrer-1');
      expect(mockPrisma.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        data: expect.objectContaining({
          referredUserId: 'referred-user-id',
          status: 'ACTIVE',
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('createCommissionFromOrder', () => {
    it('should return null when no active referral for user', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(null);

      const result = await service.createCommissionFromOrder(
        'order-1',
        'user-1',
        10000,
        10,
      );

      expect(result).toBeNull();
      expect(mockPrisma.commission.create).not.toHaveBeenCalled();
    });

    it('should create commission when active referral exists', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
      });
      mockPrisma.commission.findFirst.mockResolvedValue(null);
      mockPrisma.commission.create.mockResolvedValue({
        id: 'comm-1',
        amountCents: 1000,
      });

      const result = await service.createCommissionFromOrder(
        'order-1',
        'referred-user-1',
        10000,
        10,
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe('comm-1');
      expect(result!.amountCents).toBe(1000);
      expect(mockPrisma.commission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referralId: 'ref-1',
          userId: 'referrer-1',
          orderId: 'order-1',
          amountCents: 1000,
          percentage: 10,
          status: 'PENDING',
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('approveCommission', () => {
    it('should update commission to APPROVED', async () => {
      mockPrisma.commission.update.mockResolvedValue({
        id: 'comm-1',
        status: 'APPROVED',
      });

      const result = await service.approveCommission('comm-1');

      expect(result.id).toBe('comm-1');
      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.commission.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: expect.objectContaining({ status: 'APPROVED' }),
        select: expect.any(Object),
      });
    });
  });

  describe('markCommissionAsPaid', () => {
    it('should update commission to PAID', async () => {
      mockPrisma.commission.update.mockResolvedValue({
        id: 'comm-1',
        status: 'PAID',
      });

      const result = await service.markCommissionAsPaid('comm-1');

      expect(result.id).toBe('comm-1');
      expect(result.status).toBe('PAID');
    });
  });
});
