import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { AnalyticsCleanService } from '../services/analytics-clean.service';
import { TrackEventDto, TrackEventsBatchDto, EventType } from '../dto/track-event.dto';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { CurrentUser } from '@/common/types/user.types';

/**
 * Map frontend category string to backend EventType enum.
 */
function normalizeEventType(dto: TrackEventDto): EventType {
  if (dto.eventType) return dto.eventType;
  const cat = (dto.category || '').toLowerCase();
  if (cat === 'page_view' || cat === 'pageview') return EventType.PAGE_VIEW;
  if (cat === 'conversion') return EventType.CONVERSION;
  if (cat === 'session_start') return EventType.SESSION_START;
  if (cat === 'session_end') return EventType.SESSION_END;
  return EventType.USER_ACTION;
}

/**
 * Clean Analytics Controller - Minimaliste et performant
 * Focus sur l'essentiel : tracking, métriques, export
 */
@ApiTags('analytics')
@Controller('analytics-clean')
export class AnalyticsCleanController {
  constructor(private readonly analyticsService: AnalyticsCleanService) {}

  @Post('events')
  @Public() // Public: Accept anonymous tracking events (login page, etc.)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track analytics events (single or batch)' })
  @ApiResponse({ status: 201, description: 'Event(s) tracked successfully' })
  async trackEvent(
    @Request() req: Express.Request & { user?: CurrentUser },
    @Body() body: any,
  ) {
    const brandId = (req as any).user?.brandId || 'anonymous';
    const userId = (req as any).user?.id || 'anonymous';

    // Support both formats:
    // 1. { events: [...] } - batch from frontend AnalyticsService.flush()
    // 2. { eventType, ... } - single event
    const events: TrackEventDto[] = Array.isArray(body?.events)
      ? body.events
      : [body];

    for (const event of events) {
      const normalized: TrackEventDto = {
        eventType: normalizeEventType(event),
        sessionId: event.sessionId,
        properties: {
          ...(event.properties || {}),
          ...(event.metadata || {}),
          ...(event.action ? { action: event.action } : {}),
          ...(event.label ? { label: event.label } : {}),
          ...(event.page ? { page: event.page } : {}),
          ...(event.referrer ? { referrer: event.referrer } : {}),
          ...(event.value !== undefined ? { value: event.value } : {}),
        },
      };
      await this.analyticsService.trackEvent(brandId, userId, normalized);
    }

    return { success: true, message: `${events.length} event(s) tracked` };
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
