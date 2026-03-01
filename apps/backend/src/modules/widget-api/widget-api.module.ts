import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { QuotasModule } from '@/modules/quotas/quotas.module';
import { WidgetApiController } from './widget-api.controller';
import { WidgetApiService } from './widget-api.service';

@Module({
  imports: [ConfigModule, PrismaOptimizedModule, OrchestratorModule, QuotasModule],
  controllers: [WidgetApiController],
  providers: [WidgetApiService],
  exports: [WidgetApiService],
})
export class WidgetApiModule {}
