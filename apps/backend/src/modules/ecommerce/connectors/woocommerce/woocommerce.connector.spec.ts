import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { WooCommerceConnector } from './woocommerce.connector';
import { of, throwError } from 'rxjs';
import * as crypto from 'crypto';

describe('WooCommerceConnector', () => {
  let connector: WooCommerceConnector;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: any;
  let cacheService: jest.Mocked<SmartCacheService>;

  const mockBrandId = 'test-brand-id';
  const mockSiteUrl = 'https://test-store.com';
  const mockConsumerKey = 'ck_test_key';
  const mockConsumerSecret = 'cs_test_secret';
  const mockIntegrationId = 'test-integration-id';

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'app.url') return 'https://api.luneo.app';
        return null;
      }),
    };

    const mockPrismaService = {
      ecommerceIntegration: {
        create: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
      },
      product: {
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
      },
      productMapping: {
        create: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
      },
      order: {
        create: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
      },
      syncLog: {
        create: jest.fn() as jest.Mock,
      },
    } as any;

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WooCommerceConnector,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SmartCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    connector = module.get<WooCommerceConnector>(WooCommerceConnector);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SmartCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should successfully connect to WooCommerce store', async () => {
      // Mock validateCredentials
      httpService.get.mockReturnValue(
        of({
          status: 200,
          data: { environment: { version: '8.0.0', wp_version: '6.4' } },
        } as any),
      );

      // Mock create integration
      const mockIntegration = {
        id: mockIntegrationId,
        brandId: mockBrandId,
        platform: 'woocommerce',
        shopDomain: mockSiteUrl,
        config: {
          consumerKey: Buffer.from(mockConsumerKey).toString('base64'),
          consumerSecret: Buffer.from(mockConsumerSecret).toString('base64'),
          apiVersion: 'v3',
          webhookSecret: 'test-secret',
        },
        status: 'active',
      };

      prismaService.ecommerceIntegration.create.mockResolvedValue(mockIntegration as any);

      // Mock webhook creation
      httpService.post.mockReturnValue(
        of({
          status: 201,
          data: { id: 1, topic: 'product.created', delivery_url: 'https://api.luneo.app/webhook' },
        } as any),
      );

      const result = await connector.connect(mockBrandId, mockSiteUrl, mockConsumerKey, mockConsumerSecret);

      expect(result).toBeDefined();
      expect(result.brandId).toBe(mockBrandId);
      expect(prismaService.ecommerceIntegration.create).toHaveBeenCalled();
      expect(httpService.post).toHaveBeenCalledTimes(5); // 5 webhooks
    });

    it('should throw error if credentials are invalid', async () => {
      httpService.get.mockReturnValue(
        throwError(() => ({
          response: { status: 401, data: { message: 'Invalid credentials' } },
        })),
      );

      await expect(
        connector.connect(mockBrandId, mockSiteUrl, mockConsumerKey, mockConsumerSecret),
      ).rejects.toThrow();

      expect(prismaService.ecommerceIntegration.create).not.toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    it('should fetch products from WooCommerce', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Test Product',
          sku: 'TEST-001',
          price: '29.99',
          status: 'publish',
          images: [{ src: 'https://example.com/image.jpg' }],
        },
      ];

      prismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        id: mockIntegrationId,
        brandId: mockBrandId,
        platform: 'woocommerce',
        shopDomain: mockSiteUrl,
        config: {
          consumerKey: Buffer.from(mockConsumerKey).toString('base64'),
          consumerSecret: Buffer.from(mockConsumerSecret).toString('base64'),
          apiVersion: 'v3',
          webhookSecret: 'test-secret',
        },
        status: 'active',
      } as any);

      httpService.get.mockReturnValue(
        of({
          status: 200,
          data: mockProducts,
        } as any),
      );

      const result = await connector.getProducts(mockIntegrationId);

      expect(result).toEqual(mockProducts);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/wp-json/wc/v3/products'),
        expect.objectContaining({
          auth: {
            username: mockConsumerKey,
            password: mockConsumerSecret,
          },
        }),
      );
    });

    it('should handle pagination options', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        id: mockIntegrationId,
        shopDomain: mockSiteUrl,
        config: {
          consumerKey: Buffer.from(mockConsumerKey).toString('base64'),
          consumerSecret: Buffer.from(mockConsumerSecret).toString('base64'),
          apiVersion: 'v3',
        },
      } as any);

      httpService.get.mockReturnValue(of({ status: 200, data: [] } as any));

      await connector.getProducts(mockIntegrationId, { per_page: 50, page: 2, status: 'publish' });

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('per_page=50'),
        expect.any(Object),
      );
    });
  });

  describe('syncProducts', () => {
    it('should successfully sync products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          sku: 'SKU-001',
          price: '19.99',
          status: 'publish',
          images: [],
        },
        {
          id: 2,
          name: 'Product 2',
          sku: 'SKU-002',
          price: '29.99',
          status: 'publish',
          images: [],
        },
      ];

      prismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        id: mockIntegrationId,
        brandId: mockBrandId,
        shopDomain: mockSiteUrl,
        config: {
          consumerKey: Buffer.from(mockConsumerKey).toString('base64'),
          consumerSecret: Buffer.from(mockConsumerSecret).toString('base64'),
          apiVersion: 'v3',
        },
      } as any);

      httpService.get.mockReturnValue(
        of({
          status: 200,
          data: mockProducts,
        } as any),
      );

      prismaService.productMapping.findFirst.mockResolvedValue(null);
      prismaService.product.create.mockResolvedValue({
        id: 'luneo-product-id',
        brandId: mockBrandId,
        name: 'Product 1',
      } as any);
      prismaService.productMapping.create.mockResolvedValue({
        id: 'mapping-id',
        integrationId: mockIntegrationId,
        luneoProductId: 'luneo-product-id',
        externalProductId: '1',
      } as any);
      prismaService.syncLog.create.mockResolvedValue({
        id: 'sync-log-id',
        integrationId: mockIntegrationId,
        type: 'product',
        status: 'success',
        itemsProcessed: 2,
        itemsFailed: 0,
      } as any);

      const result = await connector.syncProducts(mockIntegrationId);

      expect(result.status).toBe('success');
      expect(result.itemsProcessed).toBe(2);
      expect(result.itemsFailed).toBe(0);
      expect(prismaService.syncLog.create).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        id: mockIntegrationId,
        brandId: mockBrandId,
        shopDomain: mockSiteUrl,
        config: {
          consumerKey: Buffer.from(mockConsumerKey).toString('base64'),
          consumerSecret: Buffer.from(mockConsumerSecret).toString('base64'),
          apiVersion: 'v3',
        },
      } as any);

      httpService.get.mockReturnValue(
        of({
          status: 200,
          data: [
            {
              id: 1,
              name: 'Product 1',
              sku: 'SKU-001',
              price: '19.99',
              status: 'publish',
              images: [],
            },
          ],
        } as any),
      );

      prismaService.productMapping.findFirst.mockResolvedValue(null);
      prismaService.product.create.mockRejectedValue(new Error('Database error'));

      prismaService.syncLog.create.mockResolvedValue({
        id: 'sync-log-id',
        integrationId: mockIntegrationId,
        type: 'product',
        status: 'partial',
        itemsProcessed: 0,
        itemsFailed: 1,
      } as any);

      const result = await connector.syncProducts(mockIntegrationId);

      expect(result.status).toBe('failed');
      expect(result.itemsFailed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('handleWebhook', () => {
    it('should handle product.created webhook', async () => {
      const mockProduct = {
        id: 1,
        name: 'New Product',
        sku: 'NEW-001',
        price: '39.99',
        status: 'publish',
        images: [],
      };

      const mockIntegration = {
        id: mockIntegrationId,
        brandId: mockBrandId,
        platform: 'woocommerce',
        status: 'active',
        config: {
          consumerKey: Buffer.from(mockConsumerKey).toString('base64'),
          consumerSecret: Buffer.from(mockConsumerSecret).toString('base64'),
          apiVersion: 'v3',
          webhookSecret: 'test-secret',
        },
      };

      prismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration as any);
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue(mockIntegration as any);

      prismaService.productMapping.findFirst.mockResolvedValue(null);
      prismaService.product.create.mockResolvedValue({
        id: 'luneo-product-id',
        brandId: mockBrandId,
      } as any);
      prismaService.productMapping.create.mockResolvedValue({
        id: 'mapping-id',
      } as any);

      const payload = JSON.stringify(mockProduct);
      const signature = crypto.createHmac('sha256', 'test-secret').update(payload).digest('base64');

      await connector.handleWebhook('product.created', mockProduct, signature);

      expect(prismaService.product.create).toHaveBeenCalled();
    });

    it('should reject webhook with invalid signature', async () => {
      prismaService.ecommerceIntegration.findFirst.mockResolvedValue({
        id: mockIntegrationId,
        platform: 'woocommerce',
        config: {
          consumerKey: Buffer.from(mockConsumerKey).toString('base64'),
          consumerSecret: Buffer.from(mockConsumerSecret).toString('base64'),
          apiVersion: 'v3',
          webhookSecret: 'test-secret',
        },
      } as any);

      const payload = JSON.stringify({ id: 1, name: 'Product' });
      const invalidSignature = 'invalid-signature';

      await expect(
        connector.handleWebhook('product.created', { id: 1, name: 'Product' }, invalidSignature),
      ).rejects.toThrow('Invalid webhook signature');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status in WooCommerce', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        id: mockIntegrationId,
        shopDomain: mockSiteUrl,
        config: {
          consumerKey: Buffer.from(mockConsumerKey).toString('base64'),
          consumerSecret: Buffer.from(mockConsumerSecret).toString('base64'),
          apiVersion: 'v3',
        },
      } as any);

      const mockOrder = {
        id: 123,
        status: 'completed',
        total: '99.99',
      };

      httpService.put.mockReturnValue(
        of({
          status: 200,
          data: mockOrder,
        } as any),
      );

      const result = await connector.updateOrderStatus(mockIntegrationId, 123, 'completed');

      expect(result).toEqual(mockOrder);
      expect(httpService.put).toHaveBeenCalledWith(
        expect.stringContaining('/wp-json/wc/v3/orders/123'),
        { status: 'completed' },
        expect.any(Object),
      );
    });
  });
});

