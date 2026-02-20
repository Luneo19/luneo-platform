/**
 * CronJobsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CronJobsService } from './cron-jobs.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import { CreditsService } from '@/libs/credits/credits.service';

describe('CronJobsService', () => {
  let service: CronJobsService;
  const mockPrisma = {
    design: { count: jest.fn(), findMany: jest.fn() },
    order: { count: jest.fn(), aggregate: jest.fn() },
    user: { count: jest.fn(), findMany: jest.fn() },
    refreshToken: { deleteMany: jest.fn() },
    designVersion: { count: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
    notification: { deleteMany: jest.fn() },
    auditLog: { deleteMany: jest.fn() },
  };
  const mockConfigService = { get: jest.fn() };
  const mockEmailService = { sendEmail: jest.fn(), queueEmail: jest.fn().mockResolvedValue({ jobId: 'test-job' }) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: CreditsService, useValue: { getBalance: jest.fn().mockResolvedValue(100), deduct: jest.fn().mockResolvedValue(undefined), refill: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();
    service = module.get<CronJobsService>(CronJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAnalyticsDigest', () => {
    it('should return success with digest', async () => {
      mockPrisma.design.count.mockResolvedValue(10);
      mockPrisma.order.count.mockResolvedValue(5);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalCents: 10000 } });
      mockPrisma.user.count.mockResolvedValue(3);
      mockPrisma.user.findMany.mockResolvedValue([{ email: 'admin@test.com' }]);
      const result = await service.generateAnalyticsDigest() as unknown;
      expect(result.success).toBe(true);
      expect(result.digest.metrics.designs.count).toBe(10);
      expect(result.digest.metrics.orders.revenue).toBe(100);
    });

    it('should queue emails to platform admins', async () => {
      mockPrisma.design.count.mockResolvedValue(0);
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalCents: 0 } });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'admin1@test.com' },
        { email: 'admin2@test.com' },
      ]);
      await service.generateAnalyticsDigest();
      expect(mockEmailService.queueEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanupOldData', () => {
    it('should return success with results', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.design.findMany.mockResolvedValue([]);
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.cleanupOldData();
      expect(result.success).toBe(true);
      expect(result.results.oldRefreshTokens).toBe(2);
      expect(result.results.oldNotifications).toBe(5);
    });
  });
});
