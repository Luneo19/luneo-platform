import { Public } from '@/common/decorators/public.decorator';
import { PrometheusService } from '@/libs/metrics/prometheus.service';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@ApiTags('Health')
@Controller() // Empty controller path to allow /health without prefix
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prometheus: PrometheusService,
  ) {}

  @Get('health')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    return this.health.check([]);
  }

  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  async getMetrics() {
    const metrics = await this.prometheus.getMetrics();
    return metrics;
  }
}
