import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { WidgetApiController } from './widget-api.controller';
import { WidgetApiService } from './widget-api.service';

@Module({
  imports: [PrismaOptimizedModule, OrchestratorModule],
  controllers: [WidgetApiController],
  providers: [WidgetApiService],
  exports: [WidgetApiService],
})
export class WidgetApiModule {}
