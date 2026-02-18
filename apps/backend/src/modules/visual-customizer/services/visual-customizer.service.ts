import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { CreateCustomizerDto } from '../dto/configuration/create-customizer.dto';
import { UpdateCustomizerDto } from '../dto/configuration/update-customizer.dto';
import { CustomizerQueryDto } from '../dto/configuration/customizer-query.dto';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';
import { CurrentUser } from '@/common/types/user.types';

interface EmbedCodeOptions {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  showControls?: boolean;
}

@Injectable()
export class VisualCustomizerService {
  private readonly logger = new Logger(VisualCustomizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all customizers with pagination and filters
   */
  @Cacheable({
    type: 'visual-customizer',
    ttl: 3600,
    keyGenerator: (args) =>
      `visual-customizer:findAll:${args[0]}:${JSON.stringify(args[1])}`,
    tags: (args) => [`brand:${args[0]}`, 'visual-customizer:list'],
  })
  async findAll(
    brandId: string,
    query: CustomizerQueryDto & PaginationParams = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(query);

    const where: Prisma.VisualCustomizerWhereInput = {
      brandId,
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.visualCustomizer.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          type: true,
          status: true,
          thumbnailUrl: true,
          canvasWidth: true,
          canvasHeight: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          _count: {
            select: {
              zones: true,
              presets: true,
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.visualCustomizer.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Find one customizer by ID
   */
  @Cacheable({
    type: 'visual-customizer',
    ttl: 7200,
    keyGenerator: (args) => `visual-customizer:${args[0]}:${args[1]}`,
    tags: (args) => [`visual-customizer:${args[0]}`, 'visual-customizer:list'],
  })
  async findOne(id: string, brandId: string) {
    const customizer = await this.prisma.visualCustomizer.findFirst({
      where: {
        id,
        brandId,
        deletedAt: null,
      },
      include: {
        zones: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { layers: true },
            },
          },
        },
        presets: {
          orderBy: { sortOrder: 'asc' },
          take: 10,
        },
        _count: {
          select: {
            zones: true,
            presets: true,
            sessions: true,
            savedDesigns: true,
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
   * Find one customizer for public/widget access
   */
  @Cacheable({
    type: 'visual-customizer',
    ttl: 3600,
    keyGenerator: (args) => `visual-customizer:public:${args[0]}`,
  })
  async findOnePublic(id: string) {
    const customizer = await this.prisma.visualCustomizer.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
        isPublic: true,
        deletedAt: null,
      },
      include: {
        zones: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
        presets: {
          where: { isPublic: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!customizer) {
      throw new NotFoundException(
        `Public visual customizer with ID ${id} not found`,
      );
    }

    return customizer;
  }

  /**
   * Create a new customizer
   */
  @CacheInvalidate({
    tags: (args) => [`brand:${(args[1] as CurrentUser).brandId}`, 'visual-customizer:list'],
  })
  async create(dto: CreateCustomizerDto, user: CurrentUser) {
    // Generate slug from name
    const slug = this.generateSlug(dto.name);

    // Check if slug already exists
    const existing = await this.prisma.visualCustomizer.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        `A customizer with slug "${slug}" already exists`,
      );
    }

    // Extract canvas dimensions from canvasSettings
    const canvasWidth = dto.canvasSettings?.width || 800;
    const canvasHeight = dto.canvasSettings?.height || 800;

    const customizer = await this.prisma.visualCustomizer.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        slug,
        brandId: user.brandId!,
        ...(dto.productId && { productId: dto.productId }),
        type: dto.type,
        status: dto.status || 'DRAFT',
        ...(dto.productImageUrl && { productImageUrl: dto.productImageUrl }),
        ...(dto.productMaskUrl && { productMaskUrl: dto.productMaskUrl }),
        canvasConfig: dto.canvasSettings as unknown as Prisma.InputJsonValue,
        canvasWidth,
        canvasHeight,
        canvasUnit: dto.canvasSettings?.unit || 'PIXEL',
        canvasDPI: dto.canvasSettings?.dpi || 72,
        ...(dto.canvasSettings?.backgroundColor && { backgroundColor: dto.canvasSettings.backgroundColor }),
        showGrid: dto.canvasSettings?.showGrid || false,
        ...(dto.toolSettings && { toolSettings: dto.toolSettings as unknown as Prisma.InputJsonValue }),
        ...(dto.textSettings && { textSettings: dto.textSettings as unknown as Prisma.InputJsonValue }),
        ...(dto.imageSettings && { imageSettings: dto.imageSettings as unknown as Prisma.InputJsonValue }),
        ...(dto.uiSettings && { uiConfig: dto.uiSettings as unknown as Prisma.InputJsonValue }),
        enableMultiView: dto.enableMultiView || false,
        createdById: user.id,
      },
      include: {
        _count: {
          select: {
            zones: true,
            presets: true,
          },
        },
      },
    });

    this.logger.log(
      `Visual customizer created: ${customizer.id} for brand ${user.brandId}`,
    );

    return customizer;
  }

  /**
   * Update a customizer
   */
  @CacheInvalidate({
    tags: (args) => [`visual-customizer:${args[0]}`, 'visual-customizer:list'],
  })
  async update(id: string, dto: UpdateCustomizerDto, user: CurrentUser) {
    // Verify ownership
    const existing = await this.prisma.visualCustomizer.findFirst({
      where: {
        id,
        brandId: user.brandId!,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Visual customizer with ID ${id} not found`,
      );
    }

    const updateData: Prisma.VisualCustomizerUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
      // Regenerate slug if name changed
      updateData.slug = this.generateSlug(dto.name);
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.productId !== undefined) {
      updateData.product = dto.productId ? { connect: { id: dto.productId } } : { disconnect: true };
    }

    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.productImageUrl !== undefined) {
      updateData.productImageUrl = dto.productImageUrl;
    }

    if (dto.productMaskUrl !== undefined) {
      updateData.productMaskUrl = dto.productMaskUrl;
    }

    if (dto.canvasSettings !== undefined) {
      updateData.canvasConfig = dto.canvasSettings as unknown as Prisma.InputJsonValue;
      if (dto.canvasSettings.width !== undefined) {
        updateData.canvasWidth = dto.canvasSettings.width;
      }
      if (dto.canvasSettings.height !== undefined) {
        updateData.canvasHeight = dto.canvasSettings.height;
      }
      if (dto.canvasSettings.unit) {
        updateData.canvasUnit = dto.canvasSettings.unit;
      }
      if (dto.canvasSettings.dpi) {
        updateData.canvasDPI = dto.canvasSettings.dpi;
      }
      if (dto.canvasSettings.backgroundColor) {
        updateData.backgroundColor = dto.canvasSettings.backgroundColor;
      }
      if (dto.canvasSettings.showGrid !== undefined) {
        updateData.showGrid = dto.canvasSettings.showGrid;
      }
    }

    if (dto.toolSettings !== undefined) {
      updateData.toolSettings = dto.toolSettings as unknown as Prisma.InputJsonValue;
    }

    if (dto.textSettings !== undefined) {
      updateData.textSettings = dto.textSettings as unknown as Prisma.InputJsonValue;
    }

    if (dto.imageSettings !== undefined) {
      updateData.imageSettings = dto.imageSettings as unknown as Prisma.InputJsonValue;
    }

    if (dto.uiSettings !== undefined) {
      updateData.uiConfig = dto.uiSettings as unknown as Prisma.InputJsonValue;
    }

    if (dto.enableMultiView !== undefined) {
      updateData.enableMultiView = dto.enableMultiView;
    }

    const customizer = await this.prisma.visualCustomizer.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            zones: true,
            presets: true,
          },
        },
      },
    });

    this.logger.log(`Visual customizer updated: ${id}`);

    return customizer;
  }

  /**
   * Delete a customizer (soft delete)
   */
  @CacheInvalidate({
    tags: (args) => [`visual-customizer:${args[0]}`, 'visual-customizer:list'],
  })
  async delete(id: string, user: CurrentUser) {
    // Verify ownership
    const existing = await this.prisma.visualCustomizer.findFirst({
      where: {
        id,
        brandId: user.brandId!,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Visual customizer with ID ${id} not found`,
      );
    }

    await this.prisma.visualCustomizer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Visual customizer deleted: ${id}`);

    return {
      success: true,
      id,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Publish a customizer
   */
  @CacheInvalidate({
    tags: (args) => [`visual-customizer:${args[0]}`, 'visual-customizer:list'],
  })
  async publish(id: string, user: CurrentUser) {
    // Verify ownership
    const existing = await this.prisma.visualCustomizer.findFirst({
      where: {
        id,
        brandId: user.brandId!,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Visual customizer with ID ${id} not found`,
      );
    }

    const customizer = await this.prisma.visualCustomizer.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    this.logger.log(`Visual customizer published: ${id}`);

    return customizer;
  }

  /**
   * Clone a customizer
   */
  @CacheInvalidate({
    tags: (args) => [`brand:${(args[2] as CurrentUser).brandId}`, 'visual-customizer:list'],
  })
  async clone(id: string, newName: string, user: CurrentUser) {
    // Get original customizer with relations
    const original = await this.prisma.visualCustomizer.findFirst({
      where: {
        id,
        brandId: user.brandId!,
        deletedAt: null,
      },
      include: {
        zones: {
          include: {
            layers: true,
          },
        },
        presets: true,
      },
    });

    if (!original) {
      throw new NotFoundException(
        `Visual customizer with ID ${id} not found`,
      );
    }

    // Generate new slug
    const slug = this.generateSlug(newName);

    // Create cloned customizer
    const cloned = await this.prisma.visualCustomizer.create({
      data: {
        name: newName,
        description: original.description,
        slug,
        brandId: user.brandId!,
        ...(original.productId && { productId: original.productId }),
        type: original.type,
        status: 'DRAFT',
        ...(original.productImageUrl && { productImageUrl: original.productImageUrl }),
        ...(original.productMaskUrl && { productMaskUrl: original.productMaskUrl }),
        canvasConfig: original.canvasConfig as unknown as Prisma.InputJsonValue,
        canvasWidth: original.canvasWidth,
        canvasHeight: original.canvasHeight,
        canvasUnit: original.canvasUnit,
        canvasDPI: original.canvasDPI,
        ...(original.backgroundColor && { backgroundColor: original.backgroundColor }),
        showGrid: original.showGrid,
        ...(original.toolSettings && { toolSettings: original.toolSettings as unknown as Prisma.InputJsonValue }),
        ...(original.textSettings && { textSettings: original.textSettings as unknown as Prisma.InputJsonValue }),
        ...(original.imageSettings && { imageSettings: original.imageSettings as unknown as Prisma.InputJsonValue }),
        ...(original.uiConfig && { uiConfig: original.uiConfig as unknown as Prisma.InputJsonValue }),
        enableMultiView: original.enableMultiView,
        createdById: user.id,
        zones: {
          create: original.zones.map((zone) => ({
            name: zone.name,
            description: zone.description,
            type: zone.type,
            shape: zone.shape,
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
            rotation: zone.rotation,
            polygonPoints: zone.polygonPoints as unknown as Prisma.InputJsonValue,
            borderRadius: zone.borderRadius,
            backgroundColor: zone.backgroundColor,
            borderColor: zone.borderColor,
            borderWidth: zone.borderWidth,
            opacity: zone.opacity,
            allowText: zone.allowText,
            allowImages: zone.allowImages,
            allowShapes: zone.allowShapes,
            allowClipart: zone.allowClipart,
            allowDrawing: zone.allowDrawing,
            maxElements: zone.maxElements,
            lockAspectRatio: zone.lockAspectRatio,
            minScale: zone.minScale,
            maxScale: zone.maxScale,
            allowRotation: zone.allowRotation,
            snapToBounds: zone.snapToBounds,
            clipContent: zone.clipContent,
            sortOrder: zone.sortOrder,
            isVisible: zone.isVisible,
            isLocked: zone.isLocked,
            priceModifier: zone.priceModifier,
            metadata: zone.metadata as unknown as Prisma.InputJsonValue,
            layers: {
              create: zone.layers.map((layer) => ({
                name: layer.name,
                type: layer.type,
                x: layer.x,
                y: layer.y,
                width: layer.width,
                height: layer.height,
                scaleX: layer.scaleX,
                scaleY: layer.scaleY,
                rotation: layer.rotation,
                skewX: layer.skewX,
                skewY: layer.skewY,
                flipX: layer.flipX,
                flipY: layer.flipY,
                content: layer.content as unknown as Prisma.InputJsonValue,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                shadowEnabled: layer.shadowEnabled,
                shadowColor: layer.shadowColor,
                shadowOffsetX: layer.shadowOffsetX,
                shadowOffsetY: layer.shadowOffsetY,
                shadowBlur: layer.shadowBlur,
                sortOrder: layer.sortOrder,
                isVisible: layer.isVisible,
                isLocked: layer.isLocked,
                isSelectable: layer.isSelectable,
                metadata: layer.metadata as unknown as Prisma.InputJsonValue,
              })),
            },
          })),
        },
        presets: {
          create: original.presets.map((preset) => ({
            name: preset.name,
            description: preset.description,
            thumbnailUrl: preset.thumbnailUrl,
            previewImageUrl: preset.previewImageUrl,
            layerConfig: preset.layerConfig as unknown as Prisma.InputJsonValue,
            canvasData: preset.canvasData as unknown as Prisma.InputJsonValue,
            category: preset.category,
            tags: preset.tags,
            isPublic: preset.isPublic,
            isDefault: preset.isDefault,
            isFeatured: preset.isFeatured,
            sortOrder: preset.sortOrder,
            metadata: preset.metadata as unknown as Prisma.InputJsonValue,
            createdById: user.id,
          })),
        },
      },
      include: {
        _count: {
          select: {
            zones: true,
            presets: true,
          },
        },
      },
    });

    this.logger.log(
      `Visual customizer cloned: ${id} -> ${cloned.id} for brand ${user.brandId}`,
    );

    return cloned;
  }

  /**
   * Get embed code for widget integration
   */
  async getEmbedCode(
    id: string,
    options: EmbedCodeOptions = {},
    user: CurrentUser,
  ) {
    const customizer = await this.findOne(id, user.brandId!);

    if (customizer.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Customizer must be published to generate embed code',
      );
    }

    const width = options.width || customizer.canvasWidth || 800;
    const height = options.height || customizer.canvasHeight || 800;
    const theme = options.theme || 'light';
    const showControls = options.showControls ?? true;

    const widgetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/customizer/${customizer.slug}`;
    const directUrl = widgetUrl;

    const iframeHtml = `<iframe src="${widgetUrl}?theme=${theme}&controls=${showControls}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;

    const scriptTag = `<script src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/widgets/customizer.js" data-customizer-id="${id}" data-width="${width}" data-height="${height}" data-theme="${theme}" data-controls="${showControls}"></script>`;

    return {
      customizerId: id,
      iframeHtml,
      scriptTag,
      directUrl,
      widgetUrl,
      options: {
        width,
        height,
        theme,
        showControls,
      },
    };
  }

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
