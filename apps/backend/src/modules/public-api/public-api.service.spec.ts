import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { WebhookService } from './webhooks/webhooks.service';
import { AnalyticsService } from './analytics/analytics.service';
import { WebhookEvent } from './dto';
import { CreateDesignDto } from './dto/create-design.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { AnalyticsPeriod } from './dto/get-analytics.dto';

describe('PublicApiService', () => {
  let service: PublicApiService;

  const mockPrismaService = {
    brand: {
      findUnique: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    design: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockCache = {
    getOrSet: jest.fn((key: string, fn: () => Promise<unknown>) => fn()),
  };

  const mockWebhookService = {
    sendWebhook: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockAnalyticsService = {
    getAnalytics: jest.fn().mockResolvedValue({ metrics: {}, timeSeries: [], summary: {} }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicApiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: WebhookService, useValue: mockWebhookService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    service = module.get<PublicApiService>(PublicApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBrandInfo', () => {
    it('should return brand when found', async () => {
      const brand = {
        id: 'brand-1',
        name: 'Test Brand',
        slug: 'test-brand',
        description: null,
        logo: null,
        website: null,
        status: 'ACTIVE',
        plan: null,
        settings: null,
      };
      mockCache.getOrSet.mockImplementation((_key: string, fn: () => Promise<unknown>) => fn());
      mockPrismaService.brand.findUnique.mockResolvedValue(brand);

      const result = await service.getBrandInfo('brand-1');

      expect(result).toEqual(brand);
      expect(mockPrismaService.brand.findUnique).toHaveBeenCalledWith({
        where: { id: 'brand-1' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when brand not found', async () => {
      mockCache.getOrSet.mockImplementation((_key: string, fn: () => Promise<unknown>) => fn());
      mockPrismaService.brand.findUnique.mockResolvedValue(null);

      await expect(service.getBrandInfo('missing')).rejects.toThrow(NotFoundException);
      await expect(service.getBrandInfo('missing')).rejects.toThrow('Brand not found');
    });
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const products = [
        {
          id: 'prod-1',
          name: 'Product 1',
          description: null,
          sku: null,
          price: 10,
          currency: 'EUR',
          images: [],
          model3dUrl: null,
          customizationOptions: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.getProducts('brand-1', 1, 10);

      expect(result.data).toEqual(products);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      });
    });
  });

  describe('getProduct', () => {
    it('should return product when found and active', async () => {
      const product = {
        id: 'prod-1',
        name: 'Product 1',
        description: null,
        sku: null,
        price: 10,
        currency: 'EUR',
        images: [],
        model3dUrl: null,
        modelConfig: null,
        customizationOptions: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.product.findFirst.mockResolvedValue(product);

      const result = await service.getProduct('brand-1', 'prod-1');

      expect(result).toEqual(product);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.getProduct('brand-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProduct('brand-1', 'missing')).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('getDesign', () => {
    it('should return design when found', async () => {
      const design = {
        id: 'design-1',
        name: 'My Design',
        description: null,
        prompt: 'A red shoe',
        status: 'COMPLETED',
        highResUrl: null,
        previewUrl: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: { id: 'prod-1', name: 'Shoe', price: 50 },
      };
      mockPrismaService.design.findFirst.mockResolvedValue(design);

      const result = await service.getDesign('brand-1', 'design-1');

      expect(result).toEqual(design);
    });

    it('should throw NotFoundException when design not found', async () => {
      mockPrismaService.design.findFirst.mockResolvedValue(null);

      await expect(service.getDesign('brand-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getDesign('brand-1', 'missing')).rejects.toThrow(
        'Design not found',
      );
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const orders = [
        {
          id: 'order-1',
          status: 'CREATED',
          totalCents: 5000,
          currency: 'EUR',
          customerEmail: 'a@b.com',
          customerName: 'John',
          createdAt: new Date(),
          design: { id: 'design-1', name: 'Design' },
        },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(orders);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getOrders('brand-1', 1, 10);

      expect(result.data).toEqual(orders);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      await service.getOrders('brand-1', 1, 10, 'PAID');

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId: 'brand-1', status: 'PAID' },
        }),
      );
    });
  });

  describe('createDesign', () => {
    it('should throw BadRequestException when product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      const dto: CreateDesignDto = {
        name: 'Design',
        prompt: 'A design',
        productId: 'prod-1',
      };

      await expect(service.createDesign('brand-1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createDesign('brand-1', dto)).rejects.toThrow(
        'Product not found or not accessible',
      );
    });

    it('should create design and send webhook', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Product',
        isActive: true,
      });
      const created = {
        id: 'design-1',
        name: 'Design',
        description: null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.design.create.mockResolvedValue(created);

      const dto: CreateDesignDto = {
        name: 'Design',
        prompt: 'A design',
        productId: 'prod-1',
      };

      const result = await service.createDesign('brand-1', dto);

      expect(result).toEqual(created);
      expect(mockWebhookService.sendWebhook).toHaveBeenCalledWith(
        WebhookEvent.DESIGN_CREATED,
        expect.objectContaining({ designId: 'design-1', brandId: 'brand-1' }),
        'brand-1',
      );
    });
  });

  describe('createOrder', () => {
    it('should throw BadRequestException when design not found or not completed', async () => {
      mockPrismaService.design.findFirst.mockResolvedValue(null);

      const dto: CreateOrderDto = {
        designId: 'design-1',
        customerEmail: 'a@b.com',
        customerName: 'John',
        shippingAddress: {
          street: '1 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'FR',
        },
      };

      await expect(service.createOrder('brand-1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder('brand-1', dto)).rejects.toThrow(
        'Design not found or not completed',
      );
    });

    it('should create order and send webhook', async () => {
      mockPrismaService.design.findFirst.mockResolvedValue({
        id: 'design-1',
        brandId: 'brand-1',
        status: 'COMPLETED',
        productId: 'prod-1',
        product: {
          price: 50,
          currency: 'EUR',
        },
      });
      const created = {
        id: 'order-1',
        status: 'CREATED',
        totalCents: 5000,
        currency: 'EUR',
        createdAt: new Date(),
        design: { id: 'design-1', name: 'Design' },
      };
      mockPrismaService.order.create.mockResolvedValue(created);

      const dto: CreateOrderDto = {
        designId: 'design-1',
        customerEmail: 'a@b.com',
        customerName: 'John',
        shippingAddress: {
          street: '1 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'FR',
        },
      };

      const result = await service.createOrder('brand-1', dto);

      expect(result).toEqual(created);
      expect(mockWebhookService.sendWebhook).toHaveBeenCalledWith(
        WebhookEvent.ORDER_CREATED,
        expect.objectContaining({
          orderId: 'order-1',
          brandId: 'brand-1',
          status: 'CREATED',
        }),
        'brand-1',
      );
    });
  });

  describe('getOrder', () => {
    it('should return order when found', async () => {
      const order = {
        id: 'order-1',
        status: 'CREATED',
        totalCents: 5000,
        currency: 'EUR',
        customerEmail: 'a@b.com',
        customerName: 'John',
        shippingAddress: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        design: { id: 'design-1', name: 'Design', highResUrl: null },
      };
      mockPrismaService.order.findFirst.mockResolvedValue(order);

      const result = await service.getOrder('brand-1', 'order-1');

      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(service.getOrder('brand-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrder('brand-1', 'missing')).rejects.toThrow(
        'Order not found',
      );
    });
  });

  describe('testWebhook', () => {
    it('should call webhookService.sendWebhook with TEST event', async () => {
      mockWebhookService.sendWebhook.mockResolvedValue({ success: true });

      await service.testWebhook('brand-1', { message: 'test payload' });

      expect(mockWebhookService.sendWebhook).toHaveBeenCalledWith(
        WebhookEvent.TEST,
        { message: 'test payload' },
        'brand-1',
      );
    });
  });

  describe('getAnalytics', () => {
    it('should delegate to analyticsService.getAnalytics', async () => {
      const query = { period: AnalyticsPeriod.DAY };
      const expected = { metrics: {}, timeSeries: [], summary: {} };
      mockAnalyticsService.getAnalytics.mockResolvedValue(expected);

      const result = await service.getAnalytics('brand-1', query);

      expect(result).toEqual(expected);
      expect(mockAnalyticsService.getAnalytics).toHaveBeenCalledWith('brand-1', query);
    });
  });
});
