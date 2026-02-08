/**
 * Web Vitals Controller
 * Handles Core Web Vitals metrics collection and retrieval
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WebVitalsService } from '../services/web-vitals.service';
import { CreateWebVitalDto, GetWebVitalsDto } from '../dto/web-vitals.dto';

@ApiTags('Analytics')
@Controller('analytics/web-vitals')
export class WebVitalsController {
  constructor(private readonly webVitalsService: WebVitalsService) {}

  @Post()
  @Public() // Public: Browser metrics collection endpoint
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record Web Vital metric',
    description: 'Records a Core Web Vital metric (LCP, FID, CLS, FCP, TTFB, INP)',
  })
  @ApiResponse({
    status: 201,
    description: 'Web Vital recorded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid metric data',
  })
  async recordWebVital(@Body() dto: CreateWebVitalDto, @Request() req: any) {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.session?.id;
    
    return this.webVitalsService.recordWebVital({
      ...dto,
      userId,
      sessionId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Web Vitals metrics',
    description: 'Retrieves Web Vitals metrics with optional filters',
  })
  @ApiQuery({
    name: 'metric',
    required: false,
    enum: ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'],
    description: 'Filter by metric name',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Filter by page path',
  })
  @ApiResponse({
    status: 200,
    description: 'Web Vitals retrieved successfully',
  })
  async getWebVitals(@Query() query: GetWebVitalsDto, @Request() req: any) {
    const userId = req.user?.id;
    const brandId = req.user?.brandId;

    return this.webVitalsService.getWebVitals({
      ...query,
      userId,
      brandId,
    });
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Web Vitals summary',
    description: 'Gets aggregated Web Vitals summary with averages and percentiles',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Web Vitals summary retrieved successfully',
  })
  async getWebVitalsSummary(@Query() query: GetWebVitalsDto, @Request() req: any) {
    const userId = req.user?.id;
    const brandId = req.user?.brandId;

    return this.webVitalsService.getWebVitalsSummary({
      ...query,
      userId,
      brandId,
    });
  }
}
