import { Module, Global } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { BusinessMetricsService } from './business-metrics.service';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  providers: [
    PrometheusService,
    BusinessMetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [PrometheusService, BusinessMetricsService],
})
export class MetricsModule {}

































