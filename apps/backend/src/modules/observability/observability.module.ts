import { Module } from '@nestjs/common';
import { ObservabilityController } from './observability.controller';
import { SLOService } from './services/slo-sli.service';
import { TracingService } from './services/tracing.service';
import { CostDashboardService } from './services/cost-dashboard.service';
import { DRService } from './services/dr.service';
import { ObservabilityScheduler } from './schedulers/observability.scheduler';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { IntegrationsModule } from '@/libs/integrations/integrations.module';

@Module({
  imports: [PrismaModule, ScheduleModule, IntegrationsModule],
  controllers: [ObservabilityController],
  providers: [SLOService, TracingService, CostDashboardService, DRService, ObservabilityScheduler],
  exports: [SLOService, TracingService, CostDashboardService, DRService],
})
export class ObservabilityModule {}





















