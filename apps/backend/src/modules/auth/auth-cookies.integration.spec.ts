/**
 * Tests d'intégration pour les cookies httpOnly
 * Teste que les cookies sont correctement définis et lus
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Auth Cookies Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test-cookies@example.com', 'test-login@example.com'],
        },
      },
    });
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should set httpOnly cookies on signup', async () => {
      const signupData = {
        email: 'test-cookies@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signupData)
        .expect(201);

      // Vérifier que les cookies sont définis
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      const cookieStrings = Array.isArray(cookies) ? cookies : [cookies];
      const accessTokenCookie = cookieStrings.find((c: string) => c.includes('accessToken'));
      const refreshTokenCookie = cookieStrings.find((c: string) => c.includes('refreshToken'));

      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();
      
      // Vérifier que les cookies sont httpOnly
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('HttpOnly');
      
      // Vérifier que les tokens ne sont PAS dans le body
      expect(response.body.accessToken).toBeUndefined();
      expect(response.body.refreshToken).toBeUndefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      await prisma.user.create({
        data: {
          email: 'test-login@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          emailVerified: true,
          brand: {
            create: {
              name: 'Test Brand',
              slug: 'test-brand',
            },
          },
        },
      });
    });

    it('should set httpOnly cookies on login', async () => {
      const loginData = {
        email: 'test-login@example.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      // Vérifier que les cookies sont définis
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      const cookieStrings = Array.isArray(cookies) ? cookies : [cookies];
      const accessTokenCookie = cookieStrings.find((c: string) => c.includes('accessToken'));
      const refreshTokenCookie = cookieStrings.find((c: string) => c.includes('refreshToken'));

      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();
      
      // Vérifier que les cookies sont httpOnly
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('HttpOnly');
      
      // Vérifier que les tokens ne sont PAS dans le body
      expect(response.body.accessToken).toBeUndefined();
      expect(response.body.refreshToken).toBeUndefined();
    });

    it('should authenticate with cookies', async () => {
      // Login pour obtenir les cookies
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test-login@example.com',
          password: 'Password123!',
        })
        .expect(200);

      // Extraire les cookies
      const cookies = loginResponse.headers['set-cookie'];
      const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies;

      // Utiliser les cookies pour accéder à une route protégée
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(meResponse.body.email).toBe('test-login@example.com');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    beforeEach(async () => {
      // Créer un utilisateur et un refresh token
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      const user = await prisma.user.create({
        data: {
          email: 'test-login@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          emailVerified: true,
          brand: {
            create: {
              name: 'Test Brand',
              slug: 'test-brand',
            },
          },
        },
      });

      // Créer un refresh token valide
      await prisma.refreshToken.create({
        data: {
          token: 'valid_refresh_token',
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    });

    it('should refresh tokens and set new cookies', async () => {
      // Note: Ce test nécessite un vrai JWT token, donc il faudrait mock JwtService
      // Pour l'instant, on teste juste la structure
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' })
        .expect(200);

      // Vérifier que les nouveaux cookies sont définis
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear httpOnly cookies on logout', async () => {
      // Login pour obtenir les cookies
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      await prisma.user.create({
        data: {
          email: 'test-logout@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          emailVerified: true,
          brand: {
            create: {
              name: 'Test Brand',
              slug: 'test-brand',
            },
          },
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test-logout@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies;

      // Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', cookieHeader)
        .expect(200);

      // Vérifier que les cookies sont effacés (Max-Age=0 ou Expires dans le passé)
      const logoutCookies = logoutResponse.headers['set-cookie'];
      const logoutCookieStrings = Array.isArray(logoutCookies) ? logoutCookies : [logoutCookies];
      
      const clearedAccessToken = logoutCookieStrings.find((c: string) => c.includes('accessToken'));
      const clearedRefreshToken = logoutCookieStrings.find((c: string) => c.includes('refreshToken'));

      expect(clearedAccessToken).toBeDefined();
      expect(clearedRefreshToken).toBeDefined();
      
      // Vérifier que les cookies sont effacés (Max-Age=0 ou Expires)
      expect(clearedAccessToken).toMatch(/Max-Age=0|Expires=/);
      expect(clearedRefreshToken).toMatch(/Max-Age=0|Expires=/);
    });
  });
});
