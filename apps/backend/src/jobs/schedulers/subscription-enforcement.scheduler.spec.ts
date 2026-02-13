/**
 * SubscriptionEnforcementScheduler Unit Tests
 * Tests grace period enforcement: readOnlyMode when gracePeriodEndsAt has passed
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SubscriptionEnforcementScheduler } from './subscription-enforcement.scheduler';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';

describe('SubscriptionEnforcementScheduler', () => {
  let scheduler: SubscriptionEnforcementScheduler;
  const mockPrisma = {
    brand: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const mockEmailService = { sendEmail: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue('https://app.luneo.app') };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionEnforcementScheduler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    scheduler = module.get<SubscriptionEnforcementScheduler>(SubscriptionEnforcementScheduler);
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('activateReadOnlyMode (enforceSubscription)', () => {
    it('should set readOnlyMode = true when gracePeriodEndsAt < now', async () => {
      mockPrisma.brand.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.brand.findMany.mockResolvedValue([]); // sendGraceReminders

      await scheduler.enforceSubscription();

      expect(mockPrisma.brand.updateMany).toHaveBeenCalledWith({
        where: {
          gracePeriodEndsAt: { not: null, lt: expect.any(Date) },
          readOnlyMode: false,
        },
        data: { readOnlyMode: true },
      });
    });

    it('should not throw when no brands need updating', async () => {
      mockPrisma.brand.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.brand.findMany.mockResolvedValue([]); // sendGraceReminders iterates over this

      await expect(scheduler.enforceSubscription()).resolves.toBeUndefined();
      expect(mockPrisma.brand.updateMany).toHaveBeenCalled();
    });
  });
});
