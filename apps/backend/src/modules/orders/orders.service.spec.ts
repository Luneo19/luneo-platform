/**
 * OrdersService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { DiscountService } from './services/discount.service';
import { CommissionService } from '@/modules/billing/services/commission.service';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';

describe('OrdersService', () => {
  let service: OrdersService;
  const mockPrisma = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    product: { findMany: jest.fn() },
    design: { findMany: jest.fn(), findUnique: jest.fn() },
    discountUsage: { findFirst: jest.fn(), delete: jest.fn() },
    discount: { update: jest.fn() },
    commission: { findMany: jest.fn(), updateMany: jest.fn() },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'app.frontendUrl': 'https://app.test.com',
        'referral.commissionPercent': '10',
      };
      return map[key];
    }),
  };

  const mockDiscountService = {
    validateAndApplyDiscount: jest.fn(),
    recordDiscountUsage: jest.fn(),
  };

  const mockCommissionService = {
    getCommissionPercent: jest.fn().mockResolvedValue(10),
    calculateCommissionCents: jest.fn((amount: number, pct: number) =>
      Math.round((amount * pct) / 100),
    ),
  };

  const platformAdmin: CurrentUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.PLATFORM_ADMIN,
    brandId: null,
  };

  const brandUser: CurrentUser = {
    id: 'user-1',
    email: 'user@brand.com',
    role: UserRole.BRAND_ADMIN,
    brandId: 'brand-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DiscountService, useValue: mockDiscountService },
        { provide: CommissionService, useValue: mockCommissionService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return orders for platform admin', async () => {
      const orders = [
        {
          id: 'ord-1',
          orderNumber: 'ORD-1',
          customerEmail: 'c@test.com',
          status: OrderStatus.PAID,
          brandId: 'brand-1',
          items: [],
        },
      ];
      mockPrisma.order.findMany.mockResolvedValue(orders);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await service.findAll(platformAdmin, { page: 1, limit: 20 });

      expect(result.orders).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(mockPrisma.order.findMany).toHaveBeenCalled();
    });

    it('should return empty list when non-admin has no brandId', async () => {
      const result = await service.findAll(
        { ...brandUser, brandId: undefined },
        {},
      );

      expect(result.orders).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
    });

    it('should filter by brandId for non-admin', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAll(brandUser, { page: 1, limit: 20 });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ brandId: 'brand-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return order when found and user has access', async () => {
      const order = {
        id: 'ord-1',
        orderNumber: 'ORD-1',
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findOne('ord-1', brandUser);

      expect(result).toEqual(order);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ord-1' } }),
      );
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', platformAdmin)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent', platformAdmin)).rejects.toThrow(
        'Order not found',
      );
    });

    it('should throw ForbiddenException when user has no access', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        brandId: 'other-brand',
        userId: 'other-user',
        items: [],
        brand: {},
        user: {},
      });

      await expect(service.findOne('ord-1', brandUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('ord-1', brandUser)).rejects.toThrow(
        'Access denied to this order',
      );
    });
  });

  describe('update', () => {
    it('should update order with valid status transition', async () => {
      const existingOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-1',
        status: OrderStatus.PAID,
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };
      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);
      mockPrisma.order.update.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-1',
        status: OrderStatus.PROCESSING,
        trackingNumber: null,
        notes: null,
        updatedAt: new Date(),
      });

      const result = await service.update(
        'ord-1',
        { status: OrderStatus.PROCESSING },
        brandUser,
      );

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const existingOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-1',
        status: OrderStatus.PAID,
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };
      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.update('ord-1', { status: OrderStatus.DELIVERED }, brandUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('ord-1', { status: OrderStatus.DELIVERED }, brandUser),
      ).rejects.toThrow(/Cannot transition/);
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel order in CREATED status', async () => {
      const order = {
        id: 'ord-1',
        status: OrderStatus.CREATED,
        paymentStatus: PaymentStatus.PENDING,
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.discountUsage.findFirst.mockResolvedValue(null);
      mockPrisma.order.update.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
      });

      const result = await service.cancel('ord-1', brandUser);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-1' },
          data: expect.objectContaining({
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.CANCELLED,
          }),
        }),
      );
    });

    it('should throw ForbiddenException when order cannot be cancelled', async () => {
      const order = {
        id: 'ord-1',
        status: OrderStatus.SHIPPED,
        paymentStatus: PaymentStatus.SUCCEEDED,
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(service.cancel('ord-1', brandUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.cancel('ord-1', brandUser)).rejects.toThrow(
        /only be cancelled when in CREATED or PENDING_PAYMENT/,
      );
    });
  });

  describe('getTracking', () => {
    it('should return tracking info when order found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.SHIPPED,
        trackingNumber: 'TRK123',
        trackingCarrier: 'DHL',
        trackingUrl: 'https://track.example/TRK123',
        shippedAt: new Date(),
        deliveredAt: null,
        estimatedDelivery: null,
      });

      const result = await service.getTracking('ord-1', brandUser);

      expect(result.orderId).toBe('ord-1');
      expect(result.tracking).toBeDefined();
      expect(result.tracking?.number).toBe('TRK123');
      expect(result.tracking?.carrier).toBe('DHL');
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.getTracking('nonexistent', brandUser),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getTracking('nonexistent', brandUser),
      ).rejects.toThrow('Order not found');
    });
  });
});
