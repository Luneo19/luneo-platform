import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { QueueMetricsService } from './queue-metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly queueMetricsService: QueueMetricsService) {}

  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', this.queueMetricsService.getContentType());
    res.send(await this.queueMetricsService.getMetrics());
  }
}

