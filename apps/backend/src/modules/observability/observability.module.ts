import { Module } from '@nestjs/common';
import { JobsModule } from '@/jobs/jobs.module';
import { QueueMetricsService } from './queue-metrics.service';
import { QueueHealthAlertService } from './queue-health-alert.service';
import { MetricsController } from './metrics.controller';
import { ObservabilityGateway } from './observability.gateway';
import { HttpMetricsService } from './http-metrics.service';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

@Module({
  imports: [JobsModule],
  providers: [
    QueueMetricsService,
    QueueHealthAlertService,
    ObservabilityGateway,
    HttpMetricsService,
    HttpMetricsInterceptor,
  ],
  controllers: [MetricsController],
  exports: [QueueMetricsService, QueueHealthAlertService, HttpMetricsService, HttpMetricsInterceptor],
})
export class ObservabilityModule {}

