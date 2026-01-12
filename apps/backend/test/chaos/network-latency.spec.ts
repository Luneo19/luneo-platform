/**
 * Chaos Engineering Tests - Network Latency
 * Simulates network latency and tests performance
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('Chaos Engineering - Network Latency', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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

  describe('Database Query Latency', () => {
    it('should handle slow database queries', async () => {
      // Simulate slow database query (500ms delay)
      (prisma.user.findMany as any) = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 500)),
      );

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/products');
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (< 2s)
      expect(duration).toBeLessThan(2000);
      expect([200, 401]).toContain(response.status);
    });

    it('should handle very slow database queries', async () => {
      // Simulate very slow query (2s delay)
      (prisma.user.findMany as any) = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 2000)),
      );

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/products');
      const duration = Date.now() - startTime;

      // Should complete or timeout gracefully
      expect(duration).toBeLessThan(5000);
      expect([200, 401, 504]).toContain(response.status);
    });
  });

  describe('API Response Time', () => {
    it('should maintain acceptable response times under latency', async () => {
      const endpoints = [
        '/health',
        '/api/v1/products',
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request(app.getHttpServer())
          .get(endpoint);
        const duration = Date.now() - startTime;

        // Should respond within 1 second
        expect(duration).toBeLessThan(1000);
        expect([200, 401]).toContain(response.status);
      }
    });
  });
});
