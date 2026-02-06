import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GenerationService } from './generation.service';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { GenerationResponseDto } from './dto/generation-response.dto';
import { ApiKeyGuard } from '../public-api/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('Generation')
@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  /**
   * Endpoint pour le widget (utilise API Key)
   */
  @Post('create')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Créer une génération depuis le widget' })
  @ApiResponse({ status: 201, type: GenerationResponseDto })
  async createFromWidget(
    @Body() dto: CreateGenerationDto,
    @Req() req: ExpressRequest & { brandId?: string; apiKey?: any },
  ): Promise<GenerationResponseDto> {
    const clientId = req.brandId;
    if (!clientId) {
      throw new BadRequestException('Brand ID not found in request');
    }

    return this.generationService.create({
      ...dto,
      clientId,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'],
      },
    });
  }

  /**
   * Endpoint pour le dashboard (utilise JWT)
   */
  @Post('dashboard/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une génération depuis le dashboard' })
  async createFromDashboard(
    @Body() dto: CreateGenerationDto,
    @Req() req: ExpressRequest & { user?: any },
  ): Promise<GenerationResponseDto> {
    const clientId = req.user?.brandId;
    if (!clientId) {
      throw new BadRequestException('Brand ID not found in user context');
    }

    return this.generationService.create({
      ...dto,
      clientId,
      metadata: {
        source: 'dashboard',
      },
    });
  }

  /**
   * Récupérer le statut d'une génération
   */
  @Get(':publicId/status')
  @ApiOperation({ summary: 'Récupérer le statut d\'une génération' })
  async getStatus(
    @Param('publicId') publicId: string,
  ): Promise<{ status: string; progress?: number; result?: any; error?: string }> {
    return this.generationService.getStatus(publicId);
  }

  /**
   * Récupérer le résultat complet
   */
  @Get(':publicId')
  @ApiOperation({ summary: 'Récupérer une génération complète' })
  async getGeneration(
    @Param('publicId') publicId: string,
  ): Promise<GenerationResponseDto> {
    return this.generationService.findByPublicId(publicId);
  }

  /**
   * Récupérer les données AR
   */
  @Get(':publicId/ar')
  @ApiOperation({ summary: 'Récupérer les données AR' })
  async getArData(@Param('publicId') publicId: string) {
    return this.generationService.getArData(publicId);
  }

  /**
   * Historique des générations (dashboard)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des générations' })
  async findAll(
    @Req() req: ExpressRequest & { user?: any },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
  ) {
    const clientId = req.user?.brandId;
    if (!clientId) {
      throw new BadRequestException('Brand ID not found in user context');
    }

    return this.generationService.findAll({
      clientId,
      page,
      limit,
      productId,
      status,
    });
  }
}

