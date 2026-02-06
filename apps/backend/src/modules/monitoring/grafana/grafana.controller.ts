/**
 * Grafana Controller
 * Provides endpoints for Grafana datasource integration
 */

import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GrafanaDatasourceService } from './datasource.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('api/monitoring/grafana')
@UseGuards(JwtAuthGuard)
export class GrafanaController {
  constructor(
    private readonly datasourceService: GrafanaDatasourceService,
  ) {}

  /**
   * Grafana datasource query endpoint
   * POST /api/monitoring/grafana/query
   */
  @Public() // Should be protected with Grafana API key in production
  @Get('query')
  async query(
    @Query('target') target: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    try {
      const startTime = new Date(parseInt(from) * 1000);
      const endTime = new Date(parseInt(to) * 1000);

      const data = await this.datasourceService.getTimeSeriesMetrics(
        startTime,
        endTime,
        target,
      );

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to query metrics',
        message: error.message,
      });
    }
  }

  /**
   * Grafana search endpoint
   * GET /api/monitoring/grafana/search
   */
  @Public()
  @Get('search')
  async search(@Res() res: Response) {
    const metrics = [
      'requests_per_second',
      'response_time',
      'error_rate',
      'active_users',
      'database_queries',
      'cache_hit_rate',
    ];

    return res.json(metrics);
  }

  /**
   * Grafana table query endpoint
   * GET /api/monitoring/grafana/table
   */
  @Public()
  @Get('table')
  async table(@Res() res: Response) {
    try {
      const data = await this.datasourceService.getTableMetrics();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to get table metrics',
        message: error.message,
      });
    }
  }

  /**
   * Grafana annotations endpoint
   * GET /api/monitoring/grafana/annotations
   */
  @Public()
  @Get('annotations')
  async annotations(@Res() res: Response) {
    // Return empty annotations for now
    return res.json([]);
  }
}
