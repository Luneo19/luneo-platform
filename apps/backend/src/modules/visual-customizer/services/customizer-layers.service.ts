import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateLayerDto } from '../dto/layers/create-layer.dto';
import { UpdateLayerDto } from '../dto/layers/update-layer.dto';
import { ReorderLayersDto } from '../dto/layers/reorder-layers.dto';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';

@Injectable()
export class CustomizerLayersService {
  private readonly logger = new Logger(CustomizerLayersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new layer
   */
  async create(zoneId: string, dto: CreateLayerDto) {
    // Verify zone exists
    const zone = await this.prisma.customizerZone.findUnique({
      where: { id: zoneId },
      select: { id: true, customizerId: true },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    // Check max layers per zone limit
    const layerCount = await this.prisma.customizerLayer.count({
      where: { zoneId },
    });

    if (layerCount >= VISUAL_CUSTOMIZER_LIMITS.MAX_LAYERS_PER_ZONE) {
      throw new BadRequestException(
        `Maximum ${VISUAL_CUSTOMIZER_LIMITS.MAX_LAYERS_PER_ZONE} layers allowed per zone`,
      );
    }

    // Get next sort order
    const maxSortOrder = await this.prisma.customizerLayer.findFirst({
      where: { zoneId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

    const layer = await this.prisma.customizerLayer.create({
      data: {
        zoneId,
        sessionId: dto.sessionId,
        name: dto.name,
        type: dto.type,
        x: dto.transform.x,
        y: dto.transform.y,
        width: dto.transform.width,
        height: dto.transform.height,
        scaleX: dto.transform.scaleX || 1,
        scaleY: dto.transform.scaleY || 1,
        rotation: dto.transform.rotation || 0,
        skewX: dto.transform.skewX || 0,
        skewY: dto.transform.skewY || 0,
        flipX: dto.transform.flipX || false,
        flipY: dto.transform.flipY || false,
        content: dto.content as Prisma.InputJsonValue,
        opacity: dto.opacity ?? 1,
        blendMode: dto.blendMode || 'NORMAL',
        shadowEnabled: dto.shadowEnabled ?? false,
        shadowColor: dto.shadowColor,
        shadowOffsetX: dto.shadowOffsetX ?? 0,
        shadowOffsetY: dto.shadowOffsetY ?? 0,
        shadowBlur: dto.shadowBlur ?? 0,
        sortOrder,
        isVisible: dto.isVisible ?? true,
        isLocked: dto.isLocked ?? false,
        isSelectable: dto.isSelectable ?? true,
        parentLayerId: dto.parentLayerId,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Layer created: ${layer.id} for zone ${zoneId}`);

    return layer;
  }

  /**
   * Find all layers for a zone
   */
  async findAll(zoneId: string) {
    const layers = await this.prisma.customizerLayer.findMany({
      where: { zoneId },
      orderBy: { sortOrder: 'asc' },
    });

    return layers;
  }

  /**
   * Find one layer by ID
   */
  async findOne(id: string, zoneId: string) {
    const layer = await this.prisma.customizerLayer.findFirst({
      where: {
        id,
        zoneId,
      },
    });

    if (!layer) {
      throw new NotFoundException(`Layer with ID ${id} not found`);
    }

    return layer;
  }

  /**
   * Update a layer
   */
  async update(id: string, zoneId: string, dto: UpdateLayerDto) {
    // Verify layer exists
    await this.findOne(id, zoneId);

    const updateData: Prisma.CustomizerLayerUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.transform !== undefined) {
      if (dto.transform.x !== undefined) {
        updateData.x = dto.transform.x;
      }
      if (dto.transform.y !== undefined) {
        updateData.y = dto.transform.y;
      }
      if (dto.transform.width !== undefined) {
        updateData.width = dto.transform.width;
      }
      if (dto.transform.height !== undefined) {
        updateData.height = dto.transform.height;
      }
      if (dto.transform.scaleX !== undefined) {
        updateData.scaleX = dto.transform.scaleX;
      }
      if (dto.transform.scaleY !== undefined) {
        updateData.scaleY = dto.transform.scaleY;
      }
      if (dto.transform.rotation !== undefined) {
        updateData.rotation = dto.transform.rotation;
      }
      if (dto.transform.skewX !== undefined) {
        updateData.skewX = dto.transform.skewX;
      }
      if (dto.transform.skewY !== undefined) {
        updateData.skewY = dto.transform.skewY;
      }
      if (dto.transform.flipX !== undefined) {
        updateData.flipX = dto.transform.flipX;
      }
      if (dto.transform.flipY !== undefined) {
        updateData.flipY = dto.transform.flipY;
      }
    }

    if (dto.content !== undefined) {
      updateData.content = dto.content as Prisma.InputJsonValue;
    }

    if (dto.opacity !== undefined) {
      updateData.opacity = dto.opacity;
    }
    if (dto.blendMode !== undefined) {
      updateData.blendMode = dto.blendMode;
    }

    if (dto.shadowEnabled !== undefined) {
      updateData.shadowEnabled = dto.shadowEnabled;
    }
    if (dto.shadowColor !== undefined) {
      updateData.shadowColor = dto.shadowColor;
    }
    if (dto.shadowOffsetX !== undefined) {
      updateData.shadowOffsetX = dto.shadowOffsetX;
    }
    if (dto.shadowOffsetY !== undefined) {
      updateData.shadowOffsetY = dto.shadowOffsetY;
    }
    if (dto.shadowBlur !== undefined) {
      updateData.shadowBlur = dto.shadowBlur;
    }

    if (dto.isVisible !== undefined) {
      updateData.isVisible = dto.isVisible;
    }
    if (dto.isLocked !== undefined) {
      updateData.isLocked = dto.isLocked;
    }
    if (dto.isSelectable !== undefined) {
      updateData.isSelectable = dto.isSelectable;
    }

    if (dto.parentLayerId !== undefined) {
      if (dto.parentLayerId) {
        updateData.parentLayer = { connect: { id: dto.parentLayerId } };
      } else {
        updateData.parentLayer = { disconnect: true };
      }
    }

    if (dto.metadata !== undefined) {
      updateData.metadata = dto.metadata as Prisma.InputJsonValue;
    }

    const layer = await this.prisma.customizerLayer.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Layer updated: ${id}`);

    return layer;
  }

  /**
   * Delete a layer
   */
  async delete(id: string, zoneId: string) {
    // Verify layer exists
    await this.findOne(id, zoneId);

    await this.prisma.customizerLayer.delete({
      where: { id },
    });

    this.logger.log(`Layer deleted: ${id}`);

    return {
      success: true,
      id,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Reorder layers
   */
  async reorder(zoneId: string, dto: ReorderLayersDto) {
    // Verify all layers belong to this zone
    const layers = await this.prisma.customizerLayer.findMany({
      where: {
        id: { in: dto.layerIds },
        zoneId,
      },
      select: { id: true },
    });

    if (layers.length !== dto.layerIds.length) {
      throw new BadRequestException(
        'Some layers do not belong to this zone',
      );
    }

    // Update sort orders
    const updates = dto.layerIds.map((layerId, index) =>
      this.prisma.customizerLayer.update({
        where: { id: layerId },
        data: { sortOrder: index },
      }),
    );

    await Promise.all(updates);

    this.logger.log(
      `Layers reordered for zone ${zoneId}: ${dto.layerIds.length} layers`,
    );

    return {
      success: true,
      layerIds: dto.layerIds,
    };
  }
}
