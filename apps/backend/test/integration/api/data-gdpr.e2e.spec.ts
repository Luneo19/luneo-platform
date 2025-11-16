import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

describe('Data GDPR Endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  
  let testUser: { id: string; email: string; role: UserRole };
  let testUserToken: string;
  let adminUser: { id: string; email: string; role: UserRole };
  let adminToken: string;
  let otherUser: { id: string; email: string; role: UserRole };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'testuser@gdpr.test',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.CONSUMER,
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@gdpr.test',
        password: 'hashedpassword',
        name: 'Admin User',
        role: UserRole.PLATFORM_ADMIN,
      },
    });

    otherUser = await prisma.user.create({
      data: {
        email: 'otheruser@gdpr.test',
        password: 'hashedpassword',
        name: 'Other User',
        role: UserRole.CONSUMER,
      },
    });

    // Generate JWT tokens
    testUserToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });

    adminToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    // Create some test data for the user
    await prisma.design.create({
      data: {
        userId: testUser.id,
        prompt: 'Test design',
        options: {},
        status: 'COMPLETED',
      },
    });

    await prisma.order.create({
      data: {
        userId: testUser.id,
        status: 'PAID',
        total: 99.99,
        currency: 'EUR',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.design.deleteMany({
      where: {
        userId: { in: [testUser.id, otherUser.id] },
      },
    });
    await prisma.order.deleteMany({
      where: {
        userId: { in: [testUser.id, otherUser.id] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [testUser.id, adminUser.id, otherUser.id] },
      },
    });

    await app.close();
  });

  describe('POST /api/data/export', () => {
    it('should export user data successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/data/export?userId=${testUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('designs');
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('auditLogs');
      expect(response.body).toHaveProperty('usageMetrics');
      expect(response.body).toHaveProperty('exportedAt');

      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.email).toBe(testUser.email);
      expect(Array.isArray(response.body.designs)).toBe(true);
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should allow admin to export any user data', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/data/export?userId=${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(testUser.id);
    });

    it('should reject export request without userId parameter', async () => {
      await request(app.getHttpServer())
        .post('/api/data/export')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(400);
    });

    it('should reject export request with empty userId', async () => {
      await request(app.getHttpServer())
        .post('/api/data/export?userId=')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(400);
    });

    it('should prevent users from exporting other users data', async () => {
      await request(app.getHttpServer())
        .post(`/api/data/export?userId=${otherUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404); // Returns 404 to not reveal existence of other users
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post(`/api/data/export?userId=${testUser.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/data/export?userId=non-existent-id')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/data/erase', () => {
    let userToDelete: { id: string; email: string };

    beforeEach(async () => {
      // Create a user specifically for deletion tests
      userToDelete = await prisma.user.create({
        data: {
          email: `delete-test-${Date.now()}@gdpr.test`,
          password: 'hashedpassword',
          name: 'User To Delete',
          role: UserRole.CONSUMER,
        },
      });

      // Create some data for this user
      await prisma.design.create({
        data: {
          userId: userToDelete.id,
          prompt: 'Test design for deletion',
          options: {},
          status: 'COMPLETED',
        },
      });

      await prisma.order.create({
        data: {
          userId: userToDelete.id,
          status: 'PAID',
          total: 50.00,
          currency: 'EUR',
        },
      });
    });

    it('should delete user data successfully', async () => {
      const deleteToken = jwtService.sign({
        sub: userToDelete.id,
        email: userToDelete.email,
        role: userToDelete.role,
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/data/erase?userId=${userToDelete.id}`)
        .set('Authorization', `Bearer ${deleteToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);
      expect(response.body).toHaveProperty('itemsDeleted');
      expect(response.body.itemsDeleted).toHaveProperty('user', 1);
      expect(response.body.itemsDeleted).toHaveProperty('designs', 1);
      expect(response.body.itemsDeleted).toHaveProperty('orders', 1);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should allow admin to delete any user data', async () => {
      const userForAdminDelete = await prisma.user.create({
        data: {
          email: `admin-delete-${Date.now()}@gdpr.test`,
          password: 'hashedpassword',
          name: 'User For Admin Delete',
          role: UserRole.CONSUMER,
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/data/erase?userId=${userForAdminDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);

      // Cleanup
      await prisma.user.deleteMany({
        where: { id: userForAdminDelete.id },
      });
    });

    it('should reject deletion request without userId parameter', async () => {
      await request(app.getHttpServer())
        .delete('/api/data/erase')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(400);
    });

    it('should reject deletion request with empty userId', async () => {
      await request(app.getHttpServer())
        .delete('/api/data/erase?userId=')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(400);
    });

    it('should prevent users from deleting other users data', async () => {
      await request(app.getHttpServer())
        .delete(`/api/data/erase?userId=${otherUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404); // Returns 404 to not reveal existence of other users
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/api/data/erase?userId=${testUser.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/api/data/erase?userId=non-existent-id')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);
    });

    it('should anonymize orders instead of deleting them', async () => {
      const userWithOrders = await prisma.user.create({
        data: {
          email: `orders-test-${Date.now()}@gdpr.test`,
          password: 'hashedpassword',
          name: 'User With Orders',
          role: UserRole.CONSUMER,
        },
      });

      const order = await prisma.order.create({
        data: {
          userId: userWithOrders.id,
          status: 'PAID',
          total: 100.00,
          currency: 'EUR',
        },
      });

      const deleteToken = jwtService.sign({
        sub: userWithOrders.id,
        email: userWithOrders.email,
        role: userWithOrders.role,
      });

      await request(app.getHttpServer())
        .delete(`/api/data/erase?userId=${userWithOrders.id}`)
        .set('Authorization', `Bearer ${deleteToken}`)
        .expect(200);

      // Verify order is anonymized (not deleted)
      const anonymizedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(anonymizedOrder).not.toBeNull();
      expect(anonymizedOrder?.userId).toBeNull();
      expect(anonymizedOrder?.userEmail).toBe('deleted@user.anonymized');

      // Cleanup
      await prisma.order.deleteMany({
        where: { id: order.id },
      });
    });
  });
});
