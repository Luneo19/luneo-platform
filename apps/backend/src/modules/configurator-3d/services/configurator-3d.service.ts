import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateConfigurator3DConfigurationDto } from '../dto/create-configurator-3d.dto';
import { UpdateConfigurator3DConfigurationDto } from '../dto/update-configurator-3d.dto';
import { AddOptionDto } from '../dto/add-option.dto';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class Configurator3DService {
  private readonly logger = new Logger(Configurator3DService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Liste toutes les configurations d'un projet
   */
  @Cacheable({
    type: 'configurator-3d',
    ttl: 3600,
    keyGenerator: (args) =>
      `configurator-3d:findAll:${args[0]}:${JSON.stringify(args[1])}`,
    tags: (args) => [`project:${args[0]}`, 'configurator-3d:list'],
  })
  async findAll(
    projectId: string,
    pagination: PaginationParams = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.configurator3DConfiguration.findMany({
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
              options: true,
              components: true,
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.configurator3DConfiguration.count({ where: { projectId } }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Récupère une configuration par son ID
   */
  @Cacheable({
    type: 'configurator-3d',
    ttl: 7200,
    keyGenerator: (args) => `configurator-3d:${args[0]}`,
    tags: () => ['configurator-3d:list'],
  })
  async findOne(id: string, projectId: string) {
    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: {
        id,
        projectId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        model3dId: true,
        sceneConfig: true,
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
        options: {
          select: {
            id: true,
            name: true,
            type: true,
            label: true,
            order: true,
            isRequired: true,
          },
          orderBy: { order: 'asc' },
        },
        components: {
          select: {
            id: true,
            name: true,
            meshName: true,
            isVisible: true,
            isOptional: true,
          },
        },
        _count: {
          select: {
            options: true,
            components: true,
            sessions: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException(
        `Configurator 3D configuration with ID ${id} not found`,
      );
    }

    return config;
  }

  /**
   * Crée une nouvelle configuration
   */
  @CacheInvalidate({
    tags: (args) => [`project:${args[0]}`, 'configurator-3d:list'],
  })
  async create(projectId: string, dto: CreateConfigurator3DConfigurationDto) {
    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const config = await this.prisma.configurator3DConfiguration.create({
      data: {
        ...dto,
        projectId,
        sceneConfig: (dto.sceneConfig || {}) as any,
        uiConfig: (dto.uiConfig || {}) as any,
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
      `Configurator 3D configuration created: ${config.id} for project ${projectId}`,
    );

    return config;
  }

  /**
   * Met à jour une configuration
   */
  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async update(
    id: string,
    projectId: string,
    dto: UpdateConfigurator3DConfigurationDto,
  ) {
    await this.findOne(id, projectId);

    const config = await this.prisma.configurator3DConfiguration.update({
      where: { id },
      data: dto as any,
      select: {
        id: true,
        name: true,
        description: true,
        sceneConfig: true,
        uiConfig: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Configurator 3D configuration updated: ${id}`);

    return config;
  }

  /**
   * Supprime une configuration
   */
  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async remove(id: string, projectId: string) {
    await this.findOne(id, projectId);

    await this.prisma.configurator3DConfiguration.delete({
      where: { id },
    });

    this.logger.log(`Configurator 3D configuration deleted: ${id}`);

    return { success: true };
  }

  /**
   * Ajoute une option à une configuration
   */
  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async addOption(configId: string, projectId: string, dto: AddOptionDto) {
    // Vérifier que la configuration existe
    await this.findOne(configId, projectId);

    const option = await this.prisma.configurator3DOption.create({
      data: {
        ...dto,
        configurationId: configId,
        defaultValue: (dto.defaultValue || {}) as any,
        values: (dto.values || {}) as any,
        constraints: (dto.constraints || {}) as any,
        order: dto.order || 0,
        isRequired: dto.isRequired ?? false,
      },
      select: {
        id: true,
        name: true,
        type: true,
        label: true,
        order: true,
        isRequired: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `Option ${dto.name} added to configurator 3D configuration ${configId}`,
    );

    return option;
  }

  /**
   * Retire une option d'une configuration
   */
  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async removeOption(
    configId: string,
    projectId: string,
    optionId: string,
  ) {
    await this.findOne(configId, projectId);

    await this.prisma.configurator3DOption.delete({
      where: { id: optionId },
    });

    this.logger.log(
      `Option ${optionId} removed from configurator 3D configuration ${configId}`,
    );

    return { success: true };
  }
}
