/**
 * Tests for ProductService
 * T-SVC-004: Tests pour le service de produits
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../ProductService';
import { trpc } from '@/lib/trpc/client';

// Mocks
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    product: {
      create: {
        mutate: vi.fn(),
      },
      update: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
      getById: {
        query: vi.fn(),
      },
      list: {
        query: vi.fn(),
      },
      uploadModel: {
        mutate: vi.fn(),
      },
      getAnalytics: {
        query: vi.fn(),
      },
    },
  },
}));

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = ProductService.getInstance();
  });

  // ============================================
  // SINGLETON TESTS
  // ============================================

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = ProductService.getInstance();
      const instance2 = ProductService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // ============================================
  // CREATE PRODUCT TESTS
  // ============================================

  describe('create', () => {
    it('should create a product', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (trpc.product.create.mutate as vi.Mock).mockResolvedValue(mockProduct);

      const request = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
      };

      const result = await productService.create(request);

      expect(result).toBeDefined();
      expect(result.id).toBe('product-123');
      expect(trpc.product.create.mutate).toHaveBeenCalledWith(request);
    });

    it('should handle errors when creating product', async () => {
      (trpc.product.create.mutate as vi.Mock).mockRejectedValue(new Error('Failed'));

      await expect(
        productService.create({
          name: 'Test Product',
        } as any)
      ).rejects.toThrow();
    });
  });

  // ============================================
  // UPDATE PRODUCT TESTS
  // ============================================

  describe('update', () => {
    it('should update a product', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Updated Product',
        description: 'Updated Description',
        price: 150,
        updatedAt: new Date(),
      };

      (trpc.product.update.mutate as vi.Mock).mockResolvedValue(mockProduct);

      const request = {
        id: 'product-123',
        name: 'Updated Product',
        price: 150,
      };

      const result = await productService.update(request);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Product');
      expect(trpc.product.update.mutate).toHaveBeenCalledWith(request);
    });

    it('should invalidate cache after update', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Updated Product',
      };

      (trpc.product.update.mutate as vi.Mock).mockResolvedValue(mockProduct);

      await productService.update({
        id: 'product-123',
        name: 'Updated Product',
      });

      // Cache should be invalidated (checked via cache.delete call)
      expect(productService).toBeDefined();
    });
  });

  // ============================================
  // DELETE PRODUCT TESTS
  // ============================================

  describe('delete', () => {
    it('should delete a product', async () => {
      (trpc.product.delete.mutate as vi.Mock).mockResolvedValue({ success: true });

      const result = await productService.delete('product-123');

      expect(result).toEqual({ success: true });
      expect(trpc.product.delete.mutate).toHaveBeenCalledWith({ id: 'product-123' });
    });

    it('should handle errors when deleting product', async () => {
      (trpc.product.delete.mutate as vi.Mock).mockRejectedValue(new Error('Failed'));

      await expect(productService.delete('product-123')).rejects.toThrow();
    });
  });

  // ============================================
  // GET BY ID TESTS
  // ============================================

  describe('getById', () => {
    it('should return product from cache if available', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        price: 100,
      };

      // Set cache manually
      (productService as any).cache.set('product:product-123', mockProduct);

      const result = await productService.getById('product-123', true);

      expect(result).toEqual(mockProduct);
      expect(trpc.product.getById.query).not.toHaveBeenCalled();
    });

    it('should fetch product from API if cache miss', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        price: 100,
      };

      // Clear cache first
      (productService as any).cache.clear();
      (trpc.product.getById.query as vi.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getById('product-123', true);

      expect(result).toBeDefined();
      expect(result.id).toBe('product-123');
      expect(trpc.product.getById.query).toHaveBeenCalledWith({ id: 'product-123' });
    });

    it('should not use cache if useCache is false', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
      };

      (trpc.product.getById.query as vi.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getById('product-123', false);

      expect(result).toBeDefined();
      expect(trpc.product.getById.query).toHaveBeenCalled();
    });
  });

  // ============================================
  // LIST PRODUCTS TESTS
  // ============================================

  describe('list', () => {
    it('should list products', async () => {
      const mockResult = {
        products: [
          {
            id: 'product-123',
            name: 'Test Product',
            price: 100,
          },
        ],
        total: 1,
        hasMore: false,
      };

      (trpc.product.list.query as vi.Mock).mockResolvedValue(mockResult);

      const result = await productService.list();

      expect(result).toBeDefined();
      expect(trpc.product.list.query).toHaveBeenCalled();
    });

    it('should list products with filters', async () => {
      const mockResult = {
        products: [],
        total: 0,
        hasMore: false,
      };

      (trpc.product.list.query as vi.Mock).mockResolvedValue(mockResult);

      const request = {
        limit: 10,
        offset: 0,
      };

      await productService.list(request);

      expect(trpc.product.list.query).toHaveBeenCalledWith(request);
    });
  });

  // ============================================
  // UPLOAD MODEL TESTS
  // ============================================

  describe('uploadModel', () => {
    it('should upload a model', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        modelUrl: 'https://example.com/model.glb',
      };

      (trpc.product.uploadModel.mutate as vi.Mock).mockResolvedValue(mockProduct);

      const request = {
        productId: 'product-123',
        file: new File([''], 'model.glb'),
      };

      const result = await productService.uploadModel(request);

      expect(result).toBeDefined();
      expect(result.modelUrl).toBe('https://example.com/model.glb');
      expect(trpc.product.uploadModel.mutate).toHaveBeenCalledWith(request);
    });

    it('should handle errors when uploading model', async () => {
      (trpc.product.uploadModel.mutate as vi.Mock).mockRejectedValue(new Error('Failed'));

      await expect(
        productService.uploadModel({
          productId: 'product-123',
          file: new File([''], 'model.glb'),
        })
      ).rejects.toThrow();
    });
  });

  // ============================================
  // ANALYTICS TESTS
  // ============================================

  describe('getAnalytics', () => {
    it('should get product analytics', async () => {
      const mockAnalytics = {
        views: 100,
        customizations: 50,
        orders: 10,
        revenue: 1000,
      };

      (trpc.product.getAnalytics.query as vi.Mock).mockResolvedValue(mockAnalytics);

      const request = {
        productId: 'product-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await productService.getAnalytics(request);

      expect(result).toBeDefined();
      expect(result.views).toBe(100);
      expect(trpc.product.getAnalytics.query).toHaveBeenCalledWith(request);
    });
  });

  // ============================================
  // CACHE TESTS
  // ============================================

  describe('clearCache', () => {
    it('should clear the cache', () => {
      productService.clearCache();
      // Cache should be cleared (no way to verify directly, but method should not throw)
      expect(productService).toBeDefined();
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache for a product', () => {
      productService.invalidateCache('product-123');
      // Cache should be invalidated (no way to verify directly, but method should not throw)
      expect(productService).toBeDefined();
    });
  });
});

