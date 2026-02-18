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
import { Configurator3DRulesService } from '../services/configurator-3d-rules.service';
import { ConfiguratorPermission } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorLoggingInterceptor } from '../interceptors';
import { CONFIGURATOR_3D_PERMISSIONS } from '../configurator-3d.constants';
import {
  CreateRuleDto,
  UpdateRuleDto,
  ValidateConfigurationDto,
} from '../dto/rules';

@ApiTags('configurator-3d-rules')
@ApiBearerAuth()
@Controller('configurator-3d/configurations/:configurationId/rules')
@UseInterceptors(ConfiguratorLoggingInterceptor)
export class Configurator3DRulesController {
  constructor(private readonly rulesService: Configurator3DRulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.RULE_CREATE)
  @ApiOperation({ summary: 'Create a rule' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async create(
    @Param('configurationId') configurationId: string,
    @User() user: CurrentUser,
    @Body() dto: Omit<CreateRuleDto, 'configurationId'>,
  ) {
    const brandId = user.brandId ?? '';
    const ruleDto = {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      conditions: dto.conditions.map((c) => ({ type: c.operator, componentId: c.componentId, optionId: c.optionId, value: c.value })),
      actions: dto.actions.map((a) => ({ type: a.action, componentId: a.targetComponentId, optionId: a.targetOptionId, value: a.value })),
      priority: dto.priority,
      isEnabled: dto.isEnabled,
      stopProcessing: dto.stopProcessing,
    };
    return this.rulesService.create(configurationId, brandId, ruleDto);
  }

  @Get()
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.RULE_READ)
  @ApiOperation({ summary: 'List rules' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'List of rules' })
  async list(
    @Param('configurationId') configurationId: string,
    @User() user: CurrentUser,
  ) {
    const brandId = user.brandId ?? '';
    return this.rulesService.findAll(configurationId, brandId);
  }

  @Get(':id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.RULE_READ)
  @ApiOperation({ summary: 'Get one rule' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({ status: 200, description: 'Rule details' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async getOne(
    @Param('configurationId') configurationId: string,
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    const brandId = user.brandId ?? '';
    return this.rulesService.findOne(configurationId, id, brandId);
  }

  @Put(':id')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Update rule' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({ status: 200, description: 'Rule updated' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async update(
    @Param('configurationId') configurationId: string,
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() dto: UpdateRuleDto,
  ) {
    const brandId = user.brandId ?? '';
    const updateDto = dto as Partial<import('../services/configurator-3d-rules.service').CreateRuleDto>;
    if (dto.conditions) {
      (updateDto as { conditions?: unknown }).conditions = dto.conditions.map((c) => ({ type: c.operator, componentId: c.componentId, optionId: c.optionId, value: c.value }));
    }
    if (dto.actions) {
      (updateDto as { actions?: unknown }).actions = dto.actions.map((a) => ({ type: a.action, componentId: a.targetComponentId, optionId: a.targetOptionId, value: a.value }));
    }
    return this.rulesService.update(configurationId, id, brandId, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.RULE_DELETE)
  @ApiOperation({ summary: 'Delete rule' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({ status: 200, description: 'Rule deleted' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async delete(
    @Param('configurationId') configurationId: string,
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    const brandId = user.brandId ?? '';
    return this.rulesService.delete(configurationId, id, brandId);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.RULE_READ)
  @ApiOperation({ summary: 'Validate configuration against rules' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validate(
    @Param('configurationId') configurationId: string,
    @Body() dto: ValidateConfigurationDto,
  ) {
    return this.rulesService.validate(configurationId, dto);
  }
}
