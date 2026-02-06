/**
 * Chaos Engineering Tests - Network Latency
 * Tests API response times and timeout handling
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';

describeIntegration('Chaos Engineering - Network Latency', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createIntegrationTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  describe('API Response Time', () => {
    it('should respond to health check within reasonable time', async () => {
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/v1/health');
      const duration = Date.now() - startTime;

      // Allow more time for first request (app warmup) - should be < 2000ms
      expect(duration).toBeLessThan(2000);
      expect(response.status).toBe(200);
    });

    it('should maintain acceptable response time for auth endpoints', async () => {
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test',
        });
      const duration = Date.now() - startTime;

      // Auth should respond within 2 seconds (includes bcrypt hashing)
      expect(duration).toBeLessThan(2000);
      expect([401]).toContain(response.status);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent health checks', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app.getHttpServer()).get('/api/v1/health')
      );

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
    });

    it('should handle sequential auth requests', async () => {
      // Sequential to avoid ECONNRESET with concurrent bcrypt operations
      const requestCount = 3;
      const startTime = Date.now();
      const results: number[] = [];

      for (let i = 0; i < requestCount; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: `sequential-${i}@example.com`,
            password: 'test',
          });
        results.push(response.status);
      }

      const duration = Date.now() - startTime;

      // All should respond (not hang)
      results.forEach(status => {
        expect([401, 429]).toContain(status);
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(15000);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle database queries efficiently', async () => {
      await prisma.user.deleteMany({});
      
      // Create some test data
      await Promise.all(
        Array(10).fill(null).map((_, i) =>
          prisma.user.create({
            data: {
              email: `perf-${Date.now()}-${i}@example.com`,
              firstName: `User${i}`,
              lastName: 'Test',
            },
          })
        )
      );

      const startTime = Date.now();
      const users = await prisma.user.findMany();
      const duration = Date.now() - startTime;

      expect(users.length).toBeGreaterThanOrEqual(10);
      expect(duration).toBeLessThan(2000); // Should be < 2000ms
    });
  });

  describe('Timeout Resilience', () => {
    it('should not hang on malformed requests', async () => {
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send('invalid-json');
      const duration = Date.now() - startTime;

      // Should respond quickly with error
      expect(duration).toBeLessThan(1000);
      expect([400, 415]).toContain(response.status);
    });
  });
});
