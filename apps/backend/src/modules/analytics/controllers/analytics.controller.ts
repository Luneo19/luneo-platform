import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  async getDashboard(@Query('period') period: string = 'last_30_days') {
    return this.analyticsService.getDashboard(period);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage analytics' })
  @ApiResponse({ status: 200, description: 'Usage analytics retrieved successfully' })
  async getUsage(@Query('brandId') brandId: string) {
    return this.analyticsService.getUsage(brandId);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenue(@Query('period') period: string = 'last_30_days') {
    return this.analyticsService.getRevenue(period);
  }

  @Post('web-vitals')
  @ApiOperation({ summary: 'Record a web vital metric' })
  @ApiResponse({ status: 201, description: 'Web vital recorded successfully' })
  async recordWebVital(@Body() body: any, @Request() req) {
    return this.analyticsService.recordWebVital(req.user.id, req.user.brandId || null, body);
  }

  @Get('web-vitals')
  @ApiOperation({ summary: 'Get web vitals metrics' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by metric name' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({ status: 200, description: 'Web vitals retrieved successfully' })
  async getWebVitals(
    @Query('name') name?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any,
  ) {
    return this.analyticsService.getWebVitals(req.user.id, { name, startDate, endDate });
  }
}


