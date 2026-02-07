/**
 * ★★★ SERVICE - INTÉGRATIONS E-COMMERCE ★★★
 * Service professionnel pour les intégrations
 * - Shopify
 * - WooCommerce
 * - Magento
 * - API générique
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import { api, endpoints } from '@/lib/api/client';

// ========================================
// TYPES
// ========================================

export interface Integration {
  id: string;
  brandId: string;
  platform: 'shopify' | 'woocommerce' | 'magento' | 'custom';
  shopDomain: string;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: Date;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShopifyIntegrationRequest {
  brandId: string;
  shopDomain: string;
  accessToken: string;
}

export interface CreateWooCommerceIntegrationRequest {
  brandId: string;
  shopDomain: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface SyncOptions {
  products?: boolean;
  orders?: boolean;
  inventory?: boolean;
  direction?: 'import' | 'export' | 'both';
}

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  errors?: string[];
  duration: number;
}

// ========================================
// SERVICE
// ========================================

export class IntegrationService {
  private static instance: IntegrationService;

  private constructor() {}

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  // ========================================
  // CRUD
  // ========================================

  private mapIntegration(raw: any): Integration {
    return {
      id: raw.id,
      brandId: raw.brandId,
      platform: (raw.platform ?? 'custom') as Integration['platform'],
      shopDomain: raw.shopDomain ?? '',
      status: (raw.status ?? 'inactive') as Integration['status'],
      lastSyncAt: raw.lastSyncAt ? new Date(raw.lastSyncAt) : undefined,
      config: raw.config ?? {},
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
  }

  /**
   * Liste les intégrations (via backend API)
   */
  async listIntegrations(
    brandId: string,
    useCache: boolean = true
  ): Promise<Integration[]> {
    try {
      const cacheKey = `integrations:${brandId}`;
      if (useCache) {
        const cached = cacheService.get<Integration[]>(cacheKey);
        if (cached) {
          logger.info('Cache hit for integrations', { brandId });
          return cached;
        }
      }

      const data = await endpoints.integrations.list();
      const list = Array.isArray(data) ? data : (data as any)?.integrations ?? (data as any)?.data ?? [];
      const integrations = (list as any[]).map((i: any) => this.mapIntegration(i));
      cacheService.set(cacheKey, integrations, { ttl: 300 * 1000 });
      return integrations;
    } catch (error: any) {
      logger.error('Error listing integrations', { error, brandId });
      throw error;
    }
  }

  /**
   * Récupère une intégration par ID (via backend API)
   */
  async getIntegrationById(integrationId: string): Promise<Integration> {
    try {
      const raw = await api.get<any>(`/api/v1/integrations/${integrationId}`);
      if (!raw) throw new Error('Integration not found');
      return this.mapIntegration(raw);
    } catch (error: any) {
      logger.error('Error fetching integration', { error, integrationId });
      throw error;
    }
  }

  // ========================================
  // SHOPIFY
  // ========================================

  /**
   * Crée une intégration Shopify (via backend API)
   */
  async createShopifyIntegration(
    request: CreateShopifyIntegrationRequest
  ): Promise<Integration> {
    try {
      logger.info('Creating Shopify integration', {
        brandId: request.brandId,
        shopDomain: request.shopDomain,
      });
      const raw = await api.post<any>('/api/v1/ecommerce/integrations', {
        platform: 'shopify',
        brandId: request.brandId,
        shopDomain: request.shopDomain,
        accessToken: request.accessToken,
      });
      cacheService.delete(`integrations:${request.brandId}`);
      logger.info('Shopify integration created', { integrationId: raw?.id, brandId: request.brandId });
      return this.mapIntegration(raw);
    } catch (error: any) {
      logger.error('Error creating Shopify integration', { error, request });
      throw error;
    }
  }

  /**
   * Synchronise avec Shopify (via backend API)
   */
  async syncShopify(
    integrationId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      logger.info('Syncing Shopify', { integrationId, options });
      const results: SyncResult[] = [];
      if (options.products !== false) {
        const r = await api.post<any>(`/api/v1/ecommerce/integrations/${integrationId}/sync/products`, options);
        if (r) results.push(r);
      }
      if (options.orders !== false) {
        const r = await api.post<any>(`/api/v1/ecommerce/integrations/${integrationId}/sync/orders`, options);
        if (r) results.push(r);
      }
      const combined: SyncResult = {
        success: results.every((x) => x.success),
        itemsProcessed: results.reduce((s, x) => s + (x.itemsProcessed ?? 0), 0),
        itemsFailed: results.reduce((s, x) => s + (x.itemsFailed ?? 0), 0),
        errors: results.flatMap((x) => x.errors ?? []),
        duration: results.reduce((s, x) => s + (x.duration ?? 0), 0),
      };
      logger.info('Shopify sync completed', { integrationId, ...combined });
      return combined;
    } catch (error: any) {
      logger.error('Error syncing Shopify', { error, integrationId });
      throw error;
    }
  }

  // ========================================
  // WOOCOMMERCE
  // ========================================

  /**
   * Crée une intégration WooCommerce (via backend API)
   */
  async createWooCommerceIntegration(
    request: CreateWooCommerceIntegrationRequest
  ): Promise<Integration> {
    try {
      logger.info('Creating WooCommerce integration', {
        brandId: request.brandId,
        shopDomain: request.shopDomain,
      });
      const raw = await api.post<any>('/api/v1/ecommerce/integrations', {
        platform: 'woocommerce',
        brandId: request.brandId,
        shopDomain: request.shopDomain,
        consumerKey: request.consumerKey,
        consumerSecret: request.consumerSecret,
      });
      cacheService.delete(`integrations:${request.brandId}`);
      logger.info('WooCommerce integration created', { integrationId: raw?.id, brandId: request.brandId });
      return this.mapIntegration(raw);
    } catch (error: any) {
      logger.error('Error creating WooCommerce integration', { error, request });
      throw error;
    }
  }

  /**
   * Synchronise avec WooCommerce (via backend API)
   */
  async syncWooCommerce(
    integrationId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      logger.info('Syncing WooCommerce', { integrationId, options });
      const results: SyncResult[] = [];
      if (options.products !== false) {
        const r = await api.post<any>(`/api/v1/ecommerce/integrations/${integrationId}/sync/products`, options);
        if (r) results.push(r);
      }
      if (options.orders !== false) {
        const r = await api.post<any>(`/api/v1/ecommerce/integrations/${integrationId}/sync/orders`, options);
        if (r) results.push(r);
      }
      const combined: SyncResult = {
        success: results.every((x) => x.success),
        itemsProcessed: results.reduce((s, x) => s + (x.itemsProcessed ?? 0), 0),
        itemsFailed: results.reduce((s, x) => s + (x.itemsFailed ?? 0), 0),
        errors: results.flatMap((x) => x.errors ?? []),
        duration: results.reduce((s, x) => s + (x.duration ?? 0), 0),
      };
      logger.info('WooCommerce sync completed', { integrationId, ...combined });
      return combined;
    } catch (error: any) {
      logger.error('Error syncing WooCommerce', { error, integrationId });
      throw error;
    }
  }

  // ========================================
  // GENERIC SYNC
  // ========================================

  /**
   * Synchronise une intégration
   */
  async syncIntegration(
    integrationId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      const integration = await this.getIntegrationById(integrationId);

      switch (integration.platform) {
        case 'shopify':
          return await this.syncShopify(integrationId, options);
        case 'woocommerce':
          return await this.syncWooCommerce(integrationId, options);
        default:
          throw new Error(`Unsupported platform: ${integration.platform}`);
      }
    } catch (error: any) {
      logger.error('Error syncing integration', { error, integrationId });
      throw error;
    }
  }

  /**
   * Supprime une intégration (via backend API)
   */
  async deleteIntegration(integrationId: string, brandId: string): Promise<void> {
    try {
      logger.info('Deleting integration', { integrationId, brandId });
      await api.delete(`/api/v1/ecommerce/integrations/${integrationId}`);
      cacheService.delete(`integrations:${brandId}`);
      cacheService.delete(`integration:${integrationId}`);
      logger.info('Integration deleted successfully', { integrationId });
    } catch (error: any) {
      logger.error('Error deleting integration', { error, integrationId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const integrationService = IntegrationService.getInstance();

