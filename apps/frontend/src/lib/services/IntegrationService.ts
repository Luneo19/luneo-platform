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
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/** Raw API shape for integration list/item */
type RawIntegrationRecord = Record<string, unknown>;

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

  private mapIntegration(raw: RawIntegrationRecord): Integration {
    return {
      id: String(raw.id),
      brandId: String(raw.brandId),
      platform: (raw.platform ?? 'custom') as Integration['platform'],
      shopDomain: String(raw.shopDomain ?? ''),
      status: (raw.status ?? 'inactive') as Integration['status'],
      lastSyncAt: raw.lastSyncAt != null ? new Date(raw.lastSyncAt as string | number) : undefined,
      config: (raw.config as Record<string, unknown>) ?? {},
      createdAt: new Date(raw.createdAt as string | number),
      updatedAt: new Date(raw.updatedAt as string | number),
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
      const dataObj = data as { integrations?: RawIntegrationRecord[]; data?: RawIntegrationRecord[] } | RawIntegrationRecord[] | undefined;
      const list = Array.isArray(dataObj) ? dataObj : dataObj?.integrations ?? dataObj?.data ?? [];
      const integrations = (list as RawIntegrationRecord[]).map((i) => this.mapIntegration(i));
      cacheService.set(cacheKey, integrations, { ttl: 300 * 1000 });
      return integrations;
    } catch (error: unknown) {
      logger.error('Error listing integrations', { error, brandId });
      throw error;
    }
  }

  /**
   * Récupère une intégration par ID (via backend API)
   */
  async getIntegrationById(integrationId: string): Promise<Integration> {
    try {
      const raw = await api.get<RawIntegrationRecord>(`/api/v1/integrations/${integrationId}`);
      if (!raw) throw new Error('Integration not found');
      return this.mapIntegration(raw as RawIntegrationRecord);
    } catch (error: unknown) {
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
      const raw = await api.post<RawIntegrationRecord>('/api/v1/ecommerce/integrations', {
        platform: 'shopify',
        brandId: request.brandId,
        shopDomain: request.shopDomain,
        accessToken: request.accessToken,
      });
      cacheService.delete(`integrations:${request.brandId}`);
      logger.info('Shopify integration created', { integrationId: raw?.id, brandId: request.brandId });
      return this.mapIntegration(raw as RawIntegrationRecord);
    } catch (error: unknown) {
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
      type SyncApiResponse = { success?: boolean; itemsProcessed?: number; itemsFailed?: number; errors?: string[]; duration?: number };
      if (options.products !== false) {
        const r = await api.post<SyncApiResponse>(`/api/v1/ecommerce/integrations/${integrationId}/sync/products`, options);
        if (r) results.push({ success: r.success ?? true, itemsProcessed: r.itemsProcessed ?? 0, itemsFailed: r.itemsFailed ?? 0, errors: r.errors, duration: r.duration ?? 0 });
      }
      if (options.orders !== false) {
        const r = await api.post<SyncApiResponse>(`/api/v1/ecommerce/integrations/${integrationId}/sync/orders`, options);
        if (r) results.push({ success: r.success ?? true, itemsProcessed: r.itemsProcessed ?? 0, itemsFailed: r.itemsFailed ?? 0, errors: r.errors, duration: r.duration ?? 0 });
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
    } catch (error: unknown) {
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
      const raw = await api.post<RawIntegrationRecord>('/api/v1/ecommerce/integrations', {
        platform: 'woocommerce',
        brandId: request.brandId,
        shopDomain: request.shopDomain,
        consumerKey: request.consumerKey,
        consumerSecret: request.consumerSecret,
      });
      cacheService.delete(`integrations:${request.brandId}`);
      logger.info('WooCommerce integration created', { integrationId: raw?.id, brandId: request.brandId });
      return this.mapIntegration(raw as RawIntegrationRecord);
    } catch (error: unknown) {
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
      type SyncApiResponse = { success?: boolean; itemsProcessed?: number; itemsFailed?: number; errors?: string[]; duration?: number };
      if (options.products !== false) {
        const r = await api.post<SyncApiResponse>(`/api/v1/ecommerce/integrations/${integrationId}/sync/products`, options);
        if (r) results.push({ success: r.success ?? true, itemsProcessed: r.itemsProcessed ?? 0, itemsFailed: r.itemsFailed ?? 0, errors: r.errors, duration: r.duration ?? 0 });
      }
      if (options.orders !== false) {
        const r = await api.post<SyncApiResponse>(`/api/v1/ecommerce/integrations/${integrationId}/sync/orders`, options);
        if (r) results.push({ success: r.success ?? true, itemsProcessed: r.itemsProcessed ?? 0, itemsFailed: r.itemsFailed ?? 0, errors: r.errors, duration: r.duration ?? 0 });
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Error deleting integration', { error, integrationId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const integrationService = IntegrationService.getInstance();

