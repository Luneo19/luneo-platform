import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateTryOnConfigurationDto } from '../dto/create-try-on-configuration.dto';
import { UpdateTryOnConfigurationDto } from '../dto/update-try-on-configuration.dto';
import { AddProductMappingDto } from '../dto/add-product-mapping.dto';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class TryOnConfigurationService {
  private readonly logger = new Logger(TryOnConfigurationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Liste toutes les configurations d'un projet
   */
  @Cacheable({
    type: 'try-on-config',
    ttl: 3600,
    keyGenerator: (args) =>
      `try-on-configs:findAll:${args[0]}:${JSON.stringify(args[1])}`,
    tags: (args) => [`project:${args[0]}`, 'try-on-configs:list'],
  })
  async findAll(
    projectId: string,
    pagination: PaginationParams = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(pagination);

    const [data, total] = await Promise.all([
      this.prisma.tryOnConfiguration.findMany({
        where: { projectId },
        select: {
          id: true,
          name: true,
          productType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              sessions: true,
              mappings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.tryOnConfiguration.count({ where: { projectId } }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Récupère une configuration par son ID
   */
  @Cacheable({
    type: 'try-on-config',
    ttl: 7200,
    keyGenerator: (args) => `try-on-config:${args[0]}`,
    tags: () => ['try-on-configs:list'],
  })
  async findOne(id: string, projectId: string) {
    const config = await this.prisma.tryOnConfiguration.findFirst({
      where: {
        id,
        projectId,
      },
      select: {
        id: true,
        name: true,
        productType: true,
        settings: true,
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
        mappings: {
          select: {
            id: true,
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
            anchorPoints: true,
            scaleFactor: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            mappings: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException(
        `Try-on configuration with ID ${id} not found`,
      );
    }

    return config;
  }

  /**
   * Crée une nouvelle configuration
   */
  @CacheInvalidate({
    tags: (args) => [`project:${args[0]}`, 'try-on-configs:list'],
  })
  async create(projectId: string, dto: CreateTryOnConfigurationDto) {
    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const config = await this.prisma.tryOnConfiguration.create({
      data: {
        ...dto,
        projectId,
        settings: (dto.settings || {}) as Record<string, unknown>,
        uiConfig: (dto.uiConfig || {}) as Record<string, unknown>,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        productType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(
      `Try-on configuration created: ${config.id} for project ${projectId}`,
    );

    return config;
  }

  /**
   * Met à jour une configuration
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-config:${args[0]}`, 'try-on-configs:list'],
  })
  async update(
    id: string,
    projectId: string,
    dto: UpdateTryOnConfigurationDto,
  ) {
    await this.findOne(id, projectId);

    const config = await this.prisma.tryOnConfiguration.update({
      where: { id },
      data: dto as Record<string, unknown>,
      select: {
        id: true,
        name: true,
        productType: true,
        settings: true,
        uiConfig: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Try-on configuration updated: ${id}`);

    return config;
  }

  /**
   * Supprime une configuration
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-config:${args[0]}`, 'try-on-configs:list'],
  })
  async remove(id: string, projectId: string) {
    await this.findOne(id, projectId);

    await this.prisma.tryOnConfiguration.delete({
      where: { id },
    });

    this.logger.log(`Try-on configuration deleted: ${id}`);

    return {
      success: true,
      id,
      projectId,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Ajoute un produit à une configuration
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-config:${args[0]}`, 'try-on-configs:list'],
  })
  async addProduct(configId: string, projectId: string, dto: AddProductMappingDto) {
    // Vérifier que la configuration existe
    await this.findOne(configId, projectId);

    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // Vérifier qu'il n'existe pas déjà un mapping pour ce produit
    const existing = await this.prisma.tryOnProductMapping.findUnique({
      where: {
        configurationId_productId: {
          configurationId: configId,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Product ${dto.productId} is already mapped to this configuration`,
      );
    }

    const mapping = await this.prisma.tryOnProductMapping.create({
      data: {
        configurationId: configId,
        productId: dto.productId,
        modelId: dto.modelId,
        anchorPoints: (dto.anchorPoints || {}) as Record<string, unknown>,
        scaleFactor: dto.scaleFactor || 1.0,
        adjustments: (dto.adjustments || {}) as Record<string, unknown>,
      },
      select: {
        id: true,
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        anchorPoints: true,
        scaleFactor: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `Product ${dto.productId} added to try-on configuration ${configId}`,
    );

    return mapping;
  }

  /**
   * Retire un produit d'une configuration
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-config:${args[0]}`, 'try-on-configs:list'],
  })
  async removeProduct(
    configId: string,
    projectId: string,
    productId: string,
  ) {
    await this.findOne(configId, projectId);

    await this.prisma.tryOnProductMapping.deleteMany({
      where: {
        configurationId: configId,
        productId,
      },
    });

    this.logger.log(
      `Product ${productId} removed from try-on configuration ${configId}`,
    );

    return {
      success: true,
      configId,
      productId,
      removedAt: new Date().toISOString(),
    };
  }
}
