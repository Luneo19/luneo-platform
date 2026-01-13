/**
 * Integration Tests - Admin Workflow
 * Tests Admin workflow: Admin Login → View Customers → Analytics → Export
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('Admin Workflow Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let adminUserId: string;

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
    await prisma.order.deleteMany({});
    await prisma.design.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 12);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@luneo.app',
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
        email: 'admin@luneo.app',
        password: 'AdminPassword123!',
      })
      .expect(200);

    adminAccessToken = loginResponse.body.accessToken;
  });

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

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter customers by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'customer0@example.com' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].email).toContain('customer0');
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

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
        expect(response.body.id).toBe(customerId);
      }
    });
  });

  describe('Admin Analytics', () => {
    beforeEach(async () => {
      // Create test data for analytics
      const brand = await prisma.brand.create({
        data: {
          name: 'Test Brand',
          slug: 'test-brand',
          website: 'https://test.com',
        },
      });

      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          slug: 'test-product',
          price: 29.99,
          brandId: brand.id,
        },
      });

      // Create users and orders
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            email: `analytics-user${i}@example.com`,
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
            orderNumber: `ORD-${Date.now()}-${i}`,
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

      expect(response.body).toHaveProperty('mrr');
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('churnRate');
      expect(typeof response.body.mrr).toBe('number');
      expect(typeof response.body.customers).toBe('number');
    });

    it('should get revenue metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ period: '30d' })
        .expect(200);

      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('mrr');
      expect(response.body).toHaveProperty('arr');
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
