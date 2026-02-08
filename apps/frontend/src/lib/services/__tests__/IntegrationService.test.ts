/**
 * Tests for IntegrationService
 * T-SVC-005: Tests pour le service d'intégrations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationService } from '../IntegrationService';
import { cacheService } from '@/lib/cache/CacheService';
import { api, endpoints } from '@/lib/api/client';

// Mocks
vi.mock('@/lib/cache/CacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  endpoints: {
    integrations: {
      list: vi.fn(),
    },
  },
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
      expect(endpoints.integrations.list).not.toHaveBeenCalled();
    });

    it('should fetch integrations from API if cache miss', async () => {
      (cacheService.get as vi.Mock).mockReturnValue(null);

      const mockApiIntegrations = [
        {
          id: 'integration-123',
          brandId: 'brand-123',
          platform: 'shopify',
          shopDomain: 'test.myshopify.com',
          status: 'active',
          lastSyncAt: null,
          config: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (endpoints.integrations.list as vi.Mock).mockResolvedValue(mockApiIntegrations);

      const result = await integrationService.listIntegrations('brand-123', true);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('integration-123');
      expect(endpoints.integrations.list).toHaveBeenCalled();
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (api.get as vi.Mock).mockResolvedValue(mockIntegration);

      const result = await integrationService.getIntegrationById('integration-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('integration-123');
      expect(api.get).toHaveBeenCalledWith('/api/v1/integrations/integration-123');
    });

    it('should throw error if integration not found', async () => {
      (api.get as vi.Mock).mockRejectedValue(new Error('Integration not found'));

      await expect(
        integrationService.getIntegrationById('integration-123')
      ).rejects.toThrow('Integration not found');
    });
  });

  // ============================================
  // SHOPIFY INTEGRATION TESTS
  // ============================================

  describe('createShopifyIntegration', () => {
    it('should create a Shopify integration via API', async () => {
      const mockIntegration = {
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'shopify',
        shopDomain: 'test.myshopify.com',
        status: 'active',
        lastSyncAt: null,
        config: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (api.post as vi.Mock).mockResolvedValue(mockIntegration);

      const request = {
        brandId: 'brand-123',
        shopDomain: 'test.myshopify.com',
        accessToken: 'token-123',
      };

      const result = await integrationService.createShopifyIntegration(request);

      expect(result).toBeDefined();
      expect(api.post).toHaveBeenCalledWith('/api/v1/ecommerce/integrations', {
        platform: 'shopify',
        brandId: 'brand-123',
        shopDomain: 'test.myshopify.com',
        accessToken: 'token-123',
      });
      expect(result.id).toBe('integration-123');
    });

    it('should handle errors when creating Shopify integration', async () => {
      (api.post as vi.Mock).mockRejectedValue(new Error('Invalid token'));

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
    it('should create a WooCommerce integration via API', async () => {
      const mockIntegration = {
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'woocommerce',
        shopDomain: 'test.com',
        status: 'active',
        lastSyncAt: null,
        config: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (api.post as vi.Mock).mockResolvedValue(mockIntegration);

      const request = {
        brandId: 'brand-123',
        shopDomain: 'test.com',
        consumerKey: 'key-123',
        consumerSecret: 'secret-123',
      };

      const result = await integrationService.createWooCommerceIntegration(request);

      expect(result).toBeDefined();
      expect(api.post).toHaveBeenCalledWith('/api/v1/ecommerce/integrations', {
        platform: 'woocommerce',
        brandId: 'brand-123',
        shopDomain: 'test.com',
        consumerKey: 'key-123',
        consumerSecret: 'secret-123',
      });
      expect(result.id).toBe('integration-123');
    });
  });

  // ============================================
  // SYNC TESTS
  // ============================================

  describe('syncProducts', () => {
    it('should sync products from Shopify via API', async () => {
      (api.get as vi.Mock).mockResolvedValue({
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'shopify',
        shopDomain: 'test.myshopify.com',
        status: 'active',
        config: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      (api.post as vi.Mock).mockResolvedValue({
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

    it('should sync products from WooCommerce via API', async () => {
      (api.get as vi.Mock).mockResolvedValue({
        id: 'integration-123',
        brandId: 'brand-123',
        platform: 'woocommerce',
        shopDomain: 'test.com',
        status: 'active',
        config: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      (api.post as vi.Mock).mockResolvedValue({
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
    it('should delete an integration via API', async () => {
      (api.delete as vi.Mock).mockResolvedValue(undefined);

      await integrationService.deleteIntegration('integration-123', 'brand-123');

      expect(api.delete).toHaveBeenCalledWith('/api/v1/ecommerce/integrations/integration-123');
      expect(cacheService.delete).toHaveBeenCalledWith('integrations:brand-123');
      expect(cacheService.delete).toHaveBeenCalledWith('integration:integration-123');
    });

    it('should handle errors when deleting integration', async () => {
      (api.delete as vi.Mock).mockRejectedValue(new Error('Integration not found'));

      await expect(
        integrationService.deleteIntegration('integration-123', 'brand-123')
      ).rejects.toThrow();
    });
  });
});
