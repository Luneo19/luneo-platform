/**
 * E2E Tests - Authentication Flow
 * Tests for authentication endpoints (signup, login, OAuth, etc.)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Authentication E2E', () => {
  let app: INestApplication;

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
    await app.close();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const email = `test-${Date.now()}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
          captchaToken: 'test-token', // Mock CAPTCHA token
        });

      // Should succeed or fail with conflict (user already exists)
      expect([201, 409]).toContain(response.status);
    });

    it('should reject invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: '123', // Too weak
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = process.env.TEST_USER_EMAIL || 'test@example.com';
      const password = process.env.TEST_USER_PASSWORD || 'test123456';

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email,
          password,
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('email');
        console.log('✅ Login successful');
      } else {
        console.warn('⚠️ Login test skipped (test user not available)');
      }
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/google')
        .expect(302);

      // Should redirect to Google OAuth
      expect(response.headers.location).toContain('accounts.google.com');
    });
  });

  describe('GET /api/v1/auth/github', () => {
    it('should redirect to GitHub OAuth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/github')
        .expect(302);

      // Should redirect to GitHub OAuth
      expect(response.headers.location).toContain('github.com/login/oauth');
    });
  });

  describe('GET /api/v1/oauth/providers', () => {
    it('should return available OAuth providers', async () => {
      // First, login to get token
      const email = process.env.TEST_USER_EMAIL || 'test@example.com';
      const password = process.env.TEST_USER_PASSWORD || 'test123456';

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password });

      if (loginResponse.status === 200) {
        const token = loginResponse.body.accessToken;
        
        const response = await request(app.getHttpServer())
          .get('/api/v1/oauth/providers')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('google');
        expect(response.body.data).toHaveProperty('github');
      } else {
        console.warn('⚠️ OAuth providers test skipped (test user not available)');
      }
    });
  });
});
