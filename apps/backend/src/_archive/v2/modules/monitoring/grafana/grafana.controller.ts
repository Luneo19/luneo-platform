/**
 * Grafana Controller
 * Provides endpoints for Grafana datasource integration.
 *
 * All endpoints require a valid Grafana API key via the X-Grafana-Api-Key header.
 * Configure GRAFANA_API_KEY in your environment variables.
 * If GRAFANA_API_KEY is not set, endpoints fall back to JWT auth.
 */

import { Controller, Get, Query, Res, UseGuards, CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { Response, Request } from 'express';
import { GrafanaDatasourceService } from './datasource.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

/**
 * Guard that validates X-Grafana-Api-Key header against GRAFANA_API_KEY env var.
 * If GRAFANA_API_KEY is not set, the guard passes (falls through to JwtAuthGuard).
 */
@Injectable()
class GrafanaApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(GrafanaApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedKey = this.configService.get<string>('GRAFANA_API_KEY');
    if (!expectedKey) {
      const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
      if (nodeEnv === 'production') {
        this.logger.error('GRAFANA_API_KEY is not configured in production — blocking access');
        throw new UnauthorizedException('Grafana API key not configured');
      }
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-grafana-api-key'] as string;

    if (
      !providedKey ||
      Buffer.byteLength(providedKey) !== Buffer.byteLength(expectedKey) ||
      !timingSafeEqual(Buffer.from(providedKey), Buffer.from(expectedKey))
    ) {
      this.logger.warn('Grafana API key validation failed');
      throw new UnauthorizedException('Invalid or missing Grafana API key');
    }

    return true;
  }
}

@Controller('monitoring/grafana')
@UseGuards(JwtAuthGuard)
export class GrafanaController {
  constructor(
    private readonly datasourceService: GrafanaDatasourceService,
  ) {}

  /**
   * Grafana datasource query endpoint
   * POST /api/monitoring/grafana/query
   * @Public: Protected by GrafanaApiKeyGuard via X-Grafana-Api-Key header
   */
  @Public()
  @UseGuards(GrafanaApiKeyGuard)
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
   * @Public: Protected by GrafanaApiKeyGuard via X-Grafana-Api-Key header
   */
  @Public()
  @UseGuards(GrafanaApiKeyGuard)
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
   * @Public: Protected by GrafanaApiKeyGuard via X-Grafana-Api-Key header
   */
  @Public()
  @UseGuards(GrafanaApiKeyGuard)
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
   * @Public: Protected by GrafanaApiKeyGuard via X-Grafana-Api-Key header
   */
  @Public()
  @UseGuards(GrafanaApiKeyGuard)
  @Get('annotations')
  async annotations(@Res() res: Response) {
    // Return empty annotations for now
    return res.json([]);
  }
}
