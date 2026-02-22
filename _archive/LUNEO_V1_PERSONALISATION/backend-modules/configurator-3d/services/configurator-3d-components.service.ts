import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SelectionMode } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CONFIGURATOR_3D_LIMITS } from '../configurator-3d.constants';

export interface CreateComponentDto {
  name: string;
  technicalId?: string;
  description?: string;
  type: string;
  meshName?: string;
  selectionMode?: SelectionMode;
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
  isVisible?: boolean;
  isOptional?: boolean;
  isEnabled?: boolean;
  groupId?: string;
  settings?: Record<string, unknown>;
  bounds?: Record<string, unknown>;
}

export interface BulkCreateComponentDto extends CreateComponentDto {}

@Injectable()
export class Configurator3DComponentsService {
  private readonly logger = new Logger(Configurator3DComponentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(configurationId: string, brandId: string, dto: CreateComponentDto) {
    const count = await this.prisma.configurator3DComponent.count({
      where: { configurationId },
    });

    if (count >= CONFIGURATOR_3D_LIMITS.MAX_COMPONENTS_PER_CONFIG) {
      throw new BadRequestException(
        `Maximum ${CONFIGURATOR_3D_LIMITS.MAX_COMPONENTS_PER_CONFIG} components per configuration reached`,
      );
    }

    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: { id: configurationId, brandId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found or access denied`,
      );
    }

    const component = await this.prisma.configurator3DComponent.create({
      data: {
        configurationId,
        name: dto.name,
        technicalId: dto.technicalId,
        description: dto.description,
        type: dto.type,
        meshName: dto.meshName,
        selectionMode: dto.selectionMode ?? SelectionMode.SINGLE,
        isRequired: dto.isRequired ?? false,
        minSelections: dto.minSelections ?? 0,
        maxSelections: dto.maxSelections ?? 1,
        sortOrder: dto.sortOrder ?? count,
        isVisible: dto.isVisible ?? true,
        isOptional: dto.isOptional ?? false,
        isEnabled: dto.isEnabled ?? true,
        groupId: dto.groupId,
        settings: (dto.settings || {}) as Prisma.InputJsonValue,
        bounds: (dto.bounds || {}) as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Component ${component.id} created for configuration ${configurationId}`,
    );

    return component;
  }

  async bulkCreate(
    configurationId: string,
    brandId: string,
    dtos: BulkCreateComponentDto[],
  ) {
    if (dtos.length > CONFIGURATOR_3D_LIMITS.MAX_BULK_COMPONENTS) {
      throw new BadRequestException(
        `Maximum ${CONFIGURATOR_3D_LIMITS.MAX_BULK_COMPONENTS} components per bulk create`,
      );
    }

    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: { id: configurationId, brandId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found or access denied`,
      );
    }

    const count = await this.prisma.configurator3DComponent.count({
      where: { configurationId },
    });

    if (count + dtos.length > CONFIGURATOR_3D_LIMITS.MAX_COMPONENTS_PER_CONFIG) {
      throw new BadRequestException(
        `Would exceed maximum ${CONFIGURATOR_3D_LIMITS.MAX_COMPONENTS_PER_CONFIG} components`,
      );
    }

    const components = await this.prisma.$transaction(
      dtos.map((dto, index) =>
        this.prisma.configurator3DComponent.create({
          data: {
            configurationId,
            name: dto.name,
            technicalId: dto.technicalId,
            description: dto.description,
            type: dto.type,
            meshName: dto.meshName,
            selectionMode: dto.selectionMode ?? SelectionMode.SINGLE,
            isRequired: dto.isRequired ?? false,
            minSelections: dto.minSelections ?? 0,
            maxSelections: dto.maxSelections ?? 1,
            sortOrder: dto.sortOrder ?? count + index,
            isVisible: dto.isVisible ?? true,
            isOptional: dto.isOptional ?? false,
            isEnabled: dto.isEnabled ?? true,
            groupId: dto.groupId,
            settings: (dto.settings || {}) as Prisma.InputJsonValue,
            bounds: (dto.bounds || {}) as Prisma.InputJsonValue,
          },
        }),
      ),
    );

    this.logger.log(
      `Bulk created ${components.length} components for configuration ${configurationId}`,
    );

    return components;
  }

  async findAll(
    configurationId: string,
    brandId: string,
    options?: { includeOptions?: boolean },
  ) {
    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: { id: configurationId, brandId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found or access denied`,
      );
    }

    return this.prisma.configurator3DComponent.findMany({
      where: { configurationId },
      include: options?.includeOptions
        ? { options: { orderBy: { sortOrder: 'asc' } } }
        : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(
    configurationId: string,
    componentId: string,
    brandId: string,
    options?: { includeOptions?: boolean },
  ) {
    const component = await this.prisma.configurator3DComponent.findFirst({
      where: {
        id: componentId,
        configurationId,
        configuration: { brandId },
      },
      include: options?.includeOptions
        ? { options: { orderBy: { sortOrder: 'asc' } } }
        : undefined,
    });

    if (!component) {
      throw new NotFoundException(
        `Component ${componentId} not found in configuration ${configurationId}`,
      );
    }

    return component;
  }

  async update(
    configurationId: string,
    componentId: string,
    brandId: string,
    dto: Partial<CreateComponentDto>,
  ) {
    await this.findOne(configurationId, componentId, brandId);

    const updateData: Prisma.Configurator3DComponentUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.technicalId !== undefined) updateData.technicalId = dto.technicalId;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.meshName !== undefined) updateData.meshName = dto.meshName;
    if (dto.selectionMode !== undefined)
      updateData.selectionMode = dto.selectionMode;
    if (dto.isRequired !== undefined) updateData.isRequired = dto.isRequired;
    if (dto.minSelections !== undefined)
      updateData.minSelections = dto.minSelections;
    if (dto.maxSelections !== undefined)
      updateData.maxSelections = dto.maxSelections;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.isVisible !== undefined) updateData.isVisible = dto.isVisible;
    if (dto.isOptional !== undefined) updateData.isOptional = dto.isOptional;
    if (dto.isEnabled !== undefined) updateData.isEnabled = dto.isEnabled;
    if (dto.groupId !== undefined) (updateData as Record<string, unknown>).groupId = dto.groupId;
    if (dto.settings !== undefined)
      updateData.settings = dto.settings as Prisma.InputJsonValue;
    if (dto.bounds !== undefined)
      updateData.bounds = dto.bounds as Prisma.InputJsonValue;

    return this.prisma.configurator3DComponent.update({
      where: { id: componentId },
      data: updateData,
    });
  }

  async delete(configurationId: string, componentId: string, brandId: string) {
    await this.findOne(configurationId, componentId, brandId);

    await this.prisma.configurator3DComponent.delete({
      where: { id: componentId },
    });

    this.logger.log(
      `Component ${componentId} deleted (cascade options) from configuration ${configurationId}`,
    );

    return { success: true, componentId };
  }

  async reorder(
    configurationId: string,
    brandId: string,
    order: { componentId: string; sortOrder: number }[],
  ) {
    if (order.length > CONFIGURATOR_3D_LIMITS.MAX_REORDER_ITEMS) {
      throw new BadRequestException(
        `Maximum ${CONFIGURATOR_3D_LIMITS.MAX_REORDER_ITEMS} items per reorder`,
      );
    }

    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: { id: configurationId, brandId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found or access denied`,
      );
    }

    await this.prisma.$transaction(
      order.map(({ componentId, sortOrder }) =>
        this.prisma.configurator3DComponent.updateMany({
          where: {
            id: componentId,
            configurationId,
          },
          data: { sortOrder },
        }),
      ),
    );

    this.logger.log(
      `Reordered ${order.length} components for configuration ${configurationId}`,
    );

    return this.findAll(configurationId, brandId);
  }
}
