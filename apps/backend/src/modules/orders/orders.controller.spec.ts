/**
 * OrdersController - Tests unitaires
 * TEST-06: Tests Controllers critiques
 * Tests pour les endpoints de gestion des commandes
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  // Mock user object
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    role: 'USER',
  };

  // Mock request object (cast to any for Express Request type)
  const mockRequest = (user = mockUser) => ({ user }) as any;

  beforeEach(async () => {
    const mockOrdersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /orders', () => {
    it('should return paginated list of orders', async () => {
      const mockOrders = {
        data: [
          { id: 'order_1', orderNumber: 'ORD-001', status: 'PAID', totalCents: 4999 },
          { id: 'order_2', orderNumber: 'ORD-002', status: 'SHIPPED', totalCents: 7999 },
        ],
        pagination: { page: 1, limit: 20, total: 2 },
      };

      ordersService.findAll.mockResolvedValue(mockOrders as any);

      const req = mockRequest();
      const result = await controller.findAll(req, '1', '20', undefined, undefined);

      expect(ordersService.findAll).toHaveBeenCalledWith(mockUser, {
        page: 1,
        limit: 20,
        status: undefined,
        search: undefined,
      });
      expect(result).toEqual(mockOrders);
    });

    it('should filter orders by status', async () => {
      const mockOrders = {
        orders: [{ id: 'order_1', status: 'PAID' }],
        pagination: { page: 1, limit: 20, total: 1 },
      };

      ordersService.findAll.mockResolvedValue(mockOrders as any);

      const req = mockRequest();
      const result = await controller.findAll(req, undefined, undefined, 'PAID', undefined);

      expect(ordersService.findAll).toHaveBeenCalledWith(mockUser, {
        page: undefined,
        limit: undefined,
        status: 'PAID',
        search: undefined,
      });
      expect((result as any).orders[0].status).toBe('PAID');
    });

    it('should search orders by query', async () => {
      const mockOrders = {
        orders: [{ id: 'order_1', orderNumber: 'ORD-123' }],
        pagination: { page: 1, limit: 20, total: 1 },
      };

      ordersService.findAll.mockResolvedValue(mockOrders as any);

      const req = mockRequest();
      const result = await controller.findAll(req, undefined, undefined, undefined, 'ORD-123');

      expect(ordersService.findAll).toHaveBeenCalledWith(mockUser, {
        page: undefined,
        limit: undefined,
        status: undefined,
        search: 'ORD-123',
      });
    });

    it('should return empty array when no orders exist', async () => {
      ordersService.findAll.mockResolvedValue({
        orders: [],
        pagination: { page: 1, limit: 20, total: 0 },
      } as any);

      const req = mockRequest();
      const result = await controller.findAll(req);

      expect((result as any).orders).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('POST /orders', () => {
    const createOrderDto = {
      items: [
        { product_id: 'prod_1', design_id: 'design_1', quantity: 2 },
      ],
      shippingAddress: {
        line1: '123 Main St',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
      },
    };

    it('should create a new order successfully', async () => {
      const mockOrder = {
        id: 'order_123',
        orderNumber: 'ORD-2025-001',
        status: 'PENDING',
        totalCents: 5000,
        paymentUrl: 'https://checkout.stripe.com/pay/cs_test_123',
        items: createOrderDto.items,
      };

      ordersService.create.mockResolvedValue(mockOrder as any);

      const req = mockRequest();
      const result = await controller.create(createOrderDto, req);

      expect(ordersService.create).toHaveBeenCalledWith(createOrderDto, mockUser);
      expect(result).toEqual(mockOrder);
      expect((result as any).paymentUrl).toBeDefined();
    });

    it('should throw BadRequestException for invalid items', async () => {
      ordersService.create.mockRejectedValue(
        new BadRequestException('Items array is required')
      );

      const req = mockRequest();
      await expect(controller.create({ items: [] } as any, req)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      ordersService.create.mockRejectedValue(
        new NotFoundException('Product not found')
      );

      const req = mockRequest();
      await expect(controller.create(createOrderDto, req)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order details', async () => {
      const mockOrder = {
        id: 'order_123',
        orderNumber: 'ORD-2025-001',
        status: 'PAID',
        totalCents: 4999,
        items: [{ productId: 'prod_1', quantity: 2 }],
        shippingAddress: { city: 'Paris' },
        createdAt: new Date(),
      };

      ordersService.findOne.mockResolvedValue(mockOrder as any);

      const req = mockRequest();
      const result = await controller.findOne('order_123', req);

      expect(ordersService.findOne).toHaveBeenCalledWith('order_123', mockUser);
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      ordersService.findOne.mockRejectedValue(
        new NotFoundException('Order not found')
      );

      const req = mockRequest();
      await expect(controller.findOne('nonexistent', req)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when accessing another user order', async () => {
      ordersService.findOne.mockRejectedValue(
        new ForbiddenException('You do not have permission to view this order')
      );

      const req = mockRequest();
      await expect(controller.findOne('other_user_order', req)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('PUT /orders/:id', () => {
    const updateDto = {
      shippingAddress: {
        line1: '456 New St',
        city: 'Lyon',
        postalCode: '69001',
        country: 'FR',
      },
    };

    it('should update order successfully', async () => {
      const mockUpdatedOrder = {
        id: 'order_123',
        orderNumber: 'ORD-2025-001',
        status: 'PENDING',
        shippingAddress: updateDto.shippingAddress,
      };

      ordersService.update.mockResolvedValue(mockUpdatedOrder as any);

      const req = mockRequest();
      const result = await controller.update('order_123', updateDto, req);

      expect(ordersService.update).toHaveBeenCalledWith('order_123', updateDto, mockUser);
      expect((result as any).shippingAddress.city).toBe('Lyon');
    });

    it('should throw NotFoundException when order not found', async () => {
      ordersService.update.mockRejectedValue(
        new NotFoundException('Order not found')
      );

      const req = mockRequest();
      await expect(controller.update('nonexistent', updateDto, req)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when order cannot be updated', async () => {
      ordersService.update.mockRejectedValue(
        new BadRequestException('Cannot update order after it has been shipped')
      );

      const req = mockRequest();
      await expect(controller.update('shipped_order', updateDto, req)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('POST /orders/:id/cancel', () => {
    it('should cancel order successfully', async () => {
      const mockCancelledOrder = {
        id: 'order_123',
        orderNumber: 'ORD-2025-001',
        status: 'CANCELLED',
        cancelledAt: new Date(),
      };

      ordersService.cancel.mockResolvedValue(mockCancelledOrder as any);

      const req = mockRequest();
      const result = await controller.cancel('order_123', {}, req);

      expect(ordersService.cancel).toHaveBeenCalledWith('order_123', mockUser, undefined);
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw NotFoundException when order not found', async () => {
      ordersService.cancel.mockRejectedValue(
        new NotFoundException('Order not found')
      );

      const req = mockRequest();
      await expect(controller.cancel('nonexistent', {}, req)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when order cannot be cancelled', async () => {
      ordersService.cancel.mockRejectedValue(
        new BadRequestException('Cannot cancel order that has already been shipped')
      );

      const req = mockRequest();
      await expect(controller.cancel('shipped_order', {}, req)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ForbiddenException when cancelling another user order', async () => {
      ordersService.cancel.mockRejectedValue(
        new ForbiddenException('You do not have permission to cancel this order')
      );

      const req = mockRequest();
      await expect(controller.cancel('other_user_order', {}, req)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
