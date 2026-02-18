/**
 * E-Commerce AR - Variant Switcher Service
 * Map product variants (e.g. color:gold) to 3D model IDs
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type VariantModelsMap = Record<string, string>; // variantKey -> modelId

@Injectable()
export class VariantSwitcherService {
  private readonly logger = new Logger(VariantSwitcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Map a variant key (e.g. "color:gold") to a 3D model ID
   */
  async mapVariant(productId: string, variantKey: string, modelId: string) {
    this.logger.log(`Mapping variant ${variantKey} -> model ${modelId} for product ${productId}`);

    const config = await this.prisma.productARConfig.findUnique({
      where: { productId },
      select: { id: true, variantModels: true },
    });
    if (!config) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }

    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: modelId },
    });
    if (!model) {
      throw new NotFoundException(`AR model ${modelId} not found`);
    }

    const current = (config.variantModels as VariantModelsMap) ?? {};
    const updated: VariantModelsMap = { ...current, [variantKey]: modelId };

    await this.prisma.productARConfig.update({
      where: { productId },
      data: { variantModels: updated as object },
    });

    return { variantKey, modelId };
  }

  /**
   * Get 3D model ID for a variant key
   */
  async getVariantModel(productId: string, variantKey: string): Promise<string | null> {
    const config = await this.prisma.productARConfig.findUnique({
      where: { productId },
      select: { variantModels: true },
    });
    if (!config) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }

    const map = (config.variantModels as VariantModelsMap) ?? {};
    return map[variantKey] ?? null;
  }

  /**
   * List all variant -> model mappings for a product
   */
  async listVariantMappings(productId: string): Promise<VariantModelsMap> {
    const config = await this.prisma.productARConfig.findUnique({
      where: { productId },
      select: { variantModels: true },
    });
    if (!config) {
      throw new NotFoundException(`AR config for product ${productId} not found`);
    }

    return (config.variantModels as VariantModelsMap) ?? {};
  }
}
