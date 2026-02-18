import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { User } from '@/common/decorators/user.decorator';
import type { CurrentUser } from '@/common/types/user.types';
import { Configurator3DComponentsService } from '../services/configurator-3d-components.service';
import { ConfiguratorPermission } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorRateLimit } from '../decorators/rate-limit-configurator.decorator';
import { ConfiguratorLoggingInterceptor } from '../interceptors';
import { CONFIGURATOR_3D_PERMISSIONS } from '../configurator-3d.constants';
import {
  CreateComponentDto,
  UpdateComponentDto,
  BulkCreateComponentsDto,
  ReorderComponentsDto,
} from '../dto/components';

@ApiTags('configurator-3d-components')
@ApiBearerAuth()
@Controller('configurator-3d/configurations/:configurationId/components')
@UseInterceptors(ConfiguratorLoggingInterceptor)
export class Configurator3DComponentsController {
  constructor(
    private readonly componentsService: Configurator3DComponentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.COMPONENT_CREATE)
  @ApiOperation({ summary: 'Create a component' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 201, description: 'Component created' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async create(
    @Param('configurationId') configurationId: string,
    @User() user: CurrentUser,
    @Body() dto: Omit<CreateComponentDto, 'configurationId'>,
  ) {
    const brandId = user.brandId ?? '';
    const componentDto = {
      name: dto.name,
      technicalId: dto.technicalId,
      description: dto.description,
      type: dto.type,
      meshName: (dto as { meshName?: string }).meshName,
      selectionMode: dto.selectionMode,
      isRequired: (dto as { isRequired?: boolean }).isRequired,
      minSelections: (dto as { minSelections?: number }).minSelections,
      maxSelections: (dto as { maxSelections?: number }).maxSelections,
      sortOrder: dto.sortOrder,
      isVisible: dto.isVisible,
      isOptional: (dto as { isOptional?: boolean }).isOptional,
      isEnabled: dto.isEnabled,
      groupId: (dto as { groupId?: string }).groupId,
      settings: (dto as { settings?: Record<string, unknown> }).settings,
      bounds: (dto as unknown as { bounds?: Record<string, unknown> }).bounds,
    };
    return this.componentsService.create(configurationId, brandId, componentDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.COMPONENT_CREATE)
  @ConfiguratorRateLimit('BULK_OPERATIONS')
  @ApiOperation({ summary: 'Bulk create components' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 201, description: 'Components created' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async bulkCreate(
    @Param('configurationId') configurationId: string,
    @User() user: CurrentUser,
    @Body() dto: BulkCreateComponentsDto,
  ) {
    const brandId = user.brandId ?? '';
    const dtos = dto.components.map((c) => ({
      name: c.name,
      technicalId: c.technicalId,
      description: c.description,
      type: c.type,
      meshName: (c as { meshName?: string }).meshName,
      selectionMode: c.selectionMode,
      isRequired: (c as { isRequired?: boolean }).isRequired,
      minSelections: (c as { minSelections?: number }).minSelections,
      maxSelections: (c as { maxSelections?: number }).maxSelections,
      sortOrder: c.sortOrder,
      isVisible: c.isVisible,
      isOptional: (c as { isOptional?: boolean }).isOptional,
      isEnabled: c.isEnabled,
      groupId: (c as { groupId?: string }).groupId,
      settings: (c as { settings?: Record<string, unknown> }).settings,
      bounds: (c as unknown as { bounds?: Record<string, unknown> }).bounds,
    }));
    return this.componentsService.bulkCreate(configurationId, brandId, dtos);
  }

  @Get()
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.COMPONENT_READ)
  @ApiOperation({ summary: 'List components' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'List of components' })
  async list(
    @Param('configurationId') configurationId: string,
    @User() user: CurrentUser,
  ) {
    const brandId = user.brandId ?? '';
    return this.componentsService.findAll(configurationId, brandId);
  }

  @Get(':id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.COMPONENT_READ)
  @ApiOperation({ summary: 'Get one component' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({ status: 200, description: 'Component details' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async getOne(
    @Param('configurationId') configurationId: string,
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    const brandId = user.brandId ?? '';
    return this.componentsService.findOne(configurationId, id, brandId);
  }

  @Put(':id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.COMPONENT_UPDATE)
  @ApiOperation({ summary: 'Update component' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({ status: 200, description: 'Component updated' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async update(
    @Param('configurationId') configurationId: string,
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() dto: UpdateComponentDto,
  ) {
    const brandId = user.brandId ?? '';
    const updateDto = { ...dto } as Record<string, unknown>;
    if (dto.bounds) updateDto.bounds = dto.bounds as unknown as Record<string, unknown>;
    return this.componentsService.update(configurationId, id, brandId, updateDto as Parameters<Configurator3DComponentsService['update']>[3]);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.COMPONENT_DELETE)
  @ApiOperation({ summary: 'Delete component' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({ status: 200, description: 'Component deleted' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async delete(
    @Param('configurationId') configurationId: string,
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    const brandId = user.brandId ?? '';
    return this.componentsService.delete(configurationId, id, brandId);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.COMPONENT_REORDER)
  @ApiOperation({ summary: 'Reorder components' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Components reordered' })
  async reorder(
    @Param('configurationId') configurationId: string,
    @User() user: CurrentUser,
    @Body() dto: ReorderComponentsDto,
  ) {
    const brandId = user.brandId ?? '';
    const order = dto.items.map((item) => ({
      componentId: item.id,
      sortOrder: item.sortOrder,
    }));
    return this.componentsService.reorder(configurationId, brandId, order);
  }
}
