/**
 * Security Tests - Authentication Bypass
 * Tests for authentication bypass vulnerabilities
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describeIntegration('Security Tests - Authentication Bypass', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let consumerToken: string;
  let adminToken: string;

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
    await prisma.order.deleteMany({});
    await prisma.design.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});

    const timestamp = Date.now();
    const hashedPassword = await bcrypt.hash('Password123!', 13);

    // Create consumer user
    const consumer = await prisma.user.create({
      data: {
        email: `consumer-${timestamp}@example.com`,
        password: hashedPassword,
        firstName: 'Consumer',
        lastName: 'User',
        role: UserRole.CONSUMER,
        emailVerified: true,
      },
    });

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: `admin-${timestamp}@example.com`,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.PLATFORM_ADMIN,
        emailVerified: true,
      },
    });

    // Login as consumer
    const consumerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: consumer.email, password: 'Password123!' });
    consumerToken = (consumerLogin.body.data || consumerLogin.body).accessToken;

    // Wait for different timestamp
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'Password123!' });
    adminToken = (adminLogin.body.data || adminLogin.body).accessToken;
  }, 30000);

  describe('Authentication Bypass - Protected Endpoints', () => {
    it('should require authentication for /auth/me', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should require authentication for admin endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/customers');

      expect(response.status).toBe(401);
    });
  });

  describe('Authentication Bypass - Invalid Tokens', () => {
    it('should reject completely invalid tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'not-a-jwt',
        '12345',
      ];

      for (const token of invalidTokens) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });

    it('should reject malformed JWT tokens', async () => {
      const malformedTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.fake',
      ];

      for (const token of malformedTokens) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });

    it('should reject tokens with wrong signature', async () => {
      // JWT with valid structure but wrong signature
      const wrongSignatureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.wrong-signature';

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${wrongSignatureToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Authentication Bypass - Role Bypass', () => {
    it('should prevent consumer from accessing admin endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/customers')
        .set('Authorization', `Bearer ${consumerToken}`);

      // Should return 403 Forbidden
      expect(response.status).toBe(403);
    });

    it('should allow admin to access admin endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should return 200 OK
      expect(response.status).toBe(200);
    });

    it('should prevent consumer from accessing admin analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${consumerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Authentication Bypass - Authorization Header', () => {
    it('should reject missing Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject empty Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
    });

    it('should reject wrong authorization scheme', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Basic ${consumerToken}`);

      expect(response.status).toBe(401);
    });
  });
});
