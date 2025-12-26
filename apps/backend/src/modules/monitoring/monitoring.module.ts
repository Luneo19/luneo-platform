import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MetricsService } from './services/metrics.service';
import { AlertsService } from './services/alerts.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, MetricsService, AlertsService],
  exports: [MonitoringService, MetricsService, AlertsService],
})
export class MonitoringModule {}

