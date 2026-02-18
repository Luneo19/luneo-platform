/**
 * E-Commerce AR - Price Overlay Service
 * Configure AR price/buy overlay (show/hide, position)
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type OverlayConfig = {
  showPriceInAR: boolean;
  showBuyButton: boolean;
  showVariantPicker: boolean;
  overlayPosition: string;
};

export type OverlayConfigUpdate = Partial<OverlayConfig>;

@Injectable()
export class PriceOverlayService {
  private readonly logger = new Logger(PriceOverlayService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get overlay config for a product (from ProductARConfig)
   */
  async getOverlayConfig(productId: string): Promise<OverlayConfig> {
    const config = await this.prisma.productARConfig.findUnique({
      where: { productId },
      select: {
        showPriceInAR: true,
        showBuyButton: true,
        showVariantPicker: true,
        overlayPosition: true,
      },
    });
    if (!config) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }

    return {
      showPriceInAR: config.showPriceInAR,
      showBuyButton: config.showBuyButton,
      showVariantPicker: config.showVariantPicker,
      overlayPosition: config.overlayPosition,
    };
  }

  /**
   * Update overlay config for a product
   */
  async updateOverlayConfig(productId: string, data: OverlayConfigUpdate): Promise<OverlayConfig> {
    this.logger.log(`Updating overlay config for product ${productId}`);

    const existing = await this.prisma.productARConfig.findUnique({
      where: { productId },
    });
    if (!existing) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }

    await this.prisma.productARConfig.update({
      where: { productId },
      data: {
        ...(data.showPriceInAR != null && { showPriceInAR: data.showPriceInAR }),
        ...(data.showBuyButton != null && { showBuyButton: data.showBuyButton }),
        ...(data.showVariantPicker != null && { showVariantPicker: data.showVariantPicker }),
        ...(data.overlayPosition != null && { overlayPosition: data.overlayPosition }),
      },
    });

    return this.getOverlayConfig(productId);
  }
}
