import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { KpiService } from './kpi/kpi.service';
import { OnboardingGuard } from '@/common/guards/onboarding.guard';
import { IndustryConfigGuard } from '@/common/guards/industry-config.guard';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService, KpiService, OnboardingGuard, IndustryConfigGuard],
  exports: [DashboardService, KpiService],
})
export class DashboardModule {}
