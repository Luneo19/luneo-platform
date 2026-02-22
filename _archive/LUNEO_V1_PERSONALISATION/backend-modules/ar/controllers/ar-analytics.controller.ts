/**
 * AR Studio - Analytics Controller
 * Dashboard, sessions, conversions, heatmaps, performance, platforms
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ARPlanGuard } from '@/common/guards/ar-plan.guard';
import { User } from '@/common/decorators/user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { ArAnalyticsService } from '../analytics/ar-analytics.service';
import { SessionTrackerService } from '../analytics/session-tracker.service';
import { EngagementCalculatorService } from '../analytics/engagement-calculator.service';
import { ConversionTrackerService } from '../analytics/conversion-tracker.service';
import { HeatmapGeneratorService } from '../analytics/heatmap-generator.service';
import type { Period } from '../analytics/ar-analytics.service';

@ApiTags('AR Studio - Analytics')
@Controller('ar-studio/analytics')
@UseGuards(JwtAuthGuard, ARPlanGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class ArAnalyticsController {
  private readonly logger = new Logger(ArAnalyticsController.name);

  constructor(
    private readonly arAnalytics: ArAnalyticsService,
    private readonly sessionTracker: SessionTrackerService,
    private readonly engagementCalculator: EngagementCalculatorService,
    private readonly conversionTracker: ConversionTrackerService,
    private readonly heatmapGenerator: HeatmapGeneratorService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Global dashboard KPIs' })
  async getDashboard(
    @User() user: CurrentUser,
    @Query('period') period?: string,
    @Query('projectId') projectId?: string,
  ) {
    const brandId = user.brandId ?? '';
    const p = (period === '7d' || period === '90d' ? period : '30d') as Period;
    return this.arAnalytics.getDashboard(brandId, p, projectId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Sessions with filters' })
  async getSessions(
    @User() user: CurrentUser,
    @Query('projectId') projectId: string,
    @Query('period') period?: string,
  ) {
    const brandId = user.brandId ?? '';
    const p = (period === '7d' || period === '90d' ? period : '30d') as Period;
    return this.arAnalytics.getSessionStats(projectId, brandId, p);
  }

  @Get('conversions')
  @ApiOperation({ summary: 'Conversion funnel' })
  async getConversions(
    @User() user: CurrentUser,
    @Query('projectId') projectId: string,
    @Query('period') period?: string,
  ) {
    const brandId = user.brandId ?? '';
    const p = (period === '7d' || period === '90d' ? period : '30d') as Period;
    const { from, to } = this.parsePeriod(p);
    return this.conversionTracker.getConversionFunnel(projectId, brandId, { from, to });
  }

  @Get('heatmaps/:modelId')
  @ApiOperation({ summary: 'Heatmap per model' })
  async getHeatmaps(
    @User() user: CurrentUser,
    @Query('projectId') projectId: string,
    @Param('modelId') modelId: string,
    @Query('period') period?: string,
  ) {
    const brandId = user.brandId ?? '';
    const p = (period === '7d' || period === '90d' ? period : '30d') as Period;
    const { from, to } = this.parsePeriod(p);
    return this.heatmapGenerator.getHeatmapData(projectId, modelId, brandId, { from, to });
  }

  @Get('performance')
  @ApiOperation({ summary: 'Performance metrics' })
  async getPerformance(
    @User() user: CurrentUser,
    @Query('projectId') projectId: string,
    @Query('period') period?: string,
  ) {
    const brandId = user.brandId ?? '';
    const p = (period === '7d' || period === '90d' ? period : '30d') as Period;
    const stats = await this.arAnalytics.getSessionStats(projectId, brandId, p);
    return {
      totalSessions: stats.total,
      avgDuration: stats.avgDuration,
      conversionSessions: stats.withConversion,
    };
  }

  @Get('platforms')
  @ApiOperation({ summary: 'Platform distribution' })
  async getPlatforms(
    @User() user: CurrentUser,
    @Query('projectId') projectId: string,
    @Query('period') period?: string,
  ) {
    const brandId = user.brandId ?? '';
    const p = (period === '7d' || period === '90d' ? period : '30d') as Period;
    return this.arAnalytics.getPlatformDistribution(projectId, brandId, p);
  }

  private parsePeriod(period: Period): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date(to);
    if (period === '7d') from.setDate(from.getDate() - 7);
    else if (period === '30d') from.setDate(from.getDate() - 30);
    else from.setDate(from.getDate() - 90);
    return { from, to };
  }
}
