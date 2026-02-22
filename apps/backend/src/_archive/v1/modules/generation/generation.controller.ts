import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GenerationService } from './generation.service';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { GenerationResponseDto } from './dto/generation-response.dto';
import { Public } from '@/common/decorators/public.decorator';
import { ApiKeyGuard } from '../public-api/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('Generation')
@Controller('generation')
@UseGuards(JwtAuthGuard)
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  /**
   * Endpoint pour le widget (utilise API Key)
   */
  @Post('create')
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Créer une génération depuis le widget' })
  @ApiResponse({ status: 201, type: GenerationResponseDto })
  async createFromWidget(
    @Body() dto: CreateGenerationDto,
    @Req() req: ExpressRequest & { brandId?: string; apiKey?: unknown },
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Créer une génération depuis le dashboard' })
  async createFromDashboard(
    @Body() dto: CreateGenerationDto,
    @Req() req: ExpressRequest & { user?: { brandId?: string } },
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
  @Public()
  @ApiOperation({ summary: 'Récupérer le statut d\'une génération' })
  async getStatus(
    @Param('publicId') publicId: string,
  ): Promise<{ status: string; progress?: number; result?: Record<string, unknown>; error?: string; errorCode?: string }> {
    const s = await this.generationService.getStatus(publicId);
    return {
      status: s.status,
      progress: (s as { progress?: number }).progress,
      result: s.result ?? undefined,
      error: s.error ? 'Generation failed' : undefined,
      errorCode: s.error ? 'GENERATION_FAILED' : undefined,
    };
  }

  /**
   * Récupérer le résultat complet
   */
  @Get(':publicId')
  @Public()
  @ApiOperation({ summary: 'Récupérer une génération complète' })
  async getGeneration(
    @Param('publicId') publicId: string,
  ): Promise<GenerationResponseDto> {
    const g = await this.generationService.findByPublicId(publicId);
    return {
      ...g,
      result: g.result ? { imageUrl: g.result.imageUrl ?? '', thumbnailUrl: g.result.thumbnailUrl ?? undefined } : undefined,
    } as GenerationResponseDto;
  }

  /**
   * Récupérer les données AR
   */
  @Get(':publicId/ar')
  @Public()
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
    @Req() req: ExpressRequest & { user?: { brandId?: string } },
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

