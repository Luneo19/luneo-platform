/**
 * Chaos Engineering Tests - Redis Downtime
 * Simulates Redis downtime and tests resilience
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

describe('Chaos Engineering - Redis Downtime', () => {
  let app: INestApplication;
  let redis: RedisOptimizedService;
  let originalGet: any;
  let originalSet: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    redis = moduleFixture.get<RedisOptimizedService>(RedisOptimizedService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Save original methods
    originalGet = redis.get;
    originalSet = redis.set;
  });

  afterEach(() => {
    // Restore original methods
    if (originalGet) {
      redis.get = originalGet;
    }
    if (originalSet) {
      redis.set = originalSet;
    }
  });

  describe('Redis Connection Failure', () => {
    it('should handle Redis connection failure gracefully', async () => {
      // Simulate Redis failure
      redis.get = jest.fn().mockRejectedValue(new Error('Redis connection failed'));
      redis.set = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

      // Application should continue working (degraded mode)
      const response = await request(app.getHttpServer())
        .get('/health');

      // Should return 200 (degraded mode)
      expect(response.status).toBe(200);
    });

    it('should work without cache when Redis is down', async () => {
      // Simulate Redis failure
      redis.get = jest.fn().mockResolvedValue(null);
      redis.set = jest.fn().mockRejectedValue(new Error('Redis unavailable'));

      // API should still work (without cache)
      const response = await request(app.getHttpServer())
        .get('/api/v1/products');

      // Should return 200 or 401 (not 500)
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Redis Rate Limit', () => {
    it('should handle Redis rate limit gracefully', async () => {
      // Simulate Redis rate limit
      redis.get = jest.fn().mockRejectedValue(
        new Error('ERR max requests limit exceeded'),
      );

      // Application should continue (degraded mode)
      const response = await request(app.getHttpServer())
        .get('/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Redis Recovery', () => {
    it('should recover after Redis reconnection', async () => {
      // Simulate Redis failure
      redis.get = jest.fn().mockRejectedValueOnce(
        new Error('Redis connection lost'),
      );

      // First request should work (degraded mode)
      const degradedResponse = await request(app.getHttpServer())
        .get('/api/v1/products');
      
      expect([200, 401]).toContain(degradedResponse.status);

      // Restore Redis
      redis.get = jest.fn().mockResolvedValue(null);

      // Second request should work normally
      const normalResponse = await request(app.getHttpServer())
        .get('/api/v1/products');

      expect([200, 401]).toContain(normalResponse.status);
    });
  });
});
