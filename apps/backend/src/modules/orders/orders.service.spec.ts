import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { DiscountService } from './services/discount.service';
import { CommissionService } from '@/modules/billing/services/commission.service';
import { ReferralService } from '../referral/referral.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockOrderDelegate = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  };
  const mockDiscountUsage = {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };
  const mockDiscount = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const mockPrisma = {
    order: mockOrderDelegate,
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    design: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    discountUsage: mockDiscountUsage,
    discount: mockDiscount,
    commission: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'stripe.secretKey': 'sk_test_mock',
        'app.frontendUrl': 'http://localhost:3000',
        'referral.commissionPercent': 10,
      };
      return config[key];
    }),
    getOrThrow: jest.fn((key: string) => {
      return `mock-value-for-${key}`;
    }),
  };

  const mockDiscountService = {
    validateAndApplyDiscount: jest.fn(),
    recordDiscountUsage: jest.fn(),
  };

  const mockCommissionService = {
    getCommissionPercent: jest.fn().mockResolvedValue(10),
    calculateCommissionCents: jest.fn((amount: number, percent: number) =>
      Math.round((amount * percent) / 100),
    ),
  };

  const mockReferralService = {
    createCommissionFromOrder: jest.fn(),
  };

  const mockNotificationsService = {
    send: jest.fn(),
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
    mockPrisma.$transaction.mockImplementation((fn: (tx: any) => Promise<any>) => {
      const tx = {
        order: mockOrderDelegate,
        discountUsage: mockDiscountUsage,
        discount: mockDiscount,
      };
      return fn(tx);
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DiscountService, useValue: mockDiscountService },
        { provide: CommissionService, useValue: mockCommissionService },
        { provide: ReferralService, useValue: mockReferralService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated orders for platform admin', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          orderNumber: 'ORD-123',
          customerEmail: 'customer@test.com',
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          shippingAddress: {},
          subtotalCents: 10000,
          taxCents: 2000,
          shippingCents: 500,
          totalCents: 12500,
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.SUCCEEDED,
          createdAt: new Date(),
          items: [],
        },
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await service.findAll(platformAdmin, { page: 1, limit: 20 });

      expect(result.orders).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalPages).toBe(1);
      expect(mockPrisma.order.findMany).toHaveBeenCalled();
      expect(mockPrisma.order.count).toHaveBeenCalled();
    });

    it('should filter by brandId for non-admin users', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAll(brandUser, { page: 1, limit: 20 });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brandId: 'brand-1',
          }),
        }),
      );
    });

    it('should return empty result when non-admin has no brandId', async () => {
      const userWithoutBrand = { ...brandUser, brandId: undefined };

      const result = await service.findAll(userWithoutBrand, {});

      expect(result.orders).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
    });

    it('should filter by status when provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAll(platformAdmin, { status: OrderStatus.PAID });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PAID,
          }),
        }),
      );
    });

    it('should search by orderNumber or customerEmail', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAll(platformAdmin, { search: 'ORD-123' });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                orderNumber: expect.objectContaining({
                  contains: 'ORD-123',
                  mode: 'insensitive',
                }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return order when found and user has access', async () => {
      const mockOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-123',
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne('ord-1', brandUser);

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-1' },
        }),
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
      const mockOrder = {
        id: 'ord-1',
        brandId: 'other-brand',
        userId: 'other-user',
        items: [],
        brand: {},
        user: {},
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.findOne('ord-1', brandUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('ord-1', brandUser)).rejects.toThrow(
        'Access denied to this order',
      );
    });
  });

  describe('create', () => {
    it('should create order with items array', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        price: 29.99,
        brandId: 'brand-1',
        isActive: true,
        status: 'ACTIVE',
      };

      const mockOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@test.com',
        subtotalCents: 2999,
        taxCents: 600,
        shippingCents: 500,
        totalCents: 4099,
        status: OrderStatus.CREATED,
        paymentStatus: PaymentStatus.PENDING,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 1,
            priceCents: 2999,
            totalCents: 2999,
            product: mockProduct,
          },
        ],
        checkoutUrl: 'https://checkout.stripe.com/test',
      };

      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.design.findMany.mockResolvedValue([]);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        stripeSessionId: 'session_123',
      });

      // Mock Stripe
      const mockStripe = {
        checkout: {
          sessions: {
            create: jest.fn().mockResolvedValue({
              id: 'session_123',
              url: 'https://checkout.stripe.com/test',
            }),
          },
        },
      };

      jest.spyOn(service as any, 'getStripe').mockResolvedValue(mockStripe);

      const createDto = {
        items: [
          {
            product_id: 'prod-1',
            quantity: 1,
          },
        ],
        customerEmail: 'customer@test.com',
        customerName: 'John Doe',
        shippingAddress: {},
        shippingMethod: 'standard',
      };

      const result = await service.create(createDto as any, brandUser);

      expect(result).toBeDefined();
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });

    it('should apply discount code when provided', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        price: 29.99,
        brandId: 'brand-1',
        isActive: true,
        status: 'ACTIVE',
      };

      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.design.findMany.mockResolvedValue([]);
      mockDiscountService.validateAndApplyDiscount.mockResolvedValue({
        discountId: 'discount-1',
        discountCents: 500,
        discountPercent: 10,
        code: 'SAVE10',
        type: 'percentage',
        description: '10% off',
      });

      const mockOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-123',
        items: [],
        checkoutUrl: 'https://checkout.stripe.com/test',
      };

      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue(mockOrder);

      const mockStripe = {
        checkout: {
          sessions: {
            create: jest.fn().mockResolvedValue({
              id: 'session_123',
              url: 'https://checkout.stripe.com/test',
            }),
          },
        },
      };

      jest.spyOn(service as any, 'getStripe').mockResolvedValue(mockStripe);

      const createDto = {
        items: [{ product_id: 'prod-1', quantity: 1 }],
        customerEmail: 'customer@test.com',
        discountCode: 'SAVE10',
        shippingMethod: 'standard',
      };

      await service.create(createDto as any, brandUser);

      expect(mockDiscountService.validateAndApplyDiscount).toHaveBeenCalledWith(
        'SAVE10',
        expect.any(Number),
        'brand-1',
        'user-1',
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const createDto = {
        items: [{ product_id: 'nonexistent', quantity: 1 }],
        customerEmail: 'customer@test.com',
        shippingMethod: 'standard',
      };

      await expect(service.create(createDto as any, brandUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update order status with valid transition', async () => {
      const existingOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-123',
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
        orderNumber: 'ORD-123',
        status: OrderStatus.PROCESSING,
        updatedAt: new Date(),
      });

      const result = await service.updateStatus('ord-1', OrderStatus.PROCESSING, brandUser);

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-1' },
          data: { status: OrderStatus.PROCESSING },
        }),
      );
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const existingOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-123',
        status: OrderStatus.PAID,
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };

      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.updateStatus('ord-1', OrderStatus.DELIVERED, brandUser),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not admin or brand owner', async () => {
      const existingOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-123',
        status: OrderStatus.PAID,
        brandId: 'other-brand',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };

      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.updateStatus('ord-1', OrderStatus.PROCESSING, brandUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update order with valid data', async () => {
      const existingOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-123',
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
        orderNumber: 'ORD-123',
        status: OrderStatus.PROCESSING,
        trackingNumber: 'TRK123',
        notes: 'Updated notes',
        updatedAt: new Date(),
      });

      const result = await service.update(
        'ord-1',
        {
          status: OrderStatus.PROCESSING,
          trackingNumber: 'TRK123',
          notes: 'Updated notes',
        },
        brandUser,
      );

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(result.trackingNumber).toBe('TRK123');
      expect(result.notes).toBe('Updated notes');
    });

    it('should validate status transitions', async () => {
      const existingOrder = {
        id: 'ord-1',
        orderNumber: 'ORD-123',
        status: OrderStatus.CREATED,
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
    });
  });

  describe('cancel', () => {
    it('should cancel order in CREATED status', async () => {
      const existingOrder = {
        id: 'ord-1',
        status: OrderStatus.CREATED,
        paymentStatus: PaymentStatus.PENDING,
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };

      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);
      mockPrisma.discountUsage.findFirst.mockResolvedValue(null);
      mockPrisma.order.update.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
      });

      const result = await service.cancel('ord-1', brandUser);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.paymentStatus).toBe(PaymentStatus.CANCELLED);
    });

    it('should throw BadRequestException when order cannot be cancelled', async () => {
      const existingOrder = {
        id: 'ord-1',
        status: OrderStatus.SHIPPED,
        paymentStatus: PaymentStatus.SUCCEEDED,
        brandId: 'brand-1',
        userId: 'user-1',
        items: [],
        brand: {},
        user: {},
      };

      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);

      await expect(service.cancel('ord-1', brandUser)).rejects.toThrow(BadRequestException);
    });
  });
});
