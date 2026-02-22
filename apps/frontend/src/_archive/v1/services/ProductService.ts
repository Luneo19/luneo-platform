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

/** Minimal tRPC product client shape used by ProductService (avoids full AppRouter dependency here) */
interface ProductTRPCClient {
  product: {
    create: { mutate: (req: CreateProductRequest) => Promise<{ id: string } & Record<string, unknown>> };
    update: { mutate: (req: UpdateProductRequest) => Promise<Record<string, unknown>> };
    delete: { mutate: (arg: { id: string }) => Promise<void> };
    getById: { query: (arg: { id: string }) => Promise<Record<string, unknown> | null> };
    list: { query: (req?: ProductListRequest) => Promise<Record<string, unknown>> };
    uploadModel: { mutate: (req: UploadModelRequest) => Promise<Record<string, unknown>> };
    getAnalytics: { query: (req: ProductAnalyticsRequest) => Promise<Record<string, unknown>> };
  };
}

// ========================================
// SERVICE
// ========================================

export class ProductService {
  private static instance: ProductService;
  private cache: Map<string, unknown> = new Map();

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
      const client = trpcVanilla as unknown as ProductTRPCClient;
      const product = await client.product.create.mutate(request);
      logger.info('Product created', { productId: product.id });
      return product;
    } catch (error: unknown) {
      logger.error('Error creating product', { error, request });
      throw error;
    }
  }

  /**
   * Met à jour un produit
   */
  async update(request: UpdateProductRequest) {
    try {
      const client = trpcVanilla as unknown as ProductTRPCClient;
      const product = await client.product.update.mutate(request);
      this.cache.delete(request.id); // Invalidate cache
      logger.info('Product updated', { productId: request.id });
      return product;
    } catch (error: unknown) {
      logger.error('Error updating product', { error, request });
      throw error;
    }
  }

  /**
   * Supprime un produit
   */
  async delete(productId: string) {
    try {
      const client = trpcVanilla as unknown as ProductTRPCClient;
      await client.product.delete.mutate({ id: productId });
      this.cache.delete(productId); // Invalidate cache
      logger.info('Product deleted', { productId });
      return { success: true };
    } catch (error: unknown) {
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
      // tRPC vanilla client typing requires runtime cast
      const client = trpcVanilla as unknown as Record<string, Record<string, { query: (input: unknown) => Promise<unknown> }>>;
      const product = await client.product.getById.query({ id: productId });

      // Cache
      if (useCache) {
        this.cache.set(`product:${productId}`, product);
      }

      return product;
    } catch (error: unknown) {
      logger.error('Error fetching product', { error, productId });
      throw error;
    }
  }

  /**
   * Liste les produits
   */
  async list(request?: ProductListRequest) {
    try {
      // tRPC vanilla client typing requires runtime cast
      const client = trpcVanilla as unknown as Record<string, Record<string, { query: (input: unknown) => Promise<unknown> }>>;
      return await client.product.list.query(request);
    } catch (error: unknown) {
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
      const client = trpcVanilla as unknown as ProductTRPCClient;
      const product = await client.product.uploadModel.mutate(request);
      this.cache.delete(request.productId); // Invalidate cache
      logger.info('Model uploaded', { productId: request.productId });
      return product;
    } catch (error: unknown) {
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
      // tRPC vanilla client typing requires runtime cast
      const client = trpcVanilla as unknown as Record<string, Record<string, { query: (input: unknown) => Promise<unknown> }>>;
      return await client.product.getAnalytics.query(request);
    } catch (error: unknown) {
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

