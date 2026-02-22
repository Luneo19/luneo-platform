import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { Prisma } from '@prisma/client';

const MAX_MODEL_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_EXTENSIONS = ['.glb', '.gltf', '.usdz'];
const ALLOWED_MIMETYPES = [
  'model/gltf-binary',
  'model/gltf+json',
  'application/octet-stream',
  'model/vnd.usdz+zip',
];

interface UploadModelOptions {
  configurationId: string;
  productId: string;
  format: 'glb' | 'gltf' | 'usdz';
  defaultPosition?: { x: number; y: number; z: number };
  defaultRotation?: { x: number; y: number; z: number };
  enableOcclusion?: boolean;
  enableShadows?: boolean;
}

@Injectable()
export class ModelManagementService {
  private readonly logger = new Logger(ModelManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload and validate a 3D model for a try-on product mapping.
   */
  async uploadModel(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    options: UploadModelOptions,
  ) {
    // Validate file size
    if (file.buffer.length > MAX_MODEL_SIZE_BYTES) {
      throw new BadRequestException(
        `Model file exceeds maximum size of ${MAX_MODEL_SIZE_BYTES / (1024 * 1024)}MB`,
      );
    }

    // Validate file extension
    const ext = this.getFileExtension(file.originalname);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    // Validate mimetype
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      this.logger.warn(
        `Unexpected mimetype "${file.mimetype}" for model upload, proceeding with extension check`,
      );
    }

    // Validate the mapping exists
    const mapping = await this.prisma.tryOnProductMapping.findUnique({
      where: {
        configurationId_productId: {
          configurationId: options.configurationId,
          productId: options.productId,
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `Product mapping not found for configuration ${options.configurationId} and product ${options.productId}`,
      );
    }

    // Upload to storage
    const timestamp = Date.now();
    const storagePath = `try-on/models/${options.configurationId}/${options.productId}/${timestamp}${ext}`;

    const modelUrl = await this.storageService.uploadFile(
      storagePath,
      file.buffer,
      file.mimetype,
    );

    this.logger.log(`3D model uploaded: ${storagePath} (${file.buffer.length} bytes)`);

    // Determine which URL field to update
    const isUSDZ = ext === '.usdz' || options.format === 'usdz';

    const updateData: Prisma.TryOnProductMappingUpdateInput = {
      ...(isUSDZ ? { modelUSDZUrl: modelUrl } : { model3dUrl: modelUrl }),
      ...(options.defaultPosition !== undefined && {
        defaultPosition: options.defaultPosition as unknown as Prisma.InputJsonValue,
      }),
      ...(options.defaultRotation !== undefined && {
        defaultRotation: options.defaultRotation as unknown as Prisma.InputJsonValue,
      }),
      ...(options.enableOcclusion !== undefined && {
        enableOcclusion: options.enableOcclusion,
      }),
      ...(options.enableShadows !== undefined && {
        enableShadows: options.enableShadows,
      }),
    };

    const updated = await this.prisma.tryOnProductMapping.update({
      where: { id: mapping.id },
      data: updateData,
      select: {
        id: true,
        model3dUrl: true,
        modelUSDZUrl: true,
        thumbnailUrl: true,
        defaultPosition: true,
        defaultRotation: true,
        enableOcclusion: true,
        enableShadows: true,
        scaleFactor: true,
        product: {
          select: { id: true, name: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a 3D model from a product mapping.
   */
  async deleteModel(
    configurationId: string,
    productId: string,
    format: 'glb' | 'usdz' | 'all' = 'all',
  ) {
    const mapping = await this.prisma.tryOnProductMapping.findUnique({
      where: {
        configurationId_productId: {
          configurationId,
          productId,
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException('Product mapping not found');
    }

    const updateData: Prisma.TryOnProductMappingUpdateInput = {};
    if (format === 'glb' || format === 'all') {
      updateData.model3dUrl = null;
      updateData.lodLevels = Prisma.DbNull;
    }
    if (format === 'usdz' || format === 'all') {
      updateData.modelUSDZUrl = null;
    }
    if (format === 'all') {
      updateData.thumbnailUrl = null;
    }

    await this.prisma.tryOnProductMapping.update({
      where: { id: mapping.id },
      data: updateData,
    });

    this.logger.log(
      `3D model(s) deleted for mapping ${mapping.id} (format: ${format})`,
    );

    return { success: true, deletedFormat: format };
  }

  /**
   * Get model info for a product in a try-on configuration.
   * Falls back to product catalog images if no dedicated model exists.
   */
  async getModelInfo(configurationId: string, productId: string) {
    const mapping = await this.prisma.tryOnProductMapping.findUnique({
      where: {
        configurationId_productId: {
          configurationId,
          productId,
        },
      },
      select: {
        id: true,
        model3dUrl: true,
        modelUSDZUrl: true,
        thumbnailUrl: true,
        defaultPosition: true,
        defaultRotation: true,
        lodLevels: true,
        enableOcclusion: true,
        enableShadows: true,
        scaleFactor: true,
        anchorPoints: true,
        adjustments: true,
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException('Product mapping not found');
    }

    // Determine the effective model source
    const hasModel3d = !!mapping.model3dUrl;
    const hasUSDZ = !!mapping.modelUSDZUrl;
    const productImages = mapping.product.images as string[] | null;
    const fallbackImage =
      Array.isArray(productImages) && productImages.length > 0
        ? productImages[0]
        : null;

    return {
      ...mapping,
      hasModel3d,
      hasUSDZ,
      fallbackImage,
      modelSource: hasModel3d ? 'dedicated' : fallbackImage ? 'catalog' : 'none',
    };
  }

  /**
   * Update LOD levels for a product mapping.
   */
  async updateLodLevels(
    mappingId: string,
    lodLevels: { high?: string; medium?: string; low?: string },
  ) {
    return this.prisma.tryOnProductMapping.update({
      where: { id: mappingId },
      data: {
        lodLevels: lodLevels as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        lodLevels: true,
      },
    });
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot).toLowerCase();
  }
}
