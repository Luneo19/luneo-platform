/**
 * Tests unitaires pour ProductSyncService
 * TEST-NEW-01: Couverture des fonctionnalités critiques
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductSyncService } from './product-sync.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ShopifyConnector } from '../connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '../connectors/woocommerce/woocommerce.connector';
import { MagentoConnector } from '../connectors/magento/magento.connector';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductSyncService', () => {
  let service: ProductSyncService;
  let prismaService: any; // Use any to allow mock methods
  let shopifyConnector: any;
  let woocommerceConnector: any;
  let magentoConnector: jest.Mocked<MagentoConnector>;

  const mockQueue = { add: jest.fn() };

  const mockIntegration = {
    id: 'int-123',
    brandId: 'brand-123',
    platform: 'shopify',
    status: 'active',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSyncService,
        {
          provide: PrismaService,
          useValue: {
            ecommerceIntegration: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            syncLog: { findMany: jest.fn() },
          },
        },
        { provide: SmartCacheService, useValue: { getSimple: jest.fn(), setSimple: jest.fn() } },
        { provide: ShopifyConnector, useValue: { syncProducts: jest.fn() } },
        { provide: WooCommerceConnector, useValue: { syncProducts: jest.fn() } },
        { provide: MagentoConnector, useValue: { syncProducts: jest.fn() } },
        { provide: getQueueToken('ecommerce-sync'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ProductSyncService>(ProductSyncService);
    prismaService = module.get(PrismaService);
    shopifyConnector = module.get(ShopifyConnector);
    woocommerceConnector = module.get(WooCommerceConnector);
    magentoConnector = module.get(MagentoConnector);
  });

  afterEach(() => jest.clearAllMocks());

  describe('syncProducts', () => {
    it('should throw NotFoundException when integration not found', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue(null);

      await expect(
        service.syncProducts({ integrationId: 'non-existent' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should sync Shopify products', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue(mockIntegration as any);
      shopifyConnector.syncProducts.mockResolvedValue({
        integrationId: 'int-123',
        platform: 'shopify',
        type: 'product',
        direction: 'import',
        status: 'SUCCESS',
        itemsProcessed: 5,
        itemsFailed: 0,
      } as any);

      const result = await service.syncProducts({ integrationId: 'int-123' });

      expect(result.platform).toBe('shopify');
      expect(result.itemsProcessed).toBe(5);
      expect(shopifyConnector.syncProducts).toHaveBeenCalledWith('int-123', undefined);
    });

    it('should sync WooCommerce products', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        ...mockIntegration,
        platform: 'woocommerce',
      } as any);
      woocommerceConnector.syncProducts.mockResolvedValue({
        platform: 'woocommerce',
        itemsProcessed: 3,
      } as any);

      const result = await service.syncProducts({ integrationId: 'int-123' });

      expect(result.platform).toBe('woocommerce');
      expect(woocommerceConnector.syncProducts).toHaveBeenCalled();
    });

    it('should sync Magento products', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        ...mockIntegration,
        platform: 'magento',
      } as any);
      magentoConnector.syncProducts.mockResolvedValue({
        platform: 'magento',
        itemsProcessed: 10,
      } as any);

      const result = await service.syncProducts({ integrationId: 'int-123' });

      expect(result.platform).toBe('magento');
      expect(magentoConnector.syncProducts).toHaveBeenCalled();
    });

    it('should throw BadRequestException for unsupported platform', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue({
        ...mockIntegration,
        platform: 'unknown',
      } as any);

      await expect(
        service.syncProducts({ integrationId: 'int-123' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should update lastSyncAt after successful sync', async () => {
      prismaService.ecommerceIntegration.findUnique.mockResolvedValue(mockIntegration as any);
      shopifyConnector.syncProducts.mockResolvedValue({ itemsProcessed: 1 } as any);

      await service.syncProducts({ integrationId: 'int-123' });

      expect(prismaService.ecommerceIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-123' },
        data: { lastSyncAt: expect.any(Date) },
      });
    });
  });
});
