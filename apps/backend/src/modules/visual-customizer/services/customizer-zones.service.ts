import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateZoneDto } from '../dto/zones/create-zone.dto';
import { UpdateZoneDto } from '../dto/zones/update-zone.dto';
import { ReorderZonesDto } from '../dto/zones/reorder-zones.dto';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';

@Injectable()
export class CustomizerZonesService {
  private readonly logger = new Logger(CustomizerZonesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new zone
   */
  async create(customizerId: string, dto: CreateZoneDto) {
    // Verify customizer exists
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true },
    });

    if (!customizer) {
      throw new NotFoundException(
        `Visual customizer with ID ${customizerId} not found`,
      );
    }

    // Check max zones limit
    const zoneCount = await this.prisma.customizerZone.count({
      where: { customizerId },
    });

    if (zoneCount >= VISUAL_CUSTOMIZER_LIMITS.MAX_ZONES_PER_CUSTOMIZER) {
      throw new BadRequestException(
        `Maximum ${VISUAL_CUSTOMIZER_LIMITS.MAX_ZONES_PER_CUSTOMIZER} zones allowed per customizer`,
      );
    }

    // Get next sort order
    const maxSortOrder = await this.prisma.customizerZone.findFirst({
      where: { customizerId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

    const zone = await this.prisma.customizerZone.create({
      data: {
        customizerId,
        viewId: dto.viewId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        shape: dto.shape,
        x: dto.bounds.x,
        y: dto.bounds.y,
        width: dto.bounds.width,
        height: dto.bounds.height,
        rotation: dto.bounds.rotation || 0,
        polygonPoints: dto.polygonPoints
          ? (dto.polygonPoints as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        borderRadius: dto.borderRadius ?? 0,
        backgroundColor: dto.backgroundColor,
        borderColor: dto.borderColor,
        borderWidth: dto.borderWidth ?? 0,
        opacity: dto.opacity ?? 1,
        allowText: dto.constraints?.allowText ?? true,
        allowImages: dto.constraints?.allowImages ?? true,
        allowShapes: dto.constraints?.allowShapes ?? true,
        allowClipart: dto.constraints?.allowClipart ?? true,
        allowDrawing: dto.constraints?.allowDrawing ?? false,
        maxElements: dto.constraints?.maxElements || 10,
        lockAspectRatio: dto.constraints?.lockAspectRatio ?? false,
        minScale: dto.constraints?.minScale || 0.1,
        maxScale: dto.constraints?.maxScale || 5,
        allowRotation: dto.constraints?.allowRotation ?? true,
        snapToBounds: dto.constraints?.snapToBounds ?? false,
        clipContent: dto.constraints?.clipContent ?? true,
        sortOrder,
        isVisible: dto.isVisible ?? true,
        isLocked: dto.isLocked ?? false,
        priceModifier: dto.priceModifier ?? 0,
      },
      include: {
        _count: {
          select: { layers: true },
        },
      },
    });

    this.logger.log(
      `Zone created: ${zone.id} for customizer ${customizerId}`,
    );

    return zone;
  }

  /**
   * Find all zones for a customizer
   */
  async findAll(customizerId: string) {
    const zones = await this.prisma.customizerZone.findMany({
      where: { customizerId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { layers: true },
        },
      },
    });

    return zones;
  }

  /**
   * Find one zone by ID
   */
  async findOne(id: string, customizerId: string) {
    const zone = await this.prisma.customizerZone.findFirst({
      where: {
        id,
        customizerId,
      },
      include: {
        layers: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { layers: true },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return zone;
  }

  /**
   * Update a zone
   */
  async update(id: string, customizerId: string, dto: UpdateZoneDto) {
    // Verify zone exists
    await this.findOne(id, customizerId);

    const updateData: Prisma.CustomizerZoneUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.bounds !== undefined) {
      updateData.x = dto.bounds.x;
      updateData.y = dto.bounds.y;
      updateData.width = dto.bounds.width;
      updateData.height = dto.bounds.height;
      if (dto.bounds.rotation !== undefined) {
        updateData.rotation = dto.bounds.rotation;
      }
    }

    if (dto.polygonPoints !== undefined) {
      updateData.polygonPoints = dto.polygonPoints as unknown as Prisma.InputJsonValue;
    }

    if (dto.borderRadius !== undefined) {
      updateData.borderRadius = dto.borderRadius;
    }
    if (dto.backgroundColor !== undefined) {
      updateData.backgroundColor = dto.backgroundColor;
    }
    if (dto.borderColor !== undefined) {
      updateData.borderColor = dto.borderColor;
    }
    if (dto.borderWidth !== undefined) {
      updateData.borderWidth = dto.borderWidth;
    }
    if (dto.opacity !== undefined) {
      updateData.opacity = dto.opacity;
    }

    if (dto.constraints !== undefined) {
      if (dto.constraints.allowText !== undefined) {
        updateData.allowText = dto.constraints.allowText;
      }
      if (dto.constraints.allowImages !== undefined) {
        updateData.allowImages = dto.constraints.allowImages;
      }
      if (dto.constraints.allowShapes !== undefined) {
        updateData.allowShapes = dto.constraints.allowShapes;
      }
      if (dto.constraints.allowClipart !== undefined) {
        updateData.allowClipart = dto.constraints.allowClipart;
      }
      if (dto.constraints.allowDrawing !== undefined) {
        updateData.allowDrawing = dto.constraints.allowDrawing;
      }
      if (dto.constraints.maxElements !== undefined) {
        updateData.maxElements = dto.constraints.maxElements;
      }
      if (dto.constraints.lockAspectRatio !== undefined) {
        updateData.lockAspectRatio = dto.constraints.lockAspectRatio;
      }
      if (dto.constraints.minScale !== undefined) {
        updateData.minScale = dto.constraints.minScale;
      }
      if (dto.constraints.maxScale !== undefined) {
        updateData.maxScale = dto.constraints.maxScale;
      }
      if (dto.constraints.allowRotation !== undefined) {
        updateData.allowRotation = dto.constraints.allowRotation;
      }
      if (dto.constraints.snapToBounds !== undefined) {
        updateData.snapToBounds = dto.constraints.snapToBounds;
      }
      if (dto.constraints.clipContent !== undefined) {
        updateData.clipContent = dto.constraints.clipContent;
      }
    }

    if (dto.isVisible !== undefined) {
      updateData.isVisible = dto.isVisible;
    }
    if (dto.isLocked !== undefined) {
      updateData.isLocked = dto.isLocked;
    }

    if (dto.priceModifier !== undefined) {
      updateData.priceModifier = dto.priceModifier;
    }

    const zone = await this.prisma.customizerZone.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { layers: true },
        },
      },
    });

    this.logger.log(`Zone updated: ${id}`);

    return zone;
  }

  /**
   * Delete a zone
   */
  async delete(id: string, customizerId: string) {
    // Verify zone exists
    await this.findOne(id, customizerId);

    await this.prisma.customizerZone.delete({
      where: { id },
    });

    this.logger.log(`Zone deleted: ${id}`);

    return {
      success: true,
      id,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Reorder zones
   */
  async reorder(customizerId: string, dto: ReorderZonesDto) {
    // Verify all zones belong to this customizer
    const zones = await this.prisma.customizerZone.findMany({
      where: {
        id: { in: dto.zoneIds },
        customizerId,
      },
      select: { id: true },
    });

    if (zones.length !== dto.zoneIds.length) {
      throw new BadRequestException(
        'Some zones do not belong to this customizer',
      );
    }

    // Update sort orders
    const updates = dto.zoneIds.map((zoneId, index) =>
      this.prisma.customizerZone.update({
        where: { id: zoneId },
        data: { sortOrder: index },
      }),
    );

    await Promise.all(updates);

    this.logger.log(
      `Zones reordered for customizer ${customizerId}: ${dto.zoneIds.length} zones`,
    );

    return {
      success: true,
      zoneIds: dto.zoneIds,
    };
  }
}
