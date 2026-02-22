/**
 * E-Commerce AR - Product AR Config Service
 * CRUD for ProductARConfig: link product to AR model, placement, overlay, counters
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { PlacementMode, ARTrackingType } from '@prisma/client';

export type ProductARConfigCreateOptions = {
  defaultScale?: number;
  defaultRotation?: { x: number; y: number; z: number };
  placementMode?: PlacementMode;
  showPriceInAR?: boolean;
  showBuyButton?: boolean;
  showVariantPicker?: boolean;
  overlayPosition?: string;
  trackingType?: ARTrackingType;
  imageTargetId?: string | null;
};

export type ProductARConfigUpdateData = Partial<{
  primaryModelId: string;
  defaultScale: number;
  defaultRotation: { x: number; y: number; z: number };
  placementMode: PlacementMode;
  showPriceInAR: boolean;
  showBuyButton: boolean;
  showVariantPicker: boolean;
  overlayPosition: string;
  trackingType: ARTrackingType;
  imageTargetId: string | null;
}>;

export type CounterType = 'impressions' | 'arLaunches' | 'conversions';

@Injectable()
export class ProductARConfigService {
  private readonly logger = new Logger(ProductARConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create AR config for a product (links product to primary 3D model)
   */
  async createConfig(
    productId: string,
    primaryModelId: string,
    options: ProductARConfigCreateOptions = {},
  ) {
    this.logger.log(`Creating AR config for product ${productId}, model ${primaryModelId}`);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, brandId: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const existing = await this.prisma.productARConfig.findUnique({
      where: { productId },
    });
    if (existing) {
      throw new BadRequestException(`Product ${productId} already has an AR config`);
    }

    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: primaryModelId },
    });
    if (!model) {
      throw new NotFoundException(`AR model ${primaryModelId} not found`);
    }

    const config = await this.prisma.productARConfig.create({
      data: {
        productId,
        primaryModelId,
        defaultScale: options.defaultScale ?? 1.0,
        defaultRotation: (options.defaultRotation as object) ?? { x: 0, y: 0, z: 0 },
        placementMode: options.placementMode ?? 'GROUND_PLANE',
        showPriceInAR: options.showPriceInAR ?? true,
        showBuyButton: options.showBuyButton ?? true,
        showVariantPicker: options.showVariantPicker ?? true,
        overlayPosition: options.overlayPosition ?? 'bottom',
        trackingType: options.trackingType ?? 'WORLD',
        imageTargetId: options.imageTargetId ?? undefined,
      },
      include: {
        product: { select: { id: true, name: true, brandId: true } },
        primaryModel: { select: { id: true, name: true, gltfURL: true } },
      },
    });

    return config;
  }

  /**
   * Update AR config for a product
   */
  async updateConfig(productId: string, data: ProductARConfigUpdateData) {
    this.logger.log(`Updating AR config for product ${productId}`);

    const existing = await this.prisma.productARConfig.findUnique({
      where: { productId },
    });
    if (!existing) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }

    if (data.primaryModelId) {
      const model = await this.prisma.aR3DModel.findUnique({
        where: { id: data.primaryModelId },
      });
      if (!model) {
        throw new NotFoundException(`AR model ${data.primaryModelId} not found`);
      }
    }

    const config = await this.prisma.productARConfig.update({
      where: { productId },
      data: {
        ...(data.primaryModelId != null && { primaryModelId: data.primaryModelId }),
        ...(data.defaultScale != null && { defaultScale: data.defaultScale }),
        ...(data.defaultRotation != null && { defaultRotation: data.defaultRotation as object }),
        ...(data.placementMode != null && { placementMode: data.placementMode }),
        ...(data.showPriceInAR != null && { showPriceInAR: data.showPriceInAR }),
        ...(data.showBuyButton != null && { showBuyButton: data.showBuyButton }),
        ...(data.showVariantPicker != null && { showVariantPicker: data.showVariantPicker }),
        ...(data.overlayPosition != null && { overlayPosition: data.overlayPosition }),
        ...(data.trackingType != null && { trackingType: data.trackingType }),
        ...(data.imageTargetId !== undefined && { imageTargetId: data.imageTargetId }),
      },
      include: {
        product: { select: { id: true, name: true, brandId: true } },
        primaryModel: { select: { id: true, name: true, gltfURL: true } },
      },
    });

    return config;
  }

  /**
   * Get AR config for a product
   */
  async getConfig(productId: string) {
    const config = await this.prisma.productARConfig.findUnique({
      where: { productId },
      include: {
        product: { select: { id: true, name: true, slug: true, brandId: true, price: true, currency: true } },
        primaryModel: { select: { id: true, name: true, gltfURL: true, usdzURL: true } },
      },
    });
    if (!config) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }
    return config;
  }

  /**
   * List all AR-configured products for a brand
   */
  async listConfigs(brandId: string) {
    this.logger.log(`Listing AR configs for brand ${brandId}`);

    const configs = await this.prisma.productARConfig.findMany({
      where: { product: { brandId } },
      include: {
        product: { select: { id: true, name: true, slug: true, brandId: true } },
        primaryModel: { select: { id: true, name: true, gltfURL: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return configs;
  }

  /**
   * Increment analytics counter (impressions, arLaunches, conversions)
   */
  async incrementCounter(productId: string, counter: CounterType, amount = 1) {
    const existing = await this.prisma.productARConfig.findUnique({
      where: { productId },
    });
    if (!existing) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }

    const update =
      counter === 'impressions'
        ? { impressions: { increment: amount } }
        : counter === 'arLaunches'
          ? { arLaunches: { increment: amount } }
          : { conversions: { increment: amount } };

    const config = await this.prisma.productARConfig.update({
      where: { productId },
      data: update,
    });

    return config;
  }
}
