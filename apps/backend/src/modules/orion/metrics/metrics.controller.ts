// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/compat/v1-enums';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrionMetricsService } from './metrics.service';

@ApiTags('orion-metrics')
@Controller('orion/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
@ApiBearerAuth()
export class OrionMetricsController {
  constructor(private readonly metricsService: OrionMetricsService) {}

  // =========================================
  // Aggregated KPIs
  // =========================================

  @Get('kpis')
  @ApiOperation({ summary: 'Get all KPIs (CAC, NPS, Trial Conversion)' })
  async getAllKPIs() {
    const kpis = await this.metricsService.getAllKPIs();
    return { success: true, data: kpis };
  }

  // =========================================
  // CAC
  // =========================================

  @Get('cac')
  @ApiOperation({ summary: 'Calculate Customer Acquisition Cost' })
  async getCAC(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const now = new Date();
    const startDate = startDateStr ? new Date(startDateStr) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = endDateStr ? new Date(endDateStr) : now;
    const result = await this.metricsService.calculateCAC(startDate, endDate);
    return { success: true, data: result };
  }

  @Post('marketing-spend')
  @ApiOperation({ summary: 'Record marketing spend' })
  async recordMarketingSpend(
    @Body() body: { date: string; channel: string; amount: number; currency?: string; notes?: string },
    @CurrentUser() user: { id: string },
  ) {
    if (!body.date || !body.channel || body.amount === undefined) {
      throw new BadRequestException('date, channel and amount are required');
    }
    if (body.amount < 0) {
      throw new BadRequestException('amount must be non-negative');
    }
    const result = await this.metricsService.recordMarketingSpend({
      date: new Date(body.date),
      channel: body.channel,
      amount: body.amount,
      currency: body.currency,
      notes: body.notes,
      createdBy: user.id,
    });
    return { success: true, data: result };
  }

  @Get('marketing-spend')
  @ApiOperation({ summary: 'List marketing spends' })
  async listMarketingSpends(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('channel') channel?: string,
    @Query('limit') limitStr?: string,
  ) {
    const result = await this.metricsService.listMarketingSpends({
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      channel,
      limit: limitStr ? parseInt(limitStr, 10) : undefined,
    });
    return { success: true, data: result };
  }

  // =========================================
  // NPS
  // =========================================

  @Get('nps')
  @ApiOperation({ summary: 'Calculate Net Promoter Score' })
  async getNPS(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const result = await this.metricsService.calculateNPS(
      startDateStr ? new Date(startDateStr) : undefined,
      endDateStr ? new Date(endDateStr) : undefined,
    );
    return { success: true, data: result };
  }

  @Post('nps')
  @ApiOperation({ summary: 'Submit NPS response (accessible by any authenticated user)' })
  async submitNPS(
    @Body() body: { score: number; comment?: string },
    @CurrentUser() user: { id: string },
  ) {
    if (body.score === undefined || body.score < 0 || body.score > 10) {
      throw new BadRequestException('score must be between 0 and 10');
    }
    const result = await this.metricsService.recordNPSResponse({
      userId: user.id,
      score: body.score,
      comment: body.comment,
      source: 'in_app',
    });
    return { success: true, data: result };
  }

  // =========================================
  // Trial Conversion
  // =========================================

  @Get('trial-conversion')
  @ApiOperation({ summary: 'Calculate trial to paid conversion rate' })
  async getTrialConversion(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const result = await this.metricsService.calculateTrialConversion(
      startDateStr ? new Date(startDateStr) : undefined,
      endDateStr ? new Date(endDateStr) : undefined,
    );
    return { success: true, data: result };
  }
}
