/**
 * Tests unitaires pour OrderSyncService
 * TEST-NEW-01: Couverture des fonctionnalités critiques
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrderSyncService } from './order-sync.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { MagentoConnector } from '../connectors/magento/magento.connector';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException } from '@nestjs/common';

describe('OrderSyncService', () => {
  let service: OrderSyncService;
  let prismaService: any; // Use any to allow mock methods
  let cacheService: any;
  let shopifyConnector: any;

  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
  };

  const mockIntegration = {
    id: 'int-123',
    brandId: 'brand-123',
    platform: 'shopify',
    shopDomain: 'test.myshopify.com',
    status: 'active',
  };

  beforeEach(async () => {
    const mockEcommerceIntegration = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    };
    const mockOrder = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    };
    const mockSyncLog = {
      create: jest.fn(),
    };
    const mockPrisma = {
      ecommerceIntegration: mockEcommerceIntegration,
      order: mockOrder,
      syncLog: mockSyncLog,
    };

    const mockCache = {
      getSimple: jest.fn(),
      setSimple: jest.fn(),
    };

    const mockShopify = {
      getOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
    };

    const mockWooCommerce = {
      getOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
    };

    const mockMagento = {
      getOrders: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderSyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: ShopifyConnector, useValue: mockShopify },
        { provide: WooCommerceConnector, useValue: mockWooCommerce },
        { provide: MagentoConnector, useValue: mockMagento },
        { provide: getQueueToken('ecommerce-sync'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<OrderSyncService>(OrderSyncService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SmartCacheService);
    shopifyConnector = module.get(ShopifyConnector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncOrders', () => {
    it('should throw NotFoundException when integration not found', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue(null);

      await expect(
        service.syncOrders({ integrationId: 'non-existent' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should sync orders from Shopify successfully', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue(mockIntegration as any);
      shopifyConnector.getOrders.mockResolvedValue([
        { id: 'order-1', total: 100 },
        { id: 'order-2', total: 200 },
      ] as any);
      prismaService.syncLog.create.mockResolvedValue({ id: 'log-1', status: 'SUCCESS' } as any);

      const result = await service.syncOrders({ integrationId: 'int-123' });

      expect(result.platform).toBe('shopify');
      expect(result.itemsProcessed).toBe(2);
      expect(result.itemsFailed).toBe(0);
      expect(shopifyConnector.getOrders).toHaveBeenCalledWith('int-123');
    });

    it('should handle partial failures in batch processing', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue(mockIntegration as any);
      shopifyConnector.getOrders.mockResolvedValue([
        { id: 'order-1' },
        { id: 'order-2' },
        { id: 'order-3' },
      ] as any);
      prismaService.syncLog.create.mockResolvedValue({ id: 'log-1', status: 'PARTIAL' } as any);

      const result = await service.syncOrders({ integrationId: 'int-123' });

      expect(result.itemsProcessed + result.itemsFailed).toBe(3);
    });
  });

  describe('getOrderStats', () => {
    it('should return cached stats if available', async () => {
      const cachedStats = JSON.stringify({
        period: 'week',
        totalOrders: 10,
        totalRevenue: 1000,
      });
      cacheService.getSimple.mockResolvedValue(cachedStats);

      const result = await service.getOrderStats('int-123', 'week');

      expect(result.totalOrders).toBe(10);
      expect(cacheService.getSimple).toHaveBeenCalled();
      expect(prismaService.order.findMany).not.toHaveBeenCalled();
    });

    it('should calculate stats when cache is empty', async () => {
      cacheService.getSimple.mockResolvedValue(null);
      prismaService.order.findMany.mockResolvedValue([
        { status: 'PENDING', totalCents: 5000 },
        { status: 'COMPLETED', totalCents: 10000 },
      ] as any);

      const result = await service.getOrderStats('int-123', 'week');

      expect(result.totalOrders).toBe(2);
      expect(result.totalRevenue).toBe(150); // (5000 + 10000) / 100
      expect(cacheService.setSimple).toHaveBeenCalled();
    });
  });

  describe('updateExternalOrderStatus', () => {
    it('should throw NotFoundException when order not found', async () => {
      prismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateExternalOrderStatus('non-existent', 'SHIPPED')
      ).rejects.toThrow(NotFoundException);
    });

    it('should update Shopify order status', async () => {
      prismaService.order.findUnique.mockResolvedValue({
        metadata: { shopifyOrderId: 'shopify-123' },
        brandId: 'brand-123',
      } as any);
      prismaService.ecommerceIntegration.findFirst.mockResolvedValue({
        id: 'int-123',
        platform: 'shopify',
      } as any);

      await service.updateExternalOrderStatus('order-123', 'SHIPPED');

      expect(shopifyConnector.updateOrderStatus).toHaveBeenCalledWith(
        'int-123',
        'shopify-123',
        'shipped'
      );
    });
  });
});
