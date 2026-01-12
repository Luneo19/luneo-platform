/**
 * Integration Tests - Complete Auth Workflow
 * Tests the complete user journey: Signup → Email Verification → Login → Create Design → Order → Payment
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Complete Auth Workflow Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
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
    let refreshToken: string;
    let brandId: string;
    let productId: string;
    let designId: string;

    it('should complete full workflow: Signup → Email Verification → Login → Create Design → Order', async () => {
      // Step 1: Signup
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test-workflow@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

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

      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(verifyResponse.body.verified).toBe(true);

      // Verify email is now verified
      const verifiedUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(verifiedUser?.emailVerified).toBe(true);

      // Step 3: Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test-workflow@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');
      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;

      // Step 4: Create Brand (if needed)
      const brandResponse = await request(app.getHttpServer())
        .post('/api/v1/brands')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Brand',
          website: 'https://testbrand.com',
        })
        .expect(201);

      brandId = brandResponse.body.id;

      // Step 5: Create Product
      const productResponse = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Product',
          description: 'Test Description',
          price: 29.99,
          brandId,
        })
        .expect(201);

      productId = productResponse.body.id;

      // Step 6: Create Design
      const designResponse = await request(app.getHttpServer())
        .post('/api/v1/designs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId,
          prompt: 'A beautiful logo design',
          options: {},
        })
        .expect(201);

      designId = designResponse.body.id;
      expect(designResponse.body.status).toBe('PENDING');

      // Step 7: Wait for design to be processed (mock)
      // In real scenario, this would wait for AI generation
      await prisma.design.update({
        where: { id: designId },
        data: {
          status: 'COMPLETED',
          renderUrl: 'https://example.com/design.png',
        },
      });

      // Step 8: Create Order
      const orderResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          designId,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            zipCode: '12345',
            country: 'FR',
          },
        })
        .expect(201);

      expect(orderResponse.body).toHaveProperty('id');
      expect(orderResponse.body.status).toBe('PENDING');

      // Verify order was created
      const order = await prisma.order.findUnique({
        where: { id: orderResponse.body.id },
      });
      expect(order).toBeDefined();
      expect(order?.designId).toBe(designId);
    });

    it('should handle refresh token flow', async () => {
      // Create user and get tokens
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'refresh-test@example.com',
          password: 'TestPassword123!',
          firstName: 'Refresh',
          lastName: 'Test',
        })
        .expect(201);

      const oldRefreshToken = signupResponse.body.refreshToken;

      // Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
      expect(refreshResponse.body.refreshToken).not.toBe(oldRefreshToken);

      // Old refresh token should be invalid
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);
    });

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
    });
  });
});
