import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { CostTrackerService } from './cost-tracker.service';
import { CostEstimatorService } from './cost-estimator.service';
import { BudgetGuardService } from './budget-guard.service';

const services = [CostTrackerService, CostEstimatorService, BudgetGuardService];

@Module({
  imports: [PrismaModule],
  providers: services,
  exports: services,
})
export class CostManagementModule {}
