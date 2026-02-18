import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { CurrentUser } from '@/common/types/user.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Configurator3DAnalyticsService } from '../services/configurator-3d-analytics.service';
import { ConfiguratorPermission } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorLoggingInterceptor } from '../interceptors';
import { CONFIGURATOR_3D_PERMISSIONS } from '../configurator-3d.constants';

@ApiTags('configurator-3d-analytics')
@ApiBearerAuth()
@Controller('configurator-3d/analytics')
@UseInterceptors(ConfiguratorLoggingInterceptor)
export class Configurator3DAnalyticsController {
  constructor(
    private readonly analyticsService: Configurator3DAnalyticsService,
  ) {}

  @Get('dashboard')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.ANALYTICS_READ)
  @ApiOperation({ summary: 'Get analytics dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(
    @Req() req: Request & { user: CurrentUser },
    @Query('days') days?: number,
  ) {
    const brandId = req.user.brandId ?? '';
    return this.analyticsService.getDashboard(brandId, days ?? 30);
  }

  @Get('sessions')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.ANALYTICS_READ)
  @ApiOperation({ summary: 'Get sessions list/stats' })
  @ApiResponse({ status: 200, description: 'Sessions data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(
    @Req() req: Request & { user: CurrentUser },
    @Query('configurationId') configurationId?: string,
    @Query('days') days?: number,
  ) {
    const brandId = req.user.brandId ?? '';
    return this.analyticsService.getSessions(
      brandId,
      configurationId,
      days ?? 30,
    );
  }

  @Get('options/:configurationId')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.ANALYTICS_READ)
  @ApiOperation({ summary: 'Get options heatmap' })
  @ApiResponse({ status: 200, description: 'Options heatmap data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOptionsHeatmap(
    @Param('configurationId') configurationId: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getOptionsHeatmap(
      configurationId,
      days ?? 30,
    );
  }

  @Get('funnel/:configurationId')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.ANALYTICS_READ)
  @ApiOperation({ summary: 'Get conversion funnel' })
  @ApiResponse({ status: 200, description: 'Funnel data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFunnel(
    @Param('configurationId') configurationId: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getFunnel(
      configurationId,
      days ?? 30,
    );
  }

  @Get('export')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.ANALYTICS_EXPORT)
  @ApiOperation({ summary: 'Export analytics as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportCSV(
    @Req() req: Request & { user: CurrentUser },
    @Res() res: Response,
    @Query('days') days?: number,
  ) {
    const brandId = req.user.brandId ?? '';
    const result = await this.analyticsService.exportCSV(brandId, days ?? 30);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.csv);
  }
}
