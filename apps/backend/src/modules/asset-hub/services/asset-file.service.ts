import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { UploadFileDto } from '../dto/upload-file.dto';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { PLAN_CONFIGS, normalizePlanTier } from '@/libs/plans/plan-config';

@Injectable()
export class AssetFileService {
  private readonly logger = new Logger(AssetFileService.name);

  /** Upload size limits per file type (in bytes) */
  private static readonly MAX_FILE_SIZES: Record<string, number> = {
    IMAGE: 10 * 1024 * 1024,      // 10 MB
    VIDEO: 100 * 1024 * 1024,     // 100 MB
    DOCUMENT: 25 * 1024 * 1024,   // 25 MB
    FONT: 5 * 1024 * 1024,        // 5 MB
    MODEL_3D: 50 * 1024 * 1024,   // 50 MB
    AUDIO: 20 * 1024 * 1024,      // 20 MB
    OTHER: 10 * 1024 * 1024,      // 10 MB (default)
  };

  private static readonly ABSOLUTE_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * Liste tous les fichiers d'une organisation
   */
  @Cacheable({
    type: 'asset-file',
    ttl: 300,
    keyGenerator: (args) =>
      `asset-files:findAll:${args[0]}:${JSON.stringify(args[1])}`,
    tags: (args) => [`organization:${args[0]}`, 'asset-files:list'],
  })
  async findAll(
    organizationId: string,
    filters: {
      projectId?: string;
      folderId?: string;
      type?: string;
      search?: string;
    } = {},
    pagination: PaginationParams = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(pagination);

    const where = {
      // Utiliser brandId comme organizationId pour compatibilité
      brandId: organizationId,
      ...(filters.folderId && { folderId: filters.folderId }),
      ...(filters.type && { type: filters.type }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { originalName: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    } as Prisma.AssetFileWhereInput;

    const [data, total] = await Promise.all([
      this.prisma.assetFile.findMany({
        where,
        select: {
          id: true,
          name: true,
          originalName: true,
          type: true,
          size: true,
          sizeBytes: true,
          url: true,
          cdnUrl: true,
          thumbnailUrl: true,
          thumbnails: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.assetFile.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Récupère un fichier par son ID
   */
  @Cacheable({
    type: 'asset-file',
    ttl: 3600,
    keyGenerator: (args) => `asset-file:${args[0]}`,
    tags: () => ['asset-files:list'],
  })
  async findOne(id: string, organizationId: string) {
    const file = await this.prisma.assetFile.findFirst({
      where: {
        id,
        brandId: organizationId, // Utiliser brandId pour compatibilité
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        mimeType: true,
        size: true,
        sizeBytes: true,
        storageKey: true,
        url: true,
        cdnUrl: true,
        thumbnailUrl: true,
        type: true,
        metadata: true,
        thumbnails: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException(`Asset file with ID ${id} not found`);
    }

    return file;
  }

  /**
   * Upload un fichier
   */
  @CacheInvalidate({
    tags: (args) => [`organization:${args[0]}`, 'asset-files:list'],
  })
  async upload(
    organizationId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    dto: UploadFileDto,
    uploadedById: string,
  ) {
    // Validate file size against type-specific limits
    const maxSize = AssetFileService.MAX_FILE_SIZES[dto.type] || AssetFileService.MAX_FILE_SIZES.OTHER;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds limit for type ${dto.type}. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }
    if (file.size > AssetFileService.ABSOLUTE_MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds absolute maximum of ${Math.round(AssetFileService.ABSOLUTE_MAX_FILE_SIZE / 1024 / 1024)}MB`,
      );
    }

    // ✅ Enforce plan storage quota before upload
    await this.enforceStorageQuota(organizationId, file.size);

    // Générer storage key unique
    const storageKey = `assets/${organizationId}/${Date.now()}-${file.originalname}`;

    // Upload vers Cloudinary
    const cdnUrl = await this.storageService.uploadFile(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    // Créer l'enregistrement
    const assetFile = await this.prisma.assetFile.create({
      data: {
        brandId: organizationId, // Utiliser brandId pour compatibilité
        name: dto.name || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        sizeBytes: file.size,
        storageKey,
        url: cdnUrl,
        cdnUrl,
        type: dto.type,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
        tags: dto.tags || [],
        folderId: dto.folderId,
      },
      select: {
        id: true,
        name: true,
        url: true,
        cdnUrl: true,
        type: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `File uploaded: ${assetFile.id} (${file.size} bytes) for organization ${organizationId}`,
    );

    return assetFile;
  }

  /**
   * Supprime un fichier
   */
  @CacheInvalidate({
    tags: (args) => [`asset-file:${args[0]}`, 'asset-files:list'],
  })
  async remove(id: string, organizationId: string) {
    const file = await this.findOne(id, organizationId);

    if (file?.storageKey) {
      await this.storageService.deleteFile(file.storageKey);
    }

    await this.prisma.assetFile.delete({
      where: { id },
    });

    this.logger.log(`Asset file deleted: ${id}`);

    return {
      success: true,
      id,
      url: file?.url ?? undefined,
      size: file?.sizeBytes ?? file?.size ?? undefined,
      type: file?.type ?? file?.mimeType ?? undefined,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Enforce storage quota before upload based on the brand's plan.
   * Calculates current usage from AssetFile aggregate and compares against plan limit.
   */
  private async enforceStorageQuota(brandId: string, newFileSizeBytes: number): Promise<void> {
    try {
      // Get brand's current plan
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { subscriptionPlan: true, plan: true },
      });

      if (!brand) return; // Skip if brand not found (shouldn't happen)

      const planKey = normalizePlanTier(brand.subscriptionPlan || brand.plan);
      const planConfig = PLAN_CONFIGS[planKey];
      if (!planConfig) return;

      const storageLimitGB = planConfig.limits.storageGB;
      // -1 means unlimited (Enterprise)
      if (storageLimitGB < 0) return;

      // Calculate current storage usage from AssetFile table (real data)
      const aggregate = await this.prisma.assetFile.aggregate({
        where: { brandId },
        _sum: { sizeBytes: true },
      });

      const currentUsageBytes = aggregate._sum.sizeBytes || 0;
      const storageLimitBytes = storageLimitGB * 1024 * 1024 * 1024;
      const projectedUsageBytes = currentUsageBytes + newFileSizeBytes;

      if (projectedUsageBytes > storageLimitBytes) {
        const currentUsageGB = (currentUsageBytes / (1024 * 1024 * 1024)).toFixed(2);
        const newFileSizeMB = (newFileSizeBytes / (1024 * 1024)).toFixed(1);
        this.logger.warn(
          `Storage quota exceeded for brand ${brandId}: ${currentUsageGB}GB / ${storageLimitGB}GB + ${newFileSizeMB}MB`,
        );
        throw new ForbiddenException(
          `Storage quota exceeded. Current usage: ${currentUsageGB}GB / ${storageLimitGB}GB. Please upgrade your plan.`,
        );
      }
    } catch (error) {
      // Re-throw ForbiddenException (quota exceeded)
      if (error instanceof ForbiddenException) throw error;
      // Log other errors but don't block upload (graceful degradation)
      this.logger.warn('Failed to check storage quota', {
        error: error instanceof Error ? error.message : 'Unknown error',
        brandId,
      });
    }
  }
}
