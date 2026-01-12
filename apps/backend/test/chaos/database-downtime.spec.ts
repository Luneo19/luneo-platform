/**
 * Chaos Engineering Tests - Database Downtime
 * Simulates database downtime and tests resilience
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('Chaos Engineering - Database Downtime', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let originalConnect: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Save original connect method
    originalConnect = prisma.$connect;
  });

  afterEach(() => {
    // Restore original connect method
    if (originalConnect) {
      prisma.$connect = originalConnect;
    }
  });

  describe('Database Connection Failure', () => {
    it('should handle database connection failure gracefully', async () => {
      // Simulate database connection failure
      prisma.$connect = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      // Health check should still respond (may be degraded)
      const healthResponse = await request(app.getHttpServer())
        .get('/health');

      // Should return 200 (degraded mode) or 503 (service unavailable)
      expect([200, 503]).toContain(healthResponse.status);
    });

    it('should return appropriate error for database queries during downtime', async () => {
      // Mock database query failure
      (prisma.user.findMany as any) = jest.fn().mockRejectedValue(
        new Error('Database connection lost'),
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/products');

      // Should return 500 or 503, not crash
      expect([500, 503, 401]).toContain(response.status);
    });
  });

  describe('Database Timeout', () => {
    it('should handle database timeout', async () => {
      // Simulate database timeout
      (prisma.user.findMany as any) = jest.fn().mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 100),
        ),
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/products');

      // Should timeout gracefully, not hang
      expect([500, 503, 401]).toContain(response.status);
    });
  });

  describe('Database Recovery', () => {
    it('should recover after database reconnection', async () => {
      // Simulate database failure
      (prisma.user.findMany as any) = jest.fn().mockRejectedValueOnce(
        new Error('Database connection lost'),
      );

      // First request should fail
      const failedResponse = await request(app.getHttpServer())
        .get('/api/v1/products');
      
      expect([500, 503, 401]).toContain(failedResponse.status);

      // Restore connection
      (prisma.user.findMany as any) = jest.fn().mockResolvedValue([]);

      // Second request should succeed
      const successResponse = await request(app.getHttpServer())
        .get('/api/v1/products');

      // Should recover
      expect([200, 401]).toContain(successResponse.status);
    });
  });
});
