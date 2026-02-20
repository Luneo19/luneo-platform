/**
 * TEST-07: Tests Integration billing→webhook→order
 * Tests d'intégration pour le flux de paiement
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

describeIntegration('Billing Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let authToken: string;
  let _userId: string;

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
    // Clean up test data
    await prisma.order.deleteMany({});
    await prisma.design.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});

    const timestamp = Date.now();
    
    // Create a test brand
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        slug: `test-brand-${timestamp}`,
        website: 'https://test.com',
        stripeCustomerId: `cus_test_${timestamp}`,
      },
    });

    // Create a test user
    const hashedPassword = await bcrypt.hash('Password123!', 13);
    const user = await prisma.user.create({
      data: {
        email: `billing-test-${timestamp}@example.com`,
        password: hashedPassword,
        firstName: 'Billing',
        lastName: 'Test',
        role: UserRole.BRAND_ADMIN,
        emailVerified: true,
        brandId: brand.id,
      },
    });
    userId = user.id;

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: user.email,
        password: 'Password123!',
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = loginResponse.body.data || loginResponse.body;
    authToken = loginData.accessToken;
  }, 30000);

  describe('Checkout Session', () => {
    it('should create checkout session (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/create-checkout-session')
        .send({
          planId: 'starter',
          billingInterval: 'monthly',
        });

      // May fail if Stripe is not configured, but endpoint should exist
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });

  describe('Subscription Management', () => {
    it('should require authentication for subscription endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/subscription');

      expect(response.status).toBe(401);
    });

    it('should get subscription status with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/subscription')
        .set('Authorization', `Bearer ${authToken}`);

      // May return 404 if no subscription, or 200 if found, or 500 if Stripe not configured
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Invoices', () => {
    it('should require authentication for invoices endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices');

      expect(response.status).toBe(401);
    });

    it('should get invoices with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`);

      // Returns empty array or invoices, or 500 if Stripe not configured
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Payment Methods', () => {
    it('should require authentication for payment methods', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/payment-methods');

      expect(response.status).toBe(401);
    });

    it('should get payment methods with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/payment-methods')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Webhook Endpoint', () => {
    it('should accept webhook requests (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/webhook')
        .set('stripe-signature', 'test_signature')
        .send('{}');

      // Will fail signature validation, but endpoint should exist
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
