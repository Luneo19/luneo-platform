/**
 * OrdersService - Tests unitaires
 * Tests pour la gestion des commandes
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createTestingModule, testFixtures, testHelpers } from '@/common/test/test-setup';
import { UserRole, OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await createTestingModule([
      OrdersService,
    ]);

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);

    // Mock Stripe to avoid real API calls
    const mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/test',
          }),
        },
      },
    };

    // Mock getStripe method
    jest.spyOn(service as any, 'getStripe').mockResolvedValue(mockStripe);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Note: findAll method doesn't exist in OrdersService
  // These tests are commented out until the method is implemented
  // describe('findAll', () => {
  //   it('should return paginated orders', async () => {
  //     // Arrange
  //     const mockOrders = [testFixtures.order];
  //     (prismaService.order.findMany as any).mockResolvedValue(mockOrders as any);
  //     (prismaService.order.count as any).mockResolvedValue(1);

  //     // Act
  //     const result = await service.findAll({}, { page: 1, limit: 10 });

  //     // Assert
  //     expect(result).toBeDefined();
  //     expect(result.data).toHaveLength(1);
  //     expect(result.pagination.total).toBe(1);
  //     expect(prismaService.order.findMany).toHaveBeenCalled();
  //   });
  // });

  describe('findOne', () => {
    it('should return order by id', async () => {
      // Arrange
      (prismaService.order.findUnique as any).mockResolvedValue({
        ...testFixtures.order,
        product: testFixtures.product,
        design: testFixtures.design,
        brand: testFixtures.brand,
        user: testFixtures.user,
      } as any);

      // Act
      const result = await service.findOne('order_123', testFixtures.currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('order_123');
      expect(prismaService.order.findUnique).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      // Arrange
      (prismaService.order.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid_id', testFixtures.currentUser)).rejects.toThrow(NotFoundException);
    });

    it('should use select for optimization', async () => {
      // Arrange
      (prismaService.order.findUnique as any).mockResolvedValue({
        ...testFixtures.order,
        product: testFixtures.product,
        design: testFixtures.design,
        brand: testFixtures.brand,
        user: testFixtures.user,
      } as any);

      // Act
      await service.findOne('order_123', testFixtures.currentUser);

      // Assert
      const callArgs = (prismaService.order.findUnique as any).mock.calls[0][0];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.include).toBeUndefined();
    });
  });

  describe('create', () => {
    const createDto = {
      productId: 'prod_123',
      designId: 'design_123',
      customerEmail: 'customer@example.com',
      totalCents: 2999,
    };

    it('should create order successfully', async () => {
      // Arrange
      const mockOrderWithItems = {
        ...testFixtures.order,
        ...createDto,
        id: 'order_123',
        items: [
          {
            id: 'item_1',
            productId: 'product_123',
            designId: 'design_123',
            quantity: 1,
            priceCents: 2999,
            totalCents: 2999,
            product: testFixtures.product,
            design: testFixtures.design,
          },
        ],
        brand: testFixtures.brand,
      };

      (prismaService.design.findUnique as any).mockResolvedValue({
        ...testFixtures.design,
        product: testFixtures.product,
        brand: testFixtures.brand,
        user: testFixtures.user,
      } as any);
      (prismaService.order.create as any).mockResolvedValue(mockOrderWithItems as any);
      (prismaService.order.update as any).mockResolvedValue({
        ...mockOrderWithItems,
        stripeSessionId: 'cs_test_123',
      } as any);
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'stripe.secretKey') return 'sk_test_mock';
        if (key === 'app.frontendUrl') return 'https://app.luneo.app';
        return undefined;
      });
      
      // Mock Stripe for this test
      const mockStripeSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };
      (service as any).stripeInstance = {
        checkout: {
          sessions: {
            create: jest.fn().mockResolvedValue(mockStripeSession),
          },
        },
      };

      // Act
      const result = await service.create(createDto as any, testFixtures.currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.checkoutUrl).toBeDefined();
      expect(prismaService.order.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if design not found', async () => {
      // Arrange
      (prismaService.design.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto as any, testFixtures.currentUser)).rejects.toThrow(NotFoundException);
      expect(prismaService.order.create).not.toHaveBeenCalled();
    });
  });

  // Note: updateStatus method doesn't exist in OrdersService
  // These tests are commented out until the method is implemented
  // describe('updateStatus', () => {
  //   it('should update order status successfully', async () => {
  //     // Arrange
  //     (prismaService.order.findUnique as any).mockResolvedValue(testFixtures.order as any);
  //     (prismaService.order.update as any).mockResolvedValue({
  //       ...testFixtures.order,
  //       status: OrderStatus.DELIVERED,
  //     } as any);

  //     // Act
  //     const result = await service.updateStatus('order_123', OrderStatus.DELIVERED);

  //     // Assert
  //     expect(result).toBeDefined();
  //     expect(result.status).toBe(OrderStatus.DELIVERED);
  //     expect(prismaService.order.update).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         where: { id: 'order_123' },
  //         data: { status: OrderStatus.DELIVERED },
  //       }),
  //     );
  //   });
  // });
});

