import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { CreateOptionDto } from '../dto/options/create-option.dto';
import type { UpdateOptionDto } from '../dto/options/update-option.dto';
import type { BulkCreateOptionsDto } from '../dto/options/bulk-create-options.dto';
import { CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class Configurator3DOptionsService {
  private readonly logger = new Logger(Configurator3DOptionsService.name);

  constructor(private prisma: PrismaService) {}

  async create(configurationId: string, componentId: string, dto: Omit<CreateOptionDto, 'componentId'>) {
    const option = await this.prisma.configurator3DOption.create({
      data: {
        configurationId,
        componentId,
        name: dto.name,
        label: dto.name,
        sku: dto.sku,
        description: dto.description,
        type: dto.type,
        value: typeof dto.value === 'string' ? dto.value : (dto.value ? JSON.stringify(dto.value) : undefined),
        sortOrder: dto.sortOrder ?? 0,
        isDefault: dto.isDefault ?? false,
        isEnabled: dto.isEnabled ?? true,
        inStock: dto.inStock ?? true,
        leadTimeDays: dto.leadTimeDays,
        previewImageUrl: dto.previewImageUrl,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
        priceDelta: (dto.pricing as { value?: number })?.value ?? 0,
        pricingType: ((dto.pricing as { type?: string })?.type ?? 'FIXED') as 'FIXED' | 'PERCENTAGE' | 'REPLACEMENT' | 'FORMULA',
      },
    });
    this.logger.log(`Option created: ${option.id}`);
    return option;
  }

  @CacheInvalidate({ tags: (args) => [`configurator-3d:${args[0]}`] })
  async bulkCreate(configurationId: string, componentId: string, dto: BulkCreateOptionsDto) {
    const created = await this.prisma.configurator3DOption.createManyAndReturn({
      data: dto.options.map((o) => ({
        configurationId,
        componentId: o.componentId || componentId,
        name: o.name,
        label: (o as { label?: string }).label ?? o.name,
        sku: o.sku,
        description: o.description,
        type: o.type,
        value: typeof o.value === 'string' ? o.value : (o.value ? JSON.stringify(o.value) : undefined),
        sortOrder: o.sortOrder ?? 0,
        isDefault: o.isDefault ?? false,
        isEnabled: o.isEnabled ?? true,
        inStock: o.inStock ?? true,
        leadTimeDays: o.leadTimeDays,
        previewImageUrl: o.previewImageUrl,
        metadata: (o.metadata || {}) as Prisma.InputJsonValue,
        priceDelta: (o.pricing as { value?: number })?.value ?? 0,
        pricingType: ((o.pricing as { type?: string })?.type ?? 'FIXED') as 'FIXED' | 'PERCENTAGE' | 'REPLACEMENT' | 'FORMULA',
      })),
    });
    this.logger.log(`Bulk created ${created.length} options`);
    return created;
  }

  async findAll(configurationId: string, componentId: string) {
    return this.prisma.configurator3DOption.findMany({
      where: { configurationId, componentId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(configurationId: string, componentId: string, id: string) {
    const option = await this.prisma.configurator3DOption.findFirst({
      where: { id, configurationId, componentId },
    });
    if (!option) {
      throw new NotFoundException(`Option with ID ${id} not found`);
    }
    return option;
  }

  @CacheInvalidate({ tags: (args) => [`configurator-3d:${args[0]}`] })
  async update(configurationId: string, componentId: string, id: string, dto: UpdateOptionDto) {
    await this.findOne(configurationId, componentId, id);
    return this.prisma.configurator3DOption.update({
      where: { id },
      data: dto as Prisma.Configurator3DOptionUpdateInput,
    });
  }

  @CacheInvalidate({ tags: (args) => [`configurator-3d:${args[0]}`] })
  async delete(configurationId: string, componentId: string, id: string) {
    await this.findOne(configurationId, componentId, id);
    await this.prisma.configurator3DOption.delete({ where: { id } });
    return { success: true, id };
  }
}
