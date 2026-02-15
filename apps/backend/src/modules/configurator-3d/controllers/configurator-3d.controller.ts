import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '@/common/types/user.types';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Configurator3DService } from '../services/configurator-3d.service';
import { Configurator3DSessionService } from '../services/configurator-3d-session.service';
import { CreateConfigurator3DConfigurationDto } from '../dto/create-configurator-3d.dto';
import { UpdateConfigurator3DConfigurationDto } from '../dto/update-configurator-3d.dto';
import { AddOptionDto } from '../dto/add-option.dto';

@ApiTags('configurator-3d')
@ApiBearerAuth()
@Controller('configurator-3d')
@UseGuards(JwtAuthGuard)
export class Configurator3DController {
  constructor(
    private readonly configuratorService: Configurator3DService,
    private readonly sessionService: Configurator3DSessionService,
  ) {}

  // ========================================
  // ANALYTICS ENDPOINT
  // ========================================

  @Get('analytics')
  @ApiOperation({ summary: 'Get configurator 3D analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data returned' })
  async getAnalytics(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    const user = req.user;
    const brandId = user?.brandId;
    return this.sessionService.getAnalytics(brandId, days ?? 30);
  }

  // ========================================
  // CONFIGURATIONS ENDPOINTS
  // ========================================

  @Get('configurations')
  @ApiOperation({
    summary: 'Liste les configurations 3D d\'un projet',
  })
  @ApiParam({ name: 'projectId', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Liste des configurations récupérée avec succès',
  })
  async findAllConfigurations(
    @Query('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (!projectId) {
      return { data: [], total: 0, page: 1, limit: 20 };
    }
    return this.configuratorService.findAll(projectId, { page, limit });
  }

  @Get('configurations/:id')
  @ApiOperation({
    summary: 'Récupère une configuration par son ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async findOneConfiguration(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.configuratorService.findOne(id, projectId);
  }

  @Post('configurations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée une nouvelle configuration 3D',
  })
  async createConfiguration(
    @Body() dto: CreateConfigurator3DConfigurationDto,
    @Query('projectId') projectId: string,
  ) {
    return this.configuratorService.create(projectId, dto);
  }

  @Patch('configurations/:id')
  @ApiOperation({
    summary: 'Met à jour une configuration',
  })
  async updateConfiguration(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @Body() dto: UpdateConfigurator3DConfigurationDto,
  ) {
    return this.configuratorService.update(id, projectId, dto);
  }

  @Delete('configurations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprime une configuration',
  })
  async removeConfiguration(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.configuratorService.remove(id, projectId);
  }

  @Post('configurations/:id/options')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajoute une option à une configuration',
  })
  async addOption(
    @Param('id') configId: string,
    @Query('projectId') projectId: string,
    @Body() dto: AddOptionDto,
  ) {
    return this.configuratorService.addOption(configId, projectId, dto);
  }

  @Delete('configurations/:id/options/:optionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retire une option d\'une configuration',
  })
  async removeOption(
    @Param('id') configId: string,
    @Query('projectId') projectId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.configuratorService.removeOption(configId, projectId, optionId);
  }

  // ========================================
  // SESSIONS ENDPOINTS
  // ========================================

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Démarre une nouvelle session configurator',
  })
  async startSession(
    @Body()
    body: {
      configurationId: string;
      visitorId: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    return this.sessionService.startSession(
      body.configurationId,
      body.visitorId,
      body.deviceInfo,
    );
  }

  @Get('sessions/:sessionId')
  @ApiOperation({
    summary: 'Récupère une session par son ID',
  })
  async findOneSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.findOne(sessionId);
  }

  @Patch('sessions/:sessionId')
  @ApiOperation({
    summary: 'Met à jour l\'état d\'une session',
  })
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body()
    body: {
      state: Record<string, unknown>;
      previewImageUrl?: string;
    },
  ) {
    return this.sessionService.updateSession(
      sessionId,
      body.state,
      body.previewImageUrl,
    );
  }

  @Post('sessions/:sessionId/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sauvegarde une session',
  })
  async saveSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.saveSession(sessionId);
  }
}
