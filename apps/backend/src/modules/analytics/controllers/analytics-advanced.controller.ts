/**
 * ★★★ CONTROLLER - ANALYTICS AVANCÉES ★★★
 * Controller NestJS pour analytics avancées
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Controller, Get, Post, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AnalyticsAdvancedService } from '../services/analytics-advanced.service';
import { CurrentUser } from '@/common/types/user.types';
import { Request as ExpressRequest } from 'express';

@ApiTags('Analytics Advanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsAdvancedController {
  constructor(private readonly analyticsAdvancedService: AnalyticsAdvancedService) {}

  @Get('funnel')
  @ApiOperation({ summary: 'Get funnel analysis data' })
  @ApiResponse({ status: 200, description: 'Funnel data retrieved successfully' })
  @ApiQuery({ name: 'funnelId', required: false, description: 'Funnel ID' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range (24h, 7d, 30d, 90d, 1y)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getFunnel(
    @Query('funnelId') funnelId: string | undefined,
    @Query('timeRange') timeRange: string | undefined,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('User must have a brandId');
    }

    // Calculer les dates
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (timeRange) {
      const now = new Date();
      end = now;
      switch (timeRange) {
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      const now = new Date();
      end = now;
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (funnelId) {
      // Récupérer les données d'un funnel spécifique
      const funnelData = await this.analyticsAdvancedService.getFunnelData(funnelId, brandId, {
        brandId,
        startDate: start,
        endDate: end,
      });
      return { success: true, data: funnelData };
    } else {
      // Récupérer tous les funnels
      const funnels = await this.analyticsAdvancedService.getFunnels(brandId);
      return { success: true, data: { funnels } };
    }
  }

  @Get('cohorts')
  @ApiOperation({ summary: 'Get cohort analysis data' })
  @ApiResponse({ status: 200, description: 'Cohort data retrieved successfully' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range (24h, 7d, 30d, 90d, 1y)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getCohorts(
    @Query('timeRange') timeRange: string | undefined,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('User must have a brandId');
    }

    // Calculer les dates
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (timeRange) {
      const now = new Date();
      end = now;
      switch (timeRange) {
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }
    } else {
      const now = new Date();
      end = now;
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const cohortAnalysis = await this.analyticsAdvancedService.getCohorts(brandId, {
      brandId,
      startDate: start,
      endDate: end,
    });

    return { success: true, data: cohortAnalysis };
  }

  @Get('segments')
  @ApiOperation({ summary: 'Get all segments' })
  @ApiResponse({ status: 200, description: 'Segments retrieved successfully' })
  async getSegments(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('User must have a brandId');
    }

    const segments = await this.analyticsAdvancedService.getSegments(brandId);
    return { success: true, data: { segments } };
  }

  @Post('segments')
  @ApiOperation({ summary: 'Create a new segment' })
  @ApiResponse({ status: 201, description: 'Segment created successfully' })
  async createSegment(
    @Body() body: { name: string; description?: string; criteria: Record<string, unknown> },
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('User must have a brandId');
    }

    const segment = await this.analyticsAdvancedService.createSegment(brandId, {
      name: body.name,
      description: body.description,
      criteria: body.criteria,
      isActive: true,
    });

    return { success: true, data: segment };
  }

  @Get('geographic')
  @ApiOperation({ summary: 'Get geographic analysis data' })
  @ApiResponse({ status: 200, description: 'Geographic data retrieved successfully' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range (24h, 7d, 30d, 90d, 1y)' })
  async getGeographic(
    @Query('timeRange') timeRange: string | undefined,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('User must have a brandId');
    }

    // Pour l'instant, retourner des données mockées structurées
    // TODO: Implémenter avec vraies données géographiques depuis AnalyticsEvent
    return {
      success: true,
      data: {
        countries: [
          { country: 'FR', users: 1250, revenue: 45230.50, conversion: 3.2 },
          { country: 'US', users: 890, revenue: 32150.00, conversion: 4.1 },
          { country: 'GB', users: 450, revenue: 18900.00, conversion: 2.8 },
        ],
      },
    };
  }

  @Get('events')
  @ApiOperation({ summary: 'Get behavioral events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range (24h, 7d, 30d, 90d, 1y)' })
  @ApiQuery({ name: 'eventType', required: false, description: 'Filter by event type' })
  async getEvents(
    @Query('timeRange') timeRange: string | undefined,
    @Query('eventType') eventType: string | undefined,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('User must have a brandId');
    }

    // Calculer les dates
    const now = new Date();
    let start: Date;
    switch (timeRange) {
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // TODO: Implémenter avec vraies données depuis AnalyticsEvent
    return {
      success: true,
      data: {
        events: [
          { type: 'click', count: 1250, timestamp: new Date() },
          { type: 'view', count: 3450, timestamp: new Date() },
          { type: 'conversion', count: 89, timestamp: new Date() },
        ],
      },
    };
  }
}



