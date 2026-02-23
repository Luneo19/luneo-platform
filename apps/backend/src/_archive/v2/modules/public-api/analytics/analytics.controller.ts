import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { GetAnalyticsDto } from '../dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandId } from '../decorators/brand-id.decorator';

@ApiTags('Analytics')
@Controller('public-api/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved successfully' })
  async getAnalytics(
    @BrandId() brandId: string,
    @Query() query: GetAnalyticsDto,
  ) {
    return this.analyticsService.getAnalytics(brandId, query);
  }
}
