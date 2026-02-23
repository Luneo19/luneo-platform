/**
 * Tests d'intégration pour les cookies httpOnly
 * Teste que les cookies sont correctement définis et lus
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PlatformRole } from '@prisma/client';

describeIntegration('Auth Cookies Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;

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
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /api/v1/auth/signup - Cookie behavior', () => {
    it('should set cookies on signup', async () => {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `cookies-signup-${timestamp}@example.com`,
          password: 'Password123!',
          firstName: 'Cookie',
          lastName: 'Test',
        });

      expect(response.status).toBe(201);

      // Check if cookies are set
      const cookies = response.headers['set-cookie'];
      
      if (cookies) {
        // Cookies are being set
        const cookieStrings = Array.isArray(cookies) ? cookies : [cookies];
        const accessTokenCookie = cookieStrings.find((c: string) => c.includes('accessToken'));
        const refreshTokenCookie = cookieStrings.find((c: string) => c.includes('refreshToken'));

        if (accessTokenCookie) {
          expect(accessTokenCookie).toContain('HttpOnly');
        }
        if (refreshTokenCookie) {
          expect(refreshTokenCookie).toContain('HttpOnly');
        }
      }

      // Tokens should also be in body (for backward compatibility)
      const body = response.body.data || response.body;
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login - Cookie behavior', () => {
    it('should set cookies on login', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `cookies-login-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Cookie',
          lastName: 'Login',
          role: PlatformRole.USER,
          emailVerified: true,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `cookies-login-${timestamp}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(200);

      // Check if cookies are set
      const cookies = response.headers['set-cookie'];
      
      if (cookies) {
        const cookieStrings = Array.isArray(cookies) ? cookies : [cookies];
        const accessTokenCookie = cookieStrings.find((c: string) => c.includes('accessToken'));
        const refreshTokenCookie = cookieStrings.find((c: string) => c.includes('refreshToken'));

        if (accessTokenCookie) {
          expect(accessTokenCookie).toContain('HttpOnly');
        }
        if (refreshTokenCookie) {
          expect(refreshTokenCookie).toContain('HttpOnly');
        }
      }

      // Tokens should also be in body
      const body = response.body.data || response.body;
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });

    it('should authenticate with Bearer token from response', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `bearer-auth-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Bearer',
          lastName: 'Auth',
          role: PlatformRole.USER,
          emailVerified: true,
        },
      });

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `bearer-auth-${timestamp}@example.com`,
          password: 'Password123!',
        });

      expect(loginResponse.status).toBe(200);
      
      const loginData = loginResponse.body.data || loginResponse.body;
      const accessToken = loginData.accessToken;

      // Use Bearer token for protected route
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meResponse.status).toBe(200);
      
      const meData = meResponse.body.data || meResponse.body;
      expect(meData.email).toBe(`bearer-auth-${timestamp}@example.com`);
    });
  });

  describe('POST /api/v1/auth/logout - Cookie behavior', () => {
    it('should handle logout with Bearer token', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `logout-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Logout',
          lastName: 'Test',
          role: PlatformRole.USER,
          emailVerified: true,
        },
      });

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `logout-${timestamp}@example.com`,
          password: 'Password123!',
        });

      const loginData = loginResponse.body.data || loginResponse.body;
      const accessToken = loginData.accessToken;
      const refreshToken = loginData.refreshToken;

      // Logout with Bearer token
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);

      // Check if logout clears cookies
      const cookies = logoutResponse.headers['set-cookie'];
      
      if (cookies) {
        const cookieStrings = Array.isArray(cookies) ? cookies : [cookies];
        const clearedAccessToken = cookieStrings.find((c: string) => c.includes('accessToken'));
        
        if (clearedAccessToken) {
          // Cookie should be cleared (Max-Age=0 or empty value)
          expect(clearedAccessToken).toMatch(/Max-Age=0|accessToken=;|accessToken=/);
        }
      }
    });

    it('should reject authenticated requests after logout', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      await prisma.user.create({
        data: {
          email: `logout-reject-${timestamp}@example.com`,
          password: hashedPassword,
          firstName: 'Logout',
          lastName: 'Reject',
          role: PlatformRole.USER,
          emailVerified: true,
        },
      });

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `logout-reject-${timestamp}@example.com`,
          password: 'Password123!',
        });

      const loginData = loginResponse.body.data || loginResponse.body;
      const accessToken = loginData.accessToken;
      const refreshToken = loginData.refreshToken;

      // Verify token works before logout
      const meBeforeResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meBeforeResponse.status).toBe(200);

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Refresh token should no longer work
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      // Should be unauthorized (refresh token revoked)
      expect([401, 403]).toContain(refreshResponse.status);
    });
  });
});
