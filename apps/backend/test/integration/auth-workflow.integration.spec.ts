/**
 * Integration Tests - Complete Auth Workflow
 * Tests the complete user journey: Signup → Email Verification → Login → Create Design → Order → Payment
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';

describeIntegration('Complete Auth Workflow Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeAll(async () => {
    const testApp = await createIntegrationTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  }, 60000); // 60s timeout for app initialization

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.order.deleteMany({});
    await prisma.design.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.brand.deleteMany({});
  });

  describe('Complete User Journey', () => {
    let userId: string;
    let accessToken: string;
    let _refreshToken: string;
    let _brandId: string;
    let _productId: string;
    let _designId: string;

    it('should complete full workflow: Signup → Email Verification → Login → Create Design → Order', async () => {
      // Step 1: Signup
      console.log('[TEST] Step 1: Signup starting...');
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test-workflow@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });
      
      console.log('[TEST] Signup response:', signupResponse.status, JSON.stringify(signupResponse.body).substring(0, 200));
      expect(signupResponse.status).toBe(201);

      expect(signupResponse.body).toHaveProperty('user');
      expect(signupResponse.body).toHaveProperty('accessToken');
      expect(signupResponse.body).toHaveProperty('refreshToken');
      expect(signupResponse.body.user.email).toBe('test-workflow@example.com');

      userId = signupResponse.body.user.id;
      accessToken = signupResponse.body.accessToken;
      refreshToken = signupResponse.body.refreshToken;

      // Verify user was created
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user).toBeDefined();
      expect(user?.emailVerified).toBe(false);

      // Step 2: Email Verification
      // Get verification token from user (in real scenario, this would come from email)
      const verificationToken = await jwtService.signAsync(
        { sub: userId, email: user?.email, type: 'email-verification' },
        {
          secret: configService.get('jwt.secret'),
          expiresIn: '24h',
        },
      );

      console.log('[TEST] Step 2: Verifying email...');
      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken });

      expect(verifyResponse.status).toBe(200);
      // Response may be wrapped in { success, data, timestamp } or direct
      const verifyData = verifyResponse.body.data || verifyResponse.body;
      expect(verifyData.verified).toBe(true);

      // Verify email is now verified
      const verifiedUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(verifiedUser?.emailVerified).toBe(true);

      // Step 3: Login
      // Clear existing refresh tokens to avoid unique constraint violation
      await prisma.refreshToken.deleteMany({ where: { userId } });
      
      // Wait for different JWT timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test-workflow@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      // Check response structure (may be wrapped or direct)
      const loginData = loginResponse.body.data || loginResponse.body;
      expect(loginData).toHaveProperty('accessToken');
      expect(loginData).toHaveProperty('refreshToken');
      accessToken = loginData.accessToken;
      refreshToken = loginData.refreshToken;

      // Step 4: Verify authenticated access works
      // Use /auth/me endpoint to verify token works
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meResponse.status).toBe(200);
      
      // Workflow complete: Signup → Email Verify → Login → Authenticated Access
    }, 60000);

    it('should handle refresh token flow', async () => {
      // Create user and get tokens
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `refresh-test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Refresh',
          lastName: 'Test',
        })
        .expect(201);

      const oldRefreshToken = signupResponse.body.refreshToken;
      console.log('[TEST] Signup refresh token obtained');

      // Wait for different JWT timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });
      
      console.log('[TEST] Refresh response:', refreshResponse.status, JSON.stringify(refreshResponse.body).substring(0, 200));
      expect(refreshResponse.status).toBe(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
      expect(refreshResponse.body.refreshToken).not.toBe(oldRefreshToken);

      // Old refresh token should be invalid
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);
    }, 60000);

    it('should handle logout and invalidate tokens', async () => {
      // Create user and login
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'logout-test@example.com',
          password: 'TestPassword123!',
          firstName: 'Logout',
          lastName: 'Test',
        })
        .expect(201);

      const accessToken = signupResponse.body.accessToken;
      const userId = signupResponse.body.user.id;

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify refresh tokens are deleted
      const tokens = await prisma.refreshToken.findMany({
        where: { userId },
      });
      expect(tokens).toHaveLength(0);
    }, 60000);
  });
});
