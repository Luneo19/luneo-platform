import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { S3Service } from '@/libs/s3/s3.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import {
  RenderRequest,
  RenderResult,
  RenderDesignData,
  RenderValidationResult,
  RenderOptions,
} from '../interfaces/render.interface';
import { mapDesignRecord } from '../utils/render-data.mapper';

@Injectable()
export class Render3DService {
  private readonly logger = new Logger(Render3DService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Rend un design 3D
   */
  async render3D(request: RenderRequest): Promise<RenderResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting 3D render for request ${request.id}`);

      const validation = this.validateRenderRequest(request);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        this.logger.warn(
          `3D render ${request.id} warnings: ${validation.warnings.join(', ')}`,
        );
      }

      const designData = await this.getDesignData(request.productId, request.designId);

      const sceneBuffer = this.generateSceneBuffer(request, designData);
      const renderUpload = await this.uploadScene(sceneBuffer, request);
      const thumbnailUrl = this.resolveThumbnail(designData);

      // Simulation de rendu 3D
      // En production, utiliser Three.js côté serveur ou Blender headless
      
      const renderTime = Date.now() - startTime;
      
      const result: RenderResult = {
        id: request.id,
        status: 'success',
        url: renderUpload.url,
        thumbnailUrl,
        metadata: {
          width: request.options.width,
          height: request.options.height,
          format: request.options.exportFormat || 'gltf',
          size: renderUpload.size,
          renderTime,
          quality: request.options.quality || 'standard',
        },
        createdAt: new Date(),
        completedAt: new Date(),
      };

      await this.cache.setSimple(`render_result_3d:${request.id}`, result, 3600);

      this.logger.log(`3D render completed for request ${request.id} in ${renderTime}ms`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`3D render failed for request ${request.id}: ${errorMessage}`);
      
      return {
        id: request.id,
        status: 'failed',
        error: errorMessage,
        createdAt: new Date(),
      };
    }
  }

  private validateRenderRequest(request: RenderRequest): RenderValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const { options } = request;

    if (options.width <= 0 || options.height <= 0) {
      errors.push('Dimensions must be positive');
    }

    const allowedFormats: RenderOptions['exportFormat'][] = ['gltf', 'glb', 'usdz', 'obj', 'fbx'];
    if (options.exportFormat && !allowedFormats.includes(options.exportFormat)) {
      errors.push(`Unsupported export format: ${options.exportFormat}`);
    }

    if (options.camera) {
      const { position, target } = options.camera;
      if (!this.isVector3(position) || !this.isVector3(target)) {
        errors.push('Camera position and target must be valid 3D vectors');
      }
    }

    if (options.lighting && options.lighting.directional) {
      const invalidDirectional = options.lighting.directional.some(
        (light) => !this.isVector3(light.position),
      );
      if (invalidDirectional) {
        errors.push('Directional lights must include valid position vectors');
      }
    }

    if (options.materials) {
      const invalidMaterials = options.materials.filter((material) => !material.name || !material.type);
      if (invalidMaterials.length > 0) {
        warnings.push(`${invalidMaterials.length} materials are missing name or type`);
        suggestions.push('Provide material name and type for all entries');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  private isVector3(value: unknown): value is { x: number; y: number; z: number } {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const vector = value as Record<string, unknown>;
    return [vector.x, vector.y, vector.z].every((component) => typeof component === 'number');
  }

  private async getDesignData(productId: string, designId?: string): Promise<RenderDesignData> {
    if (designId) {
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
        select: {
          optionsJson: true,
          assets: {
            select: {
              id: true,
              url: true,
              type: true,
              format: true,
              size: true,
              width: true,
              height: true,
              metadata: true,
            },
          },
        },
      });

      if (!design) {
        throw new Error(`Design ${designId} not found`);
      }

      const mapped = mapDesignRecord(design);
      const modelAsset = mapped.assets?.find((asset) => asset.type === 'model');

      return {
        ...mapped,
        baseAsset: modelAsset?.url,
      };
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        model3dUrl: true,
        baseAssetUrl: true,
        images: true,
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return {
      baseAsset: product.model3dUrl ?? product.baseAssetUrl ?? undefined,
      images: product.images ?? undefined,
    };
  }

  private generateSceneBuffer(request: RenderRequest, designData: RenderDesignData): Buffer {
    const scenePayload = {
      version: 1,
      request: {
        id: request.id,
        productId: request.productId,
        designId: request.designId,
        options: request.options,
      },
      design: designData,
      generatedAt: new Date().toISOString(),
    };

    return Buffer.from(JSON.stringify(scenePayload, null, 2), 'utf-8');
  }

  private async uploadScene(
    sceneBuffer: Buffer,
    request: RenderRequest,
  ): Promise<{ url: string; size: number }> {
    const format = request.options.exportFormat || 'gltf';
    const filename = `renders/3d/${request.id}.${format}.json`;

    const url = await this.s3Service.uploadBuffer(sceneBuffer, filename, {
      contentType: 'application/json',
      metadata: {
        renderId: request.id,
        type: '3d-render',
        format,
      },
    });

    return {
      url,
      size: sceneBuffer.length,
    };
  }

  private resolveThumbnail(designData: RenderDesignData): string | undefined {
    const assetThumbnail = designData.assets?.find((asset) => asset.type === 'image');
    if (assetThumbnail) {
      return assetThumbnail.url;
    }

    if (designData.images?.length) {
      return designData.images[0];
    }

    if (designData.baseAsset && isImageUrl(designData.baseAsset)) {
      return designData.baseAsset;
    }

    return undefined;
  }
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(url);
}


