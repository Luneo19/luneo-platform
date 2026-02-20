/**
 * Integration Tests - Admin Workflow
 * Tests Admin workflow: Admin Login → View Customers → Analytics → Export
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';

describeIntegration('Admin Workflow Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let _adminUserId: string;

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
    // Clean up test data in correct order (respecting foreign keys)
    await prisma.order.deleteMany({});
    await prisma.design.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});

    // Create admin user
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 13);
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@luneo.app`,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.PLATFORM_ADMIN,
        emailVerified: true,
      },
    });

    adminUserId = adminUser.id;

    // Login as admin
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: adminUser.email,
        password: 'AdminPassword123!',
      });

    if (loginResponse.status !== 200) {
      console.error('Admin login failed:', loginResponse.status, loginResponse.body);
      throw new Error(`Admin login failed with status ${loginResponse.status}`);
    }

    // Handle wrapped response
    const loginData = loginResponse.body.data || loginResponse.body;
    adminAccessToken = loginData.accessToken;
  }, 30000);

  describe('Admin Customer Management', () => {
    beforeEach(async () => {
      // Create test customers
      for (let i = 0; i < 5; i++) {
        await prisma.user.create({
          data: {
            email: `customer${i}@example.com`,
            password: await bcrypt.hash('Password123!', 12),
            firstName: `Customer${i}`,
            lastName: 'Test',
            role: UserRole.CONSUMER,
            emailVerified: true,
          },
        });
      }
    });

    it('should list all customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Handle wrapped response
      const body = response.body.data || response.body;
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should filter customers by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'customer0@example.com' })
        .expect(200);

      // Handle wrapped response
      const body = response.body.data || response.body;
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].email).toContain('customer0');
    });

    it('should get customer details', async () => {
      const customers = await prisma.user.findMany({
        where: { role: UserRole.CONSUMER },
        take: 1,
      });

      if (customers.length > 0) {
        const customerId = customers[0].id;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/admin/customers/${customerId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .expect(200);

        // Handle wrapped response
        const body = response.body.data || response.body;
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('email');
        expect(body.id).toBe(customerId);
      }
    });
  });

  describe('Admin Analytics', () => {
    beforeEach(async () => {
      // Create test data for analytics with unique slugs
      const timestamp = Date.now();
      const brand = await prisma.brand.create({
        data: {
          name: 'Test Brand',
          slug: `test-brand-${timestamp}`,
          website: 'https://test.com',
        },
      });

      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          slug: `test-product-${timestamp}`,
          price: 29.99,
          brandId: brand.id,
        },
      });

      // Create users and orders
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            email: `analytics-user${i}-${timestamp}@example.com`,
            password: await bcrypt.hash('Password123!', 12),
            firstName: `User${i}`,
            lastName: 'Test',
            role: UserRole.CONSUMER,
            brandId: brand.id,
          },
        });

        const design = await prisma.design.create({
          data: {
            prompt: `Test design ${i}`,
            status: 'COMPLETED',
            userId: user.id,
            brandId: brand.id,
            productId: product.id,
            renderUrl: `https://example.com/design${i}.png`,
            options: {},
          },
        });

        await prisma.order.create({
          data: {
            orderNumber: `ORD-${timestamp}-${i}`,
            customerEmail: user.email,
            designId: design.id,
            userId: user.id,
            brandId: brand.id,
            subtotalCents: 2999,
            totalCents: 2999,
            status: 'PAID',
          },
        });
      }
    });

    it('should get analytics overview', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      // Handle wrapped response
      const body = response.body.data || response.body;
      expect(body).toHaveProperty('mrr');
      expect(body).toHaveProperty('customers');
      expect(body).toHaveProperty('churnRate');
      expect(typeof body.mrr).toBe('number');
      expect(typeof body.customers).toBe('number');
    });

    it('should get revenue metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ period: '30d' })
        .expect(200);

      // Handle wrapped response
      const body = response.body.data || response.body;
      expect(body).toHaveProperty('totalRevenue');
      expect(body).toHaveProperty('mrr');
      expect(body).toHaveProperty('arr');
    });
  });

  describe('Admin Export', () => {
    beforeEach(async () => {
      // Create test data
      for (let i = 0; i < 3; i++) {
        await prisma.user.create({
          data: {
            email: `export-user${i}@example.com`,
            password: await bcrypt.hash('Password123!', 12),
            firstName: `Export${i}`,
            lastName: 'Test',
            role: UserRole.CONSUMER,
          },
        });
      }
    });

    it('should export customers to CSV', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/export')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ format: 'csv', type: 'customers' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('email');
    });

    it('should export analytics to PDF', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/export')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ format: 'pdf', type: 'analytics' })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
    });
  });
});
