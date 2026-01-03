import { Module } from '@nestjs/common';
import { PrometheusHelper } from './prometheus.helper';
import { OpenTelemetryHelper } from './opentelemetry.helper';

@Module({
  providers: [PrometheusHelper, OpenTelemetryHelper],
  exports: [PrometheusHelper, OpenTelemetryHelper],
})
export class IntegrationsModule {}




























