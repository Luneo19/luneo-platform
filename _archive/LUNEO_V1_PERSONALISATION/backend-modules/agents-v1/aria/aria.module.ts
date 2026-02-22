import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AriaController } from './aria.controller';
import { AriaService } from './aria.service';
import { AriaAnalysisService } from './services/aria-analysis.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AgentsModule } from '../agents.module';
import { UsageGuardianModule } from '../usage-guardian/usage-guardian.module';
import { AIMonitorModule } from '../ai-monitor/ai-monitor.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    forwardRef(() => AgentsModule),
    UsageGuardianModule,
    AIMonitorModule,
    HttpModule,
  ],
  controllers: [AriaController],
  providers: [AriaService, AriaAnalysisService],
  exports: [AriaService, AriaAnalysisService],
})
export class AriaModule {}
