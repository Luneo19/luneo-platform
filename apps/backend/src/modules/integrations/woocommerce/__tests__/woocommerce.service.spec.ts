import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import { WooCommerceService } from '../woocommerce.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { WooCommerceConnector } from '@/modules/ecommerce/connectors/woocommerce/woocommerce.connector';
import { SyncEngineService } from '@/modules/ecommerce/services/sync-engine.service';
import { WooCommerceWebhookService } from '@/modules/ecommerce/services/woocommerce-webhook.service';

describe('WooCommerceService', () => {
  let service: WooCommerceService;
  let prisma: jest.Mocked<PrismaService>;
  let wooCommerceConnector: jest.Mocked<WooCommerceConnector>;

  const mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
  const mockCache = { get: jest.fn(), set: jest.fn(), invalidate: jest.fn(), getOrSet: jest.fn((_k: string, fn: () => Promise<unknown>) => fn()) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockPrisma = {
      ecommerceIntegration: { findFirst: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
      productMapping: { findFirst: jest.fn(), create: jest.fn(), count: jest.fn() },
    };
    const mockConnector = { connect: jest.fn(), upsertProduct: jest.fn() };
    const mockSyncEngine = { queueSyncJob: jest.fn().mockResolvedValue(undefined) };
    const mockWebhookService = {
      handleWebhook: jest.fn(),
      handleOrderCreate: jest.fn(),
      handleOrderUpdate: jest.fn(),
      handleOrderDelete: jest.fn(),
      handleProductCreate: jest.fn(),
      handleProductUpdate: jest.fn(),
      handleProductDelete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WooCommerceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: WooCommerceConnector, useValue: mockConnector },
        { provide: SyncEngineService, useValue: mockSyncEngine },
        { provide: WooCommerceWebhookService, useValue: mockWebhookService },
        { provide: getQueueToken('ecommerce-sync'), useValue: mockQueue },
      ],
    }).compile();
    service = module.get<WooCommerceService>(WooCommerceService);
    prisma = module.get(PrismaService);
    wooCommerceConnector = module.get(WooCommerceConnector);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connect', () => {
    it('should store credentials and return integration id', async () => {
      (wooCommerceConnector.connect as jest.Mock).mockResolvedValue({ id: 'int-1', status: 'active' });
      const result = await service.connect('brand-1', { siteUrl: 'https://example.com', consumerKey: 'ck_xxx', consumerSecret: 'cs_xxx' });
      expect(wooCommerceConnector.connect).toHaveBeenCalledWith('brand-1', 'https://example.com', 'ck_xxx', 'cs_xxx');
      expect(result.integrationId).toBe('int-1');
      expect(result.status).toBe('active');
    });
    it('should throw BadRequestException when brandId is empty', async () => {
      await expect(service.connect('', { siteUrl: 'https://example.com', consumerKey: 'ck_xxx', consumerSecret: 'cs_xxx' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return status when connected', async () => {
      (prisma.ecommerceIntegration.findFirst as jest.Mock).mockResolvedValue({
        id: 'int-1', brandId: 'brand-1', platform: 'woocommerce', status: 'active', shopDomain: 'https://example.com', lastSyncAt: new Date(), metadata: {},
      });
      (prisma.productMapping.count as jest.Mock).mockResolvedValue(5);
      const result = await service.getConnectionStatus('brand-1');
      expect(result.connected).toBe(true);
      expect(result.status).toBe('active');
    });
    it('should return disconnected when no integration', async () => {
      (prisma.ecommerceIntegration.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await service.getConnectionStatus('brand-1');
      expect(result.connected).toBe(false);
      expect(result.status).toBe('disconnected');
    });
  });

  describe('pushProduct', () => {
    it('should call WooCommerce API', async () => {
      (prisma.ecommerceIntegration.findFirst as jest.Mock).mockResolvedValue({ id: 'int-1', brandId: 'brand-1', platform: 'woocommerce', status: 'active' });
      (wooCommerceConnector.upsertProduct as jest.Mock).mockResolvedValue({ id: 'wc-123', sku: 'SKU1' });
      (prisma.ecommerceIntegration.update as jest.Mock).mockResolvedValue({});
      const result = await service.pushProduct('brand-1', { name: 'Test Product', price: 10 });
      expect(wooCommerceConnector.upsertProduct).toHaveBeenCalled();
      expect(result.externalProductId).toBe('wc-123');
      expect(result.integrationId).toBe('int-1');
    });
  });

  describe('handleWebhook', () => {
    it('should process events', async () => {
      (prisma.ecommerceIntegration.findMany as jest.Mock).mockResolvedValue([{ id: 'int-1', platform: 'woocommerce', status: 'active' }]);
      const mockWebhook = (await import('../woocommerce.service')).WooCommerceService;
      const webhookSvc = (await import('@/modules/ecommerce/services/woocommerce-webhook.service')).WooCommerceWebhookService;
      await service.handleWebhook('order.created', { id: 123, status: 'pending' });
      expect(prisma.ecommerceIntegration.findMany).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should remove integration', async () => {
      (prisma.ecommerceIntegration.findFirst as jest.Mock).mockResolvedValue({ id: 'int-1', brandId: 'brand-1', platform: 'woocommerce' });
      (prisma.ecommerceIntegration.delete as jest.Mock).mockResolvedValue({});
      await service.disconnect('brand-1');
      expect(prisma.ecommerceIntegration.delete).toHaveBeenCalledWith({ where: { id: 'int-1' } });
    });
  });
});
