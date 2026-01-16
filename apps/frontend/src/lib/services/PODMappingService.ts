/**
 * ★★★ SERVICE - POD MAPPING ★★★
 * Service pour mapper les produits Luneo vers les variants POD
 * - Printful variant mapping
 * - Printify product/variant mapping
 * - Gelato product UID mapping
 * - Configuration par produit
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export interface PODVariantMapping {
  provider: 'printful' | 'printify' | 'gelato';
  variantId?: number | string;
  productId?: number | string;
  productUid?: string;
  defaultVariantId?: number | string;
  defaultProductId?: number | string;
}

export interface PODProductConfig {
  printful?: {
    variantId?: number;
    defaultVariantId?: number;
  };
  printify?: {
    productId?: number;
    variantId?: number;
    defaultProductId?: number;
    defaultVariantId?: number;
  };
  gelato?: {
    productUid?: string;
    defaultProductUid?: string;
  };
}

export class PODMappingService {
  private static instance: PODMappingService;

  private constructor() {}

  static getInstance(): PODMappingService {
    if (!PODMappingService.instance) {
      PODMappingService.instance = new PODMappingService();
    }
    return PODMappingService.instance;
  }

  /**
   * Récupère la configuration POD pour un produit
   */
  async getProductPODConfig(productId: string): Promise<PODProductConfig> {
    try {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: {
          metadata: true,
          customizationOptions: true,
        },
      });

      if (!product) {
        return {};
      }

      const metadata = product.metadata as any;
      return metadata?.pod || {};
    } catch (error: any) {
      logger.error('Error getting POD config', { error, productId });
      return {};
    }
  }

  /**
   * Met à jour la configuration POD pour un produit
   */
  async updateProductPODConfig(
    productId: string,
    provider: 'printful' | 'printify' | 'gelato',
    config: PODVariantMapping
  ): Promise<void> {
    try {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { metadata: true },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const metadata = product.metadata as any || {};
      const podConfig = metadata.pod || {};

      // Update provider-specific config
      podConfig[provider] = {
        variantId: config.variantId,
        productId: config.productId,
        productUid: config.productUid,
        defaultVariantId: config.defaultVariantId,
        defaultProductId: config.defaultProductId,
      };

      // Update product metadata
      await db.product.update({
        where: { id: productId },
        data: {
          metadata: {
            ...metadata,
            pod: podConfig,
          } as any,
        },
      });

      logger.info('POD config updated', { productId, provider, config });
    } catch (error: any) {
      logger.error('Error updating POD config', { error, productId, provider });
      throw error;
    }
  }

  /**
   * Récupère le variant ID pour un produit et un provider
   */
  async getVariantId(
    productId: string,
    provider: 'printful' | 'printify' | 'gelato',
    itemVariantId?: string | number
  ): Promise<number | string> {
    try {
      const config = await this.getProductPODConfig(productId);
      const providerConfig = config[provider] || {};

      // Priority: item variant > product variant > default variant
      if (itemVariantId) {
        return typeof itemVariantId === 'string' ? parseInt(itemVariantId, 10) : itemVariantId;
      }

      if (
        provider !== 'gelato' &&
        'variantId' in providerConfig &&
        providerConfig.variantId
      ) {
        return typeof providerConfig.variantId === 'string'
          ? parseInt(providerConfig.variantId, 10)
          : providerConfig.variantId;
      }

      if (
        provider !== 'gelato' &&
        'defaultVariantId' in providerConfig &&
        providerConfig.defaultVariantId
      ) {
        return typeof providerConfig.defaultVariantId === 'string'
          ? parseInt(providerConfig.defaultVariantId, 10)
          : providerConfig.defaultVariantId;
      }

      // Fallback to default based on provider
      return this.getDefaultVariantId(provider);
    } catch (error: any) {
      logger.error('Error getting variant ID', { error, productId, provider });
      return this.getDefaultVariantId(provider);
    }
  }

  /**
   * Récupère le product ID pour Printify
   */
  async getProductId(
    productId: string,
    provider: 'printify',
    itemProductId?: string | number
  ): Promise<number> {
    try {
      const config = await this.getProductPODConfig(productId);
      const providerConfig = config[provider] || {};

      // Priority: item product > product product > default product
      if (itemProductId) {
        return typeof itemProductId === 'string' ? parseInt(itemProductId, 10) : itemProductId;
      }

      if (providerConfig.productId) {
        return typeof providerConfig.productId === 'string'
          ? parseInt(providerConfig.productId, 10)
          : providerConfig.productId;
      }

      if (providerConfig.defaultProductId) {
        return typeof providerConfig.defaultProductId === 'string'
          ? parseInt(providerConfig.defaultProductId, 10)
          : providerConfig.defaultProductId;
      }

      return 1; // Default
    } catch (error: any) {
      logger.error('Error getting product ID', { error, productId, provider });
      return 1;
    }
  }

  /**
   * Récupère le product UID pour Gelato
   */
  async getProductUid(
    productId: string,
    provider: 'gelato',
    itemProductId?: string | number
  ): Promise<string> {
    try {
      const config = await this.getProductPODConfig(productId);
      const providerConfig = config[provider] || {};

      // Priority: item product > product UID > default UID
      if (itemProductId) {
        return itemProductId.toString();
      }

      if (providerConfig.productUid) {
        return providerConfig.productUid;
      }

      if (providerConfig.defaultProductUid) {
        return providerConfig.defaultProductUid;
      }

      return `product_${productId}`; // Generate from product ID
    } catch (error: any) {
      logger.error('Error getting product UID', { error, productId, provider });
      return `product_${productId}`;
    }
  }

  /**
   * Récupère le variant ID par défaut pour un provider
   */
  private getDefaultVariantId(provider: 'printful' | 'printify' | 'gelato'): number {
    // Default variant IDs by provider (common products)
    const defaults: Record<string, number> = {
      printful: 1, // Default t-shirt variant
      printify: 1, // Default variant
      gelato: 1, // Not used for Gelato
    };

    return defaults[provider] || 1;
  }
}

// ========================================
// EXPORT
// ========================================

export const podMappingService = PODMappingService.getInstance();

