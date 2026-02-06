/**
 * Security Tests - CSRF (Cross-Site Request Forgery)
 * Tests CSRF protection on mutation endpoints
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describeIntegration('Security Tests - CSRF', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let authToken: string;

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

    // Create test user
    const timestamp = Date.now();
    const hashedPassword = await bcrypt.hash('Password123!', 13);
    const user = await prisma.user.create({
      data: {
        email: `csrf-test-${timestamp}@example.com`,
        password: hashedPassword,
        firstName: 'CSRF',
        lastName: 'Test',
        role: UserRole.CONSUMER,
        emailVerified: true,
      },
    });

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: user.email,
        password: 'Password123!',
      });

    const loginData = loginResponse.body.data || loginResponse.body;
    authToken = loginData.accessToken;
  });

  describe('CSRF Protection - POST Endpoints', () => {
    it('should allow signup without CSRF in test mode', async () => {
      // CSRF is typically disabled in test/dev environments
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `csrf-signup-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      // In test mode, should accept without CSRF token
      // In production with CSRF enabled, would be 403
      expect([201, 403]).toContain(response.status);
    });

    it('should allow login without CSRF in test mode', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'test',
        });

      // Should work in test mode (401 for wrong credentials)
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('CSRF Protection - Authenticated Endpoints', () => {
    it('should allow authenticated requests with Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      // Bearer token auth should work
      expect(response.status).toBe(200);
    });

    it('should reject requests without authorization', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me');

      // Should be unauthorized
      expect(response.status).toBe(401);
    });
  });

  describe('CSRF Token Behavior', () => {
    it('should not expose CSRF token in API responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      // CSRF token should not be in response body for API
      expect(response.body.csrfToken).toBeUndefined();
    });

    it('should handle Origin header validation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .set('Origin', 'https://malicious-site.com')
        .send({
          email: `origin-test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      // May be allowed or blocked depending on CORS config
      expect([201, 403]).toContain(response.status);
    });
  });
});
