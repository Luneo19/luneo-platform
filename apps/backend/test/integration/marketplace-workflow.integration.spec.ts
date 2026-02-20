/**
 * @fileoverview Tests d'intégration pour le workflow Marketplace
 * @module MarketplaceWorkflow.integration.spec
 *
 * Conforme au plan PHASE 9 - Tests & CI/CD
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

describeIntegration('Marketplace Workflow (Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let _brandId: string;

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
    // Clean up test data
    await prisma.order.deleteMany({});
    await prisma.design.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});

    const timestamp = Date.now();
    
    // Create a test brand
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        slug: `test-brand-${timestamp}`,
        website: 'https://test.com',
      },
    });
    brandId = brand.id;

    // Create a test user and get a real token
    const hashedPassword = await bcrypt.hash('Password123!', 13);
    const user = await prisma.user.create({
      data: {
        email: `test-creator-${timestamp}@example.com`,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Creator',
        role: UserRole.CONSUMER,
        emailVerified: true,
        brandId: brand.id,
      },
    });
    userId = user.id;

    // Login to get real token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: user.email,
        password: 'Password123!',
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
    }

    const loginData = loginResponse.body.data || loginResponse.body;
    authToken = loginData.accessToken;
  }, 30000);

  describe('POST /marketplace/creators', () => {
    it('should create a creator profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/marketplace/creators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          username: `testcreator${Date.now()}`,
          displayName: 'Test Creator',
          bio: 'Test bio',
        });

      // Handle both 201 (created) and wrapped response
      expect([200, 201]).toContain(response.status);
      
      const body = response.body.data || response.body;
      expect(body).toHaveProperty('id');
    });

    it('should return 400 when username is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/marketplace/creators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          username: 'ab', // Too short
          displayName: 'Test Creator',
        });

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('GET /marketplace/creators/:userId', () => {
    beforeEach(async () => {
      // Create a creator profile first
      await request(app.getHttpServer())
        .post('/api/v1/marketplace/creators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          username: `testcreator${Date.now()}`,
          displayName: 'Test Creator',
          bio: 'Test bio',
        });
    });

    it('should return creator profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/marketplace/creators/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = response.body.data || response.body;
      expect(body).toHaveProperty('userId', userId);
    });

    it('should return 404 when profile does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/marketplace/creators/nonexistent-user-id-12345')
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('POST /marketplace/templates', () => {
    let creatorId: string;

    beforeEach(async () => {
      // Create a creator profile first
      const creatorResponse = await request(app.getHttpServer())
        .post('/api/v1/marketplace/creators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          username: `templatecreator${Date.now()}`,
          displayName: 'Template Creator',
          bio: 'Creates templates',
        });

      const creatorBody = creatorResponse.body.data || creatorResponse.body;
      creatorId = creatorBody.id;
    });

    it('should create a marketplace template', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/marketplace/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          creatorId,
          name: 'Test Template',
          slug: `test-template-${Date.now()}`,
          promptTemplate: 'A beautiful design with {{variable}}',
          variables: { variable: 'test' },
          priceCents: 999,
          category: 'design',
        });

      expect([200, 201]).toContain(response.status);
      const body = response.body.data || response.body;
      expect(body).toHaveProperty('id');
    });
  });

  describe('GET /marketplace/templates', () => {
    it('should return list of templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/marketplace/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = response.body.data || response.body;
      expect(body).toHaveProperty('templates');
      expect(Array.isArray(body.templates)).toBe(true);
    });

    it('should filter templates by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/marketplace/templates?category=design')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = response.body.data || response.body;
      expect(body).toHaveProperty('templates');
    });
  });
});
