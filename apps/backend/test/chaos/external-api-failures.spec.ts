/**
 * Chaos Engineering Tests - External API Failures
 * Tests resilience when external services are mocked/unavailable
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describeIntegration('Chaos Engineering - External API Failures', () => {
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

  describe('Email Service Failure Handling', () => {
    it('should handle signup when email service is mocked', async () => {
      // Email service is mocked in test - should not prevent signup
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `email-mock-${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Email',
          lastName: 'Mock',
        });

      // Should succeed even with mocked email service
      expect(response.status).toBe(201);
    });

    it('should handle forgot password when email service is mocked', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `forgot-mock-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Forgot',
          lastName: 'Mock',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          email: `forgot-mock-${timestamp}@example.com`,
        });

      // Should succeed even with mocked email service
      expect(response.status).toBe(200);
    });
  });

  describe('Cache Service Failure Handling', () => {
    it('should work with mocked Redis service', async () => {
      // Redis is mocked in test
      const response = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(response.status).toBe(200);
    });

    it('should complete auth flow with mocked cache', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `cache-mock-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Cache',
          lastName: 'Mock',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `cache-mock-${timestamp}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Queue Service Failure Handling', () => {
    it('should handle operations with mocked Bull queues', async () => {
      // All Bull queues are mocked in test
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `queue-mock-${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Queue',
          lastName: 'Mock',
        });

      // Should work with mocked queues
      expect(response.status).toBe(201);
    });
  });

  describe('Graceful Degradation', () => {
    it('should maintain core functionality with mocked services', async () => {
      // Test that core auth flow works with all mocked external services
      const timestamp = Date.now();

      // Signup
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `degrade-${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Degrade',
          lastName: 'Test',
        });

      expect(signupResponse.status).toBe(201);

      // Wait for unique token
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `degrade-${timestamp}@example.com`,
          password: 'TestPassword123!',
        });

      expect(loginResponse.status).toBe(200);

      const loginData = loginResponse.body.data || loginResponse.body;
      
      // Authenticated request
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginData.accessToken}`);

      expect(meResponse.status).toBe(200);
    });
  });

  describe('Error Recovery', () => {
    it('should not crash on repeated operations', async () => {
      const operations = 5;
      const results: number[] = [];

      for (let i = 0; i < operations; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: `recovery-${Date.now()}-${i}@example.com`,
            password: 'TestPassword123!',
            firstName: `Recovery${i}`,
            lastName: 'Test',
          });

        results.push(response.status);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // All should succeed or fail predictably (not crash)
      results.forEach(status => {
        expect([201, 429]).toContain(status);
      });
    });
  });
});
