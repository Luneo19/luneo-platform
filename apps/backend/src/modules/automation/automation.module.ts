import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

@Module({
  imports: [PrismaOptimizedModule, OrchestratorModule],
  controllers: [AutomationController],
  providers: [AutomationService],
})
export class AutomationModule {}
