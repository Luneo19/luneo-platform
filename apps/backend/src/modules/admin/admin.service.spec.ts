/**
 * AdminService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import { UserRole } from '@prisma/client';

describe('AdminService', () => {
  let service: AdminService;
  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
    },
    order: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    analyticsSegment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    brand: { count: jest.fn() },
    product: { count: jest.fn() },
    design: { count: jest.fn() },
    aICost: { findMany: jest.fn() },
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getCustomers', () => {
    it('should return paginated customers', async () => {
      const customers = [
        {
          id: 'u1',
          email: 'u1@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.BRAND_ADMIN,
          emailVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          brand: null,
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(customers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.getCustomers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(mockPrisma.user.count).toHaveBeenCalled();
    });

    it('should apply search filter when provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getCustomers({ page: 1, limit: 10, search: 'john' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('getCustomerById', () => {
    it('should return customer when found', async () => {
      const customer = {
        id: 'c1',
        email: 'c1@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.BRAND_ADMIN,
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        brand: null,
        designs: [],
        orders: [],
      };
      mockPrisma.user.findUnique.mockResolvedValue(customer);

      const result = await service.getCustomerById('c1');

      expect(result).toEqual(customer);
      expect(result.id).toBe('c1');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'c1' } }),
      );
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getCustomerById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getCustomerById('nonexistent')).rejects.toThrow(
        'Customer with ID nonexistent not found',
      );
    });
  });

  describe('getAnalyticsOverview', () => {
    it('should return analytics overview', async () => {
      mockPrisma.user.count.mockResolvedValueOnce(100).mockResolvedValueOnce(10);
      mockPrisma.order.count.mockResolvedValueOnce(50).mockResolvedValueOnce(5);
      mockPrisma.order.aggregate
        .mockResolvedValueOnce({ _sum: { totalCents: 100000 } })
        .mockResolvedValueOnce({ _sum: { totalCents: 50000 } });
      mockPrisma.user.count.mockResolvedValueOnce(80);

      const result = await service.getAnalyticsOverview();

      expect(result.customers).toBe(100);
      expect(result.newCustomers).toBe(10);
      expect(result.totalOrders).toBe(50);
      expect(result.ordersLast30Days).toBe(5);
      expect(result.mrr).toBe(1000);
      expect(result.arr).toBe(12000);
      expect(typeof result.churnRate).toBe('number');
    });
  });

  describe('getMetrics', () => {
    it('should return dashboard metrics', async () => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.brand.count.mockResolvedValue(5);
      mockPrisma.product.count.mockResolvedValue(20);
      mockPrisma.order.count.mockResolvedValue(30);
      mockPrisma.design.count.mockResolvedValue(40);

      const result = await service.getMetrics();

      expect(result.totalUsers).toBe(10);
      expect(result.totalBrands).toBe(5);
      expect(result.totalProducts).toBe(20);
      expect(result.totalOrders).toBe(30);
      expect(result.totalDesigns).toBe(40);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('exportData', () => {
    it('should export customers as CSV', async () => {
      const customers = [
        {
          id: 'u1',
          email: 'u1@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.BRAND_ADMIN,
          createdAt: new Date(),
          brand: { name: 'Brand1', subscriptionPlan: 'STARTER' },
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(customers);

      const result = await service.exportData('csv', 'customers');

      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toMatch(/^customers-.*\.csv$/);
      expect(result.content).toContain('id,email,firstName');
    });

    it('should throw BadRequestException for unknown export type', async () => {
      await expect(
        service.exportData('csv', 'unknown' as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.exportData('csv', 'unknown' as any),
      ).rejects.toThrow('Unknown export type');
    });
  });

  describe('bulkActionCustomers', () => {
    it('should throw BadRequestException for unknown action', async () => {
      await expect(
        service.bulkActionCustomers(['u1'], 'invalid' as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.bulkActionCustomers(['u1'], 'invalid' as any),
      ).rejects.toThrow('Unknown bulk action');
    });
  });
});
