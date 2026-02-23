import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PerformanceService } from './performance.service';

@ApiTags('Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('performance/stats')
  @ApiOperation({
    summary: 'Get performance statistics',
    description: 'Get performance statistics for endpoints',
  })
  @ApiQuery({ name: 'endpoint', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Performance statistics retrieved successfully' })
  async getPerformanceStats(
    @Query('endpoint') endpoint?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.performanceService.getStats(
      endpoint,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('performance/slow')
  @ApiOperation({
    summary: 'Get slow endpoints',
    description: 'Get endpoints that exceed performance threshold',
  })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: 'Threshold in milliseconds (default: 1000)' })
  @ApiResponse({ status: 200, description: 'Slow endpoints retrieved successfully' })
  async getSlowEndpoints(@Query('threshold') threshold?: number) {
    return this.performanceService.getSlowEndpoints(threshold ? Number(threshold) : 1000);
  }
}
