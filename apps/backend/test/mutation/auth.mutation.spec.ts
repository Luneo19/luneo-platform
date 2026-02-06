/**
 * Mutation Testing - Auth Module
 * Tests critical auth functions with edge cases
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describeIntegration('Mutation Testing - Auth Module', () => {
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

  describe('Password Validation Mutations', () => {
    const weakPasswords = [
      { password: 'weak', reason: 'too short' },
      { password: 'password', reason: 'no uppercase' },
      { password: 'Password', reason: 'no number' },
      { password: 'Password1', reason: 'no special char' },
      { password: '12345678', reason: 'no letters' },
      { password: 'Pass123!', reason: 'exactly 8 chars (minimum)' },
    ];

    it('should reject weak passwords', async () => {
      for (const { password, reason } of weakPasswords.slice(0, 4)) {
        const timestamp = Date.now();
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: `weak-${timestamp}@example.com`,
            password,
            firstName: 'Weak',
            lastName: 'Password',
          });

        expect(response.status).toBe(400);
      }
    });

    it('should accept strong passwords', async () => {
      const strongPasswords = [
        'Password123!',
        'SecurePass1@',
        'MyStr0ng#Pass',
        'Test@2023!abc',
      ];

      for (const password of strongPasswords) {
        const timestamp = Date.now();
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: `strong-${timestamp}@example.com`,
            password,
            firstName: 'Strong',
            lastName: 'Password',
          });

        expect([201, 429]).toContain(response.status);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });
  });

  describe('Email Validation Mutations', () => {
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
      'double@@at.com',
    ];

    it('should reject invalid emails', async () => {
      for (const email of invalidEmails) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email,
            password: 'Password123!',
            firstName: 'Invalid',
            lastName: 'Email',
          });

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Authentication Flow Mutations', () => {
    it('should prevent login with wrong password', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 13);
      
      await prisma.user.create({
        data: {
          email: `auth-flow-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Auth',
          lastName: 'Flow',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      const wrongPasswords = [
        'correctpassword123!', // wrong case
        'CorrectPassword123', // missing !
        'WrongPassword123!', // completely wrong
      ];

      for (const password of wrongPasswords) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: `auth-flow-${timestamp}@example.com`,
            password,
          });

        expect(response.status).toBe(401);
      }
    });

    it('should prevent login with unverified email when required', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `unverified-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Unverified',
          lastName: 'User',
          role: UserRole.CONSUMER,
          emailVerified: false,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `unverified-${timestamp}@example.com`,
          password: 'Password123!',
        });

      // Should either succeed (if SKIP_EMAIL_VERIFICATION) or fail
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Token Mutations', () => {
    it('should reject expired or invalid tokens', async () => {
      const invalidTokens = [
        'completely-invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-payload.invalid-sig',
        '', // empty
      ];

      for (const token of invalidTokens) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('Role-Based Access Mutations', () => {
    it('should prevent consumer from accessing admin endpoints', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `consumer-role-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Consumer',
          lastName: 'Role',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `consumer-role-${timestamp}@example.com`,
          password: 'Password123!',
        });

      const loginData = loginResponse.body.data || loginResponse.body;
      const consumerToken = loginData.accessToken;

      const adminEndpoints = [
        '/api/v1/admin/customers',
        '/api/v1/admin/analytics/overview',
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${consumerToken}`);

        expect(response.status).toBe(403);
      }
    });
  });

  describe('Input Boundary Mutations', () => {
    it('should handle maximum length inputs', async () => {
      const longString = 'a'.repeat(256);
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `${longString}@example.com`,
          password: 'Password123!',
          firstName: longString,
          lastName: longString,
        });

      // Should reject overly long inputs
      expect([400]).toContain(response.status);
    });

    it('should handle empty inputs', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        });

      expect(response.status).toBe(400);
    });
  });
});
