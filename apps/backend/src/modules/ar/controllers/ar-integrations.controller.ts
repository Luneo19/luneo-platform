/**
 * ★★★ CONTROLLER - AR INTEGRATIONS ★★★
 * Controller NestJS pour les intégrations AR
 * Respecte la Bible Luneo : validation Zod, ApiResponseBuilder, error handling
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ArIntegrationsService } from '../services/ar-integrations.service';
import { CurrentUser } from '@/common/types/user.types';
import { User } from '@/common/decorators/user.decorator';
import { CreateIntegrationDto } from '../dto/create-integration.dto';
import { UpdateIntegrationDto } from '../dto/update-integration.dto';

@ApiTags('AR Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ar-studio/integrations')
export class ArIntegrationsController {
  constructor(private readonly arIntegrationsService: ArIntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all AR integrations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of integrations' })
  async listIntegrations(@User() user: CurrentUser) {
    if (!user.brandId) {
      if (user.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arIntegrationsService.listIntegrations(user.brandId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Integration details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Integration not found' })
  async getIntegration(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      if (user.role === 'PLATFORM_ADMIN') {
        return null;
      }
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arIntegrationsService.getIntegration(id, user.brandId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new integration' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Integration created' })
  @HttpCode(HttpStatus.CREATED)
  async createIntegration(
    @Body() dto: CreateIntegrationDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arIntegrationsService.createIntegration(user.brandId, {
      ...dto,
      syncStatus: dto.syncStatus || 'idle',
      settings: dto.settings || {},
      isActive: dto.isActive ?? true,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Integration updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Integration not found' })
  async updateIntegration(
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arIntegrationsService.updateIntegration(id, user.brandId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Integration deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Integration not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIntegration(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    await this.arIntegrationsService.deleteIntegration(id, user.brandId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test integration connection' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connection test result' })
  async testConnection(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arIntegrationsService.testConnection(id, user.brandId);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiQuery({ name: 'type', enum: ['manual', 'scheduled'], required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sync started' })
  async syncIntegration(
    @Param('id') id: string,
    @Query('type') type: 'manual' | 'scheduled' = 'manual',
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arIntegrationsService.syncIntegration(id, user.brandId, type);
  }

  @Get(':id/sync-history')
  @ApiOperation({ summary: 'Get sync history for an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sync history' })
  async getSyncHistory(
    @Param('id') id: string,
    @Query('limit') limit: string,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      if (user.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arIntegrationsService.getSyncHistory(id, user.brandId, limit ? parseInt(limit, 10) : 20);
  }
}


