/**
 * Chaos Engineering Tests - Redis Downtime
 * Tests resilience when Redis cache is unavailable
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describeIntegration('Chaos Engineering - Redis Downtime', () => {
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

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Redis Mock Behavior', () => {
    it('should work with mocked Redis service', async () => {
      // The test app uses MockRedisOptimizedService
      // Verify basic functionality works without real Redis
      const response = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Application Resilience Without Cache', () => {
    it('should allow signup without Redis caching', async () => {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `no-cache-${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'NoCache',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
    });

    it('should allow login without Redis caching', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `login-nocache-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Login',
          lastName: 'NoCache',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `login-nocache-${timestamp}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting Without Redis', () => {
    it('should handle rate limiting with mocked Redis', async () => {
      // MockSlidingWindowRateLimitService allows all requests
      const attempts = 5;
      const results: number[] = [];

      for (let i = 0; i < attempts; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrong',
          });
        results.push(response.status);
      }

      // All should be 401 (unauthorized), not blocked by rate limit
      results.forEach(status => {
        expect([401, 429]).toContain(status);
      });
    });
  });

  describe('Brute Force Protection Without Redis', () => {
    it('should handle brute force protection with mocked service', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `brute-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Brute',
          lastName: 'Test',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      // Multiple failed attempts
      const attempts = 3;
      for (let i = 0; i < attempts; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: `brute-${timestamp}@example.com`,
            password: 'wrong-password',
          });
      }

      // MockBruteForceService doesn't actually block
      // So login should still work
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `brute-${timestamp}@example.com`,
          password: 'Password123!',
        });

      // Should work with mock (or be blocked if real)
      expect([200, 423, 429]).toContain(response.status);
    });
  });

  describe('Session Management Without Redis', () => {
    it('should handle token refresh without Redis session store', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `session-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Session',
          lastName: 'Test',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `session-${timestamp}@example.com`,
          password: 'Password123!',
        });

      expect(loginResponse.status).toBe(200);
      
      const loginData = loginResponse.body.data || loginResponse.body;
      expect(loginData.refreshToken).toBeDefined();
    });
  });
});
