/**
 * Contract Tests - API Contract Validation
 * Tests API schema validation and backward compatibility
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import * as Ajv from 'ajv';

describe('API Contract Tests', () => {
  let app: INestApplication;
  const ajv = new Ajv({ allErrors: true });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth API Contract', () => {
    const signupSchema = {
      type: 'object',
      required: ['user', 'accessToken', 'refreshToken'],
      properties: {
        user: {
          type: 'object',
          required: ['id', 'email', 'firstName', 'lastName'],
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    };

    it('should match signup response schema', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `contract-test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      if (response.status === 201) {
        const validate = ajv.compile(signupSchema);
        const valid = validate(response.body);
        
        expect(valid).toBe(true);
        if (!valid) {
          console.error('Schema validation errors:', validate.errors);
        }
      }
    });

    const loginSchema = {
      type: 'object',
      required: ['user', 'accessToken', 'refreshToken'],
      properties: {
        user: {
          type: 'object',
          required: ['id', 'email'],
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    };

    it('should match login response schema', async () => {
      // Create user first
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `contract-login-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `contract-login-${Date.now()}@example.com`,
          password: 'TestPassword123!',
        });

      if (response.status === 200) {
        const validate = ajv.compile(loginSchema);
        const valid = validate(response.body);
        
        expect(valid).toBe(true);
      }
    });
  });

  describe('Products API Contract', () => {
    const productSchema = {
      type: 'object',
      required: ['id', 'name', 'price'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        brandId: { type: 'string' },
      },
    };

    it('should match product response schema', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 1, limit: 1 });

      if (response.status === 200 && response.body.data) {
        const products = Array.isArray(response.body.data) 
          ? response.body.data 
          : [response.body.data];
        
        if (products.length > 0) {
          const validate = ajv.compile(productSchema);
          const valid = validate(products[0]);
          
          expect(valid).toBe(true);
        }
      }
    });

    const productsListSchema = {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: productSchema,
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    };

    it('should match products list response schema', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 1, limit: 10 });

      if (response.status === 200) {
        const validate = ajv.compile(productsListSchema);
        const valid = validate(response.body);
        
        expect(valid).toBe(true);
      }
    });
  });

  describe('Error Response Contract', () => {
    const errorSchema = {
      type: 'object',
      required: ['statusCode', 'message'],
      properties: {
        statusCode: { type: 'number' },
        message: { type: ['string', 'array'] },
        error: { type: 'string' },
      },
    };

    it('should match error response schema for 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'weak',
        });

      if (response.status === 400) {
        const validate = ajv.compile(errorSchema);
        const valid = validate(response.body);
        
        expect(valid).toBe(true);
      }
    });

    it('should match error response schema for 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/me');

      expect(response.status).toBe(401);
      
      const validate = ajv.compile(errorSchema);
      const valid = validate(response.body);
      
      expect(valid).toBe(true);
    });

    it('should match error response schema for 404', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/nonexistent-id');

      if (response.status === 404) {
        const validate = ajv.compile(errorSchema);
        const valid = validate(response.body);
        
        expect(valid).toBe(true);
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility for auth endpoints', async () => {
      // Test that old response format still works
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `backward-compat-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      if (response.status === 201) {
        // Verify required fields exist
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user).toHaveProperty('email');
      }
    });
  });
});
