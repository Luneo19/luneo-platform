import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class AssetFolderService {
  private readonly logger = new Logger(AssetFolderService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Liste tous les dossiers d'une organisation
   */
  @Cacheable({
    type: 'asset-folder',
    ttl: 600,
    keyGenerator: (args) => `asset-folders:findAll:${args[0]}`,
    tags: (args) => [`organization:${args[0]}`, 'asset-folders:list'],
  })
  async findAll(organizationId: string, parentId?: string) {
    return this.prisma.assetFolder.findMany({
      where: {
        organizationId,
        parentId: parentId || null,
      },
      select: {
        id: true,
        name: true,
        path: true,
        createdAt: true,
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Récupère un dossier par son ID
   */
  @Cacheable({
    type: 'asset-folder',
    ttl: 3600,
    keyGenerator: (args) => `asset-folder:${args[0]}`,
    tags: () => ['asset-folders:list'],
  })
  async findOne(id: string, organizationId: string) {
    const folder = await this.prisma.assetFolder.findFirst({
      where: {
        id,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        path: true,
        createdAt: true,
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                files: true,
              },
            },
          },
        },
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException(`Asset folder with ID ${id} not found`);
    }

    return folder;
  }

  /**
   * Crée un nouveau dossier
   */
  @CacheInvalidate({
    tags: (args) => [`organization:${args[0]}`, 'asset-folders:list'],
  })
  async create(organizationId: string, dto: CreateFolderDto) {
    // Vérifier le dossier parent si fourni
    if (dto.parentId) {
      await this.findOne(dto.parentId, organizationId);
    }

    // Générer le path hiérarchique
    let path = dto.name;
    if (dto.parentId) {
      const parent = await this.prisma.assetFolder.findUnique({
        where: { id: dto.parentId },
        select: { path: true },
      });
      if (parent?.path) {
        path = `${parent.path}/${dto.name}`;
      }
    }

    const folder = await this.prisma.assetFolder.create({
      data: {
        organizationId,
        name: dto.name,
        parentId: dto.parentId,
        path,
      },
      select: {
        id: true,
        name: true,
        path: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `Asset folder created: ${folder.id} for organization ${organizationId}`,
    );

    return folder;
  }

  /**
   * Supprime un dossier
   */
  @CacheInvalidate({
    tags: (args) => [`asset-folder:${args[0]}`, 'asset-folders:list'],
  })
  async remove(id: string, organizationId: string) {
    const folder = await this.findOne(id, organizationId);

    // Vérifier qu'il n'y a pas de fichiers ou sous-dossiers
    const hasContent =
      folder._count.files > 0 || folder._count.children > 0;

    if (hasContent) {
      throw new Error(
        'Cannot delete folder: it contains files or subfolders',
      );
    }

    await this.prisma.assetFolder.delete({
      where: { id },
    });

    this.logger.log(`Asset folder deleted: ${id}`);

    return { success: true };
  }
}
