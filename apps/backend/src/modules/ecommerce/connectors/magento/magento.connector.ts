import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';
import { firstValueFrom } from 'rxjs';
import {
  MagentoProduct,
  MagentoOrder,
  EcommerceIntegration,
  SyncResult,
  SyncOptions,
} from '../../interfaces/ecommerce.interface';
// ENUM-01: Import des enums Prisma pour intégrité des données
import { SyncLogStatus, SyncLogType, SyncDirection } from '@prisma/client';
@Injectable()
export class MagentoConnector {
  private readonly logger = new Logger(MagentoConnector.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Connecte une boutique Magento
   */
  async connect(
    brandId: string,
    storeUrl: string,
    apiToken: string,
  ): Promise<EcommerceIntegration> {
    try {
      // Valider le token
      await this.validateToken(storeUrl, apiToken);

      // Créer l'intégration
      const integration = await this.prisma.ecommerceIntegration.create({
        data: {
          brandId,
          platform: 'magento',
          shopDomain: storeUrl,
          accessToken: this.encryptToken(apiToken),
          config: {
            apiType: 'graphql',
            storeCode: 'default',
          },
          status: 'active',
        },
      });

      this.logger.log(`Magento integration created for brand ${brandId}`);
      return integration as unknown as EcommerceIntegration;
    } catch (error) {
      this.logger.error(`Error connecting Magento:`, error);
      throw error;
    }
  }

  /**
   * Valide le token API Magento
   */
  private async validateToken(storeUrl: string, apiToken: string): Promise<boolean> {
    try {
      const query = `
        query {
          storeConfig {
            store_code
            store_name
          }
        }
      `;

      const response = await firstValueFrom(
        this.httpService.post(
          `${storeUrl}/graphql`,
          { query },
          {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return response.data?.data?.storeConfig !== undefined;
    } catch (error) {
      this.logger.error(`Invalid Magento token:`, error);
      throw new BadRequestException('Invalid Magento API token');
    }
  }

  /**
   * Récupère les produits Magento via GraphQL
   */
  async getProducts(
    integrationId: string,
    options?: { pageSize?: number; currentPage?: number }
  ): Promise<MagentoProduct[]> {
    const integration = await this.getIntegration(integrationId);
    const apiToken = this.decryptToken(integration.accessToken);

    try {
      const query = `
        query getProducts($pageSize: Int, $currentPage: Int) {
          products(
            pageSize: $pageSize
            currentPage: $currentPage
          ) {
            items {
              id
              sku
              name
              price_range {
                minimum_price {
                  regular_price {
                    value
                    currency
                  }
                }
              }
              image {
                url
                label
              }
              media_gallery {
                url
                label
                position
              }
              description {
                html
              }
              short_description {
                html
              }
            }
            total_count
          }
        }
      `;

      const response = await firstValueFrom(
        this.httpService.post(
          `${integration.shopDomain}/graphql`,
          {
            query,
            variables: {
              pageSize: options?.pageSize || 100,
              currentPage: options?.currentPage || 1,
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return this.transformMagentoProducts(response.data.data.products.items);
    } catch (error) {
      this.logger.error(`Error fetching Magento products:`, error);
      throw error;
    }
  }

  /**
   * Crée ou met à jour un produit Magento via REST
   */
  async upsertProduct(
    integrationId: string,
    productData: Partial<MagentoProduct>,
    sku?: string,
  ): Promise<MagentoProduct> {
    const integration = await this.getIntegration(integrationId);
    const apiToken = this.decryptToken(integration.accessToken);

    try {
      const url = sku
        ? `${integration.shopDomain}/rest/V1/products/${sku}`
        : `${integration.shopDomain}/rest/V1/products`;

      const method = sku ? 'put' : 'post';

      const response = await firstValueFrom(
        this.httpService[method](
          url,
          { product: productData },
          {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error upserting Magento product:`, error);
      throw error;
    }
  }

  /**
   * Récupère les commandes Magento
   */
  async getOrders(
    integrationId: string,
    options?: { pageSize?: number; currentPage?: number }
  ): Promise<MagentoOrder[]> {
    const integration = await this.getIntegration(integrationId);
    const apiToken = this.decryptToken(integration.accessToken);

    try {
      const searchCriteria = new URLSearchParams();
      searchCriteria.append('searchCriteria[pageSize]', (options?.pageSize || 100).toString());
      searchCriteria.append('searchCriteria[currentPage]', (options?.currentPage || 1).toString());

      const response = await firstValueFrom(
        this.httpService.get(
          `${integration.shopDomain}/rest/V1/orders?${searchCriteria}`,
          {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
            },
          }
        )
      );

      return response.data.items;
    } catch (error) {
      this.logger.error(`Error fetching Magento orders:`, error);
      throw error;
    }
  }

  /**
   * Transforme les produits Magento GraphQL en format standard
   */
  private transformMagentoProducts(graphqlProducts: Record<string, unknown>[]): MagentoProduct[] {
    return graphqlProducts.map(product => ({
      id: (product.id as string),
      sku: (product.sku as string),
      name: (product.name as string),
      status: 1, // Enabled
      visibility: 4, // Catalog, Search
      type_id: 'simple',
      price: (product.price_range as { minimum_price?: { regular_price?: { value?: number } } })?.minimum_price?.regular_price?.value || 0,
      attribute_set_id: 4, // Default
      custom_attributes: [],
      media_gallery_entries: (product.media_gallery as Array<{ label?: string; position?: number; url?: string }> | undefined)?.map((media, index: number) => ({
        id: index + 1,
        media_type: 'image',
        label: media.label,
        position: media.position || index,
        disabled: false,
        types: ['image', 'small_image', 'thumbnail'],
        file: media.url,
      })) || [],
    })) as unknown as MagentoProduct[];
  }

  /**
   * Synchronise les produits
   * PERF-02: Batch loading des mappings + traitement parallèle
   */
  async syncProducts(integrationId: string, options?: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      this.logger.log(`Starting Magento product sync for ${integrationId}`);

      const products = await this.getProducts(integrationId, { pageSize: 100 });

      // PERF-02: Charger tous les mappings existants en une seule requête
      const existingMappings = await this.prisma.productMapping.findMany({
        where: {
          integrationId,
          externalSku: { in: products.map(p => p.sku) },
        },
      });

      // PERF-02: Créer une Map pour lookup O(1)
      const mappingBySku = new Map(existingMappings.map(m => [m.externalSku, m]));

      // PERF-02: Traiter les produits en batch parallèle
      const BATCH_SIZE = 10;
      
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        
        const results = await Promise.allSettled(
          batch.map(product => this.handleProductUpdateWithMapping(
            integrationId,
            product,
            mappingBySku.get(product.sku),
          ))
        );
        
        results.forEach((result, index) => {
          const product = batch[index];
          if (result.status === 'fulfilled') {
            itemsProcessed++;
          } else {
            errors.push({
              itemId: product.sku,
              code: 'SYNC_ERROR',
              message: result.reason?.message || 'Unknown error',
            });
            itemsFailed++;
          }
        });
      }

      // ENUM-01: Utilise enums Prisma pour intégrité des données
      const syncLog = await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.PRODUCT,
          direction: SyncDirection.IMPORT,
          status: itemsFailed === 0 ? SyncLogStatus.SUCCESS : SyncLogStatus.PARTIAL,
          itemsProcessed,
          itemsFailed,
          errors,
          duration: Date.now() - startTime,
        },
      });

      return {
        integrationId,
        platform: 'magento',
        type: 'product',
        direction: 'import',
        status: syncLog.status as 'success' | 'partial' | 'failed',
        itemsProcessed,
        itemsFailed,
        duration: Date.now() - startTime,
        errors,
        summary: {
          created: itemsProcessed - itemsFailed,
          updated: 0,
          deleted: 0,
          skipped: itemsFailed,
        },
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Magento product sync failed:`, error);
      throw error;
    }
  }

  /**
   * Traite une mise à jour de produit avec mapping pré-chargé
   * PERF-02: Évite les requêtes N+1 en utilisant le mapping pré-chargé
   */
  private async handleProductUpdateWithMapping(
    integrationId: string,
    product: MagentoProduct,
    mapping: { luneoProductId: string } | undefined,
  ): Promise<void> {
    if (mapping) {
      await this.updateLuneoProductFromMagento(mapping.luneoProductId, product);
    } else {
      await this.createLuneoProductFromMagento(integrationId, product);
    }
  }

  /**
   * Traite une mise à jour de produit (méthode legacy, préférer handleProductUpdateWithMapping)
   * @deprecated Utiliser handleProductUpdateWithMapping avec batch loading
   */
  private async handleProductUpdate(integrationId: string, product: MagentoProduct): Promise<void> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId,
        externalSku: product.sku,
      },
    });

    await this.handleProductUpdateWithMapping(integrationId, product, mapping || undefined);
  }

  /**
   * Crée un produit LUNEO à partir de Magento
   */
  private async createLuneoProductFromMagento(
    integrationId: string,
    magentoProduct: MagentoProduct,
  ): Promise<void> {
    const integration = await this.getIntegration(integrationId);

    const luneoProduct = await this.prisma.product.create({
      data: {
        brandId: integration.brandId,
        name: magentoProduct.name,
        description: '',
        sku: magentoProduct.sku,
        price: magentoProduct.price,
        images: magentoProduct.media_gallery_entries.map(media => media.file),
        isActive: magentoProduct.status === 1,
      } as unknown as import('@prisma/client').Prisma.ProductCreateInput,
    });

    await this.prisma.productMapping.create({
      data: {
        integrationId,
        luneoProductId: luneoProduct.id,
        externalProductId: magentoProduct.id.toString(),
        externalSku: magentoProduct.sku,
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
    });

    this.logger.log(`Created LUNEO product from Magento product ${magentoProduct.sku}`);
  }

  /**
   * Met à jour un produit LUNEO à partir de Magento
   */
  private async updateLuneoProductFromMagento(
    luneoProductId: string,
    magentoProduct: MagentoProduct,
  ): Promise<void> {
    await this.prisma.product.update({
      where: { id: luneoProductId },
      data: {
        name: magentoProduct.name,
        price: magentoProduct.price,
        images: magentoProduct.media_gallery_entries.map(media => media.file),
        isActive: magentoProduct.status === 1,
      },
    });

    this.logger.log(`Updated LUNEO product ${luneoProductId} from Magento`);
  }

  /**
   * Récupère une intégration
   */
  private async getIntegration(integrationId: string): Promise<{ id: string; brandId: string; shopDomain: string; accessToken: string }> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${integrationId} not found`);
    }

    return integration;
  }

  /**
   * Chiffre un token avec AES-256-GCM
   * SEC-05: Chiffrement des credentials Magento
   */
  private encryptToken(token: string): string {
    return this.encryptionService.encrypt(token);
  }

  /**
   * Déchiffre un token avec AES-256-GCM
   * Supporte la migration depuis Base64 pour les données existantes
   */
  private decryptToken(encryptedToken: string): string {
    try {
      // Essayer d'abord le nouveau format AES-256-GCM
      return this.encryptionService.decrypt(encryptedToken);
    } catch {
      // Fallback vers Base64 pour les données existantes
      this.logger.warn('Decrypting legacy Base64 token - consider migrating');
      return Buffer.from(encryptedToken, 'base64').toString('utf8');
    }
  }
}


