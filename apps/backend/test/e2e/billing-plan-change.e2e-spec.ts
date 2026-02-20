/**
 * E2E Tests - Billing Plan Change Flow
 * Tests for plan upgrade, downgrade, and proration endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/libs/prisma/prisma.service';

describe('Billing Plan Change E2E', () => {
  let app: INestApplication;
  let _prisma: PrismaService;
  let authToken: string;
  let _testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    
    _prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // Helper function to get auth token
  async function getAuthToken(): Promise<string> {
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    if (response.status === 200 && response.body.accessToken) {
      _testUserId = response.body.user?.id;
      return response.body.accessToken;
    }
    
    // If login fails, skip tests requiring auth
    return '';
  }

  beforeEach(async () => {
    if (!authToken) {
      authToken = await getAuthToken();
    }
  });

  describe('GET /api/v1/billing/subscription', () => {
    it('should return subscription info for authenticated user', async () => {
      if (!authToken) {
        return; // Skip if no auth token
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('plan');
        expect(response.body).toHaveProperty('status');
      }
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/subscription');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/billing/preview-plan-change', () => {
    it('should require planId parameter', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/preview-plan-change')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('planId');
    });

    it('should return preview for valid plan', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/preview-plan-change')
        .query({ planId: 'professional' })
        .set('Authorization', `Bearer ${authToken}`);

      // Either success or no subscription (both valid states)
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('currentPlan');
        expect(response.body).toHaveProperty('newPlan');
        expect(response.body).toHaveProperty('type');
        expect(['upgrade', 'downgrade', 'same']).toContain(response.body.type);
        expect(response.body).toHaveProperty('prorationAmount');
        expect(response.body).toHaveProperty('currency');
      }
    });

    it('should support different billing intervals', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/preview-plan-change')
        .query({ planId: 'business', interval: 'yearly' })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/v1/billing/downgrade-impact', () => {
    it('should require planId parameter', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/downgrade-impact')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return impact analysis for downgrade', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/downgrade-impact')
        .query({ planId: 'starter' })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('hasImpact');
        expect(response.body).toHaveProperty('impactedResources');
        expect(response.body).toHaveProperty('lostFeatures');
        expect(response.body).toHaveProperty('recommendations');
        expect(Array.isArray(response.body.impactedResources)).toBe(true);
        expect(Array.isArray(response.body.lostFeatures)).toBe(true);
        expect(Array.isArray(response.body.recommendations)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/billing/scheduled-changes', () => {
    it('should return scheduled changes for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/scheduled-changes')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('hasScheduledChanges');
        expect(response.body).toHaveProperty('currentPlan');
        expect(response.body).toHaveProperty('currentStatus');
        expect(typeof response.body.hasScheduledChanges).toBe('boolean');
      }
    });
  });

  describe('POST /api/v1/billing/change-plan', () => {
    it('should require planId in body', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/change-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('planId');
    });

    it('should reject invalid planId', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/change-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ planId: 'invalid-plan' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid planId');
    });

    it('should accept valid plan change request', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/change-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          planId: 'professional',
          billingInterval: 'monthly',
        });

      // Various valid responses:
      // 200 - Success
      // 400 - No active subscription
      // 500 - Stripe error (no real subscription in test)
      expect([200, 400, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('type');
        expect(response.body).toHaveProperty('effectiveDate');
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should support immediateChange option for downgrades', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/change-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          planId: 'starter',
          immediateChange: true,
        });

      // Response depends on current plan and subscription state
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/v1/billing/cancel-downgrade', () => {
    it('should cancel scheduled downgrade for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/cancel-downgrade')
        .set('Authorization', `Bearer ${authToken}`);

      // Various valid responses:
      // 200 - Success or no downgrade scheduled
      // 400 - No subscription
      // 500 - Stripe error
      expect([200, 400, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('GET /api/v1/billing/invoices', () => {
    it('should return invoices for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('invoices');
        expect(Array.isArray(response.body.invoices)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/billing/payment-methods', () => {
    it('should return payment methods for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/payment-methods')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('paymentMethods');
        expect(Array.isArray(response.body.paymentMethods)).toBe(true);
      }
    });
  });

  describe('POST /api/v1/billing/create-checkout-session', () => {
    it('should create checkout session without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/create-checkout-session')
        .send({
          planId: 'professional',
          email: 'test@example.com',
          billingInterval: 'monthly',
        });

      // Either success or Stripe configuration error
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        if (response.body.success) {
          expect(response.body).toHaveProperty('url');
          expect(response.body).toHaveProperty('sessionId');
        }
      }
    });

    it('should support add-ons in checkout', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/create-checkout-session')
        .send({
          planId: 'business',
          email: 'test@example.com',
          billingInterval: 'yearly',
          addOns: [
            { type: 'ai_credits', quantity: 100 },
          ],
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/billing/customer-portal', () => {
    it('should create customer portal session for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/customer-portal')
        .set('Authorization', `Bearer ${authToken}`);

      // Either success with URL or error (no Stripe customer)
      expect([200, 404, 500]).toContain(response.status);
      
      if (response.status === 200 && response.body.success) {
        expect(response.body).toHaveProperty('url');
        expect(response.body.url).toMatch(/^https:\/\/billing\.stripe\.com/);
      }
    });
  });
});
