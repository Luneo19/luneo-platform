/**
 * Performance Monitoring Controller
 * Exposes performance metrics endpoints
 */

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';

@ApiTags('Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitoring/performance')
export class PerformanceController {
  constructor(
    private readonly performanceMonitoringService: PerformanceMonitoringService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get performance summary',
    description: 'Returns aggregated performance metrics (API latency, database queries, system metrics)',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance summary retrieved successfully',
  })
  async getSummary() {
    return {
      success: true,
      data: this.performanceMonitoringService.getPerformanceSummary(),
    };
  }

  @Get('slow-endpoints')
  @ApiOperation({
    summary: 'Get slow API endpoints',
    description: 'Returns list of slow API endpoints (>1s)',
  })
  @ApiResponse({
    status: 200,
    description: 'Slow endpoints retrieved successfully',
  })
  async getSlowEndpoints() {
    return {
      success: true,
      data: this.performanceMonitoringService.getSlowEndpoints(),
    };
  }

  @Get('slow-queries')
  @ApiOperation({
    summary: 'Get slow database queries',
    description: 'Returns list of slow database queries (>500ms)',
  })
  @ApiResponse({
    status: 200,
    description: 'Slow queries retrieved successfully',
  })
  async getSlowQueries() {
    return {
      success: true,
      data: this.performanceMonitoringService.getSlowQueries(),
    };
  }
}
