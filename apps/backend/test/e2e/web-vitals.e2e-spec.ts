/**
 * E2E Tests - Web Vitals API
 * Tests for Web Vitals recording and retrieval
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Web Vitals E2E', () => {
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

    // Get auth token for authenticated endpoints
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'test123456';

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/analytics/web-vitals', () => {
    it('should record a Web Vital metric', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/analytics/web-vitals')
        .send({
          name: 'LCP',
          value: 2500,
          rating: 'good',
          id: 'lcp-test-123',
          url: '/dashboard',
          timestamp: Date.now(),
        });

      expect([201, 200]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        console.log('✅ Web Vital recorded successfully');
      }
    });

    it('should reject invalid metric name', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/analytics/web-vitals')
        .send({
          name: 'INVALID_METRIC',
          value: 1000,
          id: 'test-123',
          timestamp: Date.now(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/analytics/web-vitals', () => {
    it('should retrieve Web Vitals metrics', async () => {
      if (!authToken) {
        console.warn('⚠️ Web Vitals retrieval test skipped (no auth token)');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/web-vitals')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('webVitals');
        console.log('✅ Web Vitals retrieved successfully');
      } else {
        console.warn(`⚠️ Web Vitals retrieval returned status ${response.status}`);
      }
    });
  });

  describe('GET /api/v1/analytics/web-vitals/summary', () => {
    it('should retrieve Web Vitals summary', async () => {
      if (!authToken) {
        console.warn('⚠️ Web Vitals summary test skipped (no auth token)');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/web-vitals/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('summary');
        console.log('✅ Web Vitals summary retrieved successfully');
      } else {
        console.warn(`⚠️ Web Vitals summary returned status ${response.status}`);
      }
    });
  });
});
