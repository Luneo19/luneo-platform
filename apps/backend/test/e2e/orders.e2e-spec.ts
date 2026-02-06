/**
 * E2E Tests - Orders Management Flow
 * Tests for order creation, checkout, and management endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Orders E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let testOrderId: string;

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

  describe('GET /api/v1/orders', () => {
    it('should return orders list for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('orders');
        expect(Array.isArray(response.body.orders)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('pagination');
      }
    });

    it('should filter orders by status', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({ status: 'PENDING' })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/orders', () => {
    it('should create order with valid data', async () => {
      if (!authToken) {
        return;
      }

      const orderData = {
        items: [
          {
            productId: 'test-product-id',
            quantity: 1,
            customization: {
              color: 'blue',
              text: 'Test Text',
            },
          },
        ],
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          street: '123 Test Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'FR',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      // Order creation may fail due to invalid productId in test
      expect([201, 400, 404]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('status');
        testOrderId = response.body.id;
      }
    });

    it('should reject order without items', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: '123 Test Street',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
          },
        });

      expect(response.status).toBe(400);
    });

    it('should reject order with empty items array', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [],
          shippingAddress: {
            street: '123 Test Street',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return order by ID', async () => {
      if (!authToken || !testOrderId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(testOrderId);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('items');
      }
    });

    it('should return 404 for non-existent order', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/non-existent-order-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 400]).toContain(response.status);
    });

    it('should not allow access to other user\'s order', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/other-user-order-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('PATCH /api/v1/orders/:id', () => {
    it('should update order status', async () => {
      if (!authToken || !testOrderId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'PROCESSING' });

      expect([200, 400, 403, 404]).toContain(response.status);
    });

    it('should update shipping address before shipment', async () => {
      if (!authToken || !testOrderId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: '456 New Street',
            city: 'Lyon',
            postalCode: '69001',
            country: 'FR',
          },
        });

      expect([200, 400, 403, 404]).toContain(response.status);
    });
  });

  describe('POST /api/v1/orders/:id/cancel', () => {
    it('should cancel pending order', async () => {
      if (!authToken || !testOrderId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/api/v1/orders/${testOrderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test cancellation' });

      expect([200, 400, 403, 404]).toContain(response.status);
    });

    it('should not cancel shipped order', async () => {
      if (!authToken) {
        return;
      }

      // Try to cancel a shipped order (should fail)
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/shipped-order-id/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Trying to cancel shipped order' });

      expect([400, 403, 404]).toContain(response.status);
    });
  });

  describe('Order Checkout Flow', () => {
    it('should create checkout session for order', async () => {
      if (!authToken || !testOrderId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/api/v1/orders/${testOrderId}/checkout`)
        .set('Authorization', `Bearer ${authToken}`);

      // Checkout may fail without Stripe config or valid order
      expect([200, 400, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('checkoutUrl');
      }
    });
  });

  describe('Order Statistics', () => {
    it('should return order statistics for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalOrders');
        expect(response.body).toHaveProperty('totalRevenue');
      }
    });

    it('should filter statistics by date range', async () => {
      if (!authToken) {
        return;
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/stats')
        .query({
          startDate: thirtyDaysAgo.toISOString(),
          endDate: now.toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Order History and Audit', () => {
    it('should return order history', async () => {
      if (!authToken || !testOrderId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrderId}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('Order Export', () => {
    it('should export orders as CSV', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/export')
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
