import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { CreatePresetDto } from '../dto/presets/create-preset.dto';
import { UpdatePresetDto } from '../dto/presets/update-preset.dto';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';
import { CurrentUser } from '@/common/types/user.types';

interface PresetQuery {
  category?: string;
  isPublic?: boolean;
  search?: string;
}

@Injectable()
export class CustomizerPresetsService {
  private readonly logger = new Logger(CustomizerPresetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new preset
   */
  async create(customizerId: string, dto: CreatePresetDto, user: CurrentUser) {
    // Verify customizer exists
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true, brandId: true },
    });

    if (!customizer) {
      throw new NotFoundException(
        `Visual customizer with ID ${customizerId} not found`,
      );
    }

    // Verify brand ownership
    if (customizer.brandId !== user.brandId) {
      throw new BadRequestException(
        'Customizer does not belong to your brand',
      );
    }

    // Check max presets limit
    const presetCount = await this.prisma.visualCustomizerPreset.count({
      where: { customizerId },
    });

    if (presetCount >= VISUAL_CUSTOMIZER_LIMITS.MAX_PRESETS_PER_CUSTOMIZER) {
      throw new BadRequestException(
        `Maximum ${VISUAL_CUSTOMIZER_LIMITS.MAX_PRESETS_PER_CUSTOMIZER} presets allowed per customizer`,
      );
    }

    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.visualCustomizerPreset.updateMany({
        where: { customizerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Get next sort order
    const maxSortOrder = await this.prisma.visualCustomizerPreset.findFirst({
      where: { customizerId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = dto.sortOrder ?? (maxSortOrder?.sortOrder ?? -1) + 1;

    const preset = await this.prisma.visualCustomizerPreset.create({
      data: {
        customizerId,
        createdById: user.id,
        name: dto.name,
        description: dto.description,
        layerConfig: dto.canvasData as Prisma.InputJsonValue,
        canvasData: dto.canvasData as Prisma.InputJsonValue,
        category: dto.category,
        tags: dto.tags || [],
        isPublic: dto.isPublic ?? false,
        isDefault: dto.isDefault ?? false,
        isFeatured: false,
        sortOrder,
      },
    });

    this.logger.log(
      `Preset created: ${preset.id} for customizer ${customizerId}`,
    );

    return preset;
  }

  /**
   * Find all presets for a customizer
   */
  async findAll(
    customizerId: string,
    query: PresetQuery & PaginationParams = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(query);

    const where: Prisma.VisualCustomizerPresetWhereInput = {
      customizerId,
      ...(query.category && { category: query.category }),
      ...(query.isPublic !== undefined && { isPublic: query.isPublic }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.visualCustomizerPreset.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take,
      }),
      this.prisma.visualCustomizerPreset.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Find one preset by ID
   */
  async findOne(id: string, customizerId: string) {
    const preset = await this.prisma.visualCustomizerPreset.findFirst({
      where: {
        id,
        customizerId,
      },
    });

    if (!preset) {
      throw new NotFoundException(`Preset with ID ${id} not found`);
    }

    return preset;
  }

  /**
   * Update a preset
   */
  async update(
    id: string,
    customizerId: string,
    dto: UpdatePresetDto,
    user: CurrentUser,
  ) {
    // Verify preset exists
    await this.findOne(id, customizerId);

    const updateData: Prisma.VisualCustomizerPresetUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.canvasData !== undefined) {
      updateData.layerConfig = dto.canvasData as Prisma.InputJsonValue;
      updateData.canvasData = dto.canvasData as Prisma.InputJsonValue;
    }

    if (dto.category !== undefined) {
      updateData.category = dto.category;
    }

    if (dto.tags !== undefined) {
      updateData.tags = dto.tags;
    }

    if (dto.isPublic !== undefined) {
      updateData.isPublic = dto.isPublic;
    }

    if (dto.isDefault !== undefined) {
      // If setting as default, unset other defaults
      if (dto.isDefault) {
        await this.prisma.visualCustomizerPreset.updateMany({
          where: { customizerId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      updateData.isDefault = dto.isDefault;
    }

    if (dto.sortOrder !== undefined) {
      updateData.sortOrder = dto.sortOrder;
    }

    const preset = await this.prisma.visualCustomizerPreset.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Preset updated: ${id}`);

    return preset;
  }

  /**
   * Delete a preset
   */
  async delete(id: string, customizerId: string, user: CurrentUser) {
    // Verify preset exists
    await this.findOne(id, customizerId);

    await this.prisma.visualCustomizerPreset.delete({
      where: { id },
    });

    this.logger.log(`Preset deleted: ${id}`);

    return {
      success: true,
      id,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Increment preset usage count
   */
  async incrementUsage(presetId: string) {
    const preset = await this.prisma.visualCustomizerPreset.update({
      where: { id: presetId },
      data: {
        usageCount: { increment: 1 },
      },
      select: {
        id: true,
        usageCount: true,
      },
    });

    return preset;
  }
}
