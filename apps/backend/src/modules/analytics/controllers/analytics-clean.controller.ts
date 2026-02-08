import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AnalyticsCleanService } from '../services/analytics-clean.service';
import { TrackEventDto } from '../dto/track-event.dto';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { CurrentUser } from '@/common/types/user.types';

/**
 * Clean Analytics Controller - Minimaliste et performant
 * Focus sur l'essentiel : tracking, métriques, export
 */
@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics-clean')
export class AnalyticsCleanController {
  constructor(private readonly analyticsService: AnalyticsCleanService) {}

  @Post('events')
  @ApiOperation({ summary: 'Track an analytics event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(
    @Request() req: Express.Request & { user: CurrentUser },
    @Body() dto: TrackEventDto,
  ) {
    await this.analyticsService.trackEvent(
      req.user.brandId,
      req.user.id,
      dto,
    );
    return { success: true, message: 'Event tracked' };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get basic analytics metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getMetrics(
    @Request() req: Express.Request & { user: CurrentUser },
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getMetrics(req.user.brandId, query);
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Get time series data' })
  @ApiResponse({ status: 200, description: 'Time series data retrieved' })
  async getTimeSeries(
    @Request() req: Express.Request & { user: CurrentUser },
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getTimeSeries(req.user.brandId, query);
  }

  @Get('top-events')
  @ApiOperation({ summary: 'Get top events by count' })
  @ApiResponse({ status: 200, description: 'Top events retrieved' })
  async getTopEvents(
    @Request() req: Express.Request & { user: CurrentUser },
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getTopEvents(req.user.brandId, query, 10);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export events to CSV' })
  @ApiResponse({ status: 200, description: 'CSV export generated' })
  async exportEvents(
    @Request() req: Express.Request & { user: CurrentUser },
    @Query() query: AnalyticsQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.analyticsService.exportEvents(
      req.user.brandId,
      query,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}
