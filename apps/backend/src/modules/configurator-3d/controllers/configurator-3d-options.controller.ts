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
import { Configurator3DOptionsService } from '../services/configurator-3d-options.service';
import { ConfiguratorPermission } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorRateLimit } from '../decorators/rate-limit-configurator.decorator';
import { ConfiguratorLoggingInterceptor } from '../interceptors';
import { CONFIGURATOR_3D_PERMISSIONS } from '../configurator-3d.constants';
import {
  CreateOptionDto,
  UpdateOptionDto,
  BulkCreateOptionsDto,
} from '../dto/options';

@ApiTags('configurator-3d-options')
@ApiBearerAuth()
@Controller('configurator-3d/configurations/:configurationId/components/:componentId/options')
@UseInterceptors(ConfiguratorLoggingInterceptor)
export class Configurator3DOptionsController {
  constructor(
    private readonly optionsService: Configurator3DOptionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.OPTION_CREATE)
  @ApiOperation({ summary: 'Create an option' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'componentId', description: 'Component ID' })
  @ApiResponse({ status: 201, description: 'Option created' })
  @ApiResponse({ status: 404, description: 'Configuration or component not found' })
  async create(
    @Param('configurationId') configurationId: string,
    @Param('componentId') componentId: string,
    @Body() dto: Omit<CreateOptionDto, 'componentId'>,
  ) {
    return this.optionsService.create(configurationId, componentId, dto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.OPTION_BULK_CREATE)
  @ConfiguratorRateLimit('BULK_OPERATIONS')
  @ApiOperation({ summary: 'Bulk create options' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'componentId', description: 'Component ID' })
  @ApiResponse({ status: 201, description: 'Options created' })
  @ApiResponse({ status: 404, description: 'Configuration or component not found' })
  async bulkCreate(
    @Param('configurationId') configurationId: string,
    @Param('componentId') componentId: string,
    @Body() dto: BulkCreateOptionsDto,
  ) {
    return this.optionsService.bulkCreate(configurationId, componentId, dto);
  }

  @Get()
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.OPTION_READ)
  @ApiOperation({ summary: 'List options' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'componentId', description: 'Component ID' })
  @ApiResponse({ status: 200, description: 'List of options' })
  async list(
    @Param('configurationId') configurationId: string,
    @Param('componentId') componentId: string,
  ) {
    return this.optionsService.findAll(configurationId, componentId);
  }

  @Get(':id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.OPTION_READ)
  @ApiOperation({ summary: 'Get one option' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'componentId', description: 'Component ID' })
  @ApiParam({ name: 'id', description: 'Option ID' })
  @ApiResponse({ status: 200, description: 'Option details' })
  @ApiResponse({ status: 404, description: 'Option not found' })
  async getOne(
    @Param('configurationId') configurationId: string,
    @Param('componentId') componentId: string,
    @Param('id') id: string,
  ) {
    return this.optionsService.findOne(configurationId, componentId, id);
  }

  @Put(':id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.OPTION_UPDATE)
  @ApiOperation({ summary: 'Update option' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'componentId', description: 'Component ID' })
  @ApiParam({ name: 'id', description: 'Option ID' })
  @ApiResponse({ status: 200, description: 'Option updated' })
  @ApiResponse({ status: 404, description: 'Option not found' })
  async update(
    @Param('configurationId') configurationId: string,
    @Param('componentId') componentId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.optionsService.update(configurationId, componentId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.OPTION_DELETE)
  @ApiOperation({ summary: 'Delete option' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'componentId', description: 'Component ID' })
  @ApiParam({ name: 'id', description: 'Option ID' })
  @ApiResponse({ status: 200, description: 'Option deleted' })
  @ApiResponse({ status: 404, description: 'Option not found' })
  async delete(
    @Param('configurationId') configurationId: string,
    @Param('componentId') componentId: string,
    @Param('id') id: string,
  ) {
    return this.optionsService.delete(configurationId, componentId, id);
  }
}
