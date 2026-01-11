/**
 * @fileoverview Controller pour les analytics prédictives
 * @module PredictiveController
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { PredictiveService } from '../services/predictive.service';

@ApiTags('Analytics - Predictive')
@ApiBearerAuth()
@Controller('analytics/predictive')
@UseGuards(JwtAuthGuard)
export class PredictiveController {
  constructor(private readonly predictiveService: PredictiveService) {}

  @Get('trends')
  @ApiOperation({ summary: 'Prédictions de tendances' })
  async getTrends(
    @CurrentBrand() brand: { id: string } | null,
    @Query('horizon') horizon: '7d' | '30d' | '90d' = '30d',
  ) {
    if (!brand) {
      throw new Error('Brand not found');
    }

    const trends = await this.predictiveService.getTrendPredictions(brand.id, horizon);

    return {
      success: true,
      data: { trends },
    };
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Détection d\'anomalies' })
  async getAnomalies(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new Error('Brand not found');
    }

    const anomalies = await this.predictiveService.detectAnomalies(brand.id);

    return {
      success: true,
      data: { anomalies },
    };
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Recommandations IA' })
  async getRecommendations(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new Error('Brand not found');
    }

    const recommendations = await this.predictiveService.getRecommendations(brand.id);

    return {
      success: true,
      data: { recommendations },
    };
  }

  @Get('seasonal-events')
  @ApiOperation({ summary: 'Événements saisonniers à venir' })
  async getSeasonalEvents(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new Error('Brand not found');
    }

    const events = await this.predictiveService.getUpcomingSeasonalEvents(brand.id);

    return {
      success: true,
      data: { events },
    };
  }
}
