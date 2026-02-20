import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CustomizerAnalyticsService } from '../services/customizer-analytics.service';
import { IsDateString } from 'class-validator';

class _DateRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

@ApiTags('Visual Customizer - Analytics')
@Controller('visual-customizer/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomizerAnalyticsController {
  constructor(
    private readonly analyticsService: CustomizerAnalyticsService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get overview analytics',
    description: 'Retrieves high-level analytics overview for a customizer',
  })
  @ApiQuery({
    name: 'customizerId',
    description: 'Customizer UUID',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'from',
    description: 'Start date (ISO string)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'to',
    description: 'End date (ISO string)',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overview analytics retrieved successfully',
  })
  async getOverview(
    @Query('customizerId') customizerId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.analyticsService.getOverview(customizerId, {
      from: from ? new Date(from) : thirtyDaysAgo,
      to: to ? new Date(to) : now,
    });
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Get sessions analytics',
    description: 'Retrieves detailed session analytics including daily breakdown',
  })
  @ApiQuery({
    name: 'customizerId',
    description: 'Customizer UUID',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'from',
    description: 'Start date (ISO string)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'to',
    description: 'End date (ISO string)',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sessions analytics retrieved successfully',
  })
  async getSessionsAnalytics(
    @Query('customizerId') customizerId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.analyticsService.getSessionsAnalytics(customizerId, {
      from: from ? new Date(from) : thirtyDaysAgo,
      to: to ? new Date(to) : now,
    });
  }

  @Get('tools')
  @ApiOperation({
    summary: 'Get tool usage analytics',
    description: 'Retrieves analytics about which tools are used most frequently',
  })
  @ApiQuery({
    name: 'customizerId',
    description: 'Customizer UUID',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'from',
    description: 'Start date (ISO string)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'to',
    description: 'End date (ISO string)',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tool usage analytics retrieved successfully',
  })
  async getToolUsage(
    @Query('customizerId') customizerId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.analyticsService.getToolUsage(customizerId, {
      from: from ? new Date(from) : thirtyDaysAgo,
      to: to ? new Date(to) : now,
    });
  }

  @Get('conversions')
  @ApiOperation({
    summary: 'Get conversion funnel',
    description: 'Retrieves conversion funnel analytics (sessions -> saves -> carts -> purchases)',
  })
  @ApiQuery({
    name: 'customizerId',
    description: 'Customizer UUID',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'from',
    description: 'Start date (ISO string)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'to',
    description: 'End date (ISO string)',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversion funnel analytics retrieved successfully',
  })
  async getConversionFunnel(
    @Query('customizerId') customizerId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.analyticsService.getConversionFunnel(customizerId, {
      from: from ? new Date(from) : thirtyDaysAgo,
      to: to ? new Date(to) : now,
    });
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export analytics data',
    description: 'Exports analytics data as CSV or JSON',
  })
  @ApiQuery({
    name: 'customizerId',
    description: 'Customizer UUID',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'from',
    description: 'Start date (ISO string)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'to',
    description: 'End date (ISO string)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'format',
    description: 'Export format (csv or json)',
    required: false,
    enum: ['csv', 'json'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics data exported successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
      'application/json': {
        schema: {
          type: 'object',
        },
      },
    },
  })
  async exportAnalytics(
    @Query('customizerId') customizerId: string,
    @Query('format') format: 'csv' | 'json' = 'json',
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const data = await this.analyticsService.exportAnalytics(
      customizerId,
      {
        from: from ? new Date(from) : thirtyDaysAgo,
        to: to ? new Date(to) : now,
      },
      format,
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="analytics-${customizerId}-${Date.now()}.csv"`,
      );
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    }
  }
}
