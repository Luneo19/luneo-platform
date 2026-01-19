import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class AssetFileService {
  private readonly logger = new Logger(AssetFileService.name);

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

    const where: any = {
      organizationId,
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.folderId && { folderId: filters.folderId }),
      ...(filters.type && { type: filters.type }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { originalName: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.assetFile.findMany({
        where,
        select: {
          id: true,
          name: true,
          originalName: true,
          type: true,
          sizeBytes: true,
          cdnUrl: true,
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
        organizationId,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        storageKey: true,
        cdnUrl: true,
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
        model3D: {
          select: {
            id: true,
            format: true,
            processingStatus: true,
          },
        },
        texture: {
          select: {
            id: true,
            type: true,
            resolution: true,
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
        organizationId,
        projectId: dto.projectId,
        name: dto.name || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        storageKey,
        cdnUrl,
        type: dto.type,
        metadata: (dto.metadata || {}) as any,
        tags: dto.tags || [],
        folderId: dto.folderId,
        uploadedById,
      },
      select: {
        id: true,
        name: true,
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

    // TODO: Supprimer du storage (Cloudinary)
    // await this.storageService.deleteFile(file.storageKey);

    await this.prisma.assetFile.delete({
      where: { id },
    });

    this.logger.log(`Asset file deleted: ${id}`);

    return { success: true };
  }
}
