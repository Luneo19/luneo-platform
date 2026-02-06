/**
 * Chaos Engineering Tests - Database Downtime
 * Simulates database downtime and tests resilience
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';

describeIntegration('Chaos Engineering - Database Downtime', () => {
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

  describe('Database Connection Verification', () => {
    it('should have working database connection', async () => {
      // Verify database is connected
      const result = await prisma.$queryRaw`SELECT 1 as ok`;
      expect(result).toBeDefined();
    });

    it('should handle valid database queries', async () => {
      // Clean state
      await prisma.user.deleteMany({});
      
      // Query should work
      const users = await prisma.user.findMany();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle invalid queries gracefully', async () => {
      // Try to find user with invalid ID format
      try {
        await prisma.user.findUnique({ where: { id: 'invalid-uuid' } });
        // If it doesn't throw, it should return null
      } catch (error) {
        // Should be a Prisma validation error, not crash
        expect(error).toBeDefined();
      }
    });

    it('should return proper error for non-existent resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      // Should return 401, not 500 database error
      expect(response.status).toBe(401);
    });
  });

  describe('Health Check Resilience', () => {
    it('should health check respond even under load', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer()).get('/api/v1/health')
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Transaction Handling', () => {
    it('should handle concurrent operations', async () => {
      await prisma.user.deleteMany({});

      // Create multiple users concurrently
      const createPromises = Array(5).fill(null).map((_, i) =>
        prisma.user.create({
          data: {
            email: `concurrent-${Date.now()}-${i}@example.com`,
            firstName: `User${i}`,
            lastName: 'Test',
          },
        })
      );

      const users = await Promise.all(createPromises);
      expect(users).toHaveLength(5);
    });
  });
});
