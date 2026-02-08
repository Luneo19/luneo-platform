import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService, EnrichedHealthResponse } from './health.service';

/**
 * Railway Health Controller
 *
 * Provides enriched health at /health/railway for Railway/load balancers.
 * Uses HealthService for dependency checks (database, redis, stripe, email).
 */
@ApiTags('Health')
@Controller('health/railway')
export class RailwayHealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  /** @Public: Railway/load balancer health check */
  @Public()
  @ApiOperation({
    summary: 'Health check endpoint for Railway',
    description: 'Enriched health with dependencies. Used by Railway for health checks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number' },
        service: { type: 'string', example: 'luneo-backend' },
        version: { type: 'string', example: '1.0.0' },
        dependencies: { type: 'object' },
      },
    },
  })
  async check(): Promise<EnrichedHealthResponse> {
    return this.healthService.getEnrichedHealth();
  }
}

