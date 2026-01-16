/**
 * ★★★ SERVICE - PRODUIT ★★★
 * Service frontend pour gérer les produits
 * - CRUD produits
 * - Upload modèles
 * - Analytics
 * - Cache management
 */

import { trpcVanilla } from '@/lib/trpc/vanilla-client';
import { logger } from '@/lib/logger';
import type {
  CreateProductRequest,
  UpdateProductRequest,
  UploadModelRequest,
  ProductListRequest,
  ProductAnalyticsRequest,
} from '@/lib/types/product';

// ========================================
// SERVICE
// ========================================

export class ProductService {
  private static instance: ProductService;
  private cache: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // ========================================
  // CRUD
  // ========================================

  /**
   * Crée un produit
   */
  async create(request: CreateProductRequest) {
    try {
      const client = trpcVanilla as any;
      const product = await client.product.create.mutate(request);
      logger.info('Product created', { productId: product.id });
      return product;
    } catch (error: any) {
      logger.error('Error creating product', { error, request });
      throw error;
    }
  }

  /**
   * Met à jour un produit
   */
  async update(request: UpdateProductRequest) {
    try {
      const client = trpcVanilla as any;
      const product = await client.product.update.mutate(request);
      this.cache.delete(request.id); // Invalidate cache
      logger.info('Product updated', { productId: request.id });
      return product;
    } catch (error: any) {
      logger.error('Error updating product', { error, request });
      throw error;
    }
  }

  /**
   * Supprime un produit
   */
  async delete(productId: string) {
    try {
      const client = trpcVanilla as any;
      await client.product.delete.mutate({ id: productId });
      this.cache.delete(productId); // Invalidate cache
      logger.info('Product deleted', { productId });
      return { success: true };
    } catch (error: any) {
      logger.error('Error deleting product', { error, productId });
      throw error;
    }
  }

  /**
   * Récupère un produit par ID
   */
  async getById(productId: string, useCache: boolean = true) {
    try {
      // Check cache
      if (useCache) {
        const cached = this.cache.get(`product:${productId}`);
        if (cached) {
          logger.info('Cache hit for product', { productId });
          return cached;
        }
      }

      // Fetch
      const client = trpcVanilla as any;
      const product = await client.product.getById.query({ id: productId });

      // Cache
      if (useCache) {
        this.cache.set(`product:${productId}`, product);
      }

      return product;
    } catch (error: any) {
      logger.error('Error fetching product', { error, productId });
      throw error;
    }
  }

  /**
   * Liste les produits
   */
  async list(request?: ProductListRequest) {
    try {
      const client = trpcVanilla as any;
      return await client.product.list.query(request);
    } catch (error: any) {
      logger.error('Error listing products', { error, request });
      throw error;
    }
  }

  // ========================================
  // UPLOAD
  // ========================================

  /**
   * Upload un modèle 3D
   */
  async uploadModel(request: UploadModelRequest) {
    try {
      const client = trpcVanilla as any;
      const product = await client.product.uploadModel.mutate(request);
      this.cache.delete(request.productId); // Invalidate cache
      logger.info('Model uploaded', { productId: request.productId });
      return product;
    } catch (error: any) {
      logger.error('Error uploading model', { error, request });
      throw error;
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * Récupère les analytics d'un produit
   */
  async getAnalytics(request: ProductAnalyticsRequest) {
    try {
      const client = trpcVanilla as any;
      return await client.product.getAnalytics.query(request);
    } catch (error: any) {
      logger.error('Error fetching product analytics', { error, request });
      throw error;
    }
  }

  // ========================================
  // CACHE
  // ========================================

  /**
   * Vide le cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Product cache cleared');
  }

  /**
   * Invalide le cache d'un produit
   */
  invalidateCache(productId: string) {
    this.cache.delete(`product:${productId}`);
    logger.info('Product cache invalidated', { productId });
  }
}

// ========================================
// EXPORT
// ========================================

export const productService = ProductService.getInstance();

