import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';

@Module({
  imports: [PrismaOptimizedModule, OrchestratorModule],
  controllers: [ActionsController],
  providers: [ActionsService],
})
export class ActionsModule {}
