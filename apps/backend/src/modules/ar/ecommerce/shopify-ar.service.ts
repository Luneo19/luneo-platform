/**
 * E-Commerce AR - Shopify AR Integration Service
 * Sync Shopify products with AR config, generate AR button code, widget config
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class ShopifyARService {
  private readonly logger = new Logger(ShopifyARService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sync Shopify products with AR config (ensure ProductARConfig exists for mapped products)
   */
  async syncProducts(integrationId: string) {
    this.logger.log(`Syncing Shopify products for integration ${integrationId}`);

    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: { id: integrationId, platform: 'shopify' },
      include: { productMappings: { include: { product: true } } },
    });
    if (!integration) {
      throw new NotFoundException(`Shopify integration ${integrationId} not found`);
    }

    const results = { synced: 0, skipped: 0, errors: [] as string[] };

    for (const mapping of integration.productMappings) {
      try {
        const hasConfig = await this.prisma.productARConfig.findUnique({
          where: { productId: mapping.luneoProductId },
        });
        if (hasConfig) {
          results.skipped += 1;
          continue;
        }
        const product = mapping.product;
        if (product.model3dUrl) {
          const model = await this.prisma.aR3DModel.findFirst({
            where: { project: { brandId: integration.brandId } },
          });
          if (model) {
            await this.prisma.productARConfig.upsert({
              where: { productId: mapping.luneoProductId },
              create: {
                productId: mapping.luneoProductId,
                primaryModelId: model.id,
              },
              update: {},
            });
            results.synced += 1;
          }
        }
      } catch (err) {
        results.errors.push(
          `${mapping.luneoProductId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    await this.prisma.ecommerceIntegration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return results;
  }

  /**
   * Generate Shopify AR button snippet for a product (model-viewer / Quick Look link)
   */
  async generateARButton(productId: string, baseUrl: string): Promise<string> {
    const config = await this.prisma.productARConfig.findUnique({
      where: { productId },
      include: { primaryModel: true },
    });
    if (!config) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }

    const glbUrl = config.primaryModel.gltfURL ?? config.primaryModel.usdzURL;
    if (!glbUrl) {
      throw new NotFoundException(`No 3D asset URL for product ${productId}`);
    }

    const viewerUrl = `${baseUrl.replace(/\/$/, '')}/ar/view/${productId}`;
    return `<a href="${viewerUrl}" rel="ar">View in AR</a>`;
  }

  /**
   * Get Shopify AR widget configuration for an integration (for embed/checkout)
   */
  async getShopifyARWidget(integrationId: string) {
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: { id: integrationId, platform: 'shopify' },
      select: { id: true, brandId: true, shopDomain: true, config: true },
    });
    if (!integration) {
      throw new NotFoundException(`Shopify integration ${integrationId} not found`);
    }

    const config = (integration.config as Record<string, unknown>) ?? {};
    return {
      integrationId,
      brandId: integration.brandId,
      shopDomain: integration.shopDomain,
      arEnabled: (config.arEnabled as boolean) ?? true,
      showARButtonOnProduct: (config.showARButtonOnProduct as boolean) ?? true,
      widgetPlacement: (config.widgetPlacement as string) ?? 'below_gallery',
    };
  }
}
