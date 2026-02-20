/**
 * AI Studio - Generations API (list, get, delete)
 * Delegates to GenerationService; used by frontend at /api/v1/ai-studio/generations
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GenerationService } from '@/modules/generation/generation.service';
import { AIStudioService } from '../services/ai-studio.service';
import { AIGenerationType, AIGenerationParams } from '../interfaces/ai-studio.interface';
import { Request as ExpressRequest } from 'express';

@ApiTags('AI Studio - Generations')
@Controller('ai-studio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIGenerationsController {
  constructor(
    private readonly generationService: GenerationService,
    private readonly aiStudioService: AIStudioService,
  ) {}

  @Post('generations')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new AI generation' })
  async createGeneration(
    @Req() req: ExpressRequest & { user?: { brandId?: string; userId?: string; sub?: string; id?: string } },
    @Body()
    body: {
      type: string;
      prompt: string;
      model: string;
      negativePrompt?: string;
      provider?: string;
      parameters?: Record<string, unknown>;
      status?: string;
      credits?: number;
      costCents?: number;
    },
  ) {
    const brandId = req.user?.brandId;
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    if (!brandId || !userId) {
      throw new BadRequestException('Brand ID and User ID required');
    }
    const typeMap: Record<string, AIGenerationType> = {
      IMAGE_2D: 'IMAGE_2D' as AIGenerationType,
      MODEL_3D: 'MODEL_3D' as AIGenerationType,
      ANIMATION: 'ANIMATION' as AIGenerationType,
      TEMPLATE: 'TEMPLATE' as AIGenerationType,
    };
    const generationType = typeMap[body.type] ?? ('IMAGE_2D' as AIGenerationType);
    const params: AIGenerationParams = {
      ...(body.parameters ?? {}),
      negativePrompt: body.negativePrompt,
    } as AIGenerationParams;

    const generation = await this.aiStudioService.generate(
      userId,
      brandId,
      generationType,
      body.prompt,
      body.model,
      params,
    );
    return generation;
  }

  @Get('generations')
  @ApiOperation({ summary: 'List generations for the current brand' })
  async listGenerations(
    @Req() req: ExpressRequest & { user?: { brandId?: string; userId?: string; sub?: string; role?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) {
      if (req.user?.role === 'PLATFORM_ADMIN') {
        return {
          generations: [],
          data: [],
          total: 0,
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        };
      }
      throw new BadRequestException('Brand ID not found in user context');
    }
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
    const result = await this.generationService.findAll({
      clientId: brandId,
      page: pageNum,
      limit: limitNum,
      productId,
      status,
    });
    return {
      generations: result.data,
      data: result.data,
      total: result.pagination?.total ?? result.data?.length ?? 0,
      pagination: result.pagination,
    };
  }

  @Get('generations/:id')
  @ApiOperation({ summary: 'Get a generation by id or publicId' })
  async getGeneration(
    @Param('id') id: string,
    @Req() req: ExpressRequest & { user?: { brandId?: string; id?: string; role?: string } },
  ) {
    try {
      const generation = await this.generationService.findByPublicId(id);
      // SECURITY FIX: Verify generation belongs to user's brand (prevent IDOR)
      if (req.user?.brandId && (generation as Record<string, unknown>).brandId && (generation as Record<string, unknown>).brandId !== req.user.brandId) {
        if (req.user.role !== 'PLATFORM_ADMIN') {
          throw new NotFoundException('Generation not found');
        }
      }
      return generation;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException('Generation not found');
    }
  }

  @Delete('generations/:id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete a generation' })
  async deleteGeneration(
    @Param('id') id: string,
    @Req() req: ExpressRequest & { user?: { brandId?: string } },
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) {
      throw new BadRequestException('Brand ID not found in user context');
    }
    return this.generationService.deleteGeneration(id, brandId);
  }
}
