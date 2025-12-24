import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MetricsModule } from '@/libs/metrics/metrics.module';

@Module({
  imports: [TerminusModule, MetricsModule],
  controllers: [HealthController],
  exports: [],
})
export class HealthModule {}
