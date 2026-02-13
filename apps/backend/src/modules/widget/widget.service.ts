import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
// Types from widget (will be imported from shared package later)
export interface ProductConfig {
  productId: string;
  productName: string;
  customizableAreas: Array<{
    id: string;
    name: string;
    description?: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    constraints: Record<string, unknown>;
    isRequired: boolean;
  }>;
  options: {
    colors?: unknown[];
    sizes?: unknown[];
    materials?: unknown[];
  };
}

export interface DesignData {
  id: string;
  productId: string;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  layers: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    opacity: number;
    visible: boolean;
    locked: boolean;
    data: unknown;
  }>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    name?: string;
    description?: string;
  };
}

@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get product configuration for widget
   */
  async getProductConfig(productId: string): Promise<ProductConfig> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        customizableAreas: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    // Convert CustomizableArea to CustomizableArea type
    const areas = product.customizableAreas.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description ?? undefined,
      position: { x: area.x, y: area.y },
      size: { width: area.width, height: area.height },
      constraints: {
        minWidth: area.minWidth ?? undefined,
        maxWidth: area.maxWidth ?? undefined,
        minHeight: area.minHeight ?? undefined,
        maxHeight: area.maxHeight ?? undefined,
        aspectRatio: area.aspectRatio ?? undefined,
        allowedLayerTypes: (area.allowedLayerTypes as string[]) ?? [],
        maxTextLength: area.maxTextLength ?? undefined,
        allowedFonts: area.allowedFonts ?? undefined,
        defaultFont: area.defaultFont ?? undefined,
        allowedFontSizes: area.allowedFontSizes ?? undefined,
        maxImageSize: area.maxImageSize ?? undefined,
        allowedFormats: area.allowedFormats ?? undefined,
        minImageWidth: area.minImageWidth ?? undefined,
        minImageHeight: area.minImageHeight ?? undefined,
        maxImageWidth: area.maxImageWidth ?? undefined,
        maxImageHeight: area.maxImageHeight ?? undefined,
        allowedShapes: area.allowedShapes ?? undefined,
        allowedColors: area.allowedColors ?? undefined,
        defaultColor: area.defaultColor ?? undefined,
      },
      isRequired: area.isRequired,
    }));

    return {
      productId: product.id,
      productName: product.name,
      customizableAreas: areas,
      options: {
        colors: (product.customizationOptions as unknown[]) ?? [],
        sizes: [],
        materials: [],
      },
    };
  }

  /**
   * Save design from widget
   */
  async saveDesign(
    productId: string,
    designData: DesignData,
    userId?: string,
  ): Promise<{ designId: string; url: string }> {
    // Create or update design
    const design = await this.prisma.design.upsert({
      where: {
        id: designData.id || `temp-${Date.now()}`,
      },
      create: {
        id: designData.id || undefined,
        name: designData.metadata?.name || 'Design from Widget',
        description: designData.metadata?.description,
        prompt: 'Widget Design',
        options: {},
        status: 'COMPLETED',
        canvasWidth: designData.canvas.width,
        canvasHeight: designData.canvas.height,
        canvasBackgroundColor: designData.canvas.backgroundColor,
        designData: designData as unknown as Prisma.InputJsonValue,
        productId,
        userId: userId || null,
        brandId: (await this.prisma.product.findUnique({ where: { id: productId }, select: { brandId: true } }))?.brandId ?? '',
      },
      update: {
        canvasWidth: designData.canvas.width,
        canvasHeight: designData.canvas.height,
        canvasBackgroundColor: designData.canvas.backgroundColor,
        designData: designData as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    // Save layers
    await this.prisma.designLayer.deleteMany({
      where: { designId: design.id },
    });

    await this.prisma.designLayer.createMany({
      data: designData.layers.map((layer, index) => ({
        designId: design.id,
        type: layer.type,
        x: layer.position.x,
        y: layer.position.y,
        rotation: layer.rotation,
        scaleX: layer.scale.x,
        scaleY: layer.scale.y,
        opacity: layer.opacity,
        visible: layer.visible,
        locked: layer.locked,
        data: layer.data as unknown as import('@prisma/client').Prisma.InputJsonValue,
        zIndex: index,
      })),
    });

    this.logger.log(`Design saved: ${design.id}`);

    return {
      designId: design.id,
      url: `/designs/${design.id}`,
    };
  }

  /**
   * Load design with layers
   */
  async loadDesign(designId: string): Promise<DesignData> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      include: {
        layers: {
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    if (!design) {
      throw new NotFoundException(`Design not found: ${designId}`);
    }

    // Convert to DesignData format
    const designData: DesignData = {
      id: design.id,
      productId: design.productId,
      canvas: {
        width: design.canvasWidth || 800,
        height: design.canvasHeight || 600,
        backgroundColor: design.canvasBackgroundColor || '#ffffff',
      },
      layers: design.layers.map((layer) => ({
        id: layer.id,
        type: layer.type,
        position: { x: layer.x, y: layer.y },
        rotation: layer.rotation,
        scale: { x: layer.scaleX, y: layer.scaleY },
        opacity: layer.opacity,
        visible: layer.visible,
        locked: layer.locked,
        data: layer.data as unknown as import('@prisma/client').Prisma.InputJsonValue,
      })),
      metadata: {
        createdAt: design.createdAt.toISOString(),
        updatedAt: design.updatedAt.toISOString(),
        name: design.name || undefined,
        description: design.description || undefined,
      },
    };

    return designData;
  }
}

