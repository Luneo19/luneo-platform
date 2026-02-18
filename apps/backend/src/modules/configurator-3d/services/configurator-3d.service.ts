import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ConfiguratorStatus,
  ConfiguratorType,
} from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { Configurator3DValidationService } from './configurator-3d-validation.service';
import { Configurator3DCacheService } from './configurator-3d-cache.service';
import type { CurrentUser } from '@/common/types/user.types';
import { randomBytes } from 'crypto';

export interface FindAllConfigParams extends PaginationParams {
  search?: string;
  status?: ConfiguratorStatus;
  type?: ConfiguratorType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateConfigDto {
  name: string;
  description?: string;
  type?: ConfiguratorType;
  modelUrl?: string;
  sceneConfig?: Record<string, unknown>;
  uiConfig?: Record<string, unknown>;
  pricingSettings?: Record<string, unknown>;
  projectId?: string;
  productId?: string;
  [key: string]: unknown;
}

export interface UpdateConfigDto extends Partial<CreateConfigDto> {}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EmbedCodeResult {
  iframe: string;
  script: string;
  directUrl: string;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);
  const suffix = randomBytes(6).toString('hex');
  return base ? `${base}-${suffix}` : suffix;
}

@Injectable()
export class Configurator3DService {
  private readonly logger = new Logger(Configurator3DService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: Configurator3DValidationService,
    private readonly cacheService: Configurator3DCacheService,
  ) {}

  @Cacheable({
    type: 'configurator-3d',
    ttl: 3600,
    keyGenerator: (args) =>
      `configurator-3d:findAll:${args[0]}:${JSON.stringify(args[1])}`,
    tags: (args) => [`brand:${args[0]}`, 'configurator-3d:list'],
  })
  async findAll(
    brandId: string,
    params: FindAllConfigParams = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(params, {
      maxLimit: 100,
    });

    const where: Prisma.Configurator3DConfigurationWhereInput = {
      brandId,
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.type) {
      where.type = params.type;
    }

    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    const orderBy = { [sortField]: sortOrder } as Prisma.Configurator3DConfigurationOrderByWithRelationInput;

    const [data, total] = await Promise.all([
      this.prisma.configurator3DConfiguration.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          type: true,
          status: true,
          modelUrl: true,
          thumbnailUrl: true,
          isActive: true,
          isPublic: true,
          viewCount: true,
          sessionCount: true,
          conversionCount: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          _count: {
            select: {
              components: true,
              options: true,
              sessions: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.configurator3DConfiguration.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  @Cacheable({
    type: 'configurator-3d',
    ttl: 7200,
    keyGenerator: (args) =>
      `configurator-3d:findOne:${args[0]}:${args[1]}:${args[2]}`,
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async findOne(
    id: string,
    brandId: string,
    options?: { includeAnalytics?: boolean },
  ) {
    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: {
        id,
        brandId,
        deletedAt: null,
      },
      include: {
        components: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
          },
        },
        options: { orderBy: { sortOrder: 'asc' } },
        rules: { orderBy: { priority: 'desc' } },
        ...(options?.includeAnalytics && {
          analytics: {
            take: 30,
            orderBy: { date: 'desc' },
          },
        }),
      },
    });

    if (!config) {
      throw new NotFoundException(
        `Configurator 3D configuration with ID ${id} not found`,
      );
    }

    return config;
  }

  @Cacheable({
    type: 'configurator-3d',
    ttl: 3600,
    keyGenerator: (args) => `configurator-3d:findOnePublic:${args[0]}`,
    tags: (args) => [`configurator-3d:${args[0]}`],
  })
  async findOnePublic(slugOrId: string) {
    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
        isPublic: true,
        status: ConfiguratorStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        brand: {
          select: { id: true, name: true, logo: true, website: true },
        },
        components: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              where: { isEnabled: true, isVisible: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        rules: {
          where: { isEnabled: true },
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!config) {
      throw new NotFoundException(
        `Public configurator with slug/ID ${slugOrId} not found`,
      );
    }

    return config;
  }

  @CacheInvalidate({
    tags: (args) => [`brand:${args[0]}`, 'configurator-3d:list'],
  })
  async create(brandId: string, dto: CreateConfigDto, user?: CurrentUser) {
    const slug = generateSlug(dto.name);

    const config = await this.prisma.configurator3DConfiguration.create({
      data: {
        brandId,
        name: dto.name,
        description: dto.description,
        slug,
        type: (dto.type as ConfiguratorType) ?? ConfiguratorType.CUSTOM,
        status: ConfiguratorStatus.DRAFT,
        modelUrl: dto.modelUrl,
        sceneConfig: (dto.sceneConfig || {}) as Prisma.InputJsonValue,
        uiConfig: (dto.uiConfig || {}) as Prisma.InputJsonValue,
        pricingSettings: (dto.pricingSettings || {}) as Prisma.InputJsonValue,
        projectId: dto.projectId,
        productId: dto.productId,
        createdById: user?.id,
        tags: [],
      },
    });

    this.logger.log(
      `Configurator 3D configuration created: ${config.id} for brand ${brandId}`,
    );

    return config;
  }

  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async update(id: string, brandId: string, dto: UpdateConfigDto) {
    await this.findOne(id, brandId);

    const updateData: Prisma.Configurator3DConfigurationUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type as ConfiguratorType;
    if (dto.modelUrl !== undefined) updateData.modelUrl = dto.modelUrl;
    if (dto.sceneConfig !== undefined)
      updateData.sceneConfig = dto.sceneConfig as Prisma.InputJsonValue;
    if (dto.uiConfig !== undefined)
      updateData.uiConfig = dto.uiConfig as Prisma.InputJsonValue;
    if (dto.pricingSettings !== undefined)
      updateData.pricingSettings =
        dto.pricingSettings as Prisma.InputJsonValue;

    const config = await this.prisma.configurator3DConfiguration.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Configurator 3D configuration updated: ${id}`);
    return config;
  }

  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async patch(id: string, brandId: string, dto: Partial<UpdateConfigDto>) {
    return this.update(id, brandId, dto);
  }

  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list', `brand:${args[1]}`],
  })
  async delete(id: string, brandId: string) {
    await this.findOne(id, brandId);

    await this.prisma.configurator3DConfiguration.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.cacheService.invalidateConfiguration(id);

    this.logger.log(`Configurator 3D configuration soft-deleted: ${id}`);

    return {
      success: true,
      id,
      deletedAt: new Date().toISOString(),
    };
  }

  @CacheInvalidate({
    tags: (args) => [`brand:${args[0]}`, 'configurator-3d:list'],
  })
  async clone(id: string, brandId: string, newName: string) {
    const source = await this.findOne(id, brandId);

    const slug = generateSlug(newName);

    const cloned = await this.prisma.$transaction(async (tx) => {
      const config = await tx.configurator3DConfiguration.create({
        data: {
          brandId,
          name: newName,
          description: source.description,
          slug,
          type: source.type,
          status: ConfiguratorStatus.DRAFT,
          modelUrl: source.modelUrl,
          modelFormat: source.modelFormat,
        sceneConfig: source.sceneConfig as Prisma.InputJsonValue,
        uiConfig: source.uiConfig as Prisma.InputJsonValue,
        pricingSettings: source.pricingSettings as Prisma.InputJsonValue,
        settings: source.settings as Prisma.InputJsonValue,
        tags: source.tags,
        },
      });

      const componentIdMap = new Map<string, string>();

      for (const comp of source.components || []) {
        const newComp = await tx.configurator3DComponent.create({
          data: {
            configurationId: config.id,
            name: comp.name,
            technicalId: comp.technicalId,
            description: comp.description,
            type: comp.type,
            meshName: comp.meshName,
            selectionMode: comp.selectionMode,
            isRequired: comp.isRequired,
            minSelections: comp.minSelections,
            maxSelections: comp.maxSelections,
            sortOrder: comp.sortOrder,
            isVisible: comp.isVisible,
            isOptional: comp.isOptional,
            isEnabled: comp.isEnabled,
            settings: comp.settings as Prisma.InputJsonValue,
            bounds: comp.bounds as Prisma.InputJsonValue,
          },
        });
        componentIdMap.set(comp.id, newComp.id);
      }

      for (const opt of source.options || []) {
        const newComponentId = opt.componentId
          ? componentIdMap.get(opt.componentId)
          : null;
        await tx.configurator3DOption.create({
          data: {
            configurationId: config.id,
            componentId: newComponentId,
            name: opt.name,
            label: opt.label,
            sku: opt.sku,
            type: opt.type,
            value: opt.value,
            values: opt.values as Prisma.InputJsonValue,
            defaultValue: opt.defaultValue,
            sortOrder: opt.sortOrder,
            order: opt.order,
            isDefault: opt.isDefault,
            isRequired: opt.isRequired,
            isEnabled: opt.isEnabled,
            isVisible: opt.isVisible,
            priceDelta: opt.priceDelta,
            pricingType: opt.pricingType,
            priceModifier: opt.priceModifier,
            priceFormula: opt.priceFormula,
            currency: opt.currency,
          },
        });
      }

      for (const rule of source.rules || []) {
        await tx.configurator3DRule.create({
          data: {
            configurationId: config.id,
            name: rule.name,
            description: rule.description,
            type: rule.type,
            conditions: rule.conditions as Prisma.InputJsonValue,
            actions: rule.actions as Prisma.InputJsonValue,
            priority: rule.priority,
            isEnabled: rule.isEnabled,
            stopProcessing: rule.stopProcessing,
          },
        });
      }

      return config;
    });

    this.logger.log(
      `Configurator 3D configuration cloned: ${id} -> ${cloned.id}`,
    );

    return this.findOne(cloned.id, brandId);
  }

  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async publish(id: string, brandId: string): Promise<ValidationResult> {
    const validation = await this.validationService.validateForPublish(id);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Configuration validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    await this.prisma.configurator3DConfiguration.update({
      where: { id, brandId },
      data: {
        status: ConfiguratorStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedVersion: await this.prisma.configurator3DConfiguration
          .findUnique({ where: { id }, select: { version: true } })
          .then((r) => r?.version ?? 1),
      },
    });

    await this.cacheService.warmupConfiguration(id);

    this.logger.log(`Configurator 3D configuration published: ${id}`);

    return validation;
  }

  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async unpublish(id: string, brandId: string) {
    await this.findOne(id, brandId);

    await this.prisma.configurator3DConfiguration.update({
      where: { id },
      data: { status: ConfiguratorStatus.DRAFT },
    });

    await this.cacheService.invalidateConfiguration(id);

    this.logger.log(`Configurator 3D configuration unpublished: ${id}`);

    return { success: true, status: ConfiguratorStatus.DRAFT };
  }

  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d:list'],
  })
  async archive(id: string, brandId: string) {
    await this.findOne(id, brandId);

    await this.prisma.configurator3DConfiguration.update({
      where: { id },
      data: {
        status: ConfiguratorStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    await this.cacheService.invalidateConfiguration(id);

    this.logger.log(`Configurator 3D configuration archived: ${id}`);

    return { success: true, status: ConfiguratorStatus.ARCHIVED };
  }

  async validate(id: string, brandId: string): Promise<ValidationResult> {
    await this.findOne(id, brandId);
    return this.validationService.validateForPublish(id);
  }

  getEmbedCode(
    config: { slug: string; id: string },
    baseUrl: string = 'https://app.luneo.io',
  ): EmbedCodeResult {
    const embedPath = `/embed/3d/${config.slug || config.id}`;
    const fullUrl = `${baseUrl}${embedPath}`;

    return {
      iframe: `<iframe src="${fullUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`,
      script: `<script src="${baseUrl}/embed/3d.js" data-config-id="${config.id}"></script>`,
      directUrl: fullUrl,
    };
  }

  async incrementViewCount(id: string, brandId: string) {
    await this.prisma.configurator3DConfiguration.updateMany({
      where: { id, brandId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async incrementSessionCount(id: string, brandId: string) {
    await this.prisma.configurator3DConfiguration.updateMany({
      where: { id, brandId },
      data: { sessionCount: { increment: 1 } },
    });
  }
}
