import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
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
    constraints: any;
    isRequired: boolean;
  }>;
  options: {
    colors?: any[];
    sizes?: any[];
    materials?: any[];
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
    data: any;
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
      description: area.description,
      position: { x: area.x, y: area.y },
      size: { width: area.width, height: area.height },
      constraints: {
        minWidth: area.minWidth,
        maxWidth: area.maxWidth,
        minHeight: area.minHeight,
        maxHeight: area.maxHeight,
        aspectRatio: area.aspectRatio,
        allowedLayerTypes: area.allowedLayerTypes as any[],
        maxTextLength: area.maxTextLength,
        allowedFonts: area.allowedFonts,
        defaultFont: area.defaultFont,
        allowedFontSizes: area.allowedFontSizes,
        maxImageSize: area.maxImageSize,
        allowedFormats: area.allowedFormats,
        minImageWidth: area.minImageWidth,
        minImageHeight: area.minImageHeight,
        maxImageWidth: area.maxImageWidth,
        maxImageHeight: area.maxImageHeight,
        allowedShapes: area.allowedShapes,
        allowedColors: area.allowedColors,
        defaultColor: area.defaultColor,
      },
      isRequired: area.isRequired,
    }));

    return {
      productId: product.id,
      productName: product.name,
      customizableAreas: areas,
      options: {
        colors: product.customizationOptions as any,
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
        designData: designData as any,
        productId,
        userId: userId || null,
        brandId: 'default', // TODO: Get from context
      },
      update: {
        canvasWidth: designData.canvas.width,
        canvasHeight: designData.canvas.height,
        canvasBackgroundColor: designData.canvas.backgroundColor,
        designData: designData as any,
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
        data: layer.data as any,
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
        type: layer.type as any,
        position: { x: layer.x, y: layer.y },
        rotation: layer.rotation,
        scale: { x: layer.scaleX, y: layer.scaleY },
        opacity: layer.opacity,
        visible: layer.visible,
        locked: layer.locked,
        data: layer.data as any,
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

