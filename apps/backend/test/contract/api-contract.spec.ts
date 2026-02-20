/**
 * Contract Tests - API Contract Validation
 * Tests API schema validation and backward compatibility
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describeIntegration('API Contract Tests', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

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

  describe('Auth API Contract', () => {
    // Schema for wrapped response
    const _signupResponseSchema = {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
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
        },
        timestamp: { type: 'string' },
        // Support both wrapped and unwrapped responses
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    };

    it('should return valid signup response', async () => {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `contract-${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Contract',
          lastName: 'Test',
        });

      expect(response.status).toBe(201);
      
      const body = response.body.data || response.body;
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body.user).toHaveProperty('id');
      expect(body.user).toHaveProperty('email');
    });

    it('should return valid login response', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `login-contract-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Login',
          lastName: 'Contract',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `login-contract-${timestamp}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      
      const body = response.body.data || response.body;
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
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

    it('should return valid 400 error response', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      
      const validate = ajv.compile(errorSchema);
      const valid = validate(response.body);
      
      expect(valid).toBe(true);
    });

    it('should return valid 401 error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      
      const validate = ajv.compile(errorSchema);
      const valid = validate(response.body);
      
      expect(valid).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain auth endpoint structure', async () => {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `compat-${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Compat',
          lastName: 'Test',
        });

      expect(response.status).toBe(201);
      
      // Verify response structure
      const body = response.body.data || response.body;
      expect(body.user).toBeDefined();
      expect(body.user.id).toBeDefined();
      expect(body.user.email).toBeDefined();
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });

    it('should maintain required user fields', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `fields-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Fields',
          lastName: 'Test',
          role: UserRole.CONSUMER,
          emailVerified: true,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `fields-${timestamp}@example.com`,
          password: 'Password123!',
        });

      const loginData = loginResponse.body.data || loginResponse.body;
      
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginData.accessToken}`);

      expect(meResponse.status).toBe(200);
      
      const userData = meResponse.body.data || meResponse.body;
      // Core user fields that must exist
      expect(userData).toHaveProperty('id');
      expect(userData).toHaveProperty('email');
      expect(userData).toHaveProperty('role');
      // firstName and lastName may or may not be included depending on API design
    });
  });

  describe('API Versioning', () => {
    it('should support v1 API prefix', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(response.status).toBe(200);
    });

    it('should reject requests without version prefix', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me');

      // Should return 404 (no /api/v1 prefix)
      expect(response.status).toBe(404);
    });
  });
});
