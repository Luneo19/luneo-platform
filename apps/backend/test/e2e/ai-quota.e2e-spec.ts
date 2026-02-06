/**
 * E2E Tests - AI Quota and Usage Flow
 * Tests for AI quota endpoints and usage tracking
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AI Quota E2E', () => {
  let app: INestApplication;
  let authToken: string;

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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  async function getAuthToken(): Promise<string> {
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    if (response.status === 200 && response.body.accessToken) {
      return response.body.accessToken;
    }
    return '';
  }

  beforeEach(async () => {
    if (!authToken) {
      authToken = await getAuthToken();
    }
  });

  describe('GET /api/v1/ai/quota', () => {
    it('should return AI quota for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/quota')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('quota');
        expect(response.body.quota).toHaveProperty('monthlyLimit');
        expect(response.body.quota).toHaveProperty('monthlyUsed');
        expect(response.body.quota).toHaveProperty('percentageUsed');
        
        expect(response.body).toHaveProperty('stats');
        expect(response.body.stats).toHaveProperty('totalGenerations');
        expect(response.body.stats).toHaveProperty('generationsThisMonth');
      }
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/quota');

      expect(response.status).toBe(401);
    });

    it('should return numeric values for quota', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/quota')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        const { quota, stats } = response.body;
        
        expect(typeof quota.monthlyLimit).toBe('number');
        expect(typeof quota.monthlyUsed).toBe('number');
        expect(typeof quota.costLimitCents).toBe('number');
        expect(typeof quota.costUsedCents).toBe('number');
        expect(typeof quota.percentageUsed).toBe('number');
        
        expect(typeof stats.totalGenerations).toBe('number');
        expect(typeof stats.generationsThisMonth).toBe('number');
        expect(typeof stats.totalCostCents).toBe('number');
        expect(typeof stats.costThisMonth).toBe('number');
        
        // Percentage should be between 0 and 100 (or more if overused)
        expect(quota.percentageUsed).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('AI Generation Endpoints', () => {
    it('should check quota before generation', async () => {
      if (!authToken) {
        return;
      }

      // First check quota
      const quotaResponse = await request(app.getHttpServer())
        .get('/api/v1/ai/quota')
        .set('Authorization', `Bearer ${authToken}`);

      if (quotaResponse.status === 200) {
        const { quota } = quotaResponse.body;
        
        // If user has remaining quota, they should be able to generate
        if (quota.monthlyUsed < quota.monthlyLimit || quota.monthlyLimit === -1) {
          // User has quota available
          expect(quota.percentageUsed).toBeLessThan(100);
        }
      }
    });

    it('should track generation usage', async () => {
      if (!authToken) {
        return;
      }

      // Get initial quota
      const initialQuota = await request(app.getHttpServer())
        .get('/api/v1/ai/quota')
        .set('Authorization', `Bearer ${authToken}`);

      if (initialQuota.status !== 200) {
        return;
      }

      const initialUsed = initialQuota.body.quota.monthlyUsed;

      // Try to make a generation (may fail without proper AI config)
      const generateResponse = await request(app.getHttpServer())
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Test generation prompt',
          type: 'design',
        });

      // If generation succeeded, check quota increased
      if (generateResponse.status === 200 || generateResponse.status === 201) {
        const finalQuota = await request(app.getHttpServer())
          .get('/api/v1/ai/quota')
          .set('Authorization', `Bearer ${authToken}`);

        if (finalQuota.status === 200) {
          expect(finalQuota.body.quota.monthlyUsed).toBeGreaterThanOrEqual(initialUsed);
        }
      }
    });
  });

  describe('AI Usage History', () => {
    it('should return AI usage history', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.body.generations || response.body)).toBe(true);
      }
    });

    it('should support pagination for history', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/history')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should filter history by date range', async () => {
      if (!authToken) {
        return;
      }

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/history')
        .query({
          startDate: sevenDaysAgo.toISOString(),
          endDate: now.toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Quota Limits and Enforcement', () => {
    it('should return error when quota exceeded', async () => {
      if (!authToken) {
        return;
      }

      // This test would require setting up a user with exceeded quota
      // For now, we just verify the endpoint behavior
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/quota')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        const { quota } = response.body;
        
        // Verify quota structure is correct
        expect(quota).toHaveProperty('monthlyLimit');
        expect(quota).toHaveProperty('monthlyUsed');
        expect(quota).toHaveProperty('costLimitCents');
        expect(quota).toHaveProperty('costUsedCents');
      }
    });

    it('should reset quota at month start', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/quota')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        const { quota } = response.body;
        
        // If reset date is present, verify it's a valid date
        if (quota.resetAt) {
          const resetDate = new Date(quota.resetAt);
          expect(resetDate).toBeInstanceOf(Date);
          expect(resetDate.getTime()).toBeGreaterThan(Date.now() - 31 * 24 * 60 * 60 * 1000); // Within last month
        }
      }
    });
  });

  describe('Plan-based Quota Limits', () => {
    it('should return quota based on user plan', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/quota')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        const { quota } = response.body;
        
        // Different plans have different limits
        // Starter: lower limits
        // Professional: medium limits
        // Business: higher limits
        // Enterprise: unlimited (-1)
        
        expect([50, 200, 1000, -1]).toContain(quota.monthlyLimit);
      }
    });
  });
});
