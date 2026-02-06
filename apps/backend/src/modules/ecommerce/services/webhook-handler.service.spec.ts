/**
 * WebhookHandlerService Tests
 * TEST-03: Tests unitaires pour le gestionnaire de webhooks e-commerce
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { WebhookHandlerService } from './webhook-handler.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WebhookHandlerService', () => {
  let service: WebhookHandlerService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    ecommerceIntegration: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    webhookLog: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    webhook: {
      findUnique: jest.fn(),
    },
  };

  const mockShopifyConnector = {
    validateWebhook: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const mockWooCommerceConnector = {
    validateWebhook: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const mockWebhookQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookHandlerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ShopifyConnector, useValue: mockShopifyConnector },
        { provide: WooCommerceConnector, useValue: mockWooCommerceConnector },
        { provide: getQueueToken('ecommerce-webhooks'), useValue: mockWebhookQueue },
      ],
    }).compile();

    service = module.get<WebhookHandlerService>(WebhookHandlerService);
    prismaService = module.get(PrismaService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ========================================
  // Shopify Webhook Tests
  // ========================================

  describe('handleShopifyWebhook', () => {
    const mockIntegration = {
      id: 'integration-123',
      platform: 'shopify',
      shopDomain: 'test-shop.myshopify.com',
      status: 'active',
      brandId: 'brand-123',
      config: { webhookSecret: 'test-secret' },
    };

    const mockPayload = {
      id: 123456789,
      email: 'customer@example.com',
      total_price: '99.99',
    };

    it('should process valid Shopify webhook', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'orders/create',
        'test-shop.myshopify.com',
        mockPayload,
        'valid-hmac-header',
      );

      expect(mockPrismaService.ecommerceIntegration.findFirst).toHaveBeenCalledWith({
        where: {
          platform: 'shopify',
          shopDomain: 'test-shop.myshopify.com',
          status: 'active',
        },
      });
      expect(mockShopifyConnector.validateWebhook).toHaveBeenCalled();
      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-shopify-webhook',
        expect.objectContaining({
          integrationId: 'integration-123',
          topic: 'orders/create',
          shop: 'test-shop.myshopify.com',
        }),
      );
    });

    it('should skip webhook if no active integration found', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(null);

      await service.handleShopifyWebhook(
        'orders/create',
        'unknown-shop.myshopify.com',
        mockPayload,
        'hmac-header',
      );

      expect(mockWebhookQueue.add).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid signature', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockShopifyConnector.validateWebhook.mockReturnValue(false);

      await expect(
        service.handleShopifyWebhook(
          'orders/create',
          'test-shop.myshopify.com',
          mockPayload,
          'invalid-hmac',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle orders/create topic', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'orders/create',
        'test-shop.myshopify.com',
        { id: 1, line_items: [] },
        'valid-hmac',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-shopify-webhook',
        expect.objectContaining({
          topic: 'orders/create',
        }),
      );
    });

    it('should handle orders/updated topic', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'orders/updated',
        'test-shop.myshopify.com',
        { id: 1, fulfillment_status: 'fulfilled' },
        'valid-hmac',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-shopify-webhook',
        expect.objectContaining({
          topic: 'orders/updated',
        }),
      );
    });

    it('should handle products/create topic', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'products/create',
        'test-shop.myshopify.com',
        { id: 1, title: 'New Product' },
        'valid-hmac',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-shopify-webhook',
        expect.objectContaining({
          topic: 'products/create',
        }),
      );
    });

    it('should handle products/update topic', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'products/update',
        'test-shop.myshopify.com',
        { id: 1, title: 'Updated Product' },
        'valid-hmac',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-shopify-webhook',
        expect.objectContaining({
          topic: 'products/update',
        }),
      );
    });

    it('should handle inventory_items/update topic', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'inventory_items/update',
        'test-shop.myshopify.com',
        { id: 1, inventory_item_id: 123, available: 50 },
        'valid-hmac',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-shopify-webhook',
        expect.objectContaining({
          topic: 'inventory_items/update',
        }),
      );
    });
  });

  // ========================================
  // WooCommerce Webhook Tests
  // ========================================

  describe('handleWooCommerceWebhook', () => {
    const mockIntegration = {
      id: 'integration-456',
      platform: 'woocommerce',
      shopDomain: 'https://woo-store.com',
      status: 'active',
      brandId: 'brand-456',
      config: { consumerKey: 'key', consumerSecret: 'secret' },
    };

    it('should process valid WooCommerce webhook', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleWooCommerceWebhook(
        'order.created',
        { id: 123, status: 'processing' },
        'valid-signature',
      );

      expect(mockPrismaService.ecommerceIntegration.findFirst).toHaveBeenCalledWith({
        where: {
          platform: 'woocommerce',
          status: 'active',
        },
      });
      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-woocommerce-webhook',
        expect.objectContaining({
          integrationId: 'integration-456',
          topic: 'order.created',
        }),
      );
    });

    it('should skip webhook if no active integration found', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(null);

      await service.handleWooCommerceWebhook(
        'order.created',
        { id: 123 },
        'signature',
      );

      expect(mockWebhookQueue.add).not.toHaveBeenCalled();
    });

    it('should handle order.updated topic', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleWooCommerceWebhook(
        'order.updated',
        { id: 123, status: 'completed' },
        'signature',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-woocommerce-webhook',
        expect.objectContaining({
          topic: 'order.updated',
        }),
      );
    });

    it('should handle product.created topic', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleWooCommerceWebhook(
        'product.created',
        { id: 456, name: 'New Product' },
        'signature',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalledWith(
        'process-woocommerce-webhook',
        expect.objectContaining({
          topic: 'product.created',
        }),
      );
    });
  });

  // ========================================
  // Webhook History Tests
  // ========================================

  describe('getWebhookHistory', () => {
    it('should return webhook history for integration', async () => {
      const mockWebhooks = [
        { id: '1', event: 'orders/create', createdAt: new Date() },
        { id: '2', event: 'products/update', createdAt: new Date() },
      ];

      mockPrismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        id: 'integration-123',
        brandId: 'brand-123',
      });
      mockPrismaService.webhookLog.findMany.mockResolvedValue(mockWebhooks);

      const result = await service.getWebhookHistory('integration-123', 50);

      expect(result).toEqual(mockWebhooks);
      expect(mockPrismaService.webhookLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should throw NotFoundException for non-existent integration', async () => {
      mockPrismaService.ecommerceIntegration.findUnique.mockResolvedValue(null);

      await expect(
        service.getWebhookHistory('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use default limit of 50', async () => {
      mockPrismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        id: 'integration-123',
        brandId: 'brand-123',
      });
      mockPrismaService.webhookLog.findMany.mockResolvedValue([]);

      await service.getWebhookHistory('integration-123');

      expect(mockPrismaService.webhookLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it('should respect custom limit', async () => {
      mockPrismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        id: 'integration-123',
        brandId: 'brand-123',
      });
      mockPrismaService.webhookLog.findMany.mockResolvedValue([]);

      await service.getWebhookHistory('integration-123', 10);

      expect(mockPrismaService.webhookLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  // ========================================
  // Retry Webhook Tests
  // ========================================

  describe('retryWebhook', () => {
    it('should throw NotFoundException if webhook log not found', async () => {
      mockPrismaService.webhookLog.findUnique.mockResolvedValue(null);

      await expect(
        service.retryWebhook('non-existent-webhook'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if parent webhook not found', async () => {
      mockPrismaService.webhookLog.findUnique.mockResolvedValue({
        id: 'log-123',
        webhookId: 'webhook-123',
      });
      mockPrismaService.webhook.findUnique.mockResolvedValue(null);

      await expect(service.retryWebhook('log-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if no active integration found', async () => {
      mockPrismaService.webhookLog.findUnique.mockResolvedValue({
        id: 'log-123',
        webhookId: 'webhook-123',
        event: 'orders/create',
        payload: {},
      });
      mockPrismaService.webhook.findUnique.mockResolvedValue({
        id: 'webhook-123',
        brandId: 'brand-123',
      });
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(null);

      await expect(service.retryWebhook('log-123')).rejects.toThrow(NotFoundException);
    });

    it('should retry Shopify webhook', async () => {
      const mockWebhookLog = {
        id: 'log-123',
        webhookId: 'webhook-123',
        event: 'orders/create',
        payload: { id: 123 },
      };
      const mockWebhook = {
        id: 'webhook-123',
        brandId: 'brand-123',
      };
      const mockIntegration = {
        id: 'integration-123',
        platform: 'shopify',
        shopDomain: 'test-shop.myshopify.com',
      };

      mockPrismaService.webhookLog.findUnique.mockResolvedValue(mockWebhookLog);
      mockPrismaService.webhook.findUnique.mockResolvedValue(mockWebhook);
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockShopifyConnector.handleWebhook.mockResolvedValue({});

      await service.retryWebhook('log-123');

      expect(mockShopifyConnector.handleWebhook).toHaveBeenCalledWith(
        'orders/create',
        'test-shop.myshopify.com',
        { id: 123 },
      );
    });

    it('should retry WooCommerce webhook', async () => {
      const mockWebhookLog = {
        id: 'log-456',
        webhookId: 'webhook-456',
        event: 'order.created',
        payload: { id: 456 },
      };
      const mockWebhook = {
        id: 'webhook-456',
        brandId: 'brand-456',
      };
      const mockIntegration = {
        id: 'integration-456',
        platform: 'woocommerce',
        shopDomain: 'https://woo-store.com',
      };

      mockPrismaService.webhookLog.findUnique.mockResolvedValue(mockWebhookLog);
      mockPrismaService.webhook.findUnique.mockResolvedValue(mockWebhook);
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockWooCommerceConnector.handleWebhook.mockResolvedValue({});

      await service.retryWebhook('log-456');

      expect(mockWooCommerceConnector.handleWebhook).toHaveBeenCalledWith(
        'order.created',
        { id: 456 },
        expect.any(String),
      );
    });
  });

  // ========================================
  // Webhook Logging Tests
  // ========================================

  describe('logWebhook (private)', () => {
    it('should create webhook log entry', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue({
        id: 'integration-123',
        config: { webhookSecret: 'secret' },
      });
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({
        id: 'log-123',
        webhookId: 'shopify_123',
        event: 'orders/create',
      });

      await service.handleShopifyWebhook(
        'orders/create',
        'test-shop.myshopify.com',
        { id: 123 },
        'valid-hmac',
      );

      expect(mockPrismaService.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'orders/create',
          statusCode: 200,
          response: 'received',
        }),
      });
    });
  });

  // ========================================
  // Error Handling Tests
  // ========================================

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(
        service.handleShopifyWebhook(
          'orders/create',
          'test-shop.myshopify.com',
          {},
          'hmac',
        ),
      ).rejects.toThrow();
    });

    it('should handle queue errors gracefully', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue({
        id: 'integration-123',
        config: { webhookSecret: 'secret' },
      });
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});
      mockWebhookQueue.add.mockRejectedValue(new Error('Queue error'));

      await expect(
        service.handleShopifyWebhook(
          'orders/create',
          'test-shop.myshopify.com',
          {},
          'valid-hmac',
        ),
      ).rejects.toThrow();
    });
  });

  // ========================================
  // Edge Cases
  // ========================================

  describe('edge cases', () => {
    it('should handle empty payload', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue({
        id: 'integration-123',
        config: { webhookSecret: 'secret' },
      });
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'orders/create',
        'test-shop.myshopify.com',
        {},
        'valid-hmac',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalled();
    });

    it('should handle large payload', async () => {
      const largePayload = {
        id: 123,
        line_items: Array(1000).fill({ id: 1, title: 'Item', price: '10.00' }),
      };

      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue({
        id: 'integration-123',
        config: { webhookSecret: 'secret' },
      });
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'orders/create',
        'test-shop.myshopify.com',
        largePayload,
        'valid-hmac',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalled();
    });

    it('should handle special characters in shop domain', async () => {
      mockPrismaService.ecommerceIntegration.findFirst.mockResolvedValue({
        id: 'integration-123',
        shopDomain: 'test-shop-with-dashes.myshopify.com',
        config: { webhookSecret: 'secret' },
      });
      mockShopifyConnector.validateWebhook.mockReturnValue(true);
      mockPrismaService.webhookLog.create.mockResolvedValue({});

      await service.handleShopifyWebhook(
        'orders/create',
        'test-shop-with-dashes.myshopify.com',
        {},
        'valid-hmac',
      );

      expect(mockWebhookQueue.add).toHaveBeenCalled();
    });
  });
});
