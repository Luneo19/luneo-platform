/**
 * AI Studio - Generations API (list, get, delete)
 * Delegates to GenerationService; used by frontend at /api/v1/ai-studio/generations
 */

import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GenerationService } from '@/modules/generation/generation.service';
import { Request as ExpressRequest } from 'express';

@ApiTags('AI Studio - Generations')
@Controller('ai-studio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIGenerationsController {
  constructor(private readonly generationService: GenerationService) {}

  @Get('generations')
  @ApiOperation({ summary: 'List generations for the current brand' })
  async listGenerations(
    @Req() req: ExpressRequest & { user?: { brandId?: string; userId?: string; sub?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) {
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
  ) {
    try {
      return await this.generationService.findByPublicId(id);
    } catch {
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
