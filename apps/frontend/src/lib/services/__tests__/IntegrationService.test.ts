/**
 * Tests for IntegrationService
 * T-SVC-005: Tests pour le service d'intégrations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationService } from '../IntegrationService';
import { cacheService } from '@/lib/cache/CacheService';
import { verifyShopifyToken, getShopifyProducts } from '@/lib/integrations/shopify-client';
import { verifyWooCommerceCredentials, getWooCommerceProducts } from '@/lib/integrations/woocommerce-client';
// db will be imported after mock

// Mocks
vi.mock('@/lib/cache/CacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    ecommerceIntegration: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productMapping: {
      deleteMany: vi.fn(),
    },
    syncLog: {
      deleteMany: vi.fn(),
    },
    webhookLog: {
      deleteMany: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';

vi.mock('@/lib/integrations/shopify-client', () => ({
  verifyShopifyToken: vi.fn(),
  getShopifyProducts: vi.fn(),
}));

vi.mock('@/lib/integrations/woocommerce-client', () => ({
  verifyWooCommerceCredentials: vi.fn(),
  getWooCommerceProducts: vi.fn(),
}));

describe('IntegrationService', () => {
  let integrationService: IntegrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    integrationService = IntegrationService.getInstance();
  });

  // ============================================
  // SINGLETON TESTS
  // ============================================

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = IntegrationService.getInstance();
      const instance2 = IntegrationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // ============================================
  // LIST INTEGRATIONS TESTS
  // ============================================

  describe('listIntegrations', () => {
    it('should return integrations from cache if available', async () => {
      const mockIntegrations = [
        {
          id: 'integration-123',
          brandId: 'brand-123',
          platform: 'shopify' as const,
          shopDomain: 'test.myshopify.com',
          status: 'active' as const,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (cacheService.get as vi.Mock).mockReturnValue(mockIntegrations);

      const result = await integrationService.listIntegrations('brand-123', true);

      expect(result).toEqual(mockIntegrations);
      expect(cacheService.get).toHaveBeenCalledWith('integrations:brand-123');
      expect(db.ecommerceIntegration.findMany).not.toHaveBeenCalled();
    });

    it('should fetch integrations from database if cache miss', async () => {
      (cacheService.get as vi.Mock).mockReturnValue(null);

      const mockDbIntegrations = [
        {
          id: 'integration-123',
          brandId: 'brand-123',
          platform: 'shopify',
          shopDomain: 'test.myshopify.com',
          status: 'active',
          lastSyncAt: null,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.ecommerceIntegration.findMany as vi.Mock).mockResolvedValue(mockDbIntegrations);

      const result = await integrationService.listIntegrations('brand-123', true);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('integration-123');
      expect(db.ecommerceIntegration.findMany).toHaveBeenCalledWith({
        where: { brandId: 'brand-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  // ============================================
  // GET INTEGRATION BY ID TESTS
  // ============================================

  describe('getIntegrationById', () => {
    it('should return integration by id', async () => {
      const mockIntegration = {
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'shopify',
        shopDomain: 'test.myshopify.com',
        status: 'active',
        lastSyncAt: null,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.ecommerceIntegration.findUnique as vi.Mock).mockResolvedValue(mockIntegration);

      const result = await integrationService.getIntegrationById('integration-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('integration-123');
      expect(db.ecommerceIntegration.findUnique).toHaveBeenCalledWith({
        where: { id: 'integration-123' },
      });
    });

    it('should throw error if integration not found', async () => {
      (db.ecommerceIntegration.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(
        integrationService.getIntegrationById('integration-123')
      ).rejects.toThrow('Integration not found');
    });
  });

  // ============================================
  // SHOPIFY INTEGRATION TESTS
  // ============================================

  describe('createShopifyIntegration', () => {
    it('should create a Shopify integration', async () => {
      const mockShopInfo = {
        name: 'Test Shop',
        email: 'test@example.com',
        currency: 'EUR',
        timezone: 'Europe/Paris',
      };

      (verifyShopifyToken as vi.Mock).mockResolvedValue(mockShopInfo);

      const mockIntegration = {
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'shopify',
        shopDomain: 'test.myshopify.com',
        status: 'active',
        lastSyncAt: null,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.ecommerceIntegration.create as vi.Mock).mockResolvedValue(mockIntegration);

      const request = {
        brandId: 'brand-123',
        shopDomain: 'test.myshopify.com',
        accessToken: 'token-123',
      };

      const result = await integrationService.createShopifyIntegration(request);

      expect(result).toBeDefined();
      expect(verifyShopifyToken).toHaveBeenCalledWith(
        'test.myshopify.com',
        'token-123'
      );
      expect(db.ecommerceIntegration.create).toHaveBeenCalled();
    });

    it('should handle errors when creating Shopify integration', async () => {
      (verifyShopifyToken as vi.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(
        integrationService.createShopifyIntegration({
          brandId: 'brand-123',
          shopDomain: 'test.myshopify.com',
          accessToken: 'invalid-token',
        })
      ).rejects.toThrow();
    });
  });

  // ============================================
  // WOOCOMMERCE INTEGRATION TESTS
  // ============================================

  describe('createWooCommerceIntegration', () => {
    it('should create a WooCommerce integration', async () => {
      (verifyWooCommerceCredentials as vi.Mock).mockResolvedValue({ success: true });

      const mockIntegration = {
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'woocommerce',
        shopDomain: 'test.com',
        status: 'active',
        lastSyncAt: null,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.ecommerceIntegration.create as vi.Mock).mockResolvedValue(mockIntegration);

      const request = {
        brandId: 'brand-123',
        shopDomain: 'test.com',
        consumerKey: 'key-123',
        consumerSecret: 'secret-123',
      };

      const result = await integrationService.createWooCommerceIntegration(request);

      expect(result).toBeDefined();
      expect(verifyWooCommerceCredentials).toHaveBeenCalledWith(
        'test.com',
        'key-123',
        'secret-123'
      );
      expect(db.ecommerceIntegration.create).toHaveBeenCalled();
    });
  });

  // ============================================
  // SYNC TESTS
  // ============================================

  describe('syncProducts', () => {
    it('should sync products from Shopify', async () => {
      const mockIntegration = {
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'shopify',
        shopDomain: 'test.myshopify.com',
        status: 'active',
        accessToken: 'token-123',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getIntegrationById which is called by syncIntegration
      vi.spyOn(integrationService, 'getIntegrationById' as any).mockResolvedValue({
        ...mockIntegration,
        platform: 'shopify' as const,
        status: 'active' as const,
        lastSyncAt: null,
      });

      // Mock syncShopify internal method
      vi.spyOn(integrationService, 'syncShopify' as any).mockResolvedValue({
        success: true,
        itemsProcessed: 1,
        itemsFailed: 0,
        duration: 1,
      });

      const result = await integrationService.syncIntegration('integration-123', {
        products: true,
        direction: 'import',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should sync products from WooCommerce', async () => {
      const mockIntegration = {
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'woocommerce',
        shopDomain: 'test.com',
        status: 'active',
        config: {
          consumerKey: 'key-123',
          consumerSecret: 'secret-123',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getIntegrationById which is called by syncIntegration
      vi.spyOn(integrationService, 'getIntegrationById' as any).mockResolvedValue({
        ...mockIntegration,
        platform: 'woocommerce' as const,
        status: 'active' as const,
        lastSyncAt: null,
      });

      // Mock syncWooCommerce internal method
      vi.spyOn(integrationService, 'syncWooCommerce' as any).mockResolvedValue({
        success: true,
        itemsProcessed: 1,
        itemsFailed: 0,
        duration: 1,
      });

      const result = await integrationService.syncIntegration('integration-123', {
        products: true,
        direction: 'import',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // DELETE INTEGRATION TESTS
  // ============================================

  describe('deleteIntegration', () => {
    it('should delete an integration', async () => {
      const mockIntegration = {
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'shopify',
        shopDomain: 'test.myshopify.com',
        status: 'active',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.ecommerceIntegration.findUnique as vi.Mock).mockResolvedValue(mockIntegration);
      (db.productMapping.deleteMany as vi.Mock).mockResolvedValue({ count: 0 });
      (db.syncLog.deleteMany as vi.Mock).mockResolvedValue({ count: 0 });
      (db.webhookLog.deleteMany as vi.Mock).mockResolvedValue({ count: 0 });
      (db.ecommerceIntegration.delete as vi.Mock).mockResolvedValue(mockIntegration);

      await integrationService.deleteIntegration('integration-123', 'brand-123');

      expect(db.ecommerceIntegration.delete).toHaveBeenCalledWith({
        where: { id: 'integration-123' },
      });
      expect(cacheService.delete).toHaveBeenCalledWith('integrations:brand-123');
      expect(cacheService.delete).toHaveBeenCalledWith('integration:integration-123');
    });

    it('should handle errors when deleting integration', async () => {
      (db.ecommerceIntegration.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(
        integrationService.deleteIntegration('integration-123', 'brand-123')
      ).rejects.toThrow('Integration not found');
    });
  });
});

