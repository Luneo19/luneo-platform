import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BruteForceService } from './brute-force.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('BruteForceService', () => {
  let service: BruteForceService;
  let redisService: RedisOptimizedService;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BruteForceService,
        {
          provide: RedisOptimizedService,
          useValue: {
            client: mockRedis,
          },
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BruteForceService>(BruteForceService);
    redisService = module.get<RedisOptimizedService>(RedisOptimizedService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canAttempt', () => {
    it('should allow attempt when no previous attempts', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.canAttempt('test@example.com', '127.0.0.1');
      
      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalled();
    });

    it('should allow attempt when under limit', async () => {
      mockRedis.get.mockResolvedValue('3'); // 3 attempts, limit is 5

      const result = await service.canAttempt('test@example.com', '127.0.0.1');
      
      expect(result).toBe(true);
    });

    it('should block attempt when at limit', async () => {
      mockRedis.get.mockResolvedValue('5'); // 5 attempts, limit is 5
      mockRedis.ttl.mockResolvedValue(900);

      const result = await service.canAttempt('test@example.com', '127.0.0.1');
      
      expect(result).toBe(false);
    });

    it('should allow attempt when Redis unavailable (degraded mode)', async () => {
      const moduleWithoutRedis: TestingModule = await Test.createTestingModule({
        providers: [
          BruteForceService,
          {
            provide: RedisOptimizedService,
            useValue: {
              client: null, // Redis unavailable
            },
          },
          {
            provide: ConfigService,
            useValue: {},
          },
        ],
      }).compile();

      const serviceWithoutRedis = moduleWithoutRedis.get<BruteForceService>(BruteForceService);
      const result = await serviceWithoutRedis.canAttempt('test@example.com', '127.0.0.1');
      
      expect(result).toBe(true); // Should allow in degraded mode
    });
  });

  describe('recordFailedAttempt', () => {
    it('should record failed attempt', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      await service.recordFailedAttempt('test@example.com', '127.0.0.1');
      
      expect(mockRedis.incr).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), 900);
    });

    it('should set expiration on first attempt', async () => {
      mockRedis.incr.mockResolvedValue(1);

      await service.recordFailedAttempt('test@example.com', '127.0.0.1');
      
      expect(mockRedis.expire).toHaveBeenCalled();
    });
  });

  describe('resetAttempts', () => {
    it('should reset attempts after successful login', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.resetAttempts('test@example.com', '127.0.0.1');
      
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time', async () => {
      mockRedis.ttl.mockResolvedValue(600); // 10 minutes

      const result = await service.getRemainingTime('test@example.com', '127.0.0.1');
      
      expect(result).toBe(600);
    });

    it('should return 0 when no lock', async () => {
      mockRedis.ttl.mockResolvedValue(-2); // Key doesn't exist

      const result = await service.getRemainingTime('test@example.com', '127.0.0.1');
      
      expect(result).toBe(0);
    });
  });

  describe('checkAndThrow', () => {
    it('should throw when too many attempts', async () => {
      mockRedis.get.mockResolvedValue('5');
      mockRedis.ttl.mockResolvedValue(600);

      await expect(
        service.checkAndThrow('test@example.com', '127.0.0.1')
      ).rejects.toThrow(HttpException);
    });

    it('should not throw when attempts allowed', async () => {
      mockRedis.get.mockResolvedValue('3');

      await expect(
        service.checkAndThrow('test@example.com', '127.0.0.1')
      ).resolves.not.toThrow();
    });
  });
});
