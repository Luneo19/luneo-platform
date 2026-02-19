import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { PCE_QUEUES } from '../pce.constants';
import { PrismaModule } from '@/libs/prisma/prisma.module';

import { ManufacturingOrchestratorService } from './services/manufacturing-orchestrator.service';
import { ProviderManagerService } from './services/provider-manager.service';
import { CostCalculatorService } from './services/cost-calculator.service';
import { QualityControlService } from './services/quality-control.service';
import { ManufacturingController } from './controllers/manufacturing.controller';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 30_000,
      maxRedirects: 3,
    }),
    BullModule.registerQueue({ name: PCE_QUEUES.PRODUCTION }),
  ],
  controllers: [ManufacturingController],
  providers: [
    ManufacturingOrchestratorService,
    ProviderManagerService,
    CostCalculatorService,
    QualityControlService,
  ],
  exports: [
    ManufacturingOrchestratorService,
    ProviderManagerService,
    CostCalculatorService,
    QualityControlService,
  ],
})
export class ManufacturingModule {}
