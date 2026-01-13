/**
 * @fileoverview Controller pour les analytics prédictives
 * @module PredictiveController
 */

import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { PredictiveService } from '../services/predictive.service';
import { MLPredictionService } from '../services/ml-prediction.service';

@ApiTags('Analytics - Predictive')
@ApiBearerAuth()
@Controller('analytics/predictive')
@UseGuards(JwtAuthGuard)
export class PredictiveController {
  constructor(
    private readonly predictiveService: PredictiveService,
    private readonly mlPredictionService: MLPredictionService,
  ) {}

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

  @Post('ml/predict')
  @ApiOperation({ summary: 'Prédiction ML (churn, LTV, conversion, revenue)' })
  async predictML(
    @CurrentBrand() brand: { id: string } | null,
    @Body() body: {
      type: 'churn' | 'ltv' | 'conversion' | 'revenue';
      userId?: string;
      features?: Record<string, any>;
    },
  ) {
    if (!brand) {
      throw new Error('Brand not found');
    }

    let result;
    switch (body.type) {
      case 'churn':
        result = await this.mlPredictionService.predictChurn({
          type: 'churn',
          brandId: brand.id,
          userId: body.userId,
          features: body.features,
        });
        break;
      case 'ltv':
        result = await this.mlPredictionService.predictLTV({
          type: 'ltv',
          brandId: brand.id,
          userId: body.userId,
          features: body.features,
        });
        break;
      case 'conversion':
        result = await this.mlPredictionService.predictConversion({
          type: 'conversion',
          brandId: brand.id,
          userId: body.userId,
          features: body.features,
        });
        break;
      case 'revenue':
        result = await this.mlPredictionService.predictRevenue({
          type: 'revenue',
          brandId: brand.id,
          userId: body.userId,
          features: body.features,
        });
        break;
      default:
        throw new Error(`Unknown prediction type: ${body.type}`);
    }

    return {
      success: true,
      data: result,
    };
  }
}
