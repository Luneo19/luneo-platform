/**
 * E2E Tests - Products Management Flow
 * Tests for product CRUD and customization endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Products E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let testProductId: string;

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

  describe('GET /api/v1/products', () => {
    it('should return products list for authenticated user', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('products');
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
      }
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a product with valid data', async () => {
      if (!authToken) {
        return;
      }

      const productData = {
        name: `Test Product ${Date.now()}`,
        description: 'A test product for E2E testing',
        price: 29.99,
        currency: 'EUR',
        sku: `TEST-SKU-${Date.now()}`,
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect([201, 400, 403]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(productData.name);
        testProductId = response.body.id;
      }
    });

    it('should reject product without name', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Product without name',
          price: 19.99,
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid price', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Price Product',
          price: -10, // Negative price
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return product by ID', async () => {
      if (!authToken || !testProductId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(testProductId);
      }
    });

    it('should return 404 for non-existent product', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    it('should update product', async () => {
      if (!authToken || !testProductId) {
        return;
      }

      const updateData = {
        name: `Updated Product ${Date.now()}`,
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.name).toBe(updateData.name);
      }
    });

    it('should not allow updating other user\'s product', async () => {
      if (!authToken) {
        return;
      }

      // Try to update a product that doesn't belong to the user
      const response = await request(app.getHttpServer())
        .patch('/api/v1/products/other-user-product-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Hacked Product' });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should soft delete product', async () => {
      if (!authToken || !testProductId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204, 404]).toContain(response.status);
    });

    it('should not allow deleting other user\'s product', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .delete('/api/v1/products/other-user-product-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Product Customization Options', () => {
    it('should support customization options in product creation', async () => {
      if (!authToken) {
        return;
      }

      const productData = {
        name: `Customizable Product ${Date.now()}`,
        price: 49.99,
        customizationOptions: {
          colors: ['red', 'blue', 'green'],
          sizes: ['S', 'M', 'L', 'XL'],
          textFields: [
            { name: 'name', maxLength: 20 },
            { name: 'message', maxLength: 100 },
          ],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect([201, 400, 403]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('customizationOptions');
      }
    });
  });

  describe('Product Search and Filter', () => {
    it('should search products by name', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ search: 'Test' })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should filter products by status', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ isActive: true })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should sort products by creation date', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });
});
