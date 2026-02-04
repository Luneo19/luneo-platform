/**
 * ★★★ SERVICE - AR INTEGRATIONS ★★★
 * Service NestJS pour les intégrations AR (e-commerce, CMS, analytics, marketing)
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { PrismaService } from '@/libs/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface ARIntegration {
  id: string;
  platform: string; // 'shopify', 'woocommerce', 'magento', 'custom'
  name: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  settings: Record<string, unknown>;
  isActive: boolean;
  lastSyncAt?: Date;
  syncStatus: 'idle' | 'syncing' | 'error';
  brandId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationSync {
  id: string;
  integrationId: string;
  status: 'success' | 'error' | 'pending';
  itemsSynced: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
}

@Injectable()
export class ArIntegrationsService {
  private readonly logger = new Logger(ArIntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  private mapRowToIntegration(row: {
    id: string;
    brandId: string;
    platform: string;
    name: string;
    apiKey: string | null;
    apiSecret: string | null;
    webhookUrl: string | null;
    settings: unknown;
    isActive: boolean;
    lastSyncAt: Date | null;
    syncStatus: string;
    createdAt: Date;
    updatedAt: Date;
  }): ARIntegration {
    return {
      id: row.id,
      brandId: row.brandId,
      platform: row.platform,
      name: row.name,
      apiKey: row.apiKey ?? undefined,
      apiSecret: row.apiSecret ?? undefined,
      webhookUrl: row.webhookUrl ?? undefined,
      settings: (row.settings as Record<string, unknown>) ?? {},
      isActive: row.isActive,
      lastSyncAt: row.lastSyncAt ?? undefined,
      syncStatus: row.syncStatus as ARIntegration['syncStatus'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Liste toutes les intégrations d'une marque
   */
  async listIntegrations(brandId: string): Promise<ARIntegration[]> {
    try {
      this.logger.log(`Listing AR integrations for brand: ${brandId}`);
      const rows = await this.prisma.aRIntegration.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((r) => this.mapRowToIntegration(r));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to list integrations: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Récupère une intégration par ID
   */
  async getIntegration(id: string, brandId: string): Promise<ARIntegration> {
    const row = await this.prisma.aRIntegration.findFirst({
      where: { id, brandId },
    });
    if (!row) throw new NotFoundException(`Integration ${id} not found`);
    return this.mapRowToIntegration(row);
  }

  /**
   * Crée une nouvelle intégration
   */
  async createIntegration(brandId: string, data: Omit<ARIntegration, 'id' | 'brandId' | 'createdAt' | 'updatedAt'>): Promise<ARIntegration> {
    const row = await this.prisma.aRIntegration.create({
      data: {
        brandId,
        platform: data.platform,
        name: data.name,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        webhookUrl: data.webhookUrl,
        settings: (data.settings ?? {}) as object,
        isActive: data.isActive ?? true,
        syncStatus: data.syncStatus ?? 'idle',
      },
    });
    return this.mapRowToIntegration(row);
  }

  /**
   * Met à jour une intégration
   */
  async updateIntegration(id: string, brandId: string, data: Partial<Omit<ARIntegration, 'id' | 'brandId' | 'createdAt'>>): Promise<ARIntegration> {
    const row = await this.prisma.aRIntegration.findFirst({ where: { id, brandId } });
    if (!row) throw new NotFoundException(`Integration ${id} not found`);
    const updated = await this.prisma.aRIntegration.update({
      where: { id },
      data: {
        ...(data.platform != null && { platform: data.platform }),
        ...(data.name != null && { name: data.name }),
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.apiSecret !== undefined && { apiSecret: data.apiSecret }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
        ...(data.settings != null && { settings: data.settings as object }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.lastSyncAt !== undefined && { lastSyncAt: data.lastSyncAt }),
        ...(data.syncStatus != null && { syncStatus: data.syncStatus }),
      },
    });
    return this.mapRowToIntegration(updated);
  }

  /**
   * Supprime une intégration
   */
  async deleteIntegration(id: string, brandId: string): Promise<void> {
    const exists = await this.prisma.aRIntegration.findFirst({ where: { id, brandId } });
    if (!exists) throw new NotFoundException(`Integration ${id} not found`);
    await this.prisma.aRIntegration.delete({ where: { id } });
  }

  /**
   * Teste la connexion d'une intégration (Shopify, WooCommerce, etc.).
   */
  async testConnection(id: string, brandId: string): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Testing connection for integration: ${id}`);
      const integration = await this.getIntegration(id, brandId);
      const settings = (integration.settings ?? {}) as Record<string, unknown>;

      switch (integration.platform) {
        case 'shopify': {
          const shopDomain = settings.shopDomain as string | undefined;
          const accessToken = (settings.accessToken ?? integration.apiKey) as string | undefined;
          if (!shopDomain || !accessToken) {
            return { success: false, message: 'Shopify: shopDomain and accessToken required in settings' };
          }
          const shop = shopDomain.replace(/^https?:\/\//, '').split('/')[0];
          const url = `https://${shop}/admin/api/2024-10/shop.json`;
          await firstValueFrom(
            this.httpService.get(url, {
              headers: { 'X-Shopify-Access-Token': accessToken },
              timeout: 10000,
            }),
          );
          return { success: true, message: 'Connection to Shopify successful' };
        }
        case 'woocommerce': {
          const storeUrl = settings.storeUrl as string | undefined;
          const consumerKey = (settings.consumerKey ?? integration.apiKey) as string | undefined;
          const consumerSecret = (settings.consumerSecret ?? integration.apiSecret) as string | undefined;
          if (!storeUrl || !consumerKey || !consumerSecret) {
            return { success: false, message: 'WooCommerce: storeUrl, consumerKey, consumerSecret required' };
          }
          const base = storeUrl.replace(/\/$/, '');
          const url = `${base}/wp-json/wc/v3/system_status`;
          await firstValueFrom(
            this.httpService.get(url, {
              auth: { username: consumerKey, password: consumerSecret },
              timeout: 10000,
            }),
          );
          return { success: true, message: 'Connection to WooCommerce successful' };
        }
        case 'magento':
        case 'custom':
          if (integration.webhookUrl || integration.apiKey) {
            return { success: true, message: `Integration ${integration.platform} configured (no remote check)` };
          }
          return { success: false, message: `Configure apiKey or webhookUrl for ${integration.platform}` };
        default:
          return { success: true, message: `Connection to ${integration.platform} accepted` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to test connection: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Synchronise une intégration et enregistre l'historique dans SyncHistory.
   */
  async syncIntegration(id: string, brandId: string, type: 'manual' | 'scheduled' = 'manual'): Promise<IntegrationSync> {
    const startedAt = new Date();
    let syncRecord: { id: string; integrationId: string; status: string; itemsSynced: number; errors: unknown; startedAt: Date; completedAt: Date | null } | null = null;

    try {
      this.logger.log(`Syncing AR integration: ${id} (type: ${type})`);

      const integration = await this.getIntegration(id, brandId);

      if (!integration.isActive) {
        throw new BadRequestException('Integration is not active');
      }

      await this.updateIntegration(id, brandId, {
        syncStatus: 'syncing',
        lastSyncAt: startedAt,
      });

      // Créer l'entrée SyncHistory (pending)
      syncRecord = await this.prisma.syncHistory.create({
        data: {
          integrationId: id,
          status: 'pending',
          itemsSynced: 0,
          errors: [],
          syncType: type,
          startedAt,
        },
      });

      // Synchronisation selon la plateforme (extensible : shopify, woocommerce, etc.)
      const { itemsSynced, errors } = await this.runPlatformSync(integration);

      const completedAt = new Date();
      syncRecord = await this.prisma.syncHistory.update({
        where: { id: syncRecord.id },
        data: {
          status: errors.length > 0 ? 'error' : 'success',
          itemsSynced,
          errors: errors as unknown as object,
          completedAt,
        },
      });

      await this.updateIntegration(id, brandId, {
        syncStatus: errors.length > 0 ? 'error' : 'idle',
        lastSyncAt: completedAt,
      });

      return this.mapSyncHistoryToIntegrationSync(syncRecord);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to sync integration: ${errorMessage}`, errorStack);

      if (syncRecord) {
        const completedAt = new Date();
        const errs = [errorMessage];
        await this.prisma.syncHistory.update({
          where: { id: syncRecord.id },
          data: {
            status: 'error',
            errors: errs as unknown as object,
            completedAt,
          },
        });
      }

      await this.updateIntegration(id, brandId, { syncStatus: 'error' });
      throw error;
    }
  }

  /**
   * Exécute la synchro selon la plateforme (Shopify, WooCommerce via API).
   */
  private async runPlatformSync(integration: ARIntegration): Promise<{ itemsSynced: number; errors: string[] }> {
    const settings = (integration.settings ?? {}) as Record<string, unknown>;
    const errors: string[] = [];

    try {
      switch (integration.platform) {
        case 'shopify': {
          const shopDomain = settings.shopDomain as string | undefined;
          const accessToken = (settings.accessToken ?? integration.apiKey) as string | undefined;
          if (!shopDomain || !accessToken) {
            errors.push('Shopify: shopDomain and accessToken required in settings');
            break;
          }
          const shop = shopDomain.replace(/^https?:\/\//, '').split('/')[0];
          const url = `https://${shop}/admin/api/2024-10/products.json?limit=250`;
          const res = await firstValueFrom(
            this.httpService.get<{ products?: unknown[] }>(url, {
              headers: { 'X-Shopify-Access-Token': accessToken },
              timeout: 15000,
            }),
          );
          const count = Array.isArray(res.data?.products) ? res.data.products.length : 0;
          this.logger.log(`Shopify sync: ${count} products fetched for integration ${integration.id}`);
          return { itemsSynced: count, errors };
        }
        case 'woocommerce': {
          const storeUrl = settings.storeUrl as string | undefined;
          const consumerKey = (settings.consumerKey ?? integration.apiKey) as string | undefined;
          const consumerSecret = (settings.consumerSecret ?? integration.apiSecret) as string | undefined;
          if (!storeUrl || !consumerKey || !consumerSecret) {
            errors.push('WooCommerce: storeUrl, consumerKey, consumerSecret required');
            break;
          }
          const base = storeUrl.replace(/\/$/, '');
          const url = `${base}/wp-json/wc/v3/products?per_page=100`;
          const res = await firstValueFrom(
            this.httpService.get<unknown[]>(url, {
              auth: { username: consumerKey, password: consumerSecret },
              timeout: 15000,
            }),
          );
          const count = Array.isArray(res.data) ? res.data.length : 0;
          this.logger.log(`WooCommerce sync: ${count} products fetched for integration ${integration.id}`);
          return { itemsSynced: count, errors };
        }
        case 'magento': {
          // Magento 2 REST API integration
          const magentoUrl = settings.storeUrl as string | undefined;
          const magentoToken = (settings.accessToken ?? settings.bearerToken ?? integration.apiKey) as string | undefined;
          
          if (!magentoUrl || !magentoToken) {
            errors.push('Magento: storeUrl and accessToken/bearerToken required in settings');
            break;
          }
          
          const baseUrl = magentoUrl.replace(/\/$/, '');
          const searchCriteria = 'searchCriteria[pageSize]=100&searchCriteria[currentPage]=1';
          const magentoApiUrl = `${baseUrl}/rest/V1/products?${searchCriteria}`;
          
          try {
            const res = await firstValueFrom(
              this.httpService.get<{ items?: unknown[]; total_count?: number }>(magentoApiUrl, {
                headers: {
                  'Authorization': `Bearer ${magentoToken}`,
                  'Content-Type': 'application/json',
                },
                timeout: 20000,
              }),
            );
            
            const count = Array.isArray(res.data?.items) ? res.data.items.length : 0;
            this.logger.log(`Magento sync: ${count} products fetched for integration ${integration.id}`);
            return { itemsSynced: count, errors };
          } catch (magentoErr) {
            const magentoMsg = magentoErr instanceof Error ? magentoErr.message : String(magentoErr);
            errors.push(`Magento API error: ${magentoMsg}`);
            break;
          }
        }
        case 'custom': {
          // Custom API integration - expects a standard REST endpoint
          const customApiUrl = settings.apiUrl as string | undefined;
          const customApiKey = (settings.apiKey ?? integration.apiKey) as string | undefined;
          const customMethod = (settings.method as string) || 'GET';
          const customHeaders = (settings.headers as Record<string, string>) || {};
          
          if (!customApiUrl) {
            errors.push('Custom: apiUrl required in settings');
            break;
          }
          
          try {
            // Build headers with API key if provided
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              ...customHeaders,
            };
            
            if (customApiKey) {
              // Support common API key header formats
              if (!headers['Authorization'] && !headers['X-Api-Key']) {
                headers['X-Api-Key'] = customApiKey;
              }
            }
            
            const res = await firstValueFrom(
              this.httpService.request<{ items?: unknown[]; data?: unknown[]; products?: unknown[]; results?: unknown[]; count?: number }>({
                method: customMethod as 'GET' | 'POST',
                url: customApiUrl,
                headers,
                timeout: 30000,
              }),
            );
            
            // Try to extract item count from various response formats
            const data = res.data;
            let count = 0;
            
            if (Array.isArray(data)) {
              count = data.length;
            } else if (data?.items && Array.isArray(data.items)) {
              count = data.items.length;
            } else if (data?.data && Array.isArray(data.data)) {
              count = data.data.length;
            } else if (data?.products && Array.isArray(data.products)) {
              count = data.products.length;
            } else if (data?.results && Array.isArray(data.results)) {
              count = data.results.length;
            } else if (typeof data?.count === 'number') {
              count = data.count;
            }
            
            this.logger.log(`Custom API sync: ${count} items fetched for integration ${integration.id}`);
            return { itemsSynced: count, errors };
          } catch (customErr) {
            const customMsg = customErr instanceof Error ? customErr.message : String(customErr);
            errors.push(`Custom API error: ${customMsg}`);
            break;
          }
        }
        default:
          this.logger.warn(`Unknown platform: ${integration.platform}`);
          break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      this.logger.warn(`Platform sync failed: ${msg}`);
    }

    return { itemsSynced: 0, errors };
  }

  private mapSyncHistoryToIntegrationSync(row: {
    id: string;
    integrationId: string;
    status: string;
    itemsSynced: number;
    errors: unknown;
    startedAt: Date;
    completedAt: Date | null;
  }): IntegrationSync {
    const errors = Array.isArray(row.errors) ? (row.errors as string[]) : [];
    return {
      id: row.id,
      integrationId: row.integrationId,
      status: row.status as IntegrationSync['status'],
      itemsSynced: row.itemsSynced,
      errors,
      startedAt: row.startedAt,
      completedAt: row.completedAt ?? undefined,
    };
  }

  /**
   * Récupère l'historique de synchronisation depuis SyncHistory (Prisma).
   */
  async getSyncHistory(integrationId: string, brandId: string, limit: number = 20): Promise<IntegrationSync[]> {
    try {
      this.logger.log(`Getting sync history for integration: ${integrationId}`);

      await this.getIntegration(integrationId, brandId);

      const rows = await this.prisma.syncHistory.findMany({
        where: { integrationId },
        orderBy: { startedAt: 'desc' },
        take: Math.min(limit, 100),
      });

      return rows.map((row) =>
        this.mapSyncHistoryToIntegrationSync({
          id: row.id,
          integrationId: row.integrationId,
          status: row.status,
          itemsSynced: row.itemsSynced,
          errors: row.errors as string[],
          startedAt: row.startedAt,
          completedAt: row.completedAt,
        }),
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get sync history: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}


