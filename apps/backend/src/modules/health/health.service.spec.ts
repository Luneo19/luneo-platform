/**
 * HealthService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaService;
  let redis: RedisOptimizedService;
  let configService: ConfigService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  const mockRedis = {
    healthCheck: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisOptimizedService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisOptimizedService>(RedisOptimizedService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEnrichedHealth', () => {
    it('should return ok when all dependencies are healthy', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedis.healthCheck.mockResolvedValue(true);
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'stripe.secretKey') return 'sk_test_xxx';
        if (key === 'email.sendgridApiKey') return 'SG.xxx';
        return undefined;
      });

      const result = await service.getEnrichedHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('luneo-backend');
      expect(result.dependencies.database.status).toBe('ok');
      expect(result.dependencies.redis.status).toBe('ok');
      expect(result.dependencies.stripe.status).toBe('ok');
      expect(result.dependencies.email.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return unavailable when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
      mockRedis.healthCheck.mockResolvedValue(true);
      mockConfigService.get.mockReturnValue('sk_test_xxx');

      const result = await service.getEnrichedHealth();

      expect(result.status).toBe('unavailable');
      expect(result.dependencies.database.status).toBe('unavailable');
      expect(result.dependencies.database.message).toContain('Service unavailable');
    });

    it('should return degraded when Redis fails', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedis.healthCheck.mockRejectedValue(new Error('Redis not available'));
      mockConfigService.get.mockReturnValue('sk_test_xxx');

      const result = await service.getEnrichedHealth();

      expect(result.status).toBe('degraded');
      expect(result.dependencies.redis.status).toBe('degraded');
    });

    it('should return degraded when Stripe is not configured', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedis.healthCheck.mockResolvedValue(true);
      mockConfigService.get.mockReturnValue(undefined);
      const envBackup = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const result = await service.getEnrichedHealth();

      expect(result.dependencies.stripe.status).toBe('degraded');
      if (envBackup !== undefined) process.env.STRIPE_SECRET_KEY = envBackup;
    });
  });
});
