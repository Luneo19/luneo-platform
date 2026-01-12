/**
 * Monitoring Module
 * Performance monitoring, health checks, and metrics
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { PerformanceMonitoringService } from './services/performance-monitoring.service';
import { PerformanceController } from './controllers/performance.controller';
import { GrafanaModule } from './grafana/grafana.module';

@Module({
  imports: [PrismaModule, RedisOptimizedModule, GrafanaModule],
  controllers: [PerformanceController],
  providers: [PerformanceMonitoringService],
  exports: [PerformanceMonitoringService],
})
export class MonitoringModule {}
