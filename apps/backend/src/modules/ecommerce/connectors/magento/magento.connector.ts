import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { firstValueFrom } from 'rxjs';
import {
  MagentoProduct,
  MagentoOrder,
  EcommerceIntegration,
  SyncResult,
  SyncOptions,
} from '../../interfaces/ecommerce.interface';

@Injectable()
export class MagentoConnector {
  private readonly logger = new Logger(MagentoConnector.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
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
      return integration as any;
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
      throw new Error('Invalid Magento API token');
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
  private transformMagentoProducts(graphqlProducts: any[]): MagentoProduct[] {
    return graphqlProducts.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      status: 1, // Enabled
      visibility: 4, // Catalog, Search
      type_id: 'simple',
      price: product.price_range?.minimum_price?.regular_price?.value || 0,
      attribute_set_id: 4, // Default
      custom_attributes: [],
      media_gallery_entries: product.media_gallery?.map((media: any, index: number) => ({
        id: index + 1,
        media_type: 'image',
        label: media.label,
        position: media.position || index,
        disabled: false,
        types: ['image', 'small_image', 'thumbnail'],
        file: media.url,
      })) || [],
    }));
  }

  /**
   * Synchronise les produits
   */
  async syncProducts(integrationId: string, options?: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      this.logger.log(`Starting Magento product sync for ${integrationId}`);

      const products = await this.getProducts(integrationId, { pageSize: 100 });

      for (const product of products) {
        try {
          await this.handleProductUpdate(integrationId, product);
          itemsProcessed++;
        } catch (error) {
          errors.push({
            itemId: product.sku,
            code: 'SYNC_ERROR',
            message: error.message,
          });
          itemsFailed++;
        }
      }

      const syncLog = await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: 'product',
          direction: 'import',
          status: itemsFailed === 0 ? 'success' : 'partial',
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
        status: syncLog.status as any,
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
   * Traite une mise à jour de produit
   */
  private async handleProductUpdate(integrationId: string, product: MagentoProduct): Promise<void> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId,
        externalSku: product.sku,
      },
    });

    if (mapping) {
      await this.updateLuneoProductFromMagento(mapping.luneoProductId, product);
    } else {
      await this.createLuneoProductFromMagento(integrationId, product);
    }
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
        brandId: integration.brandId as any,
        name: magentoProduct.name,
        description: '',
        sku: magentoProduct.sku,
        price: magentoProduct.price,
        images: magentoProduct.media_gallery_entries.map(media => media.file),
        isActive: magentoProduct.status === 1,
      } as any,
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
  private async getIntegration(integrationId: string): Promise<any> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    return integration;
  }

  /**
   * Crypte un token
   */
  private encryptToken(token: string): string {
    return Buffer.from(token).toString('base64');
  }

  /**
   * Décrypte un token
   */
  private decryptToken(encryptedToken: string): string {
    return Buffer.from(encryptedToken, 'base64').toString('utf8');
  }
}


