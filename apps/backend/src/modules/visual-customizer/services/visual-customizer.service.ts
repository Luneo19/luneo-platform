import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateVisualCustomizerDto } from '../dto/create-visual-customizer.dto';
import { UpdateVisualCustomizerDto } from '../dto/update-visual-customizer.dto';
import { AddLayerDto } from '../dto/add-layer.dto';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class VisualCustomizerService {
  private readonly logger = new Logger(VisualCustomizerService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Liste tous les customizers d'un projet
   */
  @Cacheable({
    type: 'visual-customizer',
    ttl: 3600,
    keyGenerator: (args) =>
      `visual-customizer:findAll:${args[0]}:${JSON.stringify(args[1])}`,
    tags: (args) => [`project:${args[0]}`, 'visual-customizer:list'],
  })
  async findAll(
    projectId: string,
    pagination: PaginationParams = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.visualCustomizer.findMany({
        where: { projectId },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              layers: true,
              presets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.visualCustomizer.count({ where: { projectId } }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Récupère un customizer par son ID
   */
  @Cacheable({
    type: 'visual-customizer',
    ttl: 7200,
    keyGenerator: (args) => `visual-customizer:${args[0]}`,
    tags: () => ['visual-customizer:list'],
  })
  async findOne(id: string, projectId: string) {
    const customizer = await this.prisma.visualCustomizer.findFirst({
      where: {
        id,
        projectId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        canvasConfig: true,
        uiConfig: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        layers: {
          select: {
            id: true,
            name: true,
            type: true,
            order: true,
            isLocked: true,
            isVisible: true,
          },
          orderBy: { order: 'asc' },
        },
        presets: {
          select: {
            id: true,
            name: true,
            previewImageUrl: true,
            isDefault: true,
          },
        },
        _count: {
          select: {
            layers: true,
            presets: true,
          },
        },
      },
    });

    if (!customizer) {
      throw new NotFoundException(
        `Visual customizer with ID ${id} not found`,
      );
    }

    return customizer;
  }

  /**
   * Crée un nouveau customizer
   */
  @CacheInvalidate({
    tags: (args) => [`project:${args[0]}`, 'visual-customizer:list'],
  })
  async create(projectId: string, dto: CreateVisualCustomizerDto) {
    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const customizer = await this.prisma.visualCustomizer.create({
      data: {
        ...dto,
        projectId,
        canvasConfig: (dto.canvasConfig || {}) as Record<string, unknown>,
        uiConfig: (dto.uiConfig || {}) as Record<string, unknown>,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(
      `Visual customizer created: ${customizer.id} for project ${projectId}`,
    );

    return customizer;
  }

  /**
   * Met à jour un customizer
   */
  @CacheInvalidate({
    tags: (args) => [`visual-customizer:${args[0]}`, 'visual-customizer:list'],
  })
  async update(
    id: string,
    projectId: string,
    dto: UpdateVisualCustomizerDto,
  ) {
    await this.findOne(id, projectId);

    const customizer = await this.prisma.visualCustomizer.update({
      where: { id },
      data: dto as Record<string, unknown>,
      select: {
        id: true,
        name: true,
        description: true,
        canvasConfig: true,
        uiConfig: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Visual customizer updated: ${id}`);

    return customizer;
  }

  /**
   * Supprime un customizer
   */
  @CacheInvalidate({
    tags: (args) => [`visual-customizer:${args[0]}`, 'visual-customizer:list'],
  })
  async remove(id: string, projectId: string) {
    await this.findOne(id, projectId);

    await this.prisma.visualCustomizer.delete({
      where: { id },
    });

    this.logger.log(`Visual customizer deleted: ${id}`);

    return {
      success: true,
      id,
      projectId,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Ajoute une couche à un customizer
   */
  @CacheInvalidate({
    tags: (args) => [`visual-customizer:${args[0]}`, 'visual-customizer:list'],
  })
  async addLayer(customizerId: string, projectId: string, dto: AddLayerDto) {
    // Vérifier que le customizer existe
    await this.findOne(customizerId, projectId);

    const layer = await this.prisma.visualCustomizerLayer.create({
      data: {
        ...dto,
        customizerId,
        config: (dto.config || {}) as Record<string, unknown>,
        order: dto.order || 0,
        isLocked: dto.isLocked ?? false,
        isVisible: dto.isVisible ?? true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        order: true,
        isLocked: true,
        isVisible: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `Layer ${dto.name} added to visual customizer ${customizerId}`,
    );

    return layer;
  }

  /**
   * Retire une couche d'un customizer
   */
  @CacheInvalidate({
    tags: (args) => [`visual-customizer:${args[0]}`, 'visual-customizer:list'],
  })
  async removeLayer(
    customizerId: string,
    projectId: string,
    layerId: string,
  ) {
    await this.findOne(customizerId, projectId);

    await this.prisma.visualCustomizerLayer.delete({
      where: { id: layerId },
    });

    this.logger.log(
      `Layer ${layerId} removed from visual customizer ${customizerId}`,
    );

    return {
      success: true,
      customizerId,
      layerId,
      removedAt: new Date().toISOString(),
    };
  }
}
