import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@/common/decorators/user.decorator';
import type { CurrentUser } from '@/common/types/user.types';
import { Configurator3DService } from '../services/configurator-3d.service';
import { Configurator3DRulesService } from '../services/configurator-3d-rules.service';
import { ConfiguratorPermission } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorPublicAccess } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorRateLimit } from '../decorators/rate-limit-configurator.decorator';
import { ConfiguratorLoggingInterceptor } from '../interceptors';
import { CONFIGURATOR_3D_PERMISSIONS } from '../configurator-3d.constants';
import {
  CreateConfigurationDto,
  UpdateConfigurationDto,
  CloneConfigurationDto,
  ConfigurationQueryDto,
} from '../dto/configuration';
import { ValidateConfigurationDto } from '../dto/rules';

@ApiTags('configurator-3d')
@Controller('configurator-3d')
@UseInterceptors(ConfiguratorLoggingInterceptor)
export class Configurator3DController {
  constructor(
    private readonly configuratorService: Configurator3DService,
    private readonly rulesService: Configurator3DRulesService,
  ) {}

  @Post('configurations')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new 3D configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @User() user: CurrentUser,
    @Body() dto: CreateConfigurationDto,
  ) {
    const brandId = user.brandId ?? '';
    const createDto = {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      modelUrl: dto.modelUrl,
      thumbnailUrl: dto.thumbnailUrl,
      sceneConfig: dto.sceneSettings as Record<string, unknown>,
      uiConfig: {},
      pricingSettings: dto.pricingSettings as Record<string, unknown>,
      productId: dto.productId,
    };
    return this.configuratorService.create(brandId, createDto, user);
  }

  @Get('configurations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all configurations' })
  @ApiResponse({ status: 200, description: 'List of configurations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @User() user: CurrentUser,
    @Query() query: ConfigurationQueryDto,
  ) {
    const brandId = user.brandId ?? '';
    const params = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      type: query.type,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    return this.configuratorService.findAll(brandId, params);
  }

  @Get('configurations/:id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_READ)
  @ApiOperation({ summary: 'Get one configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration details' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getOne(@Param('id') id: string, @User() user: CurrentUser) {
    const brandId = user.brandId ?? '';
    return this.configuratorService.findOne(id, brandId);
  }

  @Get('public/configurations/:id')
  @ConfiguratorPublicAccess()
  @ConfiguratorRateLimit('PUBLIC_CONFIGURATION_READ')
  @ApiOperation({ summary: 'Get public configuration (widget/embed)' })
  @ApiParam({ name: 'id', description: 'Configuration ID or slug' })
  @ApiResponse({ status: 200, description: 'Public configuration' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getPublic(@Param('id') id: string) {
    return this.configuratorService.findOnePublic(id);
  }

  @Put('configurations/:id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_UPDATE)
  @ApiOperation({ summary: 'Full update of configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async fullUpdate(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() dto: UpdateConfigurationDto,
  ) {
    const brandId = user.brandId ?? '';
    const updateDto = {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      modelUrl: dto.modelUrl,
      thumbnailUrl: dto.thumbnailUrl,
      sceneConfig: dto.sceneSettings as Record<string, unknown>,
      pricingSettings: dto.pricingSettings as Record<string, unknown>,
      productId: dto.productId,
    };
    return this.configuratorService.update(id, brandId, updateDto);
  }

  @Patch('configurations/:id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_UPDATE)
  @ApiOperation({ summary: 'Partial update of configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async partialUpdate(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() dto: Partial<UpdateConfigurationDto>,
  ) {
    const brandId = user.brandId ?? '';
    const updateDto = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.modelUrl !== undefined && { modelUrl: dto.modelUrl }),
      ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
      ...(dto.sceneSettings !== undefined && { sceneConfig: dto.sceneSettings as Record<string, unknown> }),
      ...(dto.pricingSettings !== undefined && { pricingSettings: dto.pricingSettings as Record<string, unknown> }),
      ...(dto.productId !== undefined && { productId: dto.productId }),
    };
    return this.configuratorService.patch(id, brandId, updateDto);
  }

  @Delete('configurations/:id')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_DELETE)
  @ApiOperation({ summary: 'Delete configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration deleted' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async delete(@Param('id') id: string, @User() user: CurrentUser) {
    const brandId = user.brandId ?? '';
    return this.configuratorService.delete(id, brandId);
  }

  @Post('configurations/:id/clone')
  @HttpCode(HttpStatus.CREATED)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_CLONE)
  @ApiOperation({ summary: 'Clone configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 201, description: 'Configuration cloned' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async clone(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() dto: CloneConfigurationDto,
  ) {
    const brandId = user.brandId ?? '';
    return this.configuratorService.clone(id, brandId, dto.newName);
  }

  @Post('configurations/:id/publish')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_PUBLISH)
  @ApiOperation({ summary: 'Publish configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration published' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async publish(@Param('id') id: string, @User() user: CurrentUser) {
    const brandId = user.brandId ?? '';
    return this.configuratorService.publish(id, brandId);
  }

  @Post('configurations/:id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_PUBLISH)
  @ApiOperation({ summary: 'Unpublish configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration unpublished' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async unpublish(@Param('id') id: string, @User() user: CurrentUser) {
    const brandId = user.brandId ?? '';
    return this.configuratorService.unpublish(id, brandId);
  }

  @Post('configurations/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_DELETE)
  @ApiOperation({ summary: 'Archive configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Configuration archived' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async archive(@Param('id') id: string, @User() user: CurrentUser) {
    const brandId = user.brandId ?? '';
    return this.configuratorService.archive(id, brandId);
  }

  @Post('configurations/:id/validate')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_READ)
  @ApiOperation({ summary: 'Validate configuration against rules' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async validate(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() dto: ValidateConfigurationDto,
  ) {
    return this.rulesService.validate(id, dto);
  }

  @Get('configurations/:id/embed')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.CONFIGURATION_READ)
  @ApiOperation({ summary: 'Get embed code for configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Embed code' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getEmbed(@Param('id') id: string, @User() user: CurrentUser) {
    const brandId = user.brandId ?? '';
    const config = await this.configuratorService.findOne(id, brandId);
    const baseUrl = process.env.API_URL || process.env.PUBLIC_URL || 'https://app.luneo.io';
    const result = this.configuratorService.getEmbedCode(
      { slug: config.slug, id: config.id },
      baseUrl,
    );
    return {
      iframe: result.iframe,
      script: result.script,
      embedUrl: result.directUrl,
    };
  }
}
