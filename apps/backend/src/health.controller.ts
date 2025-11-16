import { Controller, Get } from '@nestjs/common';
import { QueueHealthService } from './jobs/services/queue-health.service';

@Controller()
export class HealthController {
  constructor(private readonly queueHealthService: QueueHealthService) {}

  @Get('health')
  async check() {
    const queues = await this.queueHealthService.getOverview();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      queues,
    };
  }

  @Get('health/debug-sentry')
  getError() {
    throw new Error("My first Sentry error!");
  }
}









